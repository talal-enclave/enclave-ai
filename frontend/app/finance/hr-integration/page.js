"use client";

// FINANCE HR INTEGRATION UI v1

import { useEffect, useMemo, useState } from "react";

const API = "/api/finance";
const HR_API = `${API}/hr-integration`;

const STATUS_LABELS = {
  draft: "مسودة",
  pending_approval: "بانتظار الاعتماد",
  posted: "مرحّل",
  rejected: "مرفوض",
  approved: "معتمد",
  paid: "مدفوع",
  closed: "مقفل",
};

const STATUS_TONES = {
  posted: "green",
  approved: "green",
  paid: "green",
  pending_approval: "amber",
  draft: "gray",
  rejected: "red",
  closed: "blue",
};

const SOURCE_LABELS = {
  hr_payroll_cycle: "Payroll",
  hr_employee_payment: "Employee Payment",
  hr_final_settlement: "Final Settlement",
};

const PAYMENT_TYPE_LABELS = {
  overtime: "عمل إضافي",
  business_trip: "مهمة / رحلة عمل",
  business_travel: "مهمة / رحلة عمل",
  reimbursement: "استرداد / تعويض مصروف",
  compensation: "تعويض",
  ticket: "تذاكر",
  tickets: "تذاكر",
  other: "أخرى",
};

function Badge({ value }) {
  const tone = STATUS_TONES[value] || "gray";
  return (
    <span className={`hfi-badge hfi-${tone}`}>
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
  return <div className={`hfi-notice hfi-notice-${type}`}>{children}</div>;
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="hfi-summary-card">
      <div className="hfi-summary-label">{label}</div>
      <div className="hfi-summary-value">{value}</div>
      {hint ? <div className="hfi-summary-hint">{hint}</div> : null}
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div className="hfi-empty">
      <div className="hfi-empty-icon">◫</div>
      <div className="hfi-empty-title">{title}</div>
      <div className="hfi-empty-text">{text}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle, actions }) {
  return (
    <div className="hfi-section-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="hfi-actions">{actions}</div> : null}
    </div>
  );
}

function mappingGroup(key) {
  if (key.startsWith("payroll_")) return "payroll";
  if (key.startsWith("employee_")) return "payments";
  return "settlements";
}

const MAPPING_GROUP_LABELS = {
  payroll: "الرواتب",
  payments: "مدفوعات ومطالبات الموظفين",
  settlements: "التسويات النهائية",
};

