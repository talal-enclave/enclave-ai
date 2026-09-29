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
};

function Box({ title, value, sub }) {
  return (
    <div className="box">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

export default function Recruitment() {
  const [summary, setSummary] = useState({});
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [notice, setNotice] = useState("");

  const [vacancy, setVacancy] = useState({
    position_id: "",
    title_ar: "",
    openings: 1,
    work_location: "Riyadh",
    description: "",
    salary_min: "",
    salary_max: "",
  });

  const [candidate, setCandidate] = useState({
    vacancy_id: "",
    full_name: "",
    email: "",
    mobile: "",
    source: "",
    current_title: "",
    years_experience: "",
  });

  async function api(path, options = {}) {
    const r = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const d = await r.json();

    if (!r.ok) {
      throw new Error(d.detail || "تعذر تنفيذ العملية");
    }

    return d;
  }

  async function load() {
    const [s, v, c, p] = await Promise.all([
      api("/api/hr/recruitment/summary"),
      api("/api/hr/recruitment/vacancies"),
      api("/api/hr/recruitment/candidates"),
      api("/api/hr/positions"),
    ]);

    setSummary(s);
    setVacancies(v);
    setCandidates(c);
    setPositions(p);
  }

  useEffect(() => {
    load();
  }, []);

  async function addVacancy(e) {
    e.preventDefault();

    await api("/api/hr/recruitment/vacancies", {
      method: "POST",
      body: JSON.stringify({
        ...vacancy,
        position_id: vacancy.position_id || null,
        openings: Number(vacancy.openings || 1),
        salary_min: vacancy.salary_min
          ? Number(vacancy.salary_min)
          : null,
        salary_max: vacancy.salary_max
          ? Number(vacancy.salary_max)
          : null,
      }),
    });

    setVacancy({
      position_id: "",
      title_ar: "",
      openings: 1,
      work_location: "Riyadh",
      description: "",
      salary_min: "",
      salary_max: "",
    });

    setNotice("تم إنشاء الشاغر.");
    await load();
  }

  async function addCandidate(e) {
    e.preventDefault();

    await api("/api/hr/recruitment/candidates", {
      method: "POST",
      body: JSON.stringify({
        ...candidate,
        vacancy_id: candidate.vacancy_id || null,
        years_experience: candidate.years_experience
          ? Number(candidate.years_experience)
          : null,
      }),
    });

    setCandidate({
      vacancy_id: "",
      full_name: "",
      email: "",
      mobile: "",
      source: "",
      current_title: "",
      years_experience: "",
    });

    setNotice("تم إضافة المرشح.");
    await load();
  }

  async function stage(id, value) {
    await api(
      `/api/hr/recruitment/candidates/${id}/stage`,
      {
        method: "PATCH",
        body: JSON.stringify({ stage: value }),
      }
    );

    await load();
  }

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
        .wrap{max-width:1500px;margin:auto}
        .head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:18px;
          margin-bottom:25px;
        }
        .brand{display:flex;align-items:center;gap:18px}
        .brand img{width:135px}
        .eyebrow{
          color:${C.primary};
          font-size:11px;
          letter-spacing:1.3px
        }
        h1{margin:4px 0;font-size:28px}
        .muted{color:${C.muted};font-size:12px}
        a,.btn{
          display:inline-block;
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
          border-color:${C.primary};
          color:${C.primary};
          background:${C.soft}
        }
        .metrics{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:13px;
          margin-bottom:20px;
        }
        .box{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:16px;
          padding:20px;
        }
        .box span,.box small{
          display:block;
          color:${C.muted};
          font-size:11px;
        }
        .box strong{
          display:block;
          font-size:28px;
          margin:10px 0;
        }
        .grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
        }
        .panel{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:18px;
          padding:22px;
          margin-bottom:18px;
        }
        .panel h2{margin-top:0}
        .fields{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }
        label{
          display:block;
          color:${C.muted};
          font-size:11px;
          margin-bottom:6px;
        }
        input,select,textarea{
          width:100%;
          padding:11px;
          background:${C.bg};
          color:${C.text};
          border:1px solid ${C.border};
          border-radius:9px;
        }
        textarea{min-height:95px}
        .submit{margin-top:14px}
        table{
          width:100%;
          border-collapse:collapse;
        }
        th,td{
          padding:12px 8px;
          border-bottom:1px solid ${C.border};
          text-align:right;
          font-size:12px;
        }
        th{color:${C.muted}}
        .badge{
          background:${C.soft};
          color:${C.primary};
          padding:4px 9px;
          border-radius:999px;
          font-size:10px;
        }
        .notice{
          color:${C.primary};
          background:${C.soft};
          border:1px solid rgba(24,213,183,.35);
          padding:11px;
          border-radius:10px;
          margin-bottom:15px;
        }
        @media(max-width:900px){
          .metrics{grid-template-columns:1fr 1fr}
          .grid,.fields{grid-template-columns:1fr}
          main{padding:15px}
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
              <div className="eyebrow">
                ENCLAVE AI · TALENT ACQUISITION
              </div>
              <h1>التوظيف والاستقطاب</h1>
              <div className="muted">
                Recruitment Pipeline & Candidate Intelligence
              </div>
            </div>
          </div>

          <div>
            <a href="/hr">مساحة HR</a>{" "}
            <a
              href="/hr/recruitment/intelligence"
              className="primary"
            >
              ذكاء التوظيف
            </a>{" "}
            <a href="/" className="primary">
              HR Agent
            </a>
          </div>
        </header>

        {notice && (
          <div className="notice">{notice}</div>
        )}

        <section className="metrics">
          <Box
            title="الشواغر المفتوحة"
            value={summary.open_vacancies || 0}
            sub="Open Vacancies"
          />
          <Box
            title="إجمالي المرشحين"
            value={summary.total_candidates || 0}
            sub="Candidates"
          />
          <Box
            title="مرحلة المقابلة"
            value={summary.interview_stage || 0}
            sub="Interview"
          />
          <Box
            title="مرحلة العرض"
            value={summary.offer_stage || 0}
            sub="Offer"
          />
          <Box
            title="تم التعيين"
            value={summary.hired || 0}
            sub="Hired"
          />
        </section>

        <div className="grid">
          <section className="panel">
            <h2>إنشاء شاغر</h2>
            <div className="muted">
              Position Requisition
            </div>

            <form onSubmit={addVacancy}>
              <div className="fields">
                <div>
                  <label>المسمى الوظيفي *</label>
                  <input
                    required
                    value={vacancy.title_ar}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        title_ar:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>المنصب المعتمد</label>
                  <select
                    value={vacancy.position_id}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        position_id:e.target.value
                      })
                    }
                  >
                    <option value="">بدون ربط</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>عدد الشواغر</label>
                  <input
                    type="number"
                    min="1"
                    value={vacancy.openings}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        openings:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>موقع العمل</label>
                  <input
                    value={vacancy.work_location}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        work_location:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>الحد الأدنى للراتب</label>
                  <input
                    type="number"
                    value={vacancy.salary_min}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        salary_min:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>الحد الأعلى للراتب</label>
                  <input
                    type="number"
                    value={vacancy.salary_max}
                    onChange={(e) =>
                      setVacancy({
                        ...vacancy,
                        salary_max:e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div style={{marginTop:12}}>
                <label>وصف مختصر</label>
                <textarea
                  value={vacancy.description}
                  onChange={(e) =>
                    setVacancy({
                      ...vacancy,
                      description:e.target.value
                    })
                  }
                />
              </div>

              <button className="btn primary submit">
                إنشاء الشاغر
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>إضافة مرشح</h2>
            <div className="muted">
              Candidate Pipeline
            </div>

            <form onSubmit={addCandidate}>
              <div className="fields">
                <div>
                  <label>الاسم *</label>
                  <input
                    required
                    value={candidate.full_name}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        full_name:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>الشاغر</label>
                  <select
                    value={candidate.vacancy_id}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        vacancy_id:e.target.value
                      })
                    }
                  >
                    <option value="">بدون تحديد</option>
                    {vacancies
                      .filter(v => v.status === "open")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title_ar}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label>البريد</label>
                  <input
                    type="email"
                    value={candidate.email}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        email:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>الجوال</label>
                  <input
                    value={candidate.mobile}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        mobile:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>المسمى الحالي</label>
                  <input
                    value={candidate.current_title}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        current_title:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>سنوات الخبرة</label>
                  <input
                    type="number"
                    step=".5"
                    value={candidate.years_experience}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        years_experience:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>المصدر</label>
                  <input
                    placeholder="LinkedIn / Referral..."
                    value={candidate.source}
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        source:e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <button className="btn primary submit">
                إضافة المرشح
              </button>
            </form>
          </section>
        </div>

        <section className="panel">
          <h2>الشواغر</h2>

          {vacancies.length ? (
            <table>
              <thead>
                <tr>
                  <th>الشاغر</th>
                  <th>العدد</th>
                  <th>الموقع</th>
                  <th>النطاق</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {vacancies.map((v) => (
                  <tr key={v.id}>
                    <td>{v.title_ar}</td>
                    <td>{v.openings}</td>
                    <td>{v.work_location || "—"}</td>
                    <td>
                      {v.salary_min || v.salary_max
                        ? `${v.salary_min || "—"} - ${v.salary_max || "—"}`
                        : "—"}
                    </td>
                    <td>
                      <span className="badge">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="muted">
              لا توجد شواغر حتى الآن.
            </div>
          )}
        </section>

        <section className="panel">
          <h2>مسار المرشحين</h2>

          {candidates.length ? (
            <table>
              <thead>
                <tr>
                  <th>المرشح</th>
                  <th>المسمى الحالي</th>
                  <th>الخبرة</th>
                  <th>Fit Score</th>
                  <th>المرحلة</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td>{c.current_title || "—"}</td>
                    <td>
                      {c.years_experience ?? "—"}
                    </td>
                    <td>
                      {c.fit_score ?? "لم يُقيّم"}
                    </td>
                    <td>
                      <select
                        value={c.stage}
                        onChange={(e) =>
                          stage(c.id, e.target.value)
                        }
                      >
                        <option value="applied">
                          متقدم
                        </option>
                        <option value="screening">
                          فرز
                        </option>
                        <option value="interview">
                          مقابلة
                        </option>
                        <option value="offer">
                          عرض
                        </option>
                        <option value="hired">
                          تعيين
                        </option>
                        <option value="rejected">
                          مستبعد
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="muted">
              لا يوجد مرشحون حتى الآن.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
