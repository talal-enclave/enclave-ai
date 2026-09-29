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

function number(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function pct(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
}

function score(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return Number(value).toFixed(2);
}

function Card({
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
        borderRadius: 17,
        padding: 17,
      }}
    >
      <div
        style={{
          color: C.muted,
          fontSize: 11,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 26,
          fontWeight: 850,
          marginTop: 7,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: C.muted,
          fontSize: 11,
          marginTop: 5,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function Section({
  title,
  arabic,
  children,
}) {
  return (
    <section
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 19,
      }}
    >
      <div
        style={{
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
          }}
        >
          {title}
        </h3>

        {arabic ? (
          <div
            style={{
              color: C.muted,
              fontSize: 11,
              marginTop: 4,
            }}
          >
            {arabic}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function Grid({
  children,
  min = 170,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          `repeat(auto-fit, minmax(${min}px,1fr))`,
        gap: 11,
      }}
    >
      {children}
    </div>
  );
}

function MiniRow({
  label,
  value,
  accent,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        background: C.soft,
        borderRadius: 9,
        padding: "9px 10px",
        fontSize: 12,
      }}
    >
      <span style={{ color: C.muted }}>
        {label}
      </span>

      <strong
        style={{
          color: accent || C.text,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default function MonthlyHRDashboardPage() {
  const now = new Date();

  const initialMonth =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

  const [monthValue, setMonthValue] =
    useState(initialMonth);

  const [data, setData] =
    useState(null);

  const [current, setCurrent] =
    useState({
      talent: {},
      workforce: {},
      policies: {},
      compliance: {},
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function api(path) {
    const response = await fetch(path, {
      cache: "no-store",
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(
        body?.detail ||
          `Request failed: ${response.status}`
      );
    }

    return body;
  }

  async function loadMonthly() {
    try {
      setLoading(true);
      setError("");

      const [year, month] =
        monthValue.split("-");

      const result = await api(
        `/api/hr/monthly-dashboard?year=${year}&month=${Number(month)}`
      );

      setData(result);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load monthly HR dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentSnapshot() {
    try {
      const [
        talent,
        workforce,
        policies,
        compliance,
      ] = await Promise.all([
        api("/api/hr/talent/summary"),
        api("/api/hr/workforce-planning/summary"),
        api("/api/hr/policies-compliance/summary"),
        api("/api/hr/government-compliance/summary"),
      ]);

      setCurrent({
        talent: talent || {},
        workforce: workforce || {},
        policies: policies || {},
        compliance: compliance || {},
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load current HR snapshot"
      );
    }
  }

  useEffect(() => {
    loadCurrentSnapshot();
  }, []);

  useEffect(() => {
    loadMonthly();
  }, [monthValue]);

  const monthLabel = useMemo(() => {
    if (!data?.period) {
      return "";
    }

    return new Date(
      data.period.year,
      data.period.month - 1,
      1
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );
  }, [data]);

  const w = data?.workforce || {};
  const r = data?.recruitment || {};
  const p = data?.payroll || {};
  const ep = data?.employee_payments || {};
  const l = data?.leave || {};
  const pf = data?.performance || {};
  const t = data?.training || {};
  const er = data?.employee_relations || {};
  const gc = data?.government_compliance || {};
  const cal = data?.calendar || {};
  const cn = data?.confidential_notes || {};
  const dq = data?.data_quality || {};

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
          maxWidth: 1700,
          margin: "0 auto",
        }}
      >
        <a
          href="/hr"
          style={{
            color: C.muted,
            textDecoration: "none",
            fontSize: 12,
          }}
        >
          ← HR Workspace
        </a>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "end",
            flexWrap: "wrap",
            marginTop: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 5px",
                fontSize: 31,
              }}
            >
              Monthly HR Dashboard
            </h1>

            <div
              style={{
                color: C.muted,
              }}
            >
              لوحة الموارد البشرية الشهرية
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 6,
              }}
            >
              Historical monthly HR metrics from
              operational source records.
            </div>
          </div>

          <div>
            <div
              style={{
                color: C.muted,
                fontSize: 11,
                marginBottom: 5,
              }}
            >
              Reporting Month
            </div>

            <input
              type="month"
              value={monthValue}
              onChange={(e) =>
                setMonthValue(
                  e.target.value
                )
              }
              style={{
                background: C.panel,
                color: C.text,
                border:
                  `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 13px",
              }}
            />
          </div>
        </div>

        {error ? (
          <div
            style={{
              color: C.danger,
              background:
                "rgba(255,107,107,.08)",
              border:
                `1px solid ${C.danger}33`,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              color: C.muted,
              padding: 30,
              textAlign: "center",
            }}
          >
            Loading Monthly HR Dashboard...
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <div
              style={{
                background: C.soft,
                border:
                  `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "10px 13px",
                marginBottom: 15,
                display: "flex",
                justifyContent:
                  "space-between",
                flexWrap: "wrap",
                gap: 10,
                fontSize: 12,
              }}
            >
              <strong>
                {monthLabel}
              </strong>

              <span style={{ color: C.muted }}>
                {data.period.start_date}
                {" → "}
                {data.period.end_date}
              </span>
            </div>

            <Grid min={180}>
              <Card
                title="Opening Headcount"
                value={number(
                  w.opening_headcount
                )}
                subtitle="عدد الموظفين بداية الشهر"
                accent={C.blue}
              />

              <Card
                title="Hires"
                value={number(w.hires)}
                subtitle="التعيينات خلال الشهر"
              />

              <Card
                title="Exits"
                value={number(w.exits)}
                subtitle="حالات الخروج"
                accent={C.warning}
              />

              <Card
                title="Net HC Movement"
                value={
                  Number(
                    w.net_headcount_movement ||
                      0
                  ) > 0
                    ? `+${w.net_headcount_movement}`
                    : number(
                        w.net_headcount_movement
                      )
                }
                subtitle="صافي حركة القوى العاملة"
              />

              <Card
                title="Closing Headcount"
                value={number(
                  w.closing_headcount
                )}
                subtitle="عدد الموظفين نهاية الشهر"
                accent={C.blue}
              />

              <Card
                title="Turnover Rate"
                value={pct(
                  w.turnover_rate_pct
                )}
                subtitle="معدل الدوران الشهري"
                accent={C.warning}
              />
            </Grid>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(460px,1fr))",
                gap: 16,
                marginTop: 16,
              }}
            >
              <Section
                title="Payroll"
                arabic="الرواتب"
              >
                <Grid min={145}>
                  <Card
                    title="Employees"
                    value={number(
                      p.payroll_entries
                    )}
                    subtitle="Payroll entries"
                  />

                  <Card
                    title="Gross Pay"
                    value={`${money(
                      p.gross_pay
                    )} SAR`}
                    subtitle="إجمالي الرواتب"
                  />

                  <Card
                    title="Net Pay"
                    value={`${money(
                      p.net_pay
                    )} SAR`}
                    subtitle="صافي الرواتب"
                    accent={C.blue}
                  />

                  <Card
                    title="Employer Total Cost"
                    value={`${money(
                      p.employer_total_cost
                    )} SAR`}
                    subtitle="إجمالي تكلفة الشركة"
                    accent={C.warning}
                  />
                </Grid>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                    marginTop: 11,
                  }}
                >
                  <MiniRow
                    label="Employer GOSI"
                    value={`${money(
                      p.employer_gosi_cost
                    )} SAR`}
                  />

                  <MiniRow
                    label="Employee GOSI Deduction"
                    value={`${money(
                      p.employee_gosi_deduction
                    )} SAR`}
                  />

                  <MiniRow
                    label="Benefit Cost"
                    value={`${money(
                      p.benefit_cost
                    )} SAR`}
                  />

                  <MiniRow
                    label="Payroll Cycle Status"
                    value={
                      p.cycle?.status ||
                      "No cycle"
                    }
                  />
                </div>
              </Section>

              <Section
                title="Recruitment"
                arabic="التوظيف"
              >
                <Grid min={145}>
                  <Card
                    title="Candidates Added"
                    value={number(
                      r.candidates_added
                    )}
                    subtitle="مرشحون أضيفوا خلال الشهر"
                  />

                  <Card
                    title="Vacancies Created"
                    value={number(
                      r.vacancies_created
                    )}
                    subtitle="شواغر جديدة"
                    accent={C.blue}
                  />

                  <Card
                    title="Avg Fit Score"
                    value={score(
                      r.average_fit_score
                    )}
                    subtitle="متوسط ملاءمة المرشحين"
                  />
                </Grid>

                <div
                  style={{
                    marginTop: 11,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {Object.entries(
                    r.candidate_stage_distribution ||
                      {}
                  ).length === 0 ? (
                    <MiniRow
                      label="Candidate Stages"
                      value="No data"
                    />
                  ) : (
                    Object.entries(
                      r.candidate_stage_distribution
                    ).map(
                      ([key, value]) => (
                        <MiniRow
                          key={key}
                          label={key.replaceAll(
                            "_",
                            " "
                          )}
                          value={number(
                            value
                          )}
                        />
                      )
                    )
                  )}
                </div>
              </Section>

              <Section
                title="Employee Payments & Claims"
                arabic="مدفوعات ومطالبات الموظفين"
              >
                <Grid min={145}>
                  <Card
                    title="Requests"
                    value={number(
                      ep.requests
                    )}
                    subtitle="إجمالي الطلبات"
                  />

                  <Card
                    title="Total Amount"
                    value={`${money(
                      ep.total_amount
                    )} SAR`}
                    subtitle="إجمالي القيمة"
                    accent={C.warning}
                  />
                </Grid>

                <div
                  style={{
                    marginTop: 11,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {Object.entries(
                    ep.status_counts ||
                      {}
                  ).length === 0 ? (
                    <MiniRow
                      label="Request Status"
                      value="No requests"
                    />
                  ) : (
                    Object.entries(
                      ep.status_counts
                    ).map(
                      ([key, value]) => (
                        <MiniRow
                          key={key}
                          label={key.replaceAll(
                            "_",
                            " "
                          )}
                          value={number(
                            value
                          )}
                        />
                      )
                    )
                  )}
                </div>
              </Section>

              <Section
                title="Leave"
                arabic="الإجازات"
              >
                <Grid min={145}>
                  <Card
                    title="Requests Created"
                    value={number(
                      l.requests_created
                    )}
                    subtitle="طلبات جديدة"
                  />

                  <Card
                    title="Approved Overlap"
                    value={number(
                      l.approved_requests_overlapping
                    )}
                    subtitle="طلبات معتمدة خلال الشهر"
                  />

                  <Card
                    title="Employees on Leave"
                    value={number(
                      l.employees_on_approved_leave
                    )}
                    subtitle="موظفون بإجازة معتمدة"
                    accent={C.blue}
                  />

                  <Card
                    title="Decisions"
                    value={number(
                      l.decisions_in_month
                    )}
                    subtitle="قرارات الإجازات"
                  />
                </Grid>
              </Section>

              <Section
                title="Performance"
                arabic="إدارة الأداء"
              >
                <Grid min={145}>
                  <Card
                    title="Active Cycles in Month"
                    value={number(
                      pf.cycles_overlapping_month
                    )}
                    subtitle="دورات متقاطعة مع الشهر"
                  />

                  <Card
                    title="Completed Reviews"
                    value={number(
                      pf.completed_reviews
                    )}
                    subtitle="تقييمات مكتملة"
                  />

                  <Card
                    title="Average Score"
                    value={score(
                      pf.average_final_score
                    )}
                    subtitle="متوسط النتيجة النهائية"
                    accent={C.blue}
                  />
                </Grid>
              </Section>

              <Section
                title="Training & Development"
                arabic="التدريب والتطوير"
              >
                <Grid min={145}>
                  <Card
                    title="Sessions Requested"
                    value={number(
                      t.sessions_requested
                    )}
                    subtitle="طلبات دورات"
                  />

                  <Card
                    title="Sessions Started"
                    value={number(
                      t.sessions_started
                    )}
                    subtitle="دورات بدأت"
                  />

                  <Card
                    title="Completed"
                    value={number(
                      t.completed_enrollments
                    )}
                    subtitle="إكمالات تدريبية"
                  />

                  <Card
                    title="Actual Cost"
                    value={`${money(
                      t.actual_cost
                    )} SAR`}
                    subtitle="التكلفة الفعلية"
                    accent={C.warning}
                  />
                </Grid>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                    marginTop: 11,
                  }}
                >
                  <MiniRow
                    label="Average Attendance"
                    value={
                      t.average_attendance_pct ===
                        null ||
                      t.average_attendance_pct ===
                        undefined
                        ? "N/A"
                        : pct(
                            t.average_attendance_pct
                          )
                    }
                  />

                  <MiniRow
                    label="Average Score"
                    value={score(
                      t.average_score
                    )}
                  />

                  <MiniRow
                    label="Reimbursement Amount"
                    value={`${money(
                      t.reimbursement_amount
                    )} SAR`}
                  />
                </div>
              </Section>

              <Section
                title="Employee Relations"
                arabic="علاقات الموظفين"
              >
                <Grid min={145}>
                  <Card
                    title="Cases Created"
                    value={number(
                      er.cases_created
                    )}
                    subtitle="قضايا جديدة"
                  />

                  <Card
                    title="Cases Closed"
                    value={number(
                      er.cases_closed
                    )}
                    subtitle="قضايا مغلقة"
                  />

                  <Card
                    title="Disciplinary Actions"
                    value={number(
                      er.disciplinary_actions
                    )}
                    subtitle="إجراءات تأديبية"
                    accent={C.warning}
                  />

                  <Card
                    title="Grievances"
                    value={number(
                      er.grievances_submitted
                    )}
                    subtitle="تظلمات مقدمة"
                  />
                </Grid>
              </Section>

              <Section
                title="Government Compliance"
                arabic="الامتثال الحكومي"
              >
                <Grid min={145}>
                  <Card
                    title="Corporate Expiries"
                    value={number(
                      gc.corporate_expiries
                    )}
                    subtitle="انتهاء سجلات الشركة"
                    accent={C.warning}
                  />

                  <Card
                    title="Employee Doc Expiries"
                    value={number(
                      gc.employee_document_expiries
                    )}
                    subtitle="انتهاء وثائق الموظفين"
                    accent={C.warning}
                  />

                  <Card
                    title="Renewals Completed"
                    value={number(
                      gc.renewals_completed
                    )}
                    subtitle="تجديدات مكتملة"
                  />

                  <Card
                    title="Renewal Cost"
                    value={`${money(
                      gc.renewal_cost
                    )} SAR`}
                    subtitle="تكلفة التجديدات"
                    accent={C.blue}
                  />
                </Grid>
              </Section>

              <Section
                title="HR Calendar"
                arabic="تقويم الموارد البشرية"
              >
                <Grid min={145}>
                  <Card
                    title="Occurrences"
                    value={number(
                      cal.occurrences
                    )}
                    subtitle="أحداث خلال الشهر"
                  />

                  <Card
                    title="High / Critical"
                    value={number(
                      cal.high_critical_occurrences
                    )}
                    subtitle="أحداث أولوية مرتفعة"
                    accent={C.danger}
                  />
                </Grid>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                    marginTop: 11,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {(cal.events || [])
                    .slice(0, 15)
                    .map((row, i) => (
                      <MiniRow
                        key={`${row.event_id}-${i}`}
                        label={`${row.occurrence_date} • ${row.title_en}`}
                        value={
                          row.priority ||
                          "medium"
                        }
                        accent={
                          row.priority ===
                          "critical"
                            ? C.danger
                            : row.priority ===
                              "high"
                            ? C.warning
                            : C.text
                        }
                      />
                    ))}

                  {(cal.events || [])
                    .length === 0 ? (
                    <MiniRow
                      label="Calendar"
                      value="No events"
                    />
                  ) : null}
                </div>
              </Section>

              <Section
                title="Confidential HR Notes"
                arabic="الملاحظات السرية"
              >
                <Grid min={145}>
                  <Card
                    title="Notes Created"
                    value={number(
                      cn.notes_created
                    )}
                    subtitle="عدد فقط — المحتوى غير مكشوف"
                    accent={C.danger}
                  />
                </Grid>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    marginTop: 10,
                    lineHeight: 1.6,
                  }}
                >
                  Confidential note subjects and
                  content are intentionally excluded
                  from the Monthly HR Dashboard.
                </div>
              </Section>
            </div>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <Section
                title="Current HR Snapshot"
                arabic="الوضع الحالي — ليس خاصًا بالشهر المختار"
              >
                <div
                  style={{
                    color: C.warning,
                    fontSize: 11,
                    marginBottom: 12,
                  }}
                >
                  These values represent the current
                  operational state and are shown
                  separately from historical monthly
                  metrics.
                </div>

                <Grid min={170}>
                  <Card
                    title="Succession Gaps"
                    value={number(
                      current.talent
                        ?.succession_gaps
                    )}
                    subtitle="Current Talent"
                    accent={C.warning}
                  />

                  <Card
                    title="High Potentials"
                    value={number(
                      current.talent
                        ?.high_potentials
                    )}
                    subtitle="Current Talent"
                  />

                  <Card
                    title="Current Headcount"
                    value={number(
                      current.workforce
                        ?.current_headcount
                    )}
                    subtitle="Workforce Plan"
                    accent={C.blue}
                  />

                  <Card
                    title="Planned Hires"
                    value={number(
                      current.workforce
                        ?.planned_hires
                    )}
                    subtitle="Workforce Plan"
                  />

                  <Card
                    title="Open Policy Conflicts"
                    value={number(
                      current.policies
                        ?.open_conflicts
                    )}
                    subtitle="Policies & Compliance"
                    accent={C.warning}
                  />

                  <Card
                    title="Expired Compliance"
                    value={number(
                      current.compliance
                        ?.expired
                    )}
                    subtitle="Government Compliance"
                    accent={C.danger}
                  />
                </Grid>
              </Section>
            </div>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <Section
                title="Data Quality & Reporting Basis"
                arabic="أساس التقرير وجودة البيانات"
              >
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  {Object.entries(dq).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        style={{
                          background:
                            C.soft,
                          borderRadius: 9,
                          padding: 10,
                        }}
                      >
                        <strong
                          style={{
                            color: C.blue,
                          }}
                        >
                          {key.replaceAll(
                            "_",
                            " "
                          )}
                        </strong>

                        <div
                          style={{
                            color: C.muted,
                            marginTop: 4,
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
