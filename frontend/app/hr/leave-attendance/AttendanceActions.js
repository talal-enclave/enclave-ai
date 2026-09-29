"use client";

import { useEffect, useState } from "react";

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

function toIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function workedHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;

  const start = new Date(clockIn);
  const end = new Date(clockOut);

  const hours = (end - start) / 3600000;

  return hours > 0 ? Math.round(hours * 100) / 100 : 0;
}

export default function AttendanceActions({ onChanged }) {
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: "",
    work_date: "",
    clock_in: "",
    clock_out: "",
    scheduled_hours: "8",
    late_minutes: "0",
    early_leave_minutes: "0",
    overtime_hours: "0",
    status: "present",
    source: "manual",
    notes: "",
  });

  const [exceptionForm, setExceptionForm] = useState({
    employee_id: "",
    exception_date: "",
    exception_type: "late",
    minutes: "0",
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

      const data = await api("/api/hr/employees");
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Unable to load employees");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveAttendance(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!attendanceForm.employee_id) {
        throw new Error("Select an employee first");
      }

      if (!attendanceForm.work_date) {
        throw new Error("Work date is required");
      }

      const calculatedWorkedHours = workedHours(
        attendanceForm.clock_in,
        attendanceForm.clock_out
      );

      await api("/api/hr/attendance/records", {
        method: "POST",
        body: JSON.stringify({
          employee_id: attendanceForm.employee_id,
          work_date: attendanceForm.work_date,
          clock_in: toIso(attendanceForm.clock_in),
          clock_out: toIso(attendanceForm.clock_out),
          scheduled_hours: Number(attendanceForm.scheduled_hours || 0),
          worked_hours: calculatedWorkedHours,
          late_minutes: Number(attendanceForm.late_minutes || 0),
          early_leave_minutes: Number(
            attendanceForm.early_leave_minutes || 0
          ),
          overtime_hours: Number(attendanceForm.overtime_hours || 0),
          status: attendanceForm.status,
          source: attendanceForm.source,
          notes: attendanceForm.notes.trim() || null,
        }),
      });

      setMessage("Attendance record saved successfully.");

      setAttendanceForm({
        employee_id: "",
        work_date: "",
        clock_in: "",
        clock_out: "",
        scheduled_hours: "8",
        late_minutes: "0",
        early_leave_minutes: "0",
        overtime_hours: "0",
        status: "present",
        source: "manual",
        notes: "",
      });

      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to save attendance");
    } finally {
      setSaving(false);
    }
  }

  async function createException(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!exceptionForm.employee_id) {
        throw new Error("Select an employee first");
      }

      if (!exceptionForm.exception_date) {
        throw new Error("Exception date is required");
      }

      await api("/api/hr/attendance/exceptions", {
        method: "POST",
        body: JSON.stringify({
          employee_id: exceptionForm.employee_id,
          exception_date: exceptionForm.exception_date,
          exception_type: exceptionForm.exception_type,
          minutes: Number(exceptionForm.minutes || 0),
          reason: exceptionForm.reason.trim() || null,
        }),
      });

      setMessage("Attendance exception created successfully.");

      setExceptionForm({
        employee_id: "",
        exception_date: "",
        exception_type: "late",
        minutes: "0",
        reason: "",
      });

      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || "Unable to create attendance exception");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {employees.length === 0 ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
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

      {error ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            color: C.danger,
            background: "rgba(255,107,107,.08)",
            border: "1px solid rgba(255,107,107,.25)",
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
            background: "rgba(85,230,165,.08)",
            border: "1px solid rgba(85,230,165,.25)",
          }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(390px, 1fr))",
          gap: 18,
        }}
      >
        <form
          onSubmit={saveAttendance}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Attendance Record</h3>

          <div style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>
            تسجيل الحضور والانصراف
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={label}>Employee</label>
              <select
                style={input}
                disabled={employees.length === 0}
                value={attendanceForm.employee_id}
                onChange={(e) =>
                  setAttendanceForm({
                    ...attendanceForm,
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Work Date</label>
                <input
                  style={input}
                  type="date"
                  value={attendanceForm.work_date}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      work_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>Status</label>
                <select
                  style={input}
                  value={attendanceForm.status}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="remote">Remote</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Clock In</label>
                <input
                  style={input}
                  type="datetime-local"
                  value={attendanceForm.clock_in}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      clock_in: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>Clock Out</label>
                <input
                  style={input}
                  type="datetime-local"
                  value={attendanceForm.clock_out}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      clock_out: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Scheduled Hours</label>
                <input
                  style={input}
                  type="number"
                  min="0"
                  step="0.25"
                  value={attendanceForm.scheduled_hours}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      scheduled_hours: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>Calculated Worked Hours</label>
                <input
                  style={{ ...input, opacity: 0.8 }}
                  readOnly
                  value={workedHours(
                    attendanceForm.clock_in,
                    attendanceForm.clock_out
                  )}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Late Minutes</label>
                <input
                  style={input}
                  type="number"
                  min="0"
                  value={attendanceForm.late_minutes}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      late_minutes: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>Early Leave</label>
                <input
                  style={input}
                  type="number"
                  min="0"
                  value={attendanceForm.early_leave_minutes}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      early_leave_minutes: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>Overtime Hours</label>
                <input
                  style={input}
                  type="number"
                  min="0"
                  step="0.25"
                  value={attendanceForm.overtime_hours}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      overtime_hours: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label style={label}>Notes</label>
              <textarea
                style={{ ...input, minHeight: 75, resize: "vertical" }}
                value={attendanceForm.notes}
                onChange={(e) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || employees.length === 0}
            style={{
              marginTop: 16,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 800,
              cursor: "pointer",
              opacity: employees.length === 0 ? 0.5 : 1,
            }}
          >
            Save Attendance
          </button>
        </form>

        <form
          onSubmit={createException}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Attendance Exception</h3>

          <div style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>
            تسجيل استثناء أو مخالفة حضور
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={label}>Employee</label>

              <select
                style={input}
                disabled={employees.length === 0}
                value={exceptionForm.employee_id}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
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
              <label style={label}>Exception Date</label>
              <input
                style={input}
                type="date"
                value={exceptionForm.exception_date}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    exception_date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>Exception Type</label>

              <select
                style={input}
                value={exceptionForm.exception_type}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    exception_type: e.target.value,
                  })
                }
              >
                <option value="late">Late Arrival</option>
                <option value="early_leave">Early Leave</option>
                <option value="missing_clock_in">Missing Clock In</option>
                <option value="missing_clock_out">Missing Clock Out</option>
                <option value="absence">Absence</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={label}>Minutes</label>
              <input
                style={input}
                type="number"
                min="0"
                value={exceptionForm.minutes}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    minutes: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>Reason / Notes</label>
              <textarea
                style={{ ...input, minHeight: 90, resize: "vertical" }}
                value={exceptionForm.reason}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    reason: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || employees.length === 0}
            style={{
              marginTop: 16,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 800,
              cursor: "pointer",
              opacity: employees.length === 0 ? 0.5 : 1,
            }}
          >
            Create Exception
          </button>
        </form>
      </div>
    </div>
  );
}
