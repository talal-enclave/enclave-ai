"use client";

import { useEffect, useMemo, useState } from "react";

const API = "/api/finance";

const STATUS_LABELS = {
  draft: "مسودة",
  pending_approval: "بانتظار الاعتماد",
  posted: "مرحّل",
  rejected: "مرفوض",
  open: "مفتوحة",
  closed: "مقفلة",
  pending: "معلق",
  approved: "معتمد",
};

const STATUS_TONES = {
  posted: "green",
  approved: "green",
  open: "blue",
  pending_approval: "amber",
  pending: "amber",
  draft: "gray",
  rejected: "red",
  closed: "gray",
};

function Badge({ value }) {
  const tone = STATUS_TONES[value] || "gray";
  return (
    <span className={`fin-badge fin-${tone}`}>
      {STATUS_LABELS[value] || value || "—"}
    </span>
  );
}

function fmtMoney(value, currency = "SAR") {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
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

function Notice({ type = "info", children }) {
  return <div className={`fin-notice fin-notice-${type}`}>{children}</div>;
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="fin-summary-card">
      <div className="fin-summary-label">{label}</div>
      <div className="fin-summary-value">{value}</div>
      {hint ? <div className="fin-summary-hint">{hint}</div> : null}
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div className="fin-empty">
      <div className="fin-empty-icon">◫</div>
      <div className="fin-empty-title">{title}</div>
      <div className="fin-empty-text">{text}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle, actions }) {
  return (
    <div className="fin-section-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="fin-actions">{actions}</div> : null}
    </div>
  );
}

function JournalLineEditor({ line, index, accounts, onChange, onRemove }) {
  const postingAccounts = accounts.filter(
    (a) => a.is_active && a.allow_posting
  );

  return (
    <div className="fin-line">
      <div className="fin-line-number">{index + 1}</div>

      <select
        className="fin-input"
        value={line.account_id}
        onChange={(e) => onChange(index, "account_id", e.target.value)}
      >
        <option value="">اختر الحساب</option>
        {postingAccounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} — {a.name_ar}
          </option>
        ))}
      </select>

      <input
        className="fin-input"
        placeholder="وصف السطر"
        value={line.description}
        onChange={(e) => onChange(index, "description", e.target.value)}
      />

      <input
        className="fin-input"
        type="number"
        min="0"
        step="0.01"
        placeholder="مدين"
        value={line.debit}
        onChange={(e) => onChange(index, "debit", e.target.value)}
      />

      <input
        className="fin-input"
        type="number"
        min="0"
        step="0.01"
        placeholder="دائن"
        value={line.credit}
        onChange={(e) => onChange(index, "credit", e.target.value)}
      />

      <button
        type="button"
        className="fin-button fin-danger fin-mini"
        onClick={() => onRemove(index)}
        disabled={index < 2 && false}
      >
        حذف
      </button>
    </div>
  );
}

