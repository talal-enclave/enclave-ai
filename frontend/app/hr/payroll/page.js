"use client";

import { useEffect, useState } from "react";

const C = {
  bg: "#06131e",
  panel: "#0b1d2d",
  primary: "#18d5b7",
  soft: "rgba(24,213,183,.12)",
  beige: "#d9e7e6",
  text: "#fff",
  muted: "#71c8c1",
  border: "rgba(255,255,255,.09)",
  danger: "#ff8b8b",
};

function money(v) {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

export default function PayrollWorkspace() {
  const [summary, setSummary] = useState({});
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedCycle, setSelectedCycle] =
    useState("");
  const [payroll, setPayroll] = useState(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const today = new Date();

  const [cycleForm, setCycleForm] = useState({
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1),
    variance_threshold_pct: "10",
    notes: "",
  });

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
        data.detail || "تعذر تنفيذ العملية"
      );
    }

    return data;
  }

  async function loadEntries(id) {
    if (!id) {
      setPayroll(null);
      return;
    }

    const data = await api(
      `/api/hr/payroll/cycles/${id}/entries`
    );

    setPayroll(data);
  }

  async function load() {
    try {
      setError("");

      const [s,c,e] = await Promise.all([
        api("/api/hr/payroll/summary"),
        api("/api/hr/payroll/cycles"),
        api("/api/hr/employees"),
          ]);

      setSummary(s);
      setCycles(c);
      setEmployees(e);
    
      let cycleId = selectedCycle;

      if (!cycleId && c.length) {
        cycleId = c[0].id;
        setSelectedCycle(cycleId);
      }

      if (cycleId) {
        await loadEntries(cycleId);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCycle(e) {
    e.preventDefault();

    try {
      await api("/api/hr/payroll/cycles", {
        method: "POST",
        body: JSON.stringify({
          year: Number(cycleForm.year),
          month: Number(cycleForm.month),
          variance_threshold_pct:
            Number(
              cycleForm.variance_threshold_pct
              || 10
            ),
          notes: cycleForm.notes || null,
        }),
      });

      setNotice("تم إنشاء دورة الرواتب.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function generatePreview() {
    try {
      await api(
        `/api/hr/payroll/cycles/${selectedCycle}/generate-preview`,
        { method: "POST" }
      );

      setNotice("تم توليد Payroll Preview.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateEntry(id, field, value) {
    try {
      await api(
        `/api/hr/payroll/entries/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            [field]:
              value === ""
                ? 0
                : Number(value),
          }),
        }
      );

      await loadEntries(selectedCycle);
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestApproval() {
    try {
      await api(
        `/api/hr/payroll/cycles/${selectedCycle}/request-approval`,
        { method: "POST" }
      );

      setNotice(
        "تم إرسال Payroll Preview إلى مركز الموافقات. لم يتم تحويل أي مبلغ."
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeCycle() {
    try {
      await api(
        `/api/hr/payroll/cycles/${selectedCycle}/close`,
        { method: "POST" }
      );

      setNotice(
        "تم إقفال الدورة داخليًا. لا يوجد أي تنفيذ بنكي أو تحويل أموال."
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const currentCycle = cycles.find(
    x => x.id === selectedCycle
  );

  const Metric = ({title,value,sub}) => (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );

  return (
    <main dir="rtl">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:${C.bg}}
        main{
          min-height:100vh;
          background:${C.bg};
          color:${C.text};
          padding:28px
        }
        .wrap{max-width:1600px;margin:auto}
        .head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:18px;
          margin-bottom:24px
        }
        .brand{
          display:flex;
          align-items:center;
          gap:18px
        }
        .brand img{width:135px}
        .eye{
          color:${C.primary};
          font-size:11px;
          letter-spacing:1.3px
        }
        h1{margin:5px 0;font-size:28px}
        h2{margin-top:0}
        h3{margin:0}
        .muted{
          color:${C.muted};
          font-size:12px;
          line-height:1.8
        }
        a,button{
          padding:10px 14px;
          border-radius:10px;
          border:1px solid ${C.border};
          background:${C.panel};
          color:${C.text};
          text-decoration:none;
          cursor:pointer;
          font-weight:700
        }
        .primary{
          color:${C.primary};
          border-color:${C.primary};
          background:${C.soft}
        }
        .metrics{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:13px;
          margin-bottom:20px
        }
        .metric,.panel{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:17px;
          padding:20px
        }
        .metric span,.metric small{
          display:block;
          color:${C.muted};
          font-size:11px
        }
        .metric strong{
          display:block;
          font-size:27px;
          margin:10px 0
        }
        .panel{margin-bottom:18px}
        .grid2{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px
        }
        .grid3{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:12px
        }
        label{
          display:block;
          color:${C.muted};
          font-size:11px;
          margin:10px 0 6px
        }
        input,select,textarea{
          width:100%;
          background:${C.bg};
          color:${C.text};
          border:1px solid ${C.border};
          border-radius:9px;
          padding:11px
        }
        textarea{min-height:75px}
        table{
          width:100%;
          border-collapse:collapse
        }
        th,td{
          padding:11px 7px;
          border-bottom:1px solid ${C.border};
          text-align:right;
          font-size:11px
        }
        th{color:${C.muted}}
        .tableWrap{overflow-x:auto}
        .badge{
          display:inline-block;
          padding:4px 9px;
          border-radius:999px;
          font-size:10px;
          background:${C.soft};
          color:${C.primary}
        }
        .alert{
          color:${C.danger};
          font-weight:800
        }
        .notice,.warning,.error{
          padding:12px 15px;
          border-radius:10px;
          margin-bottom:15px;
          font-size:12px;
          line-height:1.7
        }
        .notice{
          color:${C.primary};
          background:${C.soft}
        }
        .warning{
          color:${C.beige};
          border:1px solid rgba(217,201,170,.25)
        }
        .error{
          color:${C.danger};
          border:1px solid rgba(255,100,100,.25)
        }
        .smallInput{
          min-width:85px;
          max-width:105px
        }
        .actions{
          display:flex;
          gap:7px;
          flex-wrap:wrap
        }
        @media(max-width:950px){
          main{padding:15px}
          .metrics{grid-template-columns:1fr 1fr}
          .grid2,.grid3{grid-template-columns:1fr}
        }
      `}</style>

      <div className="wrap">
        <header className="head">
          <div className="brand">
            <img
              src="/brand/enclave-logo.svg"
              alt="Enclave"
            />

            <div>
              <div className="eye">
                ENCLAVE AI · PAYROLL
              </div>

              <h1>الرواتب</h1>

              <div className="muted">
                Payroll Preview · GOSI · Variance Control
              </div>
            </div>
          </div>

          <div>
            <a href="/hr">مساحة HR</a>{" "}
            <a
              href="/dashboard"
              className="primary"
            >
              مركز الموافقات
            </a>
          </div>
        </header>

        <div className="warning">
          هذه الوحدة لإعداد ومراجعة الرواتب داخليًا فقط.
          لا يوجد تحويل بنكي أو ملف دفع أو تنفيذ Payroll خارجي.
          نسب GOSI لا يتم افتراضها تلقائيًا؛ الاستقطاعات تدخل
          وفق البيانات المعتمدة لدى الشركة.
        </div>

        {notice && (
          <div className="notice">{notice}</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        <section className="metrics">
          <Metric
            title="دورات الرواتب"
            value={summary.cycles || 0}
            sub="Payroll Cycles"
          />

          <Metric
            title="بانتظار الاعتماد"
            value={
              summary.pending_payroll_approvals || 0
            }
            sub="Pending Approval"
          />

    

          <Metric
            title="آخر Net Payroll"
            value={`${money(
              summary.latest_net_pay
            )} ر.س`}
            sub={`Employer Cost ${money(
              summary.latest_employer_cost
            )} ر.س`}
          />
        </section>

        <section className="panel">
          <h2>إنشاء دورة رواتب</h2>

          <form onSubmit={createCycle}>
            <div className="grid3">
              <div>
                <label>السنة *</label>
                <input
                  required
                  type="number"
                  value={cycleForm.year}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      year:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الشهر *</label>
                <select
                  value={cycleForm.month}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      month:e.target.value
                    })
                  }
                >
                  {Array.from(
                    {length:12},
                    (_,i) => i + 1
                  ).map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>
                  حد تنبيه التغير %
                </label>
                <input
                  type="number"
                  step=".1"
                  min="0"
                  value={
                    cycleForm.variance_threshold_pct
                  }
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      variance_threshold_pct:
                        e.target.value
                    })
                  }
                />
              </div>
            </div>

            <label>ملاحظات</label>
            <textarea
              value={cycleForm.notes}
              onChange={(e) =>
                setCycleForm({
                  ...cycleForm,
                  notes:e.target.value
                })
              }
            />

            <button
              className="primary"
              style={{marginTop:12}}
            >
              إنشاء الدورة
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Payroll Preview</h2>

          <div className="grid3">
            <div>
              <label>دورة الرواتب</label>
              <select
                value={selectedCycle}
                onChange={async (e) => {
                  const id = e.target.value;
                  setSelectedCycle(id);
                  await loadEntries(id);
                }}
              >
                <option value="">
                  اختر الدورة
                </option>

                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.year}-{String(c.month).padStart(2,"0")}
                    {" · "}
                    {c.status}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="actions"
              style={{alignItems:"end"}}
            >
              {currentCycle &&
               ["draft","preview"].includes(
                 currentCycle.status
               ) &&
               !payroll?.entries?.length ? (
                <button
                  className="primary"
                  onClick={generatePreview}
                >
                  توليد Payroll Preview
                </button>
              ) : null}

              {currentCycle?.status ===
                "preview" &&
               payroll?.entries?.length ? (
                <button
                  onClick={requestApproval}
                >
                  إرسال للاعتماد
                </button>
              ) : null}

              {currentCycle?.approval_status ===
                "approved" &&
               currentCycle?.status !== "closed" ? (
                <button
                  className="primary"
                  onClick={closeCycle}
                >
                  إقفال الدورة
                </button>
              ) : null}
            </div>
          </div>

          {payroll && (
            <>
              <div
                className="grid3"
                style={{marginTop:18}}
              >
                <div>
                  <span className="muted">
                    Gross Payroll
                  </span>
                  <h3>
                    {money(
                      payroll.totals.gross_pay
                    )} ر.س
                  </h3>
                </div>

                <div>
                  <span className="muted">
                    Net Payroll
                  </span>
                  <h3>
                    {money(
                      payroll.totals.net_pay
                    )} ر.س
                  </h3>
                </div>

                <div>
                  <span className="muted">
                    Employer Total Cost
                  </span>
                  <h3>
                    {money(
                      payroll.totals
                        .employer_total_cost
                    )} ر.س
                  </h3>
                </div>
              </div>

              <div
                className="tableWrap"
                style={{marginTop:18}}
              >
                {payroll.entries.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>الموظف</th>
                        <th>الأساسي</th>
                        <th>البدلات الثابتة</th>
                        <th>إضافات أخرى</th>
                        <th>GOSI موظف</th>
                        <th>استقطاعات أخرى</th>
                        <th>Gross</th>
                        <th>Net</th>
                        <th>Employer Cost</th>
                        <th>Variance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payroll.entries.map(entry => (
                        <tr key={entry.id}>
                          <td>
                            {entry.employee_name}
                            <div className="muted">
                              {entry.employee_number}
                            </div>
                          </td>

                          <td>
                            {money(entry.basic_salary)}
                          </td>

                          <td>
                            {money(
                              Number(
                                entry.housing_allowance
                              ) +
                              Number(
                                entry.transport_allowance
                              ) +
                              Number(
                                entry.other_fixed_allowances
                              )
                            )}
                          </td>

                          

                          <td>
                            <input
                              className="smallInput"
                              type="number"
                              defaultValue={
                                entry
                                  .employee_gosi_deduction
                              }
                              disabled={
                                currentCycle?.status
                                !== "preview"
                              }
                              onBlur={(e) =>
                                updateEntry(
                                  entry.id,
                                  "employee_gosi_deduction",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="smallInput"
                              type="number"
                              defaultValue={
                                entry.other_deductions
                              }
                              disabled={
                                currentCycle?.status
                                !== "preview"
                              }
                              onBlur={(e) =>
                                updateEntry(
                                  entry.id,
                                  "other_deductions",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            {money(entry.gross_pay)}
                          </td>

                          <td>
                            <strong>
                              {money(entry.net_pay)}
                            </strong>
                          </td>

                          <td>
                            {money(
                              entry.employer_total_cost
                            )}
                          </td>

                          <td>
                            {entry.variance_pct == null
                              ? "—"
                              : (
                                <span
                                  className={
                                    entry.variance_alert
                                      ? "alert"
                                      : ""
                                  }
                                >
                                  {entry.variance_pct}%
                                </span>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="muted">
                    لا توجد Payroll Entries في هذه الدورة.
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <div className="grid2">
          
        </div>
      </div>
    </main>
  );
}
