"use client";

import { useEffect, useState } from "react";

const COLORS = {
  bg: "#06131e",
  panel: "#0b1d2d",
  panel2: "#142b3d",
  primary: "#18d5b7",
  primarySoft: "rgba(24, 213, 183, 0.12)",
  beige: "#d9e7e6",
  text: "#ffffff",
  muted: "#71c8c1",
  border: "rgba(255,255,255,0.09)",
};

function MetricCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        padding: 22,
        minHeight: 125,
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: COLORS.text,
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value ?? "—"}
      </div>

      {subtitle && (
        <div
          style={{
            color: COLORS.muted,
            fontSize: 12,
            marginTop: 12,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ children, type = "normal" }) {
  const styles = {
    normal: {
      color: COLORS.beige,
      background: "rgba(217,201,170,0.10)",
    },
    good: {
      color: COLORS.primary,
      background: COLORS.primarySoft,
    },
    warning: {
      color: "#f2c879",
      background: "rgba(242,200,121,0.10)",
    },
  };

  return (
    <span
      style={{
        ...styles[type],
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [morningBrief, setMorningBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState("");
  const [weeklyReviewMeta, setWeeklyReviewMeta] = useState(null);
  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Dashboard request failed");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("تعذر تحميل بيانات لوحة القيادة.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMorningBrief() {
    try {
      setBriefLoading(true);

      const res = await fetch("/api/morning-brief", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Morning brief request failed");
      }

      const json = await res.json();
      setMorningBrief(json.brief || "تعذر إنشاء الموجز التنفيذي.");
    } catch (err) {
      setMorningBrief("تعذر تحميل الموجز التنفيذي حاليًا.");
    } finally {
      setBriefLoading(false);
    }
  }

  async function refreshMorningBrief() {
    try {
      setBriefLoading(true);

      const res = await fetch("/api/morning-brief/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Morning brief refresh failed");
      }

      const json = await res.json();
      setMorningBrief(json.brief || "تعذر إنشاء الموجز التنفيذي.");

      // Refresh dashboard numbers too.
      await loadDashboard();
    } catch (err) {
      setMorningBrief("تعذر تحديث الموجز التنفيذي حاليًا.");
    } finally {
      setBriefLoading(false);
    }
  }

  async function loadWeeklyReview() {
    try {
      setWeeklyReviewLoading(true);

      const res = await fetch("/api/weekly-review", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Weekly review request failed");
      }

      const json = await res.json();

      setWeeklyReview(
        json.review || "تعذر تحميل المراجعة التنفيذية الأسبوعية."
      );

      setWeeklyReviewMeta({
        periodStart: json.period_start,
        periodEnd: json.period_end,
      });
    } catch (err) {
      setWeeklyReview(
        "تعذر تحميل المراجعة التنفيذية الأسبوعية حاليًا."
      );
    } finally {
      setWeeklyReviewLoading(false);
    }
  }

  async function refreshWeeklyReview() {
    try {
      setWeeklyReviewLoading(true);

      const res = await fetch("/api/weekly-review/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Weekly review refresh failed");
      }

      const json = await res.json();

      setWeeklyReview(
        json.review || "تعذر إنشاء المراجعة التنفيذية الأسبوعية."
      );

      setWeeklyReviewMeta({
        periodStart: json.period_start,
        periodEnd: json.period_end,
      });

      await loadDashboard();
    } catch (err) {
      setWeeklyReview(
        "تعذر تحديث المراجعة التنفيذية الأسبوعية حاليًا."
      );
    } finally {
      setWeeklyReviewLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      setAuditLoading(true);

      const res = await fetch("/api/audit-logs?limit=30", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Audit log request failed");
      }

      const json = await res.json();
      setAuditLogs(Array.isArray(json) ? json : []);
    } catch (err) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    loadMorningBrief();
    loadWeeklyReview();
    loadAuditLogs();
  }, []);

  const summary = data?.summary || {};

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        padding: "28px",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 30,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <img
              src="/brand/enclave-logo.svg"
              alt="Enclave"
              style={{
                width: 145,
                height: "auto",
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "1.4px",
                  color: COLORS.primary,
                  marginBottom: 5,
                }}
              >
                ENCLAVE AI COMMAND CENTER
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 27,
                  fontWeight: 700,
                }}
              >
                لوحة القيادة التنفيذية
              </h1>

              <div
                style={{
                  marginTop: 6,
                  color: COLORS.muted,
                  fontSize: 13,
                }}
              >
                Executive Intelligence Overview
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <button
              onClick={loadDashboard}
              style={{
                background: COLORS.primarySoft,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 10,
                padding: "10px 15px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              تحديث البيانات
            </button>

            <a
              href="/hr"
              style={{
                background: COLORS.primarySoft,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 10,
                padding: "10px 15px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              HR Workspace
            </a>

            <a
              href="/document-intelligence"
              style={{
                background: COLORS.primarySoft,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 10,
                padding: "10px 15px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Document Intelligence
            </a>

            <a
              href="/finance"
              style={{
                background: COLORS.primarySoft,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 10,
                padding: "10px 15px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Finance Workspace
            </a>

            <a
              href="/"
              style={{
                background: COLORS.panel,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "10px 15px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              العودة للوكلاء
            </a>
          </div>
        </header>

        {loading && (
          <div
            style={{
              padding: 30,
              background: COLORS.panel,
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
            }}
          >
            جاري تحميل لوحة القيادة...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 20,
              background: COLORS.panel,
              borderRadius: 16,
              border: "1px solid rgba(255,100,100,0.25)",
              color: "#ffaaaa",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* KPI CARDS */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <MetricCard
                title="الوكلاء النشطون"
                value={summary.active_agents}
                subtitle="Agents Online"
              />

              <MetricCard
                title="المهام المعلقة"
                value={summary.pending_tasks}
                subtitle="Pending Tasks"
              />

              <MetricCard
                title="قيد التنفيذ"
                value={summary.in_progress_tasks}
                subtitle="In Progress"
              />

              <MetricCard
                title="المهام المكتملة"
                value={summary.completed_tasks}
                subtitle="Completed"
              />

              <MetricCard
                title="تنتظر موافقتك"
                value={summary.pending_approvals}
                subtitle="Pending Approvals"
              />

              <MetricCard
                title="إجمالي المحادثات"
                value={summary.total_conversations}
                subtitle="Conversations"
              />
            </section>

            {/* CEO MORNING BRIEF */}
            <section
              style={{
                background: COLORS.panel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: COLORS.primary,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      marginBottom: 6,
                    }}
                  >
                    CEO MORNING BRIEF
                  </div>

                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                    }}
                  >
                    الموجز التنفيذي
                  </div>
                </div>

                <button
                  onClick={refreshMorningBrief}
                  disabled={briefLoading}
                  style={{
                    background: COLORS.primarySoft,
                    color: COLORS.primary,
                    border: `1px solid ${COLORS.primary}`,
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: briefLoading ? "default" : "pointer",
                    fontWeight: 700,
                    opacity: briefLoading ? 0.6 : 1,
                  }}
                >
                  {briefLoading ? "جاري التحليل..." : "تحديث الموجز"}
                </button>
              </div>

              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.9,
                  color: morningBrief ? COLORS.text : COLORS.muted,
                  fontSize: 14,
                }}
              >
                {briefLoading && !morningBrief
                  ? "CEO Agent يحلل بيانات Enclave..."
                  : morningBrief || "لا يوجد موجز متاح حاليًا."}
              </div>
            </section>

            {/* WEEKLY EXECUTIVE REVIEW */}
            <section
              style={{
                background: COLORS.panel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: COLORS.beige,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      marginBottom: 6,
                    }}
                  >
                    CEO WEEKLY EXECUTIVE REVIEW
                  </div>

                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                    }}
                  >
                    المراجعة التنفيذية الأسبوعية
                  </div>

                  {weeklyReviewMeta?.periodStart &&
                    weeklyReviewMeta?.periodEnd && (
                    <div
                      style={{
                        color: COLORS.muted,
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      الفترة: {weeklyReviewMeta.periodStart}
                      {" — "}
                      {weeklyReviewMeta.periodEnd}
                    </div>
                  )}
                </div>

                <button
                  onClick={refreshWeeklyReview}
                  disabled={weeklyReviewLoading}
                  style={{
                    background: "rgba(217,201,170,0.10)",
                    color: COLORS.beige,
                    border: `1px solid ${COLORS.beige}`,
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: weeklyReviewLoading
                      ? "default"
                      : "pointer",
                    fontWeight: 700,
                    opacity: weeklyReviewLoading ? 0.6 : 1,
                  }}
                >
                  {weeklyReviewLoading
                    ? "جاري التحليل..."
                    : "تحديث المراجعة"}
                </button>
              </div>

              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.9,
                  color: weeklyReview
                    ? COLORS.text
                    : COLORS.muted,
                  fontSize: 14,
                }}
              >
                {weeklyReviewLoading && !weeklyReview
                  ? "CEO Agent يحلل أداء الأسبوع..."
                  : weeklyReview ||
                    "لا توجد مراجعة أسبوعية متاحة حاليًا."}
              </div>
            </section>

            {/* AUDIT TRAIL PANEL */}
            <section
              style={{
                background: COLORS.panel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: COLORS.primary,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      marginBottom: 6,
                    }}
                  >
                    AUDIT TRAIL
                  </div>

                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 700,
                    }}
                  >
                    سجل النشاط والتدقيق
                  </div>

                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      marginTop: 5,
                    }}
                  >
                    آخر العمليات والقرارات المسجلة داخل Enclave AI
                  </div>
                </div>

                <button
                  onClick={loadAuditLogs}
                  disabled={auditLoading}
                  style={{
                    background: COLORS.primarySoft,
                    color: COLORS.primary,
                    border: `1px solid ${COLORS.primary}`,
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: auditLoading ? "default" : "pointer",
                    fontWeight: 700,
                    opacity: auditLoading ? 0.6 : 1,
                  }}
                >
                  {auditLoading ? "جاري التحديث..." : "تحديث السجل"}
                </button>
              </div>

              <div>
                {auditLogs.length ? (
                  auditLogs.map((item) => {
                    const labels = {
                      "task.created": "إنشاء مهمة",
                      "task.auto_created": "إنشاء مهمة تلقائيًا",
                      "task.updated": "تحديث مهمة",
                      "approval.created": "إنشاء طلب موافقة",
                      "approval.auto_created": "طلب موافقة تلقائي",
                      "approval.approved": "تمت الموافقة",
                      "approval.rejected": "تم الرفض",
                      "morning_brief.generated": "توليد الموجز التنفيذي",
                      "weekly_review.generated": "توليد المراجعة الأسبوعية",
                      "hr.department.created": "إنشاء إدارة",
                      "hr.position.created": "إنشاء منصب",
                      "hr.employee.created": "إنشاء ملف موظف",
                      "hr.contract.created": "إنشاء عقد موظف",
                      "hr.offer.approval_requested": "طلب اعتماد عرض وظيفي",
                      "hr.candidate.hired": "تأكيد تعيين مرشح",
                      "hr.onboarding.plan_created": "إنشاء خطة تهيئة موظف",
                      "hr.onboarding.item_created": "إضافة مهمة تهيئة",
                      "hr.onboarding.item_updated": "تحديث مهمة تهيئة",
                      "hr.onboarding.completed": "اكتمال تهيئة موظف",
                      "hr.probation.review_created": "تسجيل مراجعة فترة التجربة",
                      "hr.employee_change.requested": "طلب تغيير وظيفي",
                      "hr.employee_change.applied": "تطبيق تغيير وظيفي",
                      "hr.offboarding.plan_created": "إنشاء خطة إنهاء خدمة",
                      "hr.offboarding.item_updated": "تحديث مهمة إنهاء خدمة",
                      "hr.offboarding.completed": "اكتمال إنهاء خدمة موظف",
                      "hr.performance.cycle_created": "إنشاء دورة أداء",
                      "hr.performance.template_created": "إنشاء قالب KPI",
                      "hr.performance.kpi_created": "إضافة مؤشر KPI",
                      "hr.performance.plan_created": "إنشاء خطة أداء موظف",
                      "hr.performance.metric_updated": "تحديث نتيجة KPI",
                      "hr.performance.review_completed": "اعتماد تقييم أداء",
                      "hr.compensation.cycle_created": "إنشاء دورة تعويضات",
                      "hr.compensation.merit_rule_created": "إضافة قاعدة Merit",
                      "hr.compensation.bonus_rule_created": "إضافة قاعدة Bonus",
                      "hr.compensation.recommendation_generated": "توليد توصية تعويضات",
                      "hr.compensation.approval_requested": "طلب اعتماد تعويضات",
                      "hr.compensation.applied": "تطبيق زيادة راتب معتمدة",
                      "hr.payroll.cycle_created": "إنشاء دورة رواتب",
                      "hr.payroll.preview_generated": "توليد مسودة الرواتب",
                      "hr.payroll.entry_updated": "تعديل مسودة راتب",
                      "hr.payroll.approval_requested": "طلب اعتماد مسودة الرواتب",
                      "hr.payroll.cycle_closed": "إقفال دورة الرواتب",
                      "hr.overtime.created": "تسجيل عمل إضافي",
                      "hr.overtime.status_updated": "تحديث اعتماد العمل الإضافي",
                      "hr.benefit.enrolled": "إضافة ميزة لموظف",
                    };

                    const title =
                      item.details?.title ||
                      item.details?.brief_date ||
                      item.details?.review_date ||
                      "";

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(150px, 1fr) 2fr auto",
                          gap: 14,
                          alignItems: "center",
                          padding: "12px 4px",
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {labels[item.action] || item.action}
                          </div>

                          <div
                            style={{
                              color: COLORS.muted,
                              fontSize: 11,
                              marginTop: 4,
                            }}
                          >
                            {item.actor}
                          </div>
                        </div>

                        <div
                          style={{
                            color: COLORS.muted,
                            fontSize: 12,
                          }}
                        >
                          {title || "عملية داخل النظام"}
                        </div>

                        <div
                          style={{
                            color: COLORS.muted,
                            fontSize: 11,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString("ar-SA")
                            : ""}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      color: COLORS.muted,
                      padding: 18,
                    }}
                  >
                    {auditLoading
                      ? "جاري تحميل سجل النشاط..."
                      : "لا توجد سجلات حتى الآن."}
                  </div>
                )}
              </div>
            </section>

            {/* EXECUTIVE STATUS */}
            <section
              style={{
                background:
                  "linear-gradient(135deg, rgba(24,213,183,0.11), rgba(7,26,22,0.95))",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: 22,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  marginBottom: 8,
                }}
              >
                EXECUTIVE STATUS
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Enclave AI Command Center يعمل بشكل طبيعي
              </div>

              <div
                style={{
                  color: COLORS.muted,
                  fontSize: 13,
                }}
              >
                {summary.pending_approvals > 0
                  ? `يوجد ${summary.pending_approvals} طلب موافقة بانتظار قرارك.`
                  : "لا توجد موافقات معلقة حاليًا."}
              </div>
            </section>

            {/* ACTIVITY */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(360px, 1fr))",
                gap: 18,
              }}
            >
              {/* RECENT TASKS */}
              <div
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "18px 20px",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    آخر المهام
                  </div>

                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    أحدث نشاطات الوكلاء
                  </div>
                </div>

                <div style={{ padding: 12 }}>
                  {data.recent_tasks?.length ? (
                    data.recent_tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: "14px 12px",
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            {task.title}
                          </div>

                          <div
                            style={{
                              color: COLORS.muted,
                              fontSize: 11,
                            }}
                          >
                            الأولوية: {task.priority}
                          </div>
                        </div>

                        <StatusBadge
                          type={
                            task.status === "completed"
                              ? "good"
                              : task.status === "in_progress"
                              ? "warning"
                              : "normal"
                          }
                        >
                          {task.status === "completed"
                            ? "مكتملة"
                            : task.status === "in_progress"
                            ? "قيد التنفيذ"
                            : "معلقة"}
                        </StatusBadge>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 20,
                        color: COLORS.muted,
                      }}
                    >
                      لا توجد مهام.
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT APPROVALS */}
              <div
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "18px 20px",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    آخر الموافقات
                  </div>

                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    القرارات والإجراءات الحساسة
                  </div>
                </div>

                <div style={{ padding: 12 }}>
                  {data.recent_approvals?.length ? (
                    data.recent_approvals.map((approval) => (
                      <div
                        key={approval.id}
                        style={{
                          padding: "14px 12px",
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            {approval.title}
                          </div>

                          <div
                            style={{
                              color: COLORS.muted,
                              fontSize: 11,
                            }}
                          >
                            مستوى المخاطر: {approval.risk_level}
                          </div>
                        </div>

                        <StatusBadge
                          type={
                            approval.status === "approved"
                              ? "good"
                              : approval.status === "pending"
                              ? "warning"
                              : "normal"
                          }
                        >
                          {approval.status === "approved"
                            ? "تمت الموافقة"
                            : approval.status === "rejected"
                            ? "مرفوض"
                            : "بانتظارك"}
                        </StatusBadge>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 20,
                        color: COLORS.muted,
                      }}
                    >
                      لا توجد موافقات.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
