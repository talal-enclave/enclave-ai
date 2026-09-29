"use client";

import { useEffect, useState } from "react";
import AnnualLeaveAdmin from "./AnnualLeaveAdmin";

const C = {
  panel: "#09131a",
  soft: "#0d1a22",
  primary: "#55e6a5",
  text: "#f4f7f9",
  muted: "#8fa1ad",
  border: "rgba(255,255,255,.09)",
  danger: "#ff6b6b",
  warning: "#f5c96b",
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
  const name = row.full_name_ar || row.full_name_en || "Unnamed employee";
  return row.employee_number ? `${name} — ${row.employee_number}` : name;
}

export default function LeaveActions({ onChanged }) {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pending, setPending] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [typeForm, setTypeForm] = useState({
    code: "",
    name_en: "",
    name_ar: "",
    annual_entitlement: "30",
    is_paid: true,
    carry_forward_allowed: false,
    max_carry_forward_days: "0",
  });

  const [requestForm, setRequestForm] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
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
      setError("");

      const [e, t, p] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/leave/types"),
        api("/api/hr/leave/requests?status=pending"),
      ]);

      setEmployees(Array.isArray(e) ? e : []);
      setLeaveTypes(Array.isArray(t) ? t : []);
      setPending(Array.isArray(p) ? p : []);
    } catch (err) {
      setError(err?.message || "Unable to load management data");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createLeaveType(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!typeForm.code.trim() || !typeForm.name_en.trim()) {
        throw new Error("Code and English name are required");
      }

      await api("/api/hr/leave/types", {
        method: "POST",
        body: JSON.stringify({
          code: typeForm.code.trim(),
          name_en: typeForm.name_en.trim(),
          name_ar: typeForm.name_ar.trim() || null,
          annual_entitlement: Number(typeForm.annual_entitlement || 0),
          is_paid: typeForm.is_paid,
          carry_forward_allowed: typeForm.carry_forward_allowed,
          max_carry_forward_days: Number(typeForm.max_carry_forward_days || 0),
        }),
      });

      setTypeForm({
        code: "",
        name_en: "",
        name_ar: "",
        annual_entitlement: "30",
        is_paid: true,
        carry_forward_allowed: false,
        max_carry_forward_days: "0",
      });

      setMessage("Leave type created successfully.");
      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to create leave type");
    } finally {
      setSaving(false);
    }
  }

  async function createLeaveRequest(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!requestForm.employee_id) {
        throw new Error("Select an employee first");
      }

      if (!requestForm.leave_type_id) {
        throw new Error("Select a leave type first");
      }

      if (!requestForm.start_date || !requestForm.end_date) {
        throw new Error("Start and end dates are required");
      }

      await api("/api/hr/leave/requests", {
        method: "POST",
        body: JSON.stringify({
          employee_id: requestForm.employee_id,
          leave_type_id: requestForm.leave_type_id,
          start_date: requestForm.start_date,
          end_date: requestForm.end_date,
          reason: requestForm.reason.trim() || null,
        }),
      });

      setRequestForm({
        employee_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });

      setMessage("Leave request created successfully.");
      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to create leave request");
    } finally {
      setSaving(false);
    }
  }

  async function decide(id, status) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(`/api/hr/leave/requests/${id}/decision`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          approver_name: "HR",
          decision_note: null,
        }),
      });

      setMessage(`Leave request ${status}.`);
      await load();
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to process leave request");
    } finally {
      setSaving(false);
    }
  }

  const employeeMap = Object.fromEntries(
    employees.map((e) => [e.id, employeeName(e)])
  );

  const leaveTypeMap = Object.fromEntries(
    leaveTypes.map((t) => [t.id, t.name_ar || t.name_en || t.code])
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {error ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            color: C.danger,
            border: "1px solid rgba(255,107,107,.25)",
            background: "rgba(255,107,107,.08)",
          }}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            color: C.primary,
            border: "1px solid rgba(85,230,165,.25)",
            background: "rgba(85,230,165,.08)",
          }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 18,
        }}
      >
        <form
          onSubmit={createLeaveType}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Add Leave Type</h3>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>
            إضافة نوع إجازة جديد
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Code</label>
              <input
                style={input}
                value={typeForm.code}
                placeholder="ANNUAL"
                onChange={(e) =>
                  setTypeForm({ ...typeForm, code: e.target.value })
                }
              />
            </div>

            <div>
              <label style={label}>Annual Entitlement</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.5"
                value={typeForm.annual_entitlement}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    annual_entitlement: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>English Name</label>
              <input
                style={input}
                value={typeForm.name_en}
                placeholder="Annual Leave"
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name_en: e.target.value })
                }
              />
            </div>

            <div>
              <label style={label}>Arabic Name</label>
              <input
                style={input}
                dir="rtl"
                value={typeForm.name_ar}
                placeholder="إجازة سنوية"
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name_ar: e.target.value })
                }
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 14,
              color: C.muted,
              fontSize: 13,
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={typeForm.is_paid}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, is_paid: e.target.checked })
                }
              />{" "}
              Paid Leave
            </label>

            <label>
              <input
                type="checkbox"
                checked={typeForm.carry_forward_allowed}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    carry_forward_allowed: e.target.checked,
                  })
                }
              />{" "}
              Carry Forward
            </label>
          </div>

          {typeForm.carry_forward_allowed ? (
            <div style={{ marginTop: 12 }}>
              <label style={label}>Maximum Carry Forward Days</label>
              <input
                style={input}
                type="number"
                min="0"
                step="0.5"
                value={typeForm.max_carry_forward_days}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    max_carry_forward_days: e.target.value,
                  })
                }
              />
            </div>
          ) : null}

          <button
            disabled={saving}
            type="submit"
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
            Add Leave Type
          </button>
        </form>

        <form
          onSubmit={createLeaveRequest}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>New Leave Request</h3>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>
            إنشاء طلب إجازة
          </div>

          {employees.length === 0 ? (
            <div
              style={{
                padding: 12,
                marginBottom: 14,
                borderRadius: 10,
                color: C.warning,
                background: "rgba(245,201,107,.08)",
                border: "1px solid rgba(245,201,107,.20)",
              }}
            >
              No employees found. Add employees from HR Workspace first.
              <br />
              لا يوجد موظفون حاليًا، أضف الموظفين أولًا من HR Workspace.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={label}>Employee</label>
              <select
                style={input}
                value={requestForm.employee_id}
                disabled={employees.length === 0}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    employee_id: e.target.value,
                  })
                }
              >
                <option value="">Select employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {employeeName(e)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Leave Type</label>
              <select
                style={input}
                value={requestForm.leave_type_id}
                disabled={leaveTypes.length === 0}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    leave_type_id: e.target.value,
                  })
                }
              >
                <option value="">Select leave type...</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name_ar || t.name_en} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Start Date</label>
                <input
                  style={input}
                  type="date"
                  value={requestForm.start_date}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>End Date</label>
                <input
                  style={input}
                  type="date"
                  value={requestForm.end_date}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label style={label}>Reason</label>
              <textarea
                style={{ ...input, minHeight: 80, resize: "vertical" }}
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    reason: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            disabled={
              saving ||
              employees.length === 0 ||
              leaveTypes.length === 0
            }
            type="submit"
            style={{
              marginTop: 16,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 800,
              cursor: "pointer",
              opacity:
                employees.length === 0 || leaveTypes.length === 0 ? 0.5 : 1,
            }}
          >
            Create Leave Request
          </button>
        </form>
      </div>

      <section
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Pending Approvals</h3>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
          طلبات الإجازة بانتظار الاعتماد
        </div>

        {pending.length === 0 ? (
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              textAlign: "center",
              color: C.muted,
              border: `1px dashed ${C.border}`,
            }}
          >
            No pending leave requests — لا توجد طلبات معلقة
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {pending.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: 14,
                  borderRadius: 12,
                  background: C.soft,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {employeeMap[r.employee_id] || r.employee_id}
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 5 }}>
                    {leaveTypeMap[r.leave_type_id] || r.leave_type_id}
                    {" • "}
                    {r.start_date} → {r.end_date}
                    {" • "}
                    {r.total_days} days
                  </div>
                  {r.reason ? (
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
                      {r.reason}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={saving}
                    onClick={() => decide(r.id, "approved")}
                    style={{
                      background: C.primary,
                      color: "#04100b",
                      border: 0,
                      borderRadius: 9,
                      padding: "9px 13px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>

                  <button
                    disabled={saving}
                    onClick={() => decide(r.id, "rejected")}
                    style={{
                      background: "rgba(255,107,107,.10)",
                      color: C.danger,
                      border: "1px solid rgba(255,107,107,.25)",
                      borderRadius: 9,
                      padding: "9px 13px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <AnnualLeaveAdmin
        employees={employees}
        leaveTypes={leaveTypes}
        onChanged={onChanged}
      />

    </div>
  );
}
