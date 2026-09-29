"use client";

import { useEffect, useState } from "react";

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
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data)
    );
  }

  return data;
}

export default function AuditRiskPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [risks, setRisks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [acceptances, setAcceptances] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,a,r,rv,ac] = await Promise.all([
        api("/api/audit/phase1b-summary"),
        api("/api/audit/risk-alerts"),
        api("/api/audit/risks"),
        api("/api/audit/risk-reviews"),
        api("/api/audit/risk-acceptances"),
      ]);

      setSummary(s);
      setAlerts(a);
      setRisks(r);
      setReviews(rv);
      setAcceptances(ac);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createRisk(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/audit/risks", {
        method: "POST",
        body: JSON.stringify({
          category: fd.get("category"),
          title: fd.get("title"),
          description: fd.get("description"),
          risk_owner: fd.get("risk_owner"),
          source_module: fd.get("source_module") || null,
          inherent_risk_level: fd.get("inherent_risk_level"),
          residual_risk_level: fd.get("residual_risk_level"),
          treatment_strategy: fd.get("treatment_strategy"),
          treatment_plan: fd.get("treatment_plan"),
          next_review_date: fd.get("next_review_date"),
        }),
      });

      setMessage("تم إنشاء Enterprise Risk.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reviewRisk(row) {
    const progress = window.prompt(
      "Treatment progress:"
    );
    if (!progress) return;

    const summaryText = window.prompt(
      "Review summary:"
    );
    if (!summaryText) return;

    const evidence = window.prompt(
      "Evidence reference:"
    );
    if (!evidence) return;

    const nextReview = window.prompt(
      "Next review date YYYY-MM-DD:"
    );
    if (!nextReview) return;

    try {
      await api(`/api/audit/risks/${row.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          review_type: "quarterly",
          reviewed_by: "user",
          new_residual_risk_level:
            row.residual_risk_level,
          treatment_progress: progress,
          review_summary: summaryText,
          evidence_reference: evidence,
          next_review_date: nextReview,
        }),
      });

      setMessage("تم تسجيل Quarterly Risk Review.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestAcceptance(row) {
    const rationale = window.prompt(
      "Risk acceptance rationale:"
    );
    if (!rationale) return;

    const controls = window.prompt(
      "Compensating controls:"
    );
    if (!controls) return;

    const commitment = window.prompt(
      "Treatment commitment:"
    );
    if (!commitment) return;

    const acceptedUntil = window.prompt(
      "Accepted until YYYY-MM-DD:"
    );
    if (!acceptedUntil) return;

    let withinAppetite = false;
    let appetiteRef = null;

    if (["low","medium"].includes(row.residual_risk_level)) {
      appetiteRef = window.prompt(
        "Approved risk appetite reference:"
      );
      if (!appetiteRef) return;

      withinAppetite = window.confirm(
        "Confirm this risk is within the approved risk appetite?"
      );
      if (!withinAppetite) return;
    }

    try {
      await api(`/api/audit/risks/${row.id}/request-acceptance`, {
        method: "POST",
        body: JSON.stringify({
          rationale,
          compensating_controls: controls,
          treatment_commitment: commitment,
          requested_by: "user",
          accepted_until: acceptedUntil,
          within_approved_appetite_confirmed:
            withinAppetite,
          risk_appetite_reference:
            appetiteRef,
        }),
      });

      setMessage("تم إرسال Risk Acceptance للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeAcceptance(row) {
    try {
      await api(`/api/audit/risk-acceptances/${row.id}/authorize`, {
        method: "POST",
      });

      setMessage("تم تفعيل Risk Acceptance بعد الاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeAcceptance(row) {
    const evidence = window.prompt(
      "Acceptance closure evidence:"
    );
    if (!evidence) return;

    try {
      await api(`/api/audit/risk-acceptances/${row.id}/close`, {
        method: "POST",
        body: JSON.stringify({
          closure_evidence_reference: evidence,
          closed_by: "user",
        }),
      });

      setMessage("تم إغلاق Risk Acceptance.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeRisk(row) {
    const evidence = window.prompt(
      "Risk closure evidence:"
    );
    if (!evidence) return;

    try {
      await api(`/api/audit/risks/${row.id}/close`, {
        method: "POST",
        body: JSON.stringify({
          closure_evidence_reference: evidence,
          closed_by: "user",
        }),
      });

      setMessage("تم إغلاق Enterprise Risk بالدليل.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight:"100vh",
        padding:24,
        background:"#06131e",
        fontFamily:"Arial,Segoe UI,sans-serif"
      }}
    >
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",padding:24,borderRadius:18}}>
          <h1 style={{marginTop:0}}>Internal Audit · Enterprise Risk</h1>
          <p>
            Enterprise Risk Register، periodic/event reviews،
            treatment monitoring وtime-bounded risk acceptance.
            النظام لا يفترض Risk Appetite ولا يقبل المخاطر تلقائيًا.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/audit" style={{color:"white"}}>Audit</a>
            <a href="/company-control" style={{color:"white"}}>Company Control</a>
            <a href="/it/security-governance" style={{color:"white"}}>IT Risk</a>
            <a href="/legal" style={{color:"white"}}>Legal</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Risks: {summary?.risks?.total ?? "—"} |
          High/Critical Open: {summary?.risks?.high_or_critical_open ?? "—"} |
          Reviews: {summary?.reviews?.total ?? "—"} |
          Acceptances: {summary?.acceptances?.total ?? "—"} |
          Alerts: {alerts?.total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Enterprise Risk Register</h3>
          <form onSubmit={createRisk} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="category" placeholder="Category" required />
            <input name="title" placeholder="Risk title" required />
            <input name="description" placeholder="Description" required />
            <input name="risk_owner" placeholder="Risk owner" required />
            <input name="source_module" placeholder="Source module (optional)" />
            <select name="inherent_risk_level">
              <option value="medium">Medium inherent</option>
              <option value="high">High inherent</option>
              <option value="critical">Critical inherent</option>
              <option value="low">Low inherent</option>
            </select>
            <select name="residual_risk_level">
              <option value="medium">Medium residual</option>
              <option value="high">High residual</option>
              <option value="critical">Critical residual</option>
              <option value="low">Low residual</option>
            </select>
            <select name="treatment_strategy">
              <option value="mitigate">Mitigate</option>
              <option value="avoid">Avoid</option>
              <option value="transfer">Transfer</option>
              <option value="accept">Accept</option>
            </select>
            <input name="treatment_plan" placeholder="Treatment plan" required />
            <input name="next_review_date" type="date" required />
            <button>Create Risk</button>
          </form>

          {risks.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.residual_risk_level} · {x.title} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                <button onClick={()=>reviewRisk(x)}>Quarterly Review</button>
                <button onClick={()=>requestAcceptance(x)}>Request Acceptance</button>
                <button onClick={()=>closeRisk(x)}>Close Risk</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Risk Acceptances</h3>
          {acceptances.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.id.slice(0,8)}</strong> · until {String(x.accepted_until)} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>authorizeAcceptance(x)}>Authorize</button>
                <button onClick={()=>closeAcceptance(x)}>Close Acceptance</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Risk Reviews</h3>
          {reviews.map(x=><p key={x.id}><strong>{x.review_type}</strong> · {x.new_residual_risk_level} · next {String(x.next_review_date)}</p>)}
        </section>
      </div>
    </main>
  );
}
