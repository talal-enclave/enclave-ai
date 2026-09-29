"use client";

import { useEffect, useMemo, useState } from "react";

const F = "/api/finance/reports";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yearStart() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function monthValue() {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  };
}

function money(value, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function number(value) {
  return new Intl.NumberFormat("en-SA", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
  });

  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await response.json()
    : { detail: await response.text() };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data)
    );
  }

  return data;
}

function Notice({ type = "info", children }) {
  return <div className={`fr-notice fr-${type}`}>{children}</div>;
}

function Empty({ text }) {
  return <div className="fr-empty">{text}</div>;
}

function Badge({ ok, text }) {
  return (
    <span className={`fr-badge ${ok ? "fr-ok" : "fr-bad"}`}>
      {text}
    </span>
  );
}

function AgingCards({ data }) {
  const values = data?.buckets || {};
  const items = [
    ["current", "Current"],
    ["1_30", "1–30"],
    ["31_60", "31–60"],
    ["61_90", "61–90"],
    ["90_plus", "90+"],
  ];

  return (
    <div className="fr-aging">
      {items.map(([key, label]) => (
        <div className="fr-card" key={key}>
          <small>{label}</small>
          <strong>{money(values[key] || 0)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function FinanceReportsPage() {
  const currentMonth = monthValue();

  const [tab, setTab] = useState("dashboard");
  const [fromDate, setFromDate] = useState(yearStart());
  const [toDate, setToDate] = useState(today());
  const [asOfDate, setAsOfDate] = useState(today());
  const [closeYear, setCloseYear] = useState(currentMonth.year);
  const [closeMonth, setCloseMonth] = useState(currentMonth.month);

  const [dashboard, setDashboard] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [cashPosition, setCashPosition] = useState(null);
  const [cashMovement, setCashMovement] = useState(null);
  const [apAging, setApAging] = useState(null);
  const [arAging, setArAging] = useState(null);
  const [vat, setVat] = useState(null);
  const [closeReadiness, setCloseReadiness] = useState(null);

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const run = async (key, fn, msg) => {
    setError("");
    setMessage("");
    setBusy(key);

    try {
      const data = await fn();
      if (msg) setMessage(msg);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setBusy("");
    }
  };

  const loadDashboard = () =>
    run(
      "dashboard",
      async () => {
        const data = await api(
          `${F}/dashboard?as_of_date=${asOfDate}`
        );
        setDashboard(data);
        return data;
      },
      "تم تحديث لوحة التقارير."
    );

  const loadPnl = () =>
    run("pnl", async () => {
      const data = await api(
        `${F}/profit-loss?from_date=${fromDate}&to_date=${toDate}`
      );
      setPnl(data);
      return data;
    });

  const loadBalanceSheet = () =>
    run("bs", async () => {
      const data = await api(
        `${F}/balance-sheet?as_of_date=${asOfDate}`
      );
      setBalanceSheet(data);
      return data;
    });

  const loadCash = () =>
    run("cash", async () => {
      const [position, movement] = await Promise.all([
        api(`${F}/cash-position?as_of_date=${asOfDate}`),
        api(
          `${F}/cash-movement?from_date=${fromDate}&to_date=${toDate}`
        ),
      ]);
      setCashPosition(position);
      setCashMovement(movement);
      return { position, movement };
    });

  const loadAging = () =>
    run("aging", async () => {
      const [ap, ar] = await Promise.all([
        api(`${F}/ap-aging?as_of_date=${asOfDate}`),
        api(`${F}/ar-aging?as_of_date=${asOfDate}`),
      ]);
      setApAging(ap);
      setArAging(ar);
      return { ap, ar };
    });

  const loadVat = () =>
    run("vat", async () => {
      const data = await api(
        `${F}/vat-summary?from_date=${fromDate}&to_date=${toDate}`
      );
      setVat(data);
      return data;
    });

  const loadClose = () =>
    run("close", async () => {
      const data = await api(
        `${F}/close-readiness?year=${Number(closeYear)}&month=${Number(closeMonth)}`
      );
      setCloseReadiness(data);
      return data;
    });

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, []);

  const pnlRows = useMemo(
    () => [
      ...(pnl?.revenues || []).map((x) => ({
        ...x,
        section: "Revenue",
      })),
      ...(pnl?.expenses || []).map((x) => ({
        ...x,
        section: "Expense",
      })),
    ],
    [pnl]
  );

  const tabs = [
    ["dashboard", "Executive Dashboard"],
    ["pnl", "P&L"],
    ["bs", "Balance Sheet"],
    ["cash", "Cash"],
    ["aging", "AP / AR Aging"],
    ["vat", "VAT"],
    ["close", "Month-End Close"],
  ];

  return (
    <main className="fr-page" dir="rtl">
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#06131e}
        .fr-page{min-height:100vh;padding:26px;color:#f7fafc;font-family:Arial,"Segoe UI",sans-serif}
        .fr-shell{max-width:1500px;margin:0 auto}
        .fr-hero{background:#0f172a;color:#fff;border-radius:20px;padding:25px 28px;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
        .fr-hero h1{margin:0;font-size:clamp(27px,3vw,39px)}
        .fr-hero p{color:#d9e7e6;margin:8px 0 0;line-height:1.7;font-size:13px}
        .fr-links,.fr-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
        .fr-link{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);padding:9px 12px;border-radius:10px;font-size:11px;font-weight:800}
        .fr-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}
        .fr-tab{border:1px solid #dce2ea;background:#0b1d2d;padding:9px 12px;border-radius:999px;font-weight:800;color:#9bbfbd;cursor:pointer;font-size:11px}
        .fr-tab.active{background:#0b1d2d;color:#fff;border-color:#0b1d2d}
        .fr-panel{background:#0b1d2d;border:1px solid #234a57;border-radius:17px;margin-bottom:18px;box-shadow:0 7px 24px rgba(15,23,42,.05);overflow:hidden}
        .fr-head{padding:17px 20px;border-bottom:1px solid #102735;display:flex;justify-content:space-between;gap:12px;align-items:center}
        .fr-head h2{margin:0;font-size:18px}.fr-body{padding:20px}
        .fr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}
        .fr-field{display:grid;gap:5px}.fr-field label{font-size:11px;font-weight:800;color:#9bbfbd}
        .fr-input{width:100%;min-height:40px;border:1px solid #234a57;border-radius:9px;padding:8px 10px;background:#0b1d2d;color:#f7fafc}
        .fr-button{border:0;border-radius:9px;padding:9px 12px;min-height:36px;font-size:11px;font-weight:800;cursor:pointer}
        .fr-button:disabled{opacity:.45}.fr-primary{background:#0b1d2d;color:#fff}.fr-secondary{background:#102735;color:#f7fafc}
        .fr-kpis{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:10px}
        .fr-card{padding:15px;background:#0e2634;border:1px solid #e5eaf0;border-radius:12px}
        .fr-card small{display:block;color:#8fb8b6;margin-bottom:5px}.fr-card strong{font-size:21px}
        .fr-aging{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px}
        .fr-table-wrap{overflow:auto;border:1px solid #234a57;border-radius:11px}
        .fr-table{width:100%;border-collapse:collapse;min-width:900px;font-size:11px}
        .fr-table th{text-align:right;background:#102735;color:#9bbfbd;padding:10px}
        .fr-table td{padding:10px;border-top:1px solid #102735;vertical-align:top}
        .fr-notice{margin:12px 0;padding:11px 13px;border-radius:10px;font-size:12px}
        .fr-info{background:#102b3d;color:#72b7ff;border:1px solid #315b7c}
        .fr-success{background:#0b302b;color:#72dfc7;border:1px solid #2d6a5e}
        .fr-error{background:#321d26;color:#ff9cac;border:1px solid #71404a}
        .fr-empty{text-align:center;color:#8fb8b6;padding:36px 14px}
        .fr-badge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800}
        .fr-ok{background:#0b302b;color:#72dfc7}.fr-bad{background:#321d26;color:#ff9cac}
        .fr-pos{color:#72dfc7;font-weight:800}.fr-neg{color:#ff9cac;font-weight:800}
        .fr-section{font-weight:900;color:#b2cfcd}.fr-small{font-size:10px;color:#8fb8b6}
        @media(max-width:1200px){.fr-kpis{grid-template-columns:repeat(3,1fr)}.fr-aging{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:800px){.fr-grid{grid-template-columns:1fr}.fr-kpis,.fr-aging{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.fr-page{padding:13px}.fr-hero{flex-direction:column}.fr-kpis,.fr-aging{grid-template-columns:1fr}}
      `}</style>

      <div className="fr-shell">
        <section className="fr-hero">
          <div>
            <h1>Financial Reporting & Close</h1>
            <p>
              P&amp;L، Balance Sheet، Cash، Aging، VAT وMonth-End Close
              Readiness مبنية على القيود المرحلة والبيانات المالية التشغيلية.
            </p>
          </div>
          <div className="fr-links">
            <a className="fr-link" href="/finance">Finance Workspace</a>
            <a className="fr-link" href="/finance/ap-ar">AP / AR</a>
            <a className="fr-link" href="/finance/cash-bank">Cash, Bank & Planning</a>

            <a className="fr-link" href="/finance/assets-accruals">Fixed Assets & Accruals</a>
            <a className="fr-link" href="/">الرئيسية</a>
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="fr-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={`fr-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab !== "close" ? (
          <section className="fr-panel">
            <div className="fr-head"><h2>فترة التقرير</h2></div>
            <div className="fr-body">
              <div className="fr-grid">
                <div className="fr-field">
                  <label>من</label>
                  <input className="fr-input" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
                </div>
                <div className="fr-field">
                  <label>إلى</label>
                  <input className="fr-input" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
                </div>
                <div className="fr-field">
                  <label>As Of</label>
                  <input className="fr-input" type="date" value={asOfDate} onChange={(e)=>setAsOfDate(e.target.value)} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "dashboard" ? (
          <section className="fr-panel">
            <div className="fr-head">
              <h2>Executive Dashboard</h2>
              <button className="fr-button fr-primary" disabled={busy==="dashboard"} onClick={()=>loadDashboard().catch(()=>{})}>تحديث</button>
            </div>
            <div className="fr-body">
              {!dashboard ? <Empty text="اضغط تحديث لتحميل اللوحة."/> : (
                <div className="fr-kpis">
                  <div className="fr-card"><small>YTD Revenue</small><strong>{money(dashboard.year_to_date?.revenue)}</strong></div>
                  <div className="fr-card"><small>YTD Expense</small><strong>{money(dashboard.year_to_date?.expense)}</strong></div>
                  <div className="fr-card"><small>YTD Net Profit</small><strong className={Number(dashboard.year_to_date?.net_profit)>=0?"fr-pos":"fr-neg"}>{money(dashboard.year_to_date?.net_profit)}</strong></div>
                  <div className="fr-card"><small>Cash Position</small><strong>{money(dashboard.cash_position)}</strong></div>
                  <div className="fr-card"><small>AP Outstanding</small><strong>{money(dashboard.ap_outstanding)}</strong></div>
                  <div className="fr-card"><small>AR Outstanding</small><strong>{money(dashboard.ar_outstanding)}</strong></div>
                </div>
              )}
              {dashboard ? <Notice type="info">Pending Finance Approvals: <strong>{number(dashboard.pending_finance_approvals)}</strong> · As of {dashboard.as_of_date}</Notice> : null}
            </div>
          </section>
        ) : null}

        {tab === "pnl" ? (
          <section className="fr-panel">
            <div className="fr-head"><h2>Profit & Loss</h2><button className="fr-button fr-primary" disabled={busy==="pnl"} onClick={()=>loadPnl().catch(()=>{})}>تشغيل التقرير</button></div>
            <div className="fr-body">
              {pnl ? <>
                <div className="fr-kpis" style={{gridTemplateColumns:"repeat(3,minmax(120px,1fr))"}}>
                  <div className="fr-card"><small>Total Revenue</small><strong>{money(pnl.total_revenue)}</strong></div>
                  <div className="fr-card"><small>Total Expense</small><strong>{money(pnl.total_expense)}</strong></div>
                  <div className="fr-card"><small>Net Profit</small><strong className={Number(pnl.net_profit)>=0?"fr-pos":"fr-neg"}>{money(pnl.net_profit)}</strong></div>
                </div>
                <div className="fr-table-wrap" style={{marginTop:14}}>
                  <table className="fr-table">
                    <thead><tr><th>Section</th><th>Account</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                    <tbody>{pnlRows.map((x)=><tr key={`${x.section}-${x.account_id}`}><td className="fr-section">{x.section}</td><td>{x.code} — {x.name_ar}</td><td>{money(x.debit)}</td><td>{money(x.credit)}</td><td>{money(x.balance)}</td></tr>)}</tbody>
                  </table>
                </div>
              </> : <Empty text="شغّل التقرير لعرض P&L."/>}
            </div>
          </section>
        ) : null}

        {tab === "bs" ? (
          <section className="fr-panel">
            <div className="fr-head"><h2>Balance Sheet</h2><button className="fr-button fr-primary" disabled={busy==="bs"} onClick={()=>loadBalanceSheet().catch(()=>{})}>تشغيل التقرير</button></div>
            <div className="fr-body">
              {balanceSheet ? <>
                <div className="fr-kpis" style={{gridTemplateColumns:"repeat(4,minmax(120px,1fr))"}}>
                  <div className="fr-card"><small>Total Assets</small><strong>{money(balanceSheet.total_assets)}</strong></div>
                  <div className="fr-card"><small>Total Liabilities</small><strong>{money(balanceSheet.total_liabilities)}</strong></div>
                  <div className="fr-card"><small>Unclosed Earnings</small><strong>{money(balanceSheet.unclosed_earnings)}</strong></div>
                  <div className="fr-card"><small>Difference</small><strong className={Math.abs(Number(balanceSheet.balance_difference))<=0.01?"fr-pos":"fr-neg"}>{money(balanceSheet.balance_difference)}</strong></div>
                </div>
                <Notice type={balanceSheet.balanced ? "success" : "error"}>
                  {balanceSheet.balanced ? "Balance Sheet متوازن." : "يوجد فرق في Balance Sheet."}
                </Notice>
                <div className="fr-table-wrap">
                  <table className="fr-table">
                    <thead><tr><th>Type</th><th>Account</th><th>Balance</th></tr></thead>
                    <tbody>
                      {[...(balanceSheet.assets||[]).map(x=>({...x,section:"Asset"})),...(balanceSheet.liabilities||[]).map(x=>({...x,section:"Liability"})),...(balanceSheet.equity||[]).map(x=>({...x,section:"Equity"}))].map(x=><tr key={`${x.section}-${x.account_id}`}><td className="fr-section">{x.section}</td><td>{x.code} — {x.name_ar}</td><td>{money(x.balance)}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </> : <Empty text="شغّل التقرير لعرض Balance Sheet."/>}
            </div>
          </section>
        ) : null}

        {tab === "cash" ? (
          <>
            <section className="fr-panel">
              <div className="fr-head"><h2>Cash Position & Movement</h2><button className="fr-button fr-primary" disabled={busy==="cash"} onClick={()=>loadCash().catch(()=>{})}>تشغيل التقرير</button></div>
              <div className="fr-body">
                {cashMovement ? <div className="fr-kpis" style={{gridTemplateColumns:"repeat(5,minmax(120px,1fr))"}}>
                  <div className="fr-card"><small>Opening Cash</small><strong>{money(cashMovement.opening_cash)}</strong></div>
                  <div className="fr-card"><small>Inflows</small><strong className="fr-pos">{money(cashMovement.inflows)}</strong></div>
                  <div className="fr-card"><small>Outflows</small><strong className="fr-neg">{money(cashMovement.outflows)}</strong></div>
                  <div className="fr-card"><small>Net Movement</small><strong>{money(cashMovement.net_movement)}</strong></div>
                  <div className="fr-card"><small>Closing Cash</small><strong>{money(cashMovement.closing_cash)}</strong></div>
                </div> : null}
                {cashPosition ? <>
                  <h3>الحسابات البنكية</h3>
                  <div className="fr-table-wrap"><table className="fr-table"><thead><tr><th>Code</th><th>Bank</th><th>Opening</th><th>GL Movement</th><th>Balance</th></tr></thead><tbody>{cashPosition.banks.map(x=><tr key={x.bank_account_id}><td>{x.code}</td><td>{x.bank_name}</td><td>{money(x.opening_balance,x.currency)}</td><td>{money(x.gl_movement,x.currency)}</td><td>{money(x.balance,x.currency)}</td></tr>)}</tbody></table></div>
                </> : <Empty text="شغّل التقرير لعرض النقد."/>}
                {cashMovement ? <Notice type="info">{cashMovement.note}</Notice> : null}
              </div>
            </section>
          </>
        ) : null}

        {tab === "aging" ? (
          <>
            <section className="fr-panel">
              <div className="fr-head"><h2>AP / AR Aging</h2><button className="fr-button fr-primary" disabled={busy==="aging"} onClick={()=>loadAging().catch(()=>{})}>تشغيل التقرير</button></div>
              <div className="fr-body">
                <h3>Accounts Payable</h3>
                {apAging ? <>
                  <AgingCards data={apAging}/>
                  <Notice type="info">Total AP Outstanding: <strong>{money(apAging.total_outstanding)}</strong></Notice>
                  <div className="fr-table-wrap"><table className="fr-table"><thead><tr><th>Vendor</th><th>Bill</th><th>Due</th><th>Days</th><th>Bucket</th><th>Outstanding</th></tr></thead><tbody>{apAging.rows.map(x=><tr key={x.bill_id}><td>{x.vendor_name}</td><td>{x.bill_number}</td><td>{x.due_date}</td><td>{x.days_overdue}</td><td>{x.bucket}</td><td>{money(x.outstanding,x.currency)}</td></tr>)}</tbody></table></div>
                </> : <Empty text="شغّل التقرير لعرض AP Aging."/>}

                <h3 style={{marginTop:24}}>Accounts Receivable</h3>
                {arAging ? <>
                  <AgingCards data={arAging}/>
                  <Notice type="info">Total AR Outstanding: <strong>{money(arAging.total_outstanding)}</strong></Notice>
                  <div className="fr-table-wrap"><table className="fr-table"><thead><tr><th>Customer</th><th>Invoice</th><th>Due</th><th>Days</th><th>Bucket</th><th>Outstanding</th></tr></thead><tbody>{arAging.rows.map(x=><tr key={x.invoice_id}><td>{x.customer_name}</td><td>{x.invoice_number}</td><td>{x.due_date}</td><td>{x.days_overdue}</td><td>{x.bucket}</td><td>{money(x.outstanding,x.currency)}</td></tr>)}</tbody></table></div>
                </> : <Empty text="شغّل التقرير لعرض AR Aging."/>}
              </div>
            </section>
          </>
        ) : null}

        {tab === "vat" ? (
          <section className="fr-panel">
            <div className="fr-head"><h2>VAT Summary</h2><button className="fr-button fr-primary" disabled={busy==="vat"} onClick={()=>loadVat().catch(()=>{})}>تشغيل التقرير</button></div>
            <div className="fr-body">
              {vat ? <>
                <div className="fr-kpis" style={{gridTemplateColumns:"repeat(4,minmax(120px,1fr))"}}>
                  <div className="fr-card"><small>Input VAT · Bills</small><strong>{money(vat.input_vat?.bills)}</strong></div>
                  <div className="fr-card"><small>Input VAT · Cash Expenses</small><strong>{money(vat.input_vat?.cash_expenses)}</strong></div>
                  <div className="fr-card"><small>Output VAT</small><strong>{money(vat.output_vat?.total)}</strong></div>
                  <div className="fr-card"><small>Net VAT</small><strong className={Number(vat.net_vat_payable)>0?"fr-neg":"fr-pos"}>{money(vat.net_vat_payable)}</strong></div>
                </div>
                <Notice type="info">
                  Position: <strong>{vat.position}</strong>. {vat.note}
                </Notice>
              </> : <Empty text="شغّل التقرير لعرض VAT Summary."/>}
            </div>
          </section>
        ) : null}

        {tab === "close" ? (
          <section className="fr-panel">
            <div className="fr-head"><h2>Month-End Close Readiness</h2></div>
            <div className="fr-body">
              <div className="fr-grid">
                <div className="fr-field">
                  <label>السنة</label>
                  <input className="fr-input" type="number" min="2000" max="2200" value={closeYear} onChange={(e)=>setCloseYear(e.target.value)} />
                </div>
                <div className="fr-field">
                  <label>الشهر</label>
                  <input className="fr-input" type="number" min="1" max="12" value={closeMonth} onChange={(e)=>setCloseMonth(e.target.value)} />
                </div>
                <div className="fr-field">
                  <label>&nbsp;</label>
                  <button className="fr-button fr-primary" disabled={busy==="close"} onClick={()=>loadClose().catch(()=>{})}>فحص الجاهزية</button>
                </div>
              </div>

              {closeReadiness ? <>
                <Notice type={closeReadiness.ready_to_close || closeReadiness.already_closed ? "success" : "error"}>
                  {!closeReadiness.period_found
                    ? "الفترة المحاسبية غير موجودة."
                    : closeReadiness.already_closed
                    ? "الفترة مغلقة بالفعل."
                    : closeReadiness.ready_to_close
                    ? "الفترة جاهزة لبدء مسار اعتماد الإغلاق."
                    : "الفترة غير جاهزة للإغلاق حتى معالجة البنود أدناه."}
                </Notice>

                {closeReadiness.checks ? (
                  <div className="fr-kpis" style={{gridTemplateColumns:"repeat(3,minmax(120px,1fr))"}}>
                    {Object.entries(closeReadiness.checks).map(([key,value])=>(
                      <div className="fr-card" key={key}>
                        <small>{key.replaceAll("_"," ")}</small>
                        <strong className={Number(value)===0?"fr-pos":"fr-neg"}>{number(value)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                {closeReadiness.blockers?.length ? (
                  <div className="fr-table-wrap" style={{marginTop:14}}>
                    <table className="fr-table">
                      <thead><tr><th>Blocker</th><th>Count</th><th>Message</th></tr></thead>
                      <tbody>{closeReadiness.blockers.map(x=><tr key={x.code}><td>{x.code}</td><td>{x.count}</td><td>{x.message}</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : null}

                <Notice type="info">{closeReadiness.note}</Notice>
              </> : <Empty text="اختر الشهر ثم اضغط فحص الجاهزية."/>}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
