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

export default function LegalControlsPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [ipAssets, setIpAssets] = useState([]);
  const [matters, setMatters] = useState([]);
  const [actions, setActions] = useState([]);
  const [holds, setHolds] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,a,au,ip,m,ac,h] = await Promise.all([
        api("/api/legal/phase1c-summary"),
        api("/api/legal/controls-alerts"),
        api("/api/legal/authority-delegations"),
        api("/api/legal/ip-assets"),
        api("/api/legal/matters"),
        api("/api/legal/matter-actions"),
        api("/api/legal/holds"),
      ]);
      setSummary(s);
      setAlerts(a);
      setAuthorities(au);
      setIpAssets(ip);
      setMatters(m);
      setActions(ac);
      setHolds(h);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function createAuthority(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/authority-delegations", {
        method: "POST",
        body: JSON.stringify({
          authorization_type: fd.get("authorization_type"),
          grantee_name: fd.get("grantee_name"),
          grantee_role: fd.get("grantee_role") || null,
          scope_summary: fd.get("scope_summary"),
          effective_date: fd.get("effective_date"),
          expiry_date: fd.get("expiry_date") || null,
        }),
      });
      setMessage("تم إنشاء سجل الصلاحية كمسودة فقط.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createIp(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/ip-assets", {
        method: "POST",
        body: JSON.stringify({
          asset_type: fd.get("asset_type"),
          asset_name: fd.get("asset_name"),
          owner_entity: fd.get("owner_entity"),
          jurisdiction: fd.get("jurisdiction") || null,
        }),
      });
      setMessage("تم إنشاء سجل IP بدون أي Filing خارجي.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAction(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api(`/api/legal/matters/${fd.get("matter_id")}/actions`, {
        method: "POST",
        body: JSON.stringify({
          action_type: fd.get("action_type"),
          description: fd.get("description"),
          amount: fd.get("amount")
            ? Number(fd.get("amount"))
            : null,
          currency: "SAR",
          risk_level: fd.get("risk_level"),
        }),
      });
      setMessage("تم إنشاء الإجراء القانوني كمسودة فقط.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createHold(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/holds", {
        method: "POST",
        body: JSON.stringify({
          matter_id: fd.get("matter_id") || null,
          title: fd.get("title"),
          scope_summary: fd.get("scope_summary"),
          owner: fd.get("owner"),
          start_date: fd.get("start_date"),
          review_date: fd.get("review_date") || null,
        }),
      });
      setMessage("تم إنشاء Legal Hold بدون حذف أو تعديل ملفات.");
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
          <h1 style={{marginTop:0}}>Legal · Corporate Controls</h1>
          <p>
            التفويضات والتمثيل الرسمي، الملكية الفكرية، الإجراءات
            القانونية الجوهرية وLegal Holds. النظام يوثق الاعتماد
            والدليل فقط ولا ينفذ أي إجراء خارجي.
          </p>
          <div style={{display:"flex",gap:12}}>
            <a href="/legal" style={{color:"white"}}>Legal</a>
            <a href="/legal/privacy-integrity" style={{color:"white"}}>Privacy & Integrity</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Authorities: {summary?.authority_delegations?.total ?? "—"} |
          IP: {summary?.ip_assets?.total ?? "—"} |
          Legal Actions: {summary?.matter_actions?.total ?? "—"} |
          Holds: {summary?.legal_holds?.total ?? "—"} |
          Alerts: {alerts?.total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Delegation / Representation Register</h3>
          <form onSubmit={createAuthority} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="authorization_type">
              <option value="delegation">Delegation</option>
              <option value="power_of_attorney">Power of Attorney</option>
              <option value="signature_authority">Signature Authority</option>
              <option value="seal_authority">Seal Authority</option>
              <option value="official_representation">Official Representation</option>
            </select>
            <input name="grantee_name" placeholder="Grantee" required />
            <input name="grantee_role" placeholder="Role" />
            <input name="scope_summary" placeholder="Scope" required />
            <input name="effective_date" type="date" required />
            <input name="expiry_date" type="date" />
            <button>Create Draft</button>
          </form>
          {authorities.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.authorization_type} · {x.grantee_name} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>IP / Trademark Register</h3>
          <form onSubmit={createIp} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="asset_type">
              <option value="trademark">Trademark</option>
              <option value="copyright">Copyright</option>
              <option value="patent">Patent</option>
              <option value="domain">Domain</option>
              <option value="other">Other</option>
            </select>
            <input name="asset_name" placeholder="Asset name" required />
            <input name="owner_entity" placeholder="Owner entity" required />
            <input name="jurisdiction" placeholder="Jurisdiction" />
            <button>Create Draft</button>
          </form>
          {ipAssets.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.asset_type} · {x.asset_name} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Material Legal Actions</h3>
          <form onSubmit={createAction} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="matter_id" required>
              <option value="">Legal Matter</option>
              {matters.filter(x=>x.status!=="closed").map(x=><option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}
            </select>
            <select name="action_type">
              <option value="external_counsel">External Counsel</option>
              <option value="claim_filing">Claim Filing</option>
              <option value="settlement">Settlement</option>
              <option value="waiver">Waiver</option>
              <option value="regulatory_notification">Regulatory Notification</option>
              <option value="formal_notice">Formal Notice</option>
              <option value="other">Other</option>
            </select>
            <input name="description" placeholder="Description" required />
            <input name="amount" type="number" min="0" step="0.01" placeholder="Amount SAR" />
            <select name="risk_level">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button>Create Draft</button>
          </form>
          {actions.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.action_type} · {x.risk_level} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Legal Holds</h3>
          <form onSubmit={createHold} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="matter_id">
              <option value="">No linked matter</option>
              {matters.map(x=><option key={x.id} value={x.id}>{x.code} · {x.title}</option>)}
            </select>
            <input name="title" placeholder="Hold title" required />
            <input name="scope_summary" placeholder="Preservation scope" required />
            <input name="owner" placeholder="Owner" required />
            <input name="start_date" type="date" required />
            <input name="review_date" type="date" />
            <button>Create Hold</button>
          </form>
          {holds.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.title} · {x.status}</p>)}
        </section>
      </div>
    </main>
  );
}
