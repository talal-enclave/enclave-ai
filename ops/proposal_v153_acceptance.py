"""Seed the missing Shory v1.6 sections and regenerate only technical artifacts."""
from __future__ import annotations

import asyncio
import hashlib
import uuid
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from pypdf import PdfReader
from sqlalchemy import text

from app import main as m
from app.database import SessionLocal
from app.proposal_template import TEMPLATE_VERSION


TP_ID = uuid.UUID("8467020f-522d-4fbd-b19d-807557ef79e7")
CONVERSATION_ID = uuid.UUID("4c946256-d44c-4f65-a324-5fe0071d0938")

METHODOLOGY = """Human-led testing. External grey-box testing includes unauthenticated and authenticated coverage. Manual testing is supported by automated tools; reported findings require technical evidence, manual validation and human review. Controlled, non-destructive testing follows the agreed Rules of Engagement.
AI-assisted methodology support. Selected frontier AI models and Enclave Attack, Enclave's security-specialized LLM developed and fine-tuned in-house, support generic security research and methodology using synthetic examples only. No client data is supplied to any model.
Web/API testing follows applicable OWASP WSTG guidance, with OWASP Top 10 and API Security Top 10 risk coverage.
Data protection and PDPL. Client data, credentials, reports and assessment artifacts will not be provided to or processed by any AI model, including Enclave Attack, or used for training or fine-tuning. Personal data will be handled in accordance with Saudi Arabia's Personal Data Protection Law (PDPL) and applicable implementing regulations. Access is restricted; exchanges use agreed encrypted channels."""

ASSUMPTIONS = """Client prerequisites. Shory provides written authorization, VPN access, accounts for the agreed roles (operations staff and system administrators) for role and cross-user checks, API documentation where available, access details and a technical contact. Testing starts after readiness confirmation, uses controlled data and requires explicit approval for production activity.
Testing coordination. Enclave will share all public source IP addresses used for testing with Shory before each assessment window, for coordination with Shory's SOC.
Scope boundaries. The preliminary inventory (approximately 13 targets and 85 API endpoints) is validated at kickoff; pricing assumes up to 15 targets and 100 endpoints, and material expansion requires separate written agreement.
Normal baseline release changes are included; materially changed functionality requires scope confirmation.
Assessment limitations. Results reflect the tested version and environment. No minimum finding count or vulnerability-free outcome is guaranteed."""


