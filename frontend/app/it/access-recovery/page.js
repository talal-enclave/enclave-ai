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

export default function ITAccessRecoveryPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [services, setServices] = useState([]);
  const [access, setAccess] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,a,sv,ac,p,t] = await Promise.all([
        api("/api/it/phase1b-summary"),
        api("/api/it/access-recovery-alerts"),
        api("/api/it/services"),
        api("/api/it/access-requests"),
        api("/api/it/recovery-profiles"),
        api("/api/it/recovery-tests"),
      ]);

      setSummary(s);
      setAlerts(a);
      setServices(sv);
      setAccess(ac);
      setProfiles(p);
      setTests(t);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAccess(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      const privileged =
        fd.get("access_type") === "privileged";

      const expires = fd.get("expires_at");

      await api("/api/it/access-requests", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          access_type: fd.get("access_type"),
          subject_type: fd.get("subject_type"),
          subject_name: fd.get("subject_name"),
          role_or_scope: fd.get("role_or_scope"),
          requested_by: "user",
          justification: fd.get("justification"),
          least_privilege_confirmed: true,
          starts_at: new Date().toISOString(),
          expires_at:
            expires
              ? new Date(expires).toISOString()
              : privileged
                ? null
                : null,
        }),
      });

      setMessage("تم إنشاء Logical Access Request.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestAccess(id) {
    try {
      await api(`/api/it/access-requests/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });
      setMessage("تم إرسال طلب الصلاحية للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeAccess(id) {
    try {
      await api(`/api/it/access-requests/${id}/authorize`, {
        method: "POST",
      });
      setMessage("تم الاعتماد الداخلي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function provisionAccess(id) {
    const ref = window.prompt(
      "مرجع إنشاء الصلاحية خارج النظام:"
    );
    if (!ref) return;

    try {
      await api(`/api/it/access-requests/${id}/record-provisioning`, {
        method: "POST",
        body: JSON.stringify({
          external_provisioning_reference: ref,
          provisioned_by: "user",
        }),
      });
      setMessage("تم توثيق Provisioning الخارجي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function revokeAccess(id) {
    const ref = window.prompt(
      "مرجع إلغاء الصلاحية خارج النظام:"
    );
    if (!ref) return;

    try {
      await api(`/api/it/access-requests/${id}/record-revocation`, {
        method: "POST",
        body: JSON.stringify({
          external_revocation_reference: ref,
          revoked_by: "user",
        }),
      });
      setMessage("تم توثيق Revocation الخارجي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createProfile(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/recovery-profiles", {
        method: "POST",
        body: JSON.stringify({
          service_id: fd.get("service_id"),
          backup_strategy: fd.get("backup_strategy"),
          backup_frequency: fd.get("backup_frequency"),
          recovery_location:
            fd.get("recovery_location") || null,
          rpo_target_minutes:
            Number(fd.get("rpo_target_minutes")),
          rto_target_minutes:
            Number(fd.get("rto_target_minutes")),
          test_frequency_days:
            Number(fd.get("test_frequency_days") || 90),
          next_test_due_date:
            fd.get("next_test_due_date"),
        }),
      });

      setMessage("تم إنشاء Backup/Recovery Profile.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestProfile(id) {
    try {
      await api(`/api/it/recovery-profiles/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });
      setMessage("تم إرسال Recovery Profile للاعتماد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeProfile(id) {
    try {
      await api(`/api/it/recovery-profiles/${id}/authorize`, {
        method: "POST",
      });
      setMessage("تم تفعيل Recovery Profile داخليًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createRecoveryTest(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/it/recovery-tests", {
        method: "POST",
        body: JSON.stringify({
          recovery_profile_id:
            fd.get("recovery_profile_id"),
          test_type: fd.get("test_type"),
          planned_at:
            new Date(fd.get("planned_at")).toISOString(),
        }),
      });

      setMessage("تم جدولة Recovery/DR Test فقط.");
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
          <h1 style={{marginTop:0}}>IT · Access & Recovery</h1>
          <p>
            Logical Access وPrivileged Access مع Backup/Recovery/DR
            governance. الوصول الفعلي للمباني يبقى في Admin.
          </p>
          <div style={{display:"flex",gap:12}}>
            <a href="/it" style={{color:"white"}}>IT</a>
            <a href="/admin" style={{color:"white"}}>Admin Physical Access</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Logical Access: {summary?.logical_access?.total ?? "—"} |
          Privileged Active: {summary?.logical_access?.privileged_active ?? "—"} |
          Recovery Profiles: {summary?.recovery_profiles?.total ?? "—"} |
          Recovery Tests: {summary?.recovery_tests?.total ?? "—"} |
          Alerts: {alerts?.total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Logical Access Requests</h3>
          <form onSubmit={createAccess} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <select name="access_type">
              <option value="standard">Standard</option>
              <option value="privileged">Privileged</option>
            </select>
            <select name="subject_type">
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="service_account">Service Account</option>
              <option value="vendor">Vendor</option>
              <option value="other">Other</option>
            </select>
            <input name="subject_name" placeholder="Subject" required />
            <input name="role_or_scope" placeholder="Role / Scope" required />
            <input name="justification" placeholder="Justification" required />
            <input name="expires_at" type="datetime-local" />
            <button>Create Request</button>
          </form>

          {access.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · {x.access_type} · {x.subject_name} · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>requestAccess(x.id)}>Request Approval</button>
                <button onClick={()=>authorizeAccess(x.id)}>Authorize</button>
                <button onClick={()=>provisionAccess(x.id)}>Record Provisioning</button>
                <button onClick={()=>revokeAccess(x.id)}>Record Revocation</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Backup / Recovery Profiles</h3>
          <form onSubmit={createProfile} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="service_id" required>
              <option value="">Service</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
            </select>
            <input name="backup_strategy" placeholder="Backup strategy" required />
            <input name="backup_frequency" placeholder="Backup frequency" required />
            <input name="recovery_location" placeholder="Recovery location" />
            <input name="rpo_target_minutes" type="number" min="1" placeholder="RPO minutes" required />
            <input name="rto_target_minutes" type="number" min="1" placeholder="RTO minutes" required />
            <input name="test_frequency_days" type="number" min="1" defaultValue="90" />
            <input name="next_test_due_date" type="date" required />
            <button>Create Profile</button>
          </form>

          {profiles.map(x=>(
            <div key={x.id} style={{borderTop:"1px solid #eee",padding:"8px 0"}}>
              <strong>{x.code}</strong> · RPO {x.rpo_target_minutes}m · RTO {x.rto_target_minutes}m · {x.status}
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>requestProfile(x.id)}>Request Approval</button>
                <button onClick={()=>authorizeProfile(x.id)}>Authorize</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Recovery / DR Tests</h3>
          <form onSubmit={createRecoveryTest} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="recovery_profile_id" required>
              <option value="">Active Profile</option>
              {profiles.filter(x=>x.status==="active").map(x=><option key={x.id} value={x.id}>{x.code}</option>)}
            </select>
            <select name="test_type">
              <option value="backup_restore">Backup Restore</option>
              <option value="disaster_recovery">Disaster Recovery</option>
              <option value="business_continuity">Business Continuity</option>
            </select>
            <input name="planned_at" type="datetime-local" required />
            <button>Plan Test</button>
          </form>

          {tests.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.test_type} · {x.status} · {x.result || "—"}</p>)}
        </section>
      </div>
    </main>
  );
}
