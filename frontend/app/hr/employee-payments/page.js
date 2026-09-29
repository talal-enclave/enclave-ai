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

const th = {
  color: C.muted,
  fontSize: 12,
  fontWeight: 700,
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: "nowrap",
};

const td = {
  color: C.text,
  fontSize: 13,
  padding: "13px 10px",
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: "middle",
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

function paymentTypeLabel(value) {
  const labels = {
    overtime: "Overtime",
    business_trip: "Business Trip / Per Diem",
    reimbursement: "Reimbursement",
    ticket: "Ticket",
    compensation: "Compensation",
    other: "Other Payment",
  };

  return labels[value] || value || "—";
}

function statusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value === "paid") {
    return {
      color: C.primary,
      background: "rgba(24,213,183,.10)",
    };
  }

  if (value === "approved") {
    return {
      color: C.blue,
      background: "rgba(114,183,255,.10)",
    };
  }

  if (value === "pending") {
    return {
      color: C.warning,
      background: "rgba(245,201,107,.10)",
    };
  }

  if (value === "rejected") {
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
        padding: 20,
        minHeight: 120,
      }}
    >
      <div style={{ color: C.muted, fontSize: 13 }}>
        {title}
      </div>

      <div
        style={{
          color: accent,
          fontSize: 30,
          fontWeight: 850,
          marginTop: 10,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: C.muted,
          fontSize: 12,
          marginTop: 7,
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
        padding: 28,
        textAlign: "center",
        color: C.muted,
        border: `1px dashed ${C.border}`,
        borderRadius: 13,
      }}
    >
      {children}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(
      `${String(value).slice(0, 10)}T00:00:00`
    ).toLocaleDateString("en-GB");
  } catch {
    return value;
  }
}

export default function EmployeePaymentsPage() {
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    employee_id: "",
    payment_type: "overtime",
    amount: "",
    request_date: "",
    description: "",
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

      const [
        employeeData,
        requestData,
        batchData,
        summaryData,
        attachmentData,
      ] = await Promise.all([
        api("/api/hr/employees"),
        api("/api/hr/employee-payments/requests"),
        api("/api/hr/employee-payments/batches"),
        api("/api/hr/employee-payments/summary"),
        api(
          "/api/hr/attachments?module=employee_payments&entity_type=payment_request&status=active"
        ),
      ]);

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : []
      );

      setRequests(
        Array.isArray(requestData)
          ? requestData
          : []
      );

      setBatches(
        Array.isArray(batchData)
          ? batchData
          : []
      );

      setSummary(summaryData || {});

      setAttachments(
        Array.isArray(attachmentData)
          ? attachmentData
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "Unable to load Employee Payments & Claims"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function attachmentsForRequest(requestId) {
    return attachments.filter(
      (item) =>
        String(item.entity_id) ===
        String(requestId)
    );
  }

  async function uploadPaymentAttachment({
    requestId,
    employeeId,
    file,
  }) {
    const formData = new FormData();

    formData.append(
      "module",
      "employee_payments"
    );

    formData.append(
      "entity_type",
      "payment_request"
    );

    formData.append(
      "entity_id",
      String(requestId)
    );

    formData.append(
      "document_type",
      "payment_supporting_document"
    );

    formData.append(
      "uploaded_by",
      "HR"
    );

    formData.append(
      "confidentiality_level",
      "confidential"
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

    const response = await fetch(
      "/api/hr/attachments/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          `Attachment upload failed: ${response.status}`
      );
    }

    return data;
  }

  async function archiveAttachment(item) {
    const reason = window.prompt(
      "Archive reason / سبب أرشفة المرفق:"
    );

    if (!reason) {
      return;
    }

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
            reason: reason.trim(),
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

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((e) => [
          e.id,
          employeeName(e),
        ])
      ),
    [employees]
  );

  const pending = requests.filter(
    (row) => row.status === "pending"
  );

  const approved = requests.filter(
    (row) => row.status === "approved"
  );

  const paid = requests.filter(
    (row) => row.status === "paid"
  );

  async function createRequest(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.employee_id) {
        throw new Error(
          "Select an employee first"
        );
      }

      if (!form.payment_type) {
        throw new Error(
          "Payment type is required"
        );
      }

      if (Number(form.amount || 0) <= 0) {
        throw new Error(
          "Amount must be greater than zero"
        );
      }

      const result = await api(
        "/api/hr/employee-payments/requests",
        {
          method: "POST",
          body: JSON.stringify({
            employee_id: form.employee_id,
            payment_type: form.payment_type,
            amount: Number(form.amount),
            currency: "SAR",
            request_date:
              form.request_date || null,
            description:
              form.description.trim() || null,

            // Legacy compatibility field.
            // Real files now use Unified HR Attachments.
            attachment_url: null,
          }),
        }
      );

      let attachmentText = "";

      if (attachmentFile) {
        try {
          await uploadPaymentAttachment({
            requestId: result.id,
            employeeId: form.employee_id,
            file: attachmentFile,
          });

          attachmentText =
            " Supporting document uploaded.";
        } catch (uploadErr) {
          attachmentText =
            " Payment request was created, but the attachment upload failed.";

          setError(
            uploadErr?.message ||
              "Payment request created but attachment upload failed"
          );
        }
      }

      const rollText =
        result.rolled_to_next_cycle
          ? " Request was received after the 10th and rolled to the next payment cycle."
          : "";

      setMessage(
        `Payment request submitted.${attachmentText}${rollText}`
      );

      setForm({
        employee_id: "",
        payment_type: "overtime",
        amount: "",
        request_date: "",
        description: "",
      });

      setAttachmentFile(null);

      const fileInput =
        document.getElementById(
          "employee-payment-attachment"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to create payment request"
      );
    } finally {
      setSaving(false);
    }
  }

  async function decide(requestId, status) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/employee-payments/requests/${requestId}/decision`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
            approver_name: "HR",
            approval_note: null,
          }),
        }
      );

      setMessage(
        status === "approved"
          ? "Payment request approved."
          : "Payment request rejected."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to process payment request"
      );
    } finally {
      setSaving(false);
    }
  }

  async function overtimeDecision(
    requestId,
    stage,
    status
  ) {
    const labels = {
      manager: "Direct Manager",
      ceo: "CEO",
      final: "Final Approval",
    };

    const stageLabel = labels[stage] || stage;

    const approverName = window.prompt(
      `${stageLabel} approver name / اسم الموافق:`
    );

    if (approverName === null) {
      return;
    }

    const decisionDate = window.prompt(
      `${stageLabel} decision date (YYYY-MM-DD) / تاريخ الموافقة:`,
      new Date().toISOString().slice(0, 10)
    );

    if (decisionDate === null) {
      return;
    }

    const approvalNote = window.prompt(
      `${stageLabel} note (optional) / ملاحظة اختيارية:`,
      ""
    );

    if (approvalNote === null) {
      return;
    }

    const routeMap = {
      manager: "manager-decision",
      ceo: "ceo-decision",
      final: "final-decision",
    };

    const route = routeMap[stage];

    if (!route) {
      setError("Invalid overtime approval stage");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await api(
        `/api/hr/employee-payments/requests/${requestId}/overtime/${route}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
            approver_name:
              approverName.trim() || null,
            approval_note:
              approvalNote.trim() || null,
            decision_date:
              decisionDate.trim() || null,
          }),
        }
      );

      if (
        stage === "final" &&
        status === "approved"
      ) {
        const cycleText =
          result.eligible_cycle_month
            ? ` Payment cycle: ${result.eligible_cycle_month}.`
            : "";

        setMessage(
          `Overtime finally approved.${cycleText}`
        );
      } else {
        setMessage(
          `${stageLabel} decision recorded: ${status}.`
        );
      }

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to process overtime approval"
      );
    } finally {
      setSaving(false);
    }
  }


  async function markPaid(requestId) {
    const reference = window.prompt(
      "Payment reference / مرجع السداد:"
    );

    if (reference === null) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/employee-payments/requests/${requestId}/paid`,
        {
          method: "PUT",
          body: JSON.stringify({
            payment_reference:
              reference.trim() || null,
          }),
        }
      );

      setMessage(
        "Payment request marked as paid."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
        "Unable to mark payment as paid"
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
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1550,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
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
                margin: "13px 0 6px",
                fontSize: 31,
              }}
            >
              Employee Payments & Claims
            </h1>

            <div
              style={{
                color: C.muted,
                fontSize: 14,
              }}
            >
              مدفوعات ومطالبات الموظفين
            </div>

            <div
              style={{
                color: C.muted,
                fontSize: 12,
                marginTop: 7,
              }}
            >
              Independent from Payroll ·
              Overtime · Trips · Tickets ·
              Reimbursements · Compensation
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{
              background: C.primary,
              color: "#04100b",
              border: 0,
              borderRadius: 11,
              padding: "11px 17px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>

        <div
          style={{
            background: "rgba(245,201,107,.06)",
            border: "1px solid rgba(245,201,107,.20)",
            borderRadius: 14,
            padding: 15,
            marginBottom: 20,
            color: C.warning,
            fontSize: 13,
          }}
        >
          <strong>Payment Rule:</strong>{" "}
          Cutoff is the 10th calendar day of each month.
          Requests received after the 10th automatically
          move to the next payment cycle. Payment is due
          within 5 Saudi business days after cutoff.
          <br />
          <span dir="rtl">
            آخر يوم لاستلام الطلبات هو يوم 10 ميلادي.
            أي طلب بعد يوم 10 يرحل تلقائيًا للدفعة التالية،
            والسداد خلال 5 أيام عمل.
          </span>
        </div>

        {error ? (
          <div
            style={{
              padding: 14,
              marginBottom: 18,
              borderRadius: 12,
              color: C.danger,
              background:
                "rgba(255,107,107,.08)",
              border:
                "1px solid rgba(255,107,107,.25)",
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              padding: 14,
              marginBottom: 18,
              borderRadius: 12,
              color: C.primary,
              background:
                "rgba(24,213,183,.08)",
              border:
                "1px solid rgba(24,213,183,.25)",
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            title="Pending Requests"
            value={summary.pending_requests || 0}
            subtitle={`${money(
              summary.pending_amount
            )} SAR`}
            accent={C.warning}
          />

          <StatCard
            title="Approved"
            value={summary.approved_requests || 0}
            subtitle={`${money(
              summary.approved_amount
            )} SAR`}
            accent={C.blue}
          />

          <StatCard
            title="Paid"
            value={summary.paid_requests || 0}
            subtitle={`${money(
              summary.paid_amount
            )} SAR`}
          />

          <StatCard
            title="Current Cutoff"
            value={formatDate(
              summary.current_cycle_cutoff
            )}
            subtitle="آخر يوم استلام للدورة الحالية"
            accent={C.warning}
          />

          <StatCard
            title="Payment Due"
            value={formatDate(
              summary.current_cycle_due_date
            )}
            subtitle="موعد السداد المستهدف"
            accent={C.primary}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(440px, 1fr))",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <form
            onSubmit={createRequest}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              New Payment / Claim
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              إنشاء مطالبة أو دفعة مستقلة
            </div>

            {employees.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  marginBottom: 14,
                  borderRadius: 10,
                  color: C.warning,
                  background:
                    "rgba(245,201,107,.08)",
                  border:
                    "1px solid rgba(245,201,107,.20)",
                }}
              >
                No employees found. Add employees
                from HR Workspace first.
                <br />
                لا يوجد موظفون حاليًا.
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={label}>
                  Employee
                </label>

                <select
                  style={input}
                  value={form.employee_id}
                  disabled={employees.length === 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      employee_id: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select employee...
                  </option>

                  {employees.map((e) => (
                    <option
                      key={e.id}
                      value={e.id}
                    >
                      {employeeName(e)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>
                  Payment Type
                </label>

                <select
                  style={input}
                  value={form.payment_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_type: e.target.value,
                    })
                  }
                >
                  <option value="overtime">
                    Overtime
                  </option>

                  <option value="business_trip">
                    Business Trip / Per Diem
                  </option>

                  <option value="reimbursement">
                    Reimbursement
                  </option>

                  <option value="ticket">
                    Ticket
                  </option>

                  <option value="compensation">
                    Compensation
                  </option>

                  <option value="other">
                    Other Payment
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <label style={label}>
                    Amount (SAR)
                  </label>

                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={label}>
                    Request Date
                  </label>

                  <input
                    style={input}
                    type="date"
                    value={form.request_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        request_date:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={label}>
                  Description
                </label>

                <textarea
                  style={{
                    ...input,
                    minHeight: 90,
                    resize: "vertical",
                  }}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={label}>
                  Supporting Document
                </label>

                <input
                  id="employee-payment-attachment"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                  style={{
                    ...input,
                    padding: "9px 10px",
                  }}
                  onChange={(e) =>
                    setAttachmentFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

                <div
                  style={{
                    color: C.muted,
                    fontSize: 11,
                    marginTop: 6,
                  }}
                >
                  Optional • Max 20 MB •
                  Private HR storage
                </div>

                {attachmentFile ? (
                  <div
                    style={{
                      color: C.primary,
                      fontSize: 11,
                      marginTop: 6,
                    }}
                  >
                    Selected:{" "}
                    {attachmentFile.name}
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                employees.length === 0
              }
              style={{
                marginTop: 16,
                background: C.primary,
                color: "#04100b",
                border: 0,
                borderRadius: 10,
                padding: "11px 16px",
                fontWeight: 800,
                cursor: "pointer",
                opacity:
                  employees.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              Submit Payment Request
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
              Pending Approvals
            </h3>

            <div
              style={{
                color: C.muted,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              الطلبات بانتظار الاعتماد
            </div>

            {pending.length === 0 ? (
              <Empty>
                No pending payment requests
                <br />
                لا توجد طلبات معلقة
              </Empty>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {pending.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {employeeMap[row.employee_id] ||
                        row.employee_id}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 13,
                        marginTop: 5,
                      }}
                    >
                      {paymentTypeLabel(
                        row.payment_type
                      )}
                      {" • "}
                      {money(row.amount)}{" "}
                      {row.currency || "SAR"}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Request:{" "}
                      {formatDate(row.request_date)}
                      {" • "}
                      Cycle:{" "}
                      {formatDate(
                        row.eligible_cycle_month
                      )}
                    </div>

                    {row.description ? (
                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {row.description}
                      </div>
                    ) : null}

                    {attachmentsForRequest(
                      row.id
                    ).length > 0 ? (
                      <div
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        {attachmentsForRequest(
                          row.id
                        ).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
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
                                "8px 9px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color:
                                    C.text,
                                  fontSize:
                                    12,
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
                                gap: 6,
                              }}
                            >
                              <a
                                href={
                                  item.download_url
                                }
                                style={{
                                  color:
                                    C.blue,
                                  textDecoration:
                                    "none",
                                  fontSize:
                                    11,
                                  fontWeight:
                                    800,
                                }}
                              >
                                Download
                              </a>

                              <button
                                disabled={
                                  saving
                                }
                                type="button"
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
                                  fontSize:
                                    11,
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
                        ))}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: 13,
                      }}
                    >
                      {row.payment_type === "overtime" ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              flexWrap: "wrap",
                              color: C.muted,
                              fontSize: 12,
                            }}
                          >
                            <span>
                              Manager:{" "}
                              <Badge>
                                {row.manager_approval_status}
                              </Badge>
                            </span>

                            <span>
                              CEO:{" "}
                              <Badge>
                                {row.ceo_approval_status}
                              </Badge>
                            </span>

                            <span>
                              Final:{" "}
                              <Badge>
                                {row.final_approval_status}
                              </Badge>
                            </span>
                          </div>

                          {row.manager_approval_status === "pending" ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "manager",
                                    "approved"
                                  )
                                }
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
                                Manager Approve
                              </button>

                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "manager",
                                    "rejected"
                                  )
                                }
                                style={{
                                  background:
                                    "rgba(255,107,107,.10)",
                                  color: C.danger,
                                  border:
                                    "1px solid rgba(255,107,107,.25)",
                                  borderRadius: 9,
                                  padding: "9px 13px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                Manager Reject
                              </button>
                            </div>
                          ) : null}

                          {row.manager_approval_status === "approved" &&
                          row.ceo_approval_status === "pending" ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "ceo",
                                    "approved"
                                  )
                                }
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
                                CEO Approve
                              </button>

                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "ceo",
                                    "rejected"
                                  )
                                }
                                style={{
                                  background:
                                    "rgba(255,107,107,.10)",
                                  color: C.danger,
                                  border:
                                    "1px solid rgba(255,107,107,.25)",
                                  borderRadius: 9,
                                  padding: "9px 13px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                CEO Reject
                              </button>
                            </div>
                          ) : null}

                          {row.manager_approval_status === "approved" &&
                          row.ceo_approval_status === "approved" &&
                          row.final_approval_status === "pending" ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "final",
                                    "approved"
                                  )
                                }
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
                                Final Approve
                              </button>

                              <button
                                disabled={saving}
                                onClick={() =>
                                  overtimeDecision(
                                    row.id,
                                    "final",
                                    "rejected"
                                  )
                                }
                                style={{
                                  background:
                                    "rgba(255,107,107,.10)",
                                  color: C.danger,
                                  border:
                                    "1px solid rgba(255,107,107,.25)",
                                  borderRadius: 9,
                                  padding: "9px 13px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                Final Reject
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            disabled={saving}
                            onClick={() =>
                              decide(
                                row.id,
                                "approved"
                              )
                            }
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
                            Approve
                          </button>

                          <button
                            disabled={saving}
                            onClick={() =>
                              decide(
                                row.id,
                                "rejected"
                              )
                            }
                            style={{
                              background:
                                "rgba(255,107,107,.10)",
                              color: C.danger,
                              border:
                                "1px solid rgba(255,107,107,.25)",
                              borderRadius: 9,
                              padding: "9px 13px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
          <h3 style={{ marginTop: 0 }}>
            Approved — Ready for Payment
          </h3>

          <div
            style={{
              color: C.muted,
              fontSize: 13,
              marginBottom: 15,
            }}
          >
            طلبات معتمدة وجاهزة للسداد
          </div>

          {approved.length === 0 ? (
            <Empty>
              No approved requests awaiting payment
              <br />
              لا توجد طلبات معتمدة بانتظار السداد
            </Empty>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {approved.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 14,
                    background: C.soft,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                      }}
                    >
                      {employeeMap[
                        row.employee_id
                      ] || row.employee_id}
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 13,
                        marginTop: 5,
                      }}
                    >
                      {paymentTypeLabel(
                        row.payment_type
                      )}
                      {" • "}
                      {money(row.amount)} SAR
                      {" • "}
                      Cycle{" "}
                      {formatDate(
                        row.eligible_cycle_month
                      )}
                    </div>

                    {attachmentsForRequest(
                      row.id
                    ).length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        {attachmentsForRequest(
                          row.id
                        ).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              gap: 7,
                              alignItems:
                                "center",
                              background:
                                C.panel,
                              border:
                                `1px solid ${C.border}`,
                              borderRadius:
                                8,
                              padding:
                                "6px 8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                              }}
                            >
                              📎{" "}
                              {
                                item.original_file_name
                              }
                            </span>

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
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    disabled={saving}
                    onClick={() =>
                      markPaid(row.id)
                    }
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
                    Mark as Paid
                  </button>
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
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Payment Batches
          </h3>

          <div
            style={{
              color: C.muted,
              fontSize: 13,
              marginBottom: 15,
            }}
          >
            دورات الدفعات المستقلة
          </div>

          {batches.length === 0 ? (
            <Empty>
              No payment batches yet
              <br />
              لا توجد دفعات حتى الآن
            </Empty>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>
                      Cycle
                    </th>
                    <th style={th}>
                      Cutoff
                    </th>
                    <th style={th}>
                      Due Date
                    </th>
                    <th style={th}>
                      Requests
                    </th>
                    <th style={th}>
                      Amount
                    </th>
                    <th style={th}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((row) => (
                    <tr key={row.id}>
                      <td style={td}>
                        {formatDate(
                          row.cycle_month
                        )}
                      </td>

                      <td style={td}>
                        {formatDate(
                          row.cutoff_date
                        )}
                      </td>

                      <td style={td}>
                        {formatDate(
                          row.due_date
                        )}
                      </td>

                      <td style={td}>
                        {row.total_requests}
                      </td>

                      <td style={td}>
                        {money(
                          row.total_amount
                        )}{" "}
                        SAR
                      </td>

                      <td style={td}>
                        <Badge>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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
            All Payment Requests
          </h3>

          <div
            style={{
              color: C.muted,
              fontSize: 13,
              marginBottom: 15,
            }}
          >
            سجل جميع المطالبات والمدفوعات
          </div>

          {requests.length === 0 ? (
            <Empty>
              No payment requests yet
              <br />
              لا توجد مطالبات حتى الآن
            </Empty>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>
                      Employee
                    </th>
                    <th style={th}>
                      Type
                    </th>
                    <th style={th}>
                      Amount
                    </th>
                    <th style={th}>
                      Request Date
                    </th>
                    <th style={th}>
                      Payment Cycle
                    </th>
                    <th style={th}>
                      Status
                    </th>
                    <th style={th}>
                      Payment Ref
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((row) => (
                    <tr key={row.id}>
                      <td style={td}>
                        {employeeMap[
                          row.employee_id
                        ] || row.employee_id}
                      </td>

                      <td style={td}>
                        {paymentTypeLabel(
                          row.payment_type
                        )}
                      </td>

                      <td style={td}>
                        {money(row.amount)}{" "}
                        {row.currency || "SAR"}
                      </td>

                      <td style={td}>
                        {formatDate(
                          row.request_date
                        )}
                      </td>

                      <td style={td}>
                        {formatDate(
                          row.eligible_cycle_month
                        )}
                      </td>

                      <td style={td}>
                        <Badge>
                          {row.status}
                        </Badge>
                      </td>

                      <td style={td}>
                        {row.payment_reference ||
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
