"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function MarketingOperationsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [content, setContent] = useState([]);
  const [bindings, setBindings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const [metricForm, setMetricForm] = useState({
    campaign_id: "",
    snapshot_date: today,
    impressions: "",
    clicks: "",
    engagements: "",
    website_sessions: "",
    inquiries: "",
    source_reference: "",
  });

  async function load() {
    setError("");
    try {
      const [c, i, b, s, d] = await Promise.all([
        api("/api/marketing/campaigns"),
        api("/api/marketing/content"),
        api("/api/marketing/approval-bindings"),
        api("/api/marketing/performance-snapshots"),
        api("/api/marketing/performance-dashboard"),
      ]);
      setCampaigns(c);
      setContent(i);
      setBindings(b);
      setSnapshots(s);
      setDashboard(d);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  const bindingMap = useMemo(
    () => Object.fromEntries(
      bindings.map((x) => [`${x.entity_type}:${x.entity_id}`, x])
    ),
    [bindings]
  );

  async function requestCampaignApproval(id) {
    try {
      await api(`/api/marketing/campaigns/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({requested_by:"user"}),
      });
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ Ù„Ù„Ø­Ù…Ù„Ø©.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function activateCampaign(id) {
    try {
      await api(`/api/marketing/campaigns/${id}/activate`, {
        method: "POST",
      });
      setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ù…Ù„Ø© Ø¯Ø§Ø®Ù„ÙŠÙ‹Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function requestContentApproval(id) {
    try {
      await api(`/api/marketing/content/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({requested_by:"user"}),
      });
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ Ù„Ù„Ù…Ø­ØªÙˆÙ‰.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function authorizeContent(id) {
    try {
      await api(`/api/marketing/content/${id}/authorize`, {
        method: "POST",
      });
      setMessage("ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¯Ø§Ø®Ù„ÙŠÙ‹Ø§. Ù„Ù… ÙŠØªÙ… Ù†Ø´Ø±Ù‡.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function createSnapshot(event) {
    event.preventDefault();
    try {
      await api("/api/marketing/performance-snapshots", {
        method: "POST",
        body: JSON.stringify({
          ...metricForm,
          impressions: Number(metricForm.impressions || 0),
          clicks: Number(metricForm.clicks || 0),
          engagements: Number(metricForm.engagements || 0),
          website_sessions: Number(metricForm.website_sessions || 0),
          inquiries: Number(metricForm.inquiries || 0),
        }),
      });
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Snapshot Ø¨Ø£Ø¯Ù„Ø© Ø§Ù„Ù…ØµØ¯Ø±.");
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <main style={{minHeight:"100vh",padding:24,background:"#06131e",color:"#f7fafc",fontFamily:"Arial,Segoe UI,sans-serif"}} dir="rtl">
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",borderRadius:18,padding:24}}>
          <h1 style={{marginTop:0}}>Marketing Operations</h1>
          <p style={{color:"#d9e7e6",lineHeight:1.7}}>
            Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø­Ù…Ù„Ø§Øª ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ØŒ ÙˆØªØ³Ø¬ÙŠÙ„ Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡ Ù…Ù† Ù…ØµØ§Ø¯Ø± Ù…ÙˆØ«Ù‚Ø©.
            Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ù„Ø§ ÙŠÙ†Ø´Ø± ÙˆÙ„Ø§ ÙŠØµØ±Ù ÙˆÙ„Ø§ ÙŠÙ†ÙØ° Ø£ÙŠ Ø¥Ø¬Ø±Ø§Ø¡ Ø®Ø§Ø±Ø¬ÙŠ.
          </p>
          <a href="/marketing" style={{color:"white"}}>Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Marketing</a>
        <div style={{marginTop:10}}><a href="/marketing/spend" style={{color:"white"}}>Spend & Evidence</a></div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Campaign Governance</h3>
          {campaigns.map((row) => {
            const b = bindingMap[`campaign:${row.id}`];
            return (
              <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
                <strong>{row.name}</strong> â€” {row.status} â€” {b?.approval_status || "no approval"}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>requestCampaignApproval(row.id)}>Request Approval</button>
                  <button onClick={()=>activateCampaign(row.id)}>Activate</button>
                </div>
              </div>
            );
          })}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Content Governance</h3>
          {content.map((row) => {
            const b = bindingMap[`content:${row.id}`];
            return (
              <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
                <strong>{row.title}</strong> â€” {row.status} â€” {b?.approval_status || "no approval"}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>requestContentApproval(row.id)}>Request Approval</button>
                  <button onClick={()=>authorizeContent(row.id)}>Authorize</button>
                </div>
              </div>
            );
          })}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Performance Snapshot</h3>
          <form onSubmit={createSnapshot} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
            <select value={metricForm.campaign_id} onChange={(e)=>setMetricForm({...metricForm,campaign_id:e.target.value})} required>
              <option value="">Ø§Ø®ØªØ± Ø§Ù„Ø­Ù…Ù„Ø©</option>
              {campaigns.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <input type="date" value={metricForm.snapshot_date} onChange={(e)=>setMetricForm({...metricForm,snapshot_date:e.target.value})} required />
            <input type="number" min="0" placeholder="Impressions" value={metricForm.impressions} onChange={(e)=>setMetricForm({...metricForm,impressions:e.target.value})} />
            <input type="number" min="0" placeholder="Clicks" value={metricForm.clicks} onChange={(e)=>setMetricForm({...metricForm,clicks:e.target.value})} />
            <input type="number" min="0" placeholder="Engagements" value={metricForm.engagements} onChange={(e)=>setMetricForm({...metricForm,engagements:e.target.value})} />
            <input type="number" min="0" placeholder="Website Sessions" value={metricForm.website_sessions} onChange={(e)=>setMetricForm({...metricForm,website_sessions:e.target.value})} />
            <input type="number" min="0" placeholder="Inquiries" value={metricForm.inquiries} onChange={(e)=>setMetricForm({...metricForm,inquiries:e.target.value})} />
            <input placeholder="Source reference / report URL or evidence ID" value={metricForm.source_reference} onChange={(e)=>setMetricForm({...metricForm,source_reference:e.target.value})} required />
            <button>Save Snapshot</button>
          </form>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Performance Dashboard</h3>
          {(dashboard?.campaigns || []).map((row)=>(
            <div key={row.campaign_id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
              <strong>{row.campaign_name}</strong><br/>
              Impressions: {row.impressions} | Clicks: {row.clicks} | CTR: {row.ctr_pct}% |
              Engagement: {row.engagement_rate_pct}% | Leads: {row.attributed_leads} |
              Qualified: {row.qualified_leads} | Converted: {row.converted_leads}
            </div>
          ))}
          <p>Snapshots: {snapshots.length}</p>
        </section>
      </div>
    </main>
  );
}
