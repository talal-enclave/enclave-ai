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

export default function LegalPrivacyIntegrityPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [privacy, setPrivacy] = useState([]);
  const [sharing, setSharing] = useState([]);
  const [dpias, setDpias] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [s,a,p,sh,d,g,t] = await Promise.all([
        api("/api/legal/phase1b-summary"),
        api("/api/legal/privacy-integrity-alerts"),
        api("/api/legal/privacy-requests"),
        api("/api/legal/data-sharing-assessments"),
        api("/api/legal/dpias"),
        api("/api/legal/gifts-hospitality"),
        api("/api/legal/third-party-screenings"),
      ]);

      setSummary(s);
      setAlerts(a);
      setPrivacy(p);
      setSharing(sh);
      setDpias(d);
      setGifts(g);
      setScreenings(t);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPrivacy(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/privacy-requests", {
        method: "POST",
        body: JSON.stringify({
          request_type: fd.get("request_type"),
          subject_type: fd.get("subject_type"),
          subject_reference:
            fd.get("subject_reference") || null,
          received_date: fd.get("received_date"),
          due_date: fd.get("due_date"),
        }),
      });
      setMessage("تم تسجيل طلب الخصوصية بدون تنفيذ أي إفصاح/حذف.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createSharing(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/data-sharing-assessments", {
        method: "POST",
        body: JSON.stringify({
          recipient_name: fd.get("recipient_name"),
          purpose: fd.get("purpose"),
          legal_basis: fd.get("legal_basis"),
          data_categories: fd.get("data_categories"),
          cross_border: fd.get("cross_border") === "on",
          dpa_required: fd.get("dpa_required") === "on",
          risk_level: fd.get("risk_level"),
        }),
      });
      setMessage("تم إنشاء تقييم مشاركة البيانات كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createDpia(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/dpias", {
        method: "POST",
        body: JSON.stringify({
          title: fd.get("title"),
          owner: fd.get("owner"),
          trigger_reason: fd.get("trigger_reason"),
          processing_summary: fd.get("processing_summary"),
          high_risk_processing:
            fd.get("high_risk_processing") === "on",
          sensitive_data:
            fd.get("sensitive_data") === "on",
          cross_border:
            fd.get("cross_border") === "on",
          residual_risk: fd.get("residual_risk"),
        }),
      });
      setMessage("تم إنشاء DPIA كمسودة.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createGift(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/gifts-hospitality", {
        method: "POST",
        body: JSON.stringify({
          direction: fd.get("direction"),
          category: fd.get("category"),
          counterparty_name:
            fd.get("counterparty_name"),
          business_context:
            fd.get("business_context"),
          estimated_value:
            Number(fd.get("estimated_value") || 0),
          currency: "SAR",
          government_related:
            fd.get("government_related") === "on",
          conflict_indicated:
            fd.get("conflict_indicated") === "on",
          threshold_exceeded:
            fd.get("threshold_exceeded") === "on",
        }),
      });
      setMessage("تم تسجيل الهدية/الضيافة دون قبول أو تقديم تلقائي.");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createScreening(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    try {
      await api("/api/legal/third-party-screenings", {
        method: "POST",
        body: JSON.stringify({
          party_type: fd.get("party_type"),
          party_name: fd.get("party_name"),
          source_module:
            fd.get("source_module") || null,
          risk_level: fd.get("risk_level"),
        }),
      });
      setMessage("تم إنشاء سجل الفحص؛ لا يوجد Screening خارجي تلقائي.");
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
        fontFamily: "Arial,Segoe UI,sans-serif",
      }}
    >
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",padding:24,borderRadius:18}}>
          <h1 style={{marginTop:0}}>Legal · Privacy & Integrity</h1>
          <p>
            طلبات الخصوصية، مشاركة البيانات، DPIA، الهدايا والضيافة،
            وفحص نزاهة الأطراف الثالثة. لا يوجد إفصاح أو حذف أو تحويل
            بيانات أو Screening خارجي أو التزام مالي تلقائي.
          </p>
          <div style={{display:"flex",gap:12}}>
            <a href="/legal" style={{color:"white"}}>Legal</a>
            <a href="/" style={{color:"white"}}>الرئيسية</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Privacy: {summary?.privacy_requests?.total ?? "—"} |
          Data Sharing: {summary?.data_sharing?.total ?? "—"} |
          DPIA: {summary?.dpias?.total ?? "—"} |
          Gifts: {summary?.gifts_hospitality?.total ?? "—"} |
          Screening: {summary?.third_party_screenings?.total ?? "—"} |
          Alerts: {alerts?.total ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Privacy Requests</h3>
          <form onSubmit={createPrivacy} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="request_type">
              <option value="access">Access</option>
              <option value="correction">Correction</option>
              <option value="deletion">Deletion</option>
              <option value="withdraw_consent">Withdraw Consent</option>
              <option value="restriction">Restriction</option>
              <option value="objection">Objection</option>
              <option value="other">Other</option>
            </select>
            <select name="subject_type">
              <option value="employee">Employee</option>
              <option value="candidate">Candidate</option>
              <option value="customer">Customer</option>
              <option value="contact">Contact</option>
              <option value="vendor_contact">Vendor Contact</option>
              <option value="other">Other</option>
            </select>
            <input name="subject_reference" placeholder="Reference (optional)" />
            <input name="received_date" type="date" required />
            <input name="due_date" type="date" required />
            <button>Register</button>
          </form>
          {privacy.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.request_type} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Personal Data Sharing</h3>
          <form onSubmit={createSharing} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="recipient_name" placeholder="Recipient" required />
            <input name="purpose" placeholder="Purpose" required />
            <input name="legal_basis" placeholder="Legal basis" required />
            <input name="data_categories" placeholder="Data categories" required />
            <select name="risk_level">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <label><input name="cross_border" type="checkbox" /> Cross-border</label>
            <label><input name="dpa_required" type="checkbox" /> DPA Required</label>
            <button>Create Draft</button>
          </form>
          {sharing.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.recipient_name} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>DPIA</h3>
          <form onSubmit={createDpia} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="title" placeholder="Title" required />
            <input name="owner" placeholder="Owner" required />
            <input name="trigger_reason" placeholder="Trigger" required />
            <input name="processing_summary" placeholder="Processing summary" required />
            <select name="residual_risk">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <label><input name="high_risk_processing" type="checkbox" /> High-risk</label>
            <label><input name="sensitive_data" type="checkbox" /> Sensitive data</label>
            <label><input name="cross_border" type="checkbox" /> Cross-border</label>
            <button>Create DPIA</button>
          </form>
          {dpias.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.title} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Gifts / Hospitality</h3>
          <form onSubmit={createGift} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="direction">
              <option value="received">Received</option>
              <option value="offered">Offered</option>
            </select>
            <select name="category">
              <option value="gift">Gift</option>
              <option value="hospitality">Hospitality</option>
              <option value="sponsorship">Sponsorship</option>
              <option value="travel">Travel</option>
              <option value="other">Other</option>
            </select>
            <input name="counterparty_name" placeholder="Counterparty" required />
            <input name="business_context" placeholder="Business context" required />
            <input name="estimated_value" type="number" min="0" step="0.01" placeholder="Value SAR" />
            <label><input name="government_related" type="checkbox" /> Government related</label>
            <label><input name="conflict_indicated" type="checkbox" /> Conflict</label>
            <label><input name="threshold_exceeded" type="checkbox" /> Threshold exceeded</label>
            <button>Register</button>
          </form>
          {gifts.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.category} · approval={String(x.requires_approval)} · {x.status}</p>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Third-Party Integrity Screening</h3>
          <form onSubmit={createScreening} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="party_type">
              <option value="vendor">Vendor</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="other">Other</option>
            </select>
            <input name="party_name" placeholder="Party name" required />
            <input name="source_module" placeholder="Source module (optional)" />
            <select name="risk_level">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button>Create Screening Record</button>
          </form>
          {screenings.map(x=><p key={x.id}><strong>{x.code}</strong> · {x.party_name} · {x.overall_result} · {x.status}</p>)}
        </section>
      </div>
    </main>
  );
}
