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

export default function ITPage() {
  const [summary, setSummary] = useState(null);
  const [references, setReferences] = useState(null);
  const [services, setServices] = useState([]);
  const [changes, setChanges] = useState([]);
  const [releases, setReleases] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,r,sv,ch,rel,inc] = await Promise.all([
        api("/api/it/summary"),
        api("/api/it/reference-summary"),
        api("/api/it/services"),
        api("/api/it/changes"),
        api("/api/it/releases"),
        api("/api/it/incidents"),
      ]);

      setSummary(s);
      setReferences(r);
      setServices(sv);
      setChanges(ch);
      setReleases(rel);
      setIncidents(inc);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createService(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/services", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          service_type: fd.get("service_type"),
          owner: fd.get("owner"),
          environment: fd.get("environment"),
          criticality: fd.get("criticality"),
          data_classification:
            fd.get("data_classification"),
          external_provider:
            fd.get("external_provider") || null,
        }),
      });

      setMessage("تم إنشاء IT Service.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createChange(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/changes", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          title: fd.get("title"),
          change_type: fd.get("change_type"),
          risk_level: fd.get("risk_level"),
          requested_by: "user",
          description: fd.get("description"),
          test_evidence: fd.get("test_evidence"),
          rollback_plan: fd.get("rollback_plan"),
          customer_or_data_impact:
            fd.get("customer_or_data_impact") === "on",
        }),
      });

      setMessage("تم إنشاء Change Request كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestChange(id) {
    try {
      await api(`/api/it/changes/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });
      setMessage("تم إرسال Change للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeChange(id) {
    try {
      await api(`/api/it/changes/${id}/authorize`, {
        method: "POST",
      });
      setMessage("تم اعتماد Change داخليًا؛ لم يتغير Production.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createRelease(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/releases", {
        method: "POST",
        body: JSON.stringify({
          change_request_id:
            fd.get("change_request_id"),
          release_version:
            fd.get("release_version"),
          target_environment:
            fd.get("target_environment"),
          release_notes:
            fd.get("release_notes"),
          pre_release_test_evidence:
            fd.get("pre_release_test_evidence"),
          rollback_plan:
            fd.get("rollback_plan"),
        }),
      });

      setMessage("تم إنشاء Release كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestRelease(id) {
    try {
      await api(`/api/it/releases/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });
      setMessage("تم إرسال Release للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeRelease(id) {
    try {
      await api(`/api/it/releases/${id}/authorize`, {
        method: "POST",
      });
      setMessage("تم اعتماد Release؛ لم يتم Deploy تلقائي.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function recordDeployment(id) {
    const ref = window.prompt(
      "مرجع الـDeployment المنفذ خارج النظام:"
    );

    if (!ref) return;

    try {
      await api(`/api/it/releases/${id}/record-deployment`, {
        method: "POST",
        body: JSON.stringify({
          external_deployment_reference: ref,
          deployed_by: "user",
        }),
      });
      setMessage("تم توثيق Deployment الخارجي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createIncident(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/incidents", {
        method: "POST",
        body: JSON.stringify({
          service_id:
            fd.get("service_id") || null,
          incident_type:
            fd.get("incident_type"),
          severity:
            fd.get("severity"),
          title:
            fd.get("title"),
          summary:
            fd.get("summary"),
          owner: "IT",
          customer_or_personal_data_impact:
            fd.get("customer_or_personal_data_impact") === "on",
          detected_at:
            new Date().toISOString(),
        }),
      });

      setMessage("تم تسجيل Incident.");
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
        minHeight: "100vh",
        padding: 24,
        background: "#06131e",
        color: "#f7fafc",
        fontFamily: "Arial,Segoe UI,sans-serif",
      }}
    >
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",padding:24,borderRadius:18}}>
          <h1 style={{marginTop:0}}>IT Agent · تقنية المعلومات</h1>
          <p>
            Service Register، Change Management، Release/Deployment
            control وIncident Register. Policy-driven technical changes
            تبقى تحت Policy Impact / System Mismatch / Technical Verification.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href="/it/security-governance" style={{color:"white"}}>Security Governance</a>
            <a href="/it/access-recovery" style={{color:"white"}}>Access & Recovery</a>
            <a href="/hr/policies-compliance" style={{color:"white"}}>Policy Impact</a>
            <a href="/admin" style={{color:"white"}}>Admin</a>
            <a href="/legal" style={{color:"white"}}>Legal</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Services: {summary?.services?.total ?? "—"} |
          Changes: {summary?.changes?.total ?? "—"} |
          Releases: {summary?.releases?.total ?? "—"} |
          Incidents: {summary?.incidents?.total ?? "—"} |
          Open Policy Mismatches: {references?.counts?.open_policy_system_mismatches ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>IT Services</h3>
          <form onSubmit={createService} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="name" placeholder="Service name" required />
            <select name="service_type">
              <option value="application">Application</option>
              <option value="platform">Platform</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="database">Database</option>
              <option value="network">Network</option>
              <option value="security">Security</option>
              <option value="integration">Integration</option>
              <option value="other">Other</option>
            </select>
            <input name="owner" placeholder="Owner" required />
            <select name="environment">
              <option value="production">Production</option>
              <option value="preproduction">Pre-production</option>
              <option value="staging">Staging</option>
              <option value="test">Test</option>
              <option value="development">Development</option>
              <option value="shared">Shared</option>
            </select>
            <select name="criticality">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <select name="data_classification">
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
              <option value="public">Public</option>
            </select>
            <input name="external_provider" placeholder="Provider (optional)" />
            <button>Create Service</button>
          </form>
          {services.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.name} · {x.environment} · {x.criticality}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Change Requests</h3>
          <form onSubmit={createChange} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <input name="title" placeholder="Change title" required />
            <select name="change_type">
              <option value="standard">Standard</option>
              <option value="high_risk">High Risk</option>
              <option value="emergency">Emergency</option>
            </select>
            <select name="risk_level">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <input name="description" placeholder="Description" required />
            <input name="test_evidence" placeholder="Test evidence" required />
            <input name="rollback_plan" placeholder="Rollback plan" required />
            <label><input name="customer_or_data_impact" type="checkbox" /> Customer/Data impact</label>
            <button>Create Draft</button>
          </form>
          {changes.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.change_type} · {x.risk_level} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>requestChange(x.id)}>Request Approval</button>
                <button onClick={()=>authorizeChange(x.id)}>Authorize</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Releases / Deployment Evidence</h3>
          <form onSubmit={createRelease} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="change_request_id" required>
              <option value="">Approved Change</option>
              {changes.filter(x=>x.status==="approved").map(x=><option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}
            </select>
            <input name="release_version" placeholder="Version" required />
            <select name="target_environment">
              <option value="production">Production</option>
              <option value="preproduction">Pre-production</option>
              <option value="staging">Staging</option>
              <option value="test">Test</option>
              <option value="development">Development</option>
            </select>
            <input name="release_notes" placeholder="Release notes" required />
            <input name="pre_release_test_evidence" placeholder="Pre-release test evidence" required />
            <input name="rollback_plan" placeholder="Rollback plan" required />
            <button>Create Release</button>
          </form>
          {releases.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.release_version} · {x.target_environment} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>requestRelease(x.id)}>Request Approval</button>
                <button onClick={()=>authorizeRelease(x.id)}>Authorize</button>
                <button onClick={()=>recordDeployment(x.id)}>Record External Deployment</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Incident Register</h3>
          <form onSubmit={createIncident} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id">
              <option value="">No linked service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <select name="incident_type">
              <option value="availability">Availability</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="data">Data</option>
              <option value="integration">Integration</option>
              <option value="configuration">Configuration</option>
              <option value="other">Other</option>
            </select>
            <select name="severity">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <input name="title" placeholder="Incident title" required />
            <input name="summary" placeholder="Summary" required />
            <label><input name="customer_or_personal_data_impact" type="checkbox" /> Customer/Personal data impact</label>
            <button>Register Incident</button>
          </form>
          {incidents.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.severity} · {x.title} · {x.status}</p>)}
        </section>
      </div>
    </main>
  );
}
