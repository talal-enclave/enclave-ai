"use client";

import { useEffect, useState } from "react";
import LeaveActions from "./LeaveActions";
import AttendanceActions from "./AttendanceActions";

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

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch {
    return value;
  }
}

function shortId(value) {
  if (!value) return "—";
  return String(value).slice(0, 8);
}

function statusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (["approved", "present", "active", "resolved"].includes(value)) {
    return { color: C.primary, background: "rgba(24,213,183,.10)" };
  }

  if (["pending", "open"].includes(value)) {
    return { color: C.warning, background: "rgba(245,201,107,.10)" };
  }

  if (["rejected", "absent", "inactive"].includes(value)) {
    return { color: C.danger, background: "rgba(255,107,107,.10)" };
  }

  return { color: C.blue, background: "rgba(114,183,255,.10)" };
}

function Badge({ children }) {
  const s = statusStyle(children);
  return (
    <span
      style={{
        ...s,
        display: "inline-block",
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {children || "—"}
    </span>
  );
}

function Empty({ text }) {
  return (
    <div
      style={{
        padding: "34px 20px",
        color: C.muted,
        textAlign: "center",
        border: `1px dashed ${C.border}`,
        borderRadius: 14,
      }}
    >
      {text}
    </div>
  );
}

function StatCard({ title, value, subtitle, accent = C.primary }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 20,
        minHeight: 125,
      }}
    >
      <div style={{ color: C.muted, fontSize: 13 }}>{title}</div>

      <div
        style={{
          color: accent,
          fontSize: 34,
          fontWeight: 800,
          marginTop: 10,
        }}
      >
        {value ?? 0}
      </div>

      <div style={{ color: C.muted, fontSize: 12, marginTop: 7 }}>
        {subtitle}
      </div>
    </div>
  );
}

const th = {
  color: C.muted,
  fontSize: 12,
  fontWeight: 700,
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: "nowrap",
};

const td = {
  color: C.text,
  fontSize: 13,
  padding: "13px 10px",
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: "middle",
};

