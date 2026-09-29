"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = "/api/document-intelligence";

const FINANCE_ADAPTERS = new Set([
  "finance_vendor_bill_import",
  "finance_customer_invoice_import",
  "finance_expense_import",
  "finance_bank_statement_import",
]);

const STRUCTURED_ADAPTERS = new Set([
  "hr_employee_import",
  ...FINANCE_ADAPTERS,
]);

const ADAPTER_LABELS = {
  hr_employee_import: "HR — استيراد الموظفين",
  finance_vendor_bill_import: "Finance — فواتير الموردين (AP)",
  finance_customer_invoice_import: "Finance — فواتير العملاء (AR)",
  finance_expense_import: "Finance — المصروفات النقدية / البنكية",
  finance_bank_statement_import: "Finance — كشف الحساب البنكي",
  generic_document: "مستند عام — استخراج المحتوى",
};

const ADAPTER_TEMPLATES = {
  hr_employee_import: {
    fileName: "hr_employee_import_template.csv",
    headers: [
      "employee_number",
      "full_name_ar",
      "full_name_en",
      "national_id_or_iqama",
      "nationality",
      "work_email",
      "personal_email",
      "mobile",
      "department_code",
      "position_code",
      "manager_employee_number",
      "hire_date",
      "employment_status",
      "employment_type",
      "work_location",
      "gosi_registered",
      "contract_number",
      "contract_type",
      "contract_start_date",
      "contract_end_date",
      "auto_renew",
      "notice_period_days",
      "currency",
      "basic_salary",
      "housing_allowance",
      "transport_allowance",
      "other_fixed_allowances",
      "employer_gosi_cost",
      "medical_insurance_cost_annual",
      "other_annual_cost",
      "contract_status",
      "notes",
    ],
    rows: [[
      "E001",
      "اسم الموظف",
      "Employee Name",
      "",
      "Saudi",
      "employee@company.com",
      "",
      "05XXXXXXXX",
      "HR",
      "HR-OFFICER",
      "",
      "2026-01-01",
      "active",
      "full_time",
      "Riyadh",
      "yes",
      "",
      "indefinite",
      "2026-01-01",
      "",
      "yes",
      "60",
      "SAR",
      "10000",
      "2500",
      "1000",
      "0",
      "0",
      "0",
      "0",
      "active",
      "",
    ]],
  },
  finance_vendor_bill_import: {
    fileName: "finance_vendor_bill_import_template.csv",
    headers: [
      "vendor_code",
      "bill_number",
      "bill_date",
      "due_date",
      "currency",
      "payable_account_code",
      "input_vat_account_code",
      "reference",
      "notes",
      "line_description",
      "line_account_code",
      "quantity",
      "unit_price",
      "vat_rate",
    ],
    rows: [
      [
        "VENDOR-001",
        "BILL-001",
        "2026-09-27",
        "2026-10-27",
        "SAR",
        "AP",
        "VAT-IN",
        "PO-001",
        "",
        "Professional services",
        "EXP-001",
        "1",
        "1000",
        "15",
      ],
      [
        "VENDOR-001",
        "BILL-001",
        "2026-09-27",
        "2026-10-27",
        "SAR",
        "AP",
        "VAT-IN",
        "PO-001",
        "",
        "Additional service line",
        "EXP-001",
        "1",
        "500",
        "15",
      ],
    ],
  },
  finance_customer_invoice_import: {
    fileName: "finance_customer_invoice_import_template.csv",
    headers: [
      "customer_code",
      "invoice_number",
      "invoice_date",
      "due_date",
      "currency",
      "receivable_account_code",
      "output_vat_account_code",
      "reference",
      "notes",
      "line_description",
      "line_account_code",
      "quantity",
      "unit_price",
      "vat_rate",
    ],
    rows: [
      [
        "CUSTOMER-001",
        "INV-001",
        "2026-09-27",
        "2026-10-27",
        "SAR",
        "AR",
        "VAT-OUT",
        "CONTRACT-001",
        "",
        "Cybersecurity service",
        "REV-001",
        "1",
        "2000",
        "15",
      ],
    ],
  },
  finance_expense_import: {
    fileName: "finance_expense_import_template.csv",
    headers: [
      "expense_date",
      "description",
      "vendor_code",
      "expense_account_code",
      "payment_account_code",
      "input_vat_account_code",
      "subtotal",
      "vat_rate",
      "currency",
      "reference",
      "cost_center",
      "department_code",
      "notes",
    ],
    rows: [[
      "2026-09-27",
      "Office expense",
      "VENDOR-001",
      "EXP-001",
      "BANK-GL",
      "VAT-IN",
      "300",
      "15",
      "SAR",
      "EXP-REF-001",
      "HQ",
      "FIN",
      "",
    ]],
  },
  finance_bank_statement_import: {
    fileName: "finance_bank_statement_import_template.csv",
    headers: [
      "bank_account_code",
      "transaction_date",
      "value_date",
      "description",
      "reference",
      "amount",
      "external_id",
      "notes",
    ],
    rows: [[
      "BANK-001",
      "2026-09-27",
      "2026-09-27",
      "Customer receipt",
      "BANK-REF-001",
      "2300",
      "TXN-001",
      "",
    ]],
  },
};

