"use client";

import { useEffect, useMemo, useState } from "react";

const API = "/api/sales";

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

function money(value) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Card({ title, value, hint }) {
  return (
    <div className="sc-card">
      <div className="sc-card-title">{title}</div>
      <div className="sc-card-value">{value}</div>
      {hint ? <div className="sc-card-hint">{hint}</div> : null}
    </div>
  );
}

export default function SalesPage() {
  const [summary, setSummary] = useState(null);
  const [phase1b, setPhase1b] = useState(null);
  const [stages, setStages] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [targets, setTargets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState("pipeline");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [accountForm, setAccountForm] = useState({
    name: "",
    sector: "",
    account_type: "prospect",
    tier: "",
    owner_name: "",
    source: "",
  });

  const [oppForm, setOppForm] = useState({
    account_id: "",
    name: "",
    owner_name: "",
    opportunity_type: "new_business",
    forecast_category: "pipeline",
    total_contract_value_ex_vat: "",
    period_value_ex_vat: "",
    discount_amount: "",
    direct_cost_estimate: "",
    expected_close_date: "",
    next_step: "",
    next_step_date: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    opportunity_id: "",
    external_quote_number: "",
    description: "",
    quantity: "1",
    unit_price: "",
    direct_cost: "",
    discount_amount: "",
    vat_rate_pct: "0",
    validity_date: "",
    payment_terms: "",
  });

  const [targetForm, setTargetForm] = useState({
    year: "2026",
    period_label: "",
    start_date: "",
    end_date: "",
    target_metric: "gross_profit",
    target_amount: "",
    coverage_multiplier: "",
  });

  const [collectionForm, setCollectionForm] = useState({
    opportunity_id: "",
    quotation_id: "",
    due_date: "",
    expected_amount_ex_vat: "",
  });

  const [commissionForm, setCommissionForm] = useState({
    name: "",
    employee_id: "",
    year: "2026",
    period_label: "",
    target_amount: "",
    commission_rate_pct: "",
  });

  async function load() {
    setError("");

    try {
      const [s, b, st, a, o, q, t, c, cp, e] = await Promise.all([
        api(`${API}/summary`),
        api(`${API}/phase1b-summary`),
        api(`${API}/stages`),
        api(`${API}/accounts`),
        api(`${API}/opportunities`),
        api(`${API}/quotations`),
        api(`${API}/targets`),
        api(`${API}/collection-milestones`),
        api(`${API}/commission-plans`),
        api("/api/hr/employees"),
      ]);

      setSummary(s);
      setPhase1b(b);
      setStages(st);
      setAccounts(a);
      setOpportunities(o);
      setQuotes(q);
      setTargets(t);
      setCollections(c);
      setCommissions(cp);
      setEmployees(e);
    } catch (err) {
      setError(err?.message || "Unable to load Sales CRM");
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

  async function createAccount(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/accounts`, {
        method: "POST",
        body: JSON.stringify({
          ...accountForm,
          tier: accountForm.tier || null,
          owner_name: accountForm.owner_name || null,
          sector: accountForm.sector || null,
          source: accountForm.source || null,
        }),
      });

      setAccountForm({
        name: "",
        sector: "",
        account_type: "prospect",
        tier: "",
        owner_name: "",
        source: "",
      });

      setMessage("تم إنشاء الحساب.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createOpportunity(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/opportunities`, {
        method: "POST",
        body: JSON.stringify({
          ...oppForm,
          total_contract_value_ex_vat:
            Number(oppForm.total_contract_value_ex_vat || 0),
          period_value_ex_vat:
            Number(oppForm.period_value_ex_vat || 0),
          discount_amount:
            Number(oppForm.discount_amount || 0),
          direct_cost_estimate:
            Number(oppForm.direct_cost_estimate || 0),
          expected_close_date:
            oppForm.expected_close_date || null,
          next_step_date:
            oppForm.next_step_date || null,
          owner_name: oppForm.owner_name || null,
          next_step: oppForm.next_step || null,
        }),
      });

      setMessage("تم إنشاء الفرصة في المرحلة 0.");
      setOppForm({
        account_id: "",
        name: "",
        owner_name: "",
        opportunity_type: "new_business",
        forecast_category: "pipeline",
        total_contract_value_ex_vat: "",
        period_value_ex_vat: "",
        discount_amount: "",
        direct_cost_estimate: "",
        expected_close_date: "",
        next_step: "",
        next_step_date: "",
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function moveStage(row, value) {
    const target = Number(value);
    if (target === row.stage) return;

    let evidence = null;
    let binding = null;
    let lossReason = null;

    if (target >= 2 && target <= 7) {
      evidence = window.prompt("دليل الانتقال للمرحلة:");
      if (!evidence) return;
    }

    if (target === 8) {
      binding = window.prompt("مرجع العقد النافذ أو أمر الشراء:");
      if (!binding) return;
    }

    if (target === 9) {
      lossReason = window.prompt("سبب الخسارة:");
      if (!lossReason) return;
    }

    try {
      await api(`${API}/opportunities/${row.id}/stage`, {
        method: "POST",
        body: JSON.stringify({
          stage: target,
          evidence,
          binding_document_reference: binding,
          loss_reason: lossReason,
          changed_by: "user",
        }),
      });
      setMessage("تم تحديث المرحلة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createQuote(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/quotations`, {
        method: "POST",
        body: JSON.stringify({
          opportunity_id: quoteForm.opportunity_id,
          external_quote_number:
            quoteForm.external_quote_number || null,
          discount_amount:
            Number(quoteForm.discount_amount || 0),
          vat_rate_pct:
            Number(quoteForm.vat_rate_pct || 0),
          validity_date:
            quoteForm.validity_date || null,
          payment_terms:
            quoteForm.payment_terms || null,
          lines: [
            {
              description: quoteForm.description,
              quantity: Number(quoteForm.quantity || 1),
              unit_price: Number(quoteForm.unit_price || 0),
              direct_cost: Number(quoteForm.direct_cost || 0),
            },
          ],
        }),
      });

      setMessage("تم إنشاء العرض كمسودة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTarget(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/targets`, {
        method: "POST",
        body: JSON.stringify({
          ...targetForm,
          year: Number(targetForm.year),
          target_amount: Number(targetForm.target_amount || 0),
          coverage_multiplier:
            targetForm.coverage_multiplier
              ? Number(targetForm.coverage_multiplier)
              : null,
        }),
      });

      setMessage("تم إنشاء التارقت كمسودة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createCollection(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/collection-milestones`, {
        method: "POST",
        body: JSON.stringify({
          opportunity_id: collectionForm.opportunity_id,
          quotation_id:
            collectionForm.quotation_id || null,
          due_date: collectionForm.due_date,
          expected_amount_ex_vat:
            Number(collectionForm.expected_amount_ex_vat || 0),
        }),
      });

      setMessage("تم إنشاء موعد التحصيل.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createCommission(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`${API}/commission-plans`, {
        method: "POST",
        body: JSON.stringify({
          ...commissionForm,
          year: Number(commissionForm.year),
          target_amount: Number(commissionForm.target_amount || 0),
          commission_rate_pct:
            Number(commissionForm.commission_rate_pct || 0),
        }),
      });

      setMessage("تم إنشاء خطة العمولة كمسودة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="sc-page" dir="rtl">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06131e; }
        .sc-page {
          min-height: 100vh;
          padding: 24px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }
        .sc-shell { max-width: 1600px; margin: 0 auto; }
        .sc-hero {
          background: #0b1d2d;
          color: white;
          border-radius: 20px;
          padding: 24px 26px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .sc-hero h1 { margin: 6px 0 0; font-size: 32px; }
        .sc-hero p {
          color: #d9e7e6;
          line-height: 1.8;
          max-width: 980px;
        }
        .sc-back {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 10px;
          padding: 9px 12px;
          height: fit-content;
        }
        .sc-notice, .sc-error, .sc-success {
          margin: 14px 0;
          padding: 12px 14px;
          border-radius: 11px;
          line-height: 1.7;
          font-size: 12px;
        }
        .sc-notice {
          background: #332b17;
          border: 1px solid #6b5a28;
          color: #f5c96b;
        }
        .sc-error {
          background: #321d26;
          border: 1px solid #71404a;
          color: #ff9cac;
        }
        .sc-success {
          background: #0b302b;
          border: 1px solid #2d6a5e;
          color: #72dfc7;
        }
        .sc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
          gap: 11px;
          margin: 17px 0;
        }
        .sc-card, .sc-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 14px;
        }
        .sc-card { padding: 14px; }
        .sc-card-title { color: #8fb8b6; font-size: 11px; }
        .sc-card-value { font-size: 23px; font-weight: 900; margin-top: 6px; }
        .sc-card-hint { color: #71c8c1; font-size: 10px; margin-top: 5px; }
        .sc-tabs {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin: 17px 0;
        }
        .sc-tab {
          border: 1px solid #234a57;
          background: #0b1d2d;
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .sc-tab.active { background: #0b1d2d; color: white; }
        .sc-panel { margin-bottom: 16px; overflow: hidden; }
        .sc-head { padding: 14px 16px; border-bottom: 1px solid #234a57; font-weight: 900; }
        .sc-body { padding: 16px; }
        .sc-form {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap: 9px;
        }
        .sc-input {
          width: 100%;
          border: 1px solid #234a57;
          border-radius: 9px;
          padding: 9px;
          background: #0b1d2d;
        }
        .sc-button {
          border: 0;
          border-radius: 9px;
          background: #0b1d2d;
          color: white;
          padding: 9px 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .sc-table-wrap { overflow: auto; border: 1px solid #234a57; border-radius: 10px; }
        .sc-table { width: 100%; border-collapse: collapse; min-width: 950px; font-size: 11px; }
        .sc-table th { text-align: right; background: #102735; color: #9bbfbd; padding: 9px; }
        .sc-table td { padding: 9px; border-top: 1px solid #102735; vertical-align: top; }
        .sc-muted { color: #8fb8b6; font-size: 10px; }
      `}</style>

      <div className="sc-shell">
        <section className="sc-hero">
          <div>
            <div className="sc-muted">Sales & CRM Agent</div>
            <h1>المبيعات وإدارة العملاء</h1>
            <p>
              Pipeline مبني على الأدلة، عروض تجارية مع اعتماد، تارقت لا يعمل
              قبل الاعتماد، تحصيل مثبت من Finance فقط، وعمولات لا تتحول لدفع
              أو Payroll تلقائيًا.
            </p>
          </div>
          <a className="sc-back" href="/">الرئيسية</a>
        </section>

        <div className="sc-notice">
          30% حد الهامش، 40% الهدف، و10% العمولة أرقام مقترحة في مسودة
          السياسة وليست إعدادات ملزمة تلقائيًا. VAT الموجب محظور حتى يتم
          توثيق VAT Registration في Company Profile.
        </div>

        {error ? <div className="sc-error">{error}</div> : null}
        {message ? <div className="sc-success">{message}</div> : null}

        <div className="sc-grid">
          <Card title="الحسابات" value={summary?.accounts?.total ?? "—"} />
          <Card title="الفرص المفتوحة" value={summary?.opportunities?.open ?? "—"} />
          <Card
            title="Pipeline مؤهل"
            value={money(summary?.pipeline?.qualified_unweighted_ex_vat)}
            hint="قبل VAT"
          />
          <Card
            title="Pipeline موزون"
            value={money(summary?.pipeline?.weighted_ex_vat)}
            hint="ليس Commit"
          />
          <Card title="العروض" value={phase1b?.counts?.quotations ?? "—"} />
          <Card title="مواعيد التحصيل" value={phase1b?.counts?.collection_milestones ?? "—"} />
        </div>

        <div className="sc-tabs">
          {[
            ["pipeline", "Pipeline"],
            ["accounts", "الحسابات"],
            ["quotes", "العروض"],
            ["targets", "التارقت"],
            ["collections", "التحصيل"],
            ["commissions", "العمولات"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`sc-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "accounts" ? (
          <section className="sc-panel">
            <div className="sc-head">إضافة حساب</div>
            <div className="sc-body">
              <form className="sc-form" onSubmit={createAccount}>
                <input className="sc-input" placeholder="اسم الحساب" value={accountForm.name} onChange={(e) => setAccountForm({...accountForm, name:e.target.value})} required />
                <input className="sc-input" placeholder="القطاع" value={accountForm.sector} onChange={(e) => setAccountForm({...accountForm, sector:e.target.value})} />
                <select className="sc-input" value={accountForm.account_type} onChange={(e) => setAccountForm({...accountForm, account_type:e.target.value})}>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                  <option value="government">Government</option>
                </select>
                <select className="sc-input" value={accountForm.tier} onChange={(e) => setAccountForm({...accountForm, tier:e.target.value})}>
                  <option value="">بدون Tier</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <input className="sc-input" placeholder="المالك" value={accountForm.owner_name} onChange={(e) => setAccountForm({...accountForm, owner_name:e.target.value})} />
                <input className="sc-input" placeholder="المصدر" value={accountForm.source} onChange={(e) => setAccountForm({...accountForm, source:e.target.value})} />
                <button className="sc-button">إضافة</button>
              </form>
            </div>
          </section>
        ) : null}

        {tab === "pipeline" ? (
          <>
            <section className="sc-panel">
              <div className="sc-head">إنشاء فرصة</div>
              <div className="sc-body">
                <form className="sc-form" onSubmit={createOpportunity}>
                  <select className="sc-input" value={oppForm.account_id} onChange={(e) => setOppForm({...oppForm, account_id:e.target.value})} required>
                    <option value="">اختر الحساب</option>
                    {accounts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input className="sc-input" placeholder="اسم الفرصة" value={oppForm.name} onChange={(e) => setOppForm({...oppForm, name:e.target.value})} required />
                  <input className="sc-input" placeholder="المالك" value={oppForm.owner_name} onChange={(e) => setOppForm({...oppForm, owner_name:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="قيمة العقد قبل VAT" value={oppForm.total_contract_value_ex_vat} onChange={(e) => setOppForm({...oppForm, total_contract_value_ex_vat:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="قيمة الفترة" value={oppForm.period_value_ex_vat} onChange={(e) => setOppForm({...oppForm, period_value_ex_vat:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="الخصم" value={oppForm.discount_amount} onChange={(e) => setOppForm({...oppForm, discount_amount:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="التكلفة المباشرة" value={oppForm.direct_cost_estimate} onChange={(e) => setOppForm({...oppForm, direct_cost_estimate:e.target.value})} />
                  <input className="sc-input" type="date" value={oppForm.expected_close_date} onChange={(e) => setOppForm({...oppForm, expected_close_date:e.target.value})} />
                  <input className="sc-input" placeholder="الخطوة التالية" value={oppForm.next_step} onChange={(e) => setOppForm({...oppForm, next_step:e.target.value})} />
                  <input className="sc-input" type="date" value={oppForm.next_step_date} onChange={(e) => setOppForm({...oppForm, next_step_date:e.target.value})} />
                  <button className="sc-button">إنشاء الفرصة</button>
                </form>
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-head">الـPipeline</div>
              <div className="sc-body">
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>الفرصة</th><th>الحساب</th><th>المرحلة</th><th>الاحتمال</th><th>قيمة الفترة</th><th>الموزون</th><th>الربح</th><th>الهامش</th></tr></thead>
                    <tbody>
                      {opportunities.map((row) => (
                        <tr key={row.id}>
                          <td><strong>{row.name}</strong><br/><span className="sc-muted">{row.code}</span></td>
                          <td>{accountMap[row.account_id]?.name || "—"}</td>
                          <td>
                            <select className="sc-input" value={row.stage} onChange={(e) => moveStage(row, e.target.value)}>
                              {stages.map((s) => <option key={s.stage} value={s.stage}>{s.stage} - {s.name_ar}</option>)}
                            </select>
                          </td>
                          <td>{row.probability_pct}%</td>
                          <td>{money(row.period_value_ex_vat)}</td>
                          <td>{money(row.weighted_pipeline_value)}</td>
                          <td>{money(row.gross_profit)}</td>
                          <td>{Number(row.gross_margin_pct || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "quotes" ? (
          <>
            <section className="sc-panel">
              <div className="sc-head">عرض تجاري جديد</div>
              <div className="sc-body">
                <form className="sc-form" onSubmit={createQuote}>
                  <select className="sc-input" value={quoteForm.opportunity_id} onChange={(e) => setQuoteForm({...quoteForm, opportunity_id:e.target.value})} required>
                    <option value="">اختر الفرصة</option>
                    {opportunities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input className="sc-input" placeholder="رقم العرض الخارجي - اختياري" value={quoteForm.external_quote_number} onChange={(e) => setQuoteForm({...quoteForm, external_quote_number:e.target.value})} />
                  <input className="sc-input" placeholder="وصف البند" value={quoteForm.description} onChange={(e) => setQuoteForm({...quoteForm, description:e.target.value})} required />
                  <input className="sc-input" type="number" min="0.0001" step="0.0001" placeholder="الكمية" value={quoteForm.quantity} onChange={(e) => setQuoteForm({...quoteForm, quantity:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="سعر الوحدة" value={quoteForm.unit_price} onChange={(e) => setQuoteForm({...quoteForm, unit_price:e.target.value})} required />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="التكلفة المباشرة للبند" value={quoteForm.direct_cost} onChange={(e) => setQuoteForm({...quoteForm, direct_cost:e.target.value})} />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="الخصم" value={quoteForm.discount_amount} onChange={(e) => setQuoteForm({...quoteForm, discount_amount:e.target.value})} />
                  <input className="sc-input" type="number" min="0" max="100" step="0.01" placeholder="VAT %" value={quoteForm.vat_rate_pct} onChange={(e) => setQuoteForm({...quoteForm, vat_rate_pct:e.target.value})} />
                  <input className="sc-input" type="date" value={quoteForm.validity_date} onChange={(e) => setQuoteForm({...quoteForm, validity_date:e.target.value})} />
                  <input className="sc-input" placeholder="شروط الدفع" value={quoteForm.payment_terms} onChange={(e) => setQuoteForm({...quoteForm, payment_terms:e.target.value})} />
                  <button className="sc-button">إنشاء Draft</button>
                </form>
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-head">العروض</div>
              <div className="sc-body">
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>الفرصة</th><th>الإصدار</th><th>الرقم الخارجي</th><th>الصافي</th><th>الربح</th><th>الهامش</th><th>VAT</th><th>الحالة</th></tr></thead>
                    <tbody>
                      {quotes.map((row) => (
                        <tr key={row.id}>
                          <td>{opportunityMap[row.opportunity_id]?.name || "—"}</td>
                          <td>{row.version}</td>
                          <td>{row.external_quote_number || "—"}</td>
                          <td>{money(row.net_revenue_ex_vat)}</td>
                          <td>{money(row.gross_profit)}</td>
                          <td>{Number(row.gross_margin_pct || 0).toFixed(1)}%</td>
                          <td>{Number(row.vat_rate_pct || 0).toFixed(2)}%</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "targets" ? (
          <>
            <section className="sc-panel">
              <div className="sc-head">Target جديد</div>
              <div className="sc-body">
                <form className="sc-form" onSubmit={createTarget}>
                  <input className="sc-input" type="number" value={targetForm.year} onChange={(e) => setTargetForm({...targetForm, year:e.target.value})} />
                  <input className="sc-input" placeholder="اسم الفترة" value={targetForm.period_label} onChange={(e) => setTargetForm({...targetForm, period_label:e.target.value})} required />
                  <input className="sc-input" type="date" value={targetForm.start_date} onChange={(e) => setTargetForm({...targetForm, start_date:e.target.value})} required />
                  <input className="sc-input" type="date" value={targetForm.end_date} onChange={(e) => setTargetForm({...targetForm, end_date:e.target.value})} required />
                  <select className="sc-input" value={targetForm.target_metric} onChange={(e) => setTargetForm({...targetForm, target_metric:e.target.value})}>
                    <option value="gross_profit">Gross Profit</option>
                    <option value="net_revenue">Net Revenue</option>
                    <option value="collection">Collection</option>
                  </select>
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="قيمة التارقت" value={targetForm.target_amount} onChange={(e) => setTargetForm({...targetForm, target_amount:e.target.value})} required />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="Coverage - اختياري" value={targetForm.coverage_multiplier} onChange={(e) => setTargetForm({...targetForm, coverage_multiplier:e.target.value})} />
                  <button className="sc-button">إنشاء Draft</button>
                </form>
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-head">التارقت</div>
              <div className="sc-body">
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>الفترة</th><th>المقياس</th><th>القيمة</th><th>Coverage</th><th>الحالة</th></tr></thead>
                    <tbody>
                      {targets.map((row) => (
                        <tr key={row.id}>
                          <td>{row.period_label}<br/><span className="sc-muted">{row.start_date} → {row.end_date}</span></td>
                          <td>{row.target_metric}</td>
                          <td>{money(row.target_amount)}</td>
                          <td>{row.coverage_multiplier ?? "—"}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "collections" ? (
          <>
            <section className="sc-panel">
              <div className="sc-head">موعد تحصيل</div>
              <div className="sc-body">
                <form className="sc-form" onSubmit={createCollection}>
                  <select className="sc-input" value={collectionForm.opportunity_id} onChange={(e) => setCollectionForm({...collectionForm, opportunity_id:e.target.value, quotation_id:""})} required>
                    <option value="">اختر الفرصة</option>
                    {opportunities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <select className="sc-input" value={collectionForm.quotation_id} onChange={(e) => setCollectionForm({...collectionForm, quotation_id:e.target.value})}>
                    <option value="">بدون ربط بعرض</option>
                    {quotes.filter((x) => x.opportunity_id === collectionForm.opportunity_id).map((x) => <option key={x.id} value={x.id}>v{x.version} - {money(x.net_revenue_ex_vat)}</option>)}
                  </select>
                  <input className="sc-input" type="date" value={collectionForm.due_date} onChange={(e) => setCollectionForm({...collectionForm, due_date:e.target.value})} required />
                  <input className="sc-input" type="number" min="0" step="0.01" placeholder="المبلغ المتوقع قبل VAT" value={collectionForm.expected_amount_ex_vat} onChange={(e) => setCollectionForm({...collectionForm, expected_amount_ex_vat:e.target.value})} required />
                  <button className="sc-button">إضافة</button>
                </form>
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-head">التحصيل</div>
              <div className="sc-body">
                <div className="sc-notice" style={{marginTop:0}}>
                  التحصيل لا يعتبر مثبتًا إلا بعد وجود Finance Customer Link وربط Finance Invoice Receipt بحالة Applied.
                </div>
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>الفرصة</th><th>الاستحقاق</th><th>المتوقع</th><th>المثبت من Finance</th><th>الحالة</th></tr></thead>
                    <tbody>
                      {collections.map((row) => (
                        <tr key={row.id}>
                          <td>{opportunityMap[row.opportunity_id]?.name || "—"}</td>
                          <td>{row.due_date}</td>
                          <td>{money(row.expected_amount_ex_vat)}</td>
                          <td>{money(row.verified_amount_ex_vat)}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === "commissions" ? (
          <>
            <section className="sc-panel">
              <div className="sc-head">خطة عمولة</div>
              <div className="sc-body">
                {employees.length === 0 ? (
                  <div className="sc-notice" style={{margin:0}}>
                    لا يوجد موظفون حاليًا، لذلك لا يمكن إنشاء خطة عمولة فعلية. النظام لن يخترع موظفًا أو استحقاقًا.
                  </div>
                ) : (
                  <form className="sc-form" onSubmit={createCommission}>
                    <input className="sc-input" placeholder="اسم الخطة" value={commissionForm.name} onChange={(e) => setCommissionForm({...commissionForm, name:e.target.value})} required />
                    <select className="sc-input" value={commissionForm.employee_id} onChange={(e) => setCommissionForm({...commissionForm, employee_id:e.target.value})} required>
                      <option value="">اختر الموظف</option>
                      {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name_ar || x.full_name_en || x.employee_number}</option>)}
                    </select>
                    <input className="sc-input" type="number" value={commissionForm.year} onChange={(e) => setCommissionForm({...commissionForm, year:e.target.value})} />
                    <input className="sc-input" placeholder="الفترة" value={commissionForm.period_label} onChange={(e) => setCommissionForm({...commissionForm, period_label:e.target.value})} required />
                    <input className="sc-input" type="number" min="0" step="0.01" placeholder="التارقت" value={commissionForm.target_amount} onChange={(e) => setCommissionForm({...commissionForm, target_amount:e.target.value})} required />
                    <input className="sc-input" type="number" min="0" max="100" step="0.01" placeholder="نسبة العمولة %" value={commissionForm.commission_rate_pct} onChange={(e) => setCommissionForm({...commissionForm, commission_rate_pct:e.target.value})} required />
                    <button className="sc-button">إنشاء Draft</button>
                  </form>
                )}
              </div>
            </section>

            <section className="sc-panel">
              <div className="sc-head">خطط العمولة</div>
              <div className="sc-body">
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>الخطة</th><th>السنة</th><th>الفترة</th><th>التارقت</th><th>النسبة</th><th>الحالة</th></tr></thead>
                    <tbody>
                      {commissions.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>{row.year}</td>
                          <td>{row.period_label}</td>
                          <td>{money(row.target_amount)}</td>
                          <td>{Number(row.commission_rate_pct || 0).toFixed(2)}%</td>
                          <td>{row.status}</td>
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
