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

const field = {
  width: "100%",
  boxSizing: "border-box",
  background: C.soft,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "10px 11px",
  outline: "none",
};

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
        borderRadius: 17,
        padding: 17,
      }}
    >
      <div style={{ color: C.muted, fontSize: 11 }}>
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 27,
          fontWeight: 850,
          marginTop: 7,
        }}
      >
        {value ?? 0}
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

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "medium",
      }
    );
  } catch {
    return value;
  }
}

function actionLabel(value) {
  return String(value || "")
    .replace(/^hr\./, "")
    .replaceAll(".", " → ")
    .replaceAll("_", " ");
}

function actorAccent(actor) {
  const value = String(actor || "");

  if (value.startsWith("agent:")) {
    return C.blue;
  }

  if (value === "system") {
    return C.warning;
  }

  return C.primary;
}

export default function HRAuditTrailPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const [actor, setActor] =
    useState("");
  const [actionContains, setActionContains] =
    useState("");
  const [fromDate, setFromDate] =
    useState("");
  const [toDate, setToDate] =
    useState("");
  const [limit, setLimit] =
    useState("100");

  const [expanded, setExpanded] =
    useState({});

  async function load() {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      params.set(
        "limit",
        limit || "100"
      );

      // This page is intentionally HR-only.
      params.set(
        "action_prefix",
        "hr."
      );

      if (actor.trim()) {
        params.set(
          "actor",
          actor.trim()
        );
      }

      if (actionContains.trim()) {
        params.set(
          "action_contains",
          actionContains.trim()
        );
      }

      if (fromDate) {
        params.set(
          "from_date",
          fromDate
        );
      }

      if (toDate) {
        params.set(
          "to_date",
          toDate
        );
      }

      const response = await fetch(
        `/api/audit-logs?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Request failed: ${response.status}`
        );
      }

      setRows(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load HR Audit Trail"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [limit]);

  const uniqueActors = useMemo(
    () =>
      new Set(
        rows
          .map((row) => row.actor)
          .filter(Boolean)
      ).size,
    [rows]
  );

  const uniqueActions = useMemo(
    () =>
      new Set(
        rows
          .map((row) => row.action)
          .filter(Boolean)
      ).size,
    [rows]
  );

  const latestEvent =
    rows.length > 0
      ? rows[0]?.created_at
      : null;

  function resetFilters() {
    setActor("");
    setActionContains("");
    setFromDate("");
    setToDate("");
  }

  function toggleExpanded(id) {
    setExpanded((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        padding: 28,
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1650,
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
            justifyContent:
              "space-between",
            alignItems: "end",
            gap: 15,
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
              HR Audit Trail
            </h1>

            <div
              style={{
                color: C.muted,
              }}
            >
              سجل تدقيق الموارد البشرية
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 6,
              }}
            >
              Read-only chronological log
              of HR actions, approvals,
              workflow changes and AI
              activities.
            </div>
          </div>

          <div
            style={{
              color: C.primary,
              border:
                `1px solid ${C.primary}44`,
              background:
                "rgba(24,213,183,.07)",
              borderRadius: 999,
              padding: "7px 11px",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            READ ONLY
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
              marginBottom: 15,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px,1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <StatCard
            title="Loaded HR Events"
            value={rows.length}
            subtitle={`Maximum ${limit} records`}
          />

          <StatCard
            title="Actors"
            value={uniqueActors}
            subtitle="Unique users / agents"
            accent={C.blue}
          />

          <StatCard
            title="Action Types"
            value={uniqueActions}
            subtitle="Unique HR audit actions"
            accent={C.warning}
          />

          <StatCard
            title="Latest Event"
            value={
              latestEvent
                ? new Date(
                    latestEvent
                  ).toLocaleDateString(
                    "en-GB"
                  )
                : "—"
            }
            subtitle={
              latestEvent
                ? new Date(
                    latestEvent
                  ).toLocaleTimeString(
                    "en-GB"
                  )
                : "No HR events"
            }
          />
        </div>

        <section
          style={{
            background: C.panel,
            border:
              `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px,1fr))",
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                Actor
              </div>

              <input
                style={field}
                placeholder="user / agent:hr / system"
                value={actor}
                onChange={(e) =>
                  setActor(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                Action Contains
              </div>

              <input
                style={field}
                placeholder="payroll / policy / attachment..."
                value={
                  actionContains
                }
                onChange={(e) =>
                  setActionContains(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                From Date
              </div>

              <input
                style={field}
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                To Date
              </div>

              <input
                style={field}
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                Max Records
              </div>

              <select
                style={field}
                value={limit}
                onChange={(e) =>
                  setLimit(
                    e.target.value
                  )
                }
              >
                <option value="50">
                  50
                </option>
                <option value="100">
                  100
                </option>
                <option value="250">
                  250
                </option>
                <option value="500">
                  500
                </option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onClick={load}
              disabled={loading}
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
              {loading
                ? "Loading..."
                : "Apply Filters"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetFilters();

                setTimeout(
                  load,
                  0
                );
              }}
            >
              Reset Filters
            </button>
          </div>
        </section>

        <section
          style={{
            background: C.panel,
            border:
              `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 19,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 13,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                }}
              >
                HR Audit Events
              </h3>

              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                أحداث الموارد البشرية
                مرتبة من الأحدث إلى الأقدم
              </div>
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 11,
              }}
            >
              Filter locked to{" "}
              <strong
                style={{
                  color: C.blue,
                }}
              >
                action_prefix=hr.
              </strong>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                color: C.muted,
                padding: 28,
                textAlign: "center",
              }}
            >
              Loading HR audit events...
            </div>
          ) : rows.length === 0 ? (
            <div
              style={{
                color: C.muted,
                border:
                  `1px dashed ${C.border}`,
                borderRadius: 12,
                padding: 30,
                textAlign: "center",
              }}
            >
              No HR audit events found.
              <br />
              لا توجد أحداث تدقيق مطابقة
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {rows.map((row) => {
                const open =
                  !!expanded[row.id];

                const detailKeys =
                  Object.keys(
                    row.details || {}
                  );

                return (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 11,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(210px,1.6fr) minmax(110px,.6fr) minmax(150px,.8fr) auto",
                        gap: 12,
                        alignItems:
                          "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight:
                              800,
                            fontSize:
                              12,
                          }}
                        >
                          {actionLabel(
                            row.action
                          )}
                        </div>

                        <div
                          style={{
                            color:
                              C.muted,
                            fontSize:
                              9,
                            marginTop:
                              3,
                          }}
                        >
                          {row.action}
                        </div>
                      </div>

                      <div>
                        <span
                          style={{
                            color:
                              actorAccent(
                                row.actor
                              ),
                            background:
                              `${actorAccent(
                                row.actor
                              )}15`,
                            borderRadius:
                              999,
                            padding:
                              "5px 8px",
                            fontSize:
                              10,
                            fontWeight:
                              800,
                          }}
                        >
                          {row.actor}
                        </span>
                      </div>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 10,
                        }}
                      >
                        {formatDate(
                          row.created_at
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            row.id
                          )
                        }
                      >
                        {open
                          ? "Hide Details"
                          : `Details (${detailKeys.length})`}
                      </button>
                    </div>

                    {open ? (
                      <div
                        style={{
                          marginTop: 10,
                          background:
                            C.panel,
                          borderRadius:
                            8,
                          padding: 10,
                          overflowX:
                            "auto",
                        }}
                      >
                        {detailKeys.length ===
                        0 ? (
                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize:
                                11,
                            }}
                          >
                            No details recorded.
                          </div>
                        ) : (
                          <pre
                            style={{
                              margin: 0,
                              color:
                                C.text,
                              fontSize:
                                10,
                              whiteSpace:
                                "pre-wrap",
                              wordBreak:
                                "break-word",
                              lineHeight:
                                1.6,
                            }}
                          >
                            {JSON.stringify(
                              row.details,
                              null,
                              2
                            )}
                          </pre>
                        )}

                        <div
                          style={{
                            color:
                              C.muted,
                            fontSize: 9,
                            marginTop:
                              8,
                          }}
                        >
                          Audit ID:{" "}
                          {row.id}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
