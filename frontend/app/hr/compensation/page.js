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

const ratings = {
  exceptional: "استثنائي",
  exceeds_expectations: "يتجاوز التوقعات",
  meets_expectations: "يحقق التوقعات",
  partially_meets: "يحقق جزئيًا",
  needs_improvement: "يحتاج تحسين",
};

function money(value) {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CompensationWorkspace() {
  const [summary, setSummary] = useState({});
  const [cycles, setCycles] = useState([]);
  const [performanceCycles, setPerformanceCycles] =
    useState([]);
  const [employees, setEmployees] = useState([]);
  const [rules, setRules] = useState({
    merit_rules: [],
    bonus_rules: [],
  });
  const [recommendations, setRecommendations] =
    useState([]);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [cycleForm, setCycleForm] = useState({
    name: "",
    performance_cycle_id: "",
    merit_budget_amount: "",
    bonus_budget_amount: "",
    notes: "",
  });

  const [meritForm, setMeritForm] = useState({
    cycle_id: "",
    performance_rating: "meets_expectations",
    compa_ratio_min: "0",
    compa_ratio_max: "89.99",
    increase_pct: "",
  });

  const [bonusForm, setBonusForm] = useState({
    cycle_id: "",
    performance_rating: "meets_expectations",
    bonus_pct_of_monthly_basic: "",
  });

  const [recommendationForm, setRecommendationForm] =
    useState({
      cycle_id: "",
      employee_id: "",
      effective_date: "",
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

  async function load() {
    try {
      setError("");

      const [s,c,pc,e,r,recs] = await Promise.all([
        api("/api/hr/compensation/summary"),
        api("/api/hr/compensation/cycles"),
        api("/api/hr/performance/cycles"),
        api("/api/hr/employees"),
        api("/api/hr/compensation/rules"),
        api("/api/hr/compensation/recommendations"),
      ]);

      setSummary(s);
      setCycles(c);
      setPerformanceCycles(pc);
      setEmployees(e);
      setRules(r);
      setRecommendations(recs);
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
      await api(
        "/api/hr/compensation/cycles",
        {
          method: "POST",
          body: JSON.stringify({
            name: cycleForm.name,
            performance_cycle_id:
              cycleForm.performance_cycle_id || null,
            merit_budget_amount:
              cycleForm.merit_budget_amount
                ? Number(
                    cycleForm.merit_budget_amount
                  )
                : null,
            bonus_budget_amount:
              cycleForm.bonus_budget_amount
                ? Number(
                    cycleForm.bonus_budget_amount
                  )
                : null,
            notes: cycleForm.notes || null,
          }),
        }
      );

      setCycleForm({
        name: "",
        performance_cycle_id: "",
        merit_budget_amount: "",
        bonus_budget_amount: "",
        notes: "",
      });

      setNotice("تم إنشاء دورة التعويضات.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createMeritRule(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/compensation/merit-rules",
        {
          method: "POST",
          body: JSON.stringify({
            cycle_id: meritForm.cycle_id,
            performance_rating:
              meritForm.performance_rating,
            compa_ratio_min:
              Number(meritForm.compa_ratio_min),
            compa_ratio_max:
              Number(meritForm.compa_ratio_max),
            increase_pct:
              Number(meritForm.increase_pct),
          }),
        }
      );

      setNotice("تمت إضافة قاعدة Merit.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createBonusRule(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/compensation/bonus-rules",
        {
          method: "POST",
          body: JSON.stringify({
            cycle_id: bonusForm.cycle_id,
            performance_rating:
              bonusForm.performance_rating,
            bonus_pct_of_monthly_basic:
              Number(
                bonusForm.bonus_pct_of_monthly_basic
              ),
          }),
        }
      );

      setNotice("تمت إضافة قاعدة Bonus.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function generateRecommendation(e) {
    e.preventDefault();

    try {
      const result = await api(
        "/api/hr/compensation/recommendations",
        {
          method: "POST",
          body: JSON.stringify({
            ...recommendationForm,
            notes:
              recommendationForm.notes || null,
          }),
        }
      );

      setNotice(
        `تم الحساب: الزيادة ${result.merit_pct}% · Bonus ${money(result.bonus_amount)} ر.س`
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestApproval(id) {
    try {
      await api(
        `/api/hr/compensation/recommendations/${id}/request-approval`,
        { method: "POST" }
      );

      setNotice(
        "تم إرسال التوصية إلى مركز الموافقات."
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyRecommendation(id) {
    try {
      const result = await api(
        `/api/hr/compensation/recommendations/${id}/apply`,
        { method: "POST" }
      );

      setNotice(
        `تم تحديث الراتب الأساسي إلى ${money(result.new_basic)} ر.س. لم يتم دفع Bonus أو تنفيذ Payroll.`
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

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
        .wrap{max-width:1550px;margin:auto}
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
        h3{margin:0 0 6px}
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
        textarea{min-height:80px}
        table{
          width:100%;
          border-collapse:collapse
        }
        th,td{
          padding:12px 8px;
          border-bottom:1px solid ${C.border};
          text-align:right;
          font-size:12px
        }
        th{color:${C.muted}}
        .badge{
          display:inline-block;
          padding:4px 9px;
          border-radius:999px;
          background:${C.soft};
          color:${C.primary};
          font-size:10px
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
        .rule{
          padding:10px 0;
          border-bottom:1px solid ${C.border};
          color:${C.muted};
          font-size:12px
        }
        @media(max-width:950px){
          main{padding:15px}
          .metrics{grid-template-columns:1fr 1fr}
          .grid2,.grid3{grid-template-columns:1fr}
          .tableWrap{overflow:auto}
          table{min-width:1100px}
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
                ENCLAVE AI · COMPENSATION & REWARDS
              </div>

              <h1>التعويضات والمكافآت</h1>

              <div className="muted">
                Salary Range · Compa-Ratio · Merit Matrix · Annual KPI Bonus
              </div>
            </div>
          </div>

          <div>
            <a href="/hr">مساحة HR</a>{" "}
            <a href="/dashboard" className="primary">
              مركز الموافقات
            </a>
          </div>
        </header>

        <div className="warning">
          التوصيات هنا لا تدفع Bonus ولا تنفذ Payroll.
          الزيادة لا تعدّل العقد إلا بعد اعتمادك وتطبيق القرار.
          Bonus محسوب كنسبة من راتب أساسي شهري واحد،
          وموظفو إدارة المبيعات مستبعدون منه تلقائيًا.
        </div>

        {notice && (
          <div className="notice">{notice}</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        <section className="metrics">
          <Metric
            title="دورات التعويضات"
            value={summary.active_cycles || 0}
            sub="Active Cycles"
          />
          <Metric
            title="قواعد Merit"
            value={summary.merit_rules || 0}
            sub="Merit Matrix"
          />
          <Metric
            title="قواعد Bonus"
            value={summary.bonus_rules || 0}
            sub="Bonus Rules"
          />
          <Metric
            title="توصيات بانتظار الاعتماد"
            value={summary.pending_approvals || 0}
            sub="Pending Approval"
          />
          <Metric
            title="التكلفة المقترحة"
            value={`${money(
              Number(
                summary.proposed_annual_merit_cost || 0
              ) +
              Number(
                summary.proposed_bonus_amount || 0
              )
            )} ر.س`}
            sub="Merit + Bonus"
          />
        </section>

        <section className="panel">
          <h2>إنشاء دورة تعويضات</h2>

          <form onSubmit={createCycle}>
            <div className="grid3">
              <div>
                <label>اسم الدورة *</label>
                <input
                  required
                  placeholder="Compensation Review 2027"
                  value={cycleForm.name}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      name:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>دورة الأداء المرتبطة</label>
                <select
                  value={cycleForm.performance_cycle_id}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      performance_cycle_id:
                        e.target.value
                    })
                  }
                >
                  <option value="">
                    آخر تقييم مكتمل لكل موظف
                  </option>

                  {performanceCycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>ميزانية الزيادات السنوية</label>
                <input
                  type="number"
                  value={cycleForm.merit_budget_amount}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      merit_budget_amount:
                        e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>ميزانية Bonus</label>
                <input
                  type="number"
                  value={cycleForm.bonus_budget_amount}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      bonus_budget_amount:
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

        <div className="grid2">
          <section className="panel">
            <h2>Merit Matrix</h2>

            <form onSubmit={createMeritRule}>
              <label>دورة التعويضات *</label>
              <select
                required
                value={meritForm.cycle_id}
                onChange={(e) =>
                  setMeritForm({
                    ...meritForm,
                    cycle_id:e.target.value
                  })
                }
              >
                <option value="">اختر الدورة</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="grid2">
                <div>
                  <label>تصنيف الأداء</label>
                  <select
                    value={meritForm.performance_rating}
                    onChange={(e) =>
                      setMeritForm({
                        ...meritForm,
                        performance_rating:
                          e.target.value
                      })
                    }
                  >
                    {Object.entries(ratings).map(
                      ([key,label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>نسبة الزيادة %</label>
                  <input
                    required
                    type="number"
                    step=".01"
                    min="0"
                    value={meritForm.increase_pct}
                    onChange={(e) =>
                      setMeritForm({
                        ...meritForm,
                        increase_pct:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>Compa-Ratio من</label>
                  <input
                    required
                    type="number"
                    step=".01"
                    value={meritForm.compa_ratio_min}
                    onChange={(e) =>
                      setMeritForm({
                        ...meritForm,
                        compa_ratio_min:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>Compa-Ratio إلى</label>
                  <input
                    required
                    type="number"
                    step=".01"
                    value={meritForm.compa_ratio_max}
                    onChange={(e) =>
                      setMeritForm({
                        ...meritForm,
                        compa_ratio_max:e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <button
                className="primary"
                style={{marginTop:12}}
              >
                إضافة قاعدة Merit
              </button>
            </form>

            <div style={{marginTop:18}}>
              {rules.merit_rules.map(rule => (
                <div className="rule" key={rule.id}>
                  {ratings[rule.performance_rating]}
                  {" · "}
                  CR {rule.compa_ratio_min}–{rule.compa_ratio_max}
                  {" · "}
                  زيادة {rule.increase_pct}%
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Annual KPI Bonus</h2>

            <div className="muted">
              النسبة تطبق على راتب أساسي شهري واحد.
            </div>

            <form onSubmit={createBonusRule}>
              <label>دورة التعويضات *</label>
              <select
                required
                value={bonusForm.cycle_id}
                onChange={(e) =>
                  setBonusForm({
                    ...bonusForm,
                    cycle_id:e.target.value
                  })
                }
              >
                <option value="">اختر الدورة</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label>تصنيف الأداء</label>
              <select
                value={bonusForm.performance_rating}
                onChange={(e) =>
                  setBonusForm({
                    ...bonusForm,
                    performance_rating:e.target.value
                  })
                }
              >
                {Object.entries(ratings).map(
                  ([key,label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>

              <label>Bonus % من الراتب الأساسي الشهري</label>
              <input
                required
                type="number"
                step=".01"
                min="0"
                value={
                  bonusForm.bonus_pct_of_monthly_basic
                }
                onChange={(e) =>
                  setBonusForm({
                    ...bonusForm,
                    bonus_pct_of_monthly_basic:
                      e.target.value
                  })
                }
              />

              <button
                className="primary"
                style={{marginTop:12}}
              >
                إضافة قاعدة Bonus
              </button>
            </form>

            <div style={{marginTop:18}}>
              {rules.bonus_rules.map(rule => (
                <div className="rule" key={rule.id}>
                  {ratings[rule.performance_rating]}
                  {" · "}
                  Bonus{" "}
                  {rule.bonus_pct_of_monthly_basic}%
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <h2>إنشاء توصية تعويضات</h2>

          <div className="muted">
            يتطلب: موظف نشط + عقد نشط + نطاق راتب Min/Mid/Max
            للمنصب + تقييم أداء مكتمل.
          </div>

          <form onSubmit={generateRecommendation}>
            <div className="grid3">
              <div>
                <label>دورة التعويضات *</label>
                <select
                  required
                  value={recommendationForm.cycle_id}
                  onChange={(e) =>
                    setRecommendationForm({
                      ...recommendationForm,
                      cycle_id:e.target.value
                    })
                  }
                >
                  <option value="">اختر الدورة</option>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>الموظف *</label>
                <select
                  required
                  value={recommendationForm.employee_id}
                  onChange={(e) =>
                    setRecommendationForm({
                      ...recommendationForm,
                      employee_id:e.target.value
                    })
                  }
                >
                  <option value="">اختر الموظف</option>

                  {employees
                    .filter(
                      e => e.employment_status === "active"
                    )
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.employee_number} · {e.full_name_ar}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label>تاريخ سريان الزيادة *</label>
                <input
                  required
                  type="date"
                  value={recommendationForm.effective_date}
                  onChange={(e) =>
                    setRecommendationForm({
                      ...recommendationForm,
                      effective_date:e.target.value
                    })
                  }
                />
              </div>
            </div>

            <label>ملاحظات</label>
            <textarea
              value={recommendationForm.notes}
              onChange={(e) =>
                setRecommendationForm({
                  ...recommendationForm,
                  notes:e.target.value
                })
              }
            />

            <button
              className="primary"
              style={{marginTop:12}}
            >
              حساب التوصية
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>مراجعات التعويضات</h2>

          <div className="tableWrap">
            {recommendations.length ? (
              <table>
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>الأداء</th>
                    <th>Compa-Ratio</th>
                    <th>الأساسي الحالي</th>
                    <th>Merit</th>
                    <th>الأساسي المقترح</th>
                    <th>Bonus</th>
                    <th>تكلفة السنة الأولى</th>
                    <th>الموافقة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {recommendations.map(rec => (
                    <tr key={rec.id}>
                      <td>{rec.employee_name}</td>

                      <td>
                        {rec.performance_score}%
                        <br />
                        <span className="muted">
                          {ratings[
                            rec.performance_rating
                          ] || rec.performance_rating}
                        </span>
                      </td>

                      <td>{rec.compa_ratio}%</td>

                      <td>
                        {money(rec.current_basic)} ر.س
                      </td>

                      <td>{rec.merit_pct}%</td>

                      <td>
                        <strong>
                          {money(rec.proposed_basic)} ر.س
                        </strong>
                      </td>

                      <td>
                        {rec.bonus_eligible
                          ? `${money(rec.bonus_amount)} ر.س`
                          : "غير مستحق"}
                      </td>

                      <td>
                        {money(rec.total_year1_cost)} ر.س
                      </td>

                      <td>
                        <span className="badge">
                          {rec.approval_status}
                        </span>
                      </td>

                      <td>
                        {rec.approval_status ===
                          "not_requested" ? (
                          <button
                            onClick={() =>
                              requestApproval(rec.id)
                            }
                          >
                            طلب الاعتماد
                          </button>
                        ) : null}

                        {rec.approval_status ===
                          "pending" ? (
                          <span className="muted">
                            بانتظار مركز الموافقات
                          </span>
                        ) : null}

                        {rec.approval_status ===
                          "approved" &&
                         rec.status !== "applied" ? (
                          <button
                            className="primary"
                            onClick={() =>
                              applyRecommendation(rec.id)
                            }
                          >
                            تطبيق الزيادة
                          </button>
                        ) : null}

                        {rec.status === "applied" ? (
                          <span className="badge">
                            مطبقة
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="muted">
                لا توجد توصيات تعويضات حتى الآن.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