export default function LeaveAttendanceWorkspace() {
  const [summary, setSummary] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function api(path) {
    const response = await fetch(path, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
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

      const [s, lt, lb, lr, ar, ae] = await Promise.all([
        api("/api/hr/leave-attendance/summary"),
        api("/api/hr/leave/types"),
        api("/api/hr/leave/balances"),
        api("/api/hr/leave/requests"),
        api("/api/hr/attendance/records"),
        api("/api/hr/attendance/exceptions"),
      ]);

      setSummary(s || {});
      setLeaveTypes(Array.isArray(lt) ? lt : []);
      setBalances(Array.isArray(lb) ? lb : []);
      setRequests(Array.isArray(lr) ? lr : []);
      setAttendance(Array.isArray(ar) ? ar : []);
      setExceptions(Array.isArray(ae) ? ae : []);
    } catch (e) {
      setError(e?.message || "Unable to load Leave & Attendance data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tabs = [
    ["overview", "Overview"],
    ["leave", "Leave Management"],
    ["attendance", "Attendance"],
    ["exceptions", "Exceptions"],
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        padding: "28px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          <div>
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

            <h1
              style={{
                margin: "13px 0 7px",
                fontSize: 31,
                letterSpacing: "-.5px",
              }}
            >
              Leave & Attendance
            </h1>

            <div style={{ color: C.muted, fontSize: 14 }}>
              الإجازات والحضور والانصراف والاستثناءات
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 12,
              padding: "11px 17px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              background: "rgba(255,107,107,.08)",
              border: "1px solid rgba(255,107,107,.25)",
              color: C.danger,
              borderRadius: 14,
              padding: 15,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <StatCard
            title="Pending Leave"
            value={summary.pending_leave_requests}
            subtitle="طلبات إجازة بانتظار القرار"
            accent={C.warning}
          />

          <StatCard
            title="Approved Leave"
            value={summary.approved_leave_requests}
            subtitle="طلبات الإجازة المعتمدة"
          />

          <StatCard
            title="Present Today"
            value={summary.present_today}
            subtitle="الحاضرون اليوم"
            accent={C.blue}
          />

          <StatCard
            title="Absent Today"
            value={summary.absent_today}
            subtitle="الغياب اليوم"
            accent={C.danger}
          />

          <StatCard
            title="Open Exceptions"
            value={summary.open_attendance_exceptions}
            subtitle="استثناءات تحتاج معالجة"
            accent={C.warning}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 20,
            background: C.panel,
            padding: 7,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            width: "fit-content",
          }}
        >
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                border: 0,
                cursor: "pointer",
                padding: "9px 14px",
                borderRadius: 10,
                fontWeight: 700,
                background: tab === key ? C.primary : "transparent",
                color: tab === key ? "#04100b" : C.muted,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 40,
              textAlign: "center",
              color: C.muted,
            }}
          >
            Loading Leave & Attendance...
          </div>
        ) : null}

        {!loading && tab === "overview" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(430px, 1fr))",
              gap: 18,
            }}
          >
            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Recent Leave Requests</h3>

              {requests.length === 0 ? (
                <Empty text="No leave requests yet — لا توجد طلبات إجازة حتى الآن" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Employee</th>
                        <th style={th}>From</th>
                        <th style={th}>To</th>
                        <th style={th}>Days</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.slice(0, 8).map((r) => (
                        <tr key={r.id}>
                          <td style={td}>{shortId(r.employee_id)}</td>
                          <td style={td}>{fmtDate(r.start_date)}</td>
                          <td style={td}>{fmtDate(r.end_date)}</td>
                          <td style={td}>{r.total_days}</td>
                          <td style={td}><Badge>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Attendance Exceptions</h3>

              {exceptions.length === 0 ? (
                <Empty text="No attendance exceptions — لا توجد استثناءات حضور" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Date</th>
                        <th style={th}>Employee</th>
                        <th style={th}>Type</th>
                        <th style={th}>Minutes</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exceptions.slice(0, 8).map((r) => (
                        <tr key={r.id}>
                          <td style={td}>{fmtDate(r.exception_date)}</td>
                          <td style={td}>{shortId(r.employee_id)}</td>
                          <td style={td}>{r.exception_type}</td>
                          <td style={td}>{r.minutes}</td>
                          <td style={td}><Badge>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {!loading && tab === "leave" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <LeaveActions onChanged={load} />
            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Leave Requests</h3>

              {requests.length === 0 ? (
                <Empty text="No leave requests yet — لا توجد طلبات إجازة" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Employee</th>
                        <th style={th}>Leave Type</th>
                        <th style={th}>Start</th>
                        <th style={th}>End</th>
                        <th style={th}>Days</th>
                        <th style={th}>Reason</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td style={td}>{shortId(r.employee_id)}</td>
                          <td style={td}>{shortId(r.leave_type_id)}</td>
                          <td style={td}>{fmtDate(r.start_date)}</td>
                          <td style={td}>{fmtDate(r.end_date)}</td>
                          <td style={td}>{r.total_days}</td>
                          <td style={td}>{r.reason || "—"}</td>
                          <td style={td}><Badge>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(430px, 1fr))",
                gap: 18,
              }}
            >
              <section
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Leave Balances</h3>

                {balances.length === 0 ? (
                  <Empty text="No leave balances yet — لا توجد أرصدة إجازات" />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={th}>Employee</th>
                          <th style={th}>Year</th>
                          <th style={th}>Entitled</th>
                          <th style={th}>Used</th>
                          <th style={th}>Pending</th>
                          <th style={th}>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances.map((r) => (
                          <tr key={r.id}>
                            <td style={td}>{shortId(r.employee_id)}</td>
                            <td style={td}>{r.balance_year}</td>
                            <td style={td}>{r.entitlement_days}</td>
                            <td style={td}>{r.used_days}</td>
                            <td style={td}>{r.pending_days}</td>
                            <td style={{ ...td, color: C.primary, fontWeight: 800 }}>
                              {r.available_days}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Leave Types</h3>

                {leaveTypes.length === 0 ? (
                  <Empty text="No leave types configured — لم تتم إضافة أنواع الإجازات" />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={th}>Code</th>
                          <th style={th}>Type</th>
                          <th style={th}>Entitlement</th>
                          <th style={th}>Paid</th>
                          <th style={th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveTypes.map((r) => (
                          <tr key={r.id}>
                            <td style={td}>{r.code}</td>
                            <td style={td}>{r.name_en}</td>
                            <td style={td}>{r.annual_entitlement}</td>
                            <td style={td}>{r.is_paid ? "Yes" : "No"}</td>
                            <td style={td}><Badge>{r.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : null}

        {!loading && tab === "attendance" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <AttendanceActions onChanged={load} />
            <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Attendance Records</h3>

            {attendance.length === 0 ? (
              <Empty text="No attendance records yet — لا توجد سجلات حضور حتى الآن" />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Employee</th>
                      <th style={th}>Clock In</th>
                      <th style={th}>Clock Out</th>
                      <th style={th}>Worked</th>
                      <th style={th}>Late</th>
                      <th style={th}>Early Leave</th>
                      <th style={th}>Overtime</th>
                      <th style={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((r) => (
                      <tr key={r.id}>
                        <td style={td}>{fmtDate(r.work_date)}</td>
                        <td style={td}>{shortId(r.employee_id)}</td>
                        <td style={td}>{r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : "—"}</td>
                        <td style={td}>{r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : "—"}</td>
                        <td style={td}>{r.worked_hours}h</td>
                        <td style={td}>{r.late_minutes}m</td>
                        <td style={td}>{r.early_leave_minutes}m</td>
                        <td style={td}>{r.overtime_hours}h</td>
                        <td style={td}><Badge>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          </div>
        ) : null}

        {!loading && tab === "exceptions" ? (
          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Attendance Exceptions</h3>

            {exceptions.length === 0 ? (
              <Empty text="No exceptions — لا توجد استثناءات" />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Employee</th>
                      <th style={th}>Type</th>
                      <th style={th}>Minutes</th>
                      <th style={th}>Reason</th>
                      <th style={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map((r) => (
                      <tr key={r.id}>
                        <td style={td}>{fmtDate(r.exception_date)}</td>
                        <td style={td}>{shortId(r.employee_id)}</td>
                        <td style={td}>{r.exception_type}</td>
                        <td style={td}>{r.minutes}</td>
                        <td style={td}>{r.reason || "—"}</td>
                        <td style={td}><Badge>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
