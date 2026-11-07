"""Close the remaining Shory v1.6 alignment points without creating new records."""
from __future__ import annotations

import asyncio
import hashlib
import uuid
from decimal import Decimal
from io import BytesIO
from zipfile import ZipFile

from pypdf import PdfReader
from sqlalchemy import text

from app import main as m
from app.database import SessionLocal
from app.proposal_template import TEMPLATE_VERSION
from app.technical_artifact_engine import (
    generate_technical_proposal_docx,
    generate_technical_proposal_pdf,
)


TP_ID = uuid.UUID("8467020f-522d-4fbd-b19d-807557ef79e7")
CONVERSATION_ID = uuid.UUID("4c946256-d44c-4f65-a324-5fe0071d0938")
QUOTE_IDS = [
    uuid.UUID("5f059b39-1850-4dd1-97ec-26e3584bac0e"),
    uuid.UUID("cf448f01-d6d7-489b-9c8a-94e0a7b3dc77"),
]

SCOPE = """Two (2) Web & API penetration testing assessments annually over a twelve (12) month term, covering Shory's main portal, all sub-portals and supporting services, and related APIs in the agreed Production environment. Mobile application testing is excluded from this package. Each assessment covers the agreed application baseline, not only release changes, and produces its own report.
Coverage. The preliminary inventory of approximately 13 targets and approximately 85 API endpoints is validated at kickoff. Pricing assumes up to 15 targets and 100 API endpoints; material variance beyond 20% requires written re-scoping and commercial adjustment before commencement. Baseline URLs, API scope, environments, workflows and roles are agreed in writing before contract approval and reconfirmed for each assessment.
Grey-box coverage. Testing is external grey-box, delivered remotely over Shory-provided VPN access, and includes unauthenticated and authenticated coverage:
- Unauthenticated testing of exposed functionality, registration and login paths, and public API endpoints.
- Authenticated testing across the agreed user roles: operations staff and system administrators. Role counts and main business workflows are confirmed during scoping.
- Cross-user and cross-tenant isolation testing between accounts of the same and different roles, explicitly verifying that customers cannot access other customers' data or documents.
- Horizontal and vertical privilege escalation, including attempts to move from operations-level to administrator-level access.
- Business logic and insurance journeys, including account, quotation, document and payment workflows.
- Input validation, common web/API weaknesses (OWASP Top 10 and API Security Top 10) and relevant external application dependencies within the approved scope.
Security testing coverage. Testing also includes, where applicable:
- Session and token security, including token expiry and invalidation upon logout.
- OTP and password recovery security.
- File and document upload/download security, including authorization checks on document access.
- Rate limiting, brute-force protection and abuse prevention, using controlled requests only, without load testing or service disruption.
Red Teaming boundary. The base package includes controlled, application-layer Red Teaming techniques within the approved web/API scope and Rules of Engagement. Enterprise Red Teaming involving internal networks, social engineering or physical security is outside this package and requires separate scope and pricing.
Environments. The main offer covers the Production environment. A single Staging/UAT environment is optional and separately priced. VPN-delivered testing remains application-layer testing and does not constitute internal network penetration testing."""

METHODOLOGY = """Human-led testing. External grey-box testing includes unauthenticated and authenticated coverage. Manual testing is supported by automated tools; reported findings require technical evidence, manual validation and human review. Controlled, non-destructive testing follows the agreed Rules of Engagement.
AI-assisted methodology support. Selected frontier AI models and Enclave Attack, Enclave's security-specialized LLM developed and fine-tuned in-house, support generic security research and methodology using synthetic examples only. No client data is supplied to any model.
Web/API testing follows applicable OWASP WSTG guidance, with OWASP Top 10 and API Security Top 10 risk coverage.
Data protection and PDPL. Client data, credentials, reports and assessment artifacts will not be provided to or processed by any AI model, including Enclave Attack, or used for training or fine-tuning. Personal data will be handled in accordance with Saudi Arabia's Personal Data Protection Law (PDPL) and applicable implementing regulations. Access is restricted; exchanges use agreed encrypted channels."""

