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

function Badge({ value }) {
  const v = String(value || "").toLowerCase();

  let color = C.blue;

  if (
    [
      "active",
      "completed",
      "confidential",
    ].includes(v)
  ) {
    color = C.primary;
  } else if (
    [
      "pending",
      "due_soon",
      "restricted",
    ].includes(v)
  ) {
    color = C.warning;
  } else if (
    [
      "overdue",
      "highly_restricted",
    ].includes(v)
  ) {
    color = C.danger;
  } else if (
    [
      "archived",
      "cancelled",
      "none",
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
        padding: "5px 9px",
        fontSize: 11,
        fontWeight: 800,
        display: "inline-block",
      }}
    >
      {String(value || "—").replaceAll("_", " ")}
    </span>
  );
}

function employeeName(row) {
  if (!row) return "Unknown Employee";

  if (row.full_name) {
    return row.full_name;
  }

  if (row.name) {
    return row.name;
  }

  const parts = [
    row.first_name,
    row.middle_name,
    row.last_name,
  ].filter(Boolean);

  if (parts.length) {
    return parts.join(" ");
  }

  const arParts = [
    row.first_name_ar,
    row.middle_name_ar,
    row.last_name_ar,
  ].filter(Boolean);

  if (arParts.length) {
    return arParts.join(" ");
  }

  return (
    row.employee_number ||
    row.employee_code ||
    String(row.id)
  );
}

