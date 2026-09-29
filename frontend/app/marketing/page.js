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

function money(value) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function MarketingPage() {
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [content, setContent] = useState([]);
  const [attributions, setAttributions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    objective: "",
    channel: "",
    owner_name: "",
    start_date: today,
    end_date: "",
    planned_budget: "",
    audience_summary: "",
  });

  const [contentForm, setContentForm] = useState({
    campaign_id: "",
    title: "",
    content_type: "post",
    channel: "",
    owner_name: "",
    planned_publish_at: "",
    draft_text: "",
  });

  const [attributionForm, setAttributionForm] = useState({
    lead_id: "",
    campaign_id: "",
    touch_type: "first_touch",
    channel: "",
    source: "",
    is_primary: true,
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
  });

  async function load() {
    setError("");
    try {
      const [s, c, i, a, l] = await Promise.all([
        api("/api/marketing/summary"),
        api("/api/marketing/campaigns"),
        api("/api/marketing/content"),
        api("/api/marketing/attributions"),
        api("/api/sales/leads"),
      ]);
      setSummary(s);
      setCampaigns(c);
      setContent(i);
      setAttributions(a);
      setLeads(l);
    } catch (err) {
      setError(err.message || "Unable to load Marketing");
    }
  }

  useEffect(() => { load(); }, []);

  const campaignMap = useMemo(
    () => Object.fromEntries(campaigns.map((x) => [x.id, x])),
    [campaigns]
  );

  const leadMap = useMemo(
    () => Object.fromEntries(leads.map((x) => [x.id, x])),
    [leads]
  );

  async function createCampaign(event) {
    event.preventDefault();
    try {
      await api("/api/marketing/campaigns", {
        method: "POST",
        body: JSON.stringify({
          ...campaignForm,
          owner_name: campaignForm.owner_name || null,
          end_date: campaignForm.end_date || null,
          planned_budget: Number(campaignForm.planned_budget || 0),
          audience_summary: campaignForm.audience_summary || null,
        }),
      });
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ù…Ù„Ø© ÙƒÙ…Ø³ÙˆØ¯Ø© Ø¯Ø§Ø®Ù„ÙŠØ© Ø¨Ø¯ÙˆÙ† ØµØ±Ù Ø£Ùˆ Ø¥Ø¬Ø±Ø§Ø¡ Ø®Ø§Ø±Ø¬ÙŠ.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function createContent(event) {
    event.preventDefault();
    try {
      await api("/api/marketing/content", {
        method: "POST",
        body: JSON.stringify({
          ...contentForm,
          campaign_id: contentForm.campaign_id || null,
          owner_name: contentForm.owner_name || null,
          planned_publish_at: contentForm.planned_publish_at
            ? new Date(contentForm.planned_publish_at).toISOString()
            : null,
          draft_text: contentForm.draft_text || null,
        }),
      });
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ÙƒÙ…Ø³ÙˆØ¯Ø©. Ø§Ù„Ù†Ø¸Ø§Ù… Ù„Ø§ ÙŠÙ†Ø´Ø± Ø®Ø§Ø±Ø¬ÙŠÙ‹Ø§.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function createAttribution(event) {
    event.preventDefault();
    try {
      await api("/api/marketing/attributions", {
        method: "POST",
        body: JSON.stringify({
          ...attributionForm,
          campaign_id: attributionForm.campaign_id || null,
          utm_source: attributionForm.utm_source || null,
          utm_medium: attributionForm.utm_medium || null,
          utm_campaign: attributionForm.utm_campaign || null,
        }),
      });
      setMessage("ØªÙ… Ø±Ø¨Ø· Ù…ØµØ¯Ø± Ø§Ù„ØªØ³ÙˆÙŠÙ‚ Ø¨Ø§Ù„Ù€Lead Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Sales Ø¨Ø¯ÙˆÙ† Ø¥Ù†Ø´Ø§Ø¡ Lead Ø£Ùˆ Opportunity ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.");
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <main style={{minHeight:"100vh",padding:24,background:"#06131e",color:"#f7fafc",fontFamily:"Arial,Segoe UI,sans-serif"}} dir="rtl">
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",borderRadius:18,padding:24}}>
          <h1 style={{marginTop:0}}>Marketing Agent</h1>
          <p style={{color:"#d9e7e6",lineHeight:1.7}}>
            Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø­Ù…Ù„Ø§ØªØŒ ØªÙ‚ÙˆÙŠÙ… Ø§Ù„Ù…Ø­ØªÙˆÙ‰ØŒ ÙˆØ±Ø¨Ø· Ù…ØµØ§Ø¯Ø± Ø§Ù„ØªØ³ÙˆÙŠÙ‚ Ø¨Ø§Ù„Ù€Leads Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ Sales.
            Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø±Ø­Ù„Ø© ØªØ®Ø·ÙŠØ· ÙˆØªØªØ¨Ø¹ Ø¯Ø§Ø®Ù„ÙŠ ÙÙ‚Ø·Ø› Ù„Ø§ Ù†Ø´Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠ ÙˆÙ„Ø§ Ø±Ø³Ø§Ø¦Ù„ Ø®Ø§Ø±Ø¬ÙŠØ© ÙˆÙ„Ø§ ØµØ±Ù Ù…Ø§Ù„ÙŠ.
          </p>
          <div style={{display:"flex",gap:10}}>
            <a href="/marketing/operations" style={{color:"white"}}>Operations</a>
            <a href="/sales" style={{color:"white"}}>Sales CRM</a>
            <a href="/" style={{color:"white"}}>Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</a>
          </div>
        </section>

        <p style={{background:"#332b17",padding:12,borderRadius:10}}>
          Published Ù‡Ù†Ø§ ÙŠØ¹Ù†ÙŠ ØªÙˆØ«ÙŠÙ‚ Ù†Ø´Ø± ØªÙ… Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø¹ Ù…Ø±Ø¬Ø¹ Ø®Ø§Ø±Ø¬ÙŠØ› Ø§Ù„Ù†Ø¸Ø§Ù… Ù†ÙØ³Ù‡ Ù„Ø§ ÙŠÙ†Ø´Ø± ÙˆÙ„Ø§ ÙŠØ±Ø³Ù„ ÙˆÙ„Ø§ ÙŠØµØ±Ù.
        </p>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,margin:"16px 0"}}>
          {[
            ["Ø§Ù„Ø­Ù…Ù„Ø§Øª", summary?.campaigns?.total],
            ["Ø§Ù„Ù†Ø´Ø·Ø©", summary?.campaigns?.active],
            ["Planned Budget", money(summary?.campaigns?.planned_budget)],
            ["Ø§Ù„Ù…Ø­ØªÙˆÙ‰", summary?.content?.total],
            ["Attributed Leads", summary?.attribution?.unique_leads],
          ].map(([label,value]) => (
            <div key={label} style={{background:"#0b1d2d",padding:15,borderRadius:14,border:"1px solid #234a57"}}>
              <div style={{fontSize:11,color:"#8fb8b6"}}>{label}</div>
              <div style={{fontSize:23,fontWeight:900,marginTop:6}}>{value ?? "â€”"}</div>
            </div>
          ))}
        </div>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Ø­Ù…Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©</h3>
          <form onSubmit={createCampaign} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>
            <input placeholder="Ø§Ø³Ù… Ø§Ù„Ø­Ù…Ù„Ø©" value={campaignForm.name} onChange={(e)=>setCampaignForm({...campaignForm,name:e.target.value})} required />
            <input placeholder="Ø§Ù„Ù‡Ø¯Ù" value={campaignForm.objective} onChange={(e)=>setCampaignForm({...campaignForm,objective:e.target.value})} required />
            <input placeholder="Ø§Ù„Ù‚Ù†Ø§Ø©" value={campaignForm.channel} onChange={(e)=>setCampaignForm({...campaignForm,channel:e.target.value})} required />
            <input placeholder="Ø§Ù„Ù…Ø§Ù„Ùƒ" value={campaignForm.owner_name} onChange={(e)=>setCampaignForm({...campaignForm,owner_name:e.target.value})} />
            <input type="date" value={campaignForm.start_date} onChange={(e)=>setCampaignForm({...campaignForm,start_date:e.target.value})} />
            <input type="date" value={campaignForm.end_date} onChange={(e)=>setCampaignForm({...campaignForm,end_date:e.target.value})} />
            <input type="number" min="0" step="0.01" placeholder="Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù…Ø®Ø·Ø·Ø©" value={campaignForm.planned_budget} onChange={(e)=>setCampaignForm({...campaignForm,planned_budget:e.target.value})} />
            <input placeholder="Ø§Ù„Ø¬Ù…Ù‡ÙˆØ± Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù" value={campaignForm.audience_summary} onChange={(e)=>setCampaignForm({...campaignForm,audience_summary:e.target.value})} />
            <button>Ø¥Ù†Ø´Ø§Ø¡ Draft</button>
          </form>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Content Calendar</h3>
          <form onSubmit={createContent} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>
            <select value={contentForm.campaign_id} onChange={(e)=>setContentForm({...contentForm,campaign_id:e.target.value})}>
              <option value="">Ø¨Ø¯ÙˆÙ† Ø­Ù…Ù„Ø©</option>
              {campaigns.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <input placeholder="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" value={contentForm.title} onChange={(e)=>setContentForm({...contentForm,title:e.target.value})} required />
            <input placeholder="Ù†ÙˆØ¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰" value={contentForm.content_type} onChange={(e)=>setContentForm({...contentForm,content_type:e.target.value})} required />
            <input placeholder="Ø§Ù„Ù‚Ù†Ø§Ø©" value={contentForm.channel} onChange={(e)=>setContentForm({...contentForm,channel:e.target.value})} required />
            <input placeholder="Ø§Ù„Ù…Ø§Ù„Ùƒ" value={contentForm.owner_name} onChange={(e)=>setContentForm({...contentForm,owner_name:e.target.value})} />
            <input type="datetime-local" value={contentForm.planned_publish_at} onChange={(e)=>setContentForm({...contentForm,planned_publish_at:e.target.value})} />
            <input placeholder="Ù…Ø³ÙˆØ¯Ø© Ø§Ù„Ù†Øµ" value={contentForm.draft_text} onChange={(e)=>setContentForm({...contentForm,draft_text:e.target.value})} />
            <button>Ø¥Ø¶Ø§ÙØ© Draft</button>
          </form>

          <div style={{overflow:"auto",marginTop:14}}>
            <table style={{width:"100%",minWidth:800,borderCollapse:"collapse"}}>
              <thead><tr><th>Ø§Ù„Ù…Ø­ØªÙˆÙ‰</th><th>Ø§Ù„Ø­Ù…Ù„Ø©</th><th>Ø§Ù„Ù‚Ù†Ø§Ø©</th><th>Ø§Ù„ÙˆÙ‚Øª</th><th>Ø§Ù„Ø­Ø§Ù„Ø©</th></tr></thead>
              <tbody>
                {content.map((row)=>(
                  <tr key={row.id}>
                    <td>{row.title}<br/>{row.content_type}</td>
                    <td>{campaignMap[row.campaign_id]?.name || "â€”"}</td>
                    <td>{row.channel}</td>
                    <td>{row.planned_publish_at || "â€”"}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Lead Attribution</h3>
          {leads.length === 0 ? (
            <p>Ù„Ø§ ØªÙˆØ¬Ø¯ Leads ÙÙŠ Production Ø­Ø§Ù„ÙŠÙ‹Ø§. Marketing Agent Ù„Ù† ÙŠÙ†Ø´Ø¦ Lead ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.</p>
          ) : (
            <form onSubmit={createAttribution} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>
              <select value={attributionForm.lead_id} onChange={(e)=>setAttributionForm({...attributionForm,lead_id:e.target.value})} required>
                <option value="">Ø§Ø®ØªØ± Lead</option>
                {leads.map((x)=><option key={x.id} value={x.id}>{x.code} - {x.company_name}</option>)}
              </select>
              <select value={attributionForm.campaign_id} onChange={(e)=>setAttributionForm({...attributionForm,campaign_id:e.target.value})}>
                <option value="">Ø¨Ø¯ÙˆÙ† Ø­Ù…Ù„Ø©</option>
                {campaigns.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <select value={attributionForm.touch_type} onChange={(e)=>setAttributionForm({...attributionForm,touch_type:e.target.value})}>
                <option value="first_touch">First Touch</option>
                <option value="influenced">Influenced</option>
                <option value="last_touch">Last Touch</option>
              </select>
              <input placeholder="Ø§Ù„Ù‚Ù†Ø§Ø©" value={attributionForm.channel} onChange={(e)=>setAttributionForm({...attributionForm,channel:e.target.value})} required />
              <input placeholder="Ø§Ù„Ù…ØµØ¯Ø±" value={attributionForm.source} onChange={(e)=>setAttributionForm({...attributionForm,source:e.target.value})} required />
              <input placeholder="utm_source" value={attributionForm.utm_source} onChange={(e)=>setAttributionForm({...attributionForm,utm_source:e.target.value})} />
              <input placeholder="utm_medium" value={attributionForm.utm_medium} onChange={(e)=>setAttributionForm({...attributionForm,utm_medium:e.target.value})} />
              <input placeholder="utm_campaign" value={attributionForm.utm_campaign} onChange={(e)=>setAttributionForm({...attributionForm,utm_campaign:e.target.value})} />
              <button>Ø±Ø¨Ø· Ø§Ù„Ù…ØµØ¯Ø±</button>
            </form>
          )}

          <div style={{overflow:"auto",marginTop:14}}>
            <table style={{width:"100%",minWidth:800,borderCollapse:"collapse"}}>
              <thead><tr><th>Lead</th><th>Ø§Ù„Ø­Ù…Ù„Ø©</th><th>Touch</th><th>Ø§Ù„Ù‚Ù†Ø§Ø©</th><th>Ø§Ù„Ù…ØµØ¯Ø±</th><th>Primary</th></tr></thead>
              <tbody>
                {attributions.map((row)=>(
                  <tr key={row.id}>
                    <td>{leadMap[row.lead_id]?.code || row.lead_id}</td>
                    <td>{campaignMap[row.campaign_id]?.name || "â€”"}</td>
                    <td>{row.touch_type}</td>
                    <td>{row.channel}</td>
                    <td>{row.source}</td>
                    <td>{row.is_primary ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
