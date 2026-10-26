"use client";

import { useEffect, useState } from "react";

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || `HTTP ${response.status}`);
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

export default function CommercialFinancePage() {
  const [data, setData] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [tab, setTab] = useState("proposals");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [proposal, setProposal] = useState({
    opportunity_id: "",
    description: "",
    quantity: "1",
    unit_price: "",
    direct_cost: "0",
    discount_amount: "0",
    validity_date: "",
    payment_terms: "",
    scope_summary: "",
    notes: "",
  });

  const [schedule, setSchedule] = useState({
    opportunity_id: "",
    quotation_id: "",
    label: "",
    issue_date: "",
    due_date: "",
    amount_ex_vat: "",
    notes: "",
  });

  async function load() {
    try {
      setError("");
      const [dashboard, opps] = await Promise.all([
        api("/api/commercial-finance/dashboard"),
        api("/api/sales/opportunities"),
      ]);
      setData(dashboard);
      setOpportunities(opps);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const quotations = data?.quotations || [];
  const schedules = data?.billing_schedule || [];
  const invoices = data?.invoices || [];
  const alerts = data?.alerts || [];

  async function createProposal(event) {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      await api("/api/commercial-finance/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: proposal.opportunity_id,
          discount_amount: Number(proposal.discount_amount || 0),
          validity_date: proposal.validity_date || null,
          payment_terms: proposal.payment_terms || null,
          scope_summary: proposal.scope_summary || null,
          notes: proposal.notes || null,
          lines: [
            {
              description: proposal.description,
              quantity: Number(proposal.quantity || 1),
              unit_price: Number(proposal.unit_price || 0),
              direct_cost: Number(proposal.direct_cost || 0),
            },
          ],
        }),
      });
      setMessage("Financial proposal saved as draft.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestQuoteApproval(id) {
    try {
      setError("");
      await api(`/api/sales/quotations/${id}/request-approval`, {
        method: "POST",
      });
      setMessage("Quotation approval requested.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function activateQuote(id) {
    try {
      setError("");
      await api(`/api/sales/quotations/${id}/activate`, {
        method: "POST",
      });
      setMessage("Quotation activated.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createSchedule(event) {
    event.preventDefault();
    try {
      setError("");
      await api("/api/commercial-finance/billing-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedule,
          amount_ex_vat: Number(schedule.amount_ex_vat || 0),
        }),
      });
      setMessage("Billing schedule item created.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function syncInvoices() {
    try {
      setError("");
      const result = await api(
        "/api/commercial-finance/invoice-sync",
        { method: "POST" }
      );
      setMessage(
        `Invoice check complete: prepared ${result.created.length}, ` +
        `blocked ${result.blocked.length}.`
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function issueInvoice(id) {
    try {
      setError("");
      await api(`/api/commercial-finance/invoices/${id}/issue`, {
        method: "POST",
      });
      setMessage(
        "Invoice issued inside Enclave. No external send was performed."
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function recordCollection(id) {
    const amount = window.prompt("Collected amount (SAR)");
    if (!amount) return;

    const reference = window.prompt(
      "Collection evidence/reference"
    );
    if (!reference) return;

    try {
      setError("");
      await api(
        `/api/commercial-finance/invoices/${id}/record-collection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            evidence_reference: reference,
          }),
        }
      );
      setMessage("Collection recorded with evidence.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="cf">
      <section className="hero">
        <div>
          <div className="eyebrow">COMMERCIAL FINANCE</div>
          <h1>العروض المالية · الفوترة · التحصيل</h1>
          <p>
            الواجهة اليومية للمالية. لا تعرض دليل الحسابات أو القيود أو
            التسويات البنكية. إصدار الفاتورة يحتاج اعتماد، ولا يوجد إرسال
            تلقائي للعميل أو ترحيل محاسبي تلقائي.
          </p>
        </div>
        <div className="heroLinks">
          <a href="/">CEO Agent</a>
          <a href="/sales">Sales</a>
          <a href="/operations">Command Center</a>
          <button onClick={syncInvoices}>Run Invoice Check</button>
        </div>
      </section>

      {error ? <div className="notice error">{error}</div> : null}
      {message ? <div className="notice ok">{message}</div> : null}

      <nav>
        {[
          ["proposals", "Financial Proposals"],
          ["schedule", "Billing Schedule"],
          ["invoices", "Invoices"],
          ["collections", "Collections"],
          ["alerts", "Alerts"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "proposals" ? (
        <>
          <section className="panel">
            <h2>New Financial Proposal</h2>
            <form className="form" onSubmit={createProposal}>
              <select
                required
                value={proposal.opportunity_id}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    opportunity_id: e.target.value,
                  })
                }
              >
                <option value="">Opportunity</option>
                {opportunities.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} — {row.name}
                  </option>
                ))}
              </select>

              <input
                required
                placeholder="Service / line description"
                value={proposal.description}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    description: e.target.value,
                  })
                }
              />

              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price"
                value={proposal.unit_price}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    unit_price: e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Direct cost"
                value={proposal.direct_cost}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    direct_cost: e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Discount"
                value={proposal.discount_amount}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    discount_amount: e.target.value,
                  })
                }
              />

              <input
                type="date"
                value={proposal.validity_date}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    validity_date: e.target.value,
                  })
                }
              />

              <input
                placeholder="Payment terms"
                value={proposal.payment_terms}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    payment_terms: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Scope summary"
                value={proposal.scope_summary}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    scope_summary: e.target.value,
                  })
                }
              />

              <button>Save Draft Proposal</button>
            </form>
          </section>

          <section className="panel">
            <h2>Financial Proposals</h2>
            {quotations.length === 0 ? (
              <p>No financial proposals yet.</p>
            ) : (
              quotations.map((row) => (
                <div className="row" key={row.id}>
                  <div>
                    <strong>
                      {row.company_name} · v{row.version}
                    </strong>
                    <small>
                      {row.external_quote_number || "No external number"}
                      {" · "}
                      {row.validity_date || "No validity date"}
                    </small>
                  </div>
                  <span>{money(row.net_revenue_ex_vat)}</span>
                  <span>{row.status}</span>
                  <div className="actions">
                    {["draft", "rejected"].includes(row.status) ? (
                      <button
                        onClick={() => requestQuoteApproval(row.id)}
                      >
                        Request Approval
                      </button>
                    ) : null}
                    {row.status === "pending_approval" ? (
                      <button onClick={() => activateQuote(row.id)}>
                        Activate after Approval
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      ) : null}

      {tab === "schedule" ? (
        <>
          <section className="panel">
            <h2>Billing Schedule</h2>
            <form className="form" onSubmit={createSchedule}>
              <select
                required
                value={schedule.opportunity_id}
                onChange={(e) =>
                  setSchedule({
                    ...schedule,
                    opportunity_id: e.target.value,
                    quotation_id: "",
                  })
                }
              >
                <option value="">Opportunity</option>
                {opportunities.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} — {row.name}
                  </option>
                ))}
              </select>

              <select
                required
                value={schedule.quotation_id}
                onChange={(e) =>
                  setSchedule({
                    ...schedule,
                    quotation_id: e.target.value,
                  })
                }
              >
                <option value="">Quotation</option>
                {quotations
                  .filter(
                    (row) =>
                      row.opportunity_id === schedule.opportunity_id
                  )
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      v{row.version} · {row.status} ·{" "}
                      {money(row.net_revenue_ex_vat)}
                    </option>
                  ))}
              </select>

              <input
                required
                placeholder="Advance / Q1 / Final..."
                value={schedule.label}
                onChange={(e) =>
                  setSchedule({
                    ...schedule,
                    label: e.target.value,
                  })
                }
              />

              <label>
                Invoice issue date
                <input
                  required
                  type="date"
                  value={schedule.issue_date}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      issue_date: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Payment due date
                <input
                  required
                  type="date"
                  value={schedule.due_date}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      due_date: e.target.value,
                    })
                  }
                />
              </label>

              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount ex VAT"
                value={schedule.amount_ex_vat}
                onChange={(e) =>
                  setSchedule({
                    ...schedule,
                    amount_ex_vat: e.target.value,
                  })
                }
              />

              <button>Add Billing Item</button>
            </form>
          </section>

          <section className="panel">
            {schedules.length === 0 ? (
              <p>No billing schedule items yet.</p>
            ) : (
              schedules.map((row) => (
                <div className="row" key={row.id}>
                  <div>
                    <strong>
                      {row.company_name} · {row.label}
                    </strong>
                    <small>
                      Issue {row.issue_date} · Due {row.due_date}
                    </small>
                  </div>
                  <span>{money(row.amount_ex_vat)}</span>
                  <span>{row.status}</span>
                  <span>
                    {row.invoice_id ? "Invoice prepared" : "Waiting"}
                  </span>
                </div>
              ))
            )}
          </section>
        </>
      ) : null}

      {tab === "invoices" ? (
        <section className="panel">
          <h2>Invoices</h2>
          {invoices.length === 0 ? (
            <p>No invoices yet.</p>
          ) : (
            invoices.map((row) => (
              <div className="row" key={row.id}>
                <div>
                  <strong>{row.invoice_number}</strong>
                  <small>
                    {row.customer_name} · Issue {row.issue_date} · Due{" "}
                    {row.due_date}
                  </small>
                </div>
                <span>{money(row.total_amount)}</span>
                <span>
                  {row.status}
                  {row.approval_status
                    ? ` · approval ${row.approval_status}`
                    : ""}
                </span>
                <div className="actions">
                  {row.status === "ready_for_approval" &&
                  row.approval_status === "approved" ? (
                    <button onClick={() => issueInvoice(row.id)}>
                      Issue
                    </button>
                  ) : null}
                  <a
                    href={`/finance/invoices/${row.id}/print`}
                    target="_blank"
                  >
                    Print
                  </a>
                  {row.status === "ready_for_approval" ? (
                    <a href="/">Open Approvals</a>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === "collections" ? (
        <section className="panel">
          <h2>Collections</h2>
          {invoices
            .filter((row) =>
              ["issued", "partially_collected", "collected"].includes(
                row.status
              )
            )
            .map((row) => (
              <div className="row" key={row.id}>
                <div>
                  <strong>{row.invoice_number}</strong>
                  <small>{row.customer_name}</small>
                </div>
                <span>
                  {money(row.collected_amount)} /{" "}
                  {money(row.total_amount)}
                </span>
                <span>{row.status}</span>
                <button onClick={() => recordCollection(row.id)}>
                  Record Collection
                </button>
              </div>
            ))}
        </section>
      ) : null}

      {tab === "alerts" ? (
        <section className="panel">
          <h2>Alerts</h2>
          {alerts.length === 0 ? (
            <p>No commercial finance alerts.</p>
          ) : (
            alerts.map((row, index) => (
              <div
                className={`alert ${row.severity}`}
                key={`${row.type}-${index}`}
              >
                <strong>{row.type}</strong>
                <span>
                  {row.company_name ||
                    row.customer_name ||
                    row.invoice_number}
                </span>
                <span>
                  {row.issue_date ||
                    row.due_date ||
                    row.validity_date}
                </span>
              </div>
            ))
          )}
        </section>
      ) : null}

      <style jsx>{`
        .cf{max-width:1500px;margin:0 auto;padding:28px;color:#d9e7e6}
        .hero,.panel{border:1px solid rgba(113,200,193,.2);background:rgba(11,29,45,.93);border-radius:16px}
        .hero{padding:24px;display:flex;justify-content:space-between;gap:20px}
        .eyebrow{color:#71c8c1;font-size:11px;letter-spacing:.14em;font-weight:800}
        h1,h2{color:white}.heroLinks,nav,.actions{display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start}
        a,button{border:1px solid rgba(113,200,193,.3);background:#071823;color:white;border-radius:9px;padding:8px 11px;text-decoration:none;cursor:pointer}
        nav{margin:14px 0}nav .active{border-color:#18d5b7}.panel{padding:18px;margin-bottom:14px}
        .form{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        input,select,textarea{width:100%;box-sizing:border-box;background:#06131e;border:1px solid rgba(113,200,193,.25);border-radius:9px;color:white;padding:9px}
        .row{display:grid;grid-template-columns:1.8fr 160px 190px 1fr;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(113,200,193,.1)}
        small{display:block;color:#8dacaa;margin-top:4px}.alert{display:grid;grid-template-columns:190px 1fr 180px;gap:10px;padding:10px;border-bottom:1px solid rgba(113,200,193,.1)}
        .critical{border-left:3px solid #ff6b6b}.high{border-left:3px solid #ffb454}
        .notice{margin:10px 0;padding:10px;border-radius:9px}.error{border:1px solid #a55}.ok{border:1px solid #18d5b7}
        @media(max-width:900px){.hero{flex-direction:column}.form,.row,.alert{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
