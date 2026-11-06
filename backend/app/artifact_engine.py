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


def build_financial_proposal_docx(payload):
    from .proposal_template import financial_document, docx_bytes
    return docx_bytes(financial_document(payload))


def build_financial_proposal_pdf(payload):
    from .proposal_template import pdf_from_docx
    return pdf_from_docx(build_financial_proposal_docx(payload))