export default function FinanceWorkspacePage() {
  const [tab, setTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [journals, setJournals] = useState([]);
  const [trial, setTrial] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerAccountId, setLedgerAccountId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accountForm, setAccountForm] = useState({
    code: "",
    name_ar: "",
    name_en: "",
    account_type: "asset",
    normal_balance: "",
    parent_id: "",
    currency: "SAR",
    allow_posting: true,
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [journalForm, setJournalForm] = useState({
    journal_date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
    currency: "SAR",
    lines: [
      {
        account_id: "",
        description: "",
        debit: "",
        credit: "",
      },
      {
        account_id: "",
        description: "",
        debit: "",
        credit: "",
      },
    ],
  });

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const refreshAll = async () => {
    const [summaryData, accountData, periodData, journalData, trialData] =
      await Promise.all([
        api(`${API}/summary`),
        api(`${API}/accounts`),
        api(`${API}/periods`),
        api(`${API}/journals?limit=200`),
        api(`${API}/trial-balance`),
      ]);

    setSummary(summaryData);
    setAccounts(accountData);
    setPeriods(periodData);
    setJournals(journalData);
    setTrial(trialData);
  };

  useEffect(() => {
    refreshAll().catch((err) => setError(err.message));
  }, []);

  const currentPeriod = summary?.periods?.current;

  const journalTotals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    for (const line of journalForm.lines) {
      debit += Number(line.debit || 0);
      credit += Number(line.credit || 0);
    }

    return {
      debit,
      credit,
      balanced:
        debit > 0 &&
        credit > 0 &&
        Math.abs(debit - credit) < 0.01,
    };
  }, [journalForm.lines]);

  const bootstrapAccounts = async () => {
    clearFeedback();
    setBusy("bootstrap");

    try {
      const result = await api(`${API}/accounts/bootstrap`, {
        method: "POST",
      });
      await refreshAll();
      setMessage(`تم إنشاء ${result.created} حسابًا في دليل الحسابات الابتدائي.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const createAccount = async (event) => {
    event.preventDefault();
    clearFeedback();
    setBusy("account");

    try {
      const payload = {
        ...accountForm,
        code: accountForm.code.trim(),
        name_ar: accountForm.name_ar.trim(),
        name_en: accountForm.name_en.trim() || null,
        parent_id: accountForm.parent_id || null,
        normal_balance: accountForm.normal_balance || null,
      };

      await api(`${API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAccountForm({
        code: "",
        name_ar: "",
        name_en: "",
        account_type: "asset",
        normal_balance: "",
        parent_id: "",
        currency: "SAR",
        allow_posting: true,
      });

      await refreshAll();
      setMessage("تم إنشاء الحساب.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const initializeYear = async () => {
    clearFeedback();
    setBusy("year");

    try {
      const result = await api(`${API}/periods/initialize-year/${year}`, {
        method: "POST",
      });
      await refreshAll();
      setMessage(
        `تمت تهيئة سنة ${year}: أُنشئت ${result.created_periods} فترة.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const requestPeriodClose = async (period) => {
    clearFeedback();
    setBusy(`period-request-${period.id}`);

    try {
      const result = await api(
        `${API}/periods/${period.id}/request-close-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: "user",
            notes: `Close period ${period.period_key}`,
          }),
        }
      );
      await refreshAll();
      setMessage(`تم إرسال إغلاق ${period.period_key} للاعتماد.`);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const closePeriod = async (period) => {
    clearFeedback();
    setBusy(`period-close-${period.id}`);

    try {
      await api(`${API}/periods/${period.id}/close`, {
        method: "POST",
      });
      await refreshAll();
      setMessage(`تم إغلاق الفترة ${period.period_key}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const updateJournalLine = (index, field, value) => {
    setJournalForm((current) => {
      const lines = [...current.lines];
      lines[index] = {
        ...lines[index],
        [field]: value,
      };
      return {
        ...current,
        lines,
      };
    });
  };

  const addJournalLine = () => {
    setJournalForm((current) => ({
      ...current,
      lines: [
        ...current.lines,
        {
          account_id: "",
          description: "",
          debit: "",
          credit: "",
        },
      ],
    }));
  };

  const removeJournalLine = (index) => {
    setJournalForm((current) => {
      if (current.lines.length <= 2) return current;
      return {
        ...current,
        lines: current.lines.filter((_, i) => i !== index),
      };
    });
  };

  const createJournal = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!journalTotals.balanced) {
      setError("القيد غير متوازن. يجب أن يتساوى إجمالي المدين والدائن.");
      return;
    }

    setBusy("journal");

    try {
      const payload = {
        journal_date: journalForm.journal_date,
        description: journalForm.description.trim(),
        reference: journalForm.reference.trim() || null,
        currency: journalForm.currency,
        created_by: "user",
        lines: journalForm.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description.trim() || null,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
        })),
      };

      await api(`${API}/journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setJournalForm((current) => ({
        ...current,
        description: "",
        reference: "",
        lines: [
          {
            account_id: "",
            description: "",
            debit: "",
            credit: "",
          },
          {
            account_id: "",
            description: "",
            debit: "",
            credit: "",
          },
        ],
      }));

      await refreshAll();
      setMessage("تم إنشاء القيد كمسودة.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const requestJournalApproval = async (journal) => {
    clearFeedback();
    setBusy(`journal-approval-${journal.id}`);

    try {
      await api(`${API}/journals/${journal.id}/request-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_by: "user",
          notes: "Reviewed from Finance Workspace",
        }),
      });

      await refreshAll();
      setMessage(`تم إرسال القيد ${journal.entry_number} للاعتماد.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const postJournal = async (journal) => {
    clearFeedback();
    setBusy(`journal-post-${journal.id}`);

    try {
      await api(`${API}/journals/${journal.id}/post`, {
        method: "POST",
      });
      await refreshAll();
      setMessage(`تم ترحيل القيد ${journal.entry_number}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const loadLedger = async () => {
    clearFeedback();

    if (!ledgerAccountId) {
      setError("اختر حسابًا أولًا.");
      return;
    }

    setBusy("ledger");

    try {
      const data = await api(
        `${API}/accounts/${ledgerAccountId}/ledger`
      );
      setLedger(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const tabs = [
    ["dashboard", "لوحة المالية"],
    ["accounts", "دليل الحسابات"],
    ["periods", "الفترات"],
    ["journals", "القيود اليومية"],
    ["trial", "ميزان المراجعة"],
    ["ledger", "دفتر الأستاذ"],
  ];

  return (
    <main className="fin-page" dir="rtl">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #06131e;
        }

        .fin-page {
          min-height: 100vh;
          padding: 26px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }

        .fin-shell {
          max-width: 1500px;
          margin: 0 auto;
        }

        .fin-hero {
          background: #0b1d2d;
          color: white;
          border-radius: 20px;
          padding: 26px 28px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 14px 40px rgba(17, 24, 39, 0.12);
        }

        .fin-eyebrow {
          color: #71c8c1;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .fin-hero h1 {
          margin: 0;
          font-size: clamp(27px, 3vw, 38px);
        }

        .fin-hero p {
          margin: 10px 0 0;
          color: #d9e7e6;
          line-height: 1.8;
          font-size: 14px;
        }

        .fin-back {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          border-radius: 11px;
          padding: 10px 13px;
          font-weight: 800;
          font-size: 12px;
        }

        .fin-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 18px 0;
        }

        .fin-tab {
          border: 1px solid #234a57;
          background: #0b1d2d;
          color: #9bbfbd;
          border-radius: 999px;
          padding: 9px 13px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }

        .fin-tab-active {
          background: #0b1d2d;
          color: white;
          border-color: #0b1d2d;
        }

        .fin-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(15,23,42,.05);
          overflow: hidden;
          margin-bottom: 18px;
        }

        .fin-panel-body {
          padding: 20px;
        }

        .fin-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 20px;
          border-bottom: 1px solid #102735;
        }

        .fin-section-head h2 {
          margin: 0;
          font-size: 19px;
        }

        .fin-section-head p {
          margin: 6px 0 0;
          color: #8fb8b6;
          font-size: 12px;
          line-height: 1.6;
        }

        .fin-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(110px, 1fr));
          gap: 11px;
        }

        .fin-summary-card {
          padding: 15px;
          background: #0e2634;
          border: 1px solid #234a57;
          border-radius: 13px;
        }

        .fin-summary-label {
          font-size: 11px;
          color: #8fb8b6;
          margin-bottom: 6px;
        }

        .fin-summary-value {
          font-size: 24px;
          font-weight: 900;
        }

        .fin-summary-hint {
          font-size: 10px;
          color: #71c8c1;
          margin-top: 5px;
        }

        .fin-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .fin-field {
          display: grid;
          gap: 6px;
        }

        .fin-field label {
          font-size: 12px;
          font-weight: 800;
          color: #9bbfbd;
        }

        .fin-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .fin-input {
          width: 100%;
          min-height: 41px;
          border: 1px solid #234a57;
          border-radius: 9px;
          padding: 9px 10px;
          background: #0b1d2d;
          color: #f7fafc;
          outline: none;
        }

        .fin-input:focus {
          border-color: #71c8c1;
          box-shadow: 0 0 0 3px rgba(148,163,184,.12);
        }

        .fin-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .fin-button {
          border: 0;
          border-radius: 9px;
          padding: 9px 13px;
          min-height: 38px;
          cursor: pointer;
          font-weight: 800;
          font-size: 12px;
        }

        .fin-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .fin-primary {
          background: #0b1d2d;
          color: white;
        }

        .fin-secondary {
          background: #102735;
          color: #f7fafc;
        }

        .fin-success {
          background: #00a88e;
          color: white;
        }

        .fin-warn {
          background: #35271e;
          color: #f5a56f;
          border: 1px solid #704c33;
        }

        .fin-danger {
          background: #321d26;
          color: #ff9cac;
          border: 1px solid #71404a;
        }

        .fin-mini {
          min-height: 30px;
          padding: 5px 9px;
          font-size: 10px;
        }

        .fin-table-wrap {
          width: 100%;
          overflow: auto;
          border: 1px solid #234a57;
          border-radius: 12px;
        }

        .fin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
          font-size: 12px;
        }

        .fin-table th {
          text-align: right;
          background: #102735;
          color: #9bbfbd;
          padding: 10px 11px;
          border-bottom: 1px solid #234a57;
          white-space: nowrap;
        }

        .fin-table td {
          padding: 11px;
          border-bottom: 1px solid #102735;
          vertical-align: top;
        }

        .fin-table tr:last-child td {
          border-bottom: 0;
        }

        .fin-badge {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .fin-green { background: #0b302b; color: #72dfc7; }
        .fin-blue { background: #102b3d; color: #72b7ff; }
        .fin-amber { background: #332b17; color: #f5c96b; }
        .fin-red { background: #321d26; color: #ff9cac; }
        .fin-gray { background: #102735; color: #89acab; }

        .fin-notice {
          margin: 14px 0;
          padding: 12px 14px;
          border-radius: 11px;
          line-height: 1.6;
          font-size: 12px;
          word-break: break-word;
        }

        .fin-notice-info {
          background: #102b3d;
          color: #72b7ff;
          border: 1px solid #315b7c;
        }

        .fin-notice-success {
          background: #0b302b;
          color: #72dfc7;
          border: 1px solid #2d6a5e;
        }

        .fin-notice-error {
          background: #321d26;
          color: #ff9cac;
          border: 1px solid #71404a;
        }

        .fin-empty {
          text-align: center;
          padding: 50px 20px;
          color: #8fb8b6;
        }

        .fin-empty-icon {
          font-size: 34px;
          color: #d9e7e6;
        }

        .fin-empty-title {
          margin-top: 8px;
          font-weight: 900;
          color: #b2cfcd;
        }

        .fin-empty-text {
          margin-top: 6px;
          font-size: 12px;
        }

        .fin-line {
          display: grid;
          grid-template-columns: 40px 1.5fr 1.5fr 1fr 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #102735;
        }

        .fin-line-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #102735;
          color: #9bbfbd;
          font-weight: 900;
          font-size: 11px;
        }

        .fin-journal-totals {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 13px;
          padding: 12px;
          background: #102735;
          border-radius: 10px;
          font-size: 12px;
        }

        .fin-code {
          direction: ltr;
          unicode-bidi: plaintext;
          display: inline-block;
        }

        .fin-muted {
          color: #71c8c1;
          font-size: 10px;
        }

        @media (max-width: 1050px) {
          .fin-summary-grid {
            grid-template-columns: repeat(3, minmax(100px, 1fr));
          }

          .fin-grid-2 {
            grid-template-columns: 1fr;
          }

          .fin-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .fin-line {
            grid-template-columns: 35px 1fr 1fr;
          }
        }

        @media (max-width: 650px) {
          .fin-page {
            padding: 13px;
          }

          .fin-hero {
            flex-direction: column;
            padding: 20px;
          }

          .fin-summary-grid {
            grid-template-columns: repeat(2, minmax(100px, 1fr));
          }

          .fin-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="fin-shell">
        <section className="fin-hero">
          <div>
            <div className="fin-eyebrow">Finance Operations</div>
            <h1>Finance Workspace · الإدارة المالية</h1>
            <p>
              دليل الحسابات، الفترات المحاسبية، القيود اليومية، ميزان المراجعة
              ودفتر الأستاذ — مع اعتماد إلزامي قبل ترحيل القيود أو إغلاق الفترات.
            </p>
          </div>
          <div className="fin-actions">
            <a href="/finance/ap-ar" className="fin-back">
              AP / AR
            </a>

            <a href="/finance/cash-bank" className="fin-back">
              Cash, Bank & Planning
            </a>

            <a href="/finance/reports" className="fin-back">
              Reports & Close
            </a>

            <a href="/finance/assets-accruals" className="fin-back">
              Fixed Assets & Accruals
            </a>

            <a href="/finance/hr-integration" className="fin-back">
              HR ↔ Finance
            </a>
            <a href="/procurement" className="fin-back">
              Procurement
            </a>

            <a href="/" className="fin-back">
              العودة للرئيسية
            </a>
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <div className="fin-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`fin-tab ${
                tab === key ? "fin-tab-active" : ""
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" ? (
          <>
            <section className="fin-panel">
              <SectionTitle
                title="الملخص المالي"
                subtitle="حالة البنية المحاسبية والترحيل الحالي."
                actions={
                  <button
                    className="fin-button fin-secondary"
                    type="button"
                    onClick={() =>
                      refreshAll().catch((err) => setError(err.message))
                    }
                  >
                    تحديث
                  </button>
                }
              />
              <div className="fin-panel-body">
                <div className="fin-summary-grid">
                  <SummaryCard
                    label="الحسابات"
                    value={summary?.accounts?.total || 0}
                    hint={`Posting: ${summary?.accounts?.posting || 0}`}
                  />
                  <SummaryCard
                    label="الفترات المفتوحة"
                    value={summary?.periods?.open || 0}
                  />
                  <SummaryCard
                    label="القيود"
                    value={summary?.journals?.total || 0}
                  />
                  <SummaryCard
                    label="القيود المرحّلة"
                    value={summary?.journals?.by_status?.posted || 0}
                  />
                  <SummaryCard
                    label="توازن الأستاذ"
                    value={summary?.ledger?.balanced ? "متوازن" : "غير متوازن"}
                  />
                </div>

                <div className="fin-grid-2" style={{ marginTop: 18 }}>
                  <div className="fin-summary-card">
                    <div className="fin-summary-label">الفترة الحالية</div>
                    <div className="fin-summary-value" style={{ fontSize: 20 }}>
                      {currentPeriod?.period_key || "غير مهيأة"}
                    </div>
                    <div className="fin-summary-hint">
                      {currentPeriod
                        ? `${fmtDate(currentPeriod.start_date)} — ${fmtDate(
                            currentPeriod.end_date
                          )}`
                        : "هيّئ السنة المحاسبية من تبويب الفترات."}
                    </div>
                  </div>

                  <div className="fin-summary-card">
                    <div className="fin-summary-label">إجمالي الأستاذ</div>
                    <div className="fin-summary-value" style={{ fontSize: 20 }}>
                      {fmtMoney(summary?.ledger?.total_debit || 0)}
                    </div>
                    <div className="fin-summary-hint">
                      المدين = {fmtMoney(summary?.ledger?.total_credit || 0)} دائن
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="fin-panel">
              <SectionTitle
                title="ضوابط الأمان"
                subtitle="هذه القواعد مطبقة في الـBackend وليست مجرد تعليمات واجهة."
              />
              <div className="fin-panel-body">
                <Notice type="info">
                  لا يمكن ترحيل قيد غير متوازن، ولا الترحيل إلى حساب Header أو
                  غير نشط، ولا ترحيل قيد دون اعتماد، ولا إضافة قيد إلى فترة
                  مقفلة. القيود المرحّلة غير قابلة للتعديل.
                </Notice>
              </div>
            </section>
          </>
        ) : null}

        {tab === "accounts" ? (
          <>
            <section className="fin-panel">
              <SectionTitle
                title="إنشاء حساب"
                subtitle="أنشئ الحسابات يدويًا أو استخدم الدليل الابتدائي مرة واحدة عندما يكون الدليل فارغًا."
                actions={
                  accounts.length === 0 ? (
                    <button
                      className="fin-button fin-primary"
                      type="button"
                      onClick={bootstrapAccounts}
                      disabled={busy === "bootstrap"}
                    >
                      إنشاء الدليل الابتدائي
                    </button>
                  ) : null
                }
              />
              <div className="fin-panel-body">
                <form onSubmit={createAccount}>
                  <div className="fin-form-grid">
                    <div className="fin-field">
                      <label>رمز الحساب</label>
                      <input
                        className="fin-input"
                        value={accountForm.code}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            code: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="fin-field">
                      <label>الاسم العربي</label>
                      <input
                        className="fin-input"
                        value={accountForm.name_ar}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            name_ar: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="fin-field">
                      <label>الاسم الإنجليزي</label>
                      <input
                        className="fin-input"
                        value={accountForm.name_en}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            name_en: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="fin-field">
                      <label>النوع</label>
                      <select
                        className="fin-input"
                        value={accountForm.account_type}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            account_type: e.target.value,
                          })
                        }
                      >
                        <option value="asset">أصول</option>
                        <option value="liability">التزامات</option>
                        <option value="equity">حقوق ملكية</option>
                        <option value="revenue">إيرادات</option>
                        <option value="expense">مصروفات</option>
                      </select>
                    </div>

                    <div className="fin-field">
                      <label>الحساب الأب</label>
                      <select
                        className="fin-input"
                        value={accountForm.parent_id}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            parent_id: e.target.value,
                          })
                        }
                      >
                        <option value="">بدون حساب أب</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} — {account.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="fin-field">
                      <label>العملة</label>
                      <input
                        className="fin-input"
                        value={accountForm.currency}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            currency: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="fin-actions" style={{ marginTop: 13 }}>
                    <label style={{ fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={accountForm.allow_posting}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            allow_posting: e.target.checked,
                          })
                        }
                      />{" "}
                      يسمح بالترحيل المباشر على الحساب
                    </label>

                    <button
                      className="fin-button fin-primary"
                      type="submit"
                      disabled={busy === "account"}
                    >
                      إنشاء الحساب
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="fin-panel">
              <SectionTitle title="دليل الحسابات" />
              <div className="fin-panel-body">
                {!accounts.length ? (
                  <Empty
                    title="دليل الحسابات فارغ"
                    text="أنشئ حسابًا أو استخدم الدليل الابتدائي."
                  />
                ) : (
                  <div className="fin-table-wrap">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>الرمز</th>
                          <th>الحساب</th>
                          <th>النوع</th>
                          <th>الرصيد الطبيعي</th>
                          <th>العملة</th>
                          <th>Posting</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td>
                              <span className="fin-code">{account.code}</span>
                            </td>
                            <td>
                              <strong>{account.name_ar}</strong>
                              {account.name_en ? (
                                <div className="fin-muted">{account.name_en}</div>
                              ) : null}
                            </td>
                            <td>{account.account_type}</td>
                            <td>{account.normal_balance}</td>
                            <td>{account.currency}</td>
                            <td>{account.allow_posting ? "نعم" : "Header"}</td>
                            <td>{account.is_active ? "نشط" : "غير نشط"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "periods" ? (
          <>
            <section className="fin-panel">
              <SectionTitle
                title="تهيئة السنة المحاسبية"
                subtitle="ينشئ 12 فترة شهرية مفتوحة، ويتجاوز الأشهر الموجودة."
              />
              <div className="fin-panel-body">
                <div className="fin-actions">
                  <input
                    className="fin-input"
                    style={{ width: 140 }}
                    type="number"
                    min="2000"
                    max="2200"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                  <button
                    className="fin-button fin-primary"
                    type="button"
                    onClick={initializeYear}
                    disabled={busy === "year"}
                  >
                    تهيئة السنة
                  </button>
                </div>
              </div>
            </section>

            <section className="fin-panel">
              <SectionTitle title="الفترات المحاسبية" />
              <div className="fin-panel-body">
                {!periods.length ? (
                  <Empty
                    title="لا توجد فترات"
                    text="هيّئ السنة المحاسبية أولًا."
                  />
                ) : (
                  <div className="fin-table-wrap">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>الفترة</th>
                          <th>من</th>
                          <th>إلى</th>
                          <th>الحالة</th>
                          <th>اعتماد الإغلاق</th>
                          <th>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period.id}>
                            <td>
                              <strong>{period.period_key}</strong>
                            </td>
                            <td>{fmtDate(period.start_date)}</td>
                            <td>{fmtDate(period.end_date)}</td>
                            <td>
                              <Badge value={period.status} />
                            </td>
                            <td>
                              {period.close_approval_status ? (
                                <Badge value={period.close_approval_status} />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <div className="fin-actions">
                                {period.status === "open" &&
                                !period.close_approval_id ? (
                                  <button
                                    className="fin-button fin-warn fin-mini"
                                    type="button"
                                    onClick={() => requestPeriodClose(period)}
                                    disabled={
                                      busy === `period-request-${period.id}`
                                    }
                                  >
                                    طلب إغلاق
                                  </button>
                                ) : null}

                                {period.status === "open" &&
                                period.close_approval_status === "approved" ? (
                                  <button
                                    className="fin-button fin-success fin-mini"
                                    type="button"
                                    onClick={() => closePeriod(period)}
                                    disabled={
                                      busy === `period-close-${period.id}`
                                    }
                                  >
                                    تنفيذ الإغلاق
                                  </button>
                                ) : null}

                                {period.close_approval_status === "pending" ? (
                                  <span className="fin-muted">
                                    اعتمد الطلب من شاشة الموافقات ثم حدّث الصفحة.
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "journals" ? (
          <>
            <section className="fin-panel">
              <SectionTitle
                title="قيد يومية جديد"
                subtitle="القيد يُحفظ كمسودة أولًا. الترحيل يحتاج اعتمادًا صريحًا."
              />
              <div className="fin-panel-body">
                <form onSubmit={createJournal}>
                  <div className="fin-form-grid">
                    <div className="fin-field">
                      <label>التاريخ</label>
                      <input
                        className="fin-input"
                        type="date"
                        value={journalForm.journal_date}
                        onChange={(e) =>
                          setJournalForm({
                            ...journalForm,
                            journal_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="fin-field">
                      <label>الوصف</label>
                      <input
                        className="fin-input"
                        value={journalForm.description}
                        onChange={(e) =>
                          setJournalForm({
                            ...journalForm,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="fin-field">
                      <label>المرجع</label>
                      <input
                        className="fin-input"
                        value={journalForm.reference}
                        onChange={(e) =>
                          setJournalForm({
                            ...journalForm,
                            reference: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {journalForm.lines.map((line, index) => (
                      <JournalLineEditor
                        key={index}
                        line={line}
                        index={index}
                        accounts={accounts}
                        onChange={updateJournalLine}
                        onRemove={removeJournalLine}
                      />
                    ))}
                  </div>

                  <div className="fin-journal-totals">
                    <span>
                      المدين: <strong>{fmtMoney(journalTotals.debit)}</strong>
                    </span>
                    <span>
                      الدائن: <strong>{fmtMoney(journalTotals.credit)}</strong>
                    </span>
                    <Badge
                      value={
                        journalTotals.balanced ? "posted" : "rejected"
                      }
                    />
                    <button
                      className="fin-button fin-secondary fin-mini"
                      type="button"
                      onClick={addJournalLine}
                    >
                      إضافة سطر
                    </button>
                    <button
                      className="fin-button fin-primary"
                      type="submit"
                      disabled={busy === "journal" || !journalTotals.balanced}
                    >
                      حفظ كمسودة
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="fin-panel">
              <SectionTitle title="القيود اليومية" />
              <div className="fin-panel-body">
                {!journals.length ? (
                  <Empty
                    title="لا توجد قيود"
                    text="أنشئ أول قيد يومية."
                  />
                ) : (
                  <div className="fin-table-wrap">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>رقم القيد</th>
                          <th>التاريخ</th>
                          <th>الوصف</th>
                          <th>الإجمالي</th>
                          <th>الحالة</th>
                          <th>الاعتماد</th>
                          <th>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journals.map((journal) => (
                          <tr key={journal.id}>
                            <td>
                              <span className="fin-code">
                                {journal.entry_number}
                              </span>
                            </td>
                            <td>{fmtDate(journal.journal_date)}</td>
                            <td>{journal.description}</td>
                            <td>
                              {fmtMoney(
                                journal.total_debit,
                                journal.currency
                              )}
                            </td>
                            <td>
                              <Badge value={journal.status} />
                            </td>
                            <td>
                              {journal.approval_status ? (
                                <Badge value={journal.approval_status} />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <div className="fin-actions">
                                {["draft", "rejected"].includes(
                                  journal.status
                                ) ? (
                                  <button
                                    className="fin-button fin-warn fin-mini"
                                    type="button"
                                    onClick={() =>
                                      requestJournalApproval(journal)
                                    }
                                    disabled={
                                      busy ===
                                      `journal-approval-${journal.id}`
                                    }
                                  >
                                    طلب اعتماد
                                  </button>
                                ) : null}

                                {journal.status === "pending_approval" &&
                                journal.approval_status === "approved" ? (
                                  <button
                                    className="fin-button fin-success fin-mini"
                                    type="button"
                                    onClick={() => postJournal(journal)}
                                    disabled={
                                      busy === `journal-post-${journal.id}`
                                    }
                                  >
                                    ترحيل
                                  </button>
                                ) : null}

                                {journal.status === "pending_approval" &&
                                journal.approval_status === "pending" ? (
                                  <span className="fin-muted">
                                    بانتظار قرارك في الموافقات
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}

        {tab === "trial" ? (
          <section className="fin-panel">
            <SectionTitle
              title="ميزان المراجعة"
              subtitle="يعرض القيود المرحّلة فقط."
              actions={
                <button
                  className="fin-button fin-secondary"
                  type="button"
                  onClick={() =>
                    api(`${API}/trial-balance`)
                      .then(setTrial)
                      .catch((err) => setError(err.message))
                  }
                >
                  تحديث
                </button>
              }
            />
            <div className="fin-panel-body">
              <div className="fin-summary-grid" style={{ marginBottom: 16 }}>
                <SummaryCard
                  label="إجمالي المدين"
                  value={fmtMoney(trial?.total_debit || 0)}
                />
                <SummaryCard
                  label="إجمالي الدائن"
                  value={fmtMoney(trial?.total_credit || 0)}
                />
                <SummaryCard
                  label="الحالة"
                  value={trial?.balanced ? "متوازن" : "غير متوازن"}
                />
              </div>

              {!trial?.rows?.length ? (
                <Empty
                  title="لا توجد حركة مرحّلة"
                  text="بعد ترحيل القيود ستظهر أرصدة الحسابات هنا."
                />
              ) : (
                <div className="fin-table-wrap">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>الرمز</th>
                        <th>الحساب</th>
                        <th>مدين</th>
                        <th>دائن</th>
                        <th>الرصيد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trial.rows.map((row) => (
                        <tr key={row.account_id}>
                          <td>
                            <span className="fin-code">{row.code}</span>
                          </td>
                          <td>{row.name_ar}</td>
                          <td>{fmtMoney(row.debit)}</td>
                          <td>{fmtMoney(row.credit)}</td>
                          <td>{fmtMoney(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {tab === "ledger" ? (
          <section className="fin-panel">
            <SectionTitle
              title="دفتر الأستاذ"
              subtitle="حركة حساب واحد من القيود المرحّلة."
            />
            <div className="fin-panel-body">
              <div className="fin-actions" style={{ marginBottom: 15 }}>
                <select
                  className="fin-input"
                  style={{ maxWidth: 420 }}
                  value={ledgerAccountId}
                  onChange={(e) => setLedgerAccountId(e.target.value)}
                >
                  <option value="">اختر الحساب</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} — {account.name_ar}
                    </option>
                  ))}
                </select>

                <button
                  className="fin-button fin-primary"
                  type="button"
                  onClick={loadLedger}
                  disabled={busy === "ledger"}
                >
                  عرض الحركة
                </button>
              </div>

              {!ledger ? (
                <Empty
                  title="اختر حسابًا"
                  text="سيظهر رصيد الحساب وحركاته المرحّلة."
                />
              ) : (
                <>
                  <div className="fin-summary-grid" style={{ marginBottom: 16 }}>
                    <SummaryCard
                      label="الحساب"
                      value={`${ledger.account.code}`}
                      hint={ledger.account.name_ar}
                    />
                    <SummaryCard
                      label="الرصيد الختامي"
                      value={fmtMoney(
                        ledger.ending_balance,
                        ledger.account.currency
                      )}
                    />
                    <SummaryCard
                      label="عدد الحركات"
                      value={ledger.entries.length}
                    />
                  </div>

                  {!ledger.entries.length ? (
                    <Empty
                      title="لا توجد حركات"
                      text="الحساب لا يحتوي على قيود مرحّلة في النطاق الحالي."
                    />
                  ) : (
                    <div className="fin-table-wrap">
                      <table className="fin-table">
                        <thead>
                          <tr>
                            <th>التاريخ</th>
                            <th>القيد</th>
                            <th>الوصف</th>
                            <th>مدين</th>
                            <th>دائن</th>
                            <th>الرصيد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.entries.map((entry, index) => (
                            <tr key={`${entry.journal_id}-${index}`}>
                              <td>{fmtDate(entry.journal_date)}</td>
                              <td>
                                <span className="fin-code">
                                  {entry.entry_number}
                                </span>
                              </td>
                              <td>
                                {entry.line_description ||
                                  entry.journal_description}
                              </td>
                              <td>{fmtMoney(entry.debit)}</td>
                              <td>{fmtMoney(entry.credit)}</td>
                              <td>{fmtMoney(entry.running_balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}