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

export default function AuditIntegrityGovernancePage() {
  const [summary, setSummary] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,ss,i,r] = await Promise.all([
        api("/api/audit/phase1c-summary"),
        api("/api/audit/governance-monitoring/source-snapshot"),
        api("/api/audit/integrity-investigations"),
        api("/api/audit/governance-monitoring/reviews"),
      ]);

      setSummary(s);
      setSnapshot(ss);
      setInvestigations(i);
      setReviews(r);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createInvestigation(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/audit/integrity-investigations", {
        method: "POST",
        body: JSON.stringify({
          case_type: fd.get("case_type"),
          title: fd.get("title"),
          allegation_summary:
            fd.get("allegation_summary"),
          received_channel:
            fd.get("received_channel"),
          anonymous_reporter:
            fd.get("anonymous_reporter") === "on",
          reporter_reference:
            fd.get("reporter_reference") || null,
          severity: fd.get("severity"),
          investigator: fd.get("investigator"),
          independence_confirmed: true,
          conflict_check_confirmed: true,
        }),
      });

      setMessage("تم إنشاء Investigation وإرساله لمسار الاعتماد.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function startInvestigation(id) {
    try {
      await api(`/api/audit/integrity-investigations/${id}/start`, {
        method: "POST",
        body: JSON.stringify({
          actor: "user",
        }),
      });

      setMessage("تم بدء التحقيق بعد الاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function recordFindings(id) {
    const findings = window.prompt(
      "Investigation findings summary:"
    );
    if (!findings) return;

    try {
      await api(`/api/audit/integrity-investigations/${id}/record-findings`, {
        method: "POST",
        body: JSON.stringify({
          findings_summary: findings,
          actor: "user",
        }),
      });

      setMessage("تم تسجيل نتائج التحقيق.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeInvestigation(id) {
    const ref = window.prompt(
      "Investigation report reference:"
    );
    if (!ref) return;

    try {
      await api(`/api/audit/integrity-investigations/${id}/close`, {
        method: "POST",
        body: JSON.stringify({
          outcome: "substantiated",
          investigation_report_reference: ref,
          closed_by: "user",
          hr_referral_recommended: true,
          legal_referral_recommended: true,
          regulatory_referral_recommended: false,
          external_referral_recommended: false,
        }),
      });

      setMessage(
        "تم إغلاق التحقيق. أي HR/Legal referral هو Recommendation فقط."
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createMonitoringReview(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/audit/governance-monitoring/reviews", {
        method: "POST",
        body: JSON.stringify({
          review_type: fd.get("review_type"),
          period_label: fd.get("period_label"),
          reviewed_by: fd.get("reviewed_by"),
          evidence_reference:
            fd.get("evidence_reference"),
          observations: fd.get("observations"),
          follow_up_required:
            fd.get("follow_up_required") === "on",
          next_review_date:
            fd.get("next_review_date"),
        }),
      });

      setMessage("تم تسجيل Governance Monitoring Review read-only.");
      e.currentTarget.reset();
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
          <h1 style={{marginTop:0}}>Internal Audit · Integrity & Governance Monitoring</h1>
          <p>
            Fraud / Whistleblowing investigations مع حماية المبلغ
            واستقلال التحقيق، ومراقبة مستقلة لسجلات الاستثناءات
            والتفويضات ومصفوفة الصلاحيات بدون تعديل الأنظمة المصدرية.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/audit" style={{color:"white"}}>Audit</a>
            <a href="/audit/risk" style={{color:"white"}}>Enterprise Risk</a>
            <a href="/it/security-governance" style={{color:"white"}}>IT Exceptions</a>
            <a href="/legal/controls" style={{color:"white"}}>Legal Delegations</a>
            <a href="/company-control" style={{color:"white"}}>Authority Matrix</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Investigations: {summary?.integrity_investigations?.total ?? "—"} |
          Open: {summary?.integrity_investigations?.open ?? "—"} |
          Monitoring Reviews: {summary?.governance_monitoring?.total ?? "—"} |
          IT Exceptions: {snapshot?.snapshot?.it_security_exceptions?.total ?? "—"} |
          Legal Delegations: {snapshot?.snapshot?.legal_authority_delegations?.total ?? "—"} |
          Authority Rules: {snapshot?.snapshot?.company_authority_matrix?.rules_total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Fraud / Integrity Investigations</h3>
          <form onSubmit={createInvestigation} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="case_type">
              <option value="fraud">Fraud</option>
              <option value="whistleblowing">Whistleblowing</option>
              <option value="integrity">Integrity</option>
              <option value="conflict_of_interest">Conflict of Interest</option>
              <option value="other">Other</option>
            </select>
            <input name="title" placeholder="Case title" required />
            <input name="allegation_summary" placeholder="Allegation summary" required />
            <input name="received_channel" placeholder="Received channel" required />
            <label><input name="anonymous_reporter" type="checkbox" /> Anonymous reporter</label>
            <input name="reporter_reference" placeholder="Protected reporter reference" />
            <select name="severity">
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input name="investigator" placeholder="Independent investigator" required />
            <button>Create Investigation</button>
          </form>

          {investigations.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.case_type} · {x.severity} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>startInvestigation(x.id)}>Start</button>
                <button onClick={()=>recordFindings(x.id)}>Record Findings</button>
                <button onClick={()=>closeInvestigation(x.id)}>Close</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Exception / Delegation / Authority Monitoring</h3>
          <form onSubmit={createMonitoringReview} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="review_type">
              <option value="monthly_exceptions_delegations">Monthly Exceptions & Delegations</option>
              <option value="annual_authority_matrix">Annual Authority Matrix Review</option>
              <option value="event_governance_review">Event Governance Review</option>
            </select>
            <input name="period_label" placeholder="Period label" required />
            <input name="reviewed_by" placeholder="Reviewed by" required />
            <input name="evidence_reference" placeholder="Evidence reference" required />
            <input name="observations" placeholder="Observations" required />
            <label><input name="follow_up_required" type="checkbox" /> Follow-up required</label>
            <input name="next_review_date" type="date" required />
            <button>Record Review</button>
          </form>

          {reviews.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.review_type} · {x.period_label} · follow-up {x.follow_up_required ? "Yes" : "No"}</p>)}
        </section>
      </div>
    </main>
  );
}
