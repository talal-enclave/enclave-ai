from __future__ import annotations

from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape


def has_arabic(value) -> bool:
    return any(
        "\u0600" <= ch <= "\u06ff"
        for ch in str(value or "")
    )


def arabic_display(value) -> str:
    value = str(value or "")

    if not value or not has_arabic(value):
        return value

    try:
        import arabic_reshaper
        from bidi.algorithm import get_display

        return get_display(
            arabic_reshaper.reshape(value)
        )
    except Exception:
        return value


def money(value) -> str:
    from decimal import Decimal

    try:
        number = Decimal(str(value or 0))
    except Exception:
        number = Decimal("0")

    return f"{number:,.2f}"


def quantity(value) -> str:
    from decimal import Decimal

    try:
        number = Decimal(str(value or 0))
    except Exception:
        return str(value or "")

    normalized = number.normalize()

    if normalized == normalized.to_integral():
        return str(int(normalized))

    return format(
        normalized,
        "f",
    ).rstrip("0").rstrip(".")


def safe_filename(value) -> str:
    import re

    slug = re.sub(
        r"[^A-Za-z0-9]+",
        "_",
        str(value or ""),
    ).strip("_")

    return slug[:80] or "Client"


def build_financial_proposal_docx(payload: dict) -> bytes:
    from docx import Document
    from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Inches, Pt, RGBColor

    company = payload["company"]
    quote = payload["quotation"]
    lines = payload["lines"]

    document = Document()

    section = document.sections[0]
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.55)
    section.left_margin = Inches(0.58)
    section.right_margin = Inches(0.58)

    normal = document.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(9.5)

    def font(run, name="Arial"):
        run.font.name = name
        run._element.rPr.rFonts.set(qn("w:ascii"), name)
        run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
        run._element.rPr.rFonts.set(qn("w:cs"), name)

    def shade(cell, fill):
        tc_pr = cell._tc.get_or_add_tcPr()
        shd = tc_pr.find(qn("w:shd"))

        if shd is None:
            shd = OxmlElement("w:shd")
            tc_pr.append(shd)

        shd.set(qn("w:fill"), fill)

    def rtl(paragraph):
        p_pr = paragraph._p.get_or_add_pPr()
        bidi = p_pr.find(qn("w:bidi"))

        if bidi is None:
            bidi = OxmlElement("w:bidi")
            p_pr.append(bidi)

    header = document.add_table(rows=1, cols=2)
    header.autofit = False
    header.columns[0].width = Inches(4.9)
    header.columns[1].width = Inches(2.0)

    left = header.cell(0, 0)
    right = header.cell(0, 1)

    shade(left, "0B1D2D")
    shade(right, "0F4C5C")

    p = left.paragraphs[0]
    run = p.add_run("ENCLAVE")
    font(run)
    run.bold = True
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor(247, 250, 252)

    p = right.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run("FINANCIAL PROPOSAL")
    font(run)
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(247, 250, 252)

    document.add_paragraph()

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("Financial Proposal")
    font(run)
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = RGBColor(15, 76, 92)

    ar_title = document.add_paragraph()
    ar_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rtl(ar_title)
    run = ar_title.add_run(
        "\u0627\u0644\u0639\u0631\u0636 "
        "\u0627\u0644\u0645\u0627\u0644\u064a"
    )
    font(run)
    run.bold = True
    run.font.size = Pt(13)
    run.font.color.rgb = RGBColor(15, 76, 92)

    is_draft = quote["status"] not in {
        "approved",
        "active",
        "accepted",
        "won",
    }

    if is_draft:
        p = document.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(
            "DRAFT - FOR INTERNAL REVIEW ONLY | "
            "\u0645\u0633\u0648\u062f\u0629 - "
            "\u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629 "
            "\u0627\u0644\u062f\u0627\u062e\u0644\u064a\u0629 "
            "\u0641\u0642\u0637"
        )
        font(run)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(173, 43, 43)

    system_reference = (
        quote.get("external_quote_number")
        or (
            f"Q-{str(quote['id'])[:8].upper()}"
            f"-V{quote['version']}"
        )
    )

    details = document.add_table(rows=5, cols=2)
    details.style = "Table Grid"

    rows = [
        ("Prepared for / Client", quote["client_name"]),
        ("Prepared by", company["legal_name_en"]),
        ("System Reference", system_reference),
        (
            "Opportunity",
            f"{quote['opportunity_code']} - {quote['opportunity_name']}",
        ),
        (
            "Quotation Status",
            str(quote["status"]).replace("_", " ").title(),
        ),
    ]

    for index, (label, value) in enumerate(rows):
        details.cell(index, 0).text = label
        details.cell(index, 1).text = str(value or "")
        shade(details.cell(index, 0), "E8F3F2")

        for cell in details.rows[index].cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for run in cell.paragraphs[0].runs:
                font(run)

        details.cell(index, 0).paragraphs[0].runs[0].bold = True

    document.add_paragraph()

    items = document.add_table(rows=1, cols=5)
    items.style = "Table Grid"

    headers = [
        "#",
        "Description",
        "Quantity",
        "Unit Price (SAR)",
        "Amount (SAR)",
    ]

    for index, label in enumerate(headers):
        cell = items.cell(0, index)
        cell.text = label
        shade(cell, "0F4C5C")
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

        for run in cell.paragraphs[0].runs:
            font(run)
            run.bold = True
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(247, 250, 252)

    for line in lines:
        cells = items.add_row().cells
        values = [
            str(line["line_number"]),
            str(line["description"]),
            quantity(line["quantity"]),
            money(line["unit_price"]),
            money(line["net_amount_ex_vat"]),
        ]

        for index, value in enumerate(values):
            cells[index].text = value
            cells[index].vertical_alignment = (
                WD_CELL_VERTICAL_ALIGNMENT.CENTER
            )

            paragraph = cells[index].paragraphs[0]
            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.LEFT
                if index == 1
                else WD_ALIGN_PARAGRAPH.CENTER
            )

            if index == 1 and has_arabic(value):
                paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                rtl(paragraph)

            for run in paragraph.runs:
                font(run)
                run.font.size = Pt(8.5)

    document.add_paragraph()

    totals = document.add_table(rows=5, cols=2)
    totals.style = "Table Grid"

    total_rows = [
        ("Subtotal (SAR)", quote["subtotal_ex_vat"]),
        ("Discount (SAR)", quote["discount_amount"]),
        ("Net Amount (SAR)", quote["net_revenue_ex_vat"]),
        (
            f"VAT ({quantity(quote['vat_rate_pct'])}%)",
            quote["vat_amount"],
        ),
        ("Total (SAR)", quote["total_inc_vat"]),
    ]

    for index, (label, value) in enumerate(total_rows):
        totals.cell(index, 0).text = label
        totals.cell(index, 1).text = money(value)

        if index < 4:
            shade(totals.cell(index, 0), "D9E7E6")
        else:
            shade(totals.cell(index, 0), "0F4C5C")
            shade(totals.cell(index, 1), "0F4C5C")

        for cell in totals.rows[index].cells:
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
            for run in cell.paragraphs[0].runs:
                font(run)
                run.bold = True

                if index == 4:
                    run.font.color.rgb = RGBColor(247, 250, 252)

    document.add_paragraph()

    p = document.add_paragraph()
    run = p.add_run("Commercial Terms")
    font(run)
    run.bold = True
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(15, 76, 92)

    terms = []

    if quote.get("payment_terms"):
        terms.append(("Payment Terms", quote["payment_terms"]))

    if quote.get("validity_date"):
        terms.append(("Offer Validity", str(quote["validity_date"])))

    if quote.get("scope_summary"):
        terms.append(("Scope Summary", quote["scope_summary"]))

    if company["vat_status"] != "registered":
        terms.append(
            (
                "VAT",
                (
                    "No VAT is charged because the company VAT status "
                    "in the system is not registered."
                ),
            )
        )

    if not terms:
        terms.append(
            ("System Record", "No optional commercial terms are recorded.")
        )

    for label, value in terms:
        p = document.add_paragraph()
        run = p.add_run(f"{label}: ")
        font(run)
        run.bold = True
        run = p.add_run(str(value))
        font(run)

    company_ar = str(company.get("legal_name_ar") or "").strip()

    if company_ar:
        p = document.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        rtl(p)
        run = p.add_run(company_ar)
        font(run)
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(77, 101, 108)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = footer.add_run(
        f"{company['legal_name_en']} | "
        f"CR: {company['commercial_registration_no']} | "
        f"{company.get('city') or 'Riyadh'}, Saudi Arabia | "
        "Confidential"
    )
    font(run)
    run.font.size = Pt(7.5)
    run.font.color.rgb = RGBColor(91, 111, 117)

    output = BytesIO()
    document.save(output)
    return output.getvalue()


