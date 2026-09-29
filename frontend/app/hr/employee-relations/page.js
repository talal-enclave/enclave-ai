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

function statusStyle(value) {
  const status = String(value || "").toLowerCase();

  if (["closed", "acknowledged", "accepted"].includes(status)) {
    return { color: C.primary, background: "rgba(24,213,183,.10)" };
  }

  if (["open", "pending", "investigation", "decision", "issued"].includes(status)) {
    return { color: C.warning, background: "rgba(245,201,107,.10)" };
  }

  if (["rejected", "critical"].includes(status)) {
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
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-block",
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
        padding: 18,
      }}
    >
      <div style={{ color: C.muted, fontSize: 12 }}>{title}</div>
      <div
        style={{
          color: accent,
          fontSize: 30,
          fontWeight: 850,
          marginTop: 8,
        }}
      >
        {value || 0}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
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

export default function EmployeeRelationsPage() {
  const [employees, setEmployees] = useState([]);
  const [cases, setCases] = useState([]);
  const [actions, setActions] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [summary, setSummary] = useState({});
  const [attachments, setAttachments] = useState([]);

  const [caseFile, setCaseFile] = useState(null);
  const [actionFile, setActionFile] = useState(null);
  const [grievanceFile, setGrievanceFile] = useState(null);

  const [recordFiles, setRecordFiles] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [caseForm, setCaseForm] = useState({
    employee_id: "",
    case_type: "misconduct",
    category: "",
    incident_date: "",
    severity: "medium",
    description: "",
    reported_by: "",
    assigned_to: "",
  });

  const [actionForm, setActionForm] = useState({
    case_id: "",
    action_type: "written_warning",
    action_date: "",
    effective_date: "",
    expiry_date: "",
    reason: "",
    reference_number: "",
    issued_by: "",
  });

  const [grievanceForm, setGrievanceForm] = useState({
    employee_id: "",
    case_id: "",
    submitted_date: "",
    subject: "",
    details: "",
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
      throw new Error(data?.detail || `Request failed: ${response.status}`);
    }

    return data;
  }

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [
        e,
        c,
        a,
        g,
        s,
        attachmentData,
      ] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/employee-relations/cases"),
        api("/api/hr/employee-relations/disciplinary-actions"),
        api("/api/hr/employee-relations/grievances"),
        api("/api/hr/employee-relations/summary"),
        api(
          "/api/hr/attachments?module=employee_relations&status=active"
        ),
      ]);

      setEmployees(Array.isArray(e) ? e : []);
      setCases(Array.isArray(c) ? c : []);
      setActions(Array.isArray(a) ? a : []);
      setGrievances(Array.isArray(g) ? g : []);
      setSummary(s || {});

      setAttachments(
        Array.isArray(attachmentData)
          ? attachmentData
          : []
      );
    } catch (err) {
      setError(err?.message || "Unable to load Employee Relations data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function attachmentsFor(
    entityType,
    entityId
  ) {
    return attachments.filter(
      (item) =>
        item.entity_type ===
          entityType &&
        String(item.entity_id) ===
          String(entityId)
    );
  }

  function attachmentConfig(
    entityType
  ) {
    const configs = {
      employee_relation_case: {
        documentType:
          "case_evidence",
        label:
          "Case Evidence",
      },
      disciplinary_action: {
        documentType:
          "disciplinary_document",
        label:
          "Disciplinary Document",
      },
      grievance: {
        documentType:
          "grievance_supporting_document",
        label:
          "Grievance Supporting Document",
      },
    };

    return (
      configs[entityType] || {
        documentType:
          "attachment",
        label:
          "Supporting Document",
      }
    );
  }

  async function uploadERAttachment({
    entityType,
    entityId,
    employeeId,
    file,
    uploadedBy = "HR",
  }) {
    const config =
      attachmentConfig(
        entityType
      );

    const formData =
      new FormData();

    formData.append(
      "module",
      "employee_relations"
    );

    formData.append(
      "entity_type",
      entityType
    );

    formData.append(
      "entity_id",
      String(entityId)
    );

    formData.append(
      "document_type",
      config.documentType
    );

    formData.append(
      "uploaded_by",
      uploadedBy || "HR"
    );

    formData.append(
      "confidentiality_level",
      "restricted"
    );

    if (employeeId) {
      formData.append(
        "employee_id",
        String(employeeId)
      );
    }

    formData.append(
      "title",
      file.name
    );

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/hr/attachments/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          `Attachment upload failed: ${response.status}`
      );
    }

    return data;
  }

  async function archiveAttachment(
    item
  ) {
    const reason =
      window.prompt(
        "Archive reason / سبب أرشفة المستند:"
      );

    if (!reason) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/attachments/${item.id}/archive`,
        {
          method: "PUT",
          body: JSON.stringify({
            archived_by: "HR",
            reason:
              reason.trim(),
          }),
        }
      );

      setMessage(
        "Attachment archived successfully."
      );

      await load();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to archive attachment"
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadExistingERAttachment(
    entityType,
    row
  ) {
    const key =
      `${entityType}:${row.id}`;

    const file =
      recordFiles[key];

    if (!file) {
      setError(
        "Choose a file first."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await uploadERAttachment({
        entityType,
        entityId: row.id,
        employeeId:
          row.employee_id,
        file,
        uploadedBy:
          row.assigned_to ||
          row.issued_by ||
          row.reviewed_by ||
          "HR",
      });

      setRecordFiles(
        (current) => ({
          ...current,
          [key]: null,
        })
      );

      setMessage(
        "Supporting document uploaded successfully."
      );

      await load();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to upload supporting document"
      );
    } finally {
      setSaving(false);
    }
  }

  function AttachmentPanel({
    entityType,
    row,
  }) {
    const files =
      attachmentsFor(
        entityType,
        row.id
      );

    const key =
      `${entityType}:${row.id}`;

    const config =
      attachmentConfig(
        entityType
      );

    return (
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gap: 7,
        }}
      >
        {files.map(
          (item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                background: C.panel,
                border:
                  `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "7px 9px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  📎{" "}
                  {
                    item.original_file_name
                  }
                </div>

                <div
                  style={{
                    color: C.muted,
                    fontSize: 10,
                    marginTop: 3,
                  }}
                >
                  {(
                    Number(
                      item.file_size_bytes ||
                        0
                    ) /
                    1024
                  ).toFixed(1)}{" "}
                  KB
                  {" • "}
                  {
                    item.confidentiality_level
                  }
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <a
                  href={
                    item.download_url
                  }
                  style={{
                    color: C.blue,
                    fontSize: 10,
                    fontWeight: 800,
                    textDecoration:
                      "none",
                  }}
                >
                  Download
                </a>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    archiveAttachment(
                      item
                    )
                  }
                  style={{
                    background:
                      "transparent",
                    border: 0,
                    padding: 0,
                    color:
                      C.warning,
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Archive
                </button>
              </div>
            </div>
          )
        )}

        <input
          key={`${key}-${
            recordFiles[
              key
            ]?.name ||
            "empty"
          }`}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
          style={{
            ...input,
            padding: "7px 8px",
            fontSize: 11,
          }}
          onChange={(e) =>
            setRecordFiles(
              (current) => ({
                ...current,
                [key]:
                  e.target.files?.[0] ||
                  null,
              })
            )
          }
        />

        <div
          style={{
            color: C.muted,
            fontSize: 10,
          }}
        >
          {config.label} •
          Max 20 MB • Restricted
          Private HR Storage
        </div>

        <button
          type="button"
          disabled={
            saving ||
            !recordFiles[key]
          }
          onClick={() =>
            uploadExistingERAttachment(
              entityType,
              row
            )
          }
          style={{
            width: "fit-content",
          }}
        >
          Upload Document
        </button>
      </div>
    );
  }

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((row) => [row.id, employeeName(row)])
      ),
    [employees]
  );

  const caseMap = useMemo(
    () =>
      Object.fromEntries(
        cases.map((row) => [row.id, row.case_number])
      ),
    [cases]
  );

  async function createCase(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!caseForm.employee_id) throw new Error("Select an employee");
      if (!caseForm.description.trim()) throw new Error("Description is required");

      const createdCase =
        await api(
          "/api/hr/employee-relations/cases",
          {
            method: "POST",
            body: JSON.stringify({
              employee_id:
                caseForm.employee_id,
              case_type:
                caseForm.case_type,
              category:
                caseForm.category.trim() ||
                null,
              incident_date:
                caseForm.incident_date ||
                null,
              severity:
                caseForm.severity,
              description:
                caseForm.description.trim(),
              reported_by:
                caseForm.reported_by.trim() ||
                null,
              assigned_to:
                caseForm.assigned_to.trim() ||
                null,

              // Legacy compatibility only.
              attachment_url: null,
            }),
          }
        );

      let caseUploadText = "";

      if (caseFile) {
        try {
          await uploadERAttachment({
            entityType:
              "employee_relation_case",
            entityId:
              createdCase.id,
            employeeId:
              createdCase.employee_id,
            file:
              caseFile,
            uploadedBy:
              caseForm.reported_by.trim() ||
              "HR",
          });

          caseUploadText =
            " Evidence uploaded.";
        } catch (uploadErr) {
          caseUploadText =
            " Case created, but evidence upload failed.";

          setError(
            uploadErr?.message ||
              "Case created but evidence upload failed"
          );
        }
      }

      setCaseFile(null);

      setCaseForm({
        employee_id: "",
        case_type: "misconduct",
        category: "",
        incident_date: "",
        severity: "medium",
        description: "",
        reported_by: "",
        assigned_to: "",
      });

      setMessage(
        `Employee Relations case created.${caseUploadText}`
      );

      await load();
    } catch (err) {
      setError(err?.message || "Unable to create case");
    } finally {
      setSaving(false);
    }
  }

  async function investigate(row) {
    const assignedTo = window.prompt(
      "Assigned to / المحقق المسؤول:",
      row.assigned_to || "HR"
    );

    if (assignedTo === null) return;

    const findings = window.prompt(
      "Investigation findings / نتائج التحقيق:",
      row.investigation_findings || ""
    );

    if (findings === null) return;

    try {
      setSaving(true);

      await api(
        `/api/hr/employee-relations/cases/${row.id}/investigation`,
        {
          method: "PUT",
          body: JSON.stringify({
            assigned_to: assignedTo.trim() || null,
            investigation_findings: findings.trim() || null,
            actor: "user",
          }),
        }
      );

      setMessage("Investigation updated.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to update investigation");
    } finally {
      setSaving(false);
    }
  }

  async function recordDecision(row) {
    const decision = window.prompt(
      "Final decision / القرار النهائي:",
      row.final_decision || ""
    );

    if (!decision) return;

    try {
      setSaving(true);

      await api(
        `/api/hr/employee-relations/cases/${row.id}/decision`,
        {
          method: "PUT",
          body: JSON.stringify({
            final_decision: decision.trim(),
            actor: "user",
          }),
        }
      );

      setMessage("Final decision recorded.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to record decision");
    } finally {
      setSaving(false);
    }
  }

  async function closeCase(row) {
    try {
      setSaving(true);

      await api(
        `/api/hr/employee-relations/cases/${row.id}/close`,
        {
          method: "PUT",
          body: JSON.stringify({ actor: "user" }),
        }
      );

      setMessage("Case closed.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to close case");
    } finally {
      setSaving(false);
    }
  }

  async function createAction(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!actionForm.case_id) throw new Error("Select a case");
      if (!actionForm.action_date) throw new Error("Action date is required");
      if (!actionForm.reason.trim()) throw new Error("Reason is required");
      if (!actionForm.issued_by.trim()) throw new Error("Issued By is required");

      const createdAction =
        await api(
          "/api/hr/employee-relations/disciplinary-actions",
          {
            method: "POST",
            body: JSON.stringify({
              case_id:
                actionForm.case_id,
              action_type:
                actionForm.action_type,
              action_date:
                actionForm.action_date,
              effective_date:
                actionForm.effective_date ||
                null,
              expiry_date:
                actionForm.expiry_date ||
                null,
              reason:
                actionForm.reason.trim(),
              reference_number:
                actionForm.reference_number.trim() ||
                null,
              issued_by:
                actionForm.issued_by.trim(),

              // Legacy compatibility only.
              attachment_url: null,
            }),
          }
        );

      let actionUploadText = "";

      if (actionFile) {
        try {
          await uploadERAttachment({
            entityType:
              "disciplinary_action",
            entityId:
              createdAction.id,
            employeeId:
              createdAction.employee_id,
            file:
              actionFile,
            uploadedBy:
              actionForm.issued_by.trim() ||
              "HR",
          });

          actionUploadText =
            " Document uploaded.";
        } catch (uploadErr) {
          actionUploadText =
            " Action created, but document upload failed.";

          setError(
            uploadErr?.message ||
              "Action created but document upload failed"
          );
        }
      }

      setActionFile(null);

      setActionForm({
        case_id: "",
        action_type: "written_warning",
        action_date: "",
        effective_date: "",
        expiry_date: "",
        reason: "",
        reference_number: "",
        issued_by: "",
      });

      setMessage(
        `Disciplinary action issued.${actionUploadText}`
      );

      await load();
    } catch (err) {
      setError(err?.message || "Unable to issue disciplinary action");
    } finally {
      setSaving(false);
    }
  }

  async function acknowledgeAction(row) {
    const comment = window.prompt(
      "Employee comment / تعليق الموظف:",
      ""
    );

    if (comment === null) return;

    try {
      setSaving(true);

      await api(
        `/api/hr/employee-relations/disciplinary-actions/${row.id}/acknowledge`,
        {
          method: "PUT",
          body: JSON.stringify({
            employee_comment: comment.trim() || null,
            actor: "user",
          }),
        }
      );

      setMessage("Disciplinary action acknowledged.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to acknowledge action");
    } finally {
      setSaving(false);
    }
  }

  async function createGrievance(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!grievanceForm.employee_id) throw new Error("Select an employee");
      if (!grievanceForm.subject.trim()) throw new Error("Subject is required");
      if (!grievanceForm.details.trim()) throw new Error("Details are required");

      const createdGrievance =
        await api(
          "/api/hr/employee-relations/grievances",
          {
            method: "POST",
            body: JSON.stringify({
              employee_id:
                grievanceForm.employee_id,
              case_id:
                grievanceForm.case_id ||
                null,
              submitted_date:
                grievanceForm.submitted_date ||
                null,
              subject:
                grievanceForm.subject.trim(),
              details:
                grievanceForm.details.trim(),

              // Legacy compatibility only.
              attachment_url: null,
            }),
          }
        );

      let grievanceUploadText = "";

      if (grievanceFile) {
        try {
          await uploadERAttachment({
            entityType:
              "grievance",
            entityId:
              createdGrievance.id,
            employeeId:
              createdGrievance.employee_id,
            file:
              grievanceFile,
            uploadedBy:
              "HR",
          });

          grievanceUploadText =
            " Supporting document uploaded.";
        } catch (uploadErr) {
          grievanceUploadText =
            " Grievance created, but document upload failed.";

          setError(
            uploadErr?.message ||
              "Grievance created but attachment upload failed"
          );
        }
      }

      setGrievanceFile(null);

      setGrievanceForm({
        employee_id: "",
        case_id: "",
        submitted_date: "",
        subject: "",
        details: "",
      });

      setMessage(
        `Grievance submitted.${grievanceUploadText}`
      );

      await load();
    } catch (err) {
      setError(err?.message || "Unable to submit grievance");
    } finally {
      setSaving(false);
    }
  }

  async function decideGrievance(row, status) {
    const reviewer = window.prompt(
      "Reviewed By / تمت المراجعة بواسطة:",
      "HR"
    );

    if (reviewer === null) return;

    const decision = window.prompt(
      "Decision / القرار:",
      ""
    );

    if (!decision) return;

    try {
      setSaving(true);

      await api(
        `/api/hr/employee-relations/grievances/${row.id}/decision`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
            reviewed_by: reviewer.trim() || "HR",
            decision: decision.trim(),
            actor: "user",
          }),
        }
      );

      setMessage(`Grievance ${status}.`);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to decide grievance");
    } finally {
      setSaving(false);
    }
  }

  const eligibleCasesForAction = cases.filter(
    (row) => row.status === "decision" || row.status === "closed"
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
      <div style={{ maxWidth: 1550, margin: "0 auto" }}>
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

        <h1 style={{ margin: "13px 0 5px", fontSize: 31 }}>
          Employee Relations & Disciplinary
        </h1>

        <div style={{ color: C.muted, marginBottom: 22 }}>
          علاقات الموظفين والإجراءات التأديبية
        </div>

        {error ? (
          <div
            style={{
              color: C.danger,
              background: "rgba(255,107,107,.08)",
              borderRadius: 10,
              padding: 13,
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
              background: "rgba(24,213,183,.08)",
              borderRadius: 10,
              padding: 13,
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
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Open Cases"
            value={summary.open_cases}
            subtitle="قضايا مفتوحة"
            accent={C.warning}
          />
          <StatCard
            title="Investigations"
            value={summary.investigations}
            subtitle="تحت التحقيق"
            accent={C.blue}
          />
          <StatCard
            title="Awaiting Closure"
            value={summary.cases_awaiting_closure}
            subtitle="قرار مسجل بانتظار الإغلاق"
            accent={C.warning}
          />
          <StatCard
            title="Critical Cases"
            value={summary.critical_cases}
            subtitle="حالات حرجة"
            accent={C.danger}
          />
          <StatCard
            title="Issued Actions"
            value={summary.issued_disciplinary_actions}
            subtitle="إجراءات لم يتم إقرارها"
          />
          <StatCard
            title="Pending Grievances"
            value={summary.pending_grievances}
            subtitle="تظلمات معلقة"
            accent={C.warning}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <form
            onSubmit={createCase}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>New Employee Relations Case</h3>

            {employees.length === 0 ? (
              <div
                style={{
                  color: C.warning,
                  background: "rgba(245,201,107,.08)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 13,
                }}
              >
                No employees found — لا يوجد موظفون حاليًا.
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 11 }}>
              <select
                style={input}
                value={caseForm.employee_id}
                onChange={(e) =>
                  setCaseForm({
                    ...caseForm,
                    employee_id: e.target.value,
                  })
                }
              >
                <option value="">Select employee...</option>
                {employees.map((row) => (
                  <option key={row.id} value={row.id}>
                    {employeeName(row)}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <select
                  style={input}
                  value={caseForm.case_type}
                  onChange={(e) =>
                    setCaseForm({
                      ...caseForm,
                      case_type: e.target.value,
                    })
                  }
                >
                  <option value="misconduct">Misconduct</option>
                  <option value="attendance">Attendance</option>
                  <option value="performance">Performance</option>
                  <option value="workplace_behavior">
                    Workplace Behavior
                  </option>
                  <option value="policy_violation">
                    Policy Violation
                  </option>
                  <option value="complaint">Complaint</option>
                  <option value="investigation">Investigation</option>
                  <option value="other">Other</option>
                </select>

                <select
                  style={input}
                  value={caseForm.severity}
                  onChange={(e) =>
                    setCaseForm({
                      ...caseForm,
                      severity: e.target.value,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <input
                style={input}
                placeholder="Category / التصنيف"
                value={caseForm.category}
                onChange={(e) =>
                  setCaseForm({
                    ...caseForm,
                    category: e.target.value,
                  })
                }
              />

              <input
                style={input}
                type="date"
                value={caseForm.incident_date}
                onChange={(e) =>
                  setCaseForm({
                    ...caseForm,
                    incident_date: e.target.value,
                  })
                }
              />

              <textarea
                style={{ ...input, minHeight: 90 }}
                placeholder="Case description / وصف الحالة"
                value={caseForm.description}
                onChange={(e) =>
                  setCaseForm({
                    ...caseForm,
                    description: e.target.value,
                  })
                }
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <input
                  style={input}
                  placeholder="Reported By"
                  value={caseForm.reported_by}
                  onChange={(e) =>
                    setCaseForm({
                      ...caseForm,
                      reported_by: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Assigned To"
                  value={caseForm.assigned_to}
                  onChange={(e) =>
                    setCaseForm({
                      ...caseForm,
                      assigned_to: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 11,
              }}
            >
              <input
                key={
                  caseFile
                    ? caseFile.name
                    : "empty-case-file"
                }
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                style={{
                  ...input,
                  padding: "8px 9px",
                }}
                onChange={(e) =>
                  setCaseFile(
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              <div
                style={{
                  color: C.muted,
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Case Evidence • Optional •
                Max 20 MB • Restricted
                Private HR Storage
              </div>
            </div>

            <button
              disabled={saving || employees.length === 0}
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
              Create Case
            </button>
          </form>

          <form
            onSubmit={createAction}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Disciplinary Action</h3>

            <div style={{ display: "grid", gap: 11 }}>
              <select
                style={input}
                value={actionForm.case_id}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    case_id: e.target.value,
                  })
                }
              >
                <option value="">Select decided case...</option>

                {eligibleCasesForAction.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.case_number} —{" "}
                    {employeeMap[row.employee_id] || row.employee_id}
                  </option>
                ))}
              </select>

              <select
                style={input}
                value={actionForm.action_type}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    action_type: e.target.value,
                  })
                }
              >
                <option value="verbal_warning">Verbal Warning</option>
                <option value="written_warning">Written Warning</option>
                <option value="final_warning">Final Warning</option>
                <option value="suspension">Suspension</option>
                <option value="deduction">Deduction</option>
                <option value="termination">Termination</option>
                <option value="other">Other</option>
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <input
                  style={input}
                  type="date"
                  value={actionForm.action_date}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      action_date: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Issued By"
                  value={actionForm.issued_by}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      issued_by: e.target.value,
                    })
                  }
                />
              </div>

              <textarea
                style={{ ...input, minHeight: 85 }}
                placeholder="Reason / سبب الإجراء"
                value={actionForm.reason}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    reason: e.target.value,
                  })
                }
              />

              <input
                style={input}
                placeholder="Reference Number"
                value={actionForm.reference_number}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    reference_number: e.target.value,
                  })
                }
              />
            </div>

            <div
              style={{
                marginTop: 11,
              }}
            >
              <input
                key={
                  actionFile
                    ? actionFile.name
                    : "empty-action-file"
                }
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                style={{
                  ...input,
                  padding: "8px 9px",
                }}
                onChange={(e) =>
                  setActionFile(
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              <div
                style={{
                  color: C.muted,
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Warning / Decision Document •
                Optional • Max 20 MB •
                Restricted Private HR Storage
              </div>
            </div>

            <button
              disabled={saving}
              type="submit"
              style={{
                marginTop: 13,
                background: C.warning,
                color: "#171005",
                border: 0,
                borderRadius: 9,
                padding: "10px 14px",
                fontWeight: 800,
              }}
            >
              Issue Action
            </button>
          </form>
        </div>

        <section
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Employee Relations Cases</h3>

          {cases.length === 0 ? (
            <Empty>No cases yet — لا توجد قضايا حتى الآن</Empty>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {cases.map((row) => (
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
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {row.case_number} —{" "}
                        {employeeMap[row.employee_id] || row.employee_id}
                      </strong>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {row.case_type} • {row.severity} •{" "}
                        {row.incident_date || "No incident date"}
                      </div>
                    </div>

                    <Badge>{row.status}</Badge>
                  </div>

                  <div
                    style={{
                      color: C.muted,
                      marginTop: 9,
                      fontSize: 13,
                    }}
                  >
                    {row.description}
                  </div>

                  {row.investigation_findings ? (
                    <div
                      style={{
                        marginTop: 9,
                        padding: 10,
                        borderRadius: 8,
                        background: C.panel,
                      }}
                    >
                      <strong>Investigation:</strong>{" "}
                      {row.investigation_findings}
                    </div>
                  ) : null}

                  {row.final_decision ? (
                    <div
                      style={{
                        marginTop: 9,
                        padding: 10,
                        borderRadius: 8,
                        background: C.panel,
                      }}
                    >
                      <strong>Decision:</strong> {row.final_decision}
                    </div>
                  ) : null}

                  <AttachmentPanel
                    entityType="employee_relation_case"
                    row={row}
                  />

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    {["open", "investigation"].includes(row.status) ? (
                      <button
                        disabled={saving}
                        onClick={() => investigate(row)}
                      >
                        Investigation
                      </button>
                    ) : null}

                    {["open", "investigation"].includes(row.status) ? (
                      <button
                        disabled={saving}
                        onClick={() => recordDecision(row)}
                      >
                        Record Decision
                      </button>
                    ) : null}

                    {row.status === "decision" ? (
                      <button
                        disabled={saving}
                        onClick={() => closeCase(row)}
                      >
                        Close Case
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(420px, 1fr))",
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
            <h3 style={{ marginTop: 0 }}>Disciplinary Action Register</h3>

            {actions.length === 0 ? (
              <Empty>No disciplinary actions — لا توجد إجراءات</Empty>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {actions.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <strong>
                      {employeeMap[row.employee_id] || row.employee_id}
                    </strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {row.action_type} • {row.action_date}
                      {" • "}
                      {caseMap[row.case_id] || row.case_id}
                    </div>

                    <div style={{ marginTop: 7 }}>
                      <Badge>{row.status}</Badge>
                    </div>

                    <AttachmentPanel
                      entityType="disciplinary_action"
                      row={row}
                    />

                    {row.status === "issued" ? (
                      <button
                        disabled={saving}
                        onClick={() => acknowledgeAction(row)}
                        style={{ marginTop: 9 }}
                      >
                        Record Acknowledgement
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
            <h3 style={{ marginTop: 0 }}>Grievances & Appeals</h3>

            <form
              onSubmit={createGrievance}
              style={{ display: "grid", gap: 9, marginBottom: 16 }}
            >
              <select
                style={input}
                value={grievanceForm.employee_id}
                onChange={(e) =>
                  setGrievanceForm({
                    ...grievanceForm,
                    employee_id: e.target.value,
                    case_id: "",
                  })
                }
              >
                <option value="">Select employee...</option>

                {employees.map((row) => (
                  <option key={row.id} value={row.id}>
                    {employeeName(row)}
                  </option>
                ))}
              </select>

              <select
                style={input}
                value={grievanceForm.case_id}
                onChange={(e) =>
                  setGrievanceForm({
                    ...grievanceForm,
                    case_id: e.target.value,
                  })
                }
              >
                <option value="">No related case</option>

                {cases
                  .filter(
                    (row) =>
                      !grievanceForm.employee_id ||
                      row.employee_id === grievanceForm.employee_id
                  )
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.case_number}
                    </option>
                  ))}
              </select>

              <input
                style={input}
                type="date"
                value={grievanceForm.submitted_date}
                onChange={(e) =>
                  setGrievanceForm({
                    ...grievanceForm,
                    submitted_date: e.target.value,
                  })
                }
              />

              <input
                style={input}
                placeholder="Subject / الموضوع"
                value={grievanceForm.subject}
                onChange={(e) =>
                  setGrievanceForm({
                    ...grievanceForm,
                    subject: e.target.value,
                  })
                }
              />

              <textarea
                style={{ ...input, minHeight: 75 }}
                placeholder="Details / التفاصيل"
                value={grievanceForm.details}
                onChange={(e) =>
                  setGrievanceForm({
                    ...grievanceForm,
                    details: e.target.value,
                  })
                }
              />

              <div>
                <input
                  key={
                    grievanceFile
                      ? grievanceFile.name
                      : "empty-grievance-file"
                  }
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                  style={{
                    ...input,
                    padding: "8px 9px",
                  }}
                  onChange={(e) =>
                    setGrievanceFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

                <div
                  style={{
                    color: C.muted,
                    fontSize: 10,
                    marginTop: 5,
                  }}
                >
                  Grievance Supporting Document •
                  Optional • Max 20 MB •
                  Restricted Private HR Storage
                </div>
              </div>

              <button
                disabled={saving}
                type="submit"
                style={{
                  background: C.primary,
                  color: "#04100b",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Submit Grievance
              </button>
            </form>

            {grievances.length === 0 ? (
              <Empty>No grievances — لا توجد تظلمات</Empty>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {grievances.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <strong>
                      {employeeMap[row.employee_id] || row.employee_id}
                    </strong>

                    <div style={{ marginTop: 5 }}>
                      {row.subject}
                    </div>

                    <div style={{ marginTop: 7 }}>
                      <Badge>{row.status}</Badge>
                    </div>

                    <AttachmentPanel
                      entityType="grievance"
                      row={row}
                    />

                    {row.status === "pending" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          marginTop: 9,
                        }}
                      >
                        <button
                          disabled={saving}
                          onClick={() =>
                            decideGrievance(row, "accepted")
                          }
                        >
                          Accept
                        </button>

                        <button
                          disabled={saving}
                          onClick={() =>
                            decideGrievance(row, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
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
