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

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

function statusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return {
      color: C.primary,
      background: "rgba(24,213,183,.10)",
    };
  }

  if (value === "pending") {
    return {
      color: C.warning,
      background: "rgba(245,201,107,.10)",
    };
  }

  if (value === "rejected") {
    return {
      color: C.danger,
      background: "rgba(255,107,107,.10)",
    };
  }

  return {
    color: C.blue,
    background: "rgba(114,183,255,.10)",
  };
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
        fontWeight: 800,
        textTransform: "capitalize",
      }}
    >
      {children || "—"}
    </span>
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
        minHeight: 120,
      }}
    >
      <div style={{ color: C.muted, fontSize: 13 }}>
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 30,
          fontWeight: 850,
          marginTop: 10,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: C.muted,
          fontSize: 12,
          marginTop: 7,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        padding: 28,
        textAlign: "center",
        color: C.muted,
        border: `1px dashed ${C.border}`,
        borderRadius: 13,
      }}
    >
      {children}
    </div>
  );
}

export default function BenefitsInsurancePage() {
  const [employees, setEmployees] = useState([]);
  const [benefits, setBenefits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    employee_id: "",
    benefit_type: "medical_insurance",
    provider: "",
    plan_name: "",
    annual_employer_cost: "0",
    employee_monthly_deduction: "0",
    start_date: "",
    end_date: "",
    notes: "",
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
      throw new Error(
        data?.detail ||
        `Request failed: ${response.status}`
      );
    }

    return data;
  }

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [employeeData, benefitData] =
        await Promise.all([
          api("/api/hr/employees"),
          api("/api/hr/benefits/enrollments"),
        ]);

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : []
      );

      setBenefits(
        Array.isArray(benefitData)
          ? benefitData
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "Unable to load Benefits & Insurance"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((e) => [
          e.id,
          employeeName(e),
        ])
      ),
    [employees]
  );

  const pending = benefits.filter(
    (b) => b.status === "pending"
  );

  const active = benefits.filter(
    (b) => b.status === "active"
  );

  const rejected = benefits.filter(
    (b) => b.status === "rejected"
  );

  const annualEmployerCost = active.reduce(
    (sum, row) =>
      sum + Number(row.annual_employer_cost || 0),
    0
  );

  const monthlyEmployeeDeduction = active.reduce(
    (sum, row) =>
      sum +
      Number(
        row.employee_monthly_deduction || 0
      ),
    0
  );

  async function createBenefit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.employee_id) {
        throw new Error(
          "Select an employee first"
        );
      }

      if (!form.benefit_type) {
        throw new Error(
          "Benefit type is required"
        );
      }

      if (!form.start_date) {
        throw new Error(
          "Start date is required"
        );
      }

      await api(
        "/api/hr/benefits/enrollments",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id: form.employee_id,
            benefit_type: form.benefit_type,
            provider:
              form.provider.trim() || null,
            plan_name:
              form.plan_name.trim() || null,
            annual_employer_cost: Number(
              form.annual_employer_cost || 0
            ),
            employee_monthly_deduction:
              Number(
                form.employee_monthly_deduction ||
                0
              ),
            start_date: form.start_date,
            end_date:
              form.end_date || null,
            notes:
              form.notes.trim() || null,
          }),
        }
      );

      setForm({
        employee_id: "",
        benefit_type: "medical_insurance",
        provider: "",
        plan_name: "",
        annual_employer_cost: "0",
        employee_monthly_deduction: "0",
        start_date: "",
        end_date: "",
        notes: "",
      });

      setMessage(
        "Benefit enrollment submitted for approval."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create benefit enrollment"
      );
    } finally {
      setSaving(false);
    }
  }

  async function decide(
    benefitId,
    status
  ) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/benefits/enrollments/${benefitId}/decision`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
            approver_name: "HR",
            approval_note: null,
          }),
        }
      );

      setMessage(
        status === "approved"
          ? "Benefit enrollment approved."
          : "Benefit enrollment rejected."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to process benefit enrollment"
      );
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
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
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
                margin: "13px 0 6px",
                fontSize: 31,
              }}
            >
              Benefits & Insurance
            </h1>

            <div
              style={{
                color: C.muted,
                fontSize: 14,
              }}
            >
              المزايا والتأمين
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 12,
                marginTop: 7,
              }}
            >
              Benefits administration is
              independent from Payroll.
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 11,
              padding: "11px 17px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              padding: 14,
              marginBottom: 18,
              borderRadius: 12,
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
              padding: 14,
              marginBottom: 18,
              borderRadius: 12,
              color: C.primary,
              background:
                "rgba(24,213,183,.08)",
              border:
                "1px solid rgba(24,213,183,.25)",
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            title="Pending Approvals"
            value={pending.length}
            subtitle="بانتظار الاعتماد"
            accent={C.warning}
          />

          <StatCard
            title="Active Benefits"
            value={active.length}
            subtitle="المزايا الفعالة"
          />

          <StatCard
            title="Annual Employer Cost"
            value={`${money(
              annualEmployerCost
            )} SAR`}
            subtitle="التكلفة السنوية على الشركة"
            accent={C.blue}
          />

          <StatCard
            title="Monthly Employee Deduction"
            value={`${money(
              monthlyEmployeeDeduction
            )} SAR`}
            subtitle="استقطاع الموظفين الشهري المعتمد"
            accent={C.warning}
          />

          <StatCard
            title="Rejected"
            value={rejected.length}
            subtitle="طلبات مرفوضة"
            accent={C.danger}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(430px, 1fr))",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <form
            onSubmit={createBenefit}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              New Benefit Enrollment
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              تسجيل ميزة أو تغطية تأمينية جديدة
            </div>

            {employees.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  marginBottom: 14,
                  borderRadius: 10,
                  color: C.warning,
                  background:
                    "rgba(245,201,107,.08)",
                  border:
                    "1px solid rgba(245,201,107,.20)",
                }}
              >
                No employees found. Add
                employees from HR Workspace
                first.
                <br />
                لا يوجد موظفون حاليًا.
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>
                  Employee
                </label>

                <select
                  style={input}
                  value={form.employee_id}
                  disabled={
                    employees.length === 0
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      employee_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select employee...
                  </option>

                  {employees.map((e) => (
                    <option
                      key={e.id}
                      value={e.id}
                    >
                      {employeeName(e)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>
                  Benefit Type
                </label>

                <select
                  style={input}
                  value={form.benefit_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      benefit_type:
                        e.target.value,
                    })
                  }
                >
                  <option value="medical_insurance">
                    Medical Insurance
                  </option>

                  <option value="life_insurance">
                    Life Insurance
                  </option>

                  <option value="education">
                    Education Benefit
                  </option>

                  <option value="wellness">
                    Wellness Benefit
                  </option>

                  <option value="other">
                    Other Benefit
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <label style={label}>
                    Provider
                  </label>

                  <input
                    style={input}
                    value={form.provider}
                    placeholder="Bupa / Tawuniya / ..."
                    onChange={(e) =>
                      setForm({
                        ...form,
                        provider:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Plan / Class
                  </label>

                  <input
                    style={input}
                    value={form.plan_name}
                    placeholder="VIP / Gold / ..."
                    onChange={(e) =>
                      setForm({
                        ...form,
                        plan_name:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <label style={label}>
                    Annual Employer Cost
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.annual_employer_cost
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        annual_employer_cost:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Employee Monthly
                    Deduction
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.employee_monthly_deduction
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_monthly_deduction:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <label style={label}>
                    Start Date
                  </label>

                  <input
                    style={input}
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start_date:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    End Date
                  </label>

                  <input
                    style={input}
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        end_date:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={label}>
                  Notes
                </label>

                <textarea
                  style={{
                    ...input,
                    minHeight: 85,
                    resize: "vertical",
                  }}
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                employees.length === 0
              }
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
                  employees.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              Submit for Approval
            </button>
          </form>

          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Pending Approvals
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              طلبات المزايا والتأمين بانتظار
              الاعتماد
            </div>

            {pending.length === 0 ? (
              <Empty>
                No pending benefit
                enrollments
                <br />
                لا توجد طلبات معلقة
              </Empty>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {pending.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                      }}
                    >
                      {employeeMap[
                        row.employee_id
                      ] || row.employee_id}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 13,
                        marginTop: 5,
                      }}
                    >
                      {row.benefit_type}
                      {" • "}
                      {row.provider || "—"}
                      {" • "}
                      {row.plan_name || "—"}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Employer:{" "}
                      {money(
                        row.annual_employer_cost
                      )}{" "}
                      SAR/year
                      {" • "}
                      Employee:{" "}
                      {money(
                        row.employee_monthly_deduction
                      )}{" "}
                      SAR/month
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 13,
                      }}
                    >
                      <button
                        disabled={saving}
                        onClick={() =>
                          decide(
                            row.id,
                            "approved"
                          )
                        }
                        style={{
                          background:
                            C.primary,
                          color: "#04100b",
                          border: 0,
                          borderRadius: 9,
                          padding:
                            "9px 13px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>

                      <button
                        disabled={saving}
                        onClick={() =>
                          decide(
                            row.id,
                            "rejected"
                          )
                        }
                        style={{
                          background:
                            "rgba(255,107,107,.10)",
                          color: C.danger,
                          border:
                            "1px solid rgba(255,107,107,.25)",
                          borderRadius: 9,
                          padding:
                            "9px 13px",
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
        </div>

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Active Benefits & Insurance
          </h3>

          <div
            style={{
              color: C.muted,
              fontSize: 13,
              marginBottom: 15,
            }}
          >
            المزايا والتغطيات المعتمدة والفعالة
          </div>

          {active.length === 0 ? (
            <Empty>
              No active benefits yet
              <br />
              لا توجد مزايا فعالة حتى الآن
            </Empty>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>
                      Employee
                    </th>
                    <th style={th}>
                      Type
                    </th>
                    <th style={th}>
                      Provider
                    </th>
                    <th style={th}>
                      Plan
                    </th>
                    <th style={th}>
                      Employer Cost
                    </th>
                    <th style={th}>
                      Employee Deduction
                    </th>
                    <th style={th}>
                      Start
                    </th>
                    <th style={th}>
                      End
                    </th>
                    <th style={th}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {active.map((row) => (
                    <tr key={row.id}>
                      <td style={td}>
                        {employeeMap[
                          row.employee_id
                        ] ||
                          row.employee_id}
                      </td>

                      <td style={td}>
                        {row.benefit_type}
                      </td>

                      <td style={td}>
                        {row.provider || "—"}
                      </td>

                      <td style={td}>
                        {row.plan_name || "—"}
                      </td>

                      <td style={td}>
                        {money(
                          row.annual_employer_cost
                        )}{" "}
                        SAR
                      </td>

                      <td style={td}>
                        {money(
                          row.employee_monthly_deduction
                        )}{" "}
                        SAR
                      </td>

                      <td style={td}>
                        {row.start_date ||
                          "—"}
                      </td>

                      <td style={td}>
                        {row.end_date ||
                          "—"}
                      </td>

                      <td style={td}>
                        <Badge>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
