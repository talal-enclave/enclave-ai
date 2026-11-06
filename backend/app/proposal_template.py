"""Shared Enclave proposal presentation. Business records remain authoritative.
Reference wording: Shory technical v1.6 and corrected financial FP-R4.
Client-specific amounts, scope, terms and commitments are never template defaults.
"""
from io import BytesIO
from pathlib import Path
from decimal import Decimal
import os
import re
import shutil
import subprocess
import tempfile
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

TEMPLATE_VERSION = '1.5.3'
GREEN = '008F78'
INK = '153442'
FONT = 'DejaVu Sans'
SUPPLIER = 'Packet Enclave Company for Cybersecurity'


def money(v):
    # Do not silently turn malformed commercial values into zero.
    n = Decimal(str(v))
    if not n.is_finite():
        raise ValueError('Non-finite monetary value')
    return f'{n:,.2f}'


def quantity(v):
    n = Decimal(str(v))
    if not n.is_finite():
        raise ValueError('Non-finite quantity')
    return format(n.normalize(), 'f')


def blocks(value):
    """Split flattened list markers, never intra-word hyphens or monetary signs."""
    for raw in str(value or '').splitlines():
        # Existing records flattened bullets as '. - ' or ': - '.
        chunks = re.split(r'(?<=[.:;])\s+(?=[-•]\s+)|\s+(?=•\s+)', raw.strip())
        for part in chunks:
            part = part.strip()
            if part:
                bullet = bool(re.match(r'^[-•]\s+', part))
                yield (re.sub(r'^[-•]\s+', '', part) if bullet else part), bullet


def _rtl(p, text):
    if re.search(r'[\u0600-\u06ff]', str(text)):
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        el = OxmlElement('w:bidi')
        p._p.get_or_add_pPr().append(el)


def paragraph(doc, text, style=None, bold=False):
    p = doc.add_paragraph(style=style)
    r = p.add_run(str(text))
    r.bold = bold
    _rtl(p, text)
    return p


def body(doc, value):
    for text, bullet in blocks(value):
        paragraph(doc, text, 'List Bullet' if bullet else None)


def heading(doc, text):
    p = doc.add_paragraph(text, style='Heading 1')
    p.paragraph_format.keep_with_next = True


def table(doc, labels, rows, widths):
    t = doc.add_table(rows=1, cols=len(labels))
    t.autofit = False
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c,w in zip(t.columns,widths): c.width=Mm(w)
    for i,label in enumerate(labels): t.rows[0].cells[i].text=str(label)
    repeat = OxmlElement('w:tblHeader')
    t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        cells=t.add_row().cells
        for i,value in enumerate(row): cells[i].text=str(value)
    for ri,row in enumerate(t.rows):
        for i,c in enumerate(row.cells):
            c.width=Mm(widths[i]); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            pr=c._tc.get_or_add_tcPr()
            sh=OxmlElement('w:shd');sh.set(qn('w:fill'), GREEN if ri==0 else ('F0F7F5' if ri%2==0 else 'FFFFFF'));pr.append(sh)
            borders=OxmlElement('w:tcBorders')
            for edge in ('top','left','bottom','right'):
                e=OxmlElement('w:'+edge);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'D9D9D9');borders.append(e)
            pr.append(borders)
            margins=OxmlElement('w:tcMar')
            for edge in ('top','left','bottom','right'):
                e=OxmlElement('w:'+edge);e.set(qn('w:w'),'90');e.set(qn('w:type'),'dxa');margins.append(e)
            pr.append(margins)
            for p in c.paragraphs:
                p.paragraph_format.space_after=Pt(0)
                p.paragraph_format.line_spacing=1.1
                _rtl(p,p.text)
                if ri==0: p.paragraph_format.keep_with_next=True
                for r in p.runs:
                    r.font.size=Pt(8);r.bold=ri==0
                    r.font.color.rgb=RGBColor.from_string('FFFFFF' if ri==0 else INK)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)
    return t


