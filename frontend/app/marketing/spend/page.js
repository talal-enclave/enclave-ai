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

function money(value) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function MarketingSpendPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [budgetLines, setBudgetLines] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [procurement, setProcurement] = useState({
    purchase_requests: [],
    purchase_orders: [],
  });
  const [dashboard, setDashboard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [campaignId, setCampaignId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [prId, setPrId] = useState("");
  const [poId, setPoId] = useState("");
  const [file, setFile] = useState(null);

  async function load() {
    setError("");
    try {
      const [c, b, e, p, d, a] = await Promise.all([
        api("/api/marketing/campaigns"),
        api("/api/marketing/eligible-finance-budget-lines"),
        api("/api/marketing/eligible-finance-expenses"),
        api("/api/marketing/eligible-procurement"),
        api("/api/marketing/spend-dashboard"),
        api("/api/hr/attachments?module=marketing&status=active"),
      ]);
      setCampaigns(c);
      setBudgetLines(b);
      setExpenses(e);
      setProcurement(p);
      setDashboard(d);
      setAttachments(a);
      if (!campaignId && c.length) setCampaignId(c[0].id);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function allocateBudget(event) {
    event.preventDefault();
    try {
      await api(`/api/marketing/campaigns/${campaignId}/budget-allocations`, {
        method: "POST",
        body: JSON.stringify({
          finance_budget_line_id: budgetLineId,
          allocated_amount: Number(allocatedAmount),
          linked_by: "user",
        }),
      });
      setMessage("ØªÙ… Ø±Ø¨Ø· Ø¬Ø²Ø¡ Ù…Ù† Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù…Ø§Ù„ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ø§Ù„Ø­Ù…Ù„Ø© Ø¨Ø¯ÙˆÙ† ØªØ¹Ø¯ÙŠÙ„ Finance.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function linkExpense(event) {
    event.preventDefault();
    try {
      await api(`/api/marketing/campaigns/${campaignId}/finance-expenses/${expenseId}/link`, {
        method: "POST",
        body: JSON.stringify({linked_by:"user"}),
      });
      setMessage("ØªÙ… Ø±Ø¨Ø· Ø§Ù„Ù…ØµØ±ÙˆÙ Ø¨Ø§Ù„Ø­Ù…Ù„Ø©. Ø§Ù„Ù…ØµØ±ÙˆÙ Ù„Ø§ ÙŠØ¹Ø¯ Actual Ø¥Ù„Ø§ Ø¥Ø°Ø§ ÙƒØ§Ù† Posted ÙÙŠ Finance.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function linkPR(event) {
    event.preventDefault();
    try {
      await api(`/api/marketing/campaigns/${campaignId}/purchase-requests/${prId}/link`, {
        method: "POST",
        body: JSON.stringify({linked_by:"user"}),
      });
      setMessage("ØªÙ… Ø±Ø¨Ø· Purchase Request Ø¨Ø§Ù„Ø­Ù…Ù„Ø© Ø¨Ø¯ÙˆÙ† ØªØºÙŠÙŠØ± Ø­Ø§Ù„ØªÙ‡.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function linkPO(event) {
    event.preventDefault();
    try {
      await api(`/api/marketing/campaigns/${campaignId}/purchase-orders/${poId}/link`, {
        method: "POST",
        body: JSON.stringify({linked_by:"user"}),
      });
      setMessage("ØªÙ… Ø±Ø¨Ø· Purchase Order Ø¨Ø§Ù„Ø­Ù…Ù„Ø© Ø¨Ø¯ÙˆÙ† Ø¥ØµØ¯Ø§Ø±Ù‡ Ø£Ùˆ Ø¥Ø±Ø³Ø§Ù„Ù‡.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function uploadEvidence(event) {
    event.preventDefault();
    if (!file || !campaignId) return;

    const body = new FormData();
    body.append("module", "marketing");
    body.append("entity_type", "campaign");
    body.append("entity_id", campaignId);
    body.append("document_type", "campaign_evidence");
    body.append("uploaded_by", "user");
    body.append("confidentiality_level", "confidential");
    body.append("title", file.name);
    body.append("file", file);

    try {
      const response = await fetch("/api/hr/attachments/upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : JSON.stringify(data?.detail || data)
        );
      }
      setMessage("ØªÙ… Ø±ÙØ¹ Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø­Ù…Ù„Ø© Ø¥Ù„Ù‰ Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ù…ÙˆØ­Ø¯.");
      setFile(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <main style={{minHeight:"100vh",padding:24,background:"#06131e",color:"#f7fafc",fontFamily:"Arial,Segoe UI,sans-serif"}} dir="rtl">
      <div style={{maxWidth:1500,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",borderRadius:18,padding:24}}>
          <h1 style={{marginTop:0}}>Marketing Spend & Evidence</h1>
          <p style={{color:"#d9e7e6",lineHeight:1.7}}>
            Ø§Ù„Ø±Ø¨Ø· ÙÙ‚Ø· Ø¨ÙŠÙ† Marketing ÙˆFinance ÙˆProcurement. Ù„Ø§ Ø¥Ù†Ø´Ø§Ø¡ Ù…ØµØ±ÙˆÙØŒ
            Ù„Ø§ Ù‚ÙŠØ¯ØŒ Ù„Ø§ Ø·Ù„Ø¨ Ø´Ø±Ø§Ø¡ØŒ Ù„Ø§ Ø£Ù…Ø± Ø´Ø±Ø§Ø¡ØŒ Ù„Ø§ Ø¯ÙØ¹ØŒ ÙˆÙ„Ø§ Ø¥Ø±Ø³Ø§Ù„ Ø®Ø§Ø±Ø¬ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠ.
          </p>
          <div style={{display:"flex",gap:12}}>
            <a href="/marketing" style={{color:"white"}}>Marketing</a>
            <a href="/marketing/operations" style={{color:"white"}}>Operations</a>
            <a href="/finance" style={{color:"white"}}>Finance</a>
            <a href="/procurement" style={{color:"white"}}>Procurement</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Ø§Ù„Ø­Ù…Ù„Ø©</h3>
          <select value={campaignId} onChange={(e)=>setCampaignId(e.target.value)}>
            <option value="">Ø§Ø®ØªØ± Ø§Ù„Ø­Ù…Ù„Ø©</option>
            {campaigns.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Official Finance Budget Allocation</h3>
          <form onSubmit={allocateBudget} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={budgetLineId} onChange={(e)=>setBudgetLineId(e.target.value)} required>
              <option value="">Ø§Ø®ØªØ± Budget Line Ù…Ø¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ 650000</option>
              {budgetLines.map((x)=><option key={x.budget_line_id} value={x.budget_line_id}>
                {x.budget_name} / M{x.month} / Available {money(x.available_amount)}
              </option>)}
            </select>
            <input type="number" min="0.01" step="0.01" placeholder="Allocated amount" value={allocatedAmount} onChange={(e)=>setAllocatedAmount(e.target.value)} required />
            <button>Allocate</button>
          </form>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Finance Expense Link</h3>
          <form onSubmit={linkExpense} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={expenseId} onChange={(e)=>setExpenseId(e.target.value)} required>
              <option value="">Ø§Ø®ØªØ± Ù…ØµØ±ÙˆÙ 650000</option>
              {expenses.map((x)=><option key={x.id} value={x.id}>
                {x.description} / {money(x.total_amount)} / {x.status}
              </option>)}
            </select>
            <button>Link Expense</button>
          </form>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Procurement Links</h3>
          <form onSubmit={linkPR} style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            <select value={prId} onChange={(e)=>setPrId(e.target.value)} required>
              <option value="">Purchase Request</option>
              {(procurement.purchase_requests || []).map((x)=><option key={x.id} value={x.id}>
                {x.request_number} / {money(x.marketing_account_amount)} / {x.status}
              </option>)}
            </select>
            <button>Link PR</button>
          </form>

          <form onSubmit={linkPO} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={poId} onChange={(e)=>setPoId(e.target.value)} required>
              <option value="">Purchase Order</option>
              {(procurement.purchase_orders || []).map((x)=><option key={x.id} value={x.id}>
                {x.po_number} / {money(x.marketing_account_amount)} / {x.status}
              </option>)}
            </select>
            <button>Link PO</button>
          </form>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Campaign Evidence / Assets</h3>
          <form onSubmit={uploadEvidence} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} required />
            <button>Upload Evidence</button>
          </form>
          <p>Active marketing attachments: {attachments.length}</p>
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginTop:16}}>
          <h3>Spend Dashboard</h3>
          {(dashboard?.campaigns || []).map((row)=>(
            <div key={row.campaign_id} style={{borderTop:"1px solid #eee",padding:"12px 0"}}>
              <strong>{row.campaign_name}</strong><br/>
              Internal Plan: {money(row.internal_planned_budget)} |
              Official Allocation: {money(row.official_finance_budget_allocated)} |
              Posted Actual: {money(row.posted_actual_spend)} |
              Unposted Expense: {money(row.linked_unposted_expenses)} |
              PR: {money(row.linked_purchase_request_amount)} |
              PO: {money(row.linked_purchase_order_amount)} |
              Assets: {row.active_campaign_assets}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
