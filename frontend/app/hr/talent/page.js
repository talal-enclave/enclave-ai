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

function positionName(row) {
  if (!row) return "Unknown position";

  const title =
    row.title_ar ||
    row.title_en ||
    "Untitled Position";

  return row.code
    ? `${title} — ${row.code}`
    : title;
}

function nineBoxLabel(value) {
  const labels = {
    top_talent: "Top Talent",
    high_performer: "High Performer",
    solid_performer: "Solid Performer",
    high_potential: "High Potential",
    core_talent: "Core Talent",
    effective_contributor: "Effective Contributor",
    potential_gem: "Potential Gem",
    inconsistent_talent: "Inconsistent Talent",
    underperformer: "Underperformer",
  };

  return labels[value] || value || "Not Rated";
}

function readinessLabel(value) {
  const labels = {
    ready_now: "Ready Now",
    "1_2_years": "1–2 Years",
    "3_plus_years": "3+ Years",
  };

  return labels[value] || value || "—";
}

function Badge({ children }) {
  const text = String(children || "");

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: C.primary,
        background: "rgba(24,213,183,.09)",
      }}
    >
      {text}
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

export default function TalentSuccessionPage() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [criticalPositions, setCriticalPositions] =
    useState([]);
  const [profiles, setProfiles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState({});

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [criticalForm, setCriticalForm] =
    useState({
      position_id: "",
      criticality_level: "high",
      vacancy_risk: "medium",
      business_impact: "high",
      succession_required: true,
      target_successors: "2",
      notes: "",
    });

  const [talentForm, setTalentForm] =
    useState({
      employee_id: "",
      potential_score: "",
      talent_pool: "",
      retention_risk: "low",
      mobility: "",
      career_aspiration: "",
      strengths: "",
      development_gaps: "",
      development_actions: "",
      assessed_by: "",
      assessment_date: "",
      notes: "",
    });

  const [successorForm, setSuccessorForm] =
    useState({
      critical_position_id: "",
      employee_id: "",
      readiness: "3_plus_years",
      candidate_rank: "",
      nomination_reason: "",
      development_gaps: "",
      development_actions: "",
      nominated_by: "",
      nomination_date: "",
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

      const [e, p, c, t, s, m] =
        await Promise.all([
          api("/api/hr/employees"),
          api("/api/hr/positions"),
          api("/api/hr/talent/critical-positions"),
          api("/api/hr/talent/profiles"),
          api("/api/hr/talent/successors"),
          api("/api/hr/talent/summary"),
        ]);

      setEmployees(
        Array.isArray(e) ? e : []
      );

      setPositions(
        Array.isArray(p) ? p : []
      );

      setCriticalPositions(
        Array.isArray(c) ? c : []
      );

      setProfiles(
        Array.isArray(t) ? t : []
      );

      setCandidates(
        Array.isArray(s) ? s : []
      );

      setSummary(m || {});
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load Succession & Talent data"
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
        employees.map((row) => [
          row.id,
          employeeName(row),
        ])
      ),
    [employees]
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

  const criticalMap = useMemo(
    () =>
      Object.fromEntries(
        criticalPositions.map((row) => [
          row.id,
          positionMap[row.position_id] ||
            row.position_id,
        ])
      ),
    [criticalPositions, positionMap]
  );

  const profileMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((row) => [
          row.employee_id,
          row,
        ])
      ),
    [profiles]
  );

  async function createCriticalPosition(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!criticalForm.position_id) {
        throw new Error("Select a position");
      }

      await api(
        "/api/hr/talent/critical-positions",
        {
          method: "POST",
          body: JSON.stringify({
            position_id:
              criticalForm.position_id,
            criticality_level:
              criticalForm.criticality_level,
            vacancy_risk:
              criticalForm.vacancy_risk,
            business_impact:
              criticalForm.business_impact,
            succession_required:
              criticalForm.succession_required,
            target_successors:
              Number(
                criticalForm.target_successors ||
                  1
              ),
            notes:
              criticalForm.notes.trim() ||
              null,
          }),
        }
      );

      setCriticalForm({
        position_id: "",
        criticality_level: "high",
        vacancy_risk: "medium",
        business_impact: "high",
        succession_required: true,
        target_successors: "2",
        notes: "",
      });

      setMessage(
        "Critical position added."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to add critical position"
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveTalentProfile(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!talentForm.employee_id) {
        throw new Error("Select an employee");
      }

      const potential = Number(
        talentForm.potential_score
      );

      if (
        Number.isNaN(potential) ||
        potential < 0 ||
        potential > 100
      ) {
        throw new Error(
          "Potential score must be between 0 and 100"
        );
      }

      await api("/api/hr/talent/profiles", {
        method: "PUT",
        body: JSON.stringify({
          employee_id:
            talentForm.employee_id,
          potential_score: potential,
          talent_pool:
            talentForm.talent_pool.trim() ||
            null,
          retention_risk:
            talentForm.retention_risk,
          mobility:
            talentForm.mobility.trim() ||
            null,
          career_aspiration:
            talentForm.career_aspiration.trim() ||
            null,
          strengths:
            talentForm.strengths.trim() ||
            null,
          development_gaps:
            talentForm.development_gaps.trim() ||
            null,
          development_actions:
            talentForm.development_actions.trim() ||
            null,
          assessed_by:
            talentForm.assessed_by.trim() ||
            null,
          assessment_date:
            talentForm.assessment_date ||
            null,
          notes:
            talentForm.notes.trim() ||
            null,
        }),
      });

      setTalentForm({
        employee_id: "",
        potential_score: "",
        talent_pool: "",
        retention_risk: "low",
        mobility: "",
        career_aspiration: "",
        strengths: "",
        development_gaps: "",
        development_actions: "",
        assessed_by: "",
        assessment_date: "",
        notes: "",
      });

      setMessage(
        "Talent profile saved."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save talent profile"
      );
    } finally {
      setSaving(false);
    }
  }

  async function nominateSuccessor(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (
        !successorForm.critical_position_id
      ) {
        throw new Error(
          "Select a critical position"
        );
      }

      if (!successorForm.employee_id) {
        throw new Error("Select an employee");
      }

      await api(
        "/api/hr/talent/successors",
        {
          method: "POST",
          body: JSON.stringify({
            critical_position_id:
              successorForm.critical_position_id,
            employee_id:
              successorForm.employee_id,
            readiness:
              successorForm.readiness,
            candidate_rank:
              successorForm.candidate_rank
                ? Number(
                    successorForm.candidate_rank
                  )
                : null,
            nomination_reason:
              successorForm.nomination_reason.trim() ||
              null,
            development_gaps:
              successorForm.development_gaps.trim() ||
              null,
            development_actions:
              successorForm.development_actions.trim() ||
              null,
            nominated_by:
              successorForm.nominated_by.trim() ||
              null,
            nomination_date:
              successorForm.nomination_date ||
              null,
            notes:
              successorForm.notes.trim() ||
              null,
          }),
        }
      );

      setSuccessorForm({
        critical_position_id: "",
        employee_id: "",
        readiness: "3_plus_years",
        candidate_rank: "",
        nomination_reason: "",
        development_gaps: "",
        development_actions: "",
        nominated_by: "",
        nomination_date: "",
        notes: "",
      });

      setMessage(
        "Successor candidate nominated."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to nominate successor"
      );
    } finally {
      setSaving(false);
    }
  }

  async function reviewCandidate(row) {
    const readiness = window.prompt(
      "Readiness: ready_now / 1_2_years / 3_plus_years",
      row.readiness
    );

    if (!readiness) return;

    const rank = window.prompt(
      "Candidate Rank:",
      row.candidate_rank == null
        ? ""
        : String(row.candidate_rank)
    );

    if (rank === null) return;

    const gaps = window.prompt(
      "Development Gaps:",
      row.development_gaps || ""
    );

    if (gaps === null) return;

    const actions = window.prompt(
      "Development Actions:",
      row.development_actions || ""
    );

    if (actions === null) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/talent/successors/${row.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            readiness:
              readiness.trim(),
            candidate_rank:
              rank.trim() === ""
                ? null
                : Number(rank),
            development_gaps:
              gaps.trim() || null,
            development_actions:
              actions.trim() || null,
            refresh_scores: true,
          }),
        }
      );

      setMessage(
        "Successor candidate reviewed and scores refreshed."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to review successor"
      );
    } finally {
      setSaving(false);
    }
  }

  const nineBoxCells = [
    ["potential_gem", "inconsistent_talent", "underperformer"],
    ["high_potential", "core_talent", "effective_contributor"],
    ["top_talent", "high_performer", "solid_performer"],
  ];

  const candidatesByBox = useMemo(() => {
    const result = {};

    for (const row of candidates) {
      const key = row.nine_box || "not_rated";

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(row);
    }

    return result;
  }, [candidates]);

  const tabs = [
    ["overview", "Overview"],
    ["critical", "Critical Positions"],
    ["talent", "Talent Profiles"],
    ["successors", "Successors"],
    ["ninebox", "9-Box"],
  ];

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
          maxWidth: 1550,
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
          Succession & Talent Management
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 8,
          }}
        >
          التعاقب الوظيفي وإدارة المواهب
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 22,
          }}
        >
          Performance is pulled from the
          existing Performance module.
          Potential is assessed separately.
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
              "repeat(auto-fit, minmax(170px,1fr))",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Critical Positions"
            value={
              summary.critical_positions
            }
            subtitle="مناصب حرجة"
          />

          <StatCard
            title="Succession Gaps"
            value={summary.succession_gaps}
            subtitle="مناصب بدون خليفة"
            accent={C.danger}
          />

          <StatCard
            title="Positions with Successor"
            value={
              summary.positions_with_successor
            }
            subtitle="تغطية التعاقب"
            accent={C.blue}
          />

          <StatCard
            title="Ready Now"
            value={
              summary.ready_now_candidates
            }
            subtitle="مرشحون جاهزون الآن"
          />

          <StatCard
            title="High Potentials"
            value={summary.high_potentials}
            subtitle="مواهب عالية الإمكانات"
            accent={C.warning}
          />

          <StatCard
            title="Top Talent"
            value={summary.top_talent}
            subtitle="High Performance + High Potential"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {tabs.map(([key, name]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                background:
                  tab === key
                    ? C.primary
                    : C.panel,
                color:
                  tab === key
                    ? "#04100b"
                    : C.text,
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(430px,1fr))",
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
              <h3 style={{ marginTop: 0 }}>
                Ready Now Successors
              </h3>

              {candidates.filter(
                (row) =>
                  row.readiness ===
                  "ready_now"
              ).length === 0 ? (
                <Empty>
                  No Ready Now successors
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {candidates
                    .filter(
                      (row) =>
                        row.readiness ===
                        "ready_now"
                    )
                    .map((row) => (
                      <div
                        key={row.id}
                        style={{
                          background: C.soft,
                          padding: 12,
                          borderRadius: 10,
                        }}
                      >
                        <strong>
                          {employeeMap[
                            row.employee_id
                          ] ||
                            row.employee_id}
                        </strong>

                        <div
                          style={{
                            color: C.muted,
                            fontSize: 12,
                            marginTop: 5,
                          }}
                        >
                          {criticalMap[
                            row.critical_position_id
                          ] ||
                            row.critical_position_id}
                        </div>

                        <div
                          style={{
                            marginTop: 7,
                          }}
                        >
                          <Badge>
                            {nineBoxLabel(
                              row.nine_box
                            )}
                          </Badge>
                        </div>
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
                High Potential Talent
              </h3>

              {profiles.filter(
                (row) =>
                  row.high_potential
              ).length === 0 ? (
                <Empty>
                  No High Potential employees
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {profiles
                    .filter(
                      (row) =>
                        row.high_potential
                    )
                    .map((row) => (
                      <div
                        key={row.id}
                        style={{
                          background: C.soft,
                          padding: 12,
                          borderRadius: 10,
                        }}
                      >
                        <strong>
                          {employeeMap[
                            row.employee_id
                          ] ||
                            row.employee_id}
                        </strong>

                        <div
                          style={{
                            color: C.muted,
                            fontSize: 12,
                            marginTop: 5,
                          }}
                        >
                          Potential:{" "}
                          {row.potential_score}
                          {" • "}
                          Pool:{" "}
                          {row.talent_pool ||
                            "—"}
                          {" • "}
                          Risk:{" "}
                          {row.retention_risk}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "critical" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <form
              onSubmit={
                createCriticalPosition
              }
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Add Critical Position
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px,1fr))",
                  gap: 11,
                }}
              >
                <select
                  style={input}
                  value={
                    criticalForm.position_id
                  }
                  onChange={(e) =>
                    setCriticalForm({
                      ...criticalForm,
                      position_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select position...
                  </option>

                  {positions
                    .filter(
                      (row) =>
                        row.is_active
                    )
                    .map((row) => (
                      <option
                        key={row.id}
                        value={row.id}
                      >
                        {positionName(row)}
                      </option>
                    ))}
                </select>

                <select
                  style={input}
                  value={
                    criticalForm.criticality_level
                  }
                  onChange={(e) =>
                    setCriticalForm({
                      ...criticalForm,
                      criticality_level:
                        e.target.value,
                    })
                  }
                >
                  <option value="medium">
                    Medium Criticality
                  </option>
                  <option value="high">
                    High Criticality
                  </option>
                  <option value="critical">
                    Critical
                  </option>
                </select>

                <select
                  style={input}
                  value={
                    criticalForm.vacancy_risk
                  }
                  onChange={(e) =>
                    setCriticalForm({
                      ...criticalForm,
                      vacancy_risk:
                        e.target.value,
                    })
                  }
                >
                  <option value="low">
                    Low Vacancy Risk
                  </option>
                  <option value="medium">
                    Medium Vacancy Risk
                  </option>
                  <option value="high">
                    High Vacancy Risk
                  </option>
                </select>

                <select
                  style={input}
                  value={
                    criticalForm.business_impact
                  }
                  onChange={(e) =>
                    setCriticalForm({
                      ...criticalForm,
                      business_impact:
                        e.target.value,
                    })
                  }
                >
                  <option value="medium">
                    Medium Business Impact
                  </option>
                  <option value="high">
                    High Business Impact
                  </option>
                  <option value="critical">
                    Critical Business Impact
                  </option>
                </select>

                <div>
                  <label style={label}>
                    Target Successors
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="1"
                    value={
                      criticalForm.target_successors
                    }
                    onChange={(e) =>
                      setCriticalForm({
                        ...criticalForm,
                        target_successors:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <textarea
                style={{
                  ...input,
                  minHeight: 70,
                  marginTop: 11,
                }}
                placeholder="Notes"
                value={criticalForm.notes}
                onChange={(e) =>
                  setCriticalForm({
                    ...criticalForm,
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
                Add Critical Position
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
                Critical Position Register
              </h3>

              {criticalPositions.length === 0 ? (
                <Empty>
                  No critical positions yet
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {criticalPositions.map(
                    (row) => (
                      <div
                        key={row.id}
                        style={{
                          background: C.soft,
                          padding: 13,
                          borderRadius: 11,
                        }}
                      >
                        <strong>
                          {positionMap[
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
                          Criticality:{" "}
                          {row.criticality_level}
                          {" • "}
                          Vacancy Risk:{" "}
                          {row.vacancy_risk}
                          {" • "}
                          Impact:{" "}
                          {row.business_impact}
                          {" • "}
                          Target Successors:{" "}
                          {row.target_successors}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "talent" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <form
              onSubmit={saveTalentProfile}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Talent Profile / Potential Assessment
              </h3>

              {employees.length === 0 ? (
                <div
                  style={{
                    color: C.warning,
                    marginBottom: 12,
                  }}
                >
                  No employees found.
                </div>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px,1fr))",
                  gap: 11,
                }}
              >
                <select
                  style={input}
                  value={
                    talentForm.employee_id
                  }
                  onChange={(e) => {
                    const employeeId =
                      e.target.value;

                    const existing =
                      profileMap[
                        employeeId
                      ];

                    setTalentForm({
                      ...talentForm,
                      employee_id:
                        employeeId,
                      potential_score:
                        existing
                          ?.potential_score ??
                        "",
                      talent_pool:
                        existing
                          ?.talent_pool ||
                        "",
                      retention_risk:
                        existing
                          ?.retention_risk ||
                        "low",
                      mobility:
                        existing
                          ?.mobility ||
                        "",
                      career_aspiration:
                        existing
                          ?.career_aspiration ||
                        "",
                      strengths:
                        existing
                          ?.strengths ||
                        "",
                      development_gaps:
                        existing
                          ?.development_gaps ||
                        "",
                      development_actions:
                        existing
                          ?.development_actions ||
                        "",
                      assessed_by:
                        existing
                          ?.assessed_by ||
                        "",
                      assessment_date:
                        existing
                          ?.assessment_date ||
                        "",
                      notes:
                        existing
                          ?.notes ||
                        "",
                    });
                  }}
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

                <div>
                  <label style={label}>
                    Potential Score 0–100
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      talentForm.potential_score
                    }
                    onChange={(e) =>
                      setTalentForm({
                        ...talentForm,
                        potential_score:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <input
                  style={input}
                  placeholder="Talent Pool"
                  value={
                    talentForm.talent_pool
                  }
                  onChange={(e) =>
                    setTalentForm({
                      ...talentForm,
                      talent_pool:
                        e.target.value,
                    })
                  }
                />

                <select
                  style={input}
                  value={
                    talentForm.retention_risk
                  }
                  onChange={(e) =>
                    setTalentForm({
                      ...talentForm,
                      retention_risk:
                        e.target.value,
                    })
                  }
                >
                  <option value="low">
                    Low Retention Risk
                  </option>
                  <option value="medium">
                    Medium Retention Risk
                  </option>
                  <option value="high">
                    High Retention Risk
                  </option>
                </select>

                <input
                  style={input}
                  placeholder="Mobility"
                  value={talentForm.mobility}
                  onChange={(e) =>
                    setTalentForm({
                      ...talentForm,
                      mobility:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Assessed By"
                  value={
                    talentForm.assessed_by
                  }
                  onChange={(e) =>
                    setTalentForm({
                      ...talentForm,
                      assessed_by:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={
                    talentForm.assessment_date
                  }
                  onChange={(e) =>
                    setTalentForm({
                      ...talentForm,
                      assessment_date:
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
                placeholder="Career Aspiration"
                value={
                  talentForm.career_aspiration
                }
                onChange={(e) =>
                  setTalentForm({
                    ...talentForm,
                    career_aspiration:
                      e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...input,
                  minHeight: 65,
                  marginTop: 11,
                }}
                placeholder="Strengths"
                value={talentForm.strengths}
                onChange={(e) =>
                  setTalentForm({
                    ...talentForm,
                    strengths:
                      e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...input,
                  minHeight: 65,
                  marginTop: 11,
                }}
                placeholder="Development Gaps"
                value={
                  talentForm.development_gaps
                }
                onChange={(e) =>
                  setTalentForm({
                    ...talentForm,
                    development_gaps:
                      e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...input,
                  minHeight: 65,
                  marginTop: 11,
                }}
                placeholder="Development Actions"
                value={
                  talentForm.development_actions
                }
                onChange={(e) =>
                  setTalentForm({
                    ...talentForm,
                    development_actions:
                      e.target.value,
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
                Save Talent Profile
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
                Talent Pool
              </h3>

              {profiles.length === 0 ? (
                <Empty>
                  No talent profiles yet
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {profiles.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        padding: 13,
                        borderRadius: 11,
                      }}
                    >
                      <strong>
                        {employeeMap[
                          row.employee_id
                        ] ||
                          row.employee_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        Potential:{" "}
                        {row.potential_score}
                        {" • "}
                        Level:{" "}
                        {row.potential_level}
                        {" • "}
                        Pool:{" "}
                        {row.talent_pool ||
                          "—"}
                        {" • "}
                        Retention Risk:{" "}
                        {row.retention_risk}
                      </div>

                      {row.high_potential ? (
                        <div
                          style={{
                            marginTop: 7,
                          }}
                        >
                          <Badge>
                            High Potential
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "successors" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <form
              onSubmit={nominateSuccessor}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Nominate Successor
              </h3>

              <div
                style={{
                  color: C.muted,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                Performance score will be pulled
                automatically from the employee&apos;s
                latest completed Performance Plan.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px,1fr))",
                  gap: 11,
                }}
              >
                <select
                  style={input}
                  value={
                    successorForm.critical_position_id
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
                      critical_position_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select critical position...
                  </option>

                  {criticalPositions.map(
                    (row) => (
                      <option
                        key={row.id}
                        value={row.id}
                      >
                        {positionMap[
                          row.position_id
                        ] ||
                          row.position_id}
                      </option>
                    )
                  )}
                </select>

                <select
                  style={input}
                  value={
                    successorForm.employee_id
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
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

                <select
                  style={input}
                  value={
                    successorForm.readiness
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
                      readiness:
                        e.target.value,
                    })
                  }
                >
                  <option value="ready_now">
                    Ready Now
                  </option>
                  <option value="1_2_years">
                    1–2 Years
                  </option>
                  <option value="3_plus_years">
                    3+ Years
                  </option>
                </select>

                <input
                  style={input}
                  type="number"
                  min="1"
                  placeholder="Candidate Rank"
                  value={
                    successorForm.candidate_rank
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
                      candidate_rank:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Nominated By"
                  value={
                    successorForm.nominated_by
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
                      nominated_by:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={
                    successorForm.nomination_date
                  }
                  onChange={(e) =>
                    setSuccessorForm({
                      ...successorForm,
                      nomination_date:
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
                placeholder="Nomination Reason"
                value={
                  successorForm.nomination_reason
                }
                onChange={(e) =>
                  setSuccessorForm({
                    ...successorForm,
                    nomination_reason:
                      e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...input,
                  minHeight: 65,
                  marginTop: 11,
                }}
                placeholder="Development Gaps"
                value={
                  successorForm.development_gaps
                }
                onChange={(e) =>
                  setSuccessorForm({
                    ...successorForm,
                    development_gaps:
                      e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...input,
                  minHeight: 65,
                  marginTop: 11,
                }}
                placeholder="Development Actions"
                value={
                  successorForm.development_actions
                }
                onChange={(e) =>
                  setSuccessorForm({
                    ...successorForm,
                    development_actions:
                      e.target.value,
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
                Nominate Successor
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
                Successor Register
              </h3>

              {candidates.length === 0 ? (
                <Empty>
                  No successor candidates yet
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {candidates.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        padding: 13,
                        borderRadius: 11,
                      }}
                    >
                      <strong>
                        #{row.candidate_rank ||
                          "—"}{" "}
                        {employeeMap[
                          row.employee_id
                        ] ||
                          row.employee_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {criticalMap[
                          row.critical_position_id
                        ] ||
                          row.critical_position_id}
                      </div>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        Performance:{" "}
                        {row.performance_score ??
                          "Not available"}
                        {" • "}
                        Potential:{" "}
                        {row.potential_score ??
                          "Not assessed"}
                        {" • "}
                        Readiness:{" "}
                        {readinessLabel(
                          row.readiness
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <Badge>
                          {nineBoxLabel(
                            row.nine_box
                          )}
                        </Badge>

                        <button
                          disabled={saving}
                          onClick={() =>
                            reviewCandidate(row)
                          }
                        >
                          Review / Refresh Scores
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "ninebox" ? (
          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              9-Box Talent Matrix
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 12,
                marginBottom: 15,
              }}
            >
              Performance: High ≥80, Medium
              70–79.99, Low &lt;70. Potential:
              High ≥80, Medium 60–79.99, Low
              &lt;60.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0,1fr))",
                gap: 10,
              }}
            >
              {nineBoxCells.flat().map(
                (box) => (
                  <div
                    key={box}
                    style={{
                      minHeight: 155,
                      background: C.soft,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 13,
                    }}
                  >
                    <strong>
                      {nineBoxLabel(box)}
                    </strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {
                        (
                          candidatesByBox[
                            box
                          ] || []
                        ).length
                      }{" "}
                      candidate(s)
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 6,
                        marginTop: 9,
                      }}
                    >
                      {(
                        candidatesByBox[
                          box
                        ] || []
                      ).map((row) => (
                        <div
                          key={row.id}
                          style={{
                            padding: 7,
                            background: C.panel,
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        >
                          {employeeMap[
                            row.employee_id
                          ] ||
                            row.employee_id}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            {(candidatesByBox.not_rated ||
              []).length > 0 ? (
              <div
                style={{
                  marginTop: 15,
                  padding: 13,
                  background: C.soft,
                  borderRadius: 10,
                }}
              >
                <strong>
                  Not Rated Yet
                </strong>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  These candidates are missing
                  either a completed Performance
                  score or Potential assessment.
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