def new_document(kind,title,client,reference,date=None,version=None,draft=True):
    d=Document()
    # Remove built-in template borders before applying the approved presentation.
    for st in d.styles:
        for border in list(st.element.iter(qn('w:pBdr'))):
            border.getparent().remove(border)
    s=d.sections[0]
    s.page_width=Mm(210);s.page_height=Mm(297)
    s.top_margin=Mm(24);s.bottom_margin=Mm(20);s.left_margin=s.right_margin=Mm(17)
    s.header_distance=Mm(8);s.footer_distance=Mm(9)
    for name in ('Normal','Title','Subtitle','Heading 1','Heading 2','List Bullet','Header','Footer'):
        st=d.styles[name];st.font.name=FONT;st.font.size=Pt(9)
        st.font.color.rgb=RGBColor.from_string(INK)
        st.element.get_or_add_rPr().rFonts.set(qn('w:cs'),FONT)
        st.paragraph_format.space_after=Pt(5)
        st.paragraph_format.line_spacing=1.13
    d.styles['Title'].font.size=Pt(18);d.styles['Title'].font.bold=True
    d.styles['Heading 1'].font.size=Pt(11);d.styles['Heading 1'].font.bold=True
    d.styles['Heading 1'].font.color.rgb=RGBColor.from_string(GREEN)
    d.styles['Heading 1'].paragraph_format.space_before=Pt(10)
    hp=s.header.paragraphs[0]
    logo=Path(__file__).parent/'proposal_assets'/'enclave_logo.jpeg'
    if logo.exists(): hp.add_run().add_picture(str(logo),width=Mm(9))
    r=hp.add_run('  ENCLAVE | CYBERSECURITY ASSESSMENT SERVICES');r.font.size=Pt(7);r.bold=True
    fp=s.footer.paragraphs[0];fp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    r=fp.add_run('CONFIDENTIAL - for the named recipient only | ');r.font.size=Pt(7)
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');fp._p.append(field)
    paragraph(d,kind.upper(),'Subtitle')
    paragraph(d,title,'Title')
    meta=f'Client: {client} | Reference: {reference}'
    if date: meta+=' | Date: '+str(date)[:10]
    if version is not None:meta+=' | Version: '+str(version)
    p=paragraph(d,meta);p.runs[0].font.size=Pt(8)
    if draft:
        p=paragraph(d,'DRAFT - FOR INTERNAL REVIEW ONLY',bold=True)
        p.runs[0].font.size=Pt(8);p.runs[0].font.color.rgb=RGBColor.from_string('9B3B25')
    d.core_properties.author=SUPPLIER;d.core_properties.title=title
    d.core_properties.subject=kind+' | Enclave template '+TEMPLATE_VERSION
    return d


def supplier(doc, company=None):
    c=company or {}
    text=f"Supplier: {c.get('legal_name_en') or SUPPLIER}, CR {c.get('commercial_registration_no') or '7054519124'} | {c.get('city') or 'Riyadh'}, Saudi Arabia | enclave.sa | legal@enclave.sa"
    p=paragraph(doc,text);p.runs[0].font.size=Pt(7.5)


def docx_bytes(doc):
    out=BytesIO();doc.save(out);return out.getvalue()


def pdf_from_docx(content):
    executable=os.environ.get('ENCLAVE_SOFFICE_BIN') or shutil.which('libreoffice') or shutil.which('soffice')
    if not executable:raise RuntimeError('LibreOffice Writer is required for matching DOCX/PDF proposals')
    with tempfile.TemporaryDirectory(prefix='enclave-proposal-') as tmp:
        root=Path(tmp);src=root/'proposal.docx';src.write_bytes(content)
        output=root/'pdf';output.mkdir()
        args=[executable,'-env:UserInstallation='+(root/'profile').as_uri(),'--headless','--convert-to','pdf:writer_pdf_Export','--outdir',str(output),str(src)]
        proc=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120,check=False)
        dest=output/'proposal.pdf'
        if proc.returncode or not dest.exists():raise RuntimeError('Proposal PDF conversion failed')
        data=dest.read_bytes()
        if not data.startswith(b'%PDF'):raise RuntimeError('Invalid generated PDF')
        return data