async def run() -> None:
    assert TEMPLATE_VERSION == "1.5.3"
    async with SessionLocal() as db:
        before = (
            await db.execute(
                text(
                    """
                    SELECT id, version, status, title, scope_text,
                           methodology_text, deliverables_text,
                           assumptions_text, exclusions_text, timeline_text
                    FROM sales_technical_proposals
                    WHERE id=:id
                    """
                ),
                {"id": TP_ID},
            )
        ).mappings().one()

        assert before["version"] == 1
        assert before["status"] == "draft"
        assert before["title"] == "Shory Penetration Testing Technical Proposal"
        assert before["scope_text"]

        allowed_placeholders = {
            None,
            "To be confirmed for this engagement before issuance.",
        }
        if before["methodology_text"] not in allowed_placeholders:
            assert before["methodology_text"] == METHODOLOGY, (
                "Methodology already contains different user content; stopped safely."
            )
        if before["assumptions_text"] not in allowed_placeholders:
            assert before["assumptions_text"] == ASSUMPTIONS, (
                "Assumptions already contain different user content; stopped safely."
            )

        await db.execute(
            text(
                """
                UPDATE sales_technical_proposals
                SET methodology_text=:methodology,
                    assumptions_text=:assumptions,
                    updated_at=now()
                WHERE id=:id
                """
            ),
            {
                "id": TP_ID,
                "methodology": METHODOLOGY,
                "assumptions": ASSUMPTIONS,
            },
        )
        await db.commit()
        print("Shory V1 methodology and assumptions: SEEDED FROM V1.6")

        # Build both formats before any new attachment insert. This makes a
        # conversion or content failure leave the existing record untouched.
        proposal, reason = await m._ceo_exec_tp_resolve(
            db,
            "Shory",
            TP_ID,
        )
        assert proposal is not None, reason
        payload = {
            "client_name": proposal["client_name"],
            "title": proposal["title"],
            "reference": "TP-8467020F-V1",
            "scope_text": proposal["scope_text"],
            "methodology_text": proposal["methodology_text"],
            "deliverables_text": proposal["deliverables_text"],
            "assumptions_text": proposal["assumptions_text"],
            "exclusions_text": proposal["exclusions_text"],
            "timeline_text": proposal["timeline_text"],
            "created_at": proposal["created_at"],
            "version": proposal["version"],
        }
        from app.technical_artifact_engine import (
            generate_technical_proposal_docx,
            generate_technical_proposal_pdf,
        )

        preview_docx = generate_technical_proposal_docx(payload)
        preview_pdf = generate_technical_proposal_pdf(payload)
        assert preview_docx.startswith(b"PK")
        assert preview_pdf.startswith(b"%PDF")
        with ZipFile(BytesIO(preview_docx)) as archive:
            preview_xml = archive.read("word/document.xml").decode("utf-8")
            assert "Human-led testing" in preview_xml
            assert "Client prerequisites" in preview_xml
        preview_text = "\n".join(
            page.extract_text() or ""
            for page in PdfReader(BytesIO(preview_pdf)).pages
        )
        assert "Human-led testing" in preview_text
        assert "Client prerequisites" in preview_text
        print("Technical DOCX/PDF preflight before attachment insert: PASSED")

        generated = await m._ceo_exec_tp_generate_artifacts(
            db,
            "Shory",
            CONVERSATION_ID,
            proposal_id=TP_ID,
        )
        assert generated["status"] == "executed"
        assert generated["external_send"] is False
        assert generated["record"]["version"] == 1
        assert len(generated["artifacts"]) == 2

        new_ids = []
        for artifact in generated["artifacts"]:
            for item in (artifact["sales_attachment"], artifact["conversation_attachment"]):
                if item:
                    new_ids.append(uuid.UUID(item["id"]))

        assert len(new_ids) == 4
        for attachment_id in new_ids:
            row = (
                await db.execute(
                    text(
                        """
                        SELECT original_file_name, storage_key, sha256,
                               file_extension, status
                        FROM hr_attachments
                        WHERE id=:id
                        """
                    ),
                    {"id": attachment_id},
                )
            ).mappings().one()
            assert row["status"] == "active"
            assert row["original_file_name"].endswith("_T153.docx") or row[
                "original_file_name"
            ].endswith("_T153.pdf")
            path = m._hr_attachment_storage_path(row["storage_key"])
            data = path.read_bytes()
            assert hashlib.sha256(data).hexdigest() == row["sha256"]
            if row["file_extension"] == ".pdf":
                reader = PdfReader(BytesIO(data))
                text_content = "\n".join(page.extract_text() or "" for page in reader.pages)
                assert "Human-led testing" in text_content
                assert "Client prerequisites" in text_content
            else:
                with ZipFile(BytesIO(data)) as archive:
                    document_xml = archive.read("word/document.xml").decode("utf-8")
                    assert "Human-led testing" in document_xml
                    assert "Client prerequisites" in document_xml

        retry = await m._ceo_exec_tp_generate_artifacts(
            db,
            "Shory",
            CONVERSATION_ID,
            proposal_id=TP_ID,
        )
        assert retry["status"] == "executed"
        retry_ids = [
            uuid.UUID(item["id"])
            for artifact in retry["artifacts"]
            for item in (artifact["sales_attachment"], artifact["conversation_attachment"])
            if item
        ]
        assert retry_ids == new_ids, "Repeated generation created duplicate T153 files"

        after = (
            await db.execute(
                text(
                    """
                    SELECT version, status, methodology_text, assumptions_text
                    FROM sales_technical_proposals
                    WHERE id=:id
                    """
                ),
                {"id": TP_ID},
            )
        ).mappings().one()
        assert after["version"] == 1
        assert after["status"] == "draft"
        assert after["methodology_text"] == METHODOLOGY
        assert after["assumptions_text"] == ASSUMPTIONS
        print("Proposal remains V1 draft: PRESERVED")
        print("Technical T153 DOCX/PDF: GENERATED + VERIFIED")
        print("SHA-256 and source download records: VERIFIED")
        print("Retry reuse: NO DUPLICATES")
        print("External send: NONE")


asyncio.run(run())