def build_financial_proposal_pdf(payload: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    regular = Path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    )
    bold = Path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    )

    if not regular.exists() or not bold.exists():
        raise RuntimeError("DejaVu fonts are not installed.")

    if "EnclaveDejaVu" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(
            TTFont("EnclaveDejaVu", str(regular))
        )

    if "EnclaveDejaVu-Bold" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(
            TTFont("EnclaveDejaVu-Bold", str(bold))
        )

    company = payload["company"]
    quote = payload["quotation"]
    lines = payload["lines"]

    output = BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        title=f"Financial Proposal - {quote['client_name']}",
        author=company["legal_name_en"],
    )

    styles = getSampleStyleSheet()

    normal = ParagraphStyle(
        "EnclaveNormal",
        parent=styles["Normal"],
        fontName="EnclaveDejaVu",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#172B34"),
    )

    right = ParagraphStyle(
        "EnclaveRight",
        parent=normal,
        alignment=TA_RIGHT,
    )

    center = ParagraphStyle(
        "EnclaveCenter",
        parent=normal,
        alignment=TA_CENTER,
    )

    title = ParagraphStyle(
        "EnclaveTitle",
        parent=normal,
        fontName="EnclaveDejaVu-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F4C5C"),
        alignment=TA_CENTER,
        spaceAfter=3 * mm,
    )

    def pdf_text(value):
        value = str(value or "")

        if has_arabic(value):
            value = arabic_display(value)

        return escape(value)

    story = []

    brand = Table(
        [
            [
                Paragraph(
                    "<b>ENCLAVE</b>",
                    ParagraphStyle(
                        "Brand",
                        parent=normal,
                        fontName="EnclaveDejaVu-Bold",
                        fontSize=20,
                        textColor=colors.white,
                        alignment=TA_LEFT,
                    ),
                ),
                Paragraph(
                    "<b>FINANCIAL PROPOSAL</b>",
                    ParagraphStyle(
                        "BrandRight",
                        parent=normal,
                        fontName="EnclaveDejaVu-Bold",
                        fontSize=10,
                        textColor=colors.white,
                        alignment=TA_RIGHT,
                    ),
                ),
            ]
        ],
        colWidths=[125 * mm, 40 * mm],
    )

    brand.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#0B1D2D")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#0F4C5C")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    story.extend(
        [
            brand,
            Spacer(1, 7 * mm),
            Paragraph("Financial Proposal", title),
            Paragraph(
                pdf_text(
                    "\u0627\u0644\u0639\u0631\u0636 "
                    "\u0627\u0644\u0645\u0627\u0644\u064a"
                ),
                ParagraphStyle(
                    "ArabicTitle",
                    parent=center,
                    fontName="EnclaveDejaVu-Bold",
                    fontSize=11,
                    textColor=colors.HexColor("#0F4C5C"),
                    spaceAfter=3 * mm,
                ),
            ),
        ]
    )

    is_draft = quote["status"] not in {
        "approved",
        "active",
        "accepted",
        "won",
    }

    if is_draft:
        story.append(
            Paragraph(
                (
                    "<b>DRAFT - FOR INTERNAL REVIEW ONLY</b><br/>"
                    + pdf_text(
                        "\u0645\u0633\u0648\u062f\u0629 - "
                        "\u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629 "
                        "\u0627\u0644\u062f\u0627\u062e\u0644\u064a\u0629 "
                        "\u0641\u0642\u0637"
                    )
                ),
                ParagraphStyle(
                    "Draft",
                    parent=center,
                    fontName="EnclaveDejaVu-Bold",
                    textColor=colors.HexColor("#AD2B2B"),
                    backColor=colors.HexColor("#FFF0F0"),
                    borderColor=colors.HexColor("#E5A3A3"),
                    borderWidth=0.7,
                    borderPadding=6,
                    spaceAfter=4 * mm,
                ),
            )
        )

    reference = (
        quote.get("external_quote_number")
        or f"Q-{str(quote['id'])[:8].upper()}-V{quote['version']}"
    )

    detail_rows = [
        ("Prepared for / Client", quote["client_name"]),
        ("Prepared by", company["legal_name_en"]),
        ("System Reference", reference),
        (
            "Opportunity",
            f"{quote['opportunity_code']} - {quote['opportunity_name']}",
        ),
        (
            "Quotation Status",
            str(quote["status"]).replace("_", " ").title(),
        ),
    ]

    details = Table(
        [
            [
                Paragraph(f"<b>{escape(label)}</b>", normal),
                Paragraph(pdf_text(value), normal),
            ]
            for label, value in detail_rows
        ],
        colWidths=[53 * mm, 112 * mm],
    )

    details.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8CDCC")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E8F3F2")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.extend([details, Spacer(1, 5 * mm)])

    item_rows = [
        [
            Paragraph("<b>#</b>", center),
            Paragraph("<b>Description</b>", center),
            Paragraph("<b>Qty</b>", center),
            Paragraph("<b>Unit Price<br/>(SAR)</b>", center),
            Paragraph("<b>Amount<br/>(SAR)</b>", center),
        ]
    ]

    for line in lines:
        description_style = (
            right if has_arabic(line["description"]) else normal
        )

        item_rows.append(
            [
                Paragraph(pdf_text(line["line_number"]), center),
                Paragraph(pdf_text(line["description"]), description_style),
                Paragraph(pdf_text(quantity(line["quantity"])), center),
                Paragraph(pdf_text(money(line["unit_price"])), right),
                Paragraph(
                    pdf_text(money(line["net_amount_ex_vat"])),
                    right,
                ),
            ]
        )

    items = Table(
        item_rows,
        colWidths=[10 * mm, 78 * mm, 17 * mm, 30 * mm, 30 * mm],
        repeatRows=1,
    )

    items.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F4C5C")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8CDCC")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#F5FAFA")],
                ),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.extend([items, Spacer(1, 5 * mm)])

    total_rows = [
        ("Subtotal (SAR)", quote["subtotal_ex_vat"]),
        ("Discount (SAR)", quote["discount_amount"]),
        ("Net Amount (SAR)", quote["net_revenue_ex_vat"]),
        (
            f"VAT ({quantity(quote['vat_rate_pct'])}%)",
            quote["vat_amount"],
        ),
        ("Total (SAR)", quote["total_inc_vat"]),
    ]

    totals = Table(
        [
            [
                Paragraph(f"<b>{escape(label)}</b>", right),
                Paragraph(f"<b>{money(value)}</b>", right),
            ]
            for label, value in total_rows
        ],
        colWidths=[110 * mm, 55 * mm],
    )

    totals.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8CDCC")),
                ("BACKGROUND", (0, 0), (0, -2), colors.HexColor("#D9E7E6")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#0F4C5C")),
                ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.append(totals)

    terms = []

    if quote.get("payment_terms"):
        terms.append(("Payment Terms", quote["payment_terms"]))

    if quote.get("validity_date"):
        terms.append(("Offer Validity", str(quote["validity_date"])))

    if quote.get("scope_summary"):
        terms.append(("Scope Summary", quote["scope_summary"]))

    if company["vat_status"] != "registered":
        terms.append(
            (
                "VAT",
                (
                    "No VAT is charged because the company VAT status "
                    "in the system is not registered."
                ),
            )
        )

    if not terms:
        terms.append(
            ("System Record", "No optional commercial terms are recorded.")
        )

    story.append(Spacer(1, 5 * mm))
    story.append(
        Paragraph(
            "Commercial Terms",
            ParagraphStyle(
                "Section",
                parent=normal,
                fontName="EnclaveDejaVu-Bold",
                fontSize=11,
                textColor=colors.HexColor("#0F4C5C"),
                spaceAfter=2 * mm,
            ),
        )
    )

    for label, value in terms:
        story.append(
            Paragraph(
                f"<b>{escape(label)}:</b> {pdf_text(value)}",
                right if has_arabic(value) else normal,
            )
        )
        story.append(Spacer(1, 1.5 * mm))

    company_ar = str(company.get("legal_name_ar") or "").strip()

    if company_ar:
        story.extend(
            [
                Spacer(1, 3 * mm),
                Paragraph(pdf_text(company_ar), right),
            ]
        )

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("EnclaveDejaVu", 7)
        canvas.setFillColor(colors.HexColor("#5B6F75"))
        canvas.drawCentredString(
            A4[0] / 2,
            8 * mm,
            (
                f"{company['legal_name_en']} | "
                f"CR: {company['commercial_registration_no']} | "
                f"{company.get('city') or 'Riyadh'}, Saudi Arabia | "
                "Confidential"
            ),
        )
        canvas.restoreState()

    document.build(
        story,
        onFirstPage=footer,
        onLaterPages=footer,
    )

    return output.getvalue()
