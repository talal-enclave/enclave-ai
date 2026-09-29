"use client";

import { useEffect, useMemo, useState } from "react";

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
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

function money(value) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Card({ title, value, hint }) {
  return (
    <div className="so-card">
      <div className="so-label">{title}</div>
      <div className="so-value">{value}</div>
      {hint ? <div className="so-hint">{hint}</div> : null}
    </div>
  );
}

export default function SalesOperationsPage() {
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [collections, setCollections] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState({ items: [] });
  const [aging, setAging] = useState({ rows: [] });
  const [workload, setWorkload] = useState({ rows: [] });
  const [forecast, setForecast] = useState({ targets: [] });
  const [alerts, setAlerts] = useState({ alerts: [] });
  const [attachments, setAttachments] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadQuoteId, setUploadQuoteId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const [activityForm, setActivityForm] = useState({
    account_id: "",
    opportunity_id: "",
    collection_milestone_id: "",
    activity_type: "follow_up",
    subject: "",
    summary: "",
    activity_date: today,
    next_follow_up_date: "",
    status: "planned",
  });

  async function load() {
    setError("");

    try {
      const [
        s, a, o, c, q, act, fu, ag, w, f, al, att,
      ] = await Promise.all([
        api("/api/sales/phase1c-summary"),
        api("/api/sales/accounts"),
        api("/api/sales/opportunities"),
        api("/api/sales/collection-milestones"),
        api("/api/sales/quotations"),
        api("/api/sales/activities"),
        api(`/api/sales/follow-ups?through_date=${today}`),
        api("/api/sales/pipeline-aging"),
        api("/api/sales/account-manager-workload"),
        api(`/api/sales/forecast-dashboard?year=${new Date().getFullYear()}`),
        api("/api/sales/alerts"),
        api("/api/hr/attachments?module=sales&entity_type=quotation&status=active"),
      ]);

      setSummary(s);
      setAccounts(a);
      setOpportunities(o);
      setCollections(c);
      setQuotes(q);
      setActivities(act);
      setFollowUps(fu);
      setAging(ag);
      setWorkload(w);
      setForecast(f);
      setAlerts(al);
      setAttachments(att);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map((x) => [x.id, x])),
    [accounts]
  );

  const opportunityMap = useMemo(
    () => Object.fromEntries(opportunities.map((x) => [x.id, x])),
    [opportunities]
  );

  const quoteMap = useMemo(
    () => Object.fromEntries(quotes.map((x) => [x.id, x])),
    [quotes]
  );

  async function createActivity(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api("/api/sales/activities", {
        method: "POST",
        body: JSON.stringify({
          ...activityForm,
          opportunity_id: activityForm.opportunity_id || null,
          collection_milestone_id:
            activityForm.collection_milestone_id || null,
          next_follow_up_date:
            activityForm.next_follow_up_date || null,
          created_by: "user",
        }),
      });

      setActivityForm({
        account_id: "",
        opportunity_id: "",
        collection_milestone_id: "",
        activity_type: "follow_up",
        subject: "",
        summary: "",
        activity_date: today,
        next_follow_up_date: "",
        status: "planned",
      });

      setMessage("تم تسجيل النشاط بدون إرسال أي تواصل خارجي.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeActivity(row) {
    const outcome = window.prompt("النتيجة / Outcome - اختياري") || null;
    const next = window.prompt("موعد المتابعة التالية YYYY-MM-DD - اختياري") || null;

    try {
      await api(`/api/sales/activities/${row.id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          outcome,
          next_follow_up_date: next,
          completed_by: "user",
        }),
      });
      setMessage("تم إكمال النشاط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadQuoteAttachment(event) {
    event.preventDefault();

    if (!uploadQuoteId || !uploadFile) {
      setError("اختر العرض والملف.");
      return;
    }

    const form = new FormData();
    form.append("module", "sales");
    form.append("entity_type", "quotation");
    form.append("entity_id", uploadQuoteId);
    form.append("document_type", "commercial_quotation");
    form.append("uploaded_by", "user");
    form.append("confidentiality_level", "confidential");
    form.append("title", uploadFile.name);
    form.append("file", uploadFile);

    try {
      await api("/api/hr/attachments/upload", {
        method: "POST",
        body: form,
      });
      setUploadFile(null);
      setMessage("تم رفع المرفق إلى التخزين الموحد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="so-page" dir="rtl">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06131e; }
        .so-page {
          min-height: 100vh;
          padding: 24px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }
        .so-shell { max-width: 1600px; margin: 0 auto; }
        .so-hero {
          background: #0b1d2d;
          color: white;
          border-radius: 20px;
          padding: 24px 26px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .so-hero h1 { margin: 6px 0; font-size: 31px; }
        .so-hero p { color: #d9e7e6; max-width: 950px; line-height: 1.8; }
        .so-links { display: flex; gap: 8px; align-items: flex-start; }
        .so-link {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 9px;
          padding: 9px 11px;
          font-size: 12px;
        }
        .so-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
          gap: 11px;
          margin: 16px 0;
        }
        .so-card, .so-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 14px;
        }
        .so-card { padding: 14px; }
        .so-label { color: #8fb8b6; font-size: 11px; }
        .so-value { font-size: 23px; font-weight: 900; margin-top: 5px; }
        .so-hint { color: #71c8c1; font-size: 10px; margin-top: 5px; }
        .so-tabs {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin: 16px 0;
        }
        .so-tab {
          border: 1px solid #234a57;
          background: #0b1d2d;
          border-radius: 999px;
          padding: 8px 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .so-tab.active { background: #0b1d2d; color: white; }
        .so-panel { margin-bottom: 15px; overflow: hidden; }
        .so-head { padding: 13px 15px; border-bottom: 1px solid #234a57; font-weight: 900; }
        .so-body { padding: 15px; }
        .so-form {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap: 9px;
        }
        .so-input {
          width: 100%;
          border: 1px solid #234a57;
          border-radius: 9px;
          padding: 9px;
          background: #0b1d2d;
        }
        .so-button {
          border: 0;
          border-radius: 9px;
          background: #0b1d2d;
          color: white;
          padding: 9px 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .so-table-wrap { overflow: auto; border: 1px solid #234a57; border-radius: 10px; }
        .so-table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 11px; }
        .so-table th { background: #102735; color: #9bbfbd; padding: 9px; text-align: right; }
        .so-table td { padding: 9px; border-top: 1px solid #102735; vertical-align: top; }
        .so-notice, .so-error, .so-success {
          margin: 14px 0;
          padding: 12px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.7;
        }
        .so-notice { background: #332b17; border: 1px solid #6b5a28; color: #f5c96b; }
        .so-error { background: #321d26; border: 1px solid #71404a; color: #ff9cac; }
        .so-success { background: #0b302b; border: 1px solid #2d6a5e; color: #72dfc7; }
        .so-badge {
          display: inline-block;
          border-radius: 999px;
          padding: 3px 7px;
          background: #102735;
          color: #9bbfbd;
          font-size: 10px;
        }
      `}</style>

      <div className="so-shell">
        <section className="so-hero">
          <div>
            <div className="so-label">Sales Phase 1C</div>
            <h1>التشغيل والمتابعة التجارية</h1>
            <p>
              نشاطات ومتابعات، Aging أسبوعي للـPipeline، حمل Account Managers،
              Forecast مقابل Targets، تنبيهات، ومرفقات العروض. كل التنبيهات
              Review-only ولا تغير المرحلة أو ترسل للعميل تلقائيًا.
            </p>
          </div>
          <div className="so-links">
            <a className="so-link" href="/sales">Sales CRM</a>
            <a className="so-link" href="/">الرئيسية</a>
          </div>
        </section>

        <div className="so-notice">
          السياسة تتطلب تحديث الـPipeline أسبوعيًا ومراجعة التوقع شهريًا.
          النظام هنا يكشف التأخير فقط؛ لا يخفض مرحلة الفرصة ولا يغلقها تلقائيًا.
        </div>

        {error ? <div className="so-error">{error}</div> : null}
        {message ? <div className="so-success">{message}</div> : null}

        <div className="so-grid">
          <Card title="Activities" value={summary?.activities?.total ?? "—"} />
          <Card title="Planned" value={summary?.activities?.planned ?? "—"} />
          <Card title="Open Pipeline" value={summary?.pipeline?.open ?? "—"} />
          <Card title="Needs Review" value={summary?.pipeline?.needs_review ?? "—"} />
          <Card title="Due Follow-ups" value={followUps?.total ?? 0} />
          <Card title="Alerts" value={alerts?.total ?? 0} />
        </div>

        <div className="so-tabs">
          {[
            ["dashboard", "Dashboard"],
            ["activities", "Activities"],
            ["aging", "Pipeline Aging"],
            ["workload", "Workload"],
            ["forecast", "Forecast / Target"],
            ["alerts", "Alerts"],
            ["attachments", "Quote Attachments"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`so-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" ? (
          <>
            <section className="so-panel">
              <div className="so-head">Follow-ups المستحقة</div>
              <div className="so-body">
                <div className="so-table-wrap">
                  <table className="so-table">
                    <thead><tr><th>النوع</th><th>الفرصة</th><th>التاريخ</th><th>المتابعة</th></tr></thead>
                    <tbody>
                      {(followUps?.items || []).map((row, index) => (
                        <tr key={`${row.kind}-${row.source_id}-${index}`}>
                          <td>{row.kind}</td>
                          <td>{opportunityMap[row.opportunity_id]?.name || "—"}</td>
                          <td>{row.due_date}</td>
                          <td>{row.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "activities" ? (
          <>
            <section className="so-panel">
              <div className="so-head">تسجيل نشاط / متابعة</div>
              <div className="so-body">
                <form className="so-form" onSubmit={createActivity}>
                  <select className="so-input" value={activityForm.account_id} onChange={(e) => setActivityForm({...activityForm, account_id:e.target.value, opportunity_id:"", collection_milestone_id:""})} required>
                    <option value="">اختر الحساب</option>
                    {accounts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <select className="so-input" value={activityForm.opportunity_id} onChange={(e) => setActivityForm({...activityForm, opportunity_id:e.target.value, collection_milestone_id:""})}>
                    <option value="">بدون فرصة</option>
                    {opportunities.filter((x) => x.account_id === activityForm.account_id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <select className="so-input" value={activityForm.collection_milestone_id} onChange={(e) => setActivityForm({...activityForm, collection_milestone_id:e.target.value})}>
                    <option value="">بدون Collection Milestone</option>
                    {collections.filter((x) => !activityForm.opportunity_id || x.opportunity_id === activityForm.opportunity_id).map((x) => <option key={x.id} value={x.id}>{x.due_date} - {money(x.expected_amount_ex_vat)}</option>)}
                  </select>
                  <select className="so-input" value={activityForm.activity_type} onChange={(e) => setActivityForm({...activityForm, activity_type:e.target.value})}>
                    {["call","email","meeting","discovery","proposal","negotiation","procurement","follow_up","collection_follow_up","note","other"].map((x) => <option value={x} key={x}>{x}</option>)}
                  </select>
                  <input className="so-input" placeholder="الموضوع" value={activityForm.subject} onChange={(e) => setActivityForm({...activityForm, subject:e.target.value})} required />
                  <input className="so-input" placeholder="ملخص" value={activityForm.summary} onChange={(e) => setActivityForm({...activityForm, summary:e.target.value})} />
                  <input className="so-input" type="date" value={activityForm.activity_date} onChange={(e) => setActivityForm({...activityForm, activity_date:e.target.value})} required />
                  <input className="so-input" type="date" value={activityForm.next_follow_up_date} onChange={(e) => setActivityForm({...activityForm, next_follow_up_date:e.target.value})} />
                  <select className="so-input" value={activityForm.status} onChange={(e) => setActivityForm({...activityForm, status:e.target.value})}>
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button className="so-button">حفظ النشاط</button>
                </form>
              </div>
            </section>

            <section className="so-panel">
              <div className="so-head">سجل النشاط</div>
              <div className="so-body">
                <div className="so-table-wrap">
                  <table className="so-table">
                    <thead><tr><th>التاريخ</th><th>الحساب</th><th>الفرصة</th><th>النوع</th><th>الموضوع</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>
                      {activities.map((row) => (
                        <tr key={row.id}>
                          <td>{row.activity_date}</td>
                          <td>{accountMap[row.account_id]?.name || "—"}</td>
                          <td>{opportunityMap[row.opportunity_id]?.name || "—"}</td>
                          <td>{row.activity_type}</td>
                          <td>{row.subject}</td>
                          <td>{row.status}</td>
                          <td>{row.status === "planned" ? <button className="so-button" type="button" onClick={() => completeActivity(row)}>Complete</button> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "aging" ? (
          <section className="so-panel">
            <div className="so-head">Pipeline Aging</div>
            <div className="so-body">
              <div className="so-table-wrap">
                <table className="so-table">
                  <thead><tr><th>الفرصة</th><th>المالك</th><th>المرحلة</th><th>آخر Touch</th><th>الأيام</th><th>Next Step</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {(aging?.rows || []).map((row) => (
                      <tr key={row.opportunity_id}>
                        <td>{row.name}</td>
                        <td>{row.owner_name || "Unassigned"}</td>
                        <td>{row.stage} / {row.probability_pct}%</td>
                        <td>{row.last_touch_date}</td>
                        <td>{row.days_since_touch}</td>
                        <td>{row.next_step || "—"}<br/><span className="so-hint">{row.next_step_date || "—"}</span></td>
                        <td><span className="so-badge">{row.severity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "workload" ? (
          <section className="so-panel">
            <div className="so-head">Account Manager Workload</div>
            <div className="so-body">
              <div className="so-table-wrap">
                <table className="so-table">
                  <thead><tr><th>المالك</th><th>Open</th><th>Qualified</th><th>Pipeline</th><th>Weighted</th><th>GP Pipeline</th><th>No Next Step</th><th>Overdue</th></tr></thead>
                  <tbody>
                    {(workload?.rows || []).map((row) => (
                      <tr key={row.owner_name}>
                        <td>{row.owner_name}</td>
                        <td>{row.open_opportunities}</td>
                        <td>{row.qualified_opportunities}</td>
                        <td>{money(row.unweighted_pipeline_ex_vat)}</td>
                        <td>{money(row.weighted_pipeline_ex_vat)}</td>
                        <td>{money(row.gross_profit_pipeline)}</td>
                        <td>{row.no_next_step}</td>
                        <td>{row.overdue_next_step}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "forecast" ? (
          <section className="so-panel">
            <div className="so-head">Forecast مقابل Approved Targets</div>
            <div className="so-body">
              <div className="so-table-wrap">
                <table className="so-table">
                  <thead><tr><th>الفترة</th><th>المالك</th><th>المقياس</th><th>Target</th><th>Realized</th><th>Remaining</th><th>Qualified</th><th>Weighted</th><th>Coverage</th></tr></thead>
                  <tbody>
                    {(forecast?.targets || []).map((row) => (
                      <tr key={row.target_id}>
                        <td>{row.period_label}</td>
                        <td>{row.owner_name || "All"}</td>
                        <td>{row.metric}</td>
                        <td>{money(row.target_amount)}</td>
                        <td>{money(row.realized_amount)}</td>
                        <td>{money(row.remaining_amount)}</td>
                        <td>{money(row.qualified_pipeline)}</td>
                        <td>{money(row.weighted_pipeline)}</td>
                        <td>{row.coverage_ratio == null ? "—" : `${row.coverage_ratio.toFixed(2)}x`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "alerts" ? (
          <section className="so-panel">
            <div className="so-head">Sales Alerts</div>
            <div className="so-body">
              <div className="so-table-wrap">
                <table className="so-table">
                  <thead><tr><th>Severity</th><th>Type</th><th>Title</th><th>Message</th></tr></thead>
                  <tbody>
                    {(alerts?.alerts || []).map((row, index) => (
                      <tr key={`${row.entity_id}-${index}`}>
                        <td>{row.severity}</td>
                        <td>{row.type}</td>
                        <td>{row.title}</td>
                        <td>{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "attachments" ? (
          <>
            <section className="so-panel">
              <div className="so-head">رفع مرفق عرض</div>
              <div className="so-body">
                <form className="so-form" onSubmit={uploadQuoteAttachment}>
                  <select className="so-input" value={uploadQuoteId} onChange={(e) => setUploadQuoteId(e.target.value)} required>
                    <option value="">اختر العرض</option>
                    {quotes.map((x) => <option key={x.id} value={x.id}>{opportunityMap[x.opportunity_id]?.name || "Opportunity"} - v{x.version}</option>)}
                  </select>
                  <input className="so-input" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <button className="so-button">رفع</button>
                </form>
              </div>
            </section>

            <section className="so-panel">
              <div className="so-head">مرفقات العروض</div>
              <div className="so-body">
                <div className="so-table-wrap">
                  <table className="so-table">
                    <thead><tr><th>العرض</th><th>الملف</th><th>الحجم</th><th>التاريخ</th><th></th></tr></thead>
                    <tbody>
                      {attachments.map((row) => (
                        <tr key={row.id}>
                          <td>{quoteMap[row.entity_id]?.external_quote_number || row.entity_id}</td>
                          <td>{row.original_file_name}</td>
                          <td>{row.size_bytes}</td>
                          <td>{row.created_at}</td>
                          <td><a href={row.download_url}>Download</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
