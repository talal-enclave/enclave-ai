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

export default function ITSecurityGovernancePage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,a,sv,ci,ar,se,v,sa] = await Promise.all([
        api("/api/it/phase1c-summary"),
        api("/api/it/security-governance-alerts"),
        api("/api/it/services"),
        api("/api/it/configuration-items"),
        api("/api/it/architecture-reviews"),
        api("/api/it/security-exceptions"),
        api("/api/it/vulnerabilities"),
        api("/api/it/security-assessments"),
      ]);

      setSummary(s);
      setAlerts(a);
      setServices(sv);
      setItems(ci);
      setReviews(ar);
      setExceptions(se);
      setVulnerabilities(v);
      setAssessments(sa);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createItem(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/configuration-items", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          name: fd.get("name"),
          item_type: fd.get("item_type"),
          environment: fd.get("environment"),
          owner: fd.get("owner"),
          baseline_reference:
            fd.get("baseline_reference") || null,
        }),
      });

      setMessage("تم إنشاء Configuration Item بدون تغيير فعلي.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createReview(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/architecture-reviews", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          review_type: fd.get("review_type"),
          title: fd.get("title"),
          proposed_architecture:
            fd.get("proposed_architecture"),
          security_review_summary:
            fd.get("security_review_summary"),
          privacy_review_required:
            fd.get("privacy_review_required") === "on",
          risk_level: fd.get("risk_level"),
        }),
      });

      setMessage("تم إنشاء Architecture Review كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createException(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/security-exceptions", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          control_reference:
            fd.get("control_reference"),
          title: fd.get("title"),
          justification: fd.get("justification"),
          compensating_controls:
            fd.get("compensating_controls"),
          requested_by: "user",
          risk_level: fd.get("risk_level"),
          expiry_date: fd.get("expiry_date"),
        }),
      });

      setMessage("تم إنشاء Security Exception بدون تعطيل أي Control.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createVulnerability(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/vulnerabilities", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          source_type: fd.get("source_type"),
          external_reference:
            fd.get("external_reference") || null,
          title: fd.get("title"),
          severity: fd.get("severity"),
          description: fd.get("description"),
          remediation_plan:
            fd.get("remediation_plan"),
          due_date: fd.get("due_date"),
        }),
      });

      setMessage("تم تسجيل Vulnerability بدون Scan/Patch تلقائي.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAssessment(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/security-assessments", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          assessment_type:
            fd.get("assessment_type"),
          title: fd.get("title"),
          scope_summary: fd.get("scope_summary"),
          written_authorization_reference:
            fd.get("written_authorization_reference"),
          requested_by: "user",
        }),
      });

      setMessage("تم إنشاء Security Assessment؛ لا يبدأ اختبار خارجي تلقائي.");
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
          <h1 style={{marginTop:0}}>IT · Security Governance</h1>
          <p>
            Configuration inventory، Architecture Review، Security
            Exceptions، Vulnerability Risk Acceptance وSecurity
            Assessment Authorization.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/it" style={{color:"white"}}>IT</a>
            <a href="/it/access-recovery" style={{color:"white"}}>Access & Recovery</a>
            <a href="/hr/policies-compliance" style={{color:"white"}}>Policy Impact</a>
            <a href="/legal/privacy-integrity" style={{color:"white"}}>Privacy</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Config Items: {summary?.configuration_items?.total ?? "—"} |
          Architecture: {summary?.architecture_reviews?.total ?? "—"} |
          Exceptions: {summary?.security_exceptions?.total ?? "—"} |
          Vulnerabilities: {summary?.vulnerabilities?.total ?? "—"} |
          Assessments: {summary?.security_assessments?.total ?? "—"} |
          Alerts: {alerts?.total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Configuration Items</h3>
          <form onSubmit={createItem} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <input name="name" placeholder="Item name" required />
            <select name="item_type">
              <option value="application_component">Application Component</option>
              <option value="database">Database</option>
              <option value="container">Container</option>
              <option value="network">Network</option>
              <option value="security_control">Security Control</option>
              <option value="certificate">Certificate</option>
              <option value="integration">Integration</option>
              <option value="other">Other</option>
            </select>
            <select name="environment">
              <option value="production">Production</option>
              <option value="preproduction">Pre-production</option>
              <option value="staging">Staging</option>
              <option value="test">Test</option>
              <option value="development">Development</option>
              <option value="shared">Shared</option>
            </select>
            <input name="owner" placeholder="Owner" required />
            <input name="baseline_reference" placeholder="Baseline reference" />
            <button>Create Item</button>
          </form>
          {items.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.name} · {x.environment}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Architecture / Development Standards</h3>
          <form onSubmit={createReview} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <select name="review_type">
              <option value="solution_architecture">Solution Architecture</option>
              <option value="security_architecture">Security Architecture</option>
              <option value="development_standard">Development Standard</option>
              <option value="cloud_technology_assessment">Cloud Technology Assessment</option>
              <option value="other">Other</option>
            </select>
            <input name="title" placeholder="Title" required />
            <input name="proposed_architecture" placeholder="Architecture / standard" required />
            <input name="security_review_summary" placeholder="Security review" required />
            <select name="risk_level">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <label><input name="privacy_review_required" type="checkbox" /> Privacy review needed</label>
            <button>Create Review</button>
          </form>
          {reviews.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.review_type} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Security Exceptions</h3>
          <form onSubmit={createException} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <input name="control_reference" placeholder="Control reference" required />
            <input name="title" placeholder="Exception title" required />
            <input name="justification" placeholder="Justification" required />
            <input name="compensating_controls" placeholder="Compensating controls" required />
            <select name="risk_level">
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input name="expiry_date" type="date" required />
            <button>Create Exception</button>
          </form>
          {exceptions.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.control_reference} · {x.risk_level} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Vulnerability Register</h3>
          <form onSubmit={createVulnerability} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <select name="source_type">
              <option value="vulnerability_scan">Vulnerability Scan</option>
              <option value="penetration_test">Penetration Test</option>
              <option value="audit">Audit</option>
              <option value="incident">Incident</option>
              <option value="manual_review">Manual Review</option>
              <option value="external_report">External Report</option>
              <option value="other">Other</option>
            </select>
            <input name="external_reference" placeholder="External reference" />
            <input name="title" placeholder="Finding" required />
            <select name="severity">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <input name="description" placeholder="Description" required />
            <input name="remediation_plan" placeholder="Remediation plan" required />
            <input name="due_date" type="date" required />
            <button>Register Vulnerability</button>
          </form>
          {vulnerabilities.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.severity} · {x.title} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Authorized Security Assessments</h3>
          <form onSubmit={createAssessment} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <select name="assessment_type">
              <option value="penetration_test">Penetration Test</option>
              <option value="vulnerability_assessment">Vulnerability Assessment</option>
              <option value="security_review">Security Review</option>
              <option value="configuration_review">Configuration Review</option>
              <option value="other">Other</option>
            </select>
            <input name="title" placeholder="Assessment title" required />
            <input name="scope_summary" placeholder="Written scope" required />
            <input name="written_authorization_reference" placeholder="Written authorization reference" required />
            <button>Create Assessment</button>
          </form>
          {assessments.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.assessment_type} · {x.status}</p>)}
        </section>
      </div>
    </main>
  );
}