export default function FinanceHRIntegrationPage() {
  const [summary, setSummary] = useState(null);
  const [mappings, setMappings] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [mappingSelections, setMappingSelections] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const refreshAll = async () => {
    const [summaryData, mappingsData, accountData, journalData] =
      await Promise.all([
        api(`${HR_API}/summary`),
        api(`${HR_API}/account-mappings`),
        api(`${API}/accounts`),
        api(`${HR_API}/journals?limit=200`),
      ]);

    setSummary(summaryData);
    setMappings(mappingsData);
    setAccounts(accountData);
    setJournals(journalData);

    const selections = {};
    for (const item of mappingsData?.items || []) {
      selections[item.key] = item.account?.id || "";
    }
    setMappingSelections(selections);
  };

  useEffect(() => {
    refreshAll().catch((err) => setError(err.message));
  }, []);

  const groupedMappings = useMemo(() => {
    const groups = {
      payroll: [],
      payments: [],
      settlements: [],
    };

    for (const item of mappings?.items || []) {
      groups[mappingGroup(item.key)].push(item);
    }

    return groups;
  }, [mappings]);

  const journalBySource = useMemo(() => {
    const map = {};
    for (const journal of journals) {
      map[`${journal.source_type}:${journal.source_id}`] = journal;
    }
    return map;
  }, [journals]);

  const eligibleAccounts = (item) =>
    accounts.filter(
      (account) =>
        account.is_active &&
        account.allow_posting &&
        (item.allowed_account_types || []).includes(account.account_type)
    );

  const saveMapping = async (item) => {
    clearFeedback();
    setBusy(`mapping-${item.key}`);

    try {
      const accountId = mappingSelections[item.key] || null;
      await api(`${HR_API}/account-mappings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: item.key,
          account_id: accountId,
          actor: "user",
        }),
      });

      await refreshAll();
      setMessage(
        accountId
          ? `تم حفظ ربط ${item.label}.`
          : `تم إلغاء ربط ${item.label}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const createDraft = async (kind, id) => {
    clearFeedback();
    setBusy(`draft-${kind}-${id}`);

    const paths = {
      payroll: `${HR_API}/payroll/${id}/draft-journal`,
      payment: `${HR_API}/employee-payments/${id}/draft-journal`,
      settlement: `${HR_API}/final-settlements/${id}/draft-journal`,
    };

    try {
      const result = await api(paths[kind], {
        method: "POST",
      });

      await refreshAll();

      setMessage(
        result.created
          ? `تم إنشاء القيد ${result.entry_number} كمسودة فقط. لم يتم الترحيل أو الدفع.`
          : `القيد ${result.entry_number} موجود مسبقًا لنفس المصدر ولم يتم إنشاء نسخة مكررة.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const mappingReady = mappings?.missing_keys?.length === 0;

  const payrollItems = summary?.payroll?.items || [];
  const paymentItems = summary?.employee_payments?.items || [];
  const settlementItems = summary?.final_settlements?.items || [];

  return (
    <main className="hfi-page" dir="rtl">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06131e; }

        .hfi-page {
          min-height: 100vh;
          padding: 26px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }

        .hfi-shell {
          max-width: 1500px;
          margin: 0 auto;
        }

        .hfi-hero {
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

        .hfi-eyebrow {
          color: #71c8c1;
          font-size: 12px;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hfi-hero h1 {
          margin: 0;
          font-size: clamp(27px, 3vw, 38px);
        }

        .hfi-hero p {
          margin: 10px 0 0;
          color: #d9e7e6;
          line-height: 1.8;
          font-size: 14px;
          max-width: 920px;
        }

        .hfi-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hfi-back {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          border-radius: 11px;
          padding: 10px 13px;
          font-weight: 800;
          font-size: 12px;
        }

        .hfi-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(15,23,42,.05);
          overflow: hidden;
          margin-top: 18px;
        }

        .hfi-panel-body { padding: 20px; }

        .hfi-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 20px;
          border-bottom: 1px solid #102735;
        }

        .hfi-section-head h2 {
          margin: 0;
          font-size: 19px;
        }

        .hfi-section-head p {
          margin: 6px 0 0;
          color: #8fb8b6;
          font-size: 12px;
          line-height: 1.6;
        }

        .hfi-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(110px, 1fr));
          gap: 11px;
        }

        .hfi-summary-card {
          padding: 15px;
          background: #0e2634;
          border: 1px solid #234a57;
          border-radius: 13px;
        }

        .hfi-summary-label {
          font-size: 11px;
          color: #8fb8b6;
          margin-bottom: 6px;
        }

        .hfi-summary-value {
          font-size: 24px;
          font-weight: 900;
        }

        .hfi-summary-hint {
          font-size: 10px;
          color: #71c8c1;
          margin-top: 5px;
          line-height: 1.5;
        }

        .hfi-notice {
          margin: 14px 0;
          padding: 12px 14px;
          border-radius: 11px;
          line-height: 1.7;
          font-size: 12px;
          word-break: break-word;
        }

        .hfi-notice-info {
          background: #102b3d;
          color: #72b7ff;
          border: 1px solid #315b7c;
        }

        .hfi-notice-success {
          background: #0b302b;
          color: #72dfc7;
          border: 1px solid #2d6a5e;
        }

        .hfi-notice-error {
          background: #321d26;
          color: #ff9cac;
          border: 1px solid #71404a;
        }

        .hfi-notice-warn {
          background: #35271e;
          color: #9a3412;
          border: 1px solid #704c33;
        }

        .hfi-button {
          border: 0;
          border-radius: 9px;
          padding: 9px 13px;
          min-height: 38px;
          cursor: pointer;
          font-weight: 800;
          font-size: 12px;
        }

        .hfi-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .hfi-primary { background: #0b1d2d; color: white; }
        .hfi-secondary { background: #102735; color: #f7fafc; }
        .hfi-success { background: #00a88e; color: white; }

        .hfi-mini {
          min-height: 30px;
          padding: 5px 9px;
          font-size: 10px;
        }

        .hfi-table-wrap {
          width: 100%;
          overflow: auto;
          border: 1px solid #234a57;
          border-radius: 12px;
        }

        .hfi-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          font-size: 12px;
        }

        .hfi-table th {
          text-align: right;
          background: #102735;
          color: #9bbfbd;
          padding: 10px 11px;
          border-bottom: 1px solid #234a57;
          white-space: nowrap;
        }

        .hfi-table td {
          padding: 11px;
          border-bottom: 1px solid #102735;
          vertical-align: middle;
        }

        .hfi-table tr:last-child td { border-bottom: 0; }

        .hfi-input {
          width: 100%;
          min-height: 38px;
          border: 1px solid #234a57;
          border-radius: 9px;
          padding: 8px 9px;
          background: #0b1d2d;
          color: #f7fafc;
          outline: none;
        }

        .hfi-input:focus {
          border-color: #71c8c1;
          box-shadow: 0 0 0 3px rgba(148,163,184,.12);
        }

        .hfi-badge {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .hfi-green { background: #0b302b; color: #72dfc7; }
        .hfi-blue { background: #102b3d; color: #72b7ff; }
        .hfi-amber { background: #332b17; color: #f5c96b; }
        .hfi-red { background: #321d26; color: #ff9cac; }
        .hfi-gray { background: #102735; color: #89acab; }

        .hfi-code {
          direction: ltr;
          unicode-bidi: plaintext;
          display: inline-block;
        }

        .hfi-muted {
          color: #71c8c1;
          font-size: 10px;
          line-height: 1.5;
        }

        .hfi-group {
          margin-top: 20px;
        }

        .hfi-group:first-child { margin-top: 0; }

        .hfi-group-title {
          font-size: 13px;
          font-weight: 900;
          color: #b2cfcd;
          margin: 0 0 9px;
        }

        .hfi-empty {
          text-align: center;
          padding: 42px 20px;
          color: #8fb8b6;
        }

        .hfi-empty-icon {
          font-size: 34px;
          color: #d9e7e6;
        }

        .hfi-empty-title {
          margin-top: 8px;
          font-weight: 900;
          color: #b2cfcd;
        }

        .hfi-empty-text {
          margin-top: 6px;
          font-size: 12px;
        }

        .hfi-source-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .hfi-source-card {
          border: 1px solid #234a57;
          border-radius: 14px;
          overflow: hidden;
          background: #0b1d2d;
        }

        .hfi-source-card-head {
          padding: 14px 15px;
          background: #102735;
          border-bottom: 1px solid #234a57;
          font-weight: 900;
        }

        .hfi-source-card-body {
          padding: 14px;
        }

        .hfi-source-stat {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          font-size: 12px;
          border-bottom: 1px dashed #234a57;
        }

        .hfi-source-stat:last-child {
          border-bottom: 0;
        }

        @media (max-width: 1100px) {
          .hfi-summary-grid {
            grid-template-columns: repeat(3, minmax(100px, 1fr));
          }

          .hfi-source-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .hfi-page { padding: 13px; }

          .hfi-hero {
            flex-direction: column;
            padding: 20px;
          }

          .hfi-summary-grid {
            grid-template-columns: repeat(2, minmax(100px, 1fr));
          }
        }
      `}</style>

      <div className="hfi-shell">
        <section className="hfi-hero">
          <div>
            <div className="hfi-eyebrow">Finance · HR Accounting Bridge</div>
            <h1>HR ↔ Finance Integration</h1>
            <p>
              تحويل العمليات المالية المعتمدة في الموارد البشرية إلى قيود يومية
              محاسبية مسودة مع تتبع المصدر ومنع التكرار. هذه الشاشة لا تنفذ ترحيلًا
              محاسبيًا ولا دفعًا ولا تحويلًا بنكيًا.
            </p>
          </div>

          <div className="hfi-actions">
            <a href="/finance" className="hfi-back">
              Finance Workspace
            </a>
            <a href="/" className="hfi-back">
              العودة للرئيسية
            </a>
          </div>
        </section>

        {error ? <Notice type="error">{error}</Notice> : null}
        {message ? <Notice type="success">{message}</Notice> : null}

        <Notice type="info">
          <strong>ضابط الأمان:</strong> زر إنشاء القيد ينشئ Draft Journal فقط.
          بعدها يبقى اعتماد القيد وترحيله من Finance Workspace كخطوة مستقلة.
          لا يتم اعتبار أي مبلغ مدفوعًا ولا يتم اختيار حساب بنكي أو إنشاء تحويل بنكي
          من هذا التكامل.
        </Notice>

        <section className="hfi-panel">
          <SectionTitle
            title="ملخص التكامل"
            subtitle="حالة مصادر HR المؤهلة والقيود الناتجة وربط الحسابات."
            actions={
              <button
                type="button"
                className="hfi-button hfi-secondary"
                onClick={() => {
                  clearFeedback();
                  refreshAll().catch((err) => setError(err.message));
                }}
              >
                تحديث
              </button>
            }
          />

          <div className="hfi-panel-body">
            <div className="hfi-summary-grid">
              <SummaryCard
                label="Payroll جاهز"
                value={summary?.payroll?.eligible_closed_cycles || 0}
                hint={`بدون قيد: ${
                  summary?.payroll?.without_finance_journal || 0
                }`}
              />
              <SummaryCard
                label="Employee Payments جاهزة"
                value={summary?.employee_payments?.eligible_approved_or_paid || 0}
                hint={`بدون قيد: ${
                  summary?.employee_payments?.without_finance_journal || 0
                }`}
              />
              <SummaryCard
                label="Final Settlements جاهزة"
                value={summary?.final_settlements?.eligible_approved_or_paid || 0}
                hint={`بدون قيد: ${
                  summary?.final_settlements?.without_finance_journal || 0
                }`}
              />
              <SummaryCard
                label="قيود التكامل"
                value={summary?.generated_journals?.total || 0}
                hint={`Draft: ${summary?.generated_journals?.draft || 0}`}
              />
              <SummaryCard
                label="ربط الحسابات"
                value={`${mappings?.mapped_keys || 0}/${mappings?.total_keys || 0}`}
                hint={
                  mappingReady
                    ? "جميع مفاتيح الربط معرفة"
                    : `ناقص ${mappings?.missing_keys?.length || 0}`
                }
              />
            </div>

            <div className="hfi-source-grid" style={{ marginTop: 18 }}>
              <div className="hfi-source-card">
                <div className="hfi-source-card-head">Payroll</div>
                <div className="hfi-source-card-body">
                  <div className="hfi-source-stat">
                    <span>Eligible closed cycles</span>
                    <strong>{summary?.payroll?.eligible_closed_cycles || 0}</strong>
                  </div>
                  <div className="hfi-source-stat">
                    <span>Without finance journal</span>
                    <strong>{summary?.payroll?.without_finance_journal || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="hfi-source-card">
                <div className="hfi-source-card-head">Employee Payments</div>
                <div className="hfi-source-card-body">
                  <div className="hfi-source-stat">
                    <span>Eligible approved / paid</span>
                    <strong>
                      {summary?.employee_payments?.eligible_approved_or_paid || 0}
                    </strong>
                  </div>
                  <div className="hfi-source-stat">
                    <span>Without finance journal</span>
                    <strong>
                      {summary?.employee_payments?.without_finance_journal || 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="hfi-source-card">
                <div className="hfi-source-card-head">Final Settlements</div>
                <div className="hfi-source-card-body">
                  <div className="hfi-source-stat">
                    <span>Eligible approved / paid</span>
                    <strong>
                      {summary?.final_settlements?.eligible_approved_or_paid || 0}
                    </strong>
                  </div>
                  <div className="hfi-source-stat">
                    <span>Without finance journal</span>
                    <strong>
                      {summary?.final_settlements?.without_finance_journal || 0}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle
            title="ربط حسابات الأستاذ"
            subtitle="اختر حساب GL واحد لكل وظيفة محاسبية. نوع الحساب المسموح به يتحقق منه الـBackend أيضًا."
          />

          <div className="hfi-panel-body">
            {!mappingReady ? (
              <Notice type="warn">
                يوجد {mappings?.missing_keys?.length || 0} ربط غير مكتمل.
                إنشاء بعض القيود قد يتوقف حتى يتم ربط الحسابات المطلوبة لذلك المصدر.
              </Notice>
            ) : (
              <Notice type="success">
                جميع مفاتيح HR ↔ Finance مربوطة بحسابات GL.
              </Notice>
            )}

            {Object.entries(groupedMappings).map(([groupKey, items]) => (
              <div className="hfi-group" key={groupKey}>
                <div className="hfi-group-title">
                  {MAPPING_GROUP_LABELS[groupKey]}
                </div>

                <div className="hfi-table-wrap">
                  <table className="hfi-table">
                    <thead>
                      <tr>
                        <th>الوظيفة</th>
                        <th>المفتاح</th>
                        <th>نوع الحساب</th>
                        <th>حساب GL</th>
                        <th>الحالة</th>
                        <th>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const options = eligibleAccounts(item);
                        const selected = mappingSelections[item.key] || "";

                        return (
                          <tr key={item.key}>
                            <td>
                              <strong>{item.label}</strong>
                            </td>
                            <td>
                              <span className="hfi-code">{item.key}</span>
                            </td>
                            <td>
                              {(item.allowed_account_types || []).join(", ")}
                            </td>
                            <td style={{ minWidth: 310 }}>
                              <select
                                className="hfi-input"
                                value={selected}
                                onChange={(e) =>
                                  setMappingSelections((current) => ({
                                    ...current,
                                    [item.key]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">— غير مربوط —</option>
                                {options.map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.code} — {account.name_ar}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              {item.mapped ? (
                                <span className="hfi-badge hfi-green">مربوط</span>
                              ) : (
                                <span className="hfi-badge hfi-red">ناقص</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="hfi-button hfi-primary hfi-mini"
                                onClick={() => saveMapping(item)}
                                disabled={busy === `mapping-${item.key}`}
                              >
                                حفظ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle
            title="Payroll → Finance"
            subtitle="الدورة تظهر هنا فقط بعد إغلاق Payroll واعتماده في HR. Overtime وClaims لا تدخل من هذا المسار."
          />

          <div className="hfi-panel-body">
            {!payrollItems.length ? (
              <Empty
                title="لا توجد دورات Payroll مؤهلة"
                text="بعد اعتماد دورة الرواتب وإغلاقها ستظهر هنا."
              />
            ) : (
              <div className="hfi-table-wrap">
                <table className="hfi-table">
                  <thead>
                    <tr>
                      <th>الدورة</th>
                      <th>حالة HR</th>
                      <th>حالة Finance</th>
                      <th>القيد</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollItems.map((item) => {
                      const journal =
                        journalBySource[`hr_payroll_cycle:${item.id}`];

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.year}-{String(item.month).padStart(2, "0")}
                            </strong>
                          </td>
                          <td>
                            <Badge value={item.status} />
                          </td>
                          <td>
                            {journal ? (
                              <Badge value={journal.status} />
                            ) : (
                              <span className="hfi-muted">لا يوجد قيد</span>
                            )}
                          </td>
                          <td>
                            {journal ? (
                              <span className="hfi-code">
                                {journal.entry_number}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hfi-button hfi-primary hfi-mini"
                              onClick={() => createDraft("payroll", item.id)}
                              disabled={
                                item.has_finance_journal ||
                                busy === `draft-payroll-${item.id}`
                              }
                            >
                              {item.has_finance_journal
                                ? "تم إنشاء القيد"
                                : "إنشاء Draft Journal"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle
            title="Employee Payments & Claims → Finance"
            subtitle="يشمل المدفوعات المعتمدة مثل Overtime والمطالبات والتعويضات والتذاكر. القيد يثبت المصروف/المستحق فقط ولا ينفذ دفعًا."
          />

          <div className="hfi-panel-body">
            {!paymentItems.length ? (
              <Empty
                title="لا توجد مدفوعات مؤهلة"
                text="بعد اكتمال اعتماد HR ستظهر المدفوعات هنا."
              />
            ) : (
              <div className="hfi-table-wrap">
                <table className="hfi-table">
                  <thead>
                    <tr>
                      <th>النوع</th>
                      <th>الموظف</th>
                      <th>المبلغ</th>
                      <th>اعتماد HR</th>
                      <th>Finance</th>
                      <th>القيد</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentItems.map((item) => {
                      const journal =
                        journalBySource[`hr_employee_payment:${item.id}`];

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {PAYMENT_TYPE_LABELS[item.payment_type] ||
                                item.payment_type}
                            </strong>
                          </td>
                          <td>
                            <span className="hfi-code">
                              {item.employee_id}
                            </span>
                          </td>
                          <td>{fmtMoney(item.amount, item.currency)}</td>
                          <td>
                            <Badge value={item.status} />
                            <div className="hfi-muted">
                              {fmtDate(item.approved_at)}
                            </div>
                          </td>
                          <td>
                            {journal ? (
                              <Badge value={journal.status} />
                            ) : (
                              <span className="hfi-muted">لا يوجد قيد</span>
                            )}
                          </td>
                          <td>
                            {journal ? (
                              <span className="hfi-code">
                                {journal.entry_number}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hfi-button hfi-primary hfi-mini"
                              onClick={() => createDraft("payment", item.id)}
                              disabled={
                                item.has_finance_journal ||
                                busy === `draft-payment-${item.id}`
                              }
                            >
                              {item.has_finance_journal
                                ? "تم إنشاء القيد"
                                : "إنشاء Draft Journal"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle
            title="Final Settlement → Finance"
            subtitle="يعكس مكونات التسوية المعتمدة إلى مصروفات ومستحق نهائي، بدون تنفيذ الدفع البنكي."
          />

          <div className="hfi-panel-body">
            {!settlementItems.length ? (
              <Empty
                title="لا توجد تسويات نهائية مؤهلة"
                text="بعد اعتماد Final Settlement في HR ستظهر هنا."
              />
            ) : (
              <div className="hfi-table-wrap">
                <table className="hfi-table">
                  <thead>
                    <tr>
                      <th>الموظف</th>
                      <th>آخر يوم عمل</th>
                      <th>صافي التسوية</th>
                      <th>حالة HR</th>
                      <th>Finance</th>
                      <th>القيد</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementItems.map((item) => {
                      const journal =
                        journalBySource[`hr_final_settlement:${item.id}`];

                      return (
                        <tr key={item.id}>
                          <td>
                            <span className="hfi-code">{item.employee_id}</span>
                          </td>
                          <td>{fmtDate(item.last_working_day)}</td>
                          <td>{fmtMoney(item.net_settlement)}</td>
                          <td>
                            <Badge value={item.status} />
                          </td>
                          <td>
                            {journal ? (
                              <Badge value={journal.status} />
                            ) : (
                              <span className="hfi-muted">لا يوجد قيد</span>
                            )}
                          </td>
                          <td>
                            {journal ? (
                              <span className="hfi-code">
                                {journal.entry_number}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hfi-button hfi-primary hfi-mini"
                              onClick={() => createDraft("settlement", item.id)}
                              disabled={
                                item.has_finance_journal ||
                                busy === `draft-settlement-${item.id}`
                              }
                            >
                              {item.has_finance_journal
                                ? "تم إنشاء القيد"
                                : "إنشاء Draft Journal"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle
            title="قيود HR ↔ Finance"
            subtitle="سجل القيود التي أنشأها Batch 7 مع Traceability إلى مصدر HR."
          />

          <div className="hfi-panel-body">
            {!journals.length ? (
              <Empty
                title="لا توجد قيود تكامل"
                text="أنشئ Draft Journal من أحد المصادر المؤهلة أعلاه."
              />
            ) : (
              <div className="hfi-table-wrap">
                <table className="hfi-table">
                  <thead>
                    <tr>
                      <th>القيد</th>
                      <th>التاريخ</th>
                      <th>المصدر</th>
                      <th>Source ID</th>
                      <th>الإجمالي</th>
                      <th>الحالة</th>
                      <th>اعتماد Finance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((journal) => (
                      <tr key={journal.id}>
                        <td>
                          <span className="hfi-code">
                            {journal.entry_number}
                          </span>
                        </td>
                        <td>{fmtDate(journal.journal_date)}</td>
                        <td>
                          {SOURCE_LABELS[journal.source_type] ||
                            journal.source_type}
                        </td>
                        <td>
                          <span className="hfi-code">{journal.source_id}</span>
                        </td>
                        <td>
                          {fmtMoney(journal.total_debit, journal.currency)}
                        </td>
                        <td>
                          <Badge value={journal.status} />
                        </td>
                        <td>
                          {journal.approval_id ? (
                            <span className="hfi-code">
                              {journal.approval_id}
                            </span>
                          ) : (
                            <span className="hfi-muted">
                              لم يطلب اعتماد الترحيل بعد
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="hfi-panel">
          <SectionTitle title="ضوابط Batch 7" />
          <div className="hfi-panel-body">
            <Notice type="info">
              Payroll لا يسمح بتمرير Overtime أو Other Earnings عبر هذا المسار.
              Employee Payments وFinal Settlement يثبتان المصروف/المستحق فقط.
              `source_type + source_id` يمنع إنشاء قيد مكرر لنفس مصدر HR.
              Benefits الشهرية لصاحب العمل تدخل من Payroll فقط لمنع الازدواجية.
            </Notice>
          </div>
        </section>
      </div>
    </main>
  );
}