DELIVERABLES = """Two English-language PDF reports annually (one per assessment): executive summary, scope, tested versions, methodology, evidenced findings, severity, impact, remediation guidance and coverage limitations.
- Evidence-backed findings. Every reported finding includes reproducible step-by-step instructions, demonstrated impact and severity rationale (CVSS v3.1), supported by a sanitized evidence package with a SHA-256 integrity manifest.
- Regulatory and control mapping. Relevant findings are mapped to NCA ECC-2:2024 and additional applicable frameworks agreed at scoping, with control references and rationale. Mapping is advisory and is not a compliance audit, certification or regulatory approval.
- Finding notifications. Validated Critical findings are notified urgently upon validation through the agreed confidential channel, including impact, supporting evidence and immediate mitigation recommendations. High-severity findings are documented with full reproducible evidence, impact and remediation guidance in the final report.
- Findings review session. Each assessment includes a findings review session with Shory's security team at no additional cost, covering key findings, impact, recommended remediation and the retest verification approach.
- Review and acceptance. Any disputed finding is reviewed jointly with supporting evidence before report acceptance. Reports are deemed accepted if no written dispute is raised within five (5) business days of delivery. Either party may pause testing for safety concerns.
- Remediation retesting. One retest round per assessment is included at no additional cost and covers all findings reported in that assessment."""

TIMELINE = """Assessment dates and durations are mutually agreed and scheduled with at least 10 business days' advance notice.
Active testing. Planning estimate: 10 business days per assessment, covering the agreed targets, API endpoints and role-based testing.
Final report. Within 5 business days after completion of the assessment.
Remediation retest. Within 10 business days after Shory confirms fixes are ready, inside the 40-calendar-day remediation window from the final report.
Retest report. Within 3 business days after completion of the retest.
Retest boundary. The included retest verifies fixes only and does not cover new applications, new features, materially changed functionality, new environments or new assessment scopes. Additional retest rounds, or retesting requested after the remediation window, are separately priced.
Business days are Sunday-Thursday, excluding Saudi public holidays."""

ASSUMPTIONS = """Client prerequisites. Shory provides written authorization, VPN access, accounts for the agreed roles (operations staff and system administrators) for role and cross-user checks, API documentation where available, access details and a technical contact. Testing starts after readiness confirmation, uses controlled data and requires explicit approval for production activity.
Testing coordination. Enclave will share all public source IP addresses used for testing with Shory before each assessment window, for coordination with Shory's SOC.
Scope boundaries. The preliminary inventory is validated at kickoff; pricing assumes up to 15 targets and 100 API endpoints, and material expansion requires separate written agreement. Normal baseline release changes are included; materially changed functionality requires scope confirmation. Excluded dependencies are recorded as limitations.
Knowledge transfer. The included findings review session is delivered to Shory's security team. Dedicated training or practical workshops are outside the scope of penetration testing services and can be provided separately on request.
Assessment limitations. Results reflect the tested version and environment. No minimum finding count or vulnerability-free outcome is guaranteed.
Commercial terms. Pricing, payment terms, optional Staging/UAT coverage, additional retest rounds and assessments beyond the included two are defined in the separate Financial Proposal and final contract."""

EXCLUSIONS = """Mobile application testing, internal network and Active Directory testing, network segmentation review, denial-of-service and destructive testing, social engineering, physical security, full source-code review, full cloud-configuration audits and third-party systems outside the authorization are excluded.
Enterprise Red Teaming activities outside the approved web/API scope are excluded. Controlled application-layer Red Teaming techniques within the approved scope and Rules of Engagement are included.
Dedicated training and practical workshops are outside the scope of penetration testing services and can be provided separately on request."""

