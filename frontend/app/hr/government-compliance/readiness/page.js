"use client";

import { useEffect, useMemo, useState } from "react";

const P = {
  critical: { label: "CRITICAL", border: "#ff6b6b", bg: "rgba(255,107,107,.12)" },
  high: { label: "HIGH", border: "#ffb454", bg: "rgba(255,180,84,.12)" },
  normal: { label: "NORMAL", border: "#18D5B7", bg: "rgba(24,213,183,.10)" },
  low: { label: "LOW", border: "#71C8C1", bg: "rgba(113,200,193,.08)" },
};

function fmtDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function statusLabel(value) {
  if (!value) return "Unknown";
  return String(value).replaceAll("_", " ").toUpperCase();
}

export default function PreOperationalReadinessPage() {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hr/government-compliance/readiness", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Unable to load readiness register");
      }

      setRows(Array.isArray(data) ? data : []);

      const next = {};
      for (const row of Array.isArray(data) ? data : []) {
        next[row.id] = {
          readiness_priority: row.readiness_priority || "normal",
          responsible_owner: row.responsible_owner || "",
          action_due_date: row.action_due_date || "",
          readiness_notes: row.readiness_notes || "",
        };
      }
      setDrafts(next);
    } catch (err) {
      setError(err?.message || "Unable to load readiness register");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const needsAction = rows.filter((x) => x.needs_action).length;
    const urgent = rows.filter((x) =>
      ["critical", "high"].includes(x.effective_priority)
    ).length;
    const withEvidence = rows.filter((x) => Number(x.evidence_count || 0) > 0).length;
    const expiring90 = rows.filter((x) => {
      const d = x.days_remaining;
      return typeof d === "number" && d >= 0 && d <= 90;
    }).length;

    return { needsAction, urgent, withEvidence, expiring90 };
  }, [rows]);

  function setDraft(id, key, value) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  }

  async function save(row) {
    const draft = drafts[row.id] || {};
    setSaving(row.id);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/hr/government-compliance/readiness/${row.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            readiness_priority: draft.readiness_priority || "normal",
            responsible_owner: draft.responsible_owner || null,
            action_due_date: draft.action_due_date || null,
            readiness_notes: draft.readiness_notes || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Unable to update readiness item");
      }

      setMessage(`${row.record_type} readiness item updated.`);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to update readiness item");
    } finally {
      setSaving("");
    }
  }

  return (
    <main className="readiness">
      <section className="hero">
        <div>
          <div className="eyebrow">COMPANY CONTROL · PRE-OPERATIONAL READINESS</div>
          <h1>Government & Corporate Readiness Register</h1>
          <p>
            One operational view for current registrations, missing setup,
            owners, priorities, target dates, evidence and expiry risk.
          </p>
          <p className="rule">
            Expiry priority is automatic: 31–90 days = HIGH · 0–30 days or
            expired = CRITICAL. Blank action due dates are intentional until a
            real deadline is confirmed.
          </p>
        </div>
        <div className="heroActions">
          <a href="/hr/government-compliance">Government Compliance</a>
          <a href="/hr/calendar">HR Calendar</a>
          <a href="/hr">HR Office</a>
          <button onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>Needs Action</span>
          <strong>{summary.needsAction}</strong>
        </div>
        <div className="metric">
          <span>High / Critical</span>
          <strong>{summary.urgent}</strong>
        </div>
        <div className="metric">
          <span>Expiry ≤ 90 Days</span>
          <strong>{summary.expiring90}</strong>
        </div>
        <div className="metric">
          <span>Records With Evidence</span>
          <strong>
            {summary.withEvidence}/{rows.length || 0}
          </strong>
        </div>
      </section>

      {error ? <div className="notice error">{error}</div> : null}
      {message ? <div className="notice ok">{message}</div> : null}

      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Readiness Items</h2>
            <p>
              Source status remains authoritative in Government Compliance.
              This register adds owner, manual priority, target date and
              readiness notes without inventing deadlines.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading readiness register…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No readiness records found.</div>
        ) : (
          <div className="grid">
            {rows.map((row) => {
              const draft = drafts[row.id] || {};
              const visual = P[row.effective_priority] || P.normal;

              return (
                <article
                  className={`item ${row.needs_action ? "needsAction" : ""}`}
                  key={row.id}
                >
                  <div className="itemTop">
                    <div>
                      <div className="recordType">{row.record_type}</div>
                      <div className="authority">
                        {row.issuing_authority || "Authority not specified"}
                      </div>
                    </div>

                    <div
                      className="priority"
                      style={{
                        borderColor: visual.border,
                        background: visual.bg,
                      }}
                    >
                      {visual.label}
                    </div>
                  </div>

                  <div className="statusRow">
                    <span className="status">
                      {statusLabel(row.runtime_status || row.status)}
                    </span>
                    {row.needs_action ? (
                      <span className="actionFlag">NEEDS ACTION</span>
                    ) : (
                      <span className="completeFlag">CURRENT</span>
                    )}
                  </div>

                  <div className="facts">
                    <div>
                      <span>Document / Registration No.</span>
                      <strong>{row.document_number || "—"}</strong>
                    </div>
                    <div>
                      <span>Expiry</span>
                      <strong>{fmtDate(row.expiry_date)}</strong>
                    </div>
                    <div>
                      <span>Days Remaining</span>
                      <strong>
                        {typeof row.days_remaining === "number"
                          ? row.days_remaining
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Evidence</span>
                      <strong>{row.evidence_count || 0}</strong>
                    </div>
                  </div>

                  {Array.isArray(row.evidence) && row.evidence.length ? (
                    <div className="evidence">
                      {row.evidence.map((ev) => (
                        <a
                          key={ev.id}
                          href={ev.download_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {ev.title || ev.original_file_name || "Open evidence"}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="noEvidence">
                      No linked evidence document
                    </div>
                  )}

                  <div className="editor">
                    <label>
                      <span>Manual Priority</span>
                      <select
                        value={draft.readiness_priority || "normal"}
                        onChange={(e) =>
                          setDraft(
                            row.id,
                            "readiness_priority",
                            e.target.value
                          )
                        }
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </label>

                    <label>
                      <span>Responsible Owner</span>
                      <input
                        value={draft.responsible_owner || ""}
                        placeholder="Unassigned"
                        onChange={(e) =>
                          setDraft(
                            row.id,
                            "responsible_owner",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Action Due Date</span>
                      <input
                        type="date"
                        value={draft.action_due_date || ""}
                        onChange={(e) =>
                          setDraft(row.id, "action_due_date", e.target.value)
                        }
                      />
                    </label>

                    <label className="wide">
                      <span>Readiness Notes</span>
                      <textarea
                        rows={3}
                        value={draft.readiness_notes || ""}
                        placeholder="Add operational notes only when confirmed."
                        onChange={(e) =>
                          setDraft(row.id, "readiness_notes", e.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="foot">
                    <div>
                      Effective priority source:{" "}
                      <strong>{row.priority_source || "manual"}</strong>
                    </div>
                    <button
                      onClick={() => save(row)}
                      disabled={saving === row.id}
                    >
                      {saving === row.id ? "Saving…" : "Save Readiness"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .readiness { max-width:1580px; margin:0 auto; padding:28px; color:#d9e7e6; }
        .hero { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; padding:26px; border:1px solid rgba(113,200,193,.24); border-radius:22px; background:linear-gradient(135deg,rgba(11,29,45,.98),rgba(15,76,92,.44)); box-shadow:0 18px 45px rgba(0,0,0,.18); }
        .eyebrow { color:#71c8c1; font-size:12px; letter-spacing:.13em; font-weight:800; }
        h1 { color:white; margin:8px 0; font-size:clamp(28px,3vw,44px); }
        .hero p { max-width:900px; margin:7px 0; color:#b7cdcc; line-height:1.6; }
        .rule { color:#d9e7e6 !important; }
        .heroActions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; min-width:320px; }
        a,button,input,select,textarea { font:inherit; }
        .heroActions a,button { border:1px solid rgba(113,200,193,.34); background:rgba(6,19,30,.76); color:white; border-radius:10px; padding:9px 12px; text-decoration:none; cursor:pointer; }
        .heroActions a:hover,button:hover { border-color:#18d5b7; }
        .metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin:16px 0; }
        .metric,.panel,.item { border:1px solid rgba(113,200,193,.2); background:rgba(11,29,45,.88); border-radius:16px; }
        .metric { padding:17px; }
        .metric span { display:block; color:#91afae; font-size:12px; }
        .metric strong { display:block; margin-top:7px; color:white; font-size:27px; }
        .panel { padding:18px; }
        .panelHead { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:14px; }
        .panel h2 { margin:0 0 5px; color:white; }
        .panel p { margin:0; color:#91afae; }
        .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .item { padding:16px; background:rgba(6,19,30,.56); }
        .item.needsAction { border-color:rgba(255,180,84,.34); }
        .itemTop,.statusRow,.foot { display:flex; justify-content:space-between; gap:12px; align-items:center; }
        .recordType { font-size:18px; color:white; font-weight:800; }
        .authority { color:#91afae; font-size:12px; margin-top:3px; }
        .priority { border:1px solid; border-radius:999px; padding:6px 9px; font-size:11px; font-weight:900; letter-spacing:.07em; }
        .statusRow { justify-content:flex-start; margin:14px 0; }
        .status,.actionFlag,.completeFlag { border-radius:999px; padding:5px 9px; font-size:11px; font-weight:800; }
        .status { background:rgba(113,200,193,.12); color:#d9e7e6; }
        .actionFlag { background:rgba(255,180,84,.12); color:#ffd093; }
        .completeFlag { background:rgba(24,213,183,.12); color:#78ecd9; }
        .facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-bottom:12px; }
        .facts>div { padding:9px; background:rgba(20,43,61,.54); border-radius:10px; }
        .facts span { display:block; color:#7fa09f; font-size:10px; margin-bottom:4px; }
        .facts strong { color:#d9e7e6; font-size:12px; word-break:break-word; }
        .evidence,.noEvidence { padding:10px; border-radius:10px; background:rgba(20,43,61,.38); margin-bottom:12px; }
        .evidence { display:flex; flex-wrap:wrap; gap:8px; }
        .evidence a { color:#71c8c1; }
        .noEvidence { color:#7f9298; font-size:12px; }
        .editor { display:grid; grid-template-columns:1fr 1.4fr 1fr; gap:10px; }
        label span { display:block; color:#91afae; font-size:11px; margin:0 0 5px 2px; }
        input,select,textarea { width:100%; box-sizing:border-box; border:1px solid rgba(113,200,193,.22); border-radius:9px; background:#06131e; color:white; padding:9px 10px; outline:none; }
        input:focus,select:focus,textarea:focus { border-color:#18d5b7; }
        .wide { grid-column:1/-1; }
        .foot { margin-top:12px; padding-top:12px; border-top:1px solid rgba(113,200,193,.12); color:#7fa09f; font-size:11px; }
        .notice { padding:11px 14px; border-radius:10px; margin:12px 0; }
        .error { background:rgba(255,107,107,.1); border:1px solid rgba(255,107,107,.4); }
        .ok { background:rgba(24,213,183,.1); border:1px solid rgba(24,213,183,.35); }
        .empty { padding:30px; text-align:center; color:#91afae; }
        @media (max-width:1000px) { .hero{flex-direction:column}.heroActions{min-width:0;justify-content:flex-start}.metrics,.grid{grid-template-columns:1fr 1fr}.facts{grid-template-columns:1fr 1fr} }
        @media (max-width:680px) { .readiness{padding:14px}.metrics,.grid,.editor{grid-template-columns:1fr}.wide{grid-column:auto} }
      `}</style>
    </main>
  );
}
