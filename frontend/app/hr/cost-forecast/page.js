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

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function pct(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
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
          fontSize: 28,
          fontWeight: 850,
          marginTop: 8,
        }}
      >
        {value}
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

function ScenarioCard({
  title,
  data,
  selected = false,
}) {
  const variance = Number(
    data?.variance_vs_current || 0
  );

  const varianceColor =
    variance > 0
      ? C.warning
      : variance < 0
      ? C.primary
      : C.muted;

  return (
    <div
      style={{
        background: selected ? C.soft : C.panel,
        border: selected
          ? `1px solid ${C.primary}`
          : `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <strong>{title}</strong>

        {selected ? (
          <span
            style={{
              color: C.primary,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            PLAN
          </span>
        ) : null}
      </div>

      <div
        style={{
          color: C.primary,
          fontSize: 25,
          fontWeight: 850,
          marginTop: 10,
        }}
      >
        {money(data?.projected_annual_cost)} SAR
      </div>

      <div
        style={{
          display: "grid",
          gap: 6,
          marginTop: 13,
          fontSize: 12,
          color: C.muted,
        }}
      >
        <div>
          Planned Hire Cost:{" "}
          <strong style={{ color: C.text }}>
            {money(
              data?.planned_hires
                ?.annual_total_cost
            )}{" "}
            SAR
          </strong>
        </div>

        <div>
          Exit Reduction:{" "}
          <strong style={{ color: C.primary }}>
            -{" "}
            {money(
              data?.planned_exit_reduction
            )}{" "}
            SAR
          </strong>
        </div>

        <div>
          Variance vs Current:{" "}
          <strong style={{ color: varianceColor }}>
            {variance > 0 ? "+" : ""}
            {money(variance)} SAR
          </strong>
        </div>

        <div>
          Variance %:{" "}
          <strong style={{ color: varianceColor }}>
            {pct(data?.variance_pct)}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default function HRCostForecastPage() {
  const [departments, setDepartments] =
    useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] =
    useState("");
  const [forecast, setForecast] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  async function api(path) {
    const response = await fetch(path, {
      cache: "no-store",
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
      setError("");

      const [d, p] = await Promise.all([
        api("/api/hr/departments"),
        api("/api/hr/workforce-plans"),
      ]);

      setDepartments(
        Array.isArray(d) ? d : []
      );

      setPlans(
        Array.isArray(p) ? p : []
      );

      if (
        !selectedPlanId &&
        Array.isArray(p) &&
        p.length > 0
      ) {
        setSelectedPlanId(p[0].id);
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load forecast base data"
      );
    }
  }

  async function loadForecast(planId) {
    try {
      setLoading(true);
      setError("");

      const path = planId
        ? `/api/hr/cost-forecast?plan_id=${encodeURIComponent(
            planId
          )}`
        : "/api/hr/cost-forecast";

      const data = await api(path);

      setForecast(data || null);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load HR Cost Forecast"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    loadForecast(selectedPlanId);
  }, [selectedPlanId]);

  const departmentMap = useMemo(
    () =>
      Object.fromEntries(
        departments.map((row) => [
          row.id,
          row.name_ar ||
            row.name_en ||
            row.code ||
            row.id,
        ])
      ),
    [departments]
  );

  const current =
    forecast?.current_workforce || {};

  const scenarios =
    forecast?.scenarios || {};

  const assumptions =
    forecast?.planning_assumptions || {};

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
          HR Cost Forecast
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 7,
          }}
        >
          توقعات تكلفة الموارد البشرية
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          Dynamic forecast from active employees,
          contracts, Benefits & Insurance and
          Workforce Planning.
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

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 15,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Workforce Plan</strong>

              <div
                style={{
                  color: C.muted,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                اختر الخطة المستخدمة في التوقع
              </div>
            </div>

            {plans.length === 0 ? (
              <div style={{ color: C.warning }}>
                No Workforce Plan available
              </div>
            ) : (
              <select
                value={selectedPlanId}
                onChange={(e) =>
                  setSelectedPlanId(
                    e.target.value
                  )
                }
                style={{
                  minWidth: 320,
                  background: C.soft,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {plans.map((row) => (
                  <option
                    key={row.id}
                    value={row.id}
                  >
                    {row.year} • V{row.version} •{" "}
                    {row.name} • {row.status}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px,1fr))",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Active Employees"
            value={
              current.active_employees || 0
            }
            subtitle="الموظفون الفعليون"
          />

          <StatCard
            title="Current Annual Workforce Cost"
            value={`${money(
              current.annual_total_cost
            )} SAR`}
            subtitle="التكلفة السنوية الحالية"
            accent={C.blue}
          />

          <StatCard
            title="Annual Salaries"
            value={`${money(
              current.annual_salary
            )} SAR`}
            subtitle="الرواتب والبدلات الثابتة"
          />

          <StatCard
            title="Employer GOSI"
            value={`${money(
              current.annual_employer_gosi
            )} SAR`}
            subtitle="تكلفة التأمينات على الشركة"
            accent={C.warning}
          />

          <StatCard
            title="Benefits"
            value={`${money(
              current.annual_benefits
            )} SAR`}
            subtitle="تكلفة المزايا والتأمين"
          />

          <StatCard
            title="Other Annual Costs"
            value={`${money(
              current.annual_other_cost
            )} SAR`}
            subtitle="تكاليف سنوية أخرى"
            accent={C.warning}
          />
        </div>

        <section
          style={{
            marginBottom: 20,
          }}
        >
          <h3>Forecast Scenarios</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px,1fr))",
              gap: 13,
            }}
          >
            <ScenarioCard
              title="Minimum Scenario"
              data={scenarios.min}
            />

            <ScenarioCard
              title="Midpoint Scenario"
              data={scenarios.mid}
            />

            <ScenarioCard
              title="Maximum Scenario"
              data={scenarios.max}
            />

            <ScenarioCard
              title="Selected Workforce Plan"
              data={scenarios.selected_plan}
              selected
            />
          </div>
        </section>

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
            Current Cost Mix
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px,1fr))",
              gap: 12,
            }}
          >
            <StatCard
              title="Salary %"
              value={pct(
                forecast
                  ?.current_cost_mix_pct
                  ?.salary
              )}
              subtitle="من إجمالي التكلفة الحالية"
            />

            <StatCard
              title="Employer GOSI %"
              value={pct(
                forecast
                  ?.current_cost_mix_pct
                  ?.employer_gosi
              )}
              subtitle="من إجمالي التكلفة الحالية"
              accent={C.warning}
            />

            <StatCard
              title="Benefits %"
              value={pct(
                forecast
                  ?.current_cost_mix_pct
                  ?.benefits
              )}
              subtitle="من إجمالي التكلفة الحالية"
              accent={C.blue}
            />

            <StatCard
              title="Other Cost %"
              value={pct(
                forecast
                  ?.current_cost_mix_pct
                  ?.other
              )}
              subtitle="من إجمالي التكلفة الحالية"
            />
          </div>
        </section>

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
            Department Forecast
          </h3>

          {!forecast?.department_breakdown ||
          forecast.department_breakdown.length ===
            0 ? (
            <div
              style={{
                color: C.muted,
                border: `1px dashed ${C.border}`,
                borderRadius: 12,
                padding: 25,
                textAlign: "center",
              }}
            >
              No department forecast data
              <br />
              لا توجد بيانات توقعات حسب الإدارات
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
                    <th style={{ padding: 9 }}>
                      Department
                    </th>
                    <th style={{ padding: 9 }}>
                      Current Employees
                    </th>
                    <th style={{ padding: 9 }}>
                      Current Cost
                    </th>
                    <th style={{ padding: 9 }}>
                      Hires
                    </th>
                    <th style={{ padding: 9 }}>
                      Exits
                    </th>
                    <th style={{ padding: 9 }}>
                      Min
                    </th>
                    <th style={{ padding: 9 }}>
                      Mid
                    </th>
                    <th style={{ padding: 9 }}>
                      Max
                    </th>
                    <th style={{ padding: 9 }}>
                      Selected
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {forecast.department_breakdown.map(
                    (row) => (
                      <tr
                        key={
                          row.department_id
                        }
                        style={{
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <td style={{ padding: 9 }}>
                          {departmentMap[
                            row.department_id
                          ] ||
                            row.department_id}
                        </td>

                        <td style={{ padding: 9 }}>
                          {row.current_employees}
                        </td>

                        <td style={{ padding: 9 }}>
                          {money(
                            row.current_annual_cost
                          )}{" "}
                          SAR
                        </td>

                        <td style={{ padding: 9 }}>
                          {row.planned_hires}
                        </td>

                        <td style={{ padding: 9 }}>
                          {row.planned_exits}
                        </td>

                        <td style={{ padding: 9 }}>
                          {money(
                            row.min_projected_cost
                          )}
                        </td>

                        <td style={{ padding: 9 }}>
                          {money(
                            row.mid_projected_cost
                          )}
                        </td>

                        <td style={{ padding: 9 }}>
                          {money(
                            row.max_projected_cost
                          )}
                        </td>

                        <td
                          style={{
                            padding: 9,
                            color: C.primary,
                            fontWeight: 800,
                          }}
                        >
                          {money(
                            row.selected_projected_cost
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

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Forecast Assumptions
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px,1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                background: C.soft,
                padding: 13,
                borderRadius: 10,
              }}
            >
              Employer GOSI Ratio
              <strong
                style={{
                  display: "block",
                  marginTop: 6,
                }}
              >
                {pct(
                  assumptions.company_employer_gosi_ratio_pct
                )}
              </strong>
            </div>

            <div
              style={{
                background: C.soft,
                padding: 13,
                borderRadius: 10,
              }}
            >
              Avg Annual Benefit / Employee
              <strong
                style={{
                  display: "block",
                  marginTop: 6,
                }}
              >
                {money(
                  assumptions.company_avg_annual_benefit
                )}{" "}
                SAR
              </strong>
            </div>

            <div
              style={{
                background: C.soft,
                padding: 13,
                borderRadius: 10,
              }}
            >
              Avg Other Annual Cost / Employee
              <strong
                style={{
                  display: "block",
                  marginTop: 6,
                }}
              >
                {money(
                  assumptions.company_avg_annual_other_cost
                )}{" "}
                SAR
              </strong>
            </div>

            <div
              style={{
                background: C.soft,
                padding: 13,
                borderRadius: 10,
              }}
            >
              Forecast Basis
              <strong
                style={{
                  display: "block",
                  marginTop: 6,
                }}
              >
                {assumptions.forecast_basis ||
                  "Annualized run-rate"}
              </strong>
            </div>
          </div>

          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginTop: 15,
              lineHeight: 1.7,
            }}
          >
            Benefits Source:{" "}
            {assumptions.benefits_source || "—"}
            <br />
            Planned Hire GOSI:{" "}
            {assumptions.planned_hire_gosi_method ||
              "—"}
            <br />
            Planned Hire Benefits:{" "}
            {assumptions.planned_hire_benefits_method ||
              "—"}
            <br />
            Planned Exit Method:{" "}
            {assumptions.planned_exit_method ||
              "—"}
          </div>
        </section>
      </div>
    </main>
  );
}
