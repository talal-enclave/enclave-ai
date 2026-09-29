"use client";

import { useEffect, useMemo, useState } from "react";

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
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : JSON.stringify(detail || data)
    );
  }

  return data;
}

export default function SalesLeadsPage() {
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [aging, setAging] = useState({ rows: [] });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    mobile: "",
    source: "",
    signal_date: today,
    owner_name: "",
  });

  async function load() {
    setError("");

    try {
      const [s, l, a] = await Promise.all([
        api("/api/sales/lead-summary"),
        api("/api/sales/leads"),
        api("/api/sales/lead-aging"),
      ]);

      setSummary(s);
      setLeads(l);
      setAging(a);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const agingMap = useMemo(
    () =>
      Object.fromEntries(
        (aging?.rows || []).map((x) => [x.lead_id, x])
      ),
    [aging]
  );

  async function createLead(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api("/api/sales/leads", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          contact_name: form.contact_name || null,
          email: form.email || null,
          mobile: form.mobile || null,
          owner_name: form.owner_name || null,
        }),
      });

      setForm({
        company_name: "",
        contact_name: "",
        email: "",
        mobile: "",
        source: "",
        signal_date: today,
        owner_name: "",
      });

      setMessage("تم تسجيل الـLead بعد فحص التكرار.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markContacted(row) {
    const nextStep = window.prompt("الخطوة التالية:");
    if (!nextStep) return;

    const nextDate = window.prompt(
      "تاريخ الخطوة YYYY-MM-DD:",
      today
    );
    if (!nextDate) return;

    try {
      await api(`/api/sales/leads/${row.id}/contacted`, {
        method: "POST",
        body: JSON.stringify({
          next_step: nextStep,
          next_step_date: nextDate,
          actor: "user",
        }),
      });

      setMessage("تم تحديث الـLead إلى Contacted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function qualify(row) {
    const fit = window.prompt("ملخص الملاءمة / Fit:");
    if (!fit) return;
    const need = window.prompt("الاحتياج:");
    if (!need) return;
    const relationship = window.prompt("صاحب العلاقة:");
    if (!relationship) return;
    const capacity = window.prompt("القدرة على الشراء / Budget path:");
    if (!capacity) return;
    const timing = window.prompt("التوقيت:");
    if (!timing) return;
    const nextStep = window.prompt("الخطوة التالية:");
    if (!nextStep) return;
    const nextDate = window.prompt("تاريخ الخطوة YYYY-MM-DD:", today);
    if (!nextDate) return;
    const evidence = window.prompt("دليل التأهيل:");
    if (!evidence) return;

    try {
      await api(`/api/sales/leads/${row.id}/qualify`, {
        method: "POST",
        body: JSON.stringify({
          fit_summary: fit,
          need_summary: need,
          relationship_owner: relationship,
          buying_capacity: capacity,
          timing,
          next_step: nextStep,
          next_step_date: nextDate,
          qualification_evidence: evidence,
          actor: "user",
        }),
      });

      setMessage("تم تأهيل الـLead. لم تُنشأ Opportunity تلقائيًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disqualify(row) {
    const reason = window.prompt("سبب عدم التأهيل:");
    if (!reason) return;

    try {
      await api(`/api/sales/leads/${row.id}/disqualify`, {
        method: "POST",
        body: JSON.stringify({
          reason,
          actor: "user",
        }),
      });

      setMessage("تم إغلاق الـLead بسبب واضح.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function convert(row) {
    const name = window.prompt("اسم الفرصة:");
    if (!name) return;
    const total = window.prompt("قيمة العقد المتوقعة قبل VAT:");
    if (!total) return;
    const period = window.prompt("قيمة الفترة قبل VAT:", total);
    if (!period) return;
    const cost = window.prompt("التكلفة المباشرة المتوقعة:", "0");
    if (cost == null) return;
    const closeDate = window.prompt("تاريخ الإغلاق المتوقع YYYY-MM-DD:");
    if (!closeDate) return;

    try {
      await api(`/api/sales/leads/${row.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          opportunity_name: name,
          total_contract_value_ex_vat: Number(total),
          period_value_ex_vat: Number(period),
          direct_cost_estimate: Number(cost || 0),
          expected_close_date: closeDate,
          forecast_category: "pipeline",
          opportunity_type: "new_business",
          actor: "user",
        }),
      });

      setMessage(
        "تم تحويل الـLead إلى Sales Account + Qualified Opportunity. لم يتم إنشاء Finance Customer."
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="ld-page" dir="rtl">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06131e; }
        .ld-page {
          min-height: 100vh;
          padding: 24px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }
        .ld-shell { max-width: 1500px; margin: 0 auto; }
        .ld-hero {
          background: #0b1d2d;
          color: white;
          border-radius: 19px;
          padding: 23px 25px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ld-hero h1 { margin: 6px 0; font-size: 31px; }
        .ld-hero p { color: #d9e7e6; max-width: 900px; line-height: 1.75; }
        .ld-links { display:flex; gap:8px; align-items:flex-start; }
        .ld-link {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 9px;
          padding: 9px 11px;
          font-size: 12px;
        }
        .ld-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
          gap:10px;
          margin:15px 0;
        }
        .ld-card,.ld-panel {
          background:#0b1d2d;
          border:1px solid #234a57;
          border-radius:13px;
        }
        .ld-card { padding:14px; }
        .ld-label { color:#8fb8b6; font-size:11px; }
        .ld-value { font-size:23px; font-weight:900; margin-top:5px; }
        .ld-panel { margin-bottom:15px; overflow:hidden; }
        .ld-head { padding:13px 15px; font-weight:900; border-bottom:1px solid #234a57; }
        .ld-body { padding:15px; }
        .ld-form {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
          gap:9px;
        }
        .ld-input {
          width:100%;
          border:1px solid #234a57;
          border-radius:9px;
          padding:9px;
          background:#0b1d2d;
        }
        .ld-button {
          border:0;
          border-radius:8px;
          background:#0b1d2d;
          color:white;
          padding:8px 10px;
          font-weight:800;
          cursor:pointer;
          font-size:11px;
        }
        .ld-button.secondary { background:#9bbfbd; }
        .ld-button.warn { background:#9a3412; }
        .ld-actions { display:flex; gap:5px; flex-wrap:wrap; }
        .ld-table-wrap { overflow:auto; border:1px solid #234a57; border-radius:10px; }
        .ld-table { width:100%; border-collapse:collapse; min-width:1200px; font-size:11px; }
        .ld-table th { text-align:right; background:#102735; color:#9bbfbd; padding:9px; }
        .ld-table td { padding:9px; border-top:1px solid #102735; vertical-align:top; }
        .ld-notice,.ld-error,.ld-success {
          margin:14px 0;
          padding:12px;
          border-radius:10px;
          font-size:12px;
          line-height:1.7;
        }
        .ld-notice { background:#332b17; border:1px solid #6b5a28; color:#f5c96b; }
        .ld-error { background:#321d26; border:1px solid #71404a; color:#ff9cac; }
        .ld-success { background:#0b302b; border:1px solid #2d6a5e; color:#72dfc7; }
        .ld-badge {
          display:inline-block;
          border-radius:999px;
          padding:3px 7px;
          background:#102735;
          color:#9bbfbd;
          font-size:10px;
        }
      `}</style>

      <div className="ld-shell">
        <section className="ld-hero">
          <div>
            <div className="ld-label">Sales Phase 1D</div>
            <h1>Leads والتأهيل</h1>
            <p>
              الـLead يبقى خارج الـQualified Pipeline حتى يثبت الملاءمة،
              الاحتياج، صاحب العلاقة، القدرة على الشراء، التوقيت والخطوة
              التالية. التحويل إلى Opportunity قرار صريح وليس تلقائيًا.
            </p>
          </div>
          <div className="ld-links">
            <a className="ld-link" href="/sales">Sales CRM</a>
            <a className="ld-link" href="/sales/operations">Operations</a>
          </div>
        </section>

        <div className="ld-notice">
          يمنع تكرار الـLeads النشطة حسب بيانات الاتصال، ولا يتم إنشاء Finance
          Customer أو Invoice أو إرسال تواصل خارجي من هذه الصفحة.
        </div>

        {error ? <div className="ld-error">{error}</div> : null}
        {message ? <div className="ld-success">{message}</div> : null}

        <div className="ld-grid">
          <div className="ld-card">
            <div className="ld-label">إجمالي Leads</div>
            <div className="ld-value">{summary?.total ?? "—"}</div>
          </div>
          <div className="ld-card">
            <div className="ld-label">Active</div>
            <div className="ld-value">{summary?.active ?? "—"}</div>
          </div>
          <div className="ld-card">
            <div className="ld-label">Qualified</div>
            <div className="ld-value">{summary?.by_status?.qualified ?? "—"}</div>
          </div>
          <div className="ld-card">
            <div className="ld-label">Converted</div>
            <div className="ld-value">{summary?.by_status?.converted ?? "—"}</div>
          </div>
          <div className="ld-card">
            <div className="ld-label">Needs Review</div>
            <div className="ld-value">{summary?.needs_review ?? "—"}</div>
          </div>
        </div>

        <section className="ld-panel">
          <div className="ld-head">Lead جديد</div>
          <div className="ld-body">
            <form className="ld-form" onSubmit={createLead}>
              <input className="ld-input" placeholder="الحساب / الشركة" value={form.company_name} onChange={(e)=>setForm({...form,company_name:e.target.value})} required />
              <input className="ld-input" placeholder="اسم الشخص" value={form.contact_name} onChange={(e)=>setForm({...form,contact_name:e.target.value})} />
              <input className="ld-input" type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
              <input className="ld-input" placeholder="Mobile" value={form.mobile} onChange={(e)=>setForm({...form,mobile:e.target.value})} />
              <input className="ld-input" placeholder="المصدر" value={form.source} onChange={(e)=>setForm({...form,source:e.target.value})} required />
              <input className="ld-input" type="date" value={form.signal_date} onChange={(e)=>setForm({...form,signal_date:e.target.value})} required />
              <input className="ld-input" placeholder="المالك" value={form.owner_name} onChange={(e)=>setForm({...form,owner_name:e.target.value})} />
              <button className="ld-button">تسجيل Lead</button>
            </form>
          </div>
        </section>

        <section className="ld-panel">
          <div className="ld-head">Lead Register</div>
          <div className="ld-body">
            <div className="ld-table-wrap">
              <table className="ld-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>الشركة</th>
                    <th>المصدر</th>
                    <th>المالك</th>
                    <th>الحالة</th>
                    <th>Next Step</th>
                    <th>Aging</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((row) => {
                    const age = agingMap[row.id];
                    return (
                      <tr key={row.id}>
                        <td><strong>{row.code}</strong><br/>{row.contact_name || "—"}</td>
                        <td>{row.company_name}</td>
                        <td>{row.source}</td>
                        <td>{row.owner_name || "—"}</td>
                        <td><span className="ld-badge">{row.status}</span></td>
                        <td>{row.next_step || "—"}<br/>{row.next_step_date || "—"}</td>
                        <td>{age ? `${age.days_since_update}d / ${age.severity}` : "—"}</td>
                        <td>
                          <div className="ld-actions">
                            {(row.status === "new" || row.status === "contacted") ? (
                              <button className="ld-button secondary" type="button" onClick={()=>markContacted(row)}>Contacted</button>
                            ) : null}
                            {["new","contacted","qualified"].includes(row.status) ? (
                              <button className="ld-button" type="button" onClick={()=>qualify(row)}>Qualify</button>
                            ) : null}
                            {row.status === "qualified" ? (
                              <button className="ld-button" type="button" onClick={()=>convert(row)}>Convert</button>
                            ) : null}
                            {!["converted","archived","unqualified"].includes(row.status) ? (
                              <button className="ld-button warn" type="button" onClick={()=>disqualify(row)}>Disqualify</button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
