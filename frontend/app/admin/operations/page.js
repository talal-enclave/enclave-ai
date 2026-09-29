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

export default function AdminOperationsPage() {
  const [facilities, setFacilities] = useState([]);
  const [leases, setLeases] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [f,l,i,r,b,a,s] = await Promise.all([
        api("/api/admin/facilities"),
        api("/api/admin/leases"),
        api("/api/admin/insurance-authorizations"),
        api("/api/admin/resources"),
        api("/api/admin/bookings"),
        api("/api/admin/alerts"),
        api("/api/admin/phase1b-summary"),
      ]);
      setFacilities(f); setLeases(l); setInsurance(i);
      setResources(r); setBookings(b); setAlerts(a); setSummary(s);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function simplePost(path, body, msg) {
    try {
      await api(path, { method: "POST", body: JSON.stringify(body || {}) });
      setMessage(msg);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function addLease(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await simplePost("/api/admin/leases", {
      facility_id: fd.get("facility_id"),
      counterparty_name: fd.get("counterparty_name"),
      start_date: fd.get("start_date"),
      end_date: fd.get("end_date"),
      annual_value: Number(fd.get("annual_value") || 0),
      currency: "SAR",
    }, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø³ÙˆØ¯Ø© Ø§Ù„Ù…Ù‚Ø± Ø¨Ø¯ÙˆÙ† ØªÙˆÙ‚ÙŠØ¹ Ø£Ùˆ Ø¯ÙØ¹.");
    e.currentTarget.reset();
  }

  async function addInsurance(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await simplePost("/api/admin/insurance-authorizations", {
      insurance_type: fd.get("insurance_type"),
      insurer_name: fd.get("insurer_name") || null,
      coverage_summary: fd.get("coverage_summary"),
      proposed_premium: Number(fd.get("proposed_premium") || 0),
      currency: "SAR",
      effective_date: fd.get("effective_date") || null,
      expiry_date: fd.get("expiry_date") || null,
    }, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø³ÙˆØ¯Ø© Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø¨Ø¯ÙˆÙ† Ø´Ø±Ø§Ø¡ Ø£Ùˆ Ø¯ÙØ¹.");
    e.currentTarget.reset();
  }

  async function addResource(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await simplePost("/api/admin/resources", {
      facility_id: fd.get("facility_id") || null,
      name: fd.get("name"),
      resource_type: fd.get("resource_type"),
      capacity: fd.get("capacity") ? Number(fd.get("capacity")) : null,
    }, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…ÙˆØ±Ø¯ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ.");
    e.currentTarget.reset();
  }

  async function addBooking(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await simplePost("/api/admin/bookings", {
      resource_id: fd.get("resource_id"),
      title: fd.get("title"),
      booked_by: "user",
      start_at: new Date(fd.get("start_at")).toISOString(),
      end_at: new Date(fd.get("end_at")).toISOString(),
    }, "ØªÙ… Ø§Ù„Ø­Ø¬Ø² Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ø¨Ø¹Ø¯ ÙØ­Øµ Ø§Ù„ØªØ¹Ø§Ø±Ø¶.");
    e.currentTarget.reset();
  }

  return (
    <main dir="rtl" style={{minHeight:"100vh",padding:24,background:"#06131e",fontFamily:"Arial,Segoe UI,sans-serif"}}>
      <div style={{maxWidth:1400,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",padding:24,borderRadius:18}}>
          <h1 style={{marginTop:0}}>Admin Operations</h1>
          <p>Ø§Ù„Ù…Ù‚Ø±ØŒ ØªØ£Ù…ÙŠÙ† Ø§Ù„Ø´Ø±ÙƒØ©ØŒ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ ÙˆØ§Ù„Ø­Ø¬ÙˆØ²Ø§Øª. Ø§Ù„Ù†Ø¸Ø§Ù… Ù„Ø§ ÙŠÙˆÙ‚Ø¹ ÙˆÙ„Ø§ ÙŠØ´ØªØ±ÙŠ ÙˆÙ„Ø§ ÙŠØ¯ÙØ¹ ÙˆÙ„Ø§ ÙŠØ±Ø³Ù„ Ø®Ø§Ø±Ø¬ÙŠÙ‹Ø§.</p>
          <a href="/admin" style={{color:"white"}}>Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Admin</a>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>Leases: {summary?.leases?.total ?? "â€”"} | Insurance: {summary?.company_insurance?.total ?? "â€”"} | Resources: {summary?.resources?.total ?? "â€”"} | Bookings: {summary?.bookings?.reserved ?? "â€”"} | Alerts: {alerts?.total ?? "â€”"}</p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Premises / Lease</h3>
          <form onSubmit={addLease} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="facility_id" required><option value="">Ø§Ù„Ù…Ø±ÙÙ‚</option>{facilities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <input name="counterparty_name" placeholder="Ø§Ù„Ø·Ø±Ù Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„" required />
            <input name="start_date" type="date" required />
            <input name="end_date" type="date" required />
            <input name="annual_value" type="number" min="0" step="0.01" placeholder="Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ø³Ù†ÙˆÙŠØ©" />
            <button>Ø¥Ù†Ø´Ø§Ø¡ Draft</button>
          </form>
          {leases.map(row=><div key={row.id}><strong>{row.code}</strong> Â· {row.counterparty_name} Â· {row.status}</div>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Company Insurance</h3>
          <form onSubmit={addInsurance} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="insurance_type"><option value="general_liability">General Liability</option><option value="property">Property</option><option value="cyber">Cyber</option><option value="professional_indemnity">Professional Indemnity</option><option value="other">Other</option></select>
            <input name="insurer_name" placeholder="Ø´Ø±ÙƒØ© Ø§Ù„ØªØ£Ù…ÙŠÙ†" />
            <input name="coverage_summary" placeholder="Ù…Ù„Ø®Øµ Ø§Ù„ØªØºØ·ÙŠØ©" required />
            <input name="proposed_premium" type="number" min="0" step="0.01" placeholder="Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ù…Ù‚ØªØ±Ø­" />
            <input name="effective_date" type="date" />
            <input name="expiry_date" type="date" />
            <button>Ø¥Ù†Ø´Ø§Ø¡ Draft</button>
          </form>
          {insurance.map(row=><div key={row.id}><strong>{row.code}</strong> Â· {row.insurance_type} Â· {row.status}</div>)}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Shared Resources & Bookings</h3>
          <form onSubmit={addResource} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="facility_id"><option value="">Ø¨Ø¯ÙˆÙ† Ù…Ø±ÙÙ‚</option>{facilities.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <input name="name" placeholder="Ø§Ø³Ù… Ø§Ù„Ù…ÙˆØ±Ø¯" required />
            <select name="resource_type"><option value="meeting_room">Meeting Room</option><option value="parking">Parking</option><option value="vehicle">Vehicle</option><option value="shared_space">Shared Space</option><option value="equipment">Equipment</option><option value="other">Other</option></select>
            <input name="capacity" type="number" min="1" placeholder="Ø§Ù„Ø³Ø¹Ø©" />
            <button>Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ±Ø¯</button>
          </form>

          <form onSubmit={addBooking} style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
            <select name="resource_id" required><option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ±Ø¯</option>{resources.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <input name="title" placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø­Ø¬Ø²" required />
            <input name="start_at" type="datetime-local" required />
            <input name="end_at" type="datetime-local" required />
            <button>Ø­Ø¬Ø²</button>
          </form>

          {bookings.map(row=><div key={row.id}><strong>{row.code}</strong> Â· {row.title} Â· {row.status}</div>)}
        </section>
      </div>
    </main>
  );
}