function isFinanceAdapter(value) {
  return FINANCE_ADAPTERS.has(value);
}

function isStructuredAdapter(value) {
  return STRUCTURED_ADAPTERS.has(value);
}

function adapterLabel(value) {
  return ADAPTER_LABELS[value] || value || "—";
}

function adapterHelp(value) {
  if (value === "hr_employee_import") {
    return "Excel XLSX أو CSV — حتى 5,000 صف و20MB.";
  }

  if (isFinanceAdapter(value)) {
    return "Excel XLSX أو CSV — استخدم أكواد المورد/العميل والحسابات الموجودة فعليًا في Finance.";
  }

  return "PDF / DOCX / TXT / CSV / XLSX — حتى 20MB.";
}

function csvCell(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function fmtMoney(value, currency = "SAR") {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);

  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: currency || "SAR",
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${number.toFixed(2)} ${currency || "SAR"}`;
  }
}

function financeRowView(row, targetAdapter) {
  const mapped = row?.mapped_data || {};

  if (targetAdapter === "finance_vendor_bill_import") {
    const bill = mapped.bill || {};
    const vendor = mapped.vendor || {};
    return {
      type: "فاتورة مورد",
      reference: bill.bill_number || row.external_key || "—",
      party: vendor.name_ar || vendor.name_en || vendor.code || "—",
      date: bill.bill_date || "—",
      amount: fmtMoney(bill.total_amount, bill.currency),
      detail: `${bill.lines?.length || 0} بند · AP ${bill.payable_account_code || "—"}`,
    };
  }

  if (targetAdapter === "finance_customer_invoice_import") {
    const invoice = mapped.invoice || {};
    const customer = mapped.customer || {};
    return {
      type: "فاتورة عميل",
      reference: invoice.invoice_number || row.external_key || "—",
      party: customer.name_ar || customer.name_en || customer.code || "—",
      date: invoice.invoice_date || "—",
      amount: fmtMoney(invoice.total_amount, invoice.currency),
      detail: `${invoice.lines?.length || 0} بند · AR ${invoice.receivable_account_code || "—"}`,
    };
  }

  if (targetAdapter === "finance_expense_import") {
    const expense = mapped.expense || {};
    return {
      type: "مصروف",
      reference: expense.reference || row.external_key || "—",
      party: expense.vendor_code || expense.payment_account_code || "—",
      date: expense.expense_date || "—",
      amount: fmtMoney(expense.total_amount, expense.currency),
      detail: `Expense ${expense.expense_account_code || "—"} · Pay ${expense.payment_account_code || "—"}`,
    };
  }

  const line = mapped.statement_line || {};
  return {
    type: "حركة بنكية",
    reference: line.external_id || line.reference || row.external_key || "—",
    party: line.bank_account_code || "—",
    date: line.transaction_date || "—",
    amount: fmtMoney(line.amount, line.currency || "SAR"),
    detail: line.description || "—",
  };
}

// FINANCE DOCUMENT INTELLIGENCE UI v1


const STATUS_LABELS = {
  uploaded: "تم الرفع",
  extracted: "تم الاستخراج",
  review_pending: "بانتظار المراجعة",
  awaiting_approval: "بانتظار الاعتماد",
  committed: "تم الترحيل",
  failed: "فشل",
  pending: "معلق",
  approved: "معتمد",
  rejected: "مرفوض",
  accepted: "مقبول",
  edited: "معدل",
  valid: "سليم",
  warning: "تحذير",
  error: "خطأ",
};

const STATUS_TONES = {
  committed: "green",
  approved: "green",
  accepted: "green",
  valid: "green",
  review_pending: "blue",
  extracted: "blue",
  awaiting_approval: "amber",
  pending: "amber",
  warning: "amber",
  rejected: "red",
  error: "red",
  failed: "red",
};

function labelStatus(value) {
  return STATUS_LABELS[value] || value || "—";
}

function Badge({ value }) {
  const tone = STATUS_TONES[value] || "gray";
  return (
    <span className={`di-badge di-${tone}`}>
      {labelStatus(value)}
    </span>
  );
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : {};
  }

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data || {});
    throw new Error(detail || `HTTP ${response.status}`);
  }

  return data;
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="di-summary-card">
      <div className="di-summary-label">{label}</div>
      <div className="di-summary-value">{value ?? 0}</div>
      {hint ? <div className="di-summary-hint">{hint}</div> : null}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="di-empty">
      <div className="di-empty-icon">⌁</div>
      <div className="di-empty-title">{title}</div>
      <div className="di-empty-text">{text}</div>
    </div>
  );
}

function Notice({ type = "info", children }) {
  return <div className={`di-notice di-notice-${type}`}>{children}</div>;
}

function RowIssues({ issues }) {
  const items = issues?.items || [];
  const unknown = issues?.unknown_headers || [];

  if (!items.length && !unknown.length) {
    return <span className="di-muted">لا توجد ملاحظات</span>;
  }

  return (
    <div className="di-issues">
      {items.map((item, index) => (
        <div
          key={`${item.field || "issue"}-${index}`}
          className={`di-issue di-issue-${item.severity || "warning"}`}
        >
          <strong>{item.field || "Field"}:</strong> {item.message}
        </div>
      ))}
      {unknown.length ? (
        <div className="di-issue di-issue-warning">
          <strong>أعمدة غير مستخدمة:</strong> {unknown.join("، ")}
        </div>
      ) : null}
    </div>
  );
}

export default function DocumentIntelligencePage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [rows, setRows] = useState([]);
  const [adapter, setAdapter] = useState("hr_employee_import");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);

  const refreshJobs = async (preserveSelection = true) => {
    const data = await api(`${API}/jobs?limit=100`);
    setJobs(data);

    if (
      preserveSelection &&
      selectedJobId &&
      data.some((item) => item.id === selectedJobId)
    ) {
      return;
    }

    if (!selectedJobId && data.length) {
      setSelectedJobId(data[0].id);
    }
  };

  const loadJob = async (id) => {
    if (!id) {
      setJob(null);
      setRows([]);
      return;
    }

    const [jobData, rowData] = await Promise.all([
      api(`${API}/jobs/${id}`),
      api(`${API}/jobs/${id}/rows`),
    ]);

    setJob(jobData);
    setRows(rowData);
  };

  useEffect(() => {
    refreshJobs(false).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    loadJob(selectedJobId).catch((err) => setError(err.message));
  }, [selectedJobId]);

  const summary = job?.validation_summary || {};

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "valid") {
      return rows.filter((row) => row.validation_status === "valid");
    }
    if (filter === "error") {
      return rows.filter((row) => row.validation_status === "error");
    }
    if (filter === "pending") {
      return rows.filter((row) => row.review_status === "pending");
    }
    if (filter === "accepted") {
      return rows.filter((row) =>
        ["accepted", "edited"].includes(row.review_status)
      );
    }
    if (filter === "rejected") {
      return rows.filter((row) => row.review_status === "rejected");
    }
    return rows;
  }, [rows, filter]);

  const activeAccepted = rows.filter((row) =>
    ["accepted", "edited"].includes(row.review_status)
  ).length;

  const pendingReview = rows.filter(
    (row) => row.review_status === "pending"
  ).length;

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const upload = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!file) {
      setError("اختر ملفًا أولًا.");
      return;
    }

    setBusy("upload");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target_adapter", adapter);
      form.append("requested_by", "user");
      form.append(
        "target_domain",
        adapter === "hr_employee_import"
          ? "hr"
          : isFinanceAdapter(adapter)
          ? "finance"
          : "shared"
      );
      form.append(
        "target_module",
        adapter === "hr_employee_import"
          ? "employees"
          : isFinanceAdapter(adapter)
          ? "finance"
          : "document_intelligence"
      );
      form.append(
        "document_type",
        adapter === "hr_employee_import"
          ? "employee_import"
          : isFinanceAdapter(adapter)
          ? "finance_import"
          : "source_document"
      );

      const created = await api(`${API}/jobs`, {
        method: "POST",
        body: form,
      });

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setSelectedJobId(created.id);
      await refreshJobs(true);
      await loadJob(created.id);
      setMessage("تم رفع الملف وتحليله وإنشاء مسودة المراجعة بنجاح.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const updateReview = async (row, reviewStatus) => {
    clearFeedback();
    setBusy(`row-${row.id}`);

    try {
      await api(`${API}/rows/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_status: reviewStatus,
          review_notes:
            reviewStatus === "rejected"
              ? "Rejected during document intelligence review"
              : null,
        }),
      });

      await loadJob(job.id);
      await refreshJobs(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const acceptValid = async () => {
    clearFeedback();
    setBusy("accept-valid");

    try {
      const result = await api(`${API}/jobs/${job.id}/accept-valid`, {
        method: "POST",
      });
      await loadJob(job.id);
      await refreshJobs(true);
      setMessage(`تم قبول ${result.accepted_rows} سجل سليم للمراجعة النهائية.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const requestApproval = async () => {
    clearFeedback();
    setBusy("approval");

    try {
      const result = await api(
        `${API}/jobs/${job.id}/request-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: "Reviewed in Document Intelligence",
          }),
        }
      );

      await loadJob(job.id);
      await refreshJobs(true);
      setMessage(
        `تم إرسال طلب الاعتماد. رقم الموافقة: ${result.approval_id}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const reopenJob = async () => {
    clearFeedback();
    setBusy("reopen");

    try {
      await api(`${API}/jobs/${job.id}/reopen`, {
        method: "POST",
      });
      await loadJob(job.id);
      await refreshJobs(true);
      setMessage("تمت إعادة الملف إلى مرحلة المراجعة.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const commitJob = async () => {
    clearFeedback();
    setBusy("commit");

    try {
      const result = await api(`${API}/jobs/${job.id}/commit`, {
        method: "POST",
      });
      await loadJob(job.id);
      await refreshJobs(true);
      const createdCount =
        result.commit_result?.created_employee_count ??
        result.commit_result?.created_entity_count ??
        0;

      setMessage(
        isFinanceAdapter(job.target_adapter)
          ? `تم اعتماد الإدخال وإنشاء ${createdCount} سجل مالي كمسودة تشغيلية دون ترحيل محاسبي تلقائي.`
          : `تم الترحيل بنجاح. تم إنشاء ${createdCount} موظف.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const refreshSelected = async () => {
    clearFeedback();
    setBusy("refresh");

    try {
      await Promise.all([loadJob(job.id), refreshJobs(true)]);
      setMessage("تم تحديث حالة الملف.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const downloadTemplate = () => {
    const template = ADAPTER_TEMPLATES[adapter];

    if (!template) {
      setError("لا يوجد نموذج CSV لهذا النوع من المعالجة.");
      return;
    }

    const csvRows = [
      template.headers.map(csvCell).join(","),
      ...template.rows.map((row) => row.map(csvCell).join(",")),
    ];

    const csv = `\uFEFF${csvRows.join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = template.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="di-page" dir="rtl">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #06131e;
        }

        .di-page {
          min-height: 100vh;
          padding: 28px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }

        .di-shell {
          max-width: 1500px;
          margin: 0 auto;
        }

        .di-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding: 26px 28px;
          background: #0b1d2d;
          color: white;
          border-radius: 20px;
          box-shadow: 0 14px 40px rgba(17, 24, 39, 0.12);
        }

        .di-eyebrow {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .di-title {
          margin: 0;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.15;
        }

        .di-subtitle {
          margin: 10px 0 0;
          color: #d9e7e6;
          max-width: 800px;
          line-height: 1.8;
          font-size: 15px;
        }

        .di-hero-chip {
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          border-radius: 14px;
          padding: 12px 16px;
          color: #dbeafe;
          font-size: 13px;
          text-align: center;
        }

        .di-workflow {
          margin-top: 14px;
          color: #d1d5db;
          font-size: 12px;
        }

        .di-grid {
          display: grid;
          grid-template-columns: 350px minmax(0, 1fr);
          gap: 20px;
          margin-top: 20px;
          align-items: start;
        }

        .di-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .di-panel-head {
          padding: 18px 20px;
          border-bottom: 1px solid #102735;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .di-panel-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .di-panel-body {
          padding: 20px;
        }

        .di-field {
          display: grid;
          gap: 7px;
          margin-bottom: 14px;
        }

        .di-field label {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        .di-input,
        .di-select {
          width: 100%;
          min-height: 43px;
          border: 1px solid #d7dce5;
          background: #0b1d2d;
          color: #f7fafc;
          border-radius: 10px;
          padding: 9px 11px;
          outline: none;
        }

        .di-input:focus,
        .di-select:focus {
          border-color: #71c8c1;
          box-shadow: 0 0 0 3px rgba(148,163,184,.14);
        }

        .di-button {
          appearance: none;
          border: 0;
          border-radius: 10px;
          padding: 10px 14px;
          min-height: 40px;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          transition: transform .08s ease, opacity .15s ease;
        }

        .di-button:active {
          transform: translateY(1px);
        }

        .di-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .di-primary {
          background: #0b1d2d;
          color: white;
        }

        .di-secondary {
          background: #102735;
          color: #f7fafc;
        }

        .di-success-btn {
          background: #00a88e;
          color: white;
        }

        .di-danger-btn {
          background: #321d26;
          color: #ff9cac;
          border: 1px solid #71404a;
        }

        .di-warn-btn {
          background: #35271e;
          color: #f5a56f;
          border: 1px solid #704c33;
        }

        .di-full {
          width: 100%;
        }

        .di-upload-actions {
          display: grid;
          gap: 9px;
          margin-top: 8px;
        }

        .di-help {
          font-size: 12px;
          color: #89acab;
          line-height: 1.6;
        }

        .di-jobs {
          max-height: 550px;
          overflow: auto;
        }

        .di-job {
          padding: 14px 18px;
          border-top: 1px solid #f0f2f5;
          cursor: pointer;
        }

        .di-job:hover,
        .di-job-active {
          background: #102735;
        }

        .di-job-name {
          font-weight: 800;
          font-size: 13px;
          word-break: break-word;
          margin-bottom: 8px;
        }

        .di-job-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: #89acab;
        }

        .di-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .di-green {
          background: #0b302b;
          color: #72dfc7;
        }

        .di-blue {
          background: #102b3d;
          color: #72b7ff;
        }

        .di-amber {
          background: #332b17;
          color: #f5c96b;
        }

        .di-red {
          background: #321d26;
          color: #ff9cac;
        }

        .di-gray {
          background: #102735;
          color: #89acab;
        }

        .di-notice {
          padding: 12px 14px;
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13px;
          line-height: 1.6;
          word-break: break-word;
        }

        .di-notice-info {
          background: #102b3d;
          color: #72b7ff;
          border: 1px solid #315b7c;
        }

        .di-notice-success {
          background: #0b302b;
          color: #72dfc7;
          border: 1px solid #2d6a5e;
        }

        .di-notice-error {
          background: #321d26;
          color: #ff9cac;
          border: 1px solid #71404a;
        }

        .di-job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          flex-wrap: wrap;
        }

        .di-job-title {
          margin: 0;
          font-size: 21px;
          word-break: break-word;
        }

        .di-job-description {
          margin: 6px 0 0;
          color: #8fb8b6;
          font-size: 13px;
        }

        .di-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .di-summary-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(100px, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .di-summary-card {
          border: 1px solid #234a57;
          border-radius: 13px;
          padding: 13px;
          background: #0e2634;
        }

        .di-summary-label {
          font-size: 11px;
          color: #8fb8b6;
          margin-bottom: 5px;
        }

        .di-summary-value {
          font-size: 23px;
          font-weight: 900;
        }

        .di-summary-hint {
          font-size: 10px;
          color: #71c8c1;
          margin-top: 4px;
        }

        .di-separator {
          height: 1px;
          background: #102735;
          margin: 20px 0;
        }

        .di-stage {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .di-stage-step {
          padding: 7px 10px;
          border-radius: 9px;
          background: #102735;
          color: #89acab;
          font-size: 11px;
          font-weight: 800;
        }

        .di-stage-active {
          background: #0b1d2d;
          color: white;
        }

        .di-stage-arrow {
          color: #d9e7e6;
        }

        .di-table-wrap {
          width: 100%;
          overflow: auto;
          border: 1px solid #234a57;
          border-radius: 13px;
        }

        .di-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
          font-size: 12px;
        }

        .di-table th {
          text-align: right;
          position: sticky;
          top: 0;
          z-index: 1;
          background: #102735;
          padding: 11px 12px;
          color: #9bbfbd;
          border-bottom: 1px solid #234a57;
          white-space: nowrap;
        }

        .di-table td {
          padding: 12px;
          border-bottom: 1px solid #102735;
          vertical-align: top;
        }

        .di-table tr:last-child td {
          border-bottom: 0;
        }

        .di-row-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .di-mini {
          padding: 6px 9px;
          min-height: 30px;
          font-size: 11px;
        }

        .di-issues {
          display: grid;
          gap: 5px;
          max-width: 320px;
        }

        .di-issue {
          padding: 6px 8px;
          border-radius: 8px;
          line-height: 1.45;
        }

        .di-issue-error {
          background: #321d26;
          color: #ff9cac;
        }

        .di-issue-warning {
          background: #332b17;
          color: #f5c96b;
        }

        .di-muted {
          color: #71c8c1;
          font-size: 11px;
        }

        .di-filterbar {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin: 14px 0;
        }

        .di-filter {
          border: 1px solid #234a57;
          background: #0b1d2d;
          color: #9bbfbd;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          cursor: pointer;
        }

        .di-filter-active {
          background: #0b1d2d;
          color: white;
          border-color: #0b1d2d;
        }

        .di-code {
          direction: ltr;
          text-align: left;
          background: #0b1d2d;
          color: #d1fae5;
          border-radius: 12px;
          padding: 14px;
          font-size: 12px;
          overflow: auto;
          max-height: 420px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .di-empty {
          padding: 55px 25px;
          text-align: center;
          color: #8fb8b6;
        }

        .di-empty-icon {
          font-size: 36px;
          color: #d9e7e6;
        }

        .di-empty-title {
          font-weight: 900;
          color: #b2cfcd;
          margin-top: 8px;
        }

        .di-empty-text {
          font-size: 13px;
          margin-top: 7px;
          line-height: 1.7;
        }

        .di-source-link {
          color: #72b7ff;
          text-decoration: none;
          font-weight: 800;
          font-size: 12px;
        }

        .di-source-link:hover {
          text-decoration: underline;
        }

        .di-key {
          direction: ltr;
          unicode-bidi: plaintext;
          display: inline-block;
        }

        @media (max-width: 1100px) {
          .di-grid {
            grid-template-columns: 1fr;
          }

          .di-summary-grid {
            grid-template-columns: repeat(3, minmax(100px, 1fr));
          }
        }

        @media (max-width: 650px) {
          .di-page {
            padding: 14px;
          }

          .di-hero {
            padding: 20px;
            flex-direction: column;
          }

          .di-summary-grid {
            grid-template-columns: repeat(2, minmax(100px, 1fr));
          }
        }
      `}</style>

      <div className="di-shell">
        <section className="di-hero">
          <div>
            <div className="di-eyebrow">Shared Intelligence Layer</div>
            <h1 className="di-title">Document Intelligence</h1>
            <p className="di-subtitle">
              ارفع الملف، استخرج البيانات، راجع المسودة، ثم اعتمدها قبل
              إدخال أي سجل رسمي في النظام.
            </p>
            <div className="di-workflow">
              Upload → Extract → Draft → Validate → Review → Approval → Commit
            </div>
          </div>
          <div className="di-hero-chip">
            Human Approval Required
            <br />
            لا يوجد ترحيل تلقائي
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="di-grid">
          <aside>
            <section className="di-panel">
              <div className="di-panel-head">
                <h2 className="di-panel-title">ملف جديد</h2>
              </div>
              <div className="di-panel-body">
                <form onSubmit={upload}>
                  <div className="di-field">
                    <label>نوع المعالجة</label>
                    <select
                      className="di-select"
                      value={adapter}
                      onChange={(event) => {
                        setAdapter(event.target.value);
                        setFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                    >
                      <option value="hr_employee_import">
                        HR — استيراد الموظفين
                      </option>
                      <option value="finance_vendor_bill_import">
                        Finance — فواتير الموردين (AP)
                      </option>
                      <option value="finance_customer_invoice_import">
                        Finance — فواتير العملاء (AR)
                      </option>
                      <option value="finance_expense_import">
                        Finance — المصروفات النقدية / البنكية
                      </option>
                      <option value="finance_bank_statement_import">
                        Finance — كشف الحساب البنكي
                      </option>
                      <option value="generic_document">
                        مستند عام — استخراج المحتوى
                      </option>
                    </select>
                  </div>

                  <div className="di-field">
                    <label>الملف</label>
                    <input
                      ref={inputRef}
                      className="di-input"
                      type="file"
                      accept={
                        isStructuredAdapter(adapter)
                          ? ".csv,.xlsx"
                          : ".pdf,.docx,.txt,.csv,.xlsx"
                      }
                      onChange={(event) =>
                        setFile(event.target.files?.[0] || null)
                      }
                    />
                    <div className="di-help">
                      {adapterHelp(adapter)}
                    </div>
                  </div>

                  <div className="di-upload-actions">
                    <button
                      className="di-button di-primary di-full"
                      type="submit"
                      disabled={busy === "upload"}
                    >
                      {busy === "upload"
                        ? "جارٍ الرفع والتحليل..."
                        : "رفع وإنشاء المسودة"}
                    </button>

                    {isStructuredAdapter(adapter) ? (
                      <button
                        className="di-button di-secondary di-full"
                        type="button"
                        onClick={downloadTemplate}
                      >
                        تنزيل نموذج CSV
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            </section>

            <section className="di-panel" style={{ marginTop: 18 }}>
              <div className="di-panel-head">
                <h2 className="di-panel-title">الملفات السابقة</h2>
                <button
                  className="di-button di-secondary di-mini"
                  type="button"
                  onClick={() =>
                    refreshJobs(true).catch((err) => setError(err.message))
                  }
                >
                  تحديث
                </button>
              </div>

              <div className="di-jobs">
                {!jobs.length ? (
                  <EmptyState
                    title="لا توجد ملفات بعد"
                    text="ارفع أول ملف لبدء المعالجة."
                  />
                ) : (
                  jobs.map((item) => (
                    <div
                      key={item.id}
                      className={`di-job ${
                        selectedJobId === item.id ? "di-job-active" : ""
                      }`}
                      onClick={() => setSelectedJobId(item.id)}
                    >
                      <div className="di-job-name">
                        {item.original_file_name}
                      </div>
                      <div className="di-muted" style={{ marginBottom: 7 }}>
                        {adapterLabel(item.target_adapter)}
                      </div>
                      <div className="di-job-meta">
                        <Badge value={item.status} />
                        <span>{fmtDate(item.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="di-panel">
            {!job ? (
              <EmptyState
                title="اختر ملفًا"
                text="اختر ملفًا من القائمة أو ارفع ملفًا جديدًا."
              />
            ) : (
              <div className="di-panel-body">
                <div className="di-job-header">
                  <div>
                    <h2 className="di-job-title">{job.original_file_name}</h2>
                    <p className="di-job-description">
                      {adapterLabel(job.target_adapter)}
                      {" · "}
                      <span className="di-key">{job.target_adapter}</span>
                      {" · "}
                      {fmtDate(job.created_at)}
                    </p>
                  </div>

                  <div className="di-actions">
                    <Badge value={job.status} />
                    {job.approval_status ? (
                      <Badge value={job.approval_status} />
                    ) : null}
                    <button
                      className="di-button di-secondary di-mini"
                      type="button"
                      onClick={refreshSelected}
                      disabled={busy === "refresh"}
                    >
                      تحديث الحالة
                    </button>
                    {job.source_download_url ? (
                      <a
                        className="di-button di-secondary di-mini di-source-link"
                        href={job.source_download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        الملف الأصلي
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="di-stage">
                  {[
                    ["review_pending", "المراجعة"],
                    ["awaiting_approval", "الاعتماد"],
                    ["committed", "الترحيل"],
                  ].map(([key, text], index) => (
                    <span key={key} style={{ display: "contents" }}>
                      {index ? <span className="di-stage-arrow">←</span> : null}
                      <span
                        className={`di-stage-step ${
                          job.status === key ? "di-stage-active" : ""
                        }`}
                      >
                        {text}
                      </span>
                    </span>
                  ))}
                </div>

                {isStructuredAdapter(job.target_adapter) ? (
                  <>
                    <div className="di-summary-grid">
                      <SummaryCard label="إجمالي السجلات" value={summary.total} />
                      <SummaryCard label="سليم" value={summary.valid} />
                      <SummaryCard label="أخطاء" value={summary.error} />
                      <SummaryCard
                        label="بانتظار المراجعة"
                        value={summary.pending_review}
                      />
                      <SummaryCard label="مقبول" value={summary.accepted} />
                      <SummaryCard label="مرفوض" value={summary.rejected} />
                    </div>

                    <div className="di-separator" />

                    {isFinanceAdapter(job.target_adapter) ? (
                      <Notice type="info">
                        Finance Document Intelligence ينشئ سجلات تشغيلية كمسودة
                        فقط. الترحيل المحاسبي، الدفع والتحصيل تبقى خاضعة لمسارات
                        Finance الحالية وموافقاتها المنفصلة.
                      </Notice>
                    ) : null}

                    {job.status === "review_pending" ? (
                      <div className="di-actions">
                        <button
                          className="di-button di-success-btn"
                          type="button"
                          onClick={acceptValid}
                          disabled={busy === "accept-valid"}
                        >
                          قبول كل الصفوف السليمة
                        </button>

                        <button
                          className="di-button di-primary"
                          type="button"
                          onClick={requestApproval}
                          disabled={
                            busy === "approval" ||
                            pendingReview > 0 ||
                            activeAccepted === 0
                          }
                        >
                          إرسال للاعتماد
                        </button>
                      </div>
                    ) : null}

                    {job.status === "awaiting_approval" ? (
                      <Notice type="info">
                        {job.approval_status === "approved" ? (
                          <>
                            تم اعتماد الطلب. يمكنك الآن ترحيل البيانات رسميًا.
                          </>
                        ) : job.approval_status === "rejected" ? (
                          <>
                            تم رفض طلب الاعتماد. أعد الملف إلى المراجعة لتعديله
                            أو استبعاده.
                          </>
                        ) : (
                          <>
                            الملف بانتظار قرارك في شاشة الموافقات. بعد الاعتماد
                            اضغط «تحديث الحالة» هنا ثم نفّذ الترحيل.
                          </>
                        )}
                      </Notice>
                    ) : null}

                    {job.status === "awaiting_approval" &&
                    job.approval_status === "approved" ? (
                      <div className="di-actions" style={{ marginTop: 12 }}>
                        <button
                          className="di-button di-success-btn"
                          type="button"
                          onClick={commitJob}
                          disabled={busy === "commit"}
                        >
                          ترحيل البيانات المعتمدة
                        </button>
                      </div>
                    ) : null}

                    {job.status === "awaiting_approval" &&
                    job.approval_status === "rejected" ? (
                      <div className="di-actions" style={{ marginTop: 12 }}>
                        <button
                          className="di-button di-warn-btn"
                          type="button"
                          onClick={reopenJob}
                          disabled={busy === "reopen"}
                        >
                          إعادة إلى المراجعة
                        </button>
                      </div>
                    ) : null}

                    {job.status === "committed" ? (
                      <Notice type="success">
                        {isFinanceAdapter(job.target_adapter) ? (
                          <>
                            تم إنشاء{" "}
                            <strong>
                              {job.commit_result?.created_entity_count || 0}
                            </strong>{" "}
                            سجل مالي كمسودة تشغيلية. لا يتم إنشاء قيد محاسبي أو
                            تنفيذ دفع/تحصيل تلقائي من Document Intelligence.
                          </>
                        ) : (
                          <>
                            تم الترحيل النهائي. عدد الموظفين الذين تم إنشاؤهم:{" "}
                            <strong>
                              {job.commit_result?.created_employee_count || 0}
                            </strong>
                          </>
                        )}
                      </Notice>
                    ) : null}

                    <div className="di-filterbar">
                      {[
                        ["all", `الكل (${rows.length})`],
                        ["valid", `سليم (${summary.valid || 0})`],
                        ["error", `أخطاء (${summary.error || 0})`],
                        ["pending", `معلق (${summary.pending_review || 0})`],
                        ["accepted", `مقبول (${summary.accepted || 0})`],
                        ["rejected", `مرفوض (${summary.rejected || 0})`],
                      ].map(([key, text]) => (
                        <button
                          key={key}
                          type="button"
                          className={`di-filter ${
                            filter === key ? "di-filter-active" : ""
                          }`}
                          onClick={() => setFilter(key)}
                        >
                          {text}
                        </button>
                      ))}
                    </div>

                    {!filteredRows.length ? (
                      <EmptyState
                        title="لا توجد صفوف بهذا الفلتر"
                        text="اختر فلترًا آخر."
                      />
                    ) : (
                      <div className="di-table-wrap">
                        <table className="di-table">
                          <thead>
                            {job.target_adapter === "hr_employee_import" ? (
                              <tr>
                                <th>#</th>
                                <th>رقم الموظف</th>
                                <th>الاسم</th>
                                <th>الإدارة</th>
                                <th>الوظيفة</th>
                                <th>التحقق</th>
                                <th>المراجعة</th>
                                <th>الملاحظات</th>
                                <th>الإجراء</th>
                              </tr>
                            ) : (
                              <tr>
                                <th>#</th>
                                <th>النوع</th>
                                <th>المرجع</th>
                                <th>الطرف / الحساب</th>
                                <th>التاريخ</th>
                                <th>الإجمالي / المبلغ</th>
                                <th>التفاصيل</th>
                                <th>التحقق</th>
                                <th>المراجعة</th>
                                <th>الملاحظات</th>
                                <th>الإجراء</th>
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {filteredRows.map((row) => {
                              const mapped = row.mapped_data || {};
                              const employee = mapped.employee || {};
                              const department = mapped.department || {};
                              const position = mapped.position || {};
                              const financeView = isFinanceAdapter(
                                job.target_adapter
                              )
                                ? financeRowView(row, job.target_adapter)
                                : null;

                              const actions = (
                                <>
                                  {job.status !== "review_pending" ? (
                                    <span className="di-muted">مقفل</span>
                                  ) : (
                                    <div className="di-row-actions">
                                      {row.review_status === "pending" &&
                                      row.validation_status !== "error" ? (
                                        <button
                                          className="di-button di-success-btn di-mini"
                                          type="button"
                                          disabled={busy === `row-${row.id}`}
                                          onClick={() =>
                                            updateReview(row, "accepted")
                                          }
                                        >
                                          قبول
                                        </button>
                                      ) : null}

                                      {row.review_status !== "rejected" ? (
                                        <button
                                          className="di-button di-danger-btn di-mini"
                                          type="button"
                                          disabled={busy === `row-${row.id}`}
                                          onClick={() =>
                                            updateReview(row, "rejected")
                                          }
                                        >
                                          استبعاد
                                        </button>
                                      ) : (
                                        <button
                                          className="di-button di-secondary di-mini"
                                          type="button"
                                          disabled={busy === `row-${row.id}`}
                                          onClick={() =>
                                            updateReview(row, "pending")
                                          }
                                        >
                                          تراجع
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              );

                              if (job.target_adapter === "hr_employee_import") {
                                return (
                                  <tr key={row.id}>
                                    <td>{row.source_row_number}</td>
                                    <td>
                                      <span className="di-key">
                                        {employee.employee_number || "—"}
                                      </span>
                                    </td>
                                    <td>
                                      <strong>
                                        {employee.full_name_ar || "—"}
                                      </strong>
                                      {employee.full_name_en ? (
                                        <div className="di-muted">
                                          {employee.full_name_en}
                                        </div>
                                      ) : null}
                                    </td>
                                    <td>
                                      {department.name_ar ||
                                        department.name_en ||
                                        department.code ||
                                        "—"}
                                    </td>
                                    <td>
                                      {position.title_ar ||
                                        position.title_en ||
                                        position.code ||
                                        "—"}
                                    </td>
                                    <td>
                                      <Badge value={row.validation_status} />
                                    </td>
                                    <td>
                                      <Badge value={row.review_status} />
                                    </td>
                                    <td>
                                      <RowIssues
                                        issues={row.validation_issues}
                                      />
                                    </td>
                                    <td>{actions}</td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={row.id}>
                                  <td>{row.source_row_number}</td>
                                  <td>
                                    <strong>{financeView?.type || "—"}</strong>
                                  </td>
                                  <td>
                                    <span className="di-key">
                                      {financeView?.reference || "—"}
                                    </span>
                                  </td>
                                  <td>{financeView?.party || "—"}</td>
                                  <td>
                                    <span className="di-key">
                                      {financeView?.date || "—"}
                                    </span>
                                  </td>
                                  <td>
                                    <strong>{financeView?.amount || "—"}</strong>
                                  </td>
                                  <td>{financeView?.detail || "—"}</td>
                                  <td>
                                    <Badge value={row.validation_status} />
                                  </td>
                                  <td>
                                    <Badge value={row.review_status} />
                                  </td>
                                  <td>
                                    <RowIssues
                                      issues={row.validation_issues}
                                    />
                                  </td>
                                  <td>{actions}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {summary.error > 0 && job.status === "review_pending" ? (
                      <Notice type="info">
                        السجلات التي فيها أخطاء لن تمر للاعتماد. استبعد السجل
                        الخطأ أو صحح ملف Excel/CSV ثم ارفعه من جديد؛ لا يتم
                        إنشاء أي سجل تشغيلي من صف يحتوي على خطأ.
                      </Notice>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="di-separator" />
                    <h3>المحتوى المستخرج</h3>
                    <p className="di-help">
                      Extraction method:{" "}
                      <span className="di-key">
                        {job.extraction_method || "—"}
                      </span>
                    </p>
                    <pre className="di-code">
                      {job.extracted_data?.preview ||
                        "لا توجد معاينة متاحة."}
                    </pre>
                    <Notice type="info">
                      المستند العام حاليًا للقراءة والاستخراج فقط. لن يتم ترحيل
                      أي بيانات منه إلى نظام تشغيلي حتى نضيف Adapter معتمد له.
                    </Notice>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
