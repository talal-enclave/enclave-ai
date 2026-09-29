"use client";

import { useEffect, useMemo, useState } from "react";

const C = {
  bg: "#06131e",
  panel: "#0b1d2d",
  soft: "#142b3d",
  primary: "#18d5b7",
  text: "#f7fafc",
  muted: "#71c8c1",
  border: "rgba(255,255,255,.09)",
  danger: "#ff6b6b",
  warning: "#f5c96b",
  blue: "#72b7ff",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  background: C.soft,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "11px 12px",
  outline: "none",
};

const label = {
  display: "block",
  color: C.muted,
  fontSize: 12,
  marginBottom: 6,
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function Badge({ children }) {
  const status = String(children || "").toLowerCase();

  const style =
    status === "paid"
      ? { color: C.primary, background: "rgba(24,213,183,.10)" }
      : status === "approved"
      ? { color: C.blue, background: "rgba(114,183,255,.10)" }
      : status === "draft"
      ? { color: C.warning, background: "rgba(245,201,107,.10)" }
      : { color: C.muted, background: "rgba(255,255,255,.05)" };

  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        textTransform: "capitalize",
      }}
    >
      {children || "—"}
    </span>
  );
}

function Breakdown({ settlement }) {
  if (!settlement) return null;

  const rows = [
    ["EOSB", settlement.eosb_amount],
    ["Salary Due", settlement.salary_due_amount],
    ["Leave Encashment", settlement.leave_encashment_amount],
    ["Notice Compensation", settlement.notice_compensation_amount],
    ["Article 77 Compensation", settlement.article_77_compensation_amount],
    ["Other Entitlements", settlement.other_entitlements],
  ];

  return (
    <div
      style={{
        background: C.soft,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <h4 style={{ marginTop: 0 }}>Settlement Breakdown</h4>

      <div style={{ display: "grid", gap: 9 }}>
        {rows.map(([name, value]) => (
          <div
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 15,
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: 8,
            }}
          >
            <span style={{ color: C.muted }}>{name}</span>
            <strong>{money(value)} SAR</strong>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
            paddingTop: 4,
          }}
        >
          <span style={{ color: C.danger }}>Deductions</span>
          <strong style={{ color: C.danger }}>
            - {money(settlement.deductions)} SAR
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
            marginTop: 8,
            padding: 13,
            background: C.panel,
            borderRadius: 10,
          }}
        >
          <span style={{ fontWeight: 800 }}>Net Final Settlement</span>
          <strong
            style={{
              color: C.primary,
              fontSize: 20,
            }}
          >
            {money(settlement.net_settlement)} SAR
          </strong>
        </div>
      </div>
    </div>
  );
}

