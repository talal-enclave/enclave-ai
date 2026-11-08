"""Government-record-only reset for Enclave v1.5.9.

The script runs inside the API container, discovers the live SQLAlchemy schema,
preserves government records/configuration/audit data, and clears operational
rows in one verified transaction.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import shutil
import tempfile
from datetime import date, datetime
from pathlib import Path, PurePosixPath
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql.schema import Table

# Importing the application registers every model in Base.metadata.
import app.main as _application  # noqa: F401
from app.database import Base, engine


CONFIRMATION = "RESET_V159_GOVERNMENT_ONLY"
ATTACHMENTS_DIR = Path(
    os.environ.get("HR_ATTACHMENTS_DIR", "/var/lib/talal-enclave/hr-attachments")
).resolve()

REQUIRED_TABLES = {
    "agents",
    "audit_logs",
    "hr_attachments",
    "hr_corporate_compliance_records",
    "hr_employee_government_documents",
    "hr_compliance_renewal_history",
}

# Configuration/reference data required for a usable fresh platform.
CONFIG_TABLES = {
    "agents",
    "company_profiles",
    "hr_policies",
    "hr_policy_versions",
    "hr_policy_conflicts",
    "hr_compliance_checklists",
    "hr_compliance_checklist_items",
    "policy_impact_assessments",
    "policy_impact_items",
    "policy_enforcement_rules",
    "policy_system_mismatches",
    "policy_technical_verifications",
    "policy_change_decisions",
    "alembic_version",
}

GOVERNMENT_TABLES = {
    "hr_corporate_compliance_records",
    "hr_employee_government_documents",
    "hr_compliance_renewal_history",
}

GOVERNMENT_ATTACHMENT_TOKENS = {
    "government",
    "compliance",
    "corporate_compliance_record",
    "employee_government_document",
    "corporate_compliance_document",
    "government_certificate",
    "government_document",
    "corporate_record",
    "commercial_registration",
    "articles_of_association",
    "amended_articles",
    "national_address",
    "civil_defense",
    "balady",
    "zatca",
    "chamber",
    "gosi",
    "qiwa",
    "mudad",
    "nca",
    "etimad",
    "monshaat",
    "iqama",
    "national_id",
    "passport",
    "work_permit",
}


def _json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, bytes):
        return value.hex()
    if isinstance(value, (list, tuple)):
        return [_json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    try:
        json.dumps(value)
    except TypeError:
        return str(value)
    return value


def _row_key(row: dict[str, Any], table: Table) -> tuple[Any, ...]:
    return tuple(row[column.name] for column in table.primary_key.columns)


def _canonical_hash(rows: list[dict[str, Any]], table: Table) -> str:
    ordered = sorted(
        rows,
        key=lambda row: json.dumps(
            [_json_value(row[column.name]) for column in table.primary_key.columns],
            sort_keys=True,
            ensure_ascii=False,
        ),
    )
    payload = [
        {column.name: _json_value(row[column.name]) for column in table.columns}
        for row in ordered
    ]
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _safe_storage_key(value: Any) -> str | None:
    if value is None:
        return None
    raw = str(value).replace("\\", "/")
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts:
        raise RuntimeError(f"Unsafe attachment storage_key: {raw}")
    return "/".join(path.parts)


def _is_government_attachment(row: dict[str, Any]) -> bool:
    module = str(row.get("module") or "").strip().lower()
    entity_type = str(row.get("entity_type") or "").strip().lower()
    document_type = str(row.get("document_type") or "").strip().lower()
    values = {module, entity_type, document_type}
    if values & GOVERNMENT_ATTACHMENT_TOKENS:
        return True
    if module in {"admin", "legal", "hr", "compliance"} and (
        "company" in entity_type
        or "corporate" in entity_type
        or "government" in entity_type
        or "compliance" in entity_type
    ):
        return True
    return any(
        token in value
        for value in values
        for token in GOVERNMENT_ATTACHMENT_TOKENS
    )


async def _all_rows(conn, table: Table) -> list[dict[str, Any]]:
    result = await conn.execute(select(table))
    return [dict(row._mapping) for row in result]


async def _count(conn, table: Table) -> int:
    return int(await conn.scalar(select(func.count()).select_from(table)) or 0)


def _delete_statement(table: Table, keep_keys: set[tuple[Any, ...]]):
    columns = list(table.primary_key.columns)
    if not columns:
        return delete(table) if not keep_keys else None
    if not keep_keys:
        return delete(table)
    values = list(keep_keys)
    if len(columns) == 1:
        return delete(table).where(~columns[0].in_([value[0] for value in values]))
    from sqlalchemy import tuple_
    return delete(table).where(~tuple_(*columns).in_(values))


async def _main() -> None:
    if os.environ.get("ENCLAVE_RESET_CONFIRM") != CONFIRMATION:
        raise SystemExit(
            "STOP: missing ENCLAVE_RESET_CONFIRM; this reset is destructive."
        )

    tables = {table.name: table for table in Base.metadata.tables.values()}

    quarantine: Path | None = None
    moved_files: list[tuple[Path, Path]] = []
    summary: dict[str, Any] = {}

    try:
        async with engine.begin() as conn:
            # Include live public tables that may have been created by a
            # migration/raw SQL path but are not imported by the current
            # model module. This prevents stale operational data surviving
            # the reset.
            live_names = await conn.run_sync(
                lambda sync_conn: set(
                    inspect(sync_conn).get_table_names(schema="public")
                )
            )
            for name in sorted(live_names - tables.keys()):
                tables[name] = await conn.run_sync(
                    lambda sync_conn, table_name=name: Table(
                        table_name,
                        Base.metadata,
                        schema="public",
                        autoload_with=sync_conn,
                    )
                )
            missing = sorted(REQUIRED_TABLES - tables.keys())
            if missing:
                raise SystemExit(
                    f"STOP: required government tables are missing: {missing}"
                )
            attachment_table = tables["hr_attachments"]
            compliance_table = tables["hr_corporate_compliance_records"]
            employee_doc_table = tables["hr_employee_government_documents"]
            initial_keep_all = (CONFIG_TABLES | GOVERNMENT_TABLES) & tables.keys()

            rows_by_name: dict[str, list[dict[str, Any]]] = {}
            keep_keys: dict[str, set[tuple[Any, ...]]] = {}
            keep_all: set[str] = set()

            for name, table in tables.items():
                if name in initial_keep_all or name == attachment_table.name:
                    rows_by_name[name] = await _all_rows(conn, table)

            for name in initial_keep_all:
                table = tables[name]
                rows = rows_by_name.get(name, [])
                if not table.primary_key.columns:
                    keep_all.add(name)
                else:
                    keep_keys[name] = {_row_key(row, table) for row in rows}

            compliance_ids = {
                str(row["id"])
                for row in rows_by_name[compliance_table.name]
                if "id" in row
            }
            employee_document_ids = {
                str(row["id"])
                for row in rows_by_name[employee_doc_table.name]
                if "id" in row
            }
            government_employee_ids = {
                str(row["employee_id"])
                for row in rows_by_name[employee_doc_table.name]
                if row.get("employee_id") is not None
            }

            kept_attachment_rows: list[dict[str, Any]] = []
            for row in rows_by_name[attachment_table.name]:
                entity_id = (
                    str(row.get("entity_id"))
                    if row.get("entity_id") is not None
                    else None
                )
                employee_id = (
                    str(row.get("employee_id"))
                    if row.get("employee_id") is not None
                    else None
                )
                entity_type = str(row.get("entity_type") or "").lower()
                document_type = str(row.get("document_type") or "").lower()
                keep = (
                    _is_government_attachment(row)
                    or entity_id in compliance_ids
                    or entity_id in employee_document_ids
                    or (
                        employee_id in government_employee_ids
                        and "government" in document_type
                    )
                    or entity_type
                    in {
                        "corporate_compliance_record",
                        "employee_government_document",
                    }
                )
                if keep:
                    kept_attachment_rows.append(row)

            if attachment_table.primary_key.columns:
                keep_keys[attachment_table.name] = {
                    _row_key(row, attachment_table) for row in kept_attachment_rows
                }

            # FK closure retains the minimum parent rows required by preserved
            # government/configuration rows (for example linked employees).
            changed = True
            while changed:
                changed = False
                for child_name, child_table in tables.items():
                    child_rows = rows_by_name.get(child_name)
                    if child_rows is None and child_name in keep_keys:
                        child_rows = await _all_rows(conn, child_table)
                        rows_by_name[child_name] = child_rows
                    if child_rows is None:
                        continue
                    if child_name in keep_all:
                        kept_rows = child_rows
                    else:
                        wanted = keep_keys.get(child_name, set())
                        if not wanted:
                            continue
                        kept_rows = [
                            row
                            for row in child_rows
                            if _row_key(row, child_table) in wanted
                        ]

                    for constraint in child_table.foreign_key_constraints:
                        elements = list(constraint.elements)
                        parent_table = elements[0].column.table
                        if parent_table.name not in tables:
                            continue
                        parent_pk_names = [
                            column.name
                            for column in parent_table.primary_key.columns
                        ]
                        remote_names = [element.column.name for element in elements]
                        local_names = [element.parent.name for element in elements]
                        if (
                            not parent_pk_names
                            or set(remote_names) != set(parent_pk_names)
                        ):
                            continue
                        parent_keep = keep_keys.setdefault(parent_table.name, set())
                        for row in kept_rows:
                            if any(row.get(name) is None for name in local_names):
                                continue
                            by_remote = {
                                remote_name: row[local_name]
                                for local_name, remote_name in zip(
                                    local_names, remote_names
                                )
                            }
                            key = tuple(by_remote[name] for name in parent_pk_names)
                            if key not in parent_keep:
                                parent_keep.add(key)
                                changed = True

            protected_before: dict[str, dict[str, Any]] = {}
            for name in GOVERNMENT_TABLES | {"hr_attachments"}:
                table = tables[name]
                rows = rows_by_name.get(name) or await _all_rows(conn, table)
                if name == "hr_attachments":
                    rows = [
                        row
                        for row in rows
                        if _row_key(row, table) in keep_keys.get(name, set())
                    ]
                protected_before[name] = {
                    "count": len(rows),
                    "sha256": _canonical_hash(rows, table),
                }

            # Quarantine non-preserved files before any database mutation. If
            # verification fails, the files are restored automatically.
            if ATTACHMENTS_DIR.exists():
                retained_storage = {
                    _safe_storage_key(row.get("storage_key"))
                    for row in kept_attachment_rows
                    if row.get("storage_key")
                }
                retained_storage.discard(None)
                quarantine = Path(tempfile.mkdtemp(prefix="enclave-v159-reset-"))
                for path in ATTACHMENTS_DIR.rglob("*"):
                    if not (path.is_file() or path.is_symlink()):
                        continue
                    relative = path.relative_to(ATTACHMENTS_DIR).as_posix()
                    if relative in retained_storage:
                        continue
                    destination = quarantine / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(path), str(destination))
                    moved_files.append((destination, path))

            # Delete in savepoint-backed passes, allowing a parent to be
            # retried after its children have been deleted.
            pending = set(tables)
            while pending:
                progress = False
                for name in list(pending):
                    if name in keep_all:
                        pending.remove(name)
                        progress = True
                        continue
                    statement = _delete_statement(
                        tables[name], keep_keys.get(name, set())
                    )
                    if statement is None:
                        pending.remove(name)
                        progress = True
                        continue
                    try:
                        async with conn.begin_nested():
                            await conn.execute(statement)
                        pending.remove(name)
                        progress = True
                    except IntegrityError:
                        continue
                if not progress:
                    raise RuntimeError(
                        "Unable to safely clear tables because of unresolved "
                        "foreign keys: " + ", ".join(sorted(pending))
                    )

            for name, before in protected_before.items():
                table = tables[name]
                rows = await _all_rows(conn, table)
                if name == "hr_attachments":
                    rows = [
                        row
                        for row in rows
                        if _row_key(row, table) in keep_keys.get(name, set())
                    ]
                after = {
                    "count": len(rows),
                    "sha256": _canonical_hash(rows, table),
                }
                if after != before:
                    raise RuntimeError(
                        f"Protected government data changed for {name}: "
                        f"{before} -> {after}"
                    )

            unexpected: dict[str, int] = {}
            for name, table in tables.items():
                count = await _count(conn, table)
                if name in keep_all:
                    continue
                expected = len(keep_keys.get(name, set()))
                if count != expected:
                    unexpected[name] = count
            if unexpected:
                raise RuntimeError(
                    "Reset verification found unexpected retained rows: "
                    + json.dumps(unexpected, sort_keys=True)
                )

            summary = {
                "protected_before_after": protected_before,
                "retained_tables_with_rows": {
                    name: len(keys)
                    for name, keys in keep_keys.items()
                    if keys
                },
                "configuration_tables_preserved": sorted(initial_keep_all),
                "attachments_dir": str(ATTACHMENTS_DIR),
                "quarantined_files": len(moved_files),
            }

        if quarantine is not None:
            shutil.rmtree(quarantine, ignore_errors=True)
    except Exception:
        for source, destination in reversed(moved_files):
            if source.exists() or source.is_symlink():
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(destination))
        if quarantine is not None:
            shutil.rmtree(quarantine, ignore_errors=True)
        raise

    async with engine.begin() as conn:
        summary["final_counts"] = {
            name: await _count(conn, table)
            for name, table in sorted(tables.items())
        }
    print(json.dumps(summary, sort_keys=True, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(_main())
