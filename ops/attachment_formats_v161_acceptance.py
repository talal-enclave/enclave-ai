"""Acceptance checks for Enclave v1.6.1 attachment compatibility."""

from io import BytesIO
import json
import zipfile
import urllib.request

from app.main import (
    HR_ATTACHMENT_ALLOWED_EXTENSIONS,
    _CEO_ATTACHMENT_TEXT_EXTENSIONS,
    _ceo_extract_office_xml_text,
)


assert {".xls", ".xlsx", ".ppt", ".pptx"}.issubset(
    HR_ATTACHMENT_ALLOWED_EXTENSIONS
)
assert {".xlsx", ".pptx"}.issubset(
    _CEO_ATTACHMENT_TEXT_EXTENSIONS
)


def office_zip(files):
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return buffer.getvalue()


xlsx = office_zip(
    {
        "xl/worksheets/sheet1.xml": (
            b'<?xml version="1.0" encoding="UTF-8"?>'
            b'<worksheet xmlns="http://schemas.openxmlformats.org/'
            b'spreadsheetml/2006/main"><sheetData><row r="1">'
            b'<c r="A1" t="inlineStr"><is><t>Full Name</t></is></c>'
            b'<c r="B1" t="inlineStr"><is><t>Role</t></is></c>'
            b'</row><row r="2"><c r="A2" t="inlineStr">'
            b'<is><t>Test Worker</t></is></c><c r="B2" t="inlineStr">'
            b'<is><t>Consultant</t></is></c></row></sheetData></worksheet>'
        )
    }
)
assert "Full Name" in _ceo_extract_office_xml_text(xlsx, ".xlsx")
assert "Test Worker" in _ceo_extract_office_xml_text(xlsx, ".xlsx")


pptx = office_zip(
    {
        "ppt/slides/slide1.xml": (
            b'<?xml version="1.0" encoding="UTF-8"?>'
            b'<p:sld xmlns:p="http://schemas.openxmlformats.org/'
            b'presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/'
            b'drawingml/2006/main"><p:cSld><a:t>Enclave</a:t>'
            b'<a:t>Attachment Test</a:t></p:cSld></p:sld>'
        )
    }
)
assert "Enclave" in _ceo_extract_office_xml_text(pptx, ".pptx")
assert "Attachment Test" in _ceo_extract_office_xml_text(pptx, ".pptx")


with urllib.request.urlopen(
    "http://127.0.0.1:8000/health",
    timeout=20,
) as response:
    assert response.status == 200

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.1"
print("Unified attachment allow-list: PASSED")
print("XLSX CEO text extraction: PASSED")
print("PPTX CEO text extraction: PASSED")
print("API health and CEO capabilities: PASSED")
