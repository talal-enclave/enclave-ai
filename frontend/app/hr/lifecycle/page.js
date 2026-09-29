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

const changeLabels = {
  promotion: "ترقية",
  transfer: "نقل",
  salary_change: "تعديل راتب",
  status_change: "تغيير الحالة الوظيفية",
  termination: "إنهاء خدمة",
};

export default function EmployeeLifecycle() {
  const [summary, setSummary] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [changes, setChanges] = useState([]);
  const [probation, setProbation] = useState([]);
  const [offboarding, setOffboarding] = useState([]);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [changeForm, setChangeForm] = useState({
    employee_id: "",
    change_type: "promotion",
    effective_date: "",
    new_department_id: "",
    new_position_id: "",
    new_basic_salary: "",
    new_employment_status: "",
    notes: "",
  });

  const [probationForm, setProbationForm] = useState({
    employee_id: "",
    review_date: "",
    reviewer: "",
    performance_score: "",
    outcome: "review",
    comments: "",
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

      const [s,e,d,p,c,r,o] = await Promise.all([
        api("/api/hr/lifecycle/summary"),
        api("/api/hr/employees"),
        api("/api/hr/departments"),
        api("/api/hr/positions"),
        api("/api/hr/lifecycle/changes"),
        api("/api/hr/lifecycle/probation-reviews"),
        api("/api/hr/lifecycle/offboarding"),
      ]);

      setSummary(s);
      setEmployees(e);
      setDepartments(d);
      setPositions(p);
      setChanges(c);
      setProbation(r);
      setOffboarding(o);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createChange(e) {
    e.preventDefault();

    try {
      await api("/api/hr/lifecycle/changes", {
        method: "POST",
        body: JSON.stringify({
          employee_id: changeForm.employee_id,
          change_type: changeForm.change_type,
          effective_date: changeForm.effective_date,
          new_department_id:
            changeForm.new_department_id || null,
          new_position_id:
            changeForm.new_position_id || null,
          new_basic_salary:
            changeForm.new_basic_salary
              ? Number(changeForm.new_basic_salary)
              : null,
          new_employment_status:
            changeForm.new_employment_status || null,
          notes: changeForm.notes || null,
        }),
      });

      setNotice(
        "تم إنشاء طلب التغيير وإرساله إلى مركز الموافقات. لم يُطبق التغيير بعد."
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyChange(id) {
    try {
      await api(
        `/api/hr/lifecycle/changes/${id}/apply`,
        { method: "POST" }
      );

      setNotice("تم تطبيق التغيير المعتمد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createProbation(e) {
    e.preventDefault();

    try {
      await api(
        "/api/hr/lifecycle/probation-reviews",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id: probationForm.employee_id,
            review_date: probationForm.review_date,
            reviewer:
              probationForm.reviewer || null,
            performance_score:
              probationForm.performance_score
                ? Number(
                    probationForm.performance_score
                  )
                : null,
            outcome: probationForm.outcome,
            comments:
              probationForm.comments || null,
          }),
        }
      );

      setNotice("تم تسجيل مراجعة فترة التجربة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOffboarding(id, status) {
    try {
      await api(
        `/api/hr/lifecycle/offboarding/items/${id}`,
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
        .grid{
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
        textarea{min-height:90px}
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
        .danger{color:${C.danger}}
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
        .actions{
          display:flex;
          gap:6px;
          flex-wrap:wrap
        }
        @media(max-width:950px){
          main{padding:15px}
          .metrics{grid-template-columns:1fr 1fr}
          .grid{grid-template-columns:1fr}
          .tableWrap{overflow:auto}
          table{min-width:850px}
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
                ENCLAVE AI · EMPLOYEE LIFECYCLE
              </div>

              <h1>دورة حياة الموظف</h1>

              <div className="muted">
                Probation · Promotion · Transfer · Compensation · Termination
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

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error">{error}</div>}

        <section className="metrics">
          <Metric
            title="فترة التجربة خلال 30 يوم"
            value={summary.probation_due_30_days || 0}
            sub="Probation Due"
          />
          <Metric
            title="تغييرات بانتظار الاعتماد"
            value={summary.pending_changes || 0}
            sub="Pending Changes"
          />
          <Metric
            title="تغييرات مطبقة"
            value={summary.applied_changes || 0}
            sub="Applied"
          />
          <Metric
            title="خطط إنهاء خدمة نشطة"
            value={summary.active_offboarding || 0}
            sub="Active Offboarding"
          />
          <Metric
            title="مهام إنهاء متأخرة"
            value={summary.overdue_offboarding_items || 0}
            sub="Overdue"
          />
        </section>

        <section className="panel">
          <h2>طلب تغيير وظيفي</h2>

          <div className="muted">
            جميع التغييرات هنا تحتاج اعتمادًا قبل تطبيقها.
          </div>

          <form onSubmit={createChange}>
            <div className="grid">
              <div>
                <label>الموظف *</label>
                <select
                  required
                  value={changeForm.employee_id}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
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
                <label>نوع التغيير *</label>
                <select
                  value={changeForm.change_type}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      change_type:e.target.value
                    })
                  }
                >
                  <option value="promotion">ترقية</option>
                  <option value="transfer">نقل</option>
                  <option value="salary_change">تعديل راتب</option>
                  <option value="status_change">تغيير الحالة</option>
                  <option value="termination">إنهاء خدمة</option>
                </select>
              </div>

              <div>
                <label>تاريخ السريان *</label>
                <input
                  required
                  type="date"
                  value={changeForm.effective_date}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      effective_date:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الإدارة الجديدة</label>
                <select
                  value={changeForm.new_department_id}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      new_department_id:e.target.value
                    })
                  }
                >
                  <option value="">بدون تغيير</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>المنصب الجديد</label>
                <select
                  value={changeForm.new_position_id}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      new_position_id:e.target.value
                    })
                  }
                >
                  <option value="">بدون تغيير</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>الراتب الأساسي الجديد</label>
                <input
                  type="number"
                  value={changeForm.new_basic_salary}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      new_basic_salary:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الحالة الوظيفية الجديدة</label>
                <select
                  value={changeForm.new_employment_status}
                  onChange={(e) =>
                    setChangeForm({
                      ...changeForm,
                      new_employment_status:e.target.value
                    })
                  }
                >
                  <option value="">بدون تغيير</option>
                  <option value="active">نشط</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="suspended">موقوف</option>
                </select>
              </div>
            </div>

            <label>ملاحظات</label>
            <textarea
              value={changeForm.notes}
              onChange={(e) =>
                setChangeForm({
                  ...changeForm,
                  notes:e.target.value
                })
              }
            />

            <button
              className="primary"
              style={{marginTop:12}}
            >
              إرسال للاعتماد
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>طلبات التغيير</h2>

          <div className="tableWrap">
            {changes.length ? (
              <table>
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>التغيير</th>
                    <th>السريان</th>
                    <th>الموافقة</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {changes.map(c => (
                    <tr key={c.id}>
                      <td>{c.employee_name}</td>
                      <td>
                        {changeLabels[c.change_type]
                          || c.change_type}
                      </td>
                      <td>{c.effective_date}</td>
                      <td>
                        <span className="badge">
                          {c.approval_status}
                        </span>
                      </td>
                      <td>{c.status}</td>
                      <td>
                        {c.approval_status === "approved" &&
                         c.status !== "applied" ? (
                          <button
                            className="primary"
                            onClick={() =>
                              applyChange(c.id)
                            }
                          >
                            تطبيق القرار
                          </button>
                        ) : c.approval_status === "pending" ? (
                          <span className="muted">
                            بانتظار مركز الموافقات
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="muted">
                لا توجد طلبات تغيير حتى الآن.
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>مراجعة فترة التجربة</h2>

          <form onSubmit={createProbation}>
            <div className="grid">
              <div>
                <label>الموظف *</label>
                <select
                  required
                  value={probationForm.employee_id}
                  onChange={(e) =>
                    setProbationForm({
                      ...probationForm,
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
                <label>تاريخ المراجعة *</label>
                <input
                  required
                  type="date"
                  value={probationForm.review_date}
                  onChange={(e) =>
                    setProbationForm({
                      ...probationForm,
                      review_date:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>المراجع</label>
                <input
                  value={probationForm.reviewer}
                  onChange={(e) =>
                    setProbationForm({
                      ...probationForm,
                      reviewer:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>التقييم من 100</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={probationForm.performance_score}
                  onChange={(e) =>
                    setProbationForm({
                      ...probationForm,
                      performance_score:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>نتيجة المراجعة</label>
                <select
                  value={probationForm.outcome}
                  onChange={(e) =>
                    setProbationForm({
                      ...probationForm,
                      outcome:e.target.value
                    })
                  }
                >
                  <option value="review">مراجعة</option>
                  <option value="pass">اجتاز</option>
                  <option value="extend">تمديد للمراجعة</option>
                  <option value="concern">تحتاج متابعة</option>
                </select>
              </div>
            </div>

            <label>الملاحظات</label>
            <textarea
              value={probationForm.comments}
              onChange={(e) =>
                setProbationForm({
                  ...probationForm,
                  comments:e.target.value
                })
              }
            />

            <button
              className="primary"
              style={{marginTop:12}}
            >
              حفظ مراجعة التجربة
            </button>
          </form>

          {probation.length > 0 && (
            <div className="tableWrap" style={{marginTop:20}}>
              <table>
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>التاريخ</th>
                    <th>التقييم</th>
                    <th>النتيجة</th>
                    <th>المراجع</th>
                  </tr>
                </thead>
                <tbody>
                  {probation.map(r => (
                    <tr key={r.id}>
                      <td>{r.employee_name}</td>
                      <td>{r.review_date}</td>
                      <td>{r.performance_score ?? "—"}</td>
                      <td>{r.outcome}</td>
                      <td>{r.reviewer || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>إنهاء الخدمة وOffboarding</h2>

          {offboarding.length ? (
            offboarding.map(plan => (
              <div
                key={plan.id}
                style={{
                  marginTop:16,
                  paddingTop:16,
                  borderTop:`1px solid ${C.border}`
                }}
              >
                <h3>{plan.employee_name}</h3>

                <div className="muted">
                  {plan.employee_number}
                  {" · "}
                  آخر يوم {plan.termination_date}
                  {" · "}
                  التقدم {plan.progress}%
                </div>

                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
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
                            {item.title}
                            {item.overdue && (
                              <div className="danger">
                                متأخرة
                              </div>
                            )}
                          </td>
                          <td>{item.owner || "—"}</td>
                          <td>{item.due_date || "—"}</td>
                          <td>
                            <span className="badge">
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="actions">
                              {item.status === "pending" && (
                                <button
                                  onClick={() =>
                                    updateOffboarding(
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
                                    updateOffboarding(
                                      item.id,
                                      "completed"
                                    )
                                  }
                                >
                                  إكمال
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="muted">
              لا توجد حالات إنهاء خدمة حاليًا.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
