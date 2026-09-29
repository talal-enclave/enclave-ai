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

function statusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return {
      color: C.primary,
      background: "rgba(24,213,183,.10)",
    };
  }

  if (value === "renewal_due") {
    return {
      color: C.blue,
      background: "rgba(114,183,255,.10)",
    };
  }

  if (value === "escalation") {
    return {
      color: C.warning,
      background: "rgba(245,201,107,.10)",
    };
  }

  if (value === "expired") {
    return {
      color: C.danger,
      background: "rgba(255,107,107,.10)",
    };
  }

  return {
    color: C.muted,
    background: "rgba(255,255,255,.05)",
  };
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

export default function GovernmentCompliancePage() {
  const [employees, setEmployees] = useState([]);
  const [corporate, setCorporate] = useState([]);
  const [employeeDocs, setEmployeeDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [recordFiles, setRecordFiles] = useState({});

  const [tab, setTab] = useState("corporate");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [corporateForm, setCorporateForm] = useState({
    record_type: "commercial_registration",
    category: "government_license",
    entity_name: "",
    branch_name: "",
    issuing_authority: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    responsible_owner: "",
    renewal_lead_days: "60",
    escalation_lead_days: "30",
    renewal_cost: "0",
    notes: "",
  });

  const [employeeForm, setEmployeeForm] = useState({
    employee_id: "",
    document_type: "iqama",
    issuing_authority: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    responsible_owner: "",
    renewal_lead_days: "60",
    escalation_lead_days: "30",
    renewal_cost: "0",
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

      const [e, c, d, h, s] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/government-compliance/corporate"),
        api("/api/hr/government-compliance/employee-documents"),
        api("/api/hr/government-compliance/renewal-history"),
        api("/api/hr/government-compliance/summary"),
      ]);

      setEmployees(Array.isArray(e) ? e : []);
      setCorporate(Array.isArray(c) ? c : []);
      setEmployeeDocs(Array.isArray(d) ? d : []);
      setHistory(Array.isArray(h) ? h : []);
      setSummary(s || {});

      const attachmentData = await api(
        "/api/hr/attachments?module=government_compliance&status=active"
      );

      setAttachments(
        Array.isArray(attachmentData)
          ? attachmentData
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "Unable to load Government & Compliance data"
      );
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

  async function uploadComplianceAttachment(
    scope,
    row
  ) {
    const file =
      recordFiles[row.id];

    if (!file) {
      setError(
        "Choose a document first."
      );
      return;
    }

    const isCorporate =
      scope === "corporate";

    const entityType =
      isCorporate
        ? "corporate_compliance_record"
        : "employee_government_document";

    const documentType =
      isCorporate
        ? "corporate_compliance_document"
        : "employee_government_document";

    const formData = new FormData();

    formData.append(
      "module",
      "government_compliance"
    );

    formData.append(
      "entity_type",
      entityType
    );

    formData.append(
      "entity_id",
      String(row.id)
    );

    formData.append(
      "document_type",
      documentType
    );

    formData.append(
      "uploaded_by",
      row.responsible_owner || "HR"
    );

    formData.append(
      "confidentiality_level",
      isCorporate
        ? "confidential"
        : "restricted"
    );

    if (
      !isCorporate &&
      row.employee_id
    ) {
      formData.append(
        "employee_id",
        String(row.employee_id)
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

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
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

      setRecordFiles(
        (current) => ({
          ...current,
          [row.id]: null,
        })
      );

      setMessage(
        isCorporate
          ? "Company / branch document uploaded."
          : "Employee government document uploaded."
      );

      await load();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to upload document"
      );
    } finally {
      setSaving(false);
    }
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
        "Document archived successfully."
      );

      await load();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to archive document"
      );
    } finally {
      setSaving(false);
    }
  }

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

  async function createCorporate(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!corporateForm.entity_name.trim()) {
        throw new Error("Entity name is required");
      }

      await api(
        "/api/hr/government-compliance/corporate",
        {
          method: "POST",
          body: JSON.stringify({
            record_type:
              corporateForm.record_type,
            category:
              corporateForm.category,
            entity_name:
              corporateForm.entity_name.trim(),
            branch_name:
              corporateForm.branch_name.trim() ||
              null,
            issuing_authority:
              corporateForm.issuing_authority.trim() ||
              null,
            document_number:
              corporateForm.document_number.trim() ||
              null,
            issue_date:
              corporateForm.issue_date || null,
            expiry_date:
              corporateForm.expiry_date || null,
            responsible_owner:
              corporateForm.responsible_owner.trim() ||
              null,
            renewal_lead_days:
              Number(
                corporateForm.renewal_lead_days
              ),
            escalation_lead_days:
              Number(
                corporateForm.escalation_lead_days
              ),
            renewal_cost:
              Number(
                corporateForm.renewal_cost || 0
              ),
            currency: "SAR",
            attachment_url: null,
            notes:
              corporateForm.notes.trim() ||
              null,
          }),
        }
      );

      setCorporateForm({
        record_type: "commercial_registration",
        category: "government_license",
        entity_name: "",
        branch_name: "",
        issuing_authority: "",
        document_number: "",
        issue_date: "",
        expiry_date: "",
        responsible_owner: "",
        renewal_lead_days: "60",
        escalation_lead_days: "30",
        renewal_cost: "0",
        notes: "",
      });

      setMessage(
        "Corporate compliance record created."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create compliance record"
      );
    } finally {
      setSaving(false);
    }
  }

  async function createEmployeeDocument(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!employeeForm.employee_id) {
        throw new Error("Select an employee");
      }

      await api(
        "/api/hr/government-compliance/employee-documents",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id:
              employeeForm.employee_id,
            document_type:
              employeeForm.document_type,
            issuing_authority:
              employeeForm.issuing_authority.trim() ||
              null,
            document_number:
              employeeForm.document_number.trim() ||
              null,
            issue_date:
              employeeForm.issue_date || null,
            expiry_date:
              employeeForm.expiry_date || null,
            responsible_owner:
              employeeForm.responsible_owner.trim() ||
              null,
            renewal_lead_days:
              Number(
                employeeForm.renewal_lead_days
              ),
            escalation_lead_days:
              Number(
                employeeForm.escalation_lead_days
              ),
            renewal_cost:
              Number(
                employeeForm.renewal_cost || 0
              ),
            currency: "SAR",
            attachment_url: null,
            notes:
              employeeForm.notes.trim() ||
              null,
          }),
        }
      );

      setEmployeeForm({
        employee_id: "",
        document_type: "iqama",
        issuing_authority: "",
        document_number: "",
        issue_date: "",
        expiry_date: "",
        responsible_owner: "",
        renewal_lead_days: "60",
        escalation_lead_days: "30",
        renewal_cost: "0",
        notes: "",
      });

      setMessage(
        "Employee government document created."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create employee document"
      );
    } finally {
      setSaving(false);
    }
  }

  async function renewRecord(scope, row) {
    const newExpiry = window.prompt(
      "New Expiry Date (YYYY-MM-DD) / تاريخ الانتهاء الجديد:"
    );

    if (!newExpiry) return;

    const newIssue = window.prompt(
      "New Issue Date (YYYY-MM-DD) / تاريخ الإصدار الجديد:",
      ""
    );

    if (newIssue === null) return;

    const cost = window.prompt(
      "Renewal Cost / تكلفة التجديد:",
      String(row.renewal_cost || 0)
    );

    if (cost === null) return;

    const renewedBy = window.prompt(
      "Renewed By / تم التجديد بواسطة:",
      row.responsible_owner || "HR"
    );

    if (!renewedBy) return;

    const reference = window.prompt(
      "Renewal Reference / مرجع التجديد:",
      ""
    );

    if (reference === null) return;

    const base =
      scope === "corporate"
        ? "/api/hr/government-compliance/corporate"
        : "/api/hr/government-compliance/employee-documents";

    try {
      setSaving(true);
      setError("");

      await api(
        `${base}/${row.id}/renew`,
        {
          method: "POST",
          body: JSON.stringify({
            new_issue_date:
              newIssue.trim() || null,
            new_expiry_date:
              newExpiry.trim(),
            renewal_cost:
              Number(cost || 0),
            currency: "SAR",
            renewed_by:
              renewedBy.trim(),
            reference_number:
              reference.trim() || null,
            attachment_url: null,
            notes: null,
          }),
        }
      );

      setMessage("Record renewed successfully.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to renew record"
      );
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    ["corporate", "Company & Branch Licenses"],
    ["employee", "Employee Documents"],
    ["history", "Renewal History"],
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
          Government & Corporate Compliance
        </h1>

        <div
          style={{
            color: C.muted,
            marginBottom: 22,
          }}
        >
          سجل التراخيص والالتزامات الحكومية
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
            title="Active"
            value={summary.active}
            subtitle="سجلات سارية"
          />

          <StatCard
            title="Renewal Due"
            value={summary.renewal_due}
            subtitle="دخلت فترة التجديد"
            accent={C.blue}
          />

          <StatCard
            title="Escalation"
            value={summary.escalation}
            subtitle="تحتاج تصعيد عاجل"
            accent={C.warning}
          />

          <StatCard
            title="Expired"
            value={summary.expired}
            subtitle="منتهية"
            accent={C.danger}
          />

          <StatCard
            title="Corporate Records"
            value={summary.corporate_records}
            subtitle="الشركة والفروع"
          />

          <StatCard
            title="Employee Documents"
            value={summary.employee_documents}
            subtitle="وثائق الموظفين"
            accent={C.blue}
          />

          <StatCard
            title="Upcoming Renewal Cost"
            value={`${money(
              summary.upcoming_renewal_cost
            )} SAR`}
            subtitle="تكلفة التجديد المتوقعة"
            accent={C.warning}
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

        {tab === "corporate" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <form
              onSubmit={createCorporate}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Add Company / Branch Record
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
                    Record Type
                  </label>

                  <select
                    style={input}
                    value={
                      corporateForm.record_type
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        record_type:
                          e.target.value,
                      })
                    }
                  >
                    <option value="commercial_registration">
                      Commercial Registration (CR)
                    </option>
                    <option value="balady_license">
                      Balady Municipal License
                    </option>
                    <option value="civil_defense">
                      Civil Defense / Safety Permit
                    </option>
                    <option value="zatca">
                      ZATCA Registration / Certificate
                    </option>
                    <option value="chamber_of_commerce">
                      Chamber of Commerce
                    </option>
                    <option value="qiwa">
                      Qiwa Registration
                    </option>
                    <option value="mudad">
                      Mudad Registration
                    </option>
                    <option value="gosi">
                      GOSI Registration
                    </option>
                    <option value="saudization_certificate">
                      Saudization / Localization Certificate
                    </option>
                    <option value="mhrsd_license">
                      MHRSD License / Registration
                    </option>
                    <option value="other">
                      Other Government Requirement
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>
                    Category
                  </label>

                  <select
                    style={input}
                    value={corporateForm.category}
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    <option value="government_license">
                      Government License
                    </option>
                    <option value="registration">
                      Registration
                    </option>
                    <option value="certificate">
                      Certificate
                    </option>
                    <option value="permit">
                      Permit
                    </option>
                    <option value="membership">
                      Membership
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>
                    Entity / Company
                  </label>

                  <input
                    style={input}
                    value={
                      corporateForm.entity_name
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        entity_name:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Branch
                  </label>

                  <input
                    style={input}
                    value={
                      corporateForm.branch_name
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        branch_name:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Issuing Authority
                  </label>

                  <input
                    style={input}
                    value={
                      corporateForm.issuing_authority
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        issuing_authority:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    License / Certificate Number
                  </label>

                  <input
                    style={input}
                    value={
                      corporateForm.document_number
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        document_number:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Issue Date
                  </label>
                  <input
                    style={input}
                    type="date"
                    value={
                      corporateForm.issue_date
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        issue_date:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Expiry Date
                  </label>
                  <input
                    style={input}
                    type="date"
                    value={
                      corporateForm.expiry_date
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        expiry_date:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Responsible Owner
                  </label>

                  <input
                    style={input}
                    value={
                      corporateForm.responsible_owner
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        responsible_owner:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Renewal Alert Days
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    value={
                      corporateForm.renewal_lead_days
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        renewal_lead_days:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Escalation Days
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    value={
                      corporateForm.escalation_lead_days
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        escalation_lead_days:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Renewal Cost (SAR)
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      corporateForm.renewal_cost
                    }
                    onChange={(e) =>
                      setCorporateForm({
                        ...corporateForm,
                        renewal_cost:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: 11 }}>
                <label style={label}>Notes</label>
                <textarea
                  style={{
                    ...input,
                    minHeight: 70,
                  }}
                  value={corporateForm.notes}
                  onChange={(e) =>
                    setCorporateForm({
                      ...corporateForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

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
                Add Compliance Record
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
                Company & Branch Register
              </h3>

              {corporate.length === 0 ? (
                <Empty>
                  No corporate compliance records
                  <br />
                  لا توجد تراخيص أو شهادات مسجلة
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {corporate.map((row) => (
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
                            {row.record_type.replaceAll(
                              "_",
                              " "
                            )}
                          </strong>

                          <div
                            style={{
                              color: C.muted,
                              fontSize: 12,
                              marginTop: 5,
                            }}
                          >
                            {row.entity_name}
                            {row.branch_name
                              ? ` • ${row.branch_name}`
                              : ""}
                            {" • "}
                            {row.document_number ||
                              "No number"}
                          </div>
                        </div>

                        <Badge>
                          {row.status}
                        </Badge>
                      </div>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 8,
                        }}
                      >
                        Expiry:{" "}
                        {row.expiry_date || "—"}
                        {" • "}
                        Days remaining:{" "}
                        {row.days_remaining ??
                          "N/A"}
                        {" • "}
                        Owner:{" "}
                        {row.responsible_owner ||
                          "—"}
                        {" • "}
                        Renewal cost:{" "}
                        {money(row.renewal_cost)} SAR
                      </div>

                      {attachmentsFor(
                        "corporate_compliance_record",
                        row.id
                      ).length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          {attachmentsFor(
                            "corporate_compliance_record",
                            row.id
                          ).map(
                            (item) => (
                              <div
                                key={item.id}
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap: 8,
                                  flexWrap:
                                    "wrap",
                                  background:
                                    C.panel,
                                  border:
                                    `1px solid ${C.border}`,
                                  borderRadius:
                                    8,
                                  padding:
                                    "7px 9px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize:
                                        11,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    📎{" "}
                                    {
                                      item.original_file_name
                                    }
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        C.muted,
                                      fontSize:
                                        10,
                                      marginTop:
                                        3,
                                    }}
                                  >
                                    {(
                                      Number(
                                        item.file_size_bytes ||
                                          0
                                      ) /
                                      1024
                                    ).toFixed(
                                      1
                                    )}{" "}
                                    KB
                                    {" • "}
                                    {
                                      item.confidentiality_level
                                    }
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap: 8,
                                  }}
                                >
                                  <a
                                    href={
                                      item.download_url
                                    }
                                    style={{
                                      color:
                                        C.blue,
                                      fontSize:
                                        10,
                                      fontWeight:
                                        800,
                                      textDecoration:
                                        "none",
                                    }}
                                  >
                                    Download
                                  </a>

                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      archiveAttachment(
                                        item
                                      )
                                    }
                                    style={{
                                      border: 0,
                                      background:
                                        "transparent",
                                      padding: 0,
                                      color:
                                        C.warning,
                                      fontSize:
                                        10,
                                      fontWeight:
                                        800,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    Archive
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : null}

                      <div
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <input
                          key={`${row.id}-${
                            recordFiles[
                              row.id
                            ]?.name ||
                            "empty"
                          }`}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                          style={{
                            ...input,
                            padding:
                              "7px 8px",
                            fontSize: 11,
                          }}
                          onChange={(e) =>
                            setRecordFiles(
                              (
                                current
                              ) => ({
                                ...current,
                                [row.id]:
                                  e.target
                                    .files?.[0] ||
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
                          License / Certificate
                          / Renewal Document •
                          Max 20 MB • Private
                          Storage
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 9,
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            saving ||
                            !recordFiles[
                              row.id
                            ]
                          }
                          onClick={() =>
                            uploadComplianceAttachment(
                              "corporate",
                              row
                            )
                          }
                        >
                          Upload Document
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            renewRecord(
                              "corporate",
                              row
                            )
                          }
                        >
                          Renew
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "employee" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <form
              onSubmit={createEmployeeDocument}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Add Employee Government Document
              </h3>

              {employees.length === 0 ? (
                <div
                  style={{
                    color: C.warning,
                    background:
                      "rgba(245,201,107,.08)",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                >
                  No employees found — لا يوجد
                  موظفون حاليًا.
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
                <div>
                  <label style={label}>
                    Employee
                  </label>

                  <select
                    style={input}
                    value={
                      employeeForm.employee_id
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
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
                </div>

                <div>
                  <label style={label}>
                    Document Type
                  </label>

                  <select
                    style={input}
                    value={
                      employeeForm.document_type
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        document_type:
                          e.target.value,
                      })
                    }
                  >
                    <option value="iqama">
                      Iqama
                    </option>
                    <option value="work_permit">
                      Work Permit
                    </option>
                    <option value="passport">
                      Passport
                    </option>
                    <option value="exit_reentry_visa">
                      Exit / Re-entry Visa
                    </option>
                    <option value="work_visa">
                      Work Visa
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label style={label}>
                    Document Number
                  </label>
                  <input
                    style={input}
                    value={
                      employeeForm.document_number
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        document_number:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Issuing Authority
                  </label>
                  <input
                    style={input}
                    value={
                      employeeForm.issuing_authority
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        issuing_authority:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Issue Date
                  </label>
                  <input
                    style={input}
                    type="date"
                    value={
                      employeeForm.issue_date
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        issue_date:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Expiry Date
                  </label>
                  <input
                    style={input}
                    type="date"
                    value={
                      employeeForm.expiry_date
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        expiry_date:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Responsible Owner
                  </label>
                  <input
                    style={input}
                    value={
                      employeeForm.responsible_owner
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        responsible_owner:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Renewal Alert Days
                  </label>
                  <input
                    style={input}
                    type="number"
                    value={
                      employeeForm.renewal_lead_days
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        renewal_lead_days:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Escalation Days
                  </label>
                  <input
                    style={input}
                    type="number"
                    value={
                      employeeForm.escalation_lead_days
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        escalation_lead_days:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Renewal Cost
                  </label>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      employeeForm.renewal_cost
                    }
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        renewal_cost:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: 11 }}>
                <label style={label}>
                  Notes
                </label>
                <textarea
                  style={{
                    ...input,
                    minHeight: 70,
                  }}
                  value={employeeForm.notes}
                  onChange={(e) =>
                    setEmployeeForm({
                      ...employeeForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

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
                Add Employee Document
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
                Employee Government Documents
              </h3>

              {employeeDocs.length === 0 ? (
                <Empty>
                  No employee government
                  documents
                  <br />
                  لا توجد وثائق موظفين
                </Empty>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {employeeDocs.map((row) => (
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
                            {row.document_type.replaceAll(
                              "_",
                              " "
                            )}
                            {" • "}
                            {row.document_number ||
                              "No number"}
                          </div>
                        </div>

                        <Badge>
                          {row.status}
                        </Badge>
                      </div>

                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 8,
                        }}
                      >
                        Expiry:{" "}
                        {row.expiry_date || "—"}
                        {" • "}
                        Days remaining:{" "}
                        {row.days_remaining ??
                          "N/A"}
                        {" • "}
                        Owner:{" "}
                        {row.responsible_owner ||
                          "—"}
                      </div>

                      {attachmentsFor(
                        "employee_government_document",
                        row.id
                      ).length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          {attachmentsFor(
                            "employee_government_document",
                            row.id
                          ).map(
                            (item) => (
                              <div
                                key={item.id}
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap: 8,
                                  flexWrap:
                                    "wrap",
                                  background:
                                    C.panel,
                                  border:
                                    `1px solid ${C.border}`,
                                  borderRadius:
                                    8,
                                  padding:
                                    "7px 9px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize:
                                        11,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    📎{" "}
                                    {
                                      item.original_file_name
                                    }
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        C.muted,
                                      fontSize:
                                        10,
                                      marginTop:
                                        3,
                                    }}
                                  >
                                    {(
                                      Number(
                                        item.file_size_bytes ||
                                          0
                                      ) /
                                      1024
                                    ).toFixed(
                                      1
                                    )}{" "}
                                    KB
                                    {" • "}
                                    {
                                      item.confidentiality_level
                                    }
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap: 8,
                                  }}
                                >
                                  <a
                                    href={
                                      item.download_url
                                    }
                                    style={{
                                      color:
                                        C.blue,
                                      fontSize:
                                        10,
                                      fontWeight:
                                        800,
                                      textDecoration:
                                        "none",
                                    }}
                                  >
                                    Download
                                  </a>

                                  <button
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      archiveAttachment(
                                        item
                                      )
                                    }
                                    style={{
                                      border: 0,
                                      background:
                                        "transparent",
                                      padding: 0,
                                      color:
                                        C.warning,
                                      fontSize:
                                        10,
                                      fontWeight:
                                        800,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    Archive
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : null}

                      <div
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <input
                          key={`${row.id}-${
                            recordFiles[
                              row.id
                            ]?.name ||
                            "empty"
                          }`}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                          style={{
                            ...input,
                            padding:
                              "7px 8px",
                            fontSize: 11,
                          }}
                          onChange={(e) =>
                            setRecordFiles(
                              (
                                current
                              ) => ({
                                ...current,
                                [row.id]:
                                  e.target
                                    .files?.[0] ||
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
                          Iqama / Passport /
                          Permit / Renewal File •
                          Max 20 MB • Restricted
                          HR Storage
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 9,
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            saving ||
                            !recordFiles[
                              row.id
                            ]
                          }
                          onClick={() =>
                            uploadComplianceAttachment(
                              "employee",
                              row
                            )
                          }
                        >
                          Upload Document
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            renewRecord(
                              "employee",
                              row
                            )
                          }
                        >
                          Renew
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "history" ? (
          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Renewal History
            </h3>

            {history.length === 0 ? (
              <Empty>
                No renewal history yet
                <br />
                لا يوجد سجل تجديدات حتى الآن
              </Empty>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 9,
                }}
              >
                {history.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      borderRadius: 11,
                      padding: 13,
                    }}
                  >
                    <strong>
                      {row.record_scope ===
                      "corporate"
                        ? "Company / Branch"
                        : "Employee Document"}
                    </strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Previous expiry:{" "}
                      {row.previous_expiry_date ||
                        "—"}
                      {" → "}
                      New expiry:{" "}
                      {row.new_expiry_date ||
                        "—"}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Renewed by:{" "}
                      {row.renewed_by}
                      {" • "}
                      Cost:{" "}
                      {money(
                        row.renewal_cost
                      )}{" "}
                      {row.currency}
                      {" • "}
                      Reference:{" "}
                      {row.reference_number ||
                        "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
