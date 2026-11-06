"""Run in the API container after deployment. No new quotation/proposal records."""
import asyncio, json, uuid
from io import BytesIO
from zipfile import ZipFile
from pathlib import Path
from pypdf import PdfReader
from sqlalchemy import text
from app.database import SessionLocal
from app import main as m
from app.proposal_template import TEMPLATE_VERSION

TP='8467020f-522d-4fbd-b19d-807557ef79e7'
CONVERSATION=uuid.UUID('4c946256-d44c-4f65-a324-5fe0071d0938')
QUOTES=['5f059b39-1850-4dd1-97ec-26e3584bac0e','cf448f01-d6d7-489b-9c8a-94e0a7b3dc77']

async def protected(db):
    result={}
    for table in ('sales_quotations','sales_quotation_lines','sales_technical_proposals'):
        result[table]=(await db.execute(text('SELECT row_to_json(t)::text FROM '+table+' t ORDER BY id'))).scalars().all()
    return result

async def attachments(db):
    rows=(await db.execute(text('SELECT id::text, row_to_json(t)::text FROM hr_attachments t ORDER BY id'))).all()
    return dict(rows)

async def render_check(db, infos):
    import hashlib
    import urllib.request
    for info in infos:
        identifier=info['id']
        row=(await db.execute(text('SELECT storage_key, sha256, file_extension FROM hr_attachments WHERE id=:id'),{'id':uuid.UUID(str(identifier))})).mappings().one()
        path=m._hr_attachment_storage_path(row['storage_key'])
        data=path.read_bytes()
        assert hashlib.sha256(data).hexdigest()==row['sha256']
        if row['file_extension']=='.pdf':
            pdf=PdfReader(BytesIO(data));assert len(pdf.pages)>0
            assert 'CONFIDENTIAL' in ''.join(p.extract_text() for p in pdf.pages)
        else:
            with ZipFile(BytesIO(data)) as z:assert 'word/document.xml' in z.namelist()
        with urllib.request.urlopen('http://127.0.0.1:8000/api/hr/attachments/'+str(identifier)+'/download',timeout=30) as response:
            assert response.status==200
            assert hashlib.sha256(response.read()).hexdigest()==row['sha256']

async def run():
    assert TEMPLATE_VERSION=='1.5.2'
    async with SessionLocal() as db:
        before=await protected(db);old=await attachments(db)
        # Read-only preflight renders all targeted records before saving any new attachments.
        from app.technical_artifact_engine import generate_technical_proposal_docx,generate_technical_proposal_pdf
        proposal,reason=await m._ceo_exec_tp_resolve(db,'Shory',TP)
        assert proposal is not None, reason
        assert proposal['version']==1 and proposal['status']=='draft'
        payload=dict(proposal);payload['reference']='TP-8467020F-V1'
        assert generate_technical_proposal_docx(payload).startswith(b'PK')
        assert generate_technical_proposal_pdf(payload).startswith(b'%PDF')
        financial_targets=[]
        for qid in QUOTES:
            p=await m._artifact_financial_proposal_payload(db,uuid.UUID(qid))
            assert m._artifact_build_docx(p).startswith(b'PK')
            assert m._artifact_build_pdf(p).startswith(b'%PDF')
            # Keep the existing conversation associations for each financial quotation.
            cids=(await db.execute(text("SELECT DISTINCT entity_id FROM hr_attachments WHERE module='ceo_chat' AND entity_type='conversation' AND document_type IN ('financial_proposal_docx','financial_proposal_pdf') AND description LIKE :prefix AND status='active'"),{'prefix':'financial_proposal|quotation='+qid+'|%'})).scalars().all()
            financial_targets.append((uuid.UUID(qid),list(cids)))
        await db.rollback()
        print('All existing proposal payloads render: PASSED')
        for attempt in range(2):
            tp=await m._ceo_exec_tp_generate_artifacts(db,'Shory',CONVERSATION,proposal_id=TP)
            assert tp['status']=='executed' and tp['external_send'] is False
            infos=[]
            for a in tp['artifacts']:
                infos.append(a['sales_attachment'])
                if a['conversation_attachment']:infos.append(a['conversation_attachment'])
            await render_check(db,infos)
            for qid,cids in financial_targets:
                for cid in cids or [None]:
                    result=await m._artifact_generate_financial_proposal(db,qid,cid)
                    assert result['external_send'] is False
            current=await attachments(db)
            if attempt==0:
                first=set(current)
                rows=(await db.execute(text("SELECT id::text FROM hr_attachments WHERE original_file_name LIKE '%_T152.%' AND status='active'"))).scalars().all()
                assert len(rows)>=8
                await render_check(db,[{'id':x} for x in rows])
            else:assert set(current)==first, 'Repeat generation created duplicates'
            await db.rollback()
        assert await protected(db)==before, 'Protected business records changed'
        current=await attachments(db)
        assert all(current.get(k)==v for k,v in old.items()), 'An existing attachment was changed'
        print('Business records and old attachments: PRESERVED')
        print('New technical and financial files: GENERATED + DOWNLOAD VERIFIED')
        print('Repeated generation: NO DUPLICATE ATTACHMENTS')
        print('External send: NONE')
        new=(await db.execute(text("SELECT original_file_name, id::text FROM hr_attachments WHERE original_file_name LIKE '%_T152.%' AND module='ceo_chat' AND status='active' ORDER BY original_file_name"))).all()
        for name,i in new:print(name,'/api/hr/attachments/'+i+'/download')
        await db.rollback()

asyncio.run(run())