def technical_document(p):
    d=new_document('Technical Proposal',p['title'],p['client_name'],p['reference'],p.get('created_at'),p.get('version'),True)
    heading(d,'1. Overview and objective')
    paragraph(d,'This Technical Proposal sets out the scope of work, methodology, deliverables and engagement schedule for '+str(p['client_name'])+'. Pricing and payment terms are defined in the separate Financial Proposal and final contract.')
    for title,key in [('2. Scope of work','scope_text'),('3. Methodology and delivery assurance','methodology_text'),('4. Deliverables and evidence','deliverables_text'),('5. Engagement schedule','timeline_text'),('6. Assumptions and client prerequisites','assumptions_text'),('7. Exclusions','exclusions_text')]:
        heading(d,title)
        body(d,p.get(key) or 'To be confirmed for this engagement before issuance.')
    supplier(d)
    return d


def financial_document(p):
    q=p['quotation'];c=p['company'];currency=c.get('base_currency') or 'SAR'
    ref=q.get('external_quote_number') or f"Q-{str(q['id'])[:8].upper()}-V{q['version']}"
    d=new_document('Financial Proposal',q.get('opportunity_name') or 'Services and Commercial Proposal',q['client_name'],ref,q.get('created_at'),q['version'],q['status'] not in {'approved','active','accepted','won'})
    paragraph(d,'This Financial Proposal sets out the pricing and payment milestones for the services described below. Technical scope, methodology, deliverables, scheduling, acceptance criteria and rules of engagement are defined in the separate Technical Proposal and final contract.')
    if q.get('scope_summary'):body(d,q['scope_summary'])
    heading(d,'Payment schedule and invoicing')
    # Payment terms are authoritative prose, never inferred milestone amounts.
    if q.get('payment_terms'):
        schedule=[]
        for entry in str(q['payment_terms']).splitlines():
            entry=entry.strip()
            if not entry:continue
            label,separator,terms=entry.partition(':')
            if separator and len(label)<65:
                schedule.append((label,terms.strip()))
            else:
                schedule.append(('Agreed payment terms',entry))
        table(d,['Milestone','Payment terms and invoice timing'],schedule,[43,133])
    else:
        paragraph(d,'Payment milestones and invoice timing are to be confirmed before issuance.')
    heading(d,'Included service pricing')
    rows=[[x['description'],quantity(x['quantity']),money(x['unit_price']),money(x['net_amount_ex_vat'])] for x in p['lines']]
    table(d,['Service','Quantity',f'Unit rate ({currency})',f'Net amount excl. VAT ({currency})'],rows,[88,18,34,36])
    rows=[('Subtotal excl. VAT',money(q['subtotal_ex_vat'])),('Discount',money(q['discount_amount'])),('Net amount excl. VAT',money(q['net_revenue_ex_vat'])),('VAT ('+quantity(q['vat_rate_pct'])+'%)',money(q['vat_amount'])),('Total incl. VAT',money(q['total_inc_vat']))]
    table(d,['Fee summary',f'Amount ({currency})'],rows,[125,51])
    heading(d,'Commercial terms')
    paragraph(d,'Currency: '+currency+'.')
    if q.get('validity_date'):paragraph(d,'Validity: Until '+str(q['validity_date'])+'.')
    if c.get('vat_status')!='registered':
        if Decimal(str(q['vat_amount']))!=0:raise ValueError('VAT profile and quotation conflict; review before issuance')
        paragraph(d,'VAT: No VAT is charged; supplier VAT registration is not recorded.')
    else:paragraph(d,'VAT: The applicable tax rate and amounts are shown in the fee summary and will be reflected in the relevant invoices.')
    paragraph(d,'Additional requests: Services beyond the included scope require written authorization, scope confirmation and agreement on fees and scheduling before commencement.')
    supplier(d,c)
    return d
