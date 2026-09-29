"use client";

import { useEffect, useMemo, useState } from "react";

const F = "/api/finance";

const STATUS = {
  active: "نشط",
  draft: "مسودة",
  pending_approval: "بانتظار الاعتماد",
  approved: "معتمد",
  posted: "مرحّل",
  rejected: "مرفوض",
  reversed: "معكوس",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function nextMonthStart() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}

function money(v, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
}

async function api(path, options = {}) {
  const r = await fetch(path, {
    cache: "no-store",
    ...options,
  });

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
    ["active", "posted", "approved", "reversed"].includes(value)
      ? "ok"
      : ["draft", "pending_approval"].includes(value)
      ? "warn"
      : value === "rejected"
      ? "bad"
      : "muted";

  return (
    <span className={`f5-badge f5-${tone}`}>
      {STATUS[value] || value || "—"}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="f5-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Notice({ type = "info", children }) {
  return <div className={`f5-notice f5-${type}`}>{children}</div>;
}

function Empty({ text }) {
  return <div className="f5-empty">{text}</div>;
}

export default function FinanceAssetsAccrualsPage() {
  const now = new Date();

  const [tab, setTab] = useState("summary");
  const [accounts, setAccounts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assets, setAssets] = useState([]);
  const [runs, setRuns] = useState([]);
  const [accruals, setAccruals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [approvals, setApprovals] = useState({});

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [assetForm, setAssetForm] = useState({
    code: "",
    name_ar: "",
    name_en: "",
    category: "",
    acquisition_date: monthStart(),
    placed_in_service_date: monthStart(),
    acquisition_cost: "",
    salvage_value: "0",
    useful_life_months: "60",
    asset_account_id: "",
    accumulated_depreciation_account_id: "",
    depreciation_expense_account_id: "",
    vendor_id: "",
    serial_number: "",
    location: "",
    notes: "",
  });

  const [runForm, setRunForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    notes: "",
  });

  const [accrualForm, setAccrualForm] = useState({
    code: "",
    description: "",
    accrual_date: today(),
    reversal_date: nextMonthStart(),
    amount: "",
    expense_account_id: "",
    accrued_liability_account_id: "",
    reference: "",
    department_code: "",
    cost_center: "",
    notes: "",
  });

  const load = async () => {
    const [a, v, fa, dr, ac, sm, ap] = await Promise.all([
      api(`${F}/accounts`),
      api(`${F}/vendors`),
      api(`${F}/fixed-assets`),
      api(`${F}/depreciation-runs`),
      api(`${F}/accruals`),
      api(`${F}/batch5-summary`),
      api("/api/approvals"),
    ]);

    setAccounts(a);
    setVendors(v);
    setAssets(fa);
    setRuns(dr);
    setAccruals(ac);
    setSummary(sm);

    const map = {};
    for (const row of ap) map[row.id] = row;
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
    (x) =>
      x.account_type === "asset" &&
      x.is_active &&
      x.allow_posting
  );

  const expenseAccounts = accounts.filter(
    (x) =>
      x.account_type === "expense" &&
      x.is_active &&
      x.allow_posting
  );

  const liabilityAccounts = accounts.filter(
    (x) =>
      x.account_type === "liability" &&
      x.is_active &&
      x.allow_posting
  );

  const apStatus = (id) =>
    id ? approvals[id]?.status : null;

  const accountName = (id) => {
    const row = accounts.find((x) => x.id === id);
    return row ? `${row.code} — ${row.name_ar}` : id;
  };

  const vendorName = (id) => {
    if (!id) return "—";
    return (
      vendors.find((x) => x.id === id)?.name_ar ||
      id
    );
  };

  const monthlyDepreciation = useMemo(() => {
    const cost = Number(assetForm.acquisition_cost || 0);
    const salvage = Number(assetForm.salvage_value || 0);
    const life = Number(assetForm.useful_life_months || 0);

    if (cost <= 0 || life <= 0 || salvage >= cost) {
      return 0;
    }

    return (cost - salvage) / life;
  }, [
    assetForm.acquisition_cost,
    assetForm.salvage_value,
    assetForm.useful_life_months,
  ]);

  const createAsset = (e) => {
    e.preventDefault();

    return run(
      "asset-create",
      () =>
        api(`${F}/fixed-assets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...assetForm,
            name_en: assetForm.name_en || null,
            category: assetForm.category || null,
            acquisition_cost: Number(
              assetForm.acquisition_cost
            ),
            salvage_value: Number(
              assetForm.salvage_value || 0
            ),
            useful_life_months: Number(
              assetForm.useful_life_months
            ),
            depreciation_method: "straight_line",
            vendor_id: assetForm.vendor_id || null,
            serial_number:
              assetForm.serial_number || null,
            location: assetForm.location || null,
            notes: assetForm.notes || null,
          }),
        }),
      "تم إنشاء سجل الأصل الثابت."
    );
  };

  const createDepreciationRun = (e) => {
    e.preventDefault();

    return run(
      "dep-create",
      () =>
        api(`${F}/depreciation-runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            year: Number(runForm.year),
            month: Number(runForm.month),
            created_by: "user",
            notes: runForm.notes || null,
          }),
        }),
      "تم إنشاء مسودة الاستهلاك الشهري."
    );
  };

  const requestDepreciationApproval = (id) =>
    run(
      `dep-approval-${id}`,
      () =>
        api(
          `${F}/depreciation-runs/${id}/request-approval`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requested_by: "user",
              notes: "Reviewed from Fixed Assets",
            }),
          }
        ),
      "تم إرسال Run الاستهلاك للاعتماد."
    );

  const postDepreciation = (id) =>
    run(
      `dep-post-${id}`,
      () =>
        api(`${F}/depreciation-runs/${id}/post`, {
          method: "POST",
        }),
      "تم ترحيل قيد الاستهلاك."
    );

  const createAccrual = (e) => {
    e.preventDefault();

    return run(
      "accrual-create",
      () =>
        api(`${F}/accruals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...accrualForm,
            amount: Number(accrualForm.amount),
            currency: "SAR",
            reference:
              accrualForm.reference || null,
            department_code:
              accrualForm.department_code || null,
            cost_center:
              accrualForm.cost_center || null,
            created_by: "user",
            notes: accrualForm.notes || null,
          }),
        }),
      "تم إنشاء الاستحقاق كمسودة."
    );
  };

  const requestAccrualApproval = (id) =>
    run(
      `accrual-approval-${id}`,
      () =>
        api(`${F}/accruals/${id}/request-approval`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed from Accruals",
          }),
        }),
      "تم إرسال الاستحقاق للاعتماد."
    );

  const postAccrual = (id) =>
    run(
      `accrual-post-${id}`,
      () =>
        api(`${F}/accruals/${id}/post`, {
          method: "POST",
        }),
      "تم ترحيل الاستحقاق."
    );

  const requestReversal = (id) =>
    run(
      `reversal-approval-${id}`,
      () =>
        api(
          `${F}/accruals/${id}/request-reversal-approval`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requested_by: "user",
              notes: "Reviewed accrual reversal",
            }),
          }
        ),
      "تم إرسال عكس الاستحقاق للاعتماد."
    );

  const reverseAccrual = (id) =>
    run(
      `reversal-post-${id}`,
      () =>
        api(`${F}/accruals/${id}/reverse`, {
          method: "POST",
        }),
      "تم عكس الاستحقاق وترحيل القيد."
    );

  const tabs = [
    ["summary", "الملخص"],
    ["assets", "الأصول الثابتة"],
    ["depreciation", "الاستهلاك"],
    ["accruals", "الاستحقاقات"],
  ];

  return (
    <main className="f5-page" dir="rtl">
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#06131e}
        .f5-page{min-height:100vh;padding:26px;color:#f7fafc;font-family:Arial,"Segoe UI",sans-serif}
        .f5-shell{max-width:1500px;margin:0 auto}
        .f5-hero{background:#0b1d2d;color:#fff;border-radius:20px;padding:25px 28px;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
        .f5-hero h1{margin:0;font-size:clamp(27px,3vw,39px)}
        .f5-hero p{color:#d9e7e6;margin:8px 0 0;line-height:1.7;font-size:13px}
        .f5-links,.f5-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
        .f5-link{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);padding:9px 12px;border-radius:10px;font-size:11px;font-weight:800}
        .f5-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}
        .f5-tab{border:1px solid #dce2ea;background:#0b1d2d;padding:9px 12px;border-radius:999px;font-weight:800;color:#9bbfbd;cursor:pointer;font-size:11px}
        .f5-tab.active{background:#0b1d2d;color:#fff;border-color:#0b1d2d}
        .f5-panel{background:#0b1d2d;border:1px solid #234a57;border-radius:17px;margin-bottom:18px;box-shadow:0 7px 24px rgba(15,23,42,.05);overflow:hidden}
        .f5-head{padding:17px 20px;border-bottom:1px solid #102735;display:flex;justify-content:space-between;gap:12px;align-items:center}
        .f5-head h2{margin:0;font-size:18px}.f5-body{padding:20px}
        .f5-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}
        .f5-field{display:grid;gap:5px}.f5-field label{font-size:11px;font-weight:800;color:#9bbfbd}
        .f5-input{width:100%;min-height:40px;border:1px solid #234a57;border-radius:9px;padding:8px 10px;background:#0b1d2d;color:#f7fafc}
        .f5-button{border:0;border-radius:9px;padding:9px 12px;min-height:36px;font-size:11px;font-weight:800;cursor:pointer}
        .f5-button:disabled{opacity:.45}.f5-primary{background:#0b1d2d;color:#fff}.f5-secondary{background:#102735;color:#f7fafc}
        .f5-successbtn{background:#00a88e;color:#fff}.f5-warnbtn{background:#35271e;color:#f5a56f;border:1px solid #704c33}
        .f5-kpis{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:10px}
        .f5-card{padding:15px;background:#0e2634;border:1px solid #e5eaf0;border-radius:12px}
        .f5-card small{display:block;color:#8fb8b6;margin-bottom:5px}.f5-card strong{font-size:22px}
        .f5-table-wrap{overflow:auto;border:1px solid #234a57;border-radius:11px}
        .f5-table{width:100%;border-collapse:collapse;min-width:950px;font-size:11px}
        .f5-table th{text-align:right;background:#102735;color:#9bbfbd;padding:10px}
        .f5-table td{padding:10px;border-top:1px solid #102735;vertical-align:top}
        .f5-badge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800}
        .f5-ok{background:#0b302b;color:#72dfc7}.f5-warn{background:#332b17;color:#f5c96b}.f5-bad{background:#321d26;color:#ff9cac}.f5-muted{background:#102735;color:#89acab}
        .f5-notice{margin:12px 0;padding:11px 13px;border-radius:10px;font-size:12px}
        .f5-info{background:#102b3d;color:#72b7ff;border:1px solid #315b7c}.f5-success{background:#0b302b;color:#72dfc7;border:1px solid #2d6a5e}.f5-error{background:#321d26;color:#ff9cac;border:1px solid #71404a}
        .f5-empty{text-align:center;color:#8fb8b6;padding:36px 14px}
        .f5-note{font-size:10px;color:#8fb8b6}
        @media(max-width:1100px){.f5-kpis{grid-template-columns:repeat(2,1fr)}.f5-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:650px){.f5-page{padding:13px}.f5-hero{flex-direction:column}.f5-grid,.f5-kpis{grid-template-columns:1fr}}
      `}</style>

      <div className="f5-shell">
        <section className="f5-hero">
          <div>
            <h1>Fixed Assets & Accruals</h1>
            <p>
              سجل الأصول، الاستهلاك الشهري، الاستحقاقات وعكسها
              مع Approval وترحيل محاسبي مضبوط.
            </p>
          </div>
          <div className="f5-links">
            <a className="f5-link" href="/finance">Finance Workspace</a>
            <a className="f5-link" href="/finance/reports">Reports & Close</a>
            <a className="f5-link" href="/finance/cash-bank">Cash, Bank & Planning</a>
            <a className="f5-link" href="/">الرئيسية</a>
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="f5-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={`f5-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
          <button
            className="f5-tab"
            onClick={() =>
              load().catch((e) => setError(e.message))
            }
          >
            تحديث
          </button>
        </div>

        {tab === "summary" ? (
          <section className="f5-panel">
            <div className="f5-head">
              <h2>ملخص الأصول والاستحقاقات</h2>
            </div>
            <div className="f5-body">
              <div className="f5-kpis">
                <div className="f5-card">
                  <small>Active Fixed Assets</small>
                  <strong>{summary?.fixed_assets?.active || 0}</strong>
                </div>
                <div className="f5-card">
                  <small>Acquisition Cost</small>
                  <strong>{money(summary?.fixed_assets?.acquisition_cost || 0)}</strong>
                </div>
                <div className="f5-card">
                  <small>Accumulated Depreciation</small>
                  <strong>{money(summary?.fixed_assets?.accumulated_depreciation || 0)}</strong>
                </div>
                <div className="f5-card">
                  <small>Net Book Value</small>
                  <strong>{money(summary?.fixed_assets?.net_book_value || 0)}</strong>
                </div>
              </div>

              <div className="f5-kpis" style={{marginTop:10}}>
                <div className="f5-card">
                  <small>Posted Depreciation Runs</small>
                  <strong>{summary?.depreciation_runs?.posted || 0}</strong>
                </div>
                <div className="f5-card">
                  <small>Posted Depreciation</small>
                  <strong>{money(summary?.depreciation_runs?.posted_amount || 0)}</strong>
                </div>
                <div className="f5-card">
                  <small>Open Accruals</small>
                  <strong>{summary?.accruals?.open || 0}</strong>
                </div>
                <div className="f5-card">
                  <small>Open Accrual Amount</small>
                  <strong>{money(summary?.accruals?.open_amount || 0)}</strong>
                </div>
              </div>

              <Notice type="info">
                إنشاء الأصل هنا ينشئ سجل الأصل ولا ينشئ قيد شراء الأصل تلقائيًا.
                تكلفة الاقتناء يجب أن تكون مسجلة محاسبيًا عبر AP أو Journal حسب العملية الفعلية.
              </Notice>
            </div>
          </section>
        ) : null}

        {tab === "assets" ? (
          <>
            <section className="f5-panel">
              <div className="f5-head">
                <h2>أصل ثابت جديد</h2>
              </div>
              <div className="f5-body">
                <form onSubmit={createAsset}>
                  <div className="f5-grid">
                    <Field label="Asset Code">
                      <input required className="f5-input" value={assetForm.code} onChange={(e)=>setAssetForm({...assetForm,code:e.target.value})}/>
                    </Field>
                    <Field label="الاسم العربي">
                      <input required className="f5-input" value={assetForm.name_ar} onChange={(e)=>setAssetForm({...assetForm,name_ar:e.target.value})}/>
                    </Field>
                    <Field label="الاسم الإنجليزي">
                      <input className="f5-input" value={assetForm.name_en} onChange={(e)=>setAssetForm({...assetForm,name_en:e.target.value})}/>
                    </Field>
                    <Field label="الفئة">
                      <input className="f5-input" value={assetForm.category} onChange={(e)=>setAssetForm({...assetForm,category:e.target.value})}/>
                    </Field>
                    <Field label="تاريخ الاقتناء">
                      <input required type="date" className="f5-input" value={assetForm.acquisition_date} onChange={(e)=>setAssetForm({...assetForm,acquisition_date:e.target.value})}/>
                    </Field>
                    <Field label="تاريخ بدء الاستخدام">
                      <input required type="date" className="f5-input" value={assetForm.placed_in_service_date} onChange={(e)=>setAssetForm({...assetForm,placed_in_service_date:e.target.value})}/>
                    </Field>
                    <Field label="التكلفة">
                      <input required type="number" min="0.01" step="0.01" className="f5-input" value={assetForm.acquisition_cost} onChange={(e)=>setAssetForm({...assetForm,acquisition_cost:e.target.value})}/>
                    </Field>
                    <Field label="Salvage Value">
                      <input required type="number" min="0" step="0.01" className="f5-input" value={assetForm.salvage_value} onChange={(e)=>setAssetForm({...assetForm,salvage_value:e.target.value})}/>
                    </Field>
                    <Field label="Useful Life · Months">
                      <input required type="number" min="1" className="f5-input" value={assetForm.useful_life_months} onChange={(e)=>setAssetForm({...assetForm,useful_life_months:e.target.value})}/>
                    </Field>
                    <Field label="Fixed Asset Account">
                      <select required className="f5-input" value={assetForm.asset_account_id} onChange={(e)=>setAssetForm({...assetForm,asset_account_id:e.target.value})}>
                        <option value="">اختر</option>
                        {assetAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="Accumulated Depreciation Account">
                      <select required className="f5-input" value={assetForm.accumulated_depreciation_account_id} onChange={(e)=>setAssetForm({...assetForm,accumulated_depreciation_account_id:e.target.value})}>
                        <option value="">اختر</option>
                        {assetAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="Depreciation Expense Account">
                      <select required className="f5-input" value={assetForm.depreciation_expense_account_id} onChange={(e)=>setAssetForm({...assetForm,depreciation_expense_account_id:e.target.value})}>
                        <option value="">اختر</option>
                        {expenseAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="المورد">
                      <select className="f5-input" value={assetForm.vendor_id} onChange={(e)=>setAssetForm({...assetForm,vendor_id:e.target.value})}>
                        <option value="">بدون</option>
                        {vendors.filter(x=>x.is_active).map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="Serial Number">
                      <input className="f5-input" value={assetForm.serial_number} onChange={(e)=>setAssetForm({...assetForm,serial_number:e.target.value})}/>
                    </Field>
                    <Field label="الموقع">
                      <input className="f5-input" value={assetForm.location} onChange={(e)=>setAssetForm({...assetForm,location:e.target.value})}/>
                    </Field>
                  </div>

                  <Notice type="info">
                    Straight-Line Monthly Depreciation المتوقع:
                    {" "}
                    <strong>{money(monthlyDepreciation)}</strong>
                  </Notice>

                  <div className="f5-actions">
                    <button className="f5-button f5-primary" disabled={busy==="asset-create"}>
                      إنشاء الأصل
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="f5-panel">
              <div className="f5-head"><h2>Fixed Asset Register</h2></div>
              <div className="f5-body">
                {!assets.length ? <Empty text="لا توجد أصول ثابتة."/> : (
                  <div className="f5-table-wrap">
                    <table className="f5-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Asset</th>
                          <th>Category</th>
                          <th>Cost</th>
                          <th>Accumulated Dep.</th>
                          <th>NBV</th>
                          <th>Life</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map(x=>(
                          <tr key={x.id}>
                            <td>{x.code}</td>
                            <td><strong>{x.name_ar}</strong><div className="f5-note">{x.name_en||""}</div></td>
                            <td>{x.category||"—"}</td>
                            <td>{money(x.acquisition_cost)}</td>
                            <td>{money(x.accumulated_depreciation)}</td>
                            <td>{money(x.net_book_value)}</td>
                            <td>{x.useful_life_months} شهر</td>
                            <td><Badge value={x.status}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "depreciation" ? (
          <>
            <section className="f5-panel">
              <div className="f5-head"><h2>Monthly Depreciation Run</h2></div>
              <div className="f5-body">
                <form onSubmit={createDepreciationRun}>
                  <div className="f5-grid">
                    <Field label="السنة">
                      <input required type="number" min="2000" max="2200" className="f5-input" value={runForm.year} onChange={(e)=>setRunForm({...runForm,year:e.target.value})}/>
                    </Field>
                    <Field label="الشهر">
                      <input required type="number" min="1" max="12" className="f5-input" value={runForm.month} onChange={(e)=>setRunForm({...runForm,month:e.target.value})}/>
                    </Field>
                    <Field label="ملاحظات">
                      <input className="f5-input" value={runForm.notes} onChange={(e)=>setRunForm({...runForm,notes:e.target.value})}/>
                    </Field>
                  </div>
                  <div className="f5-actions" style={{marginTop:12}}>
                    <button className="f5-button f5-primary" disabled={busy==="dep-create"}>
                      إنشاء Run
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="f5-panel">
              <div className="f5-head"><h2>Depreciation Runs</h2></div>
              <div className="f5-body">
                {!runs.length ? <Empty text="لا توجد Depreciation Runs."/> : (
                  <div className="f5-table-wrap">
                    <table className="f5-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Run Date</th>
                          <th>Assets</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Approval</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runs.map(x=>{
                          const a=x.approval_status||apStatus(x.approval_id);
                          return (
                            <tr key={x.id}>
                              <td>{x.year}-{String(x.month).padStart(2,"0")}</td>
                              <td>{x.run_date}</td>
                              <td>{x.line_count}</td>
                              <td>{money(x.total_depreciation)}</td>
                              <td><Badge value={x.status}/></td>
                              <td>{a?<Badge value={a}/>:"—"}</td>
                              <td>
                                <div className="f5-actions">
                                  {x.status==="draft" ? (
                                    <button className="f5-button f5-warnbtn" onClick={()=>requestDepreciationApproval(x.id)}>
                                      طلب اعتماد
                                    </button>
                                  ) : null}
                                  {x.status==="pending_approval"&&a==="approved" ? (
                                    <button className="f5-button f5-successbtn" onClick={()=>postDepreciation(x.id)}>
                                      ترحيل
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "accruals" ? (
          <>
            <section className="f5-panel">
              <div className="f5-head"><h2>استحقاق جديد</h2></div>
              <div className="f5-body">
                <form onSubmit={createAccrual}>
                  <div className="f5-grid">
                    <Field label="Code">
                      <input required className="f5-input" value={accrualForm.code} onChange={(e)=>setAccrualForm({...accrualForm,code:e.target.value})}/>
                    </Field>
                    <Field label="الوصف">
                      <input required className="f5-input" value={accrualForm.description} onChange={(e)=>setAccrualForm({...accrualForm,description:e.target.value})}/>
                    </Field>
                    <Field label="Accrual Date">
                      <input required type="date" className="f5-input" value={accrualForm.accrual_date} onChange={(e)=>setAccrualForm({...accrualForm,accrual_date:e.target.value})}/>
                    </Field>
                    <Field label="Reversal Date">
                      <input required type="date" className="f5-input" value={accrualForm.reversal_date} onChange={(e)=>setAccrualForm({...accrualForm,reversal_date:e.target.value})}/>
                    </Field>
                    <Field label="المبلغ">
                      <input required type="number" min="0.01" step="0.01" className="f5-input" value={accrualForm.amount} onChange={(e)=>setAccrualForm({...accrualForm,amount:e.target.value})}/>
                    </Field>
                    <Field label="Expense Account">
                      <select required className="f5-input" value={accrualForm.expense_account_id} onChange={(e)=>setAccrualForm({...accrualForm,expense_account_id:e.target.value})}>
                        <option value="">اختر</option>
                        {expenseAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="Accrued Liability Account">
                      <select required className="f5-input" value={accrualForm.accrued_liability_account_id} onChange={(e)=>setAccrualForm({...accrualForm,accrued_liability_account_id:e.target.value})}>
                        <option value="">اختر</option>
                        {liabilityAccounts.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name_ar}</option>)}
                      </select>
                    </Field>
                    <Field label="Reference">
                      <input className="f5-input" value={accrualForm.reference} onChange={(e)=>setAccrualForm({...accrualForm,reference:e.target.value})}/>
                    </Field>
                    <Field label="Department">
                      <input className="f5-input" value={accrualForm.department_code} onChange={(e)=>setAccrualForm({...accrualForm,department_code:e.target.value})}/>
                    </Field>
                    <Field label="Cost Center">
                      <input className="f5-input" value={accrualForm.cost_center} onChange={(e)=>setAccrualForm({...accrualForm,cost_center:e.target.value})}/>
                    </Field>
                  </div>
                  <div className="f5-actions" style={{marginTop:12}}>
                    <button className="f5-button f5-primary" disabled={busy==="accrual-create"}>
                      حفظ كمسودة
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="f5-panel">
              <div className="f5-head"><h2>Accruals</h2></div>
              <div className="f5-body">
                {!accruals.length ? <Empty text="لا توجد استحقاقات."/> : (
                  <div className="f5-table-wrap">
                    <table className="f5-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Accrual Date</th>
                          <th>Reversal Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Approval</th>
                          <th>Reversal Approval</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accruals.map(x=>{
                          const a=x.approval_status||apStatus(x.approval_id);
                          const ra=x.reversal_approval_status||apStatus(x.reversal_approval_id);

                          return (
                            <tr key={x.id}>
                              <td>{x.code}</td>
                              <td>{x.description}</td>
                              <td>{x.accrual_date}</td>
                              <td>{x.reversal_date}</td>
                              <td>{money(x.amount,x.currency)}</td>
                              <td><Badge value={x.status}/></td>
                              <td>{a?<Badge value={a}/>:"—"}</td>
                              <td>{ra?<Badge value={ra}/>:"—"}</td>
                              <td>
                                <div className="f5-actions">
                                  {["draft","rejected"].includes(x.status) ? (
                                    <button className="f5-button f5-warnbtn" onClick={()=>requestAccrualApproval(x.id)}>
                                      اعتماد الاستحقاق
                                    </button>
                                  ) : null}

                                  {x.status==="pending_approval"&&a==="approved" ? (
                                    <button className="f5-button f5-successbtn" onClick={()=>postAccrual(x.id)}>
                                      ترحيل
                                    </button>
                                  ) : null}

                                  {x.status==="posted"&&!x.reversal_approval_id ? (
                                    <button className="f5-button f5-warnbtn" onClick={()=>requestReversal(x.id)}>
                                      طلب اعتماد العكس
                                    </button>
                                  ) : null}

                                  {x.status==="posted"&&ra==="approved" ? (
                                    <button className="f5-button f5-successbtn" onClick={()=>reverseAccrual(x.id)}>
                                      عكس الاستحقاق
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
