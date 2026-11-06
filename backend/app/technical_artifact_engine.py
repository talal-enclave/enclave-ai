from io import BytesIO
from pathlib import Path
from html import escape
import re

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

import arabic_reshaper
from bidi.algorithm import get_display

AR_RE = re.compile(r"[\u0600-\u06ff]")


def has_arabic(value):
    return bool(AR_RE.search(str(value or "")))


def display(value):
    value = str(value or "")
    return get_display(arabic_reshaper.reshape(value)) if has_arabic(value) else value


def set_rtl(paragraph):
    ppr = paragraph._p.get_or_add_pPr()
    if ppr.find(qn("w:bidi")) is None:
        ppr.append(OxmlElement("w:bidi"))


def add_docx_text(doc, text, bold=False, size=10):
    p = doc.add_paragraph()
    if has_arabic(text):
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        set_rtl(p)
    run = p.add_run(str(text or ""))
    run.bold = bold
    run.font.name = "Arial"
    run.font.size = Pt(size)
    return p


def generate_technical_proposal_docx(payload):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(.55)
    sec.bottom_margin = Inches(.55)
    sec.left_margin = Inches(.65)
    sec.right_margin = Inches(.65)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("TECHNICAL PROPOSAL")
    r.bold = True
    r.font.size = Pt(20)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("DRAFT — INTERNAL REVIEW")
    r.bold = True
    r.font.size = Pt(10)

    table = doc.add_table(rows=4, cols=2)
    table.style = "Table Grid"
    rows = [
        ("Prepared for", payload["client_name"]),
        ("Project", payload["title"]),
        ("Reference", payload["reference"]),
        ("Status", "DRAFT"),
    ]
    for i, (label, value) in enumerate(rows):
        table.cell(i, 0).text = label
        table.cell(i, 1).text = str(value or "")

    doc.add_paragraph()
    for heading, key in [
        ("Scope", "scope_text"),
        ("Methodology", "methodology_text"),
        ("Deliverables", "deliverables_text"),
        ("Assumptions", "assumptions_text"),
        ("Exclusions", "exclusions_text"),
        ("Timeline", "timeline_text"),
    ]:
        body = payload.get(key)
        if not body:
            continue
        add_docx_text(doc, heading, bold=True, size=12)
        for line in str(body).splitlines():
            if line.strip():
                add_docx_text(doc, line.strip(), size=10)

    add_docx_text(
        doc,
        "Packet Enclave Company for Cybersecurity | CR 7054519124 | Riyadh, Saudi Arabia",
        size=8,
    )
    out = BytesIO()
    doc.save(out)
    return out.getvalue()


def pdf_font():
    name = "EnclaveDejaVu"
    if name not in pdfmetrics.getRegisteredFontNames():
        for candidate in (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/dejavu/DejaVuSansCondensed.ttf",
        ):
            if Path(candidate).exists():
                pdfmetrics.registerFont(TTFont(name, candidate))
                break
        else:
            raise RuntimeError("DejaVu font not available")
    return name


def para(text, style):
    return Paragraph(escape(display(text)).replace("\n", "<br/>"), style)


def generate_technical_proposal_pdf(payload):
    font = pdf_font()
    out = BytesIO()
    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Technical Proposal - {payload['client_name']}",
        author="Packet Enclave Company for Cybersecurity",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("tp_title", parent=styles["Title"], fontName=font, fontSize=20, leading=24, spaceAfter=7)
    draft = ParagraphStyle("tp_draft", parent=styles["Normal"], fontName=font, fontSize=9, textColor=colors.HexColor("#8A6500"), backColor=colors.HexColor("#FFF5CF"), borderColor=colors.HexColor("#D9B54A"), borderWidth=.6, borderPadding=6, spaceAfter=10)
    head = ParagraphStyle("tp_head", parent=styles["Heading2"], fontName=font, fontSize=12, leading=16, textColor=colors.HexColor("#133E46"), spaceBefore=8, spaceAfter=4)
    body = ParagraphStyle("tp_body", parent=styles["BodyText"], fontName=font, fontSize=9.5, leading=14, textColor=colors.HexColor("#24373A"), alignment=TA_LEFT, spaceAfter=4)
    rtl = ParagraphStyle("tp_rtl", parent=body, alignment=TA_RIGHT)
    story = [para("TECHNICAL PROPOSAL", title), para("DRAFT — INTERNAL REVIEW", draft)]
    meta = [
        [para("Prepared for", body), para(payload["client_name"], rtl if has_arabic(payload["client_name"]) else body)],
        [para("Project", body), para(payload["title"], rtl if has_arabic(payload["title"]) else body)],
        [para("Reference", body), para(payload["reference"], body)],
        [para("Status", body), para("DRAFT", body)],
    ]
    table = Table(meta, colWidths=[38*mm, 132*mm])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), .35, colors.HexColor("#B9CACC")),
        ("BACKGROUND", (0,0), (0,-1), colors.HexColor("#EDF4F4")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    story.extend([table, Spacer(1, 7*mm)])
    for heading, key in [
        ("Scope", "scope_text"),
        ("Methodology", "methodology_text"),
        ("Deliverables", "deliverables_text"),
        ("Assumptions", "assumptions_text"),
        ("Exclusions", "exclusions_text"),
        ("Timeline", "timeline_text"),
    ]:
        value = payload.get(key)
        if not value:
            continue
        story.append(para(heading, head))
        for line in str(value).splitlines():
            if line.strip():
                story.append(para(line.strip(), rtl if has_arabic(line) else body))
        story.append(Spacer(1, 2*mm))
    story.append(para("Packet Enclave Company for Cybersecurity | CR 7054519124 | Riyadh, Saudi Arabia", body))
    doc.build(story)
    return out.getvalue()
