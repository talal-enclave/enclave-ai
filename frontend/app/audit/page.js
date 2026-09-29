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

export default function AuditPage() {
  const [summary, setSummary] = useState(null);
  const [refs, setRefs] = useState(null);
  const [plans, setPlans] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,r,p,e,f] = await Promise.all([
        api("/api/audit/summary"),
        api("/api/audit/reference-summary"),
        api("/api/audit/plans"),
        api("/api/audit/engagements"),
        api("/api/audit/findings"),
      ]);

      setSummary(s);
      setRefs(r);
      setPlans(p);
      setEngagements(e);
      setFindings(f);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPlan(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/audit/plans", {
        method: "POST",
        body: JSON.stringify({
          year: Number(fd.get("year")),
          title: fd.get("title"),
          risk_basis: fd.get("risk_basis"),
          scope_summary: fd.get("scope_summary"),
          prepared_by: fd.get("prepared_by"),
          independence_confirmed: true,
        }),
      });

      setMessage("تم إنشاء Annual Audit Plan كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestPlan(id) {
    try {
      await api(`/api/audit/plans/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });

      setMessage("تم إرسال خطة المراجعة للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizePlan(id) {
    try {
      await api(`/api/audit/plans/${id}/authorize`, {
        method: "POST",
      });

      setMessage("تم اعتماد خطة المراجعة داخليًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createEngagement(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/audit/engagements", {
        method: "POST",
        body: JSON.stringify({
          plan_id: fd.get("plan_id") || null,
          title: fd.get("title"),
          domain: fd.get("domain"),
          objective: fd.get("objective"),
          scope_summary: fd.get("scope_summary"),
          records_access_scope:
            fd.get("records_access_scope"),
          auditor: fd.get("auditor"),
          independence_confirmed: true,
          planned_start_date:
            fd.get("planned_start_date") || null,
          planned_end_date:
            fd.get("planned_end_date") || null,
        }),
      });

      setMessage("تم إنشاء Audit Engagement.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setEngagementStatus(id, status) {
    try {
      await api(`/api/audit/engagements/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          actor: "user",
        }),
      });

      setMessage(`Engagement -> ${status}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createFinding(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const engagementId = fd.get("engagement_id");

    try {
      await api(`/api/audit/engagements/${engagementId}/findings`, {
        method: "POST",
        body: JSON.stringify({
          title: fd.get("title"),
          severity: fd.get("severity"),
          condition: fd.get("condition"),
          criteria: fd.get("criteria"),
          cause: fd.get("cause") || null,
          impact: fd.get("impact"),
          recommendation: fd.get("recommendation"),
        }),
      });

      setMessage("تم تسجيل Audit Finding.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function actionPlan(row) {
    const response = window.prompt(
      "Management response:"
    );
    if (!response) return;

    const plan = window.prompt(
      "Action plan:"
    );
    if (!plan) return;

    const owner = window.prompt(
      "Action owner:"
    );
    if (!owner) return;

    const target = window.prompt(
      "Target date YYYY-MM-DD:"
    );
    if (!target) return;

    try {
      await api(`/api/audit/findings/${row.id}/action-plan`, {
        method: "POST",
        body: JSON.stringify({
          management_response: response,
          action_plan: plan,
          action_owner: owner,
          target_date: target,
          requested_by: "user",
        }),
      });

      setMessage("تم تسجيل Finding Action Plan.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeActionPlan(id) {
    try {
      await api(`/api/audit/findings/${id}/authorize-action-plan`, {
        method: "POST",
      });

      setMessage("تم اعتماد Action Plan.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitClosure(row) {
    const evidence = window.prompt(
      "Closure evidence reference:"
    );
    if (!evidence) return;

    try {
      await api(`/api/audit/findings/${row.id}/submit-closure-evidence`, {
        method: "POST",
        body: JSON.stringify({
          closure_evidence_reference: evidence,
          submitted_by: "user",
        }),
      });

      setMessage("تم إرسال دليل الإغلاق للتحقق المستقل.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifyClosure(row) {
    const verifier = window.prompt(
      "Independent verifier:"
    );
    if (!verifier) return;

    const summaryText = window.prompt(
      "Verification summary:"
    );
    if (!summaryText) return;

    try {
      await api(`/api/audit/findings/${row.id}/verify-closure`, {
        method: "POST",
        body: JSON.stringify({
          result: "passed",
          verification_summary: summaryText,
          verified_by: verifier,
        }),
      });

      setMessage("تم التحقق المستقل وإغلاق الملاحظة.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadEvidence(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const file = fd.get("file");
    const findingId = fd.get("finding_id");

    if (!file || !findingId) return;

    const body = new FormData();
    body.append("module", "audit");
    body.append("entity_type", "audit_finding");
    body.append("entity_id", findingId);
    body.append("document_type", "audit_evidence");
    body.append("uploaded_by", "user");
    body.append("confidentiality_level", "restricted");
    body.append("title", file.name);
    body.append("description", "Internal audit evidence");
    body.append("file", file);

    try {
      const response = await fetch(
        "/api/hr/attachments/upload",
        {
          method: "POST",
          body,
        }
      );

      if (!response.ok) {
        throw new Error(
          await response.text()
        );
      }

      setMessage("تم رفع Audit Evidence.");
      event.currentTarget.reset();
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
          <h1 style={{marginTop:0}}>Internal Audit · المراجعة الداخلية</h1>
          <p>
            Risk-based audit planning، independent engagements،
            findings، management action plans وindependent closure
            verification. Audit لا يشغّل الضوابط ولا يعتمد المعاملات
            التي يختبرها.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/audit/integrity-governance" style={{color:"white"}}>Integrity & Governance</a>
            <a href="/audit/risk" style={{color:"white"}}>Enterprise Risk</a>
            <a href="/dashboard" style={{color:"white"}}>Audit Trail</a>
            <a href="/company-control" style={{color:"white"}}>Company Control</a>
            <a href="/hr/policies-compliance" style={{color:"white"}}>Compliance</a>
            <a href="/it" style={{color:"white"}}>IT</a>
            <a href="/legal" style={{color:"white"}}>Legal</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Plans: {summary?.plans?.total ?? "—"} |
          Engagements: {summary?.engagements?.total ?? "—"} |
          Open Findings: {summary?.findings?.open ?? "—"} |
          High/Critical Open: {summary?.findings?.high_or_critical_open ?? "—"} |
          Audit Events Reference: {refs?.counts?.audit_log_events ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Annual Audit Plan</h3>
          <form onSubmit={createPlan} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="year" type="number" defaultValue="2027" required />
            <input name="title" placeholder="Plan title" required />
            <input name="risk_basis" placeholder="Risk basis" required />
            <input name="scope_summary" placeholder="Scope summary" required />
            <input name="prepared_by" placeholder="Prepared by" required />
            <button>Create Draft</button>
          </form>

          {plans.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.year} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>requestPlan(x.id)}>Request Approval</button>
                <button onClick={()=>authorizePlan(x.id)}>Authorize</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Audit Engagements</h3>
          <form onSubmit={createEngagement} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="plan_id">
              <option value="">No plan link</option>
              {plans.filter(x=>x.status==="approved").map(x=><option key={x.id} value={x.id}>{x.code} · {x.year}</option>)}
            </select>
            <input name="title" placeholder="Engagement title" required />
            <input name="domain" placeholder="Domain" required />
            <input name="objective" placeholder="Objective" required />
            <input name="scope_summary" placeholder="Audit scope" required />
            <input name="records_access_scope" placeholder="Records access scope" required />
            <input name="auditor" placeholder="Auditor" required />
            <input name="planned_start_date" type="date" />
            <input name="planned_end_date" type="date" />
            <button>Create Engagement</button>
          </form>

          {engagements.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.domain} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>setEngagementStatus(x.id,"in_progress")}>Start</button>
                <button onClick={()=>setEngagementStatus(x.id,"reporting")}>Reporting</button>
                <button onClick={()=>setEngagementStatus(x.id,"closed")}>Close</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Audit Findings</h3>
          <form onSubmit={createFinding} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="engagement_id" required>
              <option value="">Active Engagement</option>
              {engagements.filter(x=>["in_progress","reporting"].includes(x.status)).map(x=><option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}
            </select>
            <input name="title" placeholder="Finding title" required />
            <select name="severity">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <input name="condition" placeholder="Condition" required />
            <input name="criteria" placeholder="Criteria" required />
            <input name="cause" placeholder="Cause" />
            <input name="impact" placeholder="Impact" required />
            <input name="recommendation" placeholder="Recommendation" required />
            <button>Create Finding</button>
          </form>

          {findings.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.severity} · {x.title} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                <button onClick={()=>actionPlan(x)}>Action Plan</button>
                <button onClick={()=>authorizeActionPlan(x.id)}>Authorize Plan</button>
                <button onClick={()=>submitClosure(x)}>Closure Evidence</button>
                <button onClick={()=>verifyClosure(x)}>Independent Verify</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Unified Audit Evidence</h3>
          <form onSubmit={uploadEvidence} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="finding_id" required>
              <option value="">Finding</option>
              {findings.map(x=><option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}
            </select>
            <input name="file" type="file" required />
            <button>Upload Evidence</button>
          </form>
        </section>
      </div>
    </main>
  );
}
