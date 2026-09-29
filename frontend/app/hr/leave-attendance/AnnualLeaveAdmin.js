"use client";

import { useEffect, useMemo, useState } from "react";

const C = {
  panel: "#09131a",
  soft: "#0d1a22",
  primary: "#55e6a5",
  text: "#f4f7f9",
  muted: "#8fa1ad",
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

function num(value) {
  return Number(value || 0).toFixed(2);
}

export default function AnnualLeaveAdmin({
  employees = [],
  leaveTypes = [],
  onChanged,
}) {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(String(currentYear));
  const [fromYear, setFromYear] = useState(
    String(currentYear)
  );

  const [balances, setBalances] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [overrideForm, setOverrideForm] = useState({
    employee_id: "",
    approved_carry_days: "",
    reason: "",
    approved_by: "",
    approval_reference: "",
    notes: "",
  });

  const annualType = useMemo(
    () =>
      leaveTypes.find(
        (row) =>
          String(row.code || "").toUpperCase() ===
          "ANNUAL"
      ),
    [leaveTypes]
  );

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((row) => [
          row.id,
          employeeName(row),
        ])
      ),
    [employees]
  );

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
      throw new Error(
        data?.detail ||
          `Request failed: ${response.status}`
      );
    }

    return data;
  }

  async function load() {
    try {
      setError("");

      const [balanceData, exceptionData] =
        await Promise.all([
          api(
            `/api/hr/leave/balances?year=${encodeURIComponent(
              year
            )}`
          ),
          api(
            "/api/hr/leave/carry-forward/exceptions"
          ),
        ]);

      setBalances(
        Array.isArray(balanceData)
          ? balanceData
          : []
      );

      setExceptions(
        Array.isArray(exceptionData)
          ? exceptionData
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load annual leave data"
      );
    }
  }

  useEffect(() => {
    load();
  }, [year]);

  async function initializeYear() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const result = await api(
        "/api/hr/leave/annual-initialize",
        {
          method: "POST",
          body: JSON.stringify({
            year: Number(year),
            leave_type_code: "ANNUAL",
          }),
        }
      );

      setMessage(
        `Annual leave initialized for ${year}. Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}.`
      );

      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to initialize annual leave"
      );
    } finally {
      setSaving(false);
    }
  }

  async function processCarryForward() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const result = await api(
        "/api/hr/leave/year-end-carry-forward",
        {
          method: "POST",
          body: JSON.stringify({
            from_year: Number(fromYear),
            leave_type_code: "ANNUAL",
          }),
        }
      );

      setMessage(
        `Year-end carry forward completed: ${result.from_year} → ${result.to_year}. Processed: ${result.processed}. Standard limit: 10 days.`
      );

      setYear(String(Number(fromYear) + 1));

      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to process carry forward"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createExceptionalCarryForward(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!annualType) {
        throw new Error(
          "ANNUAL leave type is not configured"
        );
      }

      if (!overrideForm.employee_id) {
        throw new Error(
          "Select an employee first"
        );
      }

      if (
        Number(
          overrideForm.approved_carry_days || 0
        ) <= 10
      ) {
        throw new Error(
          "Exceptional carry forward must be greater than 10 days"
        );
      }

      if (!overrideForm.reason.trim()) {
        throw new Error(
          "Reason is required"
        );
      }

      if (!overrideForm.approved_by.trim()) {
        throw new Error(
          "Approved By is required"
        );
      }

      await api(
        "/api/hr/leave/carry-forward/exception",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id:
              overrideForm.employee_id,
            leave_type_id: annualType.id,
            from_year: Number(fromYear),
            approved_carry_days: Number(
              overrideForm.approved_carry_days
            ),
            reason:
              overrideForm.reason.trim(),
            approved_by:
              overrideForm.approved_by.trim(),
            approval_reference:
              overrideForm.approval_reference.trim() ||
              null,
            notes:
              overrideForm.notes.trim() || null,
          }),
        }
      );

      setOverrideForm({
        employee_id: "",
        approved_carry_days: "",
        reason: "",
        approved_by: "",
        approval_reference: "",
        notes: "",
      });

      setMessage(
        "Exceptional carry forward saved successfully."
      );

      setYear(String(Number(fromYear) + 1));

      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save exceptional carry forward"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 20,
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Annual Leave Administration
      </h3>

      <div
        style={{
          color: C.muted,
          fontSize: 13,
          marginBottom: 18,
        }}
      >
        إدارة الاستحقاق السنوي والترحيل
      </div>

      <div
        style={{
          padding: 13,
          borderRadius: 11,
          marginBottom: 18,
          color: C.muted,
          background: C.soft,
          border: `1px solid ${C.border}`,
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: C.primary }}>
          Annual Leave Policy:
        </strong>{" "}
        30 days per year. New hires are
        prorated from their actual employment
        start date. Standard year-end carry
        forward is limited to 10 unused days.
        Exceptional carry forward above 10
        days requires manual approval.
        <br />
        <span dir="rtl">
          30 يوم سنويًا، والموظف الجديد يحسب
          استحقاقه حسب تاريخ مباشرته الفعلي،
          والترحيل الطبيعي بحد أقصى 10 أيام.
        </span>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 10,
            color: C.danger,
            background:
              "rgba(255,107,107,.08)",
            border:
              "1px solid rgba(255,107,107,.25)",
          }}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 10,
            color: C.primary,
            background:
              "rgba(85,230,165,.08)",
            border:
              "1px solid rgba(85,230,165,.25)",
          }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(390px, 1fr))",
          gap: 18,
        }}
      >
        <div
          style={{
            background: C.soft,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Annual Balance Initialization
          </h4>

          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginBottom: 13,
            }}
          >
            تهيئة رصيد الإجازة السنوية
          </div>

          <label style={label}>
            Leave Year
          </label>

          <input
            style={input}
            type="number"
            min="2000"
            max="2200"
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
          />

          <button
            disabled={saving}
            onClick={initializeYear}
            style={{
              marginTop: 12,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 9,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Initialize Annual Balances
          </button>
        </div>

        <div
          style={{
            background: C.soft,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Year-End Carry Forward
          </h4>

          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginBottom: 13,
            }}
          >
            ترحيل الرصيد غير المستخدم بحد
            أقصى 10 أيام
          </div>

          <label style={label}>
            From Year
          </label>

          <input
            style={input}
            type="number"
            min="2000"
            max="2200"
            value={fromYear}
            onChange={(e) =>
              setFromYear(e.target.value)
            }
          />

          <button
            disabled={saving}
            onClick={processCarryForward}
            style={{
              marginTop: 12,
              background: C.warning,
              color: "#151005",
              border: 0,
              borderRadius: 9,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Process Year-End Carry Forward
          </button>
        </div>
      </div>

      <form
        onSubmit={
          createExceptionalCarryForward
        }
        style={{
          marginTop: 18,
          background: C.soft,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h4 style={{ marginTop: 0 }}>
          Exceptional Carry Forward
        </h4>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          ترحيل استثنائي يدوي لأكثر من 10
          أيام
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <label style={label}>
              Employee
            </label>

            <select
              style={input}
              value={
                overrideForm.employee_id
              }
              onChange={(e) =>
                setOverrideForm({
                  ...overrideForm,
                  employee_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                Select employee...
              </option>

              {employees.map((row) => (
                <option
                  key={row.id}
                  value={row.id}
                >
                  {employeeName(row)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={label}>
              From Year
            </label>

            <input
              style={input}
              type="number"
              value={fromYear}
              onChange={(e) =>
                setFromYear(e.target.value)
              }
            />
          </div>

          <div>
            <label style={label}>
              Approved Carry Days
            </label>

            <input
              style={input}
              type="number"
              min="10.01"
              step="0.01"
              value={
                overrideForm.approved_carry_days
              }
              onChange={(e) =>
                setOverrideForm({
                  ...overrideForm,
                  approved_carry_days:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label style={label}>
              Approved By
            </label>

            <input
              style={input}
              value={
                overrideForm.approved_by
              }
              onChange={(e) =>
                setOverrideForm({
                  ...overrideForm,
                  approved_by:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label style={label}>
              Approval Reference
            </label>

            <input
              style={input}
              value={
                overrideForm.approval_reference
              }
              placeholder="Optional"
              onChange={(e) =>
                setOverrideForm({
                  ...overrideForm,
                  approval_reference:
                    e.target.value,
                })
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={label}>
            Reason
          </label>

          <textarea
            style={{
              ...input,
              minHeight: 70,
              resize: "vertical",
            }}
            value={overrideForm.reason}
            onChange={(e) =>
              setOverrideForm({
                ...overrideForm,
                reason: e.target.value,
              })
            }
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={label}>
            Notes
          </label>

          <textarea
            style={{
              ...input,
              minHeight: 60,
              resize: "vertical",
            }}
            value={overrideForm.notes}
            onChange={(e) =>
              setOverrideForm({
                ...overrideForm,
                notes: e.target.value,
              })
            }
          />
        </div>

        <button
          disabled={saving}
          type="submit"
          style={{
            marginTop: 12,
            background: C.primary,
            color: "#04100b",
            border: 0,
            borderRadius: 9,
            padding: "10px 14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Save Exceptional Carry Forward
        </button>
      </form>

      <div
        style={{
          marginTop: 18,
          background: C.soft,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h4 style={{ marginTop: 0 }}>
          Leave Balances — {year}
        </h4>

        {balances.length === 0 ? (
          <div
            style={{
              color: C.muted,
              padding: 18,
              textAlign: "center",
            }}
          >
            No leave balances for this year.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th style={label}>
                    Employee
                  </th>
                  <th style={label}>
                    Entitlement
                  </th>
                  <th style={label}>
                    Carry Forward
                  </th>
                  <th style={label}>
                    Used
                  </th>
                  <th style={label}>
                    Pending
                  </th>
                  <th style={label}>
                    Adjustment
                  </th>
                  <th style={label}>
                    Available
                  </th>
                </tr>
              </thead>

              <tbody>
                {balances.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 9 }}>
                      {employeeMap[
                        row.employee_id
                      ] || row.employee_id}
                    </td>
                    <td style={{ padding: 9 }}>
                      {num(
                        row.entitlement_days
                      )}
                    </td>
                    <td style={{ padding: 9 }}>
                      {num(
                        row.carried_forward_days
                      )}
                    </td>
                    <td style={{ padding: 9 }}>
                      {num(row.used_days)}
                    </td>
                    <td style={{ padding: 9 }}>
                      {num(row.pending_days)}
                    </td>
                    <td style={{ padding: 9 }}>
                      {num(
                        row.adjustment_days
                      )}
                    </td>
                    <td
                      style={{
                        padding: 9,
                        color: C.primary,
                        fontWeight: 800,
                      }}
                    >
                      {num(
                        row.available_days
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          background: C.soft,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h4 style={{ marginTop: 0 }}>
          Exceptional Carry Forward History
        </h4>

        {exceptions.length === 0 ? (
          <div
            style={{
              color: C.muted,
              padding: 18,
              textAlign: "center",
            }}
          >
            No exceptional carry forward records.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 9,
            }}
          >
            {exceptions.map((row) => (
              <div
                key={row.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                <strong>
                  {employeeMap[
                    row.employee_id
                  ] || row.employee_id}
                </strong>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  {row.from_year} →{" "}
                  {row.to_year}
                  {" • "}
                  Approved:{" "}
                  {num(
                    row.approved_carry_days
                  )}{" "}
                  days
                  {" • "}
                  Unused:{" "}
                  {num(
                    row.unused_days_at_year_end
                  )}
                </div>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  Approved by:{" "}
                  {row.approved_by}
                  {" • "}
                  {row.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