export default function FinalSettlementPage() {
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    employee_id: "",
    contract_id: "",
    last_working_day: "",
    termination_initiator: "employer",
    termination_reason: "employer_termination",
    salary_paid_through: "",
    article_77_applies: false,
    article_77_contractual_amount: "",
    notice_compensation_amount: "0",
    other_entitlements: "0",
    deductions: "0",
    calculation_notes: "",
  });

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || `Request failed: ${response.status}`);
    }

    return data;
  }

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [e, c, s] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/contracts"),
        api("/api/hr/final-settlements"),
      ]);

      setEmployees(Array.isArray(e) ? e : []);
      setContracts(Array.isArray(c) ? c : []);
      setSettlements(Array.isArray(s) ? s : []);
    } catch (err) {
      setError(err?.message || "Unable to load Final Settlement data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const employeeContracts = useMemo(
    () =>
      contracts.filter(
        (row) => row.employee_id === form.employee_id
      ),
    [contracts, form.employee_id]
  );

  const selectedContract = useMemo(
    () =>
      contracts.find((row) => row.id === form.contract_id) || null,
    [contracts, form.contract_id]
  );

  function employeeName(row) {
    if (!row) return "Unknown employee";

    const name =
      row.full_name_ar ||
      row.full_name_en ||
      "Unnamed employee";

    return row.employee_number
      ? `${name} — ${row.employee_number}`
      : name;
  }

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((row) => [row.id, employeeName(row)])
      ),
    [employees]
  );

  async function createSettlement(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.employee_id) {
        throw new Error("Select an employee");
      }

      if (!form.contract_id) {
        throw new Error("Select an employment contract");
      }

      if (!form.last_working_day) {
        throw new Error("Last Working Day is required");
      }

      await api("/api/hr/final-settlements", {
        method: "POST",
        body: JSON.stringify({
          employee_id: form.employee_id,
          contract_id: form.contract_id,
          last_working_day: form.last_working_day,
          termination_initiator: form.termination_initiator,
          termination_reason: form.termination_reason,
          salary_paid_through: form.salary_paid_through || null,
          article_77_applies: form.article_77_applies,
          article_77_contractual_amount:
            form.article_77_applies &&
            form.article_77_contractual_amount !== ""
              ? Number(form.article_77_contractual_amount)
              : null,
          notice_compensation_amount: Number(
            form.notice_compensation_amount || 0
          ),
          other_entitlements: Number(form.other_entitlements || 0),
          deductions: Number(form.deductions || 0),
          calculation_notes:
            form.calculation_notes.trim() || null,
        }),
      });

      setMessage("Final Settlement calculated successfully.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to calculate Final Settlement");
    } finally {
      setSaving(false);
    }
  }

  async function approveSettlement(id) {
    const approvedBy = window.prompt(
      "Approved By / اسم المعتمد:",
      "HR"
    );

    if (approvedBy === null) return;

    try {
      setSaving(true);
      setError("");

      await api(`/api/hr/final-settlements/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({
          approved_by: approvedBy.trim() || "HR",
          approval_note: null,
        }),
      });

      setMessage("Final Settlement approved.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to approve settlement");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(id) {
    const reference = window.prompt(
      "Payment Reference / مرجع السداد:"
    );

    if (reference === null) return;

    try {
      setSaving(true);
      setError("");

      await api(`/api/hr/final-settlements/${id}/paid`, {
        method: "PUT",
        body: JSON.stringify({
          payment_reference: reference.trim() || null,
        }),
      });

      setMessage("Final Settlement marked as paid.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to mark settlement as paid");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        padding: 28,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1550, margin: "0 auto" }}>
        <div style={{ marginBottom: 25 }}>
          <a
            href="/hr"
            style={{
              color: C.muted,
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            ← HR Workspace
          </a>

          <h1 style={{ margin: "13px 0 5px", fontSize: 31 }}>
            EOSB / Final Settlement
          </h1>

          <div style={{ color: C.muted }}>
            مكافأة نهاية الخدمة والمخالصة النهائية
          </div>
        </div>

        <div
          style={{
            padding: 14,
            marginBottom: 20,
            borderRadius: 12,
            background: "rgba(24,213,183,.05)",
            border: `1px solid ${C.border}`,
            color: C.muted,
            lineHeight: 1.7,
          }}
        >
          Annual leave payable is recalculated only through the
          employee&apos;s actual <strong>Last Working Day</strong>.
          The front-loaded 30-day annual balance is not automatically
          treated as fully payable on termination.
          <br />
          <span dir="rtl">
            رصيد الإجازة في المخالصة يُحسب حتى آخر يوم عمل الفعلي فقط.
          </span>
        </div>

        {error ? (
          <div
            style={{
              padding: 13,
              marginBottom: 15,
              borderRadius: 10,
              color: C.danger,
              background: "rgba(255,107,107,.08)",
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              padding: 13,
              marginBottom: 15,
              borderRadius: 10,
              color: C.primary,
              background: "rgba(24,213,183,.08)",
            }}
          >
            {message}
          </div>
        ) : null}

        <form
          onSubmit={createSettlement}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Create Final Settlement</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Employee</label>
              <select
                style={input}
                value={form.employee_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employee_id: e.target.value,
                    contract_id: "",
                  })
                }
              >
                <option value="">Select employee...</option>

                {employees.map((row) => (
                  <option key={row.id} value={row.id}>
                    {employeeName(row)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Employment Contract</label>
              <select
                style={input}
                value={form.contract_id}
                disabled={!form.employee_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contract_id: e.target.value,
                  })
                }
              >
                <option value="">Select contract...</option>

                {employeeContracts.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.contract_number || "Contract"} —{" "}
                    {fmtDate(row.start_date)} — {row.contract_type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Last Working Day</label>
              <input
                style={input}
                type="date"
                value={form.last_working_day}
                onChange={(e) =>
                  setForm({
                    ...form,
                    last_working_day: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>Termination Initiator</label>
              <select
                style={input}
                value={form.termination_initiator}
                onChange={(e) =>
                  setForm({
                    ...form,
                    termination_initiator: e.target.value,
                  })
                }
              >
                <option value="employer">Employer</option>
                <option value="employee">Employee</option>
                <option value="mutual">Mutual</option>
              </select>
            </div>

            <div>
              <label style={label}>Termination Reason</label>
              <select
                style={input}
                value={form.termination_reason}
                onChange={(e) =>
                  setForm({
                    ...form,
                    termination_reason: e.target.value,
                  })
                }
              >
                <option value="employer_termination">
                  Employer Termination
                </option>
                <option value="resignation">Resignation</option>
                <option value="article_80">Article 80</option>
                <option value="article_81">Article 81</option>
                <option value="contract_expiry">Contract Expiry</option>
                <option value="mutual">Mutual Agreement</option>
                <option value="force_majeure">Force Majeure</option>
                <option value="retirement">Retirement</option>
                <option value="death">Death</option>
                <option value="unlawful_termination">
                  Unlawful Termination
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={label}>Salary Paid Through</label>
              <input
                style={input}
                type="date"
                value={form.salary_paid_through}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salary_paid_through: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {selectedContract ? (
            <div
              style={{
                marginTop: 15,
                padding: 14,
                background: C.soft,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}
            >
              <strong>Contract Salary Snapshot</strong>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px,1fr))",
                  gap: 10,
                  marginTop: 10,
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                <div>
                  Basic: {money(selectedContract.basic_salary)} SAR
                </div>
                <div>
                  Housing: {money(selectedContract.housing_allowance)} SAR
                </div>
                <div>
                  Transport: {money(selectedContract.transport_allowance)} SAR
                </div>
                <div>
                  Other Fixed:{" "}
                  {money(selectedContract.other_fixed_allowances)} SAR
                </div>
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px,1fr))",
              gap: 12,
              marginTop: 15,
            }}
          >
            <div>
              <label style={label}>Notice Compensation</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.01"
                value={form.notice_compensation_amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notice_compensation_amount: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>Other Entitlements</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.01"
                value={form.other_entitlements}
                onChange={(e) =>
                  setForm({
                    ...form,
                    other_entitlements: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>Deductions</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.01"
                value={form.deductions}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deductions: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div style={{ marginTop: 15 }}>
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: C.warning,
              }}
            >
              <input
                type="checkbox"
                checked={form.article_77_applies}
                onChange={(e) =>
                  setForm({
                    ...form,
                    article_77_applies: e.target.checked,
                  })
                }
              />
              Article 77 compensation applies
            </label>
          </div>

          {form.article_77_applies ? (
            <div style={{ marginTop: 12, maxWidth: 400 }}>
              <label style={label}>
                Contractual Article 77 Amount
              </label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave blank for statutory calculation"
                value={form.article_77_contractual_amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    article_77_contractual_amount: e.target.value,
                  })
                }
              />
            </div>
          ) : null}

          <div style={{ marginTop: 15 }}>
            <label style={label}>Calculation Notes</label>
            <textarea
              style={{
                ...input,
                minHeight: 75,
                resize: "vertical",
              }}
              value={form.calculation_notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  calculation_notes: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            style={{
              marginTop: 16,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Calculate Final Settlement
          </button>
        </form>

        <div style={{ display: "grid", gap: 18 }}>
          {settlements.length === 0 ? (
            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 35,
                textAlign: "center",
                color: C.muted,
              }}
            >
              No Final Settlements yet — لا توجد مخالفات نهائية حتى الآن
            </div>
          ) : (
            settlements.map((row) => (
              <section
                key={row.id}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 15,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {employeeMap[row.employee_id] || row.employee_id}
                    </h3>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 13,
                        marginTop: 6,
                      }}
                    >
                      {fmtDate(row.service_start_date)} →{" "}
                      {fmtDate(row.last_working_day)}
                      {" • "}
                      {row.termination_reason}
                    </div>
                  </div>

                  <Badge>{row.status}</Badge>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px,1fr))",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ background: C.soft, padding: 12, borderRadius: 10 }}>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      EOSB
                    </div>
                    <strong>{money(row.eosb_amount)} SAR</strong>
                  </div>

                  <div style={{ background: C.soft, padding: 12, borderRadius: 10 }}>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      Leave Payable
                    </div>
                    <strong>
                      {money(row.leave_payable_days)} days
                    </strong>
                  </div>

                  <div style={{ background: C.soft, padding: 12, borderRadius: 10 }}>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      Leave Encashment
                    </div>
                    <strong>
                      {money(row.leave_encashment_amount)} SAR
                    </strong>
                  </div>

                  <div style={{ background: C.soft, padding: 12, borderRadius: 10 }}>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      Statutory Due Date
                    </div>
                    <strong>{fmtDate(row.statutory_due_date)}</strong>
                  </div>
                </div>

                <Breakdown settlement={row} />

                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    flexWrap: "wrap",
                    marginTop: 15,
                  }}
                >
                  {row.status === "draft" ? (
                    <button
                      disabled={saving}
                      onClick={() => approveSettlement(row.id)}
                      style={{
                        background: C.primary,
                        color: "#04100b",
                        border: 0,
                        borderRadius: 9,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Approve Settlement
                    </button>
                  ) : null}

                  {row.status === "approved" ? (
                    <button
                      disabled={saving}
                      onClick={() => markPaid(row.id)}
                      style={{
                        background: C.blue,
                        color: "#04100b",
                        border: 0,
                        borderRadius: 9,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Mark as Paid
                    </button>
                  ) : null}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
