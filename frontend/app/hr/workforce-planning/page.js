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

function departmentName(row) {
  if (!row) return "Unknown department";

  const name =
    row.name_ar ||
    row.name_en ||
    row.code ||
    "Department";

  return row.code ? `${name} — ${row.code}` : name;
}

function positionName(row) {
  if (!row) return "Unknown position";

  const title =
    row.title_ar ||
    row.title_en ||
    row.code ||
    "Position";

  return row.code ? `${title} — ${row.code}` : title;
}

function Badge({ children }) {
  const value = String(children || "").toLowerCase();

  const style =
    value === "approved"
      ? {
          color: C.primary,
          background: "rgba(24,213,183,.10)",
        }
      : value === "submitted"
      ? {
          color: C.blue,
          background: "rgba(114,183,255,.10)",
        }
      : value === "draft"
      ? {
          color: C.warning,
          background: "rgba(245,201,107,.10)",
        }
      : value === "frozen"
      ? {
          color: C.warning,
          background: "rgba(245,201,107,.10)",
        }
      : {
          color: C.muted,
          background: "rgba(255,255,255,.05)",
        };

  return (
    <span
      style={{
        ...style,
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

function StatCard({
  title,
  value,
  subtitle,
  accent = C.primary,
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div style={{ color: C.muted, fontSize: 12 }}>
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 29,
          fontWeight: 850,
          marginTop: 8,
        }}
      >
        {value ?? 0}
      </div>

      <div
        style={{
          color: C.muted,
          fontSize: 12,
          marginTop: 5,
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
        color: C.muted,
        border: `1px dashed ${C.border}`,
        borderRadius: 12,
        padding: 25,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function WorkforcePlanningPage() {
  const currentYear = new Date().getFullYear();

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [plans, setPlans] = useState([]);
  const [lines, setLines] = useState([]);
  const [summary, setSummary] = useState({});

  const [selectedPlanId, setSelectedPlanId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [planForm, setPlanForm] = useState({
    year: String(currentYear),
    name: `Workforce Plan ${currentYear}`,
    version: "1",
    created_by: "",
    notes: "",
  });

  const [lineForm, setLineForm] = useState({
    department_id: "",
    position_id: "",

    is_new_position: false,

    proposed_position_code: "",
    proposed_position_title: "",
    proposed_grade: "",
    proposed_employment_type: "",

    hire_type: "new_hire",
    replacement_employee_id: "",

    approved_headcount: "1",
    planned_hires: "1",
    planned_exits: "0",

    priority: "medium",
    target_hiring_date: "",

    min_salary: "0",
    mid_salary: "0",
    max_salary: "0",

    budget_scenario: "mid",

    justification: "",
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

  async function loadBase() {
    try {
      setLoading(true);
      setError("");

      const [d, p, e, w] = await Promise.all([
        api("/api/hr/departments"),
        api("/api/hr/positions"),
        api("/api/hr/employees"),
        api("/api/hr/workforce-plans"),
      ]);

      setDepartments(
        Array.isArray(d) ? d : []
      );

      setPositions(
        Array.isArray(p) ? p : []
      );

      setEmployees(
        Array.isArray(e) ? e : []
      );

      setPlans(
        Array.isArray(w) ? w : []
      );

      if (
        !selectedPlanId &&
        Array.isArray(w) &&
        w.length > 0
      ) {
        setSelectedPlanId(w[0].id);
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load Workforce Planning data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedPlan(planId) {
    if (!planId) {
      setLines([]);
      setSummary({});
      return;
    }

    try {
      setError("");

      const [l, s] = await Promise.all([
        api(
          `/api/hr/workforce-plan-lines?plan_id=${encodeURIComponent(
            planId
          )}`
        ),
        api(
          `/api/hr/workforce-planning/summary?plan_id=${encodeURIComponent(
            planId
          )}`
        ),
      ]);

      setLines(
        Array.isArray(l) ? l : []
      );

      setSummary(s || {});
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load selected Workforce Plan"
      );
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    loadSelectedPlan(selectedPlanId);
  }, [selectedPlanId]);

  const selectedPlan = useMemo(
    () =>
      plans.find(
        (row) => row.id === selectedPlanId
      ) || null,
    [plans, selectedPlanId]
  );

  const departmentMap = useMemo(
    () =>
      Object.fromEntries(
        departments.map((row) => [
          row.id,
          departmentName(row),
        ])
      ),
    [departments]
  );

  const positionMap = useMemo(
    () =>
      Object.fromEntries(
        positions.map((row) => [
          row.id,
          positionName(row),
        ])
      ),
    [positions]
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

  const filteredPositions = useMemo(
    () =>
      positions.filter(
        (row) =>
          row.is_active &&
          (!lineForm.department_id ||
            row.department_id ===
              lineForm.department_id)
      ),
    [positions, lineForm.department_id]
  );

  async function createPlan(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await api(
        "/api/hr/workforce-plans",
        {
          method: "POST",
          body: JSON.stringify({
            year: Number(planForm.year),
            name: planForm.name.trim(),
            version: Number(
              planForm.version || 1
            ),
            created_by:
              planForm.created_by.trim() ||
              null,
            notes:
              planForm.notes.trim() ||
              null,
          }),
        }
      );

      setMessage(
        "Workforce Plan created successfully."
      );

      await loadBase();

      setSelectedPlanId(result.id);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create Workforce Plan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePlanStatus(status) {
    if (!selectedPlan) return;

    const actor = window.prompt(
      "Actor / المعتمد أو المنفذ:",
      "HR"
    );

    if (!actor) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/workforce-plans/${selectedPlan.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
            actor: actor.trim(),
            notes: null,
          }),
        }
      );

      setMessage(
        `Workforce Plan status updated to ${status}.`
      );

      await loadBase();
      await loadSelectedPlan(
        selectedPlan.id
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update Workforce Plan status"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createLine(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!selectedPlanId) {
        throw new Error(
          "Create or select a Workforce Plan first"
        );
      }

      if (!lineForm.department_id) {
        throw new Error(
          "Select a department"
        );
      }

      if (
        !lineForm.is_new_position &&
        !lineForm.position_id
      ) {
        throw new Error(
          "Select an existing position"
        );
      }

      if (
        lineForm.is_new_position &&
        !lineForm.proposed_position_title.trim()
      ) {
        throw new Error(
          "Proposed position title is required"
        );
      }

      await api(
        "/api/hr/workforce-plan-lines",
        {
          method: "POST",
          body: JSON.stringify({
            plan_id: selectedPlanId,
            department_id:
              lineForm.department_id,

            position_id:
              lineForm.is_new_position
                ? null
                : lineForm.position_id,

            is_new_position:
              lineForm.is_new_position,

            proposed_position_code:
              lineForm.is_new_position
                ? lineForm.proposed_position_code.trim() ||
                  null
                : null,

            proposed_position_title:
              lineForm.is_new_position
                ? lineForm.proposed_position_title.trim()
                : null,

            proposed_grade:
              lineForm.is_new_position
                ? lineForm.proposed_grade.trim() ||
                  null
                : null,

            proposed_employment_type:
              lineForm.is_new_position
                ? lineForm.proposed_employment_type.trim() ||
                  null
                : null,

            hire_type:
              lineForm.hire_type,

            replacement_employee_id:
              lineForm.hire_type ===
                "replacement" &&
              lineForm.replacement_employee_id
                ? lineForm.replacement_employee_id
                : null,

            approved_headcount:
              Number(
                lineForm.approved_headcount ||
                  0
              ),

            planned_hires:
              Number(
                lineForm.planned_hires ||
                  0
              ),

            planned_exits:
              Number(
                lineForm.planned_exits ||
                  0
              ),

            priority:
              lineForm.priority,

            target_hiring_date:
              lineForm.target_hiring_date ||
              null,

            min_salary:
              lineForm.is_new_position
                ? Number(
                    lineForm.min_salary ||
                      0
                  )
                : null,

            mid_salary:
              lineForm.is_new_position
                ? Number(
                    lineForm.mid_salary ||
                      0
                  )
                : null,

            max_salary:
              lineForm.is_new_position
                ? Number(
                    lineForm.max_salary ||
                      0
                  )
                : null,

            budget_scenario:
              lineForm.budget_scenario,

            justification:
              lineForm.justification.trim() ||
              null,

            notes:
              lineForm.notes.trim() ||
              null,
          }),
        }
      );

      setMessage(
        "Workforce Plan line added."
      );

      setLineForm({
        department_id: "",
        position_id: "",
        is_new_position: false,
        proposed_position_code: "",
        proposed_position_title: "",
        proposed_grade: "",
        proposed_employment_type: "",
        hire_type: "new_hire",
        replacement_employee_id: "",
        approved_headcount: "1",
        planned_hires: "1",
        planned_exits: "0",
        priority: "medium",
        target_hiring_date: "",
        min_salary: "0",
        mid_salary: "0",
        max_salary: "0",
        budget_scenario: "mid",
        justification: "",
        notes: "",
      });

      await loadSelectedPlan(
        selectedPlanId
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to add Workforce Plan line"
      );
    } finally {
      setSaving(false);
    }
  }

  async function editLine(row) {
    const approved = window.prompt(
      "Approved Headcount:",
      String(row.approved_headcount)
    );

    if (approved === null) return;

    const hires = window.prompt(
      "Planned Hires:",
      String(row.planned_hires)
    );

    if (hires === null) return;

    const exits = window.prompt(
      "Planned Exits:",
      String(row.planned_exits)
    );

    if (exits === null) return;

    const scenario = window.prompt(
      "Budget Scenario: min / mid / max",
      row.budget_scenario
    );

    if (!scenario) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/workforce-plan-lines/${row.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            approved_headcount:
              Number(approved),
            planned_hires:
              Number(hires),
            planned_exits:
              Number(exits),
            budget_scenario:
              scenario.trim(),
          }),
        }
      );

      setMessage(
        "Workforce Plan line updated."
      );

      await loadSelectedPlan(
        selectedPlanId
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update Workforce Plan line"
      );
    } finally {
      setSaving(false);
    }
  }

  const planEditable =
    selectedPlan &&
    ["draft", "submitted"].includes(
      selectedPlan.status
    );

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
          maxWidth: 1600,
          margin: "0 auto",
        }}
      >
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
            margin: "13px 0 5px",
            fontSize: 31,
          }}
        >
          Workforce Planning & Manpower
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 22,
          }}
        >
          تخطيط القوى العاملة والاحتياج الوظيفي
        </div>

        {error ? (
          <div
            style={{
              color: C.danger,
              background:
                "rgba(255,107,107,.08)",
              padding: 13,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              color: C.primary,
              background:
                "rgba(24,213,183,.08)",
              padding: 13,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px,1fr))",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Current Headcount"
            value={
              summary.current_headcount ||
              0
            }
            subtitle="القوى العاملة الحالية"
          />

          <StatCard
            title="Approved Headcount"
            value={
              summary.approved_headcount ||
              0
            }
            subtitle="العدد المعتمد"
            accent={C.blue}
          />

          <StatCard
            title="Vacancies"
            value={
              summary.vacancies || 0
            }
            subtitle="الشواغر الحالية"
            accent={C.warning}
          />

          <StatCard
            title="Planned Hires"
            value={
              summary.planned_hires || 0
            }
            subtitle="التوظيف المخطط"
          />

          <StatCard
            title="Planned Exits"
            value={
              summary.planned_exits || 0
            }
            subtitle="الخروج المخطط"
            accent={C.danger}
          />

          <StatCard
            title="New Positions"
            value={
              summary.new_positions || 0
            }
            subtitle="مناصب جديدة"
            accent={C.blue}
          />

          <StatCard
            title="Annual Hiring Budget"
            value={`${money(
              summary.annual_hiring_budget
            )} SAR`}
            subtitle="ميزانية التوظيف السنوية"
            accent={C.warning}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(430px,1fr))",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <form
            onSubmit={createPlan}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Create Workforce Plan
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0,1fr))",
                gap: 11,
              }}
            >
              <div>
                <label style={label}>
                  Year
                </label>

                <input
                  style={input}
                  type="number"
                  value={planForm.year}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      year: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>
                  Version
                </label>

                <input
                  style={input}
                  type="number"
                  min="1"
                  value={planForm.version}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      version:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 11 }}>
              <label style={label}>
                Plan Name
              </label>

              <input
                style={input}
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div style={{ marginTop: 11 }}>
              <label style={label}>
                Created By
              </label>

              <input
                style={input}
                value={
                  planForm.created_by
                }
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    created_by:
                      e.target.value,
                  })
                }
              />
            </div>

            <textarea
              style={{
                ...input,
                minHeight: 65,
                marginTop: 11,
              }}
              placeholder="Notes"
              value={planForm.notes}
              onChange={(e) =>
                setPlanForm({
                  ...planForm,
                  notes: e.target.value,
                })
              }
            />

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
              }}
            >
              Create Plan
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
              Current Workforce Plan
            </h3>

            {plans.length === 0 ? (
              <Empty>
                No Workforce Plans yet
                <br />
                لا توجد خطة قوى عاملة
              </Empty>
            ) : (
              <>
                <label style={label}>
                  Select Plan
                </label>

                <select
                  style={input}
                  value={selectedPlanId}
                  onChange={(e) =>
                    setSelectedPlanId(
                      e.target.value
                    )
                  }
                >
                  {plans.map((row) => (
                    <option
                      key={row.id}
                      value={row.id}
                    >
                      {row.year} • V
                      {row.version} •{" "}
                      {row.name}
                    </option>
                  ))}
                </select>

                {selectedPlan ? (
                  <div
                    style={{
                      marginTop: 14,
                      background: C.soft,
                      borderRadius: 11,
                      padding: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>
                        {selectedPlan.name}
                      </strong>

                      <Badge>
                        {selectedPlan.status}
                      </Badge>
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      Year:{" "}
                      {selectedPlan.year}
                      {" • "}
                      Version:{" "}
                      {selectedPlan.version}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 7,
                        marginTop: 12,
                      }}
                    >
                      {selectedPlan.status ===
                      "draft" ? (
                        <button
                          disabled={saving}
                          onClick={() =>
                            changePlanStatus(
                              "submitted"
                            )
                          }
                        >
                          Submit
                        </button>
                      ) : null}

                      {selectedPlan.status ===
                      "submitted" ? (
                        <>
                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "approved"
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "draft"
                              )
                            }
                          >
                            Return to Draft
                          </button>
                        </>
                      ) : null}

                      {selectedPlan.status ===
                      "approved" ? (
                        <>
                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "frozen"
                              )
                            }
                          >
                            Freeze
                          </button>

                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "closed"
                              )
                            }
                          >
                            Close
                          </button>
                        </>
                      ) : null}

                      {selectedPlan.status ===
                      "frozen" ? (
                        <>
                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "approved"
                              )
                            }
                          >
                            Unfreeze
                          </button>

                          <button
                            disabled={saving}
                            onClick={() =>
                              changePlanStatus(
                                "closed"
                              )
                            }
                          >
                            Close
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        <form
          onSubmit={createLine}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            opacity:
              planEditable ? 1 : 0.75,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Add Manpower Requirement
          </h3>

          {!selectedPlan ? (
            <div
              style={{
                color: C.warning,
                marginBottom: 12,
              }}
            >
              Create or select a Workforce
              Plan first.
            </div>
          ) : null}

          {selectedPlan &&
          !planEditable ? (
            <div
              style={{
                color: C.warning,
                marginBottom: 12,
              }}
            >
              This plan is {selectedPlan.status}.
              Lines are locked.
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 13,
            }}
          >
            <input
              type="checkbox"
              checked={
                lineForm.is_new_position
              }
              onChange={(e) =>
                setLineForm({
                  ...lineForm,
                  is_new_position:
                    e.target.checked,
                  position_id: "",
                })
              }
            />

            <strong>
              New Position Request
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px,1fr))",
              gap: 11,
            }}
          >
            <div>
              <label style={label}>
                Department
              </label>

              <select
                style={input}
                value={
                  lineForm.department_id
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    department_id:
                      e.target.value,
                    position_id: "",
                  })
                }
              >
                <option value="">
                  Select department...
                </option>

                {departments
                  .filter(
                    (row) =>
                      row.is_active
                  )
                  .map((row) => (
                    <option
                      key={row.id}
                      value={row.id}
                    >
                      {departmentName(row)}
                    </option>
                  ))}
              </select>
            </div>

            {!lineForm.is_new_position ? (
              <div>
                <label style={label}>
                  Existing Position
                </label>

                <select
                  style={input}
                  value={
                    lineForm.position_id
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      position_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select position...
                  </option>

                  {filteredPositions.map(
                    (row) => (
                      <option
                        key={row.id}
                        value={row.id}
                      >
                        {positionName(row)}
                      </option>
                    )
                  )}
                </select>
              </div>
            ) : null}

            <div>
              <label style={label}>
                Hire Type
              </label>

              <select
                style={input}
                value={lineForm.hire_type}
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    hire_type:
                      e.target.value,
                  })
                }
              >
                <option value="new_hire">
                  New Hire
                </option>
                <option value="replacement">
                  Replacement
                </option>
                <option value="expansion">
                  Expansion
                </option>
              </select>
            </div>

            {lineForm.hire_type ===
            "replacement" ? (
              <div>
                <label style={label}>
                  Employee Being Replaced
                </label>

                <select
                  style={input}
                  value={
                    lineForm.replacement_employee_id
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      replacement_employee_id:
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
            ) : null}

            <div>
              <label style={label}>
                Approved Headcount
              </label>

              <input
                style={input}
                type="number"
                min="0"
                value={
                  lineForm.approved_headcount
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    approved_headcount:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>
                Planned Hires
              </label>

              <input
                style={input}
                type="number"
                min="0"
                value={
                  lineForm.planned_hires
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    planned_hires:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>
                Planned Exits
              </label>

              <input
                style={input}
                type="number"
                min="0"
                value={
                  lineForm.planned_exits
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    planned_exits:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>
                Priority
              </label>

              <select
                style={input}
                value={lineForm.priority}
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    priority:
                      e.target.value,
                  })
                }
              >
                <option value="low">
                  Low
                </option>
                <option value="medium">
                  Medium
                </option>
                <option value="high">
                  High
                </option>
                <option value="critical">
                  Critical
                </option>
              </select>
            </div>

            <div>
              <label style={label}>
                Target Hiring Date
              </label>

              <input
                style={input}
                type="date"
                value={
                  lineForm.target_hiring_date
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    target_hiring_date:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label style={label}>
                Budget Scenario
              </label>

              <select
                style={input}
                value={
                  lineForm.budget_scenario
                }
                onChange={(e) =>
                  setLineForm({
                    ...lineForm,
                    budget_scenario:
                      e.target.value,
                  })
                }
              >
                <option value="min">
                  Minimum
                </option>
                <option value="mid">
                  Midpoint
                </option>
                <option value="max">
                  Maximum
                </option>
              </select>
            </div>
          </div>

          {lineForm.is_new_position ? (
            <div
              style={{
                marginTop: 15,
                padding: 14,
                background: C.soft,
                borderRadius: 11,
              }}
            >
              <h4 style={{ marginTop: 0 }}>
                Proposed New Position
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px,1fr))",
                  gap: 10,
                }}
              >
                <input
                  style={input}
                  placeholder="Position Code"
                  value={
                    lineForm.proposed_position_code
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      proposed_position_code:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Position Title"
                  value={
                    lineForm.proposed_position_title
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      proposed_position_title:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Grade"
                  value={
                    lineForm.proposed_grade
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      proposed_grade:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Employment Type"
                  value={
                    lineForm.proposed_employment_type
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      proposed_employment_type:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="number"
                  min="0"
                  placeholder="Min Salary"
                  value={
                    lineForm.min_salary
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      min_salary:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="number"
                  min="0"
                  placeholder="Mid Salary"
                  value={
                    lineForm.mid_salary
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      mid_salary:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="number"
                  min="0"
                  placeholder="Max Salary"
                  value={
                    lineForm.max_salary
                  }
                  onChange={(e) =>
                    setLineForm({
                      ...lineForm,
                      max_salary:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          <textarea
            style={{
              ...input,
              minHeight: 70,
              marginTop: 12,
            }}
            placeholder="Business Justification / مبررات الاحتياج"
            value={
              lineForm.justification
            }
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                justification:
                  e.target.value,
              })
            }
          />

          <textarea
            style={{
              ...input,
              minHeight: 60,
              marginTop: 11,
            }}
            placeholder="Notes"
            value={lineForm.notes}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                notes: e.target.value,
              })
            }
          />

          <button
            disabled={
              saving || !planEditable
            }
            type="submit"
            style={{
              marginTop: 12,
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 9,
              padding: "10px 14px",
              fontWeight: 800,
            }}
          >
            Add Requirement
          </button>
        </form>

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Manpower Requirements
          </h3>

          {lines.length === 0 ? (
            <Empty>
              No manpower requirements yet
              <br />
              لا توجد احتياجات وظيفية
            </Empty>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 9,
              }}
            >
              {lines.map((row) => (
                <div
                  key={row.id}
                  style={{
                    background: C.soft,
                    borderRadius: 11,
                    padding: 13,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {row.is_new_position
                          ? row.proposed_position_title ||
                            "New Position"
                          : positionMap[
                              row.position_id
                            ] ||
                            row.position_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {departmentMap[
                          row.department_id
                        ] ||
                          row.department_id}
                        {" • "}
                        {row.hire_type.replaceAll(
                          "_",
                          " "
                        )}
                        {" • "}
                        Priority:{" "}
                        {row.priority}
                      </div>
                    </div>

                    <Badge>
                      {row.status}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px,1fr))",
                      gap: 9,
                      marginTop: 12,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Current HC
                      </span>
                      <div>
                        {row.actual_headcount_now ??
                          row.current_headcount}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Approved HC
                      </span>
                      <div>
                        {row.approved_headcount}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Vacancy
                      </span>
                      <div
                        style={{
                          color: C.warning,
                        }}
                      >
                        {row.current_vacancy_now ??
                          row.vacancy}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Planned Hires
                      </span>
                      <div>
                        {row.planned_hires}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Planned Exits
                      </span>
                      <div>
                        {row.planned_exits}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Projected HC
                      </span>
                      <div>
                        {row.projected_headcount}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Scenario
                      </span>
                      <div>
                        {row.budget_scenario}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Monthly Salary
                      </span>
                      <div>
                        {money(
                          row.budgeted_monthly_salary
                        )}{" "}
                        SAR
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Annual Hiring Budget
                      </span>
                      <div
                        style={{
                          color: C.primary,
                          fontWeight: 800,
                        }}
                      >
                        {money(
                          row.budgeted_annual_salary
                        )}{" "}
                        SAR
                      </div>
                    </div>
                  </div>

                  {row.hire_type ===
                    "replacement" &&
                  row.replacement_employee_id ? (
                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 9,
                      }}
                    >
                      Replacement for:{" "}
                      {employeeMap[
                        row.replacement_employee_id
                      ] ||
                        row.replacement_employee_id}
                    </div>
                  ) : null}

                  {planEditable ? (
                    <button
                      disabled={saving}
                      onClick={() =>
                        editLine(row)
                      }
                      style={{
                        marginTop: 10,
                      }}
                    >
                      Edit Planning Values
                    </button>
                  ) : null}
                </div>
              ))}
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
          <h3 style={{ marginTop: 0 }}>
            Department Summary
          </h3>

          {!summary.department_summary ||
          summary.department_summary.length ===
            0 ? (
            <Empty>
              No department planning data
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
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: 9 }}>
                      Department
                    </th>
                    <th style={{ padding: 9 }}>
                      Current
                    </th>
                    <th style={{ padding: 9 }}>
                      Approved
                    </th>
                    <th style={{ padding: 9 }}>
                      Vacancies
                    </th>
                    <th style={{ padding: 9 }}>
                      Hires
                    </th>
                    <th style={{ padding: 9 }}>
                      Exits
                    </th>
                    <th style={{ padding: 9 }}>
                      Projected
                    </th>
                    <th style={{ padding: 9 }}>
                      Annual Budget
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.department_summary.map(
                    (row) => (
                      <tr
                        key={
                          row.department_id
                        }
                        style={{
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {departmentMap[
                            row.department_id
                          ] ||
                            row.department_id}
                        </td>

                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {row.current_headcount}
                        </td>

                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {row.approved_headcount}
                        </td>

                        <td
                          style={{
                            padding: 9,
                            color: C.warning,
                          }}
                        >
                          {row.vacancies}
                        </td>

                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {row.planned_hires}
                        </td>

                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {row.planned_exits}
                        </td>

                        <td
                          style={{
                            padding: 9,
                          }}
                        >
                          {row.projected_headcount}
                        </td>

                        <td
                          style={{
                            padding: 9,
                            color: C.primary,
                            fontWeight: 800,
                          }}
                        >
                          {money(
                            row.annual_hiring_budget
                          )}{" "}
                          SAR
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