FINANCIAL_SCOPE = """Base package: a twelve (12) month arrangement comprising two Web & API penetration testing assessments covering Shory's main portal, all sub-portals and supporting services, and related APIs in the Production environment. Each assessment includes one remediation retesting round and one findings review session with Shory's security team at no additional cost. Mobile application testing is excluded. Controlled application-layer Red Teaming techniques within the approved web/API scope are included; enterprise Red Teaming outside that scope is excluded. Optional Staging/UAT coverage, additional retest rounds and assessments beyond the included two are separately priced after written authorization and scope confirmation."""

FINANCIAL_LINE_DESCRIPTION = "Web & API Penetration Testing - Production (approx. 13 targets, approx. 85 API endpoints)"


def _money(value) -> str:
    return f"{Decimal(str(value or 0)).quantize(Decimal('0.01')):,.2f}"


def _financial_terms(row) -> str:
    net = Decimal(str(row["net_revenue_ex_vat"] or 0))
    rate = Decimal(str(row["vat_rate_pct"] or 0))
    advance = (net * Decimal("0.50")).quantize(Decimal("0.01"))
    assessment = (net * Decimal("0.25")).quantize(Decimal("0.01"))
    if rate == 0:
        advance_text = f"SAR {_money(advance)} (no VAT charged under the current supplier profile)"
        assessment_text = f"SAR {_money(assessment)} (no VAT charged under the current supplier profile)"
        vat_text = "VAT: No VAT is charged under the current supplier profile."
    else:
        advance_vat = (advance * rate / Decimal("100")).quantize(Decimal("0.01"))
        assessment_vat = (assessment * rate / Decimal("100")).quantize(Decimal("0.01"))
        advance_text = f"SAR {_money(advance)} excluding VAT (SAR {_money(advance + advance_vat)} including VAT)"
        assessment_text = f"SAR {_money(assessment)} excluding VAT (SAR {_money(assessment + assessment_vat)} including VAT)"
        vat_text = f"VAT: VAT at {_money(rate)}% is reflected in the applicable quotation amounts and will be reflected in the relevant invoices, subject to any statutory rate change under Saudi law."
    return f"""Advance payment: {advance_text} upon contract execution and before commencement of the first assessment.
Assessment 1 report acceptance: {assessment_text} at report acceptance. Invoices are payable within thirty (30) calendar days from the invoice date.
Assessment 2 report acceptance: {assessment_text} at report acceptance. Invoices are payable within thirty (30) calendar days from the invoice date.
Included remediation retesting: one round per assessment covering all reported findings, with fixes delivered within a 40-calendar-day remediation window. The retest verifies previously reported findings only.
Scheduling: assessment dates and durations are mutually agreed and recorded in the project schedule, with at least 10 business days' advance notice.
Additional requests: optional Staging/UAT coverage, additional retest rounds or assessments beyond the included two require written authorization, scope confirmation and agreement on fees and scheduling before commencement.
{vat_text}"""


def _text_payload(proposal):
    return {
        "client_name": proposal["client_name"],
        "title": proposal["title"],
        "reference": "TP-" + str(proposal["id"]).split("-")[0].upper() + f"-V{proposal['version']}",
        "scope_text": proposal["scope_text"],
        "methodology_text": proposal["methodology_text"],
        "deliverables_text": proposal["deliverables_text"],
        "assumptions_text": proposal["assumptions_text"],
        "exclusions_text": proposal["exclusions_text"],
        "timeline_text": proposal["timeline_text"],
        "created_at": proposal["created_at"],
        "version": proposal["version"],
    }


def _bytes_text(data: bytes, extension: str) -> str:
    if extension == ".pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages)
    with ZipFile(BytesIO(data)) as archive:
        return archive.read("word/document.xml").decode("utf-8")


def _as_uuid(value):
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


