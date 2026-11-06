from .proposal_template import technical_document, docx_bytes, pdf_from_docx

def generate_technical_proposal_docx(payload):
    return docx_bytes(technical_document(payload))

def generate_technical_proposal_pdf(payload):
    return pdf_from_docx(generate_technical_proposal_docx(payload))