export default function ConfidentialHRNotesPage() {
  const [employees, setEmployees] =
    useState([]);

  const [notes, setNotes] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [statusFilter, setStatusFilter] =
    useState("active");

  const [employeeFilter, setEmployeeFilter] =
    useState("");

  const [levelFilter, setLevelFilter] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [form, setForm] = useState({
    employee_id: "",
    note_type: "general",
    confidentiality_level: "confidential",
    subject: "",
    content: "",
    authored_by: "HR",
    event_date: "",
    follow_up_date: "",
    tags: "",
    source_reference: "",
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

  async function loadSummary() {
    const data = await api(
      "/api/hr/confidential-notes-summary"
    );

    setSummary(data || {});
  }

  async function loadEmployees() {
    const data = await api(
      "/api/hr/employees"
    );

    setEmployees(
      Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : []
    );
  }

  async function loadNotes() {
    const params = new URLSearchParams();

    params.set(
      "status",
      statusFilter || "active"
    );

    if (employeeFilter) {
      params.set(
        "employee_id",
        employeeFilter
      );
    }

    if (levelFilter) {
      params.set(
        "confidentiality_level",
        levelFilter
      );
    }

    const data = await api(
      `/api/hr/confidential-notes?${params.toString()}`
    );

    setNotes(
      Array.isArray(data)
        ? data
        : []
    );
  }

  async function loadAll() {
    try {
      setError("");

      await Promise.all([
        loadEmployees(),
        loadSummary(),
        loadNotes(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load confidential notes"
      );
    }
  }

  useEffect(() => {
    loadEmployees();
    loadSummary();
  }, []);

  useEffect(() => {
    loadNotes().catch((err) =>
      setError(
        err?.message ||
          "Unable to load notes"
      )
    );
  }, [
    statusFilter,
    employeeFilter,
    levelFilter,
  ]);

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

  async function createNote(e) {
    e.preventDefault();

    if (!form.employee_id) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (
      !form.subject.trim() ||
      !form.content.trim()
    ) {
      setError(
        "Subject and note content are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        "/api/hr/confidential-notes",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id:
              form.employee_id,
            note_type:
              form.note_type,
            confidentiality_level:
              form.confidentiality_level,
            subject:
              form.subject.trim(),
            content:
              form.content.trim(),
            authored_by:
              form.authored_by.trim() ||
              "HR",
            event_date:
              form.event_date || null,
            follow_up_date:
              form.follow_up_date || null,
            tags:
              form.tags.trim() || null,
            source_reference:
              form.source_reference.trim() ||
              null,
          }),
        }
      );

      setForm({
        employee_id:
          form.employee_id,
        note_type: "general",
        confidentiality_level:
          "confidential",
        subject: "",
        content: "",
        authored_by:
          form.authored_by || "HR",
        event_date: "",
        follow_up_date: "",
        tags: "",
        source_reference: "",
      });

      setMessage(
        "Confidential note created successfully."
      );

      await Promise.all([
        loadNotes(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create note"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateFollowUp(row) {
    const next = window.prompt(
      "Follow-up status: none / pending / completed / cancelled",
      row.follow_up_status
    );

    if (!next) return;

    const actor = window.prompt(
      "Actor:",
      "HR"
    );

    if (!actor) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/confidential-notes/${row.id}/follow-up`,
        {
          method: "PUT",
          body: JSON.stringify({
            status:
              next.trim().toLowerCase(),
            actor: actor.trim(),
            follow_up_date:
              row.follow_up_date ||
              null,
          }),
        }
      );

      setMessage(
        "Follow-up updated."
      );

      await Promise.all([
        loadNotes(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update follow-up"
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveNote(row) {
    const by = window.prompt(
      "Archived By:",
      "HR"
    );

    if (!by) return;

    const reason = window.prompt(
      "Archive reason / سبب الأرشفة:"
    );

    if (!reason) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/confidential-notes/${row.id}/archive`,
        {
          method: "PUT",
          body: JSON.stringify({
            archived_by:
              by.trim(),
            reason:
              reason.trim(),
          }),
        }
      );

      setMessage(
        "Confidential note archived."
      );

      await Promise.all([
        loadNotes(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to archive note"
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
        fontFamily:
          "Arial, sans-serif",
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
          Confidential HR Notes
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 7,
          }}
        >
          الملاحظات السرية للموظفين
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Restricted HR workspace for
          confidential employee notes,
          follow-ups and historical records.
          Notes are archived rather than
          deleted.
        </div>

        {error ? (
          <div
            style={{
              color: C.danger,
              background:
                "rgba(255,107,107,.08)",
              border:
                `1px solid ${C.danger}33`,
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
              border:
                `1px solid ${C.primary}33`,
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
            title="Active Notes"
            value={summary.active_notes}
            subtitle="ملاحظات نشطة"
          />

          <StatCard
            title="Archived Notes"
            value={summary.archived_notes}
            subtitle="ملاحظات مؤرشفة"
            accent={C.muted}
          />

          <StatCard
            title="Pending Follow-up"
            value={
              summary.pending_follow_up
            }
            subtitle="متابعات معلقة"
            accent={C.warning}
          />

          <StatCard
            title="Follow-up Due Soon"
            value={
              summary.due_soon_follow_up
            }
            subtitle="خلال 7 أيام"
            accent={C.blue}
          />

          <StatCard
            title="Overdue Follow-up"
            value={
              summary.overdue_follow_up
            }
            subtitle="متابعات متأخرة"
            accent={C.danger}
          />

          <StatCard
            title="Highly Restricted"
            value={
              summary.highly_restricted_notes
            }
            subtitle="شديدة السرية"
            accent={C.danger}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(330px, 0.8fr) minmax(520px, 1.6fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <form
            onSubmit={createNote}
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
              New Confidential Note
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 12,
                marginBottom: 15,
              }}
            >
              إضافة ملاحظة سرية للموظف
            </div>

            <select
              style={field}
              value={form.employee_id}
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

              {employees.map((row) => (
                <option
                  key={row.id}
                  value={row.id}
                >
                  {employeeName(row)}
                  {row.employee_number
                    ? ` • ${row.employee_number}`
                    : ""}
                </option>
              ))}
            </select>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <select
                style={field}
                value={form.note_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    note_type:
                      e.target.value,
                  })
                }
              >
                <option value="general">
                  General
                </option>
                <option value="management_note">
                  Management Note
                </option>
                <option value="behavioral">
                  Behavioral
                </option>
                <option value="performance_context">
                  Performance Context
                </option>
                <option value="sensitive_context">
                  Sensitive Context
                </option>
                <option value="other">
                  Other
                </option>
              </select>

              <select
                style={field}
                value={
                  form.confidentiality_level
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    confidentiality_level:
                      e.target.value,
                  })
                }
              >
                <option value="confidential">
                  Confidential
                </option>
                <option value="restricted">
                  Restricted
                </option>
                <option value="highly_restricted">
                  Highly Restricted
                </option>
              </select>
            </div>

            <input
              style={{
                ...field,
                marginTop: 10,
              }}
              placeholder="Subject / الموضوع"
              value={form.subject}
              onChange={(e) =>
                setForm({
                  ...form,
                  subject:
                    e.target.value,
                })
              }
            />

            <textarea
              style={{
                ...field,
                minHeight: 160,
                marginTop: 10,
                resize: "vertical",
              }}
              placeholder="Confidential note content / محتوى الملاحظة"
              value={form.content}
              onChange={(e) =>
                setForm({
                  ...form,
                  content:
                    e.target.value,
                })
              }
            />

            <input
              style={{
                ...field,
                marginTop: 10,
              }}
              placeholder="Authored By"
              value={form.authored_by}
              onChange={(e) =>
                setForm({
                  ...form,
                  authored_by:
                    e.target.value,
                })
              }
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 10,
                marginTop: 10,
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
                  Event Date
                </div>

                <input
                  type="date"
                  style={field}
                  value={
                    form.event_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      event_date:
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
                  Follow-up Date
                </div>

                <input
                  type="date"
                  style={field}
                  value={
                    form.follow_up_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      follow_up_date:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <input
              style={{
                ...field,
                marginTop: 10,
              }}
              placeholder="Tags"
              value={form.tags}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags:
                    e.target.value,
                })
              }
            />

            <input
              style={{
                ...field,
                marginTop: 10,
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

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 13,
                background: C.primary,
                color: "#04100b",
                border: 0,
                borderRadius: 10,
                padding: "12px 14px",
                fontWeight: 850,
                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : "Create Confidential Note"}
            </button>
          </form>

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
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  Confidential Notes Register
                </h3>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  سجل الملاحظات السرية
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <select
                  style={{
                    ...field,
                    width: 190,
                  }}
                  value={employeeFilter}
                  onChange={(e) =>
                    setEmployeeFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All employees
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
                  style={{
                    ...field,
                    width: 150,
                  }}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="active">
                    Active
                  </option>
                  <option value="archived">
                    Archived
                  </option>
                  <option value="all">
                    All
                  </option>
                </select>

                <select
                  style={{
                    ...field,
                    width: 190,
                  }}
                  value={levelFilter}
                  onChange={(e) =>
                    setLevelFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All confidentiality
                  </option>
                  <option value="confidential">
                    Confidential
                  </option>
                  <option value="restricted">
                    Restricted
                  </option>
                  <option value="highly_restricted">
                    Highly Restricted
                  </option>
                </select>
              </div>
            </div>

            {notes.length === 0 ? (
              <div
                style={{
                  border:
                    `1px dashed ${C.border}`,
                  borderRadius: 12,
                  padding: 30,
                  textAlign: "center",
                  color: C.muted,
                }}
              >
                No confidential notes found.
                <br />
                لا توجد ملاحظات سرية
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 11,
                }}
              >
                {notes.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 13,
                      padding: 15,
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
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 11,
                            marginBottom: 4,
                          }}
                        >
                          {employeeMap[
                            row.employee_id
                          ] ||
                            row.employee_id}
                        </div>

                        <strong
                          style={{
                            fontSize: 16,
                          }}
                        >
                          {row.subject}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <Badge
                          value={
                            row.confidentiality_level
                          }
                        />
                        <Badge
                          value={row.status}
                        />
                        <Badge
                          value={
                            row.follow_up_runtime ||
                            row.follow_up_status
                          }
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        whiteSpace:
                          "pre-wrap",
                        lineHeight: 1.6,
                        marginTop: 13,
                        padding: 12,
                        background: C.panel,
                        borderRadius: 9,
                        fontSize: 13,
                      }}
                    >
                      {row.content}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 11,
                        lineHeight: 1.7,
                        marginTop: 10,
                      }}
                    >
                      Type: {row.note_type}
                      {" • "}
                      Author: {row.authored_by}
                      {" • "}
                      Event:{" "}
                      {row.event_date || "—"}
                      {" • "}
                      Follow-up:{" "}
                      {row.follow_up_date ||
                        "—"}

                      {row.tags
                        ? ` • Tags: ${row.tags}`
                        : ""}

                      {row.source_reference
                        ? ` • Ref: ${row.source_reference}`
                        : ""}
                    </div>

                    {row.status ===
                    "archived" ? (
                      <div
                        style={{
                          marginTop: 9,
                          color: C.muted,
                          fontSize: 11,
                        }}
                      >
                        Archived by{" "}
                        {row.archived_by ||
                          "—"}
                        {" • "}
                        {row.archive_reason ||
                          "No reason"}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 11,
                        }}
                      >
                        <button
                          disabled={saving}
                          onClick={() =>
                            updateFollowUp(
                              row
                            )
                          }
                          style={{
                            background: C.panel,
                            color: C.blue,
                            border:
                              `1px solid ${C.blue}55`,
                            borderRadius: 8,
                            padding:
                              "8px 10px",
                            cursor:
                              "pointer",
                          }}
                        >
                          Update Follow-up
                        </button>

                        <button
                          disabled={saving}
                          onClick={() =>
                            archiveNote(row)
                          }
                          style={{
                            background: C.panel,
                            color: C.warning,
                            border:
                              `1px solid ${C.warning}55`,
                            borderRadius: 8,
                            padding:
                              "8px 10px",
                            cursor:
                              "pointer",
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
