"use client";

import { useEffect, useMemo, useState } from "react";

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

const ratingLabels = {
  exceptional: "استثنائي",
  exceeds_expectations: "يتجاوز التوقعات",
  meets_expectations: "يحقق التوقعات",
  partially_meets: "يحقق جزئيًا",
  needs_improvement: "يحتاج تحسين",
};

export default function PerformanceWorkspace() {
  const [summary, setSummary] = useState({});
  const [cycles, setCycles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [plans, setPlans] = useState([]);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [cycleForm, setCycleForm] = useState({
    name: "",
    cycle_type: "annual",
    start_date: "",
    end_date: "",
    bell_curve_enabled: false,
    notes: "",
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    position_id: "",
    description: "",
  });

  const [metricForm, setMetricForm] = useState({
    template_id: "",
    name: "",
    description: "",
    weight: "",
    target_value: "",
    unit: "",
    direction: "higher_better",
  });

  const [planForm, setPlanForm] = useState({
    employee_id: "",
    cycle_id: "",
    template_id: "",
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

      const [s,c,t,e,p,plansData] = await Promise.all([
        api("/api/hr/performance/summary"),
        api("/api/hr/performance/cycles"),
        api("/api/hr/performance/templates"),
        api("/api/hr/employees"),
        api("/api/hr/positions"),
        api("/api/hr/performance/plans"),
      ]);

      setSummary(s);
      setCycles(c);
      setTemplates(t);
      setEmployees(e);
      setPositions(p);
      setPlans(plansData);
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
        "/api/hr/performance/cycles",
        {
          method: "POST",
          body: JSON.stringify({
            ...cycleForm,
            notes: cycleForm.notes || null,
          }),
        }
      );

      setCycleForm({
        name: "",
        cycle_type: "annual",
        start_date: "",
        end_date: "",
        bell_curve_enabled: false,
        notes: "",
      });

      setNotice("تم إنشاء دورة الأداء.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTemplate(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/performance/templates",
        {
          method: "POST",
          body: JSON.stringify({
            name: templateForm.name,
            position_id:
              templateForm.position_id || null,
            description:
              templateForm.description || null,
          }),
        }
      );

      setTemplateForm({
        name: "",
        position_id: "",
        description: "",
      });

      setNotice("تم إنشاء قالب KPI.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createMetric(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/performance/metrics",
        {
          method: "POST",
          body: JSON.stringify({
            template_id:
              metricForm.template_id,
            name: metricForm.name,
            description:
              metricForm.description || null,
            weight:
              Number(metricForm.weight),
            target_value:
              metricForm.target_value
                ? Number(metricForm.target_value)
                : null,
            unit:
              metricForm.unit || null,
            direction:
              metricForm.direction,
          }),
        }
      );

      setMetricForm({
        template_id:
          metricForm.template_id,
        name: "",
        description: "",
        weight: "",
        target_value: "",
        unit: "",
        direction: "higher_better",
      });

      setNotice("تم إضافة KPI.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createPlan(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/performance/plans",
        {
          method: "POST",
          body: JSON.stringify(planForm),
        }
      );

      setPlanForm({
        employee_id: "",
        cycle_id: "",
        template_id: "",
      });

      setNotice("تم إنشاء خطة الأداء للموظف.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateResult(
    resultId,
    field,
    value
  ) {
    try {
      await api(
        `/api/hr/performance/results/${resultId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            [field]:
              value === ""
                ? null
                : Number(value),
          }),
        }
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function finalize(planId) {
    try {
      const result = await api(
        `/api/hr/performance/plans/${planId}/finalize`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      setNotice(
        `تم اعتماد نتيجة التقييم: ${result.final_score}%`
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        x => x.id === metricForm.template_id
      ),
    [templates, metricForm.template_id]
  );

  const MetricCard = ({title,value,sub}) => (
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
        h3{margin:0 0 8px}
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
          font-size:28px;
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
          font-size:10px;
          background:${C.soft};
          color:${C.primary}
        }
        .notice,.error{
          padding:12px;
          border-radius:10px;
          margin-bottom:15px
        }
        .notice{
          color:${C.primary};
          background:${C.soft}
        }
        .error{
          color:${C.danger};
          border:1px solid rgba(255,100,100,.25)
        }
        .template{
          padding:14px 0;
          border-bottom:1px solid ${C.border}
        }
        .kpi{
          display:grid;
          grid-template-columns:2fr 1fr 1fr;
          gap:8px;
          padding:7px 0;
          color:${C.muted};
          font-size:12px
        }
        .scoreInput{
          min-width:75px;
          max-width:100px
        }
        @media(max-width:950px){
          main{padding:15px}
          .metrics{grid-template-columns:1fr 1fr}
          .grid2,.grid3{grid-template-columns:1fr}
          .tableWrap{overflow:auto}
          table{min-width:950px}
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
                ENCLAVE AI · PERFORMANCE MANAGEMENT
              </div>

              <h1>إدارة الأداء ومؤشرات KPI</h1>

              <div className="muted">
                Performance Cycles · KPI Templates · Weighted Reviews
              </div>
            </div>
          </div>

          <div>
            <a href="/hr">مساحة HR</a>{" "}
            <a href="/" className="primary">
              HR Agent
            </a>
          </div>
        </header>

        {notice && (
          <div className="notice">{notice}</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        <section className="metrics">
          <MetricCard
            title="دورات الأداء"
            value={summary.cycles || 0}
            sub="Performance Cycles"
          />

          <MetricCard
            title="الدورات النشطة"
            value={summary.active_cycles || 0}
            sub="Active Cycles"
          />

          <MetricCard
            title="قوالب KPI"
            value={summary.active_templates || 0}
            sub="KPI Templates"
          />

          <MetricCard
            title="خطط أداء نشطة"
            value={summary.active_plans || 0}
            sub="Active Plans"
          />

          <MetricCard
            title="تقييمات مكتملة"
            value={summary.completed_reviews || 0}
            sub={
              summary.average_final_score != null
                ? `المتوسط ${summary.average_final_score}%`
                : "Completed Reviews"
            }
          />
        </section>

        <div className="grid2">
          <section className="panel">
            <h2>إنشاء دورة أداء</h2>

            <form onSubmit={createCycle}>
              <div className="grid3">
                <div>
                  <label>اسم الدورة *</label>
                  <input
                    required
                    placeholder="تقييم الأداء 2027"
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
                  <label>نوع الدورة</label>
                  <select
                    value={cycleForm.cycle_type}
                    onChange={(e) =>
                      setCycleForm({
                        ...cycleForm,
                        cycle_type:e.target.value
                      })
                    }
                  >
                    <option value="annual">سنوي</option>
                    <option value="semiannual">
                      نصف سنوي
                    </option>
                    <option value="quarterly">
                      ربع سنوي
                    </option>
                  </select>
                </div>

                <div>
                  <label>Bell Curve</label>
                  <select
                    value={
                      cycleForm.bell_curve_enabled
                        ? "yes"
                        : "no"
                    }
                    onChange={(e) =>
                      setCycleForm({
                        ...cycleForm,
                        bell_curve_enabled:
                          e.target.value === "yes"
                      })
                    }
                  >
                    <option value="no">غير مفعل</option>
                    <option value="yes">مفعل</option>
                  </select>
                </div>

                <div>
                  <label>بداية الدورة *</label>
                  <input
                    required
                    type="date"
                    value={cycleForm.start_date}
                    onChange={(e) =>
                      setCycleForm({
                        ...cycleForm,
                        start_date:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>نهاية الدورة *</label>
                  <input
                    required
                    type="date"
                    value={cycleForm.end_date}
                    onChange={(e) =>
                      setCycleForm({
                        ...cycleForm,
                        end_date:e.target.value
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
            <h2>إنشاء قالب KPI</h2>

            <form onSubmit={createTemplate}>
              <label>اسم القالب *</label>
              <input
                required
                placeholder="KPIs - HR Manager"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    name:e.target.value
                  })
                }
              />

              <label>المنصب</label>
              <select
                value={templateForm.position_id}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    position_id:e.target.value
                  })
                }
              >
                <option value="">
                  قالب عام
                </option>

                {positions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title_ar}
                  </option>
                ))}
              </select>

              <label>الوصف</label>
              <textarea
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    description:e.target.value
                  })
                }
              />

              <button
                className="primary"
                style={{marginTop:12}}
              >
                إنشاء القالب
              </button>
            </form>
          </section>
        </div>

        <section className="panel">
          <h2>إضافة مؤشر KPI</h2>

          <div className="muted">
            يجب أن يصل مجموع أوزان المؤشرات في القالب إلى 100%.
          </div>

          <form onSubmit={createMetric}>
            <div className="grid3">
              <div>
                <label>القالب *</label>
                <select
                  required
                  value={metricForm.template_id}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      template_id:e.target.value
                    })
                  }
                >
                  <option value="">اختر القالب</option>

                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.total_weight}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>اسم المؤشر *</label>
                <input
                  required
                  value={metricForm.name}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      name:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الوزن % *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100"
                  step=".01"
                  value={metricForm.weight}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      weight:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>المستهدف</label>
                <input
                  type="number"
                  step=".01"
                  value={metricForm.target_value}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      target_value:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الوحدة</label>
                <input
                  placeholder="% / SAR / Days..."
                  value={metricForm.unit}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      unit:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>اتجاه القياس</label>
                <select
                  value={metricForm.direction}
                  onChange={(e) =>
                    setMetricForm({
                      ...metricForm,
                      direction:e.target.value
                    })
                  }
                >
                  <option value="higher_better">
                    الأعلى أفضل
                  </option>
                  <option value="lower_better">
                    الأقل أفضل
                  </option>
                  <option value="target">
                    تحقيق المستهدف
                  </option>
                </select>
              </div>
            </div>

            <button
              className="primary"
              style={{marginTop:12}}
            >
              إضافة KPI
            </button>
          </form>

          {selectedTemplate && (
            <div style={{marginTop:18}}>
              <strong>
                الوزن الحالي: {selectedTemplate.total_weight}%
              </strong>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>قوالب KPI</h2>

          {templates.length ? (
            templates.map(template => (
              <div
                className="template"
                key={template.id}
              >
                <h3>{template.name}</h3>

                <div className="muted">
                  {template.position_name || "قالب عام"}
                  {" · "}
                  مجموع الأوزان {template.total_weight}%
                </div>

                {template.metrics.map(metric => (
                  <div
                    className="kpi"
                    key={metric.id}
                  >
                    <div>{metric.name}</div>
                    <div>
                      الوزن {metric.weight}%
                    </div>
                    <div>
                      المستهدف{" "}
                      {metric.target_value ?? "—"}{" "}
                      {metric.unit || ""}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="muted">
              لا توجد قوالب KPI حتى الآن.
            </div>
          )}
        </section>

        <section className="panel">
          <h2>إنشاء خطة أداء لموظف</h2>

          <form onSubmit={createPlan}>
            <div className="grid3">
              <div>
                <label>الموظف *</label>
                <select
                  required
                  value={planForm.employee_id}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      employee_id:e.target.value
                    })
                  }
                >
                  <option value="">اختر الموظف</option>

                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.employee_number} · {e.full_name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>دورة الأداء *</label>
                <select
                  required
                  value={planForm.cycle_id}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
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
                <label>قالب KPI *</label>
                <select
                  required
                  value={planForm.template_id}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      template_id:e.target.value
                    })
                  }
                >
                  <option value="">اختر القالب</option>

                  {templates
                    .filter(t =>
                      Math.abs(t.total_weight - 100) < 0.01
                    )
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <button
              className="primary"
              style={{marginTop:12}}
            >
              إنشاء خطة الأداء
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>تقييمات الأداء</h2>

          {plans.length ? (
            plans.map(plan => (
              <div
                key={plan.id}
                style={{
                  marginTop:18,
                  paddingTop:18,
                  borderTop:`1px solid ${C.border}`
                }}
              >
                <h3>{plan.employee_name}</h3>

                <div className="muted">
                  {plan.employee_number}
                  {" · "}
                  {plan.cycle_name}
                  {" · "}
                  {plan.template_name}
                  {" · "}
                  الحالة {plan.status}
                </div>

                {plan.final_score != null && (
                  <div style={{marginTop:8}}>
                    <span className="badge">
                      {plan.final_score}% ·{" "}
                      {ratingLabels[plan.rating]
                        || plan.rating}
                    </span>
                  </div>
                )}

                <div
                  className="tableWrap"
                  style={{marginTop:12}}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>KPI</th>
                        <th>الوزن</th>
                        <th>المستهدف</th>
                        <th>الفعلي</th>
                        <th>تقييم الموظف</th>
                        <th>تقييم المدير</th>
                        <th>النتيجة النهائية</th>
                      </tr>
                    </thead>

                    <tbody>
                      {plan.metrics.map(metric => (
                        <tr key={metric.result_id}>
                          <td>{metric.name}</td>
                          <td>{metric.weight}%</td>
                          <td>
                            {metric.target_value ?? "—"}{" "}
                            {metric.unit || ""}
                          </td>

                          <td>
                            <input
                              className="scoreInput"
                              type="number"
                              step=".01"
                              defaultValue={
                                metric.actual_value ?? ""
                              }
                              disabled={
                                plan.status === "completed"
                              }
                              onBlur={(e) =>
                                updateResult(
                                  metric.result_id,
                                  "actual_value",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="scoreInput"
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={
                                metric.self_score ?? ""
                              }
                              disabled={
                                plan.status === "completed"
                              }
                              onBlur={(e) =>
                                updateResult(
                                  metric.result_id,
                                  "self_score",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="scoreInput"
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={
                                metric.manager_score ?? ""
                              }
                              disabled={
                                plan.status === "completed"
                              }
                              onBlur={(e) =>
                                updateResult(
                                  metric.result_id,
                                  "manager_score",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="scoreInput"
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={
                                metric.final_score ?? ""
                              }
                              disabled={
                                plan.status === "completed"
                              }
                              onBlur={(e) =>
                                updateResult(
                                  metric.result_id,
                                  "final_score",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {plan.status !== "completed" && (
                  <button
                    className="primary"
                    style={{marginTop:12}}
                    onClick={() => finalize(plan.id)}
                  >
                    اعتماد النتيجة النهائية
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="muted">
              لا توجد خطط أداء حتى الآن.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
