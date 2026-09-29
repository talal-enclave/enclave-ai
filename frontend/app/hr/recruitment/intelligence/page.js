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
  danger: "#ff9a9a",
};

export default function RecruitmentIntelligence() {
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [cvAttachments, setCvAttachments] =
    useState([]);

  const [vacancyId, setVacancyId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [cvFile, setCvFile] = useState(null);

  const [jd, setJd] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [interviewResult, setInterviewResult] =
    useState(null);

  const [interviewer, setInterviewer] = useState("");
  const [interviewNotes, setInterviewNotes] =
    useState("");

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function jsonApi(path, options = {}) {
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
      throw new Error(
        d.detail || "تعذر تنفيذ العملية"
      );
    }

    return d;
  }

  async function load() {
    const [v, c, attachments] =
      await Promise.all([
        jsonApi(
          "/api/hr/recruitment/vacancies"
        ),
        jsonApi(
          "/api/hr/recruitment/candidates"
        ),
        jsonApi(
          "/api/hr/attachments?module=recruitment&entity_type=candidate&document_type=cv&status=active"
        ),
      ]);

    setVacancies(v);
    setCandidates(c);

    setCvAttachments(
      Array.isArray(attachments)
        ? attachments
        : []
    );

    await loadRanking(vacancyId);
  }

  async function loadRanking(id = "") {
    const path = id
      ? `/api/hr/recruitment/ranking?vacancy_id=${id}`
      : "/api/hr/recruitment/ranking";

    const r = await jsonApi(path);
    setRanking(r);
  }

  useEffect(() => {
    load();
  }, []);

  async function generateJD() {
    if (!vacancyId) return;

    try {
      setBusy("jd");
      setError("");

      const r = await jsonApi(
        `/api/hr/recruitment/vacancies/${vacancyId}/generate-jd`,
        { method: "POST" }
      );

      setJd(r.jd);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function analyzeCV() {
    if (!candidateId || !cvFile) return;

    try {
      setBusy("cv");
      setError("");

      const form = new FormData();
      form.append("candidate_id", candidateId);
      form.append("file", cvFile);

      const response = await fetch(
        "/api/hr/recruitment/cv/analyze",
        {
          method: "POST",
          body: form,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "تعذر تحليل السيرة الذاتية"
        );
      }

      setCvResult(data);
      setCvFile(null);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  function candidateCVFiles() {
    return cvAttachments.filter(
      (item) =>
        String(item.entity_id) ===
        String(candidateId)
    );
  }

  async function archiveCandidateCV(
    item
  ) {
    const reason =
      window.prompt(
        "سبب أرشفة السيرة الذاتية:",
        "Replaced / no longer current"
      );

    if (!reason) return;

    try {
      setBusy("cv-archive");
      setError("");

      await jsonApi(
        `/api/hr/attachments/${item.id}/archive`,
        {
          method: "PUT",
          body: JSON.stringify({
            archived_by: "HR",
            reason: reason.trim(),
          }),
        }
      );

      await load();

    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function evaluateInterview() {
    if (!candidateId || !interviewNotes.trim()) {
      return;
    }

    try {
      setBusy("interview");
      setError("");

      const r = await jsonApi(
        "/api/hr/recruitment/interviews/ai-evaluate",
        {
          method: "POST",
          body: JSON.stringify({
            candidate_id: candidateId,
            interview_type: "hr",
            interviewer:
              interviewer || null,
            notes: interviewNotes,
          }),
        }
      );

      setInterviewResult(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
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
          padding:28px
        }
        .wrap{max-width:1500px;margin:auto}
        .head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:20px;
          flex-wrap:wrap;
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
          border:1px solid ${C.border};
          background:${C.panel};
          color:${C.text};
          padding:10px 15px;
          border-radius:10px;
          text-decoration:none;
          cursor:pointer;
          font-weight:700
        }
        .primary{
          color:${C.primary};
          border-color:${C.primary};
          background:${C.soft}
        }
        .grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-bottom:18px
        }
        .panel{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:18px;
          padding:22px;
          margin-bottom:18px
        }
        label{
          display:block;
          color:${C.muted};
          font-size:11px;
          margin:12px 0 6px
        }
        select,input,textarea{
          width:100%;
          background:${C.bg};
          color:${C.text};
          border:1px solid ${C.border};
          border-radius:9px;
          padding:11px
        }
        textarea{min-height:170px}
        .action{margin-top:14px}
        .score{
          font-size:42px;
          font-weight:900;
          color:${C.primary}
        }
        .result{
          margin-top:18px;
          padding:16px;
          background:${C.bg};
          border-radius:12px;
          border:1px solid ${C.border}
        }
        ul{line-height:1.9}
        table{
          width:100%;
          border-collapse:collapse
        }
        th,td{
          text-align:right;
          padding:12px 8px;
          border-bottom:1px solid ${C.border};
          font-size:12px
        }
        th{color:${C.muted}}
        .rank{
          color:${C.beige};
          font-weight:800
        }
        .error{
          color:${C.danger};
          background:rgba(255,100,100,.08);
          border:1px solid rgba(255,100,100,.2);
          padding:12px;
          border-radius:10px;
          margin-bottom:16px
        }
        .notice{
          padding:12px 15px;
          border:1px solid rgba(217,201,170,.2);
          color:${C.beige};
          border-radius:10px;
          margin-bottom:18px;
          font-size:12px;
          line-height:1.8
        }
        @media(max-width:900px){
          .grid{grid-template-columns:1fr}
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
              <div className="eye">
                ENCLAVE AI · RECRUITMENT INTELLIGENCE
              </div>
              <h1>ذكاء التوظيف</h1>
              <div className="muted">
                JD · CV Analysis · Fit Score · Ranking · Interview Intelligence
              </div>
            </div>
          </div>

          <div>
            <a href="/hr/recruitment">
              التوظيف والاستقطاب
            </a>{" "}
            <a className="primary" href="/">
              HR Agent
            </a>
          </div>
        </header>

        <div className="notice">
          جميع درجات الملاءمة والترتيب استشارية لمساعدة فريق
          الموارد البشرية فقط، ولا تمثل قرار تعيين أو استبعاد.
          لا تستخدم السمات الحساسة أو المحمية في التقييم.
        </div>

        {error && (
          <div className="error">{error}</div>
        )}

        <div className="grid">
          <section className="panel">
            <h2>JD Generator</h2>
            <div className="muted">
              توليد وصف وظيفي ومعايير فرز مهنية للشاغر.
            </div>

            <label>الشاغر</label>
            <select
              value={vacancyId}
              onChange={async (e) => {
                const id = e.target.value;
                setVacancyId(id);
                setJd(null);
                await loadRanking(id);
              }}
            >
              <option value="">اختر الشاغر</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title_ar}
                </option>
              ))}
            </select>

            <button
              className="primary action"
              disabled={!vacancyId || busy === "jd"}
              onClick={generateJD}
            >
              {busy === "jd"
                ? "جاري توليد الوصف..."
                : "توليد JD"}
            </button>

            {jd && (
              <div className="result">
                <h3>{jd.title_ar}</h3>
                <p className="muted">
                  {jd.summary_ar}
                </p>

                <strong>المسؤوليات</strong>
                <ul>
                  {(jd.responsibilities_ar || []).map(
                    (x, i) => <li key={i}>{x}</li>
                  )}
                </ul>

                <strong>المتطلبات</strong>
                <ul>
                  {(jd.requirements_ar || []).map(
                    (x, i) => <li key={i}>{x}</li>
                  )}
                </ul>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>CV Analysis</h2>
            <div className="muted">
              PDF / DOCX / TXT — حتى 10MB.
              يتم حفظ ملف السيرة الأصلي تلقائيًا في
              Restricted Private HR Storage بعد نجاح التحليل.
            </div>

            <label>المرشح</label>
            <select
              value={candidateId}
              onChange={(e) => {
                setCandidateId(e.target.value);
                setCvResult(null);
                setInterviewResult(null);
              }}
            >
              <option value="">اختر المرشح</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>

            <label>السيرة الذاتية</label>
            <input
              key={
                cvFile
                  ? cvFile.name
                  : "empty-cv-file"
              }
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) =>
                setCvFile(
                  e.target.files?.[0] || null
                )
              }
            />

            <button
              className="primary action"
              disabled={
                !candidateId ||
                !cvFile ||
                busy === "cv"
              }
              onClick={analyzeCV}
            >
              {busy === "cv"
                ? "جاري تحليل السيرة..."
                : "تحليل CV"}
            </button>

            {candidateId &&
            candidateCVFiles().length > 0 && (
              <div
                className="result"
                style={{
                  marginTop: 12,
                }}
              >
                <strong>
                  السيرة الذاتية المحفوظة
                </strong>

                {candidateCVFiles().map(
                  (item) => (
                    <div
                      key={item.id}
                      style={{
                        marginTop: 8,
                        padding: 9,
                        border:
                          "1px solid rgba(255,255,255,.09)",
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        📎{" "}
                        {
                          item.original_file_name
                        }
                      </div>

                      <div
                        className="muted"
                        style={{
                          marginTop: 4,
                        }}
                      >
                        {(
                          Number(
                            item.file_size_bytes ||
                              0
                          ) /
                          1024
                        ).toFixed(1)}{" "}
                        KB
                        {" • "}
                        {
                          item.confidentiality_level
                        }
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          marginTop: 7,
                        }}
                      >
                        <a
                          href={
                            item.download_url
                          }
                          style={{
                            color:
                              C.primary,
                          }}
                        >
                          Download
                        </a>

                        <button
                          disabled={
                            busy ===
                            "cv-archive"
                          }
                          onClick={() =>
                            archiveCandidateCV(
                              item
                            )
                          }
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {cvResult && (
              <div className="result">
                <div className="muted">
                  Fit Score
                </div>
                <div className="score">
                  {cvResult.fit_score}%
                </div>

                <p>
                  {cvResult.analysis?.summary_ar}
                </p>

                <strong>نقاط القوة</strong>
                <ul>
                  {(
                    cvResult.analysis?.strengths_ar ||
                    []
                  ).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>

                <strong>الفجوات</strong>
                <ul>
                  {(
                    cvResult.analysis?.gaps_ar ||
                    []
                  ).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <section className="panel">
          <h2>Candidate Ranking</h2>
          <div className="muted">
            ترتيب مساعد حسب التطابق المهني مع الشاغر المحدد.
          </div>

          {ranking.length ? (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>المرشح</th>
                  <th>المسمى الحالي</th>
                  <th>الخبرة</th>
                  <th>Fit Score</th>
                  <th>المرحلة</th>
                </tr>
              </thead>

              <tbody>
                {ranking.map((r) => (
                  <tr key={r.candidate_id}>
                    <td className="rank">
                      {r.rank}
                    </td>
                    <td>{r.candidate_name}</td>
                    <td>
                      {r.current_title || "—"}
                    </td>
                    <td>
                      {r.years_experience ?? "—"}
                    </td>
                    <td>
                      <strong>
                        {r.fit_score}%
                      </strong>
                    </td>
                    <td>{r.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">
              لا توجد نتائج CV محللة حتى الآن.
            </p>
          )}
        </section>

        <section className="panel">
          <h2>AI Interview Evaluation</h2>
          <div className="muted">
            تحليل ملاحظات المقابلة وفق متطلبات الوظيفة
            والكفاءات المهنية فقط.
          </div>

          <div className="grid">
            <div>
              <label>المرشح</label>
              <select
                value={candidateId}
                onChange={(e) =>
                  setCandidateId(e.target.value)
                }
              >
                <option value="">
                  اختر المرشح
                </option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>

              <label>المقابل</label>
              <input
                value={interviewer}
                onChange={(e) =>
                  setInterviewer(e.target.value)
                }
              />
            </div>

            <div>
              <label>ملاحظات المقابلة</label>
              <textarea
                value={interviewNotes}
                onChange={(e) =>
                  setInterviewNotes(e.target.value)
                }
                placeholder="اكتب ملاحظات وأسئلة وإجابات المقابلة..."
              />
            </div>
          </div>

          <button
            className="primary action"
            disabled={
              !candidateId ||
              !interviewNotes.trim() ||
              busy === "interview"
            }
            onClick={evaluateInterview}
          >
            {busy === "interview"
              ? "جاري تحليل المقابلة..."
              : "تحليل المقابلة"}
          </button>

          {interviewResult && (
            <div className="result">
              <div className="muted">
                Interview Assessment
              </div>

              <div className="score">
                {interviewResult.assessment_score}%
              </div>

              <p>
                {
                  interviewResult.evaluation
                    ?.summary_ar
                }
              </p>

              <strong>
                الخطوة المقترحة للمراجعة البشرية
              </strong>

              <p>
                {
                  interviewResult.evaluation
                    ?.suggested_next_step
                }
              </p>
            </div>
          )}
        </section>
      
        <div style={{
          position: "fixed",
          left: 20,
          bottom: 20,
          zIndex: 20,
        }}>
          <a
            href="/hr/recruitment/hiring"
            className="primary"
          >
            العروض والتعيين
          </a>
        </div>

</div>
    </main>
  );
}