async def _verify_attachment(db, attachment_id, markers):
    row = (
        await db.execute(
            text(
                """
                SELECT original_file_name, storage_key, sha256, file_extension, status
                FROM hr_attachments
                WHERE id=:id
                """
            ),
            {"id": attachment_id},
        )
    ).mappings().one()
    assert row["status"] == "active"
    assert row["original_file_name"].endswith("_T154.docx") or row["original_file_name"].endswith("_T154.pdf")
    data = m._hr_attachment_storage_path(row["storage_key"]).read_bytes()
    assert hashlib.sha256(data).hexdigest() == row["sha256"]
    content = _bytes_text(data, row["file_extension"])
    lowered = content.lower()
    normalized = lowered.replace("-", "").replace("‑", "").replace("–", "")
    for marker in markers:
        expected = marker.lower().replace("-", "").replace("‑", "").replace("–", "")
        assert expected in normalized, (marker, row["original_file_name"])
    return row["original_file_name"]


def _technical_ids(result):
    return [
        _as_uuid(item["id"])
        for artifact in result["artifacts"]
        for item in (artifact["sales_attachment"], artifact["conversation_attachment"])
        if item
    ]


def _financial_ids(result):
    return [
        _as_uuid(item["id"])
        for item in result["sales_attachments"] + result["conversation_attachments"]
    ]


