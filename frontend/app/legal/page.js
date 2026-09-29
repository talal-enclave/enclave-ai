"use client";

import { useEffect, useState } from "react";

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data)
    );
  }

  return data;
}

export default function LegalPage() {
  const [summary, setSummary] = useState(null);
  const [references, setReferences] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [matters, setMatters] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [contractForm, setContractForm] = useState({
    contract_type: "nda",
    title: "",
    counterparty_name: "",
    owner_department: "",
    governing_law: "Kingdom of Saudi Arabia",
    jurisdiction: "Riyadh, Saudi Arabia",
    confidentiality_required: true,
    data_processing_involved: false,
    unlimited_liability: false,
    material_indemnity: false,
  });

  const [matterForm, setMatterForm] = useState({
    matter_type: "legal_advice",
    title: "",
    counterparty_name: "",
    owner: "Legal",
    risk_level: "medium",
    opened_date: new Date().toISOString().slice(0, 10),
    summary: "",
  });

  const [attachmentTarget, setAttachmentTarget] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);

  async function load() {
    try {
      const [s, r, c, m, a] = await Promise.all([
        api("/api/legal/summary"),
        api("/api/legal/reference-summary"),
        api("/api/legal/contracts"),
        api("/api/legal/matters"),
        api("/api/hr/attachments?module=legal&status=active"),
      ]);

      setSummary(s);
      setReferences(r);
      setContracts(c);
      setMatters(m);
      setAttachments(a);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createContract(event) {
    event.preventDefault();

    try {
      await api("/api/legal/contracts", {
        method: "POST",
        body: JSON.stringify({
          ...contractForm,
          owner_department:
            contractForm.owner_department || null,
        }),
      });

      setMessage("تم إنشاء سجل العقد كمسودة فقط.");
      setContractForm((x) => ({
        ...x,
        title: "",
        counterparty_name: "",
      }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addReview(row) {
    const deviations = window.prompt(
      "ملخص الانحرافات / الملاحظات القانونية:"
    );

    if (deviations === null) return;

    const highRisk =
      row.unlimited_liability ||
      row.material_indemnity;

    try {
      await api(`/api/legal/contracts/${row.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          review_type: highRisk ? "high_risk" : "deviation",
          risk_level: highRisk ? "critical" : "high",
          reviewer: "Legal",
          deviations_summary: deviations || null,
          recommendation:
            "Proceed only after required approval.",
        }),
      });

      setMessage("تم تسجيل المراجعة القانونية.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestApproval(id) {
    try {
      await api(`/api/legal/contracts/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });
      setMessage("تم إنشاء طلب الاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorize(id) {
    try {
      await api(`/api/legal/contracts/${id}/authorize`, {
        method: "POST",
      });
      setMessage("تم الاعتماد الداخلي. لا يوجد توقيع تلقائي.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function recordExecution(id) {
    const reference = window.prompt(
      "مرجع العقد/التوقيع المنفذ خارج النظام:"
    );

    if (!reference) return;

    try {
      await api(`/api/legal/contracts/${id}/record-execution`, {
        method: "POST",
        body: JSON.stringify({
          external_execution_reference: reference,
          recorded_by: "user",
        }),
      });
      setMessage("تم توثيق التنفيذ الخارجي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createMatter(event) {
    event.preventDefault();

    try {
      await api("/api/legal/matters", {
        method: "POST",
        body: JSON.stringify({
          ...matterForm,
          counterparty_name:
            matterForm.counterparty_name || null,
        }),
      });
      setMessage("تم إنشاء المسألة القانونية.");
      setMatterForm((x) => ({
        ...x,
        title: "",
        counterparty_name: "",
        summary: "",
      }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeMatter(id) {
    const outcome = window.prompt("ملخص النتيجة:");

    if (outcome === null) return;

    try {
      await api(`/api/legal/matters/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: "closed",
          actor: "user",
          outcome_summary: outcome || null,
        }),
      });
      setMessage("تم إقفال المسألة داخليًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadAttachment(event) {
    event.preventDefault();

    if (!attachmentTarget || !attachmentFile) return;

    const [entityType, entityId] =
      attachmentTarget.split(":");

    const body = new FormData();
    body.append("module", "legal");
    body.append("entity_type", entityType);
    body.append("entity_id", entityId);
    body.append("document_type", "legal_evidence");
    body.append("uploaded_by", "user");
    body.append(
      "confidentiality_level",
      "restricted"
    );
    body.append("title", attachmentFile.name);
    body.append("file", attachmentFile);

    try {
      const response = await fetch(
        "/api/hr/attachments/upload",
        {
          method: "POST",
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : JSON.stringify(data?.detail || data)
        );
      }

      setAttachmentFile(null);
      setMessage("تم حفظ الملف في Unified Attachments.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#06131e",
        color: "#f7fafc",
        fontFamily: "Arial,Segoe UI,sans-serif",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <section
          style={{
            background: "#0b1d2d",
            color: "white",
            borderRadius: 18,
            padding: 24,
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Legal Agent · القانونية والالتزام
          </h1>
          <p style={{ color: "#d9e7e6", lineHeight: 1.7 }}>
            سجل العقود وNDA والمراجعة القانونية والمسائل القانونية.
            Sales وProcurement وGovernment Compliance تبقى المصادر
            المرجعية ولا يتم تعديلها تلقائيًا.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/sales" style={{ color: "white" }}>
              Sales
            </a>
            <a href="/procurement" style={{ color: "white" }}>
              Procurement
            </a>
            <a href="/hr/government-compliance" style={{ color: "white" }}>
              Government Compliance
            </a>
            <a href="/hr/policies-compliance" style={{ color: "white" }}>
              Policies & Compliance
            </a>
            <a href="/legal/privacy-integrity" style={{ color: "white" }}>Privacy & Integrity</a>
            <a href="/legal/controls" style={{ color: "white" }}>Corporate Controls</a>
            <a href="/" style={{ color: "white" }}>
              الرئيسية
            </a>
          </div>
        </section>

        {error ? (
          <p style={{ background: "#321d26", padding: 12 }}>
            {error}
          </p>
        ) : null}

        {message ? (
          <p style={{ background: "#0b302b", padding: 12 }}>
            {message}
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: 10,
            margin: "16px 0",
          }}
        >
          {[
            ["العقود", summary?.contracts?.total],
            ["بانتظار الاعتماد", summary?.contracts?.pending_approval],
            ["منفذ خارجيًا", summary?.contracts?.executed],
            ["High-risk Terms", summary?.contracts?.high_risk_terms],
            ["المسائل المفتوحة", summary?.matters?.open],
            ["المرفقات", summary?.active_attachments],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#0b1d2d",
                padding: 15,
                borderRadius: 14,
              }}
            >
              <div style={{fontSize:11,color:"#8fb8b6"}}>
                {label}
              </div>
              <div style={{fontSize:23,fontWeight:900}}>
                {value ?? "—"}
              </div>
            </div>
          ))}
        </div>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Reference Boundaries</h3>
          <p>
            Sales Quotations: {references?.counts?.sales_quotations ?? "—"} |
            Procurement Quotations: {references?.counts?.procurement_quotations ?? "—"} |
            Corporate Compliance: {references?.counts?.corporate_compliance_records ?? "—"} |
            Policy Conflicts: {references?.counts?.policy_conflicts ?? "—"}
          </p>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Contract / NDA Register</h3>
          <form onSubmit={createContract} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
            <select
              value={contractForm.contract_type}
              onChange={(e)=>setContractForm({...contractForm,contract_type:e.target.value})}
            >
              <option value="nda">NDA</option>
              <option value="msa">MSA</option>
              <option value="services">Services</option>
              <option value="sow">SOW</option>
              <option value="dpa">DPA</option>
              <option value="client">Client Contract</option>
              <option value="vendor">Vendor Contract</option>
              <option value="partner">Partner</option>
              <option value="change_order">Change Order</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="عنوان العقد"
              value={contractForm.title}
              onChange={(e)=>setContractForm({...contractForm,title:e.target.value})}
              required
            />
            <input
              placeholder="الطرف المقابل"
              value={contractForm.counterparty_name}
              onChange={(e)=>setContractForm({...contractForm,counterparty_name:e.target.value})}
              required
            />
            <input
              placeholder="الإدارة المالكة"
              value={contractForm.owner_department}
              onChange={(e)=>setContractForm({...contractForm,owner_department:e.target.value})}
            />
            <label>
              <input
                type="checkbox"
                checked={contractForm.confidentiality_required}
                onChange={(e)=>setContractForm({...contractForm,confidentiality_required:e.target.checked})}
              />
              Confidentiality
            </label>
            <label>
              <input
                type="checkbox"
                checked={contractForm.data_processing_involved}
                onChange={(e)=>setContractForm({...contractForm,data_processing_involved:e.target.checked})}
              />
              Personal Data
            </label>
            <label>
              <input
                type="checkbox"
                checked={contractForm.unlimited_liability}
                onChange={(e)=>setContractForm({...contractForm,unlimited_liability:e.target.checked})}
              />
              Unlimited Liability
            </label>
            <label>
              <input
                type="checkbox"
                checked={contractForm.material_indemnity}
                onChange={(e)=>setContractForm({...contractForm,material_indemnity:e.target.checked})}
              />
              Material Indemnity
            </label>
            <button>إنشاء Draft</button>
          </form>

          {contracts.map((row)=>(
            <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
              <strong>{row.code}</strong> · {row.contract_type} · {row.counterparty_name} · {row.status}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                <button onClick={()=>addReview(row)}>Legal Review</button>
                <button onClick={()=>requestApproval(row.id)}>Request Approval</button>
                <button onClick={()=>authorize(row.id)}>Authorize</button>
                <button onClick={()=>recordExecution(row.id)}>Record External Execution</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Legal Matters</h3>
          <form onSubmit={createMatter} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
            <select
              value={matterForm.matter_type}
              onChange={(e)=>setMatterForm({...matterForm,matter_type:e.target.value})}
            >
              <option value="legal_advice">Legal Advice</option>
              <option value="dispute">Dispute</option>
              <option value="claim">Claim</option>
              <option value="regulatory">Regulatory</option>
              <option value="intellectual_property">IP</option>
              <option value="contract_issue">Contract Issue</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="العنوان"
              value={matterForm.title}
              onChange={(e)=>setMatterForm({...matterForm,title:e.target.value})}
              required
            />
            <input
              placeholder="الطرف المقابل"
              value={matterForm.counterparty_name}
              onChange={(e)=>setMatterForm({...matterForm,counterparty_name:e.target.value})}
            />
            <select
              value={matterForm.risk_level}
              onChange={(e)=>setMatterForm({...matterForm,risk_level:e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              type="date"
              value={matterForm.opened_date}
              onChange={(e)=>setMatterForm({...matterForm,opened_date:e.target.value})}
              required
            />
            <input
              placeholder="ملخص المسألة"
              value={matterForm.summary}
              onChange={(e)=>setMatterForm({...matterForm,summary:e.target.value})}
              required
            />
            <button>إنشاء Matter</button>
          </form>

          {matters.map((row)=>(
            <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
              <strong>{row.code}</strong> · {row.matter_type} · {row.risk_level} · {row.status}
              {row.status !== "closed" ? (
                <button
                  style={{marginRight:8}}
                  onClick={()=>closeMatter(row.id)}
                >
                  Close
                </button>
              ) : null}
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Unified Legal Evidence</h3>
          <form onSubmit={uploadAttachment} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select
              value={attachmentTarget}
              onChange={(e)=>setAttachmentTarget(e.target.value)}
              required
            >
              <option value="">اختر السجل</option>
              {contracts.map((x)=>(
                <option key={`contract-${x.id}`} value={`contract:${x.id}`}>
                  Contract · {x.code}
                </option>
              ))}
              {matters.map((x)=>(
                <option key={`matter-${x.id}`} value={`legal_matter:${x.id}`}>
                  Matter · {x.code}
                </option>
              ))}
            </select>
            <input
              type="file"
              onChange={(e)=>setAttachmentFile(e.target.files?.[0] || null)}
              required
            />
            <button>رفع ملف</button>
          </form>
          <p>Active Legal Attachments: {attachments.length}</p>
        </section>
      </div>
    </main>
  );
}
