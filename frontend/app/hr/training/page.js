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

function Badge({ children }) {
  const value = String(children || "").toLowerCase();

  const s =
    ["completed", "passed", "active", "paid"].includes(value)
      ? {
          color: C.primary,
          background: "rgba(24,213,183,.10)",
        }
      : ["requested", "nominated", "enrolled", "pending"].includes(value)
      ? {
          color: C.warning,
          background: "rgba(245,201,107,.10)",
        }
      : ["failed", "cancelled", "no_show"].includes(value)
      ? {
          color: C.danger,
          background: "rgba(255,107,107,.10)",
        }
      : {
          color: C.blue,
          background: "rgba(114,183,255,.10)",
        };

  return (
    <span
      style={{
        ...s,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-block",
        textTransform: "capitalize",
      }}
    >
      {String(children || "—").replaceAll("_", " ")}
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

export default function TrainingDevelopmentPage() {
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState({});

  const [tab, setTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    category: "professional",
    provider: "",
    delivery_mode: "in_person",
    duration_hours: "0",
    standard_cost: "0",
    certification: false,
    certification_validity_months: "",
    mandatory: false,
    description: "",
  });

  const [sessionForm, setSessionForm] = useState({
    course_id: "",
    request_source: "hr",
    requested_by: "",
    request_date: "",
    start_date: "",
    end_date: "",
    location: "",
    provider: "",
    delivery_mode: "in_person",
    capacity: "",
    estimated_cost: "0",
    notes: "",
  });

  const [enrollmentForm, setEnrollmentForm] = useState({
    session_id: "",
    employee_id: "",
    nomination_source: "hr",
    employee_paid_amount: "0",
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

      const [e, c, s, n, m] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/training/courses"),
        api("/api/hr/training/sessions"),
        api("/api/hr/training/enrollments"),
        api("/api/hr/training/summary"),
      ]);

      setEmployees(Array.isArray(e) ? e : []);
      setCourses(Array.isArray(c) ? c : []);
      setSessions(Array.isArray(s) ? s : []);
      setEnrollments(Array.isArray(n) ? n : []);
      setSummary(m || {});
    } catch (err) {
      setError(
        err?.message ||
        "Unable to load Training & Development"
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

  const courseMap = useMemo(
    () =>
      Object.fromEntries(
        courses.map((row) => [
          row.id,
          `${row.code} — ${row.title}`,
        ])
      ),
    [courses]
  );

  const sessionMap = useMemo(
    () =>
      Object.fromEntries(
        sessions.map((row) => [
          row.id,
          `${courseMap[row.course_id] || row.course_id} • ${
            row.start_date || row.request_date
          }`,
        ])
      ),
    [sessions, courseMap]
  );

  async function createCourse(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!courseForm.code.trim()) {
        throw new Error("Course code is required");
      }

      if (!courseForm.title.trim()) {
        throw new Error("Course title is required");
      }

      await api("/api/hr/training/courses", {
        method: "POST",
        body: JSON.stringify({
          code: courseForm.code.trim(),
          title: courseForm.title.trim(),
          category: courseForm.category,
          provider:
            courseForm.provider.trim() || null,
          delivery_mode:
            courseForm.delivery_mode,
          duration_hours:
            Number(courseForm.duration_hours || 0),
          standard_cost:
            Number(courseForm.standard_cost || 0),
          currency: "SAR",
          certification:
            courseForm.certification,
          certification_validity_months:
            courseForm.certification &&
            courseForm.certification_validity_months
              ? Number(
                  courseForm.certification_validity_months
                )
              : null,
          mandatory: courseForm.mandatory,
          description:
            courseForm.description.trim() || null,
        }),
      });

      setCourseForm({
        code: "",
        title: "",
        category: "professional",
        provider: "",
        delivery_mode: "in_person",
        duration_hours: "0",
        standard_cost: "0",
        certification: false,
        certification_validity_months: "",
        mandatory: false,
        description: "",
      });

      setMessage("Training course created.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create training course"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createSession(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!sessionForm.course_id) {
        throw new Error("Select a course");
      }

      await api("/api/hr/training/sessions", {
        method: "POST",
        body: JSON.stringify({
          course_id: sessionForm.course_id,
          request_source:
            sessionForm.request_source,
          requested_by:
            sessionForm.requested_by.trim() ||
            null,
          request_date:
            sessionForm.request_date || null,
          start_date:
            sessionForm.start_date || null,
          end_date:
            sessionForm.end_date || null,
          location:
            sessionForm.location.trim() || null,
          provider:
            sessionForm.provider.trim() || null,
          delivery_mode:
            sessionForm.delivery_mode,
          capacity:
            sessionForm.capacity
              ? Number(sessionForm.capacity)
              : null,
          estimated_cost:
            Number(
              sessionForm.estimated_cost || 0
            ),
          currency: "SAR",
          notes:
            sessionForm.notes.trim() || null,
        }),
      });

      setSessionForm({
        course_id: "",
        request_source: "hr",
        requested_by: "",
        request_date: "",
        start_date: "",
        end_date: "",
        location: "",
        provider: "",
        delivery_mode: "in_person",
        capacity: "",
        estimated_cost: "0",
        notes: "",
      });

      setMessage("Training session/request created.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create training session"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateSessionStatus(row) {
    const status = window.prompt(
      "Status: requested / approved / scheduled / in_progress / completed / cancelled",
      row.status
    );

    if (!status) return;

    const actualCost = window.prompt(
      "Actual Cost / التكلفة الفعلية:",
      String(row.actual_cost || 0)
    );

    if (actualCost === null) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/training/sessions/${row.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: status.trim(),
            actual_cost:
              Number(actualCost || 0),
            notes: row.notes || null,
          }),
        }
      );

      setMessage("Training session updated.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to update training session"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createEnrollment(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!enrollmentForm.session_id) {
        throw new Error(
          "Select a training session"
        );
      }

      if (!enrollmentForm.employee_id) {
        throw new Error("Select an employee");
      }

      await api(
        "/api/hr/training/enrollments",
        {
          method: "POST",
          body: JSON.stringify({
            session_id:
              enrollmentForm.session_id,
            employee_id:
              enrollmentForm.employee_id,
            nomination_source:
              enrollmentForm.nomination_source,
            employee_paid_amount:
              Number(
                enrollmentForm.employee_paid_amount ||
                0
              ),
            notes:
              enrollmentForm.notes.trim() ||
              null,
          }),
        }
      );

      setEnrollmentForm({
        session_id: "",
        employee_id: "",
        nomination_source: "hr",
        employee_paid_amount: "0",
        notes: "",
      });

      setMessage("Employee enrolled in training.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to enroll employee"
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeEnrollment(row) {
    const result = window.prompt(
      "Result: passed / failed / completed / no_show",
      "passed"
    );

    if (!result) return;

    const attendance = window.prompt(
      "Attendance %:",
      "100"
    );

    if (attendance === null) return;

    const score = window.prompt(
      "Score (optional):",
      ""
    );

    if (score === null) return;

    const completionDate = window.prompt(
      "Completion Date (YYYY-MM-DD):",
      new Date().toISOString().slice(0, 10)
    );

    if (!completionDate) return;

    const certificateNumber = window.prompt(
      "Certificate Number (optional):",
      ""
    );

    if (certificateNumber === null) return;

    const certificateExpiry = window.prompt(
      "Certificate Expiry Date (optional YYYY-MM-DD):",
      ""
    );

    if (certificateExpiry === null) return;

    try {
      setSaving(true);
      setError("");

      await api(
        `/api/hr/training/enrollments/${row.id}/complete`,
        {
          method: "PUT",
          body: JSON.stringify({
            result: result.trim(),
            attendance_pct:
              Number(attendance || 0),
            score:
              score.trim() === ""
                ? null
                : Number(score),
            completion_date:
              completionDate.trim(),
            certificate_number:
              certificateNumber.trim() ||
              null,
            certificate_issue_date:
              certificateNumber.trim()
                ? completionDate.trim()
                : null,
            certificate_expiry_date:
              certificateExpiry.trim() ||
              null,
            notes: row.notes || null,
          }),
        }
      );

      setMessage(
        "Training completion recorded. If reimbursement is eligible, it was sent to Employee Payments & Claims."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to complete enrollment"
      );
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    ["courses", "Course Catalog"],
    ["sessions", "Training Requests / Sessions"],
    ["enrollments", "Employee Training"],
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
          Training & Development
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 8,
          }}
        >
          التدريب والتطوير
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 12,
            marginBottom: 22,
          }}
        >
          Operational / ad-hoc training only.
          No annual training plan in this version.
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
            title="Active Courses"
            value={summary.active_courses}
            subtitle="دورات متاحة"
          />

          <StatCard
            title="Requested Sessions"
            value={summary.requested_sessions}
            subtitle="طلبات تدريب"
            accent={C.warning}
          />

          <StatCard
            title="Scheduled"
            value={summary.scheduled_sessions}
            subtitle="دورات مجدولة"
            accent={C.blue}
          />

          <StatCard
            title="Active Enrollments"
            value={summary.active_enrollments}
            subtitle="موظفون مسجلون"
          />

          <StatCard
            title="Completed"
            value={summary.completed}
            subtitle="مكتملة"
          />

          <StatCard
            title="Reimbursement Pending"
            value={summary.reimbursement_pending}
            subtitle={`${money(
              summary.reimbursement_eligible_total
            )} SAR`}
            accent={C.warning}
          />
        </div>

        <div
          style={{
            background:
              "rgba(24,213,183,.05)",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 13,
            marginBottom: 18,
            color: C.muted,
            fontSize: 13,
          }}
        >
          If an employee pays for an eligible
          course and successfully completes it,
          reimbursement is created automatically
          in <strong>Employee Payments & Claims</strong>,
          not Payroll.
          <br />
          <span dir="rtl">
            إذا دفع الموظف قيمة الدورة واجتازها،
            يتم إنشاء طلب الاسترداد في مدفوعات
            ومطالبات الموظفين وليس في الرواتب.
          </span>
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

        {tab === "courses" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createCourse}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Add Training Course
              </h3>

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
                    Course Code
                  </label>
                  <input
                    style={input}
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        code: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Course Title
                  </label>
                  <input
                    style={input}
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Category
                  </label>
                  <select
                    style={input}
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="professional">
                      Professional
                    </option>
                    <option value="technical">
                      Technical
                    </option>
                    <option value="leadership">
                      Leadership
                    </option>
                    <option value="compliance">
                      Compliance
                    </option>
                    <option value="soft_skills">
                      Soft Skills
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>
                    Provider
                  </label>
                  <input
                    style={input}
                    value={courseForm.provider}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        provider: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Delivery Mode
                  </label>
                  <select
                    style={input}
                    value={
                      courseForm.delivery_mode
                    }
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        delivery_mode:
                          e.target.value,
                      })
                    }
                  >
                    <option value="in_person">
                      In Person
                    </option>
                    <option value="online">
                      Online
                    </option>
                    <option value="hybrid">
                      Hybrid
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>
                    Duration Hours
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.5"
                    value={
                      courseForm.duration_hours
                    }
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        duration_hours:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Standard Cost (SAR)
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      courseForm.standard_cost
                    }
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        standard_cost:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 18,
                  flexWrap: "wrap",
                  marginTop: 13,
                  color: C.muted,
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={
                      courseForm.certification
                    }
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        certification:
                          e.target.checked,
                      })
                    }
                  />{" "}
                  Certification
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={courseForm.mandatory}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        mandatory:
                          e.target.checked,
                      })
                    }
                  />{" "}
                  Mandatory
                </label>
              </div>

              {courseForm.certification ? (
                <div
                  style={{
                    marginTop: 12,
                    maxWidth: 350,
                  }}
                >
                  <label style={label}>
                    Certificate Validity Months
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="1"
                    value={
                      courseForm.certification_validity_months
                    }
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        certification_validity_months:
                          e.target.value,
                      })
                    }
                  />
                </div>
              ) : null}

              <div style={{ marginTop: 12 }}>
                <label style={label}>
                  Description
                </label>
                <textarea
                  style={{
                    ...input,
                    minHeight: 75,
                  }}
                  value={
                    courseForm.description
                  }
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>

              <button
                disabled={saving}
                type="submit"
                style={{
                  marginTop: 13,
                  background: C.primary,
                  color: "#04100b",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontWeight: 800,
                }}
              >
                Add Course
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
                Course Catalog
              </h3>

              {courses.length === 0 ? (
                <Empty>
                  No training courses yet
                  <br />
                  لا توجد دورات حتى الآن
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {courses.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        borderRadius: 11,
                        padding: 13,
                      }}
                    >
                      <strong>
                        {row.code} — {row.title}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {row.category}
                        {" • "}
                        {row.provider || "—"}
                        {" • "}
                        {row.duration_hours} hours
                        {" • "}
                        {money(row.standard_cost)} SAR
                      </div>

                      <div style={{ marginTop: 7 }}>
                        <Badge>{row.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "sessions" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createSession}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Training Request / Session
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
                  value={sessionForm.course_id}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      course_id: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select course...
                  </option>
                  {courses.map((row) => (
                    <option
                      key={row.id}
                      value={row.id}
                    >
                      {row.code} — {row.title}
                    </option>
                  ))}
                </select>

                <select
                  style={input}
                  value={
                    sessionForm.request_source
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      request_source:
                        e.target.value,
                    })
                  }
                >
                  <option value="hr">HR</option>
                  <option value="manager">
                    Manager
                  </option>
                  <option value="employee">
                    Employee
                  </option>
                  <option value="business">
                    Business
                  </option>
                </select>

                <input
                  style={input}
                  placeholder="Requested By"
                  value={
                    sessionForm.requested_by
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      requested_by:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={
                    sessionForm.request_date
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      request_date:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={
                    sessionForm.start_date
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      start_date:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={
                    sessionForm.end_date
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      end_date:
                        e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Provider"
                  value={sessionForm.provider}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      provider: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Location"
                  value={sessionForm.location}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      location: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="number"
                  min="0"
                  placeholder="Capacity"
                  value={sessionForm.capacity}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      capacity: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Estimated Cost"
                  value={
                    sessionForm.estimated_cost
                  }
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      estimated_cost:
                        e.target.value,
                    })
                  }
                />
              </div>

              <textarea
                style={{
                  ...input,
                  minHeight: 70,
                  marginTop: 11,
                }}
                placeholder="Notes"
                value={sessionForm.notes}
                onChange={(e) =>
                  setSessionForm({
                    ...sessionForm,
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
                Create Training Request
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
                Training Requests / Sessions
              </h3>

              {sessions.length === 0 ? (
                <Empty>
                  No training sessions yet
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {sessions.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        borderRadius: 11,
                        padding: 13,
                      }}
                    >
                      <strong>
                        {courseMap[row.course_id] ||
                          row.course_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        Request: {row.request_date}
                        {" • "}
                        Start: {row.start_date || "—"}
                        {" • "}
                        Estimated:{" "}
                        {money(
                          row.estimated_cost
                        )}{" "}
                        SAR
                        {" • "}
                        Actual:{" "}
                        {money(row.actual_cost)} SAR
                      </div>

                      <div style={{ marginTop: 7 }}>
                        <Badge>{row.status}</Badge>
                      </div>

                      <button
                        disabled={saving}
                        onClick={() =>
                          updateSessionStatus(row)
                        }
                        style={{ marginTop: 9 }}
                      >
                        Update Status
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "enrollments" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createEnrollment}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Employee Enrollment
              </h3>

              {employees.length === 0 ? (
                <div
                  style={{
                    color: C.warning,
                    marginBottom: 12,
                  }}
                >
                  No employees found — لا يوجد موظفون.
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
                    enrollmentForm.session_id
                  }
                  onChange={(e) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
                      session_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select session...
                  </option>

                  {sessions.map((row) => (
                    <option
                      key={row.id}
                      value={row.id}
                    >
                      {sessionMap[row.id]}
                    </option>
                  ))}
                </select>

                <select
                  style={input}
                  value={
                    enrollmentForm.employee_id
                  }
                  onChange={(e) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
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
                    enrollmentForm.nomination_source
                  }
                  onChange={(e) =>
                    setEnrollmentForm({
                      ...enrollmentForm,
                      nomination_source:
                        e.target.value,
                    })
                  }
                >
                  <option value="hr">HR</option>
                  <option value="manager">
                    Manager
                  </option>
                  <option value="employee">
                    Employee
                  </option>
                </select>

                <div>
                  <label style={label}>
                    Employee Paid Amount
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      enrollmentForm.employee_paid_amount
                    }
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        employee_paid_amount:
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
                value={enrollmentForm.notes}
                onChange={(e) =>
                  setEnrollmentForm({
                    ...enrollmentForm,
                    notes: e.target.value,
                  })
                }
              />

              <button
                disabled={
                  saving ||
                  employees.length === 0
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
                Enroll Employee
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
                Employee Training Register
              </h3>

              {enrollments.length === 0 ? (
                <Empty>
                  No employee training records
                  <br />
                  لا توجد سجلات تدريب موظفين
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {enrollments.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        borderRadius: 11,
                        padding: 13,
                      }}
                    >
                      <strong>
                        {employeeMap[
                          row.employee_id
                        ] || row.employee_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {sessionMap[
                          row.session_id
                        ] || row.session_id}
                      </div>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        Employee paid:{" "}
                        {money(
                          row.employee_paid_amount
                        )}{" "}
                        SAR
                        {" • "}
                        Reimbursement:{" "}
                        {money(
                          row.reimbursement_amount
                        )}{" "}
                        SAR
                        {" • "}
                        Reimbursement status:{" "}
                        {row.reimbursement_status}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <Badge>{row.status}</Badge>

                        {row.result ? (
                          <Badge>
                            {row.result}
                          </Badge>
                        ) : null}
                      </div>

                      {["enrolled", "nominated"].includes(
                        row.status
                      ) ? (
                        <button
                          disabled={saving}
                          onClick={() =>
                            completeEnrollment(row)
                          }
                          style={{ marginTop: 9 }}
                        >
                          Record Completion
                        </button>
                      ) : null}

                      {row.certificate_number ? (
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 12,
                            marginTop: 8,
                          }}
                        >
                          Certificate:{" "}
                          {row.certificate_number}
                          {" • "}
                          Expiry:{" "}
                          {row.certificate_expiry_date ||
                            "No expiry"}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
