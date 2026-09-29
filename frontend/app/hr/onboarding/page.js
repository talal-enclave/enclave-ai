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

const statusLabels = {
  pending: "معلقة",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  skipped: "متجاوزة",
};

const categoryLabels = {
  documents: "المستندات",
  government: "الخدمات الحكومية",
  benefits: "المزايا",
  payroll: "الرواتب",
  it: "تقنية المعلومات",
  security: "الأمن السيبراني",
  orientation: "التعريف",
  performance: "الأداء",
  follow_up: "المتابعة",
  probation: "فترة التجربة",
};

function Metric({ title, value, sub }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

export default function OnboardingWorkspace() {
  const [summary, setSummary] = useState({});
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
      setLoading(true);
      setError("");

      const [s, p, e] = await Promise.all([
        api("/api/hr/onboarding/summary"),
        api("/api/hr/onboarding/plans"),
        api("/api/hr/employees"),
      ]);

      setSummary(s);
      setPlans(p);
      setEmployees(e);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function ensurePlan() {
    if (!employeeId) return;

    try {
      await api(
        `/api/hr/onboarding/employees/${employeeId}/ensure`,
        { method: "POST" }
      );

      setNotice("تم إنشاء/التحقق من خطة التهيئة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateItem(id, status) {
    try {
      await api(
        `/api/hr/onboarding/items/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const employeeIdsWithPlan = useMemo(
    () => new Set(plans.map(p => p.employee_id)),
    [plans]
  );

  const availableEmployees = employees.filter(
    e => !employeeIdsWithPlan.has(e.id)
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
          padding:28px;
        }
        .wrap{max-width:1550px;margin:auto}
        .head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:18px;
          flex-wrap:wrap;
          margin-bottom:24px;
        }
        .brand{
          display:flex;
          align-items:center;
          gap:18px;
        }
        .brand img{width:135px}
        .eye{
          color:${C.primary};
          font-size:11px;
          letter-spacing:1.3px;
        }
        h1{margin:5px 0;font-size:28px}
        h2{margin-top:0}
        .muted{
          color:${C.muted};
          font-size:12px;
          line-height:1.8;
        }
        a,button{
          padding:10px 15px;
          border-radius:10px;
          border:1px solid ${C.border};
          background:${C.panel};
          color:${C.text};
          text-decoration:none;
          cursor:pointer;
          font-weight:700;
        }
        .primary{
          color:${C.primary};
          border-color:${C.primary};
          background:${C.soft};
        }
        .metrics{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:13px;
          margin-bottom:20px;
        }
        .metric{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:16px;
          padding:20px;
        }
        .metric span,.metric small{
          display:block;
          color:${C.muted};
          font-size:11px;
        }
        .metric strong{
          display:block;
          margin:10px 0;
          font-size:28px;
        }
        .panel{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:18px;
          padding:22px;
          margin-bottom:18px;
        }
        .create{
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
        }
        select{
          min-width:280px;
          padding:11px;
          background:${C.bg};
          color:${C.text};
          border:1px solid ${C.border};
          border-radius:9px;
        }
        .planHead{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:15px;
          flex-wrap:wrap;
          margin-bottom:15px;
        }
        .progress{
          width:250px;
          max-width:100%;
          height:9px;
          border-radius:999px;
          background:${C.bg};
          overflow:hidden;
          margin-top:8px;
        }
        .progress > div{
          height:100%;
          background:${C.primary};
        }
        table{
          width:100%;
          border-collapse:collapse;
        }
        th,td{
          text-align:right;
          padding:12px 8px;
          border-bottom:1px solid ${C.border};
          font-size:12px;
        }
        th{color:${C.muted}}
        .badge{
          display:inline-block;
          padding:4px 9px;
          border-radius:999px;
          font-size:10px;
          background:${C.soft};
          color:${C.primary};
        }
        .overdue{
          color:${C.danger};
          font-weight:700;
        }
        .actions{
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        }
        .actions button{
          padding:6px 9px;
          font-size:10px;
        }
        .notice,.error{
          padding:12px;
          margin-bottom:15px;
          border-radius:10px;
        }
        .notice{
          color:${C.primary};
          background:${C.soft};
        }
        .error{
          color:${C.danger};
          border:1px solid rgba(255,100,100,.25);
        }
        @media(max-width:950px){
          main{padding:15px}
          .metrics{grid-template-columns:1fr 1fr}
          table{min-width:850px}
          .tableWrap{overflow-x:auto}
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
                ENCLAVE AI · EMPLOYEE ONBOARDING
              </div>

              <h1>تهيئة الموظفين الجدد</h1>

              <div className="muted">
                Onboarding · Compliance · Access · Orientation · Follow-up
              </div>
            </div>
          </div>

          <div>
            <a href="/hr">مساحة HR</a>{" "}
            <a className="primary" href="/">
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
          <Metric
            title="خطط التهيئة النشطة"
            value={summary.active_plans || 0}
            sub="Active Onboarding"
          />

          <Metric
            title="المهام المعلقة"
            value={summary.pending_items || 0}
            sub="Pending"
          />

          <Metric
            title="قيد التنفيذ"
            value={summary.in_progress_items || 0}
            sub="In Progress"
          />

          <Metric
            title="المكتملة"
            value={summary.completed_items || 0}
            sub="Completed"
          />

          <Metric
            title="المتأخرة"
            value={summary.overdue_items || 0}
            sub="Overdue"
          />
        </section>

        <section className="panel">
          <h2>إنشاء خطة تهيئة</h2>

          <div className="muted">
            يتم إنشاؤها تلقائيًا عند التعيين. يمكن استخدامها
            هنا للموظفين الموجودين مسبقًا.
          </div>

          <div className="create" style={{marginTop:15}}>
            <select
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
            >
              <option value="">
                اختر الموظف
              </option>

              {availableEmployees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.employee_number} · {e.full_name_ar}
                </option>
              ))}
            </select>

            <button
              className="primary"
              disabled={!employeeId}
              onClick={ensurePlan}
            >
              إنشاء Checklist
            </button>
          </div>
        </section>

        {loading ? (
          <section className="panel">
            جاري تحميل خطط التهيئة...
          </section>
        ) : plans.length ? (
          plans.map(plan => (
            <section className="panel" key={plan.id}>
              <div className="planHead">
                <div>
                  <h2 style={{marginBottom:5}}>
                    {plan.employee_name}
                  </h2>

                  <div className="muted">
                    {plan.employee_number}
                    {" · "}
                    التقدم {plan.progress}%
                    {" · "}
                    الحالة {plan.status}
                  </div>

                  <div className="progress">
                    <div
                      style={{
                        width: `${plan.progress}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  {plan.overdue_items > 0 && (
                    <span className="overdue">
                      {plan.overdue_items} مهمة متأخرة
                    </span>
                  )}
                </div>
              </div>

              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>الفئة</th>
                      <th>المهمة</th>
                      <th>المسؤول</th>
                      <th>الاستحقاق</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {plan.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          {categoryLabels[item.category]
                            || item.category}
                        </td>

                        <td>
                          {item.title}
                          {item.overdue && (
                            <div className="overdue">
                              متأخرة
                            </div>
                          )}
                        </td>

                        <td>{item.owner || "—"}</td>

                        <td>{item.due_date || "—"}</td>

                        <td>
                          <span className="badge">
                            {statusLabels[item.status]
                              || item.status}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            {item.status === "pending" && (
                              <button
                                onClick={() =>
                                  updateItem(
                                    item.id,
                                    "in_progress"
                                  )
                                }
                              >
                                بدء
                              </button>
                            )}

                            {item.status !== "completed" && (
                              <button
                                className="primary"
                                onClick={() =>
                                  updateItem(
                                    item.id,
                                    "completed"
                                  )
                                }
                              >
                                إكمال
                              </button>
                            )}

                            {item.status !== "completed" &&
                             item.status !== "skipped" && (
                              <button
                                onClick={() =>
                                  updateItem(
                                    item.id,
                                    "skipped"
                                  )
                                }
                              >
                                تجاوز
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        ) : (
          <section className="panel">
            <div className="muted">
              لا توجد خطط تهيئة حتى الآن. أول موظف يتم تعيينه
              من مسار التوظيف سيحصل على Checklist تلقائيًا.
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
