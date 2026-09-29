"use client";

import { useEffect, useMemo, useState } from "react";

const F = "/api/finance";

const STATUS = {
  draft: "مسودة",
  pending_approval: "بانتظار الاعتماد",
  approved: "معتمد",
  posted: "مرحّل",
  completed: "مكتملة",
  matched: "مطابق",
  unmatched: "غير مطابق",
  ignored: "متجاهل",
  rejected: "مرفوض",
};

function money(v, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

async function api(path, options = {}) {
  const r = await fetch(path, { cache: "no-store", ...options });
  const type = r.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await r.json()
    : { detail: await r.text() };

  if (!r.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data)
    );
  }

  return data;
}

function Badge({ value }) {
  const tone =
    ["posted", "completed", "approved", "matched"].includes(value)
      ? "ok"
      : ["pending_approval", "draft", "unmatched"].includes(value)
      ? "warn"
      : value === "rejected"
      ? "bad"
      : "muted";

  return (
    <span className={`f3-badge f3-${tone}`}>
      {STATUS[value] || value || "—"}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="f3-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <div className="f3-empty">{text}</div>;
}

function Notice({ type = "info", children }) {
  return <div className={`f3-notice f3-${type}`}>{children}</div>;
}

export default function FinanceCashBankPage() {
  const [tab, setTab] = useState("summary");
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [statements, setStatements] = useState([]);
  const [recons, setRecons] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [approvals, setApprovals] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [matchFor, setMatchFor] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const [selectedBudget, setSelectedBudget] = useState("");
  const [budgetLines, setBudgetLines] = useState([]);
  const [budgetActual, setBudgetActual] = useState(null);

  const [selectedForecast, setSelectedForecast] = useState("");
  const [forecastLines, setForecastLines] = useState([]);

  const [bankForm, setBankForm] = useState({
    code: "",
    bank_name: "",
    account_name: "",
    iban: "",
    gl_account_id: "",
    opening_balance: 0,
  });

  const [statementForm, setStatementForm] = useState({
    bank_account_id: "",
    transaction_date: today(),
    value_date: today(),
    description: "",
    reference: "",
    amount: "",
    external_id: "",
  });

  const [reconForm, setReconForm] = useState({
    bank_account_id: "",
    statement_from: firstDay(),
    statement_to: today(),
    statement_ending_balance: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    expense_date: today(),
    description: "",
    vendor_id: "",
    expense_account_id: "",
    payment_account_id: "",
    input_vat_account_id: "",
    subtotal: "",
    vat_rate: "15",
    reference: "",
    cost_center: "",
    department_code: "",
  });

  const [budgetForm, setBudgetForm] = useState({
    year: new Date().getFullYear(),
    name: "",
    notes: "",
  });

  const [budgetLineForm, setBudgetLineForm] = useState({
    account_id: "",
    month: new Date().getMonth() + 1,
    amount: "",
    department_code: "",
    cost_center: "",
  });

  const [forecastForm, setForecastForm] = useState({
    year: new Date().getFullYear(),
    name: "",
    based_on_budget_id: "",
    notes: "",
  });

  const [forecastLineForm, setForecastLineForm] = useState({
    account_id: "",
    month: new Date().getMonth() + 1,
    amount: "",
    department_code: "",
    cost_center: "",
  });

  const load = async () => {
    const [a, b, s, r, e, bu, fo, v, sm, ap] = await Promise.all([
      api(`${F}/accounts`),
      api(`${F}/bank-accounts`),
      api(`${F}/bank-statement-lines`),
      api(`${F}/bank-reconciliations`),
      api(`${F}/expenses`),
      api(`${F}/budgets`),
      api(`${F}/forecasts`),
      api(`${F}/vendors`),
      api(`${F}/batch3-summary`),
      api("/api/approvals"),
    ]);

    setAccounts(a);
    setBanks(b);
    setStatements(s);
    setRecons(r);
    setExpenses(e);
    setBudgets(bu);
    setForecasts(fo);
    setVendors(v);
    setSummary(sm);

    const map = {};
    for (const x of ap) map[x.id] = x;
    setApprovals(map);
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const clear = () => {
    setError("");
    setMessage("");
  };

  const run = async (key, fn, msg) => {
    clear();
    setBusy(key);
    try {
      const out = await fn();
      await load();
      if (msg) setMessage(msg);
      return out;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setBusy("");
    }
  };

  const assetAccounts = accounts.filter(
    (x) => x.account_type === "asset" && x.is_active && x.allow_posting
  );
  const expenseAccounts = accounts.filter(
    (x) => x.account_type === "expense" && x.is_active && x.allow_posting
  );
  const planAccounts = accounts.filter(
    (x) =>
      ["expense", "revenue"].includes(x.account_type) &&
      x.is_active &&
      x.allow_posting
  );

  const apStatus = (id) => (id ? approvals[id]?.status : null);
  const bankName = (id) => banks.find((x) => x.id === id)?.bank_name || id;
  const accountName = (id) => {
    const x = accounts.find((a) => a.id === id);
    return x ? `${x.code} — ${x.name_ar}` : id;
  };

  const expenseTotal = useMemo(() => {
    const subtotal = Number(expenseForm.subtotal || 0);
    const vat = subtotal * Number(expenseForm.vat_rate || 0) / 100;
    return { subtotal, vat, total: subtotal + vat };
  }, [expenseForm.subtotal, expenseForm.vat_rate]);

  const createBank = (e) => {
    e.preventDefault();
    return run(
      "bank-create",
      () =>
        api(`${F}/bank-accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bankForm,
            account_name: bankForm.account_name || null,
            iban: bankForm.iban || null,
            opening_balance: Number(bankForm.opening_balance || 0),
            currency: "SAR",
          }),
        }),
      "تم إنشاء الحساب البنكي."
    );
  };

  const createStatement = (e) => {
    e.preventDefault();
    return run(
      "statement-create",
      () =>
        api(`${F}/bank-statement-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...statementForm,
            value_date: statementForm.value_date || null,
            reference: statementForm.reference || null,
            external_id: statementForm.external_id || null,
            amount: Number(statementForm.amount),
          }),
        }),
      "تمت إضافة حركة كشف البنك."
    );
  };

  const openMatch = async (row) => {
    clear();
    setMatchFor(row);
    try {
      const qs = new URLSearchParams({
        from_date: row.transaction_date,
        to_date: row.transaction_date,
      });
      const data = await api(
        `${F}/bank-accounts/${row.bank_account_id}/match-candidates?${qs}`
      );
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const match = (lineId, journalLineId) =>
    run(
      `match-${lineId}`,
      () =>
        api(`${F}/bank-statement-lines/${lineId}/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ journal_line_id: journalLineId }),
        }),
      "تمت مطابقة حركة البنك."
    ).then(() => {
      setMatchFor(null);
      setCandidates([]);
    });

  const ignore = async (row) => {
    const reason = window.prompt("سبب التجاهل:");
    if (!reason) return;
    await run(
      `ignore-${row.id}`,
      () =>
        api(`${F}/bank-statement-lines/${row.id}/ignore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: reason }),
        }),
      "تم تجاهل الحركة مع تسجيل السبب."
    );
  };

  const createRecon = (e) => {
    e.preventDefault();
    return run(
      "recon-create",
      () =>
        api(`${F}/bank-reconciliations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...reconForm,
            statement_ending_balance: Number(
              reconForm.statement_ending_balance
            ),
            created_by: "user",
            notes: reconForm.notes || null,
          }),
        }),
      "تم إنشاء مسودة المطابقة البنكية."
    );
  };

  const requestReconApproval = (id) =>
    run(
      `recon-approval-${id}`,
      () =>
        api(`${F}/bank-reconciliations/${id}/request-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed from Cash & Bank",
          }),
        }),
      "تم إرسال المطابقة البنكية للاعتماد."
    );

  const completeRecon = (id) =>
    run(
      `recon-complete-${id}`,
      () =>
        api(`${F}/bank-reconciliations/${id}/complete`, {
          method: "POST",
        }),
      "اكتملت المطابقة البنكية."
    );

  const createExpense = (e) => {
    e.preventDefault();
    return run(
      "expense-create",
      () =>
        api(`${F}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...expenseForm,
            vendor_id: expenseForm.vendor_id || null,
            input_vat_account_id:
              expenseForm.input_vat_account_id || null,
            subtotal: Number(expenseForm.subtotal),
            vat_rate: Number(expenseForm.vat_rate || 0),
            reference: expenseForm.reference || null,
            cost_center: expenseForm.cost_center || null,
            department_code: expenseForm.department_code || null,
            currency: "SAR",
            created_by: "user",
          }),
        }),
      "تم حفظ المصروف كمسودة."
    );
  };

  const requestExpenseApproval = (id) =>
    run(
      `expense-approval-${id}`,
      () =>
        api(`${F}/expenses/${id}/request-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed from Cash & Bank",
          }),
        }),
      "تم إرسال المصروف للاعتماد."
    );

  const postExpense = (id) =>
    run(
      `expense-post-${id}`,
      () => api(`${F}/expenses/${id}/post`, { method: "POST" }),
      "تم ترحيل المصروف للأستاذ العام."
    );

  const createBudget = (e) => {
    e.preventDefault();
    return run(
      "budget-create",
      () =>
        api(`${F}/budgets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...budgetForm,
            year: Number(budgetForm.year),
            created_by: "user",
            notes: budgetForm.notes || null,
          }),
        }),
      "تم إنشاء الميزانية كمسودة."
    );
  };

  const selectBudget = async (id) => {
    setSelectedBudget(id);
    setBudgetActual(null);
    try {
      setBudgetLines(await api(`${F}/budgets/${id}/lines`));
    } catch (e) {
      setError(e.message);
    }
  };

  const addBudgetLine = (e) => {
    e.preventDefault();
    if (!selectedBudget) return;
    return run(
      "budget-line",
      () =>
        api(`${F}/budgets/${selectedBudget}/lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...budgetLineForm,
            month: Number(budgetLineForm.month),
            amount: Number(budgetLineForm.amount),
            department_code: budgetLineForm.department_code || null,
            cost_center: budgetLineForm.cost_center || null,
          }),
        }),
      "تمت إضافة سطر الميزانية."
    ).then(() => selectBudget(selectedBudget));
  };

  const requestBudget = (id) =>
    run(
      `budget-approval-${id}`,
      () =>
        api(`${F}/budgets/${id}/request-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed from Finance Planning",
          }),
        }),
      "تم إرسال الميزانية للاعتماد."
    );

  const activateBudget = (id) =>
    run(
      `budget-activate-${id}`,
      () => api(`${F}/budgets/${id}/activate`, { method: "POST" }),
      "تم اعتماد النسخة الحالية للميزانية."
    );

  const loadBudgetActual = async (id) => {
    clear();
    try {
      setBudgetActual(
        await api(`${F}/budget-vs-actual?budget_id=${id}`)
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const createForecast = (e) => {
    e.preventDefault();
    return run(
      "forecast-create",
      () =>
        api(`${F}/forecasts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...forecastForm,
            year: Number(forecastForm.year),
            based_on_budget_id:
              forecastForm.based_on_budget_id || null,
            created_by: "user",
            notes: forecastForm.notes || null,
          }),
        }),
      "تم إنشاء التوقع المالي كمسودة."
    );
  };

  const selectForecast = async (id) => {
    setSelectedForecast(id);
    try {
      setForecastLines(await api(`${F}/forecasts/${id}/lines`));
    } catch (e) {
      setError(e.message);
    }
  };

  const addForecastLine = (e) => {
    e.preventDefault();
    if (!selectedForecast) return;
    return run(
      "forecast-line",
      () =>
        api(`${F}/forecasts/${selectedForecast}/lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...forecastLineForm,
            month: Number(forecastLineForm.month),
            amount: Number(forecastLineForm.amount),
            department_code: forecastLineForm.department_code || null,
            cost_center: forecastLineForm.cost_center || null,
          }),
        }),
      "تمت إضافة سطر التوقع."
    ).then(() => selectForecast(selectedForecast));
  };

  const requestForecast = (id) =>
    run(
      `forecast-approval-${id}`,
      () =>
        api(`${F}/forecasts/${id}/request-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed from Finance Planning",
          }),
        }),
      "تم إرسال التوقع المالي للاعتماد."
    );

  const activateForecast = (id) =>
    run(
      `forecast-activate-${id}`,
      () => api(`${F}/forecasts/${id}/activate`, { method: "POST" }),
      "تم اعتماد النسخة الحالية للتوقع."
    );

  const tabs = [
    ["summary", "الملخص"],
    ["banks", "الحسابات البنكية"],
    ["statements", "كشف البنك"],
    ["reconciliation", "المطابقة البنكية"],
    ["expenses", "المصروفات"],
    ["budgets", "الميزانية"],
    ["forecasts", "التوقع المالي"],
  ];

  const selectedBudgetRow = budgets.find((x) => x.id === selectedBudget);
  const selectedForecastRow = forecasts.find(
    (x) => x.id === selectedForecast
  );

  return (
    <main className="f3-page" dir="rtl">
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#06131e}
        .f3-page{min-height:100vh;padding:26px;color:#f7fafc;font-family:Arial,"Segoe UI",sans-serif}
        .f3-shell{max-width:1500px;margin:0 auto}.f3-hero{background:#0b1d2d;color:#fff;border-radius:20px;padding:25px 28px;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
        .f3-hero h1{margin:0;font-size:clamp(26px,3vw,38px)}.f3-hero p{color:#d9e7e6;margin:8px 0 0;line-height:1.7;font-size:13px}
        .f3-links,.f3-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.f3-link{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);padding:9px 12px;border-radius:10px;font-size:11px;font-weight:800}
        .f3-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}.f3-tab{border:1px solid #dce2ea;background:#0b1d2d;padding:9px 12px;border-radius:999px;font-weight:800;color:#9bbfbd;cursor:pointer;font-size:11px}.f3-tab.active{background:#0b1d2d;color:#fff;border-color:#0b1d2d}
        .f3-panel{background:#0b1d2d;border:1px solid #234a57;border-radius:17px;margin-bottom:18px;box-shadow:0 7px 24px rgba(15,23,42,.05);overflow:hidden}.f3-head{padding:17px 20px;border-bottom:1px solid #102735;display:flex;justify-content:space-between;gap:10px;align-items:center}.f3-head h2{margin:0;font-size:18px}.f3-body{padding:20px}
        .f3-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.f3-field{display:grid;gap:5px}.f3-field label{font-size:11px;font-weight:800;color:#9bbfbd}.f3-input{width:100%;min-height:40px;border:1px solid #234a57;border-radius:9px;padding:8px 10px;background:#0b1d2d;color:#f7fafc}
        .f3-button{border:0;border-radius:9px;padding:9px 12px;min-height:36px;font-size:11px;font-weight:800;cursor:pointer}.f3-button:disabled{opacity:.45}.f3-primary{background:#0b1d2d;color:#fff}.f3-secondary{background:#102735;color:#f7fafc}.f3-successbtn{background:#00a88e;color:#fff}.f3-warnbtn{background:#35271e;color:#f5a56f;border:1px solid #704c33}.f3-danger{background:#321d26;color:#ff9cac;border:1px solid #71404a}.f3-mini{padding:5px 8px;min-height:28px;font-size:10px}
        .f3-summary{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px}.f3-card{padding:15px;background:#0e2634;border:1px solid #e5eaf0;border-radius:12px}.f3-card small{display:block;color:#8fb8b6;margin-bottom:5px}.f3-card strong{font-size:22px}
        .f3-table-wrap{overflow:auto;border:1px solid #234a57;border-radius:11px}.f3-table{width:100%;border-collapse:collapse;min-width:900px;font-size:11px}.f3-table th{text-align:right;background:#102735;color:#9bbfbd;padding:10px}.f3-table td{padding:10px;border-top:1px solid #102735;vertical-align:top}
        .f3-badge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800}.f3-ok{background:#0b302b;color:#72dfc7}.f3-warn{background:#332b17;color:#f5c96b}.f3-bad{background:#321d26;color:#ff9cac}.f3-muted{background:#102735;color:#89acab}
        .f3-notice{margin:12px 0;padding:11px 13px;border-radius:10px;font-size:12px}.f3-info{background:#102b3d;color:#72b7ff;border:1px solid #315b7c}.f3-success{background:#0b302b;color:#72dfc7;border:1px solid #2d6a5e}.f3-error{background:#321d26;color:#ff9cac;border:1px solid #71404a}
        .f3-empty{text-align:center;color:#8fb8b6;padding:36px 14px}.f3-rowselect{cursor:pointer}.f3-rowselect:hover{background:#102735}.f3-selected{background:#eef6ff!important}.f3-note{font-size:10px;color:#71c8c1}.f3-pos{color:#72dfc7;font-weight:800}.f3-neg{color:#ff9cac;font-weight:800}
        @media(max-width:1100px){.f3-summary{grid-template-columns:repeat(2,1fr)}.f3-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.f3-page{padding:13px}.f3-hero{flex-direction:column}.f3-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="f3-shell">
        <section className="f3-hero">
          <div>
            <h1>Cash, Bank & Planning</h1>
            <p>
              الحسابات البنكية والمطابقة والمصروفات والميزانية والتوقعات،
              مع Approval وGeneral Ledger controls.
            </p>
          </div>
          <div className="f3-links">
            <a className="f3-link" href="/finance">Finance Workspace</a>
            <a className="f3-link" href="/finance/ap-ar">AP / AR</a>

            <a className="f3-link" href="/finance/reports">Reports & Close</a>
            <a className="f3-link" href="/">الرئيسية</a>
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="f3-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={`f3-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
          <button
            className="f3-tab"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            تحديث
          </button>
        </div>

        {tab === "summary" ? (
          <section className="f3-panel">
            <div className="f3-head"><h2>ملخص Finance Batch 3</h2></div>
            <div className="f3-body">
              <div className="f3-summary">
                <div className="f3-card"><small>الحسابات البنكية</small><strong>{summary?.bank_accounts?.active || 0}</strong></div>
                <div className="f3-card"><small>المطابقات المكتملة</small><strong>{summary?.reconciliations?.completed || 0}</strong></div>
                <div className="f3-card"><small>المصروفات المرحلة</small><strong>{money(summary?.expenses?.posted_amount || 0)}</strong></div>
                <div className="f3-card"><small>الميزانيات الحالية</small><strong>{summary?.budgets?.current || 0}</strong></div>
                <div className="f3-card"><small>التوقعات الحالية</small><strong>{summary?.forecasts?.current || 0}</strong></div>
              </div>
              <Notice type="info">
                النظام يسجل ويطابق العمليات فقط. لا ينفذ تحويلات بنكية فعلية.
              </Notice>
            </div>
          </section>
        ) : null}

        {tab === "banks" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>حساب بنكي جديد</h2></div>
              <div className="f3-body">
                <form onSubmit={createBank}>
                  <div className="f3-grid">
                    <Field label="الرمز"><input required className="f3-input" value={bankForm.code} onChange={(e)=>setBankForm({...bankForm,code:e.target.value})}/></Field>
                    <Field label="اسم البنك"><input required className="f3-input" value={bankForm.bank_name} onChange={(e)=>setBankForm({...bankForm,bank_name:e.target.value})}/></Field>
                    <Field label="اسم الحساب"><input className="f3-input" value={bankForm.account_name} onChange={(e)=>setBankForm({...bankForm,account_name:e.target.value})}/></Field>
                    <Field label="IBAN"><input className="f3-input" value={bankForm.iban} onChange={(e)=>setBankForm({...bankForm,iban:e.target.value})}/></Field>
                    <Field label="حساب GL"><select required className="f3-input" value={bankForm.gl_account_id} onChange={(e)=>setBankForm({...bankForm,gl_account_id:e.target.value})}><option value="">اختر حساب الأصل</option>{assetAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field>
                    <Field label="الرصيد الافتتاحي"><input className="f3-input" type="number" step="0.01" value={bankForm.opening_balance} onChange={(e)=>setBankForm({...bankForm,opening_balance:e.target.value})}/></Field>
                  </div>
                  <div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="bank-create"}>إنشاء الحساب</button></div>
                </form>
              </div>
            </section>
            <section className="f3-panel">
              <div className="f3-head"><h2>الحسابات البنكية</h2></div>
              <div className="f3-body">
                {!banks.length ? <Empty text="لا توجد حسابات بنكية."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>الرمز</th><th>البنك</th><th>الحساب</th><th>IBAN</th><th>GL</th><th>افتتاحي</th></tr></thead><tbody>{banks.map(x=><tr key={x.id}><td>{x.code}</td><td>{x.bank_name}</td><td>{x.account_name||"—"}</td><td>{x.iban||"—"}</td><td>{accountName(x.gl_account_id)}</td><td>{money(x.opening_balance,x.currency)}</td></tr>)}</tbody></table></div>}
              </div>
            </section>
          </>
        ) : null}

        {tab === "statements" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>إضافة حركة كشف بنكي</h2></div>
              <div className="f3-body">
                <form onSubmit={createStatement}>
                  <div className="f3-grid">
                    <Field label="الحساب البنكي"><select required className="f3-input" value={statementForm.bank_account_id} onChange={(e)=>setStatementForm({...statementForm,bank_account_id:e.target.value})}><option value="">اختر</option>{banks.filter(x=>x.is_active).map(x=><option key={x.id} value={x.id}>{x.code} — {x.bank_name}</option>)}</select></Field>
                    <Field label="تاريخ العملية"><input required className="f3-input" type="date" value={statementForm.transaction_date} onChange={(e)=>setStatementForm({...statementForm,transaction_date:e.target.value})}/></Field>
                    <Field label="Value Date"><input className="f3-input" type="date" value={statementForm.value_date} onChange={(e)=>setStatementForm({...statementForm,value_date:e.target.value})}/></Field>
                    <Field label="الوصف"><input required className="f3-input" value={statementForm.description} onChange={(e)=>setStatementForm({...statementForm,description:e.target.value})}/></Field>
                    <Field label="المرجع"><input className="f3-input" value={statementForm.reference} onChange={(e)=>setStatementForm({...statementForm,reference:e.target.value})}/></Field>
                    <Field label="المبلغ (+ داخل / - خارج)"><input required className="f3-input" type="number" step="0.01" value={statementForm.amount} onChange={(e)=>setStatementForm({...statementForm,amount:e.target.value})}/></Field>
                    <Field label="External ID"><input className="f3-input" value={statementForm.external_id} onChange={(e)=>setStatementForm({...statementForm,external_id:e.target.value})}/></Field>
                  </div>
                  <div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="statement-create"}>إضافة الحركة</button></div>
                </form>
              </div>
            </section>

            {matchFor ? (
              <section className="f3-panel">
                <div className="f3-head">
                  <h2>مطابقة: {matchFor.description}</h2>
                  <button className="f3-button f3-secondary f3-mini" onClick={()=>{setMatchFor(null);setCandidates([])}}>إغلاق</button>
                </div>
                <div className="f3-body">
                  <Notice type="info">مبلغ حركة البنك: <strong>{money(matchFor.amount)}</strong>. اعرض فقط القيود المرحلة في نفس اليوم.</Notice>
                  {!candidates.length ? <Empty text="لا توجد قيود مرشحة."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>القيد</th><th>الوصف</th><th>المبلغ</th><th>المصدر</th><th>الحالة</th><th></th></tr></thead><tbody>{candidates.map(x=><tr key={x.journal_line_id}><td>{x.entry_number}</td><td>{x.description||"—"}</td><td className={Number(x.amount)>=0?"f3-pos":"f3-neg"}>{money(x.amount)}</td><td>{x.source_type||"—"}</td><td>{x.matched?"مستخدم":"متاح"}</td><td><button disabled={x.matched || Number(x.amount)!==Number(matchFor.amount)} className="f3-button f3-successbtn f3-mini" onClick={()=>match(matchFor.id,x.journal_line_id)}>ربط</button></td></tr>)}</tbody></table></div>}
                </div>
              </section>
            ) : null}

            <section className="f3-panel">
              <div className="f3-head"><h2>حركات كشف البنك</h2></div>
              <div className="f3-body">
                {!statements.length ? <Empty text="لا توجد حركات."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>التاريخ</th><th>البنك</th><th>الوصف</th><th>المرجع</th><th>المبلغ</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{statements.map(x=><tr key={x.id}><td>{x.transaction_date}</td><td>{bankName(x.bank_account_id)}</td><td>{x.description}</td><td>{x.reference||"—"}</td><td className={Number(x.amount)>=0?"f3-pos":"f3-neg"}>{money(x.amount)}</td><td><Badge value={x.status}/></td><td><div className="f3-actions">{x.status==="unmatched"?<button className="f3-button f3-primary f3-mini" onClick={()=>openMatch(x)}>مطابقة</button>:null}{x.status==="unmatched"?<button className="f3-button f3-danger f3-mini" onClick={()=>ignore(x)}>تجاهل</button>:null}</div></td></tr>)}</tbody></table></div>}
              </div>
            </section>
          </>
        ) : null}

        {tab === "reconciliation" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>مطابقة بنكية جديدة</h2></div>
              <div className="f3-body">
                <form onSubmit={createRecon}>
                  <div className="f3-grid">
                    <Field label="الحساب البنكي"><select required className="f3-input" value={reconForm.bank_account_id} onChange={(e)=>setReconForm({...reconForm,bank_account_id:e.target.value})}><option value="">اختر</option>{banks.map(x=><option key={x.id} value={x.id}>{x.code} — {x.bank_name}</option>)}</select></Field>
                    <Field label="من"><input required className="f3-input" type="date" value={reconForm.statement_from} onChange={(e)=>setReconForm({...reconForm,statement_from:e.target.value})}/></Field>
                    <Field label="إلى"><input required className="f3-input" type="date" value={reconForm.statement_to} onChange={(e)=>setReconForm({...reconForm,statement_to:e.target.value})}/></Field>
                    <Field label="الرصيد الختامي في كشف البنك"><input required className="f3-input" type="number" step="0.01" value={reconForm.statement_ending_balance} onChange={(e)=>setReconForm({...reconForm,statement_ending_balance:e.target.value})}/></Field>
                    <Field label="ملاحظات"><input className="f3-input" value={reconForm.notes} onChange={(e)=>setReconForm({...reconForm,notes:e.target.value})}/></Field>
                  </div>
                  <div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="recon-create"}>إنشاء المسودة</button></div>
                </form>
              </div>
            </section>
            <section className="f3-panel">
              <div className="f3-head"><h2>المطابقات البنكية</h2></div>
              <div className="f3-body">
                {!recons.length ? <Empty text="لا توجد مطابقات."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>البنك</th><th>الفترة</th><th>كشف البنك</th><th>GL</th><th>الفرق</th><th>غير مطابق</th><th>الحالة</th><th>الاعتماد</th><th>الإجراء</th></tr></thead><tbody>{recons.map(x=>{const a=x.approval_status||apStatus(x.approval_id);return <tr key={x.id}><td>{bankName(x.bank_account_id)}</td><td>{x.statement_from} → {x.statement_to}</td><td>{money(x.statement_ending_balance)}</td><td>{money(x.gl_ending_balance)}</td><td className={Math.abs(Number(x.difference))<0.01?"f3-pos":"f3-neg"}>{money(x.difference)}</td><td>{x.unmatched_count}</td><td><Badge value={x.status}/></td><td>{a?<Badge value={a}/>:"—"}</td><td><div className="f3-actions">{x.status==="draft"&&Math.abs(Number(x.difference))<0.01&&x.unmatched_count===0?<button className="f3-button f3-warnbtn f3-mini" onClick={()=>requestReconApproval(x.id)}>طلب اعتماد</button>:null}{x.status==="pending_approval"&&a==="approved"?<button className="f3-button f3-successbtn f3-mini" onClick={()=>completeRecon(x.id)}>إكمال</button>:null}</div></td></tr>})}</tbody></table></div>}
              </div>
            </section>
          </>
        ) : null}

        {tab === "expenses" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>مصروف نقدي / بنكي</h2></div>
              <div className="f3-body">
                <form onSubmit={createExpense}>
                  <div className="f3-grid">
                    <Field label="التاريخ"><input required className="f3-input" type="date" value={expenseForm.expense_date} onChange={(e)=>setExpenseForm({...expenseForm,expense_date:e.target.value})}/></Field>
                    <Field label="الوصف"><input required className="f3-input" value={expenseForm.description} onChange={(e)=>setExpenseForm({...expenseForm,description:e.target.value})}/></Field>
                    <Field label="المورد (اختياري)"><select className="f3-input" value={expenseForm.vendor_id} onChange={(e)=>setExpenseForm({...expenseForm,vendor_id:e.target.value})}><option value="">بدون</option>{vendors.filter(x=>x.is_active).map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field>
                    <Field label="حساب المصروف"><select required className="f3-input" value={expenseForm.expense_account_id} onChange={(e)=>setExpenseForm({...expenseForm,expense_account_id:e.target.value})}><option value="">اختر</option>{expenseAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field>
                    <Field label="حساب الدفع / البنك"><select required className="f3-input" value={expenseForm.payment_account_id} onChange={(e)=>setExpenseForm({...expenseForm,payment_account_id:e.target.value})}><option value="">اختر</option>{assetAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field>
                    <Field label="VAT Input"><select className="f3-input" value={expenseForm.input_vat_account_id} onChange={(e)=>setExpenseForm({...expenseForm,input_vat_account_id:e.target.value})}><option value="">بدون</option>{assetAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field>
                    <Field label="قبل الضريبة"><input required className="f3-input" type="number" min="0.01" step="0.01" value={expenseForm.subtotal} onChange={(e)=>setExpenseForm({...expenseForm,subtotal:e.target.value})}/></Field>
                    <Field label="VAT %"><input className="f3-input" type="number" min="0" max="100" step="0.01" value={expenseForm.vat_rate} onChange={(e)=>setExpenseForm({...expenseForm,vat_rate:e.target.value})}/></Field>
                    <Field label="المرجع"><input className="f3-input" value={expenseForm.reference} onChange={(e)=>setExpenseForm({...expenseForm,reference:e.target.value})}/></Field>
                    <Field label="Cost Center"><input className="f3-input" value={expenseForm.cost_center} onChange={(e)=>setExpenseForm({...expenseForm,cost_center:e.target.value})}/></Field>
                    <Field label="Department"><input className="f3-input" value={expenseForm.department_code} onChange={(e)=>setExpenseForm({...expenseForm,department_code:e.target.value})}/></Field>
                  </div>
                  <Notice type="info">الإجمالي المتوقع: <strong>{money(expenseTotal.total)}</strong> — VAT: {money(expenseTotal.vat)}</Notice>
                  <div className="f3-actions"><button className="f3-button f3-primary" disabled={busy==="expense-create"}>حفظ كمسودة</button></div>
                </form>
              </div>
            </section>
            <section className="f3-panel">
              <div className="f3-head"><h2>المصروفات</h2></div>
              <div className="f3-body">
                {!expenses.length ? <Empty text="لا توجد مصروفات."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>التاريخ</th><th>الوصف</th><th>قبل الضريبة</th><th>VAT</th><th>الإجمالي</th><th>الحالة</th><th>الاعتماد</th><th>الإجراء</th></tr></thead><tbody>{expenses.map(x=>{const a=x.approval_status||apStatus(x.approval_id);return <tr key={x.id}><td>{x.expense_date}</td><td>{x.description}</td><td>{money(x.subtotal)}</td><td>{money(x.vat_amount)}</td><td>{money(x.total_amount)}</td><td><Badge value={x.status}/></td><td>{a?<Badge value={a}/>:"—"}</td><td><div className="f3-actions">{(x.status==="draft"||a==="rejected")?<button className="f3-button f3-warnbtn f3-mini" onClick={()=>requestExpenseApproval(x.id)}>طلب اعتماد</button>:null}{x.status==="pending_approval"&&a==="approved"?<button className="f3-button f3-successbtn f3-mini" onClick={()=>postExpense(x.id)}>ترحيل</button>:null}</div></td></tr>})}</tbody></table></div>}
              </div>
            </section>
          </>
        ) : null}

        {tab === "budgets" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>ميزانية جديدة</h2></div>
              <div className="f3-body">
                <form onSubmit={createBudget}>
                  <div className="f3-grid">
                    <Field label="السنة"><input required className="f3-input" type="number" min="2000" max="2200" value={budgetForm.year} onChange={(e)=>setBudgetForm({...budgetForm,year:e.target.value})}/></Field>
                    <Field label="الاسم"><input required className="f3-input" value={budgetForm.name} onChange={(e)=>setBudgetForm({...budgetForm,name:e.target.value})}/></Field>
                    <Field label="ملاحظات"><input className="f3-input" value={budgetForm.notes} onChange={(e)=>setBudgetForm({...budgetForm,notes:e.target.value})}/></Field>
                  </div>
                  <div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="budget-create"}>إنشاء الميزانية</button></div>
                </form>
              </div>
            </section>
            <section className="f3-panel">
              <div className="f3-head"><h2>الميزانيات</h2></div>
              <div className="f3-body">
                {!budgets.length ? <Empty text="لا توجد ميزانيات."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>السنة</th><th>الاسم</th><th>الإصدار</th><th>السطور</th><th>الحالة</th><th>Current</th><th>الإجراء</th></tr></thead><tbody>{budgets.map(x=>{const a=x.approval_status||apStatus(x.approval_id);return <tr key={x.id} className={`f3-rowselect ${selectedBudget===x.id?"f3-selected":""}`} onClick={()=>selectBudget(x.id)}><td>{x.year}</td><td>{x.name}</td><td>v{x.version}</td><td>{x.line_count}</td><td><Badge value={x.status}/></td><td>{x.is_current?"نعم":"لا"}</td><td><div className="f3-actions">{["draft","rejected"].includes(x.status)?<button className="f3-button f3-warnbtn f3-mini" onClick={(e)=>{e.stopPropagation();requestBudget(x.id)}}>طلب اعتماد</button>:null}{x.status==="pending_approval"&&a==="approved"?<button className="f3-button f3-successbtn f3-mini" onClick={(e)=>{e.stopPropagation();activateBudget(x.id)}}>تفعيل</button>:null}<button className="f3-button f3-secondary f3-mini" onClick={(e)=>{e.stopPropagation();loadBudgetActual(x.id)}}>Budget vs Actual</button></div></td></tr>})}</tbody></table></div>}
              </div>
            </section>

            {selectedBudgetRow ? (
              <section className="f3-panel">
                <div className="f3-head"><h2>سطور {selectedBudgetRow.name}</h2></div>
                <div className="f3-body">
                  {["draft","rejected"].includes(selectedBudgetRow.status) ? <form onSubmit={addBudgetLine}><div className="f3-grid"><Field label="الحساب"><select required className="f3-input" value={budgetLineForm.account_id} onChange={(e)=>setBudgetLineForm({...budgetLineForm,account_id:e.target.value})}><option value="">اختر</option>{planAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field><Field label="الشهر"><input required className="f3-input" type="number" min="1" max="12" value={budgetLineForm.month} onChange={(e)=>setBudgetLineForm({...budgetLineForm,month:e.target.value})}/></Field><Field label="المبلغ"><input required className="f3-input" type="number" min="0" step="0.01" value={budgetLineForm.amount} onChange={(e)=>setBudgetLineForm({...budgetLineForm,amount:e.target.value})}/></Field><Field label="Department"><input className="f3-input" value={budgetLineForm.department_code} onChange={(e)=>setBudgetLineForm({...budgetLineForm,department_code:e.target.value})}/></Field><Field label="Cost Center"><input className="f3-input" value={budgetLineForm.cost_center} onChange={(e)=>setBudgetLineForm({...budgetLineForm,cost_center:e.target.value})}/></Field></div><div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="budget-line"}>إضافة سطر</button></div></form> : <Notice type="info">الميزانية قيد الاعتماد أو معتمدة؛ السطور مقفلة.</Notice>}
                  <div className="f3-table-wrap" style={{marginTop:14}}><table className="f3-table"><thead><tr><th>الحساب</th><th>الشهر</th><th>المبلغ</th><th>Department</th><th>Cost Center</th></tr></thead><tbody>{budgetLines.map(x=><tr key={x.id}><td>{accountName(x.account_id)}</td><td>{x.month}</td><td>{money(x.amount)}</td><td>{x.department_code||"—"}</td><td>{x.cost_center||"—"}</td></tr>)}</tbody></table></div>
                </div>
              </section>
            ) : null}

            {budgetActual ? (
              <section className="f3-panel">
                <div className="f3-head"><h2>Budget vs Actual</h2></div>
                <div className="f3-body">
                  <Notice type="info">Budget Total: <strong>{money(budgetActual.total_budget)}</strong> — Actual: <strong>{money(budgetActual.total_actual)}</strong></Notice>
                  <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>الحساب</th><th>الشهر</th><th>Budget</th><th>Actual</th><th>Variance</th></tr></thead><tbody>{budgetActual.rows.map((x,i)=><tr key={`${x.account_id}-${x.month}-${i}`}><td>{x.account_code} — {x.account_name_ar}</td><td>{x.month}</td><td>{money(x.budget)}</td><td>{money(x.actual)}</td><td className={Number(x.variance)>=0?"f3-pos":"f3-neg"}>{money(x.variance)}</td></tr>)}</tbody></table></div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {tab === "forecasts" ? (
          <>
            <section className="f3-panel">
              <div className="f3-head"><h2>توقع مالي جديد</h2></div>
              <div className="f3-body">
                <form onSubmit={createForecast}>
                  <div className="f3-grid">
                    <Field label="السنة"><input required className="f3-input" type="number" min="2000" max="2200" value={forecastForm.year} onChange={(e)=>setForecastForm({...forecastForm,year:e.target.value})}/></Field>
                    <Field label="الاسم"><input required className="f3-input" value={forecastForm.name} onChange={(e)=>setForecastForm({...forecastForm,name:e.target.value})}/></Field>
                    <Field label="Based on Budget"><select className="f3-input" value={forecastForm.based_on_budget_id} onChange={(e)=>setForecastForm({...forecastForm,based_on_budget_id:e.target.value})}><option value="">بدون</option>{budgets.map(x=><option key={x.id} value={x.id}>{x.year} v{x.version} — {x.name}</option>)}</select></Field>
                    <Field label="ملاحظات"><input className="f3-input" value={forecastForm.notes} onChange={(e)=>setForecastForm({...forecastForm,notes:e.target.value})}/></Field>
                  </div>
                  <div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="forecast-create"}>إنشاء التوقع</button></div>
                </form>
              </div>
            </section>
            <section className="f3-panel">
              <div className="f3-head"><h2>التوقعات</h2></div>
              <div className="f3-body">
                {!forecasts.length ? <Empty text="لا توجد توقعات."/> : <div className="f3-table-wrap"><table className="f3-table"><thead><tr><th>السنة</th><th>الاسم</th><th>الإصدار</th><th>السطور</th><th>الحالة</th><th>Current</th><th>الإجراء</th></tr></thead><tbody>{forecasts.map(x=>{const a=x.approval_status||apStatus(x.approval_id);return <tr key={x.id} className={`f3-rowselect ${selectedForecast===x.id?"f3-selected":""}`} onClick={()=>selectForecast(x.id)}><td>{x.year}</td><td>{x.name}</td><td>v{x.version}</td><td>{x.line_count}</td><td><Badge value={x.status}/></td><td>{x.is_current?"نعم":"لا"}</td><td><div className="f3-actions">{["draft","rejected"].includes(x.status)?<button className="f3-button f3-warnbtn f3-mini" onClick={(e)=>{e.stopPropagation();requestForecast(x.id)}}>طلب اعتماد</button>:null}{x.status==="pending_approval"&&a==="approved"?<button className="f3-button f3-successbtn f3-mini" onClick={(e)=>{e.stopPropagation();activateForecast(x.id)}}>تفعيل</button>:null}</div></td></tr>})}</tbody></table></div>}
              </div>
            </section>

            {selectedForecastRow ? (
              <section className="f3-panel">
                <div className="f3-head"><h2>سطور {selectedForecastRow.name}</h2></div>
                <div className="f3-body">
                  {["draft","rejected"].includes(selectedForecastRow.status) ? <form onSubmit={addForecastLine}><div className="f3-grid"><Field label="الحساب"><select required className="f3-input" value={forecastLineForm.account_id} onChange={(e)=>setForecastLineForm({...forecastLineForm,account_id:e.target.value})}><option value="">اختر</option>{planAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}</select></Field><Field label="الشهر"><input required className="f3-input" type="number" min="1" max="12" value={forecastLineForm.month} onChange={(e)=>setForecastLineForm({...forecastLineForm,month:e.target.value})}/></Field><Field label="المبلغ"><input required className="f3-input" type="number" min="0" step="0.01" value={forecastLineForm.amount} onChange={(e)=>setForecastLineForm({...forecastLineForm,amount:e.target.value})}/></Field><Field label="Department"><input className="f3-input" value={forecastLineForm.department_code} onChange={(e)=>setForecastLineForm({...forecastLineForm,department_code:e.target.value})}/></Field><Field label="Cost Center"><input className="f3-input" value={forecastLineForm.cost_center} onChange={(e)=>setForecastLineForm({...forecastLineForm,cost_center:e.target.value})}/></Field></div><div className="f3-actions" style={{marginTop:12}}><button className="f3-button f3-primary" disabled={busy==="forecast-line"}>إضافة سطر</button></div></form> : <Notice type="info">التوقع قيد الاعتماد أو معتمد؛ السطور مقفلة.</Notice>}
                  <div className="f3-table-wrap" style={{marginTop:14}}><table className="f3-table"><thead><tr><th>الحساب</th><th>الشهر</th><th>المبلغ</th><th>Department</th><th>Cost Center</th></tr></thead><tbody>{forecastLines.map(x=><tr key={x.id}><td>{accountName(x.account_id)}</td><td>{x.month}</td><td>{money(x.amount)}</td><td>{x.department_code||"—"}</td><td>{x.cost_center||"—"}</td></tr>)}</tbody></table></div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