async def run() -> None:
    assert TEMPLATE_VERSION == "1.5.4"
    async with SessionLocal() as db:
        proposal = (
            await db.execute(
                text(
                    """
                    SELECT id, version, status, title
                    FROM sales_technical_proposals
                    WHERE id=:id
                    """
                ),
                {"id": TP_ID},
            )
        ).mappings().one()
        assert proposal["version"] == 1
        assert proposal["status"] == "draft"
        assert proposal["title"] == "Shory Penetration Testing Technical Proposal"

        # Close the remaining technical content gaps while preserving V1/draft.
        await db.execute(
            text(
                """
                UPDATE sales_technical_proposals
                SET scope_text=:scope,
                    methodology_text=:methodology,
                    deliverables_text=:deliverables,
                    assumptions_text=:assumptions,
                    exclusions_text=:exclusions,
                    timeline_text=:timeline,
                    updated_at=now()
                WHERE id=:id
                """
            ),
            {
                "id": TP_ID,
                "scope": SCOPE,
                "methodology": METHODOLOGY,
                "deliverables": DELIVERABLES,
                "assumptions": ASSUMPTIONS,
                "exclusions": EXCLUSIONS,
                "timeline": TIMELINE,
            },
        )

        # Align only the current/corrected financial quotation. Historical
        # quotation records remain immutable, and no new quotation version is
        # created.
        quote_rows = []
        financial_snapshot = {}
        for quote_id in QUOTE_IDS:
            row = (
                await db.execute(
                    text(
                        """
                        SELECT q.id, q.version, q.status, q.external_quote_number,
                               q.created_at, q.net_revenue_ex_vat,
                               q.vat_rate_pct, q.vat_amount, q.total_inc_vat,
                               q.direct_cost, q.gross_profit, q.gross_margin_pct,
                               a.name AS client_name
                        FROM sales_quotations q
                        JOIN sales_opportunities o ON o.id=q.opportunity_id
                        JOIN sales_accounts a ON a.id=o.account_id
                        WHERE q.id=:id
                        """
                    ),
                    {"id": quote_id},
                )
            ).mappings().one()
            assert row["client_name"].lower() in {"shory", "shory.sa"}
            assert row["status"] in {"draft", "pending_approval", "approved", "active", "accepted", "won"}
            quote_rows.append(row)
            financial_snapshot[str(quote_id)] = (
                row["version"],
                row["status"],
                str(row["net_revenue_ex_vat"]),
                str(row["vat_rate_pct"]),
                str(row["vat_amount"]),
                str(row["total_inc_vat"]),
                str(row["direct_cost"]),
                str(row["gross_profit"]),
                str(row["gross_margin_pct"]),
            )

        target_row = next(
            (
                row
                for row in quote_rows
                if "FP-R4" in str(row["external_quote_number"] or "").upper()
            ),
            max(
                quote_rows,
                key=lambda row: (int(row["version"]), row["created_at"]),
            ),
        )
        target_quote_id = uuid.UUID(str(target_row["id"]))
        financial_terms = _financial_terms(target_row)
        await db.execute(
            text(
                """
                UPDATE sales_quotations
                SET scope_summary=:scope,
                    payment_terms=:payment_terms,
                    updated_at=now()
                WHERE id=:id
                """
            ),
            {"id": target_quote_id, "scope": FINANCIAL_SCOPE, "payment_terms": financial_terms},
        )
        line_rows = (
            await db.execute(
                text(
                    """
                    SELECT id
                    FROM sales_quotation_lines
                    WHERE quotation_id=:id
                    ORDER BY line_number
                    """
                ),
                {"id": target_quote_id},
            )
        ).scalars().all()
        assert line_rows
        await db.execute(
            text(
                """
                UPDATE sales_quotation_lines
                SET description=:description
                WHERE quotation_id=:id AND line_number=1
                """
            ),
            {"id": target_quote_id, "description": FINANCIAL_LINE_DESCRIPTION},
        )
        print("Historical financial quotation records: PRESERVED")
        print(f"Current corrected financial quotation selected: {target_quote_id}")

        # Read-only preflight after the intended field updates and before any
        # attachment insert. This catches conversion/layout failures safely.
        proposal, reason = await m._ceo_exec_tp_resolve(db, "Shory", TP_ID)
        assert proposal is not None, reason
        assert proposal["version"] == 1 and proposal["status"] == "draft"
        technical_payload = _text_payload(proposal)
        technical_docx = generate_technical_proposal_docx(technical_payload)
        technical_pdf = generate_technical_proposal_pdf(technical_payload)
        assert technical_docx.startswith(b"PK") and technical_pdf.startswith(b"%PDF")
        technical_doc_text = _bytes_text(technical_docx, ".docx")
        technical_pdf_text = _bytes_text(technical_pdf, ".pdf")
        for marker in ("Red Teaming", "One retest round per assessment", "10 business days", "internal network and Active Directory"):
            assert marker.lower() in technical_doc_text.lower()
            assert marker.lower() in technical_pdf_text.lower()
        print("Technical v1.6 scope, retest, Red Teaming and exclusions preflight: PASSED")

        financial_payload = await m._artifact_financial_proposal_payload(db, target_quote_id)
        assert financial_payload["quotation"]["scope_summary"] == FINANCIAL_SCOPE
        assert financial_payload["quotation"]["payment_terms"] == financial_terms
        financial_docx = m._artifact_build_docx(financial_payload)
        financial_pdf = m._artifact_build_pdf(financial_payload)
        assert financial_docx.startswith(b"PK") and financial_pdf.startswith(b"%PDF")
        for data, ext in ((financial_docx, ".docx"), (financial_pdf, ".pdf")):
            content = _bytes_text(data, ext).lower()
            normalized = content.replace("-", "").replace("‑", "").replace("–", "")
            for marker in ("red teaming", "remediation window", "thirty (30) calendar days", "additional requests"):
                expected = marker.lower().replace("-", "").replace("‑", "").replace("–", "")
                assert expected in normalized, (marker, ext)
        print("Financial Proposal v1.6 alignment preflight: PASSED")

        await db.commit()
        print("Technical and financial wording: UPDATED WITHOUT NEW COMMERCIAL VERSIONS")

        technical_result = await m._ceo_exec_tp_generate_artifacts(
            db, "Shory", CONVERSATION_ID, proposal_id=TP_ID
        )
        assert technical_result["status"] == "executed"
        assert technical_result["external_send"] is False
        technical_ids = _technical_ids(technical_result)
        assert len(technical_ids) == 4
        for attachment_id in technical_ids:
            await _verify_attachment(
                db,
                attachment_id,
                ("Red Teaming", "10 business days", "One retest round per assessment"),
            )

        financial_results = []
        financial_ids = []
        result = await m._artifact_generate_financial_proposal(
            db, target_quote_id, CONVERSATION_ID
        )
        assert result["external_send"] is False
        ids = _financial_ids(result)
        assert len(ids) == 4
        financial_results.append(result)
        financial_ids.extend(ids)
        for attachment_id in ids:
            await _verify_attachment(
                db,
                attachment_id,
                ("Red Teaming", "remediation window", "thirty (30) calendar days", "Additional requests"),
            )

        first_ids = technical_ids + financial_ids

        # A second execution must reuse T154 files and create no duplicates.
        retry_technical = await m._ceo_exec_tp_generate_artifacts(
            db, "Shory", CONVERSATION_ID, proposal_id=TP_ID
        )
        retry_ids = _technical_ids(retry_technical)
        assert retry_ids == technical_ids
        retry = await m._artifact_generate_financial_proposal(
            db, target_quote_id, CONVERSATION_ID
        )
        assert _financial_ids(retry) == _financial_ids(financial_results[0])

        final = (
            await db.execute(
                text(
                    """
                    SELECT version, status, scope_text, methodology_text,
                           deliverables_text, assumptions_text,
                           exclusions_text, timeline_text
                    FROM sales_technical_proposals
                    WHERE id=:id
                    """
                ),
                {"id": TP_ID},
            )
        ).mappings().one()
        assert final["version"] == 1 and final["status"] == "draft"
        assert final["scope_text"] == SCOPE
        assert final["methodology_text"] == METHODOLOGY
        assert final["deliverables_text"] == DELIVERABLES
        assert final["assumptions_text"] == ASSUMPTIONS
        assert final["exclusions_text"] == EXCLUSIONS
        assert final["timeline_text"] == TIMELINE
        for quote_id, snapshot in financial_snapshot.items():
            current_quote = (
                await db.execute(
                    text(
                        """
                        SELECT version, status, net_revenue_ex_vat,
                               vat_rate_pct, vat_amount, total_inc_vat,
                               direct_cost, gross_profit, gross_margin_pct,
                               scope_summary, payment_terms
                        FROM sales_quotations
                        WHERE id=:id
                        """
                    ),
                    {"id": uuid.UUID(quote_id)},
                )
            ).mappings().one()
            current_snapshot = (
                current_quote["version"],
                current_quote["status"],
                str(current_quote["net_revenue_ex_vat"]),
                str(current_quote["vat_rate_pct"]),
                str(current_quote["vat_amount"]),
                str(current_quote["total_inc_vat"]),
                str(current_quote["direct_cost"]),
                str(current_quote["gross_profit"]),
                str(current_quote["gross_margin_pct"]),
            )
            assert current_snapshot == snapshot
            if uuid.UUID(quote_id) == target_quote_id:
                assert current_quote["scope_summary"] == FINANCIAL_SCOPE
                assert current_quote["payment_terms"] == financial_terms
                line_description = (
                    await db.execute(
                        text(
                            """
                            SELECT description
                            FROM sales_quotation_lines
                            WHERE quotation_id=:id AND line_number=1
                            """
                        ),
                        {"id": target_quote_id},
                    )
                ).scalar_one()
                assert line_description == FINANCIAL_LINE_DESCRIPTION
        assert len(set(first_ids)) == 8
        print("Proposal V1 draft and quotation versions: PRESERVED")
        print("Technical T154 DOCX/PDF: GENERATED + VERIFIED")
        print("Financial T154 DOCX/PDF: GENERATED + VERIFIED")
        print("Retry reuse: NO DUPLICATES")
        print("External send: NONE")


asyncio.run(run())
