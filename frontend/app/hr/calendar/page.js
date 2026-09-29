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
  padding: "11px 12px",
  outline: "none",
};

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthStart(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function monthEnd(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function calendarGridStart(date) {
  const first = monthStart(date);
  const d = new Date(first);
  d.setDate(first.getDate() - first.getDay());
  return d;
}

function calendarGridEnd(date) {
  const last = monthEnd(date);
  const d = new Date(last);
  d.setDate(last.getDate() + (6 - last.getDay()));
  return d;
}

function Badge({ value }) {
  const v = String(value || "").toLowerCase();

  let color = C.blue;

  if (
    [
      "active",
      "completed",
      "upcoming",
    ].includes(v)
  ) {
    color = C.primary;
  } else if (
    [
      "due_soon",
      "due_today",
      "medium",
    ].includes(v)
  ) {
    color = C.warning;
  } else if (
    [
      "overdue",
      "critical",
      "high",
    ].includes(v)
  ) {
    color = C.danger;
  } else if (
    [
      "cancelled",
      "inactive",
      "ended",
      "low",
    ].includes(v)
  ) {
    color = C.muted;
  }

  return (
    <span
      style={{
        color,
        background: `${color}16`,
        border: `1px solid ${color}33`,
        borderRadius: 999,
        padding: "4px 8px",
        fontSize: 10,
        fontWeight: 800,
        display: "inline-block",
        textTransform: "capitalize",
      }}
    >
      {String(value || "—").replaceAll("_", " ")}
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
        padding: 17,
      }}
    >
      <div
        style={{
          color: C.muted,
          fontSize: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 28,
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

export default function HRCalendarPage() {
  const [viewMonth, setViewMonth] =
    useState(() => new Date());

  const [events, setEvents] =
    useState([]);

  const [occurrences, setOccurrences] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [form, setForm] = useState({
    code: "",
    title_en: "",
    title_ar: "",
    category: "general",
    description: "",
    responsible_owner: "",
    priority: "medium",
    start_date: "",
    end_date: "",
    recurrence_type: "none",
    recurrence_interval: "1",
    recurrence_end_date: "",
    alert_days_before: "7",
    source_reference: "",
    notes: "",
    created_by: "HR",
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
      setError("");

      const [e, a, s] = await Promise.all([
        api("/api/hr/calendar/events"),
        api("/api/hr/calendar/alerts"),
        api("/api/hr/calendar/summary"),
      ]);

      setEvents(
        Array.isArray(e) ? e : []
      );

      setAlerts(
        Array.isArray(a) ? a : []
      );

      setSummary(s || {});
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load HR Calendar"
      );
    }
  }

  async function loadOccurrences() {
    try {
      const from = isoDate(
        calendarGridStart(viewMonth)
      );

      const to = isoDate(
        calendarGridEnd(viewMonth)
      );

      const data = await api(
        `/api/hr/calendar/occurrences?from_date=${from}&to_date=${to}`
      );

      setOccurrences(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load calendar occurrences"
      );
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    loadOccurrences();
  }, [viewMonth]);

  const occurrenceMap = useMemo(() => {
    const map = {};

    for (const row of occurrences) {
      const key = row.occurrence_date;

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(row);
    }

    return map;
  }, [occurrences]);

  const filteredEvents = useMemo(
    () =>
      events.filter((row) => {
        if (
          categoryFilter &&
          row.category !== categoryFilter
        ) {
          return false;
        }

        return true;
      }),
    [events, categoryFilter]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .map((row) => row.category)
            .filter(Boolean)
        )
      ).sort(),
    [events]
  );

  const calendarDays = useMemo(() => {
    const start =
      calendarGridStart(viewMonth);

    const end =
      calendarGridEnd(viewMonth);

    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    return result;
  }, [viewMonth]);

  async function createEvent(e) {
    e.preventDefault();

    if (
      !form.title_en.trim() ||
      !form.start_date
    ) {
      setError(
        "Title and Start Date are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        "/api/hr/calendar/events",
        {
          method: "POST",
          body: JSON.stringify({
            code:
              form.code.trim() || null,
            title_en:
              form.title_en.trim(),
            title_ar:
              form.title_ar.trim() ||
              null,
            category:
              form.category,
            description:
              form.description.trim() ||
              null,
            responsible_owner:
              form.responsible_owner.trim() ||
              null,
            priority:
              form.priority,
            start_date:
              form.start_date,
            end_date:
              form.end_date || null,
            all_day: true,
            recurrence_type:
              form.recurrence_type,
            recurrence_interval:
              Number(
                form.recurrence_interval ||
                  1
              ),
            recurrence_end_date:
              form.recurrence_end_date ||
              null,
            alert_days_before:
              Number(
                form.alert_days_before ||
                  0
              ),
            source_type: "manual",
            source_reference:
              form.source_reference.trim() ||
              null,
            notes:
              form.notes.trim() || null,
            created_by:
              form.created_by.trim() ||
              "HR",
          }),
        }
      );

      setMessage(
        "HR Calendar event created."
      );

      setForm({
        code: "",
        title_en: "",
        title_ar: "",
        category: "general",
        description: "",
        responsible_owner: "",
        priority: "medium",
        start_date: "",
        end_date: "",
        recurrence_type: "none",
        recurrence_interval: "1",
        recurrence_end_date: "",
        alert_days_before: "7",
        source_reference: "",
        notes: "",
        created_by:
          form.created_by || "HR",
      });

      await Promise.all([
        loadBase(),
        loadOccurrences(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create event"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(row) {
    const recurring =
      row.recurrence_type !== "none";

    const suggested = recurring
      ? "inactive"
      : "completed";

    const status = window.prompt(
      recurring
        ? "Series status: active / inactive / cancelled"
        : "Status: active / completed / cancelled / inactive",
      suggested
    );

    if (!status) return;

    const actor = window.prompt(
      "Actor:",
      "HR"
    );

    if (!actor) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/calendar/events/${row.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            status:
              status.trim().toLowerCase(),
            actor:
              actor.trim(),
          }),
        }
      );

      setMessage(
        "Calendar event status updated."
      );

      await Promise.all([
        loadBase(),
        loadOccurrences(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update event status"
      );
    } finally {
      setSaving(false);
    }
  }

  function changeMonth(offset) {
    setViewMonth((current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        1
      )
    );
  }

  function goToday() {
    setViewMonth(new Date());
  }

  const monthLabel =
    viewMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

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
          maxWidth: 1700,
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
          HR Calendar
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 7,
          }}
        >
          تقويم الموارد البشرية
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          Operational HR dates,
          recurring activities,
          deadlines and alerts.
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
            title="Active Events"
            value={
              summary.active_events
            }
            subtitle="أحداث نشطة"
          />

          <StatCard
            title="Recurring Events"
            value={
              summary.recurring_events
            }
            subtitle="أحداث دورية"
            accent={C.blue}
          />

          <StatCard
            title="Due Within 7 Days"
            value={
              summary.due_within_7_days
            }
            subtitle="خلال 7 أيام"
            accent={C.warning}
          />

          <StatCard
            title="Due Within 30 Days"
            value={
              summary.due_within_30_days
            }
            subtitle="خلال 30 يوم"
            accent={C.blue}
          />

          <StatCard
            title="Overdue Events"
            value={
              summary.overdue_events
            }
            subtitle="أحداث متأخرة"
            accent={C.danger}
          />

          <StatCard
            title="Completed Events"
            value={
              summary.completed_events
            }
            subtitle="أحداث مكتملة"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(330px, .72fr) minmax(720px, 1.8fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <form
            onSubmit={createEvent}
            style={{
              background: C.panel,
              border:
                `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              New HR Calendar Event
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              إضافة موعد أو نشاط للموارد البشرية
            </div>

            <input
              style={field}
              placeholder="Event Code (optional)"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value,
                })
              }
            />

            <input
              style={{
                ...field,
                marginTop: 9,
              }}
              placeholder="English Title"
              value={form.title_en}
              onChange={(e) =>
                setForm({
                  ...form,
                  title_en:
                    e.target.value,
                })
              }
            />

            <input
              style={{
                ...field,
                marginTop: 9,
              }}
              dir="rtl"
              placeholder="العنوان بالعربي"
              value={form.title_ar}
              onChange={(e) =>
                setForm({
                  ...form,
                  title_ar:
                    e.target.value,
                })
              }
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 9,
                marginTop: 9,
              }}
            >
              <select
                style={field}
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
              >
                <option value="general">
                  General
                </option>
                <option value="payroll">
                  Payroll
                </option>
                <option value="performance">
                  Performance
                </option>
                <option value="recruitment">
                  Recruitment
                </option>
                <option value="training">
                  Training
                </option>
                <option value="policy">
                  Policy Review
                </option>
                <option value="compliance">
                  Compliance
                </option>
                <option value="employee_relations">
                  Employee Relations
                </option>
                <option value="workforce_planning">
                  Workforce Planning
                </option>
                <option value="hr_operations">
                  HR Operations
                </option>
                <option value="event">
                  HR Event
                </option>
              </select>

              <select
                style={field}
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority:
                      e.target.value,
                  })
                }
              >
                <option value="low">
                  Low Priority
                </option>
                <option value="medium">
                  Medium Priority
                </option>
                <option value="high">
                  High Priority
                </option>
                <option value="critical">
                  Critical
                </option>
              </select>
            </div>

            <input
              style={{
                ...field,
                marginTop: 9,
              }}
              placeholder="Responsible Owner"
              value={
                form.responsible_owner
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  responsible_owner:
                    e.target.value,
                })
              }
            />

            <textarea
              style={{
                ...field,
                marginTop: 9,
                minHeight: 70,
              }}
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 9,
                marginTop: 9,
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
                  Start Date
                </div>

                <input
                  type="date"
                  style={field}
                  value={
                    form.start_date
                  }
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
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  End Date
                </div>

                <input
                  type="date"
                  style={field}
                  value={
                    form.end_date
                  }
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 9,
                marginTop: 9,
              }}
            >
              <select
                style={field}
                value={
                  form.recurrence_type
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence_type:
                      e.target.value,
                  })
                }
              >
                <option value="none">
                  No Recurrence
                </option>
                <option value="weekly">
                  Weekly
                </option>
                <option value="monthly">
                  Monthly
                </option>
                <option value="quarterly">
                  Quarterly
                </option>
                <option value="semiannual">
                  Semiannual
                </option>
                <option value="annual">
                  Annual
                </option>
              </select>

              <input
                type="number"
                min="1"
                style={field}
                placeholder="Interval"
                value={
                  form.recurrence_interval
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence_interval:
                      e.target.value,
                  })
                }
              />
            </div>

            {form.recurrence_type !==
            "none" ? (
              <div
                style={{
                  marginTop: 9,
                }}
              >
                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  Recurrence End Date
                </div>

                <input
                  type="date"
                  style={field}
                  value={
                    form.recurrence_end_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrence_end_date:
                        e.target.value,
                    })
                  }
                />
              </div>
            ) : null}

            <div
              style={{
                marginTop: 9,
              }}
            >
              <div
                style={{
                  color: C.muted,
                  fontSize: 11,
                  marginBottom: 5,
                }}
              >
                Alert Days Before
              </div>

              <input
                type="number"
                min="0"
                style={field}
                value={
                  form.alert_days_before
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    alert_days_before:
                      e.target.value,
                  })
                }
              />
            </div>

            <input
              style={{
                ...field,
                marginTop: 9,
              }}
              placeholder="Source Reference"
              value={
                form.source_reference
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  source_reference:
                    e.target.value,
                })
              }
            />

            <textarea
              style={{
                ...field,
                marginTop: 9,
                minHeight: 65,
              }}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target.value,
                })
              }
            />

            <input
              style={{
                ...field,
                marginTop: 9,
              }}
              placeholder="Created By"
              value={form.created_by}
              onChange={(e) =>
                setForm({
                  ...form,
                  created_by:
                    e.target.value,
                })
              }
            />

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 12,
                background: C.primary,
                color: "#04100b",
                border: 0,
                borderRadius: 10,
                padding: "12px 14px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : "Create HR Calendar Event"}
            </button>
          </form>

          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <section
              style={{
                background: C.panel,
                border:
                  `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    {monthLabel}
                  </h2>

                  <div
                    style={{
                      color: C.muted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    التقويم الشهري
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                  }}
                >
                  <button
                    onClick={() =>
                      changeMonth(-1)
                    }
                  >
                    ←
                  </button>

                  <button
                    onClick={goToday}
                  >
                    Today
                  </button>

                  <button
                    onClick={() =>
                      changeMonth(1)
                    }
                  >
                    →
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(7, 1fr)",
                  gap: 5,
                  marginBottom: 5,
                }}
              >
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div
                    key={day}
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      fontWeight: 800,
                      textAlign: "center",
                      padding: 6,
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(7, minmax(0,1fr))",
                  gap: 5,
                }}
              >
                {calendarDays.map(
                  (day) => {
                    const key =
                      isoDate(day);

                    const rows =
                      occurrenceMap[key] ||
                      [];

                    const currentMonth =
                      day.getMonth() ===
                      viewMonth.getMonth();

                    const today =
                      key ===
                      isoDate(
                        new Date()
                      );

                    return (
                      <div
                        key={key}
                        style={{
                          minHeight: 105,
                          background:
                            today
                              ? "rgba(24,213,183,.07)"
                              : C.soft,
                          border: today
                            ? `1px solid ${C.primary}`
                            : `1px solid ${C.border}`,
                          borderRadius: 9,
                          padding: 7,
                          opacity:
                            currentMonth
                              ? 1
                              : 0.45,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            color: today
                              ? C.primary
                              : C.muted,
                            fontSize: 11,
                            fontWeight: 850,
                            marginBottom: 6,
                          }}
                        >
                          {day.getDate()}
                        </div>

                        {rows
                          .slice(0, 3)
                          .map((row) => (
                            <div
                              key={`${row.event_id}-${row.occurrence_date}`}
                              title={
                                row.title_en
                              }
                              style={{
                                background:
                                  C.panel,
                                borderLeft:
                                  `3px solid ${
                                    row.priority ===
                                    "critical"
                                      ? C.danger
                                      : row.priority ===
                                        "high"
                                      ? C.warning
                                      : C.primary
                                  }`,
                                borderRadius:
                                  6,
                                padding:
                                  "5px 6px",
                                marginBottom:
                                  4,
                                fontSize: 10,
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                              }}
                            >
                              {row.title_en}
                            </div>
                          ))}

                        {rows.length >
                        3 ? (
                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize: 9,
                            }}
                          >
                            +
                            {rows.length -
                              3}{" "}
                            more
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(330px,1fr))",
                gap: 18,
              }}
            >
              <section
                style={{
                  background: C.panel,
                  border:
                    `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Calendar Alerts
                </h3>

                {alerts.length === 0 ? (
                  <div
                    style={{
                      color: C.muted,
                      border:
                        `1px dashed ${C.border}`,
                      borderRadius: 10,
                      padding: 22,
                      textAlign:
                        "center",
                    }}
                  >
                    No calendar alerts
                    <br />
                    لا توجد تنبيهات
                  </div>
                ) : (
                  alerts
                    .slice(0, 10)
                    .map(
                      (
                        row,
                        index
                      ) => (
                        <div
                          key={`${row.event_id}-${index}`}
                          style={{
                            background:
                              C.soft,
                            padding: 11,
                            borderRadius:
                              9,
                            marginBottom:
                              7,
                          }}
                        >
                          <strong>
                            {
                              row.title_en
                            }
                          </strong>

                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize:
                                11,
                              marginTop:
                                4,
                            }}
                          >
                            Due:{" "}
                            {row.due_date}
                            {" • "}
                            {
                              row.responsible_owner ||
                              "No owner"
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                6,
                            }}
                          >
                            <Badge
                              value={
                                row.severity
                              }
                            />
                          </div>
                        </div>
                      )
                    )
                )}
              </section>

              <section
                style={{
                  background: C.panel,
                  border:
                    `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    alignItems:
                      "center",
                    marginBottom:
                      12,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    Event Register
                  </h3>

                  <select
                    style={{
                      ...field,
                      width: 180,
                    }}
                    value={
                      categoryFilter
                    }
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      All categories
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {category.replaceAll(
                            "_",
                            " "
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {filteredEvents.length ===
                0 ? (
                  <div
                    style={{
                      color: C.muted,
                      border:
                        `1px dashed ${C.border}`,
                      borderRadius: 10,
                      padding: 22,
                      textAlign:
                        "center",
                    }}
                  >
                    No HR calendar events
                    <br />
                    لا توجد أحداث
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {filteredEvents.map(
                      (row) => (
                        <div
                          key={row.id}
                          style={{
                            background:
                              C.soft,
                            borderRadius:
                              10,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: 10,
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <div>
                              <strong>
                                {
                                  row.title_en
                                }
                              </strong>

                              {row.title_ar ? (
                                <div
                                  dir="rtl"
                                  style={{
                                    color:
                                      C.muted,
                                    fontSize:
                                      11,
                                    marginTop:
                                      3,
                                  }}
                                >
                                  {
                                    row.title_ar
                                  }
                                </div>
                              ) : null}
                            </div>

                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 5,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <Badge
                                value={
                                  row.priority
                                }
                              />

                              <Badge
                                value={
                                  row.runtime_status
                                }
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize:
                                11,
                              marginTop:
                                7,
                              lineHeight:
                                1.6,
                            }}
                          >
                            Start:{" "}
                            {
                              row.start_date
                            }
                            {" • "}
                            Next:{" "}
                            {row.next_occurrence ||
                              "—"}
                            {" • "}
                            Recurrence:{" "}
                            {
                              row.recurrence_type
                            }
                            {" • "}
                            Owner:{" "}
                            {row.responsible_owner ||
                              "—"}
                          </div>

                          {row.status ===
                          "active" ? (
                            <button
                              disabled={
                                saving
                              }
                              onClick={() =>
                                changeStatus(
                                  row
                                )
                              }
                              style={{
                                marginTop:
                                  8,
                                background:
                                  C.panel,
                                color:
                                  C.warning,
                                border:
                                  `1px solid ${C.warning}55`,
                                borderRadius:
                                  7,
                                padding:
                                  "7px 9px",
                                cursor:
                                  "pointer",
                              }}
                            >
                              {row.recurrence_type ===
                              "none"
                                ? "Complete / Change Status"
                                : "Manage Series"}
                            </button>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
