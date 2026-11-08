"use client";

import { useEffect, useMemo, useState } from "react";

const C = {
  bg: "#06131e",
  panel: "#0b1d2d",
  soft: "#142b3d",
  primary: "#18d5b7",
  mint: "#71c8c1",
  pale: "#f7fafc",
  border: "rgba(255,255,255,.09)",
  warning: "#f5c96b",
  danger: "#ff7373",
  blue: "#72b7ff",
};

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.alerts)) return value.alerts;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.detail || `HTTP ${response.status}`);
  }
  return body;
}

function dateText(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("ar-SA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function taskHref(row) {
  const params = new URLSearchParams();
  const fields = [
    ["task_id", row?.id],
    ["task_title", row?.title],
    ["task_description", row?.description],
    ["task_status", row?.status],
    ["task_priority", row?.priority],
    ["task_due", row?.due_at],
    ["task_agent", row?.agent_slug],
  ];

  for (const [key, value] of fields) {
    if (value == null || String(value).trim() === "") continue;
    const normalized = String(value);
    params.set(
      key,
      key === "task_description" ? normalized.slice(0, 1400) : normalized,
    );
  }

  return `/?${params.toString()}`;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("en-SA", {
    maximumFractionDigits: 2,
  })} ر.س`;
}

function statusLabel(value) {
  const labels = {
    pending: "معلقة",
    in_progress: "قيد التنفيذ",
    completed: "مكتملة",
    cancelled: "ملغاة",
    active: "سارية",
    renewal_due: "تجديد قريب",
    escalation: "تحتاج تصعيد",
    expired: "منتهية",
  };
  return labels[value] || value || "—";
}

function tone(value) {
  const key = String(value || "").toLowerCase();
  if (["critical", "expired", "high", "escalation"].includes(key)) {
    return { color: C.danger, background: "rgba(255,115,115,.10)" };
  }
  if (["warning", "renewal_due", "medium"].includes(key)) {
    return { color: C.warning, background: "rgba(245,201,107,.10)" };
  }
  return { color: C.primary, background: "rgba(24,213,183,.10)" };
}

function Badge({ value }) {
  const colors = tone(value);
  return (
    <span
      style={{
        ...colors,
        borderRadius: 999,
        padding: "4px 8px",
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {statusLabel(value)}
    </span>
  );
}

function Card({ title, value, subtitle, accent = C.primary }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 16,
        minHeight: 112,
      }}
    >
      <div style={{ color: C.mint, fontSize: 11 }}>{title}</div>
      <div
        style={{
          marginTop: 8,
          color: accent,
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 850,
        }}
      >
        {value ?? "—"}
      </div>
      <div style={{ marginTop: 8, color: C.mint, fontSize: 10 }}>
        {subtitle}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <section
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          {subtitle ? (
            <div style={{ marginTop: 5, color: C.mint, fontSize: 11 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children = "لا توجد بيانات حالياً." }) {
  return (
    <div
      style={{
        padding: 20,
        border: `1px dashed ${C.border}`,
        borderRadius: 12,
        color: C.mint,
        textAlign: "center",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

function Table({ children }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 560,
          fontSize: 12,
        }}
      >
        {children}
      </table>
    </div>
  );
}

const cell = {
  padding: "10px 8px",
  borderBottom: `1px solid ${C.border}`,
  textAlign: "right",
  verticalAlign: "top",
};

export default function ExecutivePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    const failures = [];
    const safe = async (path, fallback) => {
      try {
        return await readJson(path);
      } catch {
        failures.push(path);
        return fallback;
      }
    };

    const now = new Date();
    const monthPath = `/api/hr/monthly-dashboard?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
    const [dashboard, pendingTasks, activeTasks, approvals, daily, weekly, monthly, calendarAlerts, complianceSummary, corporate, employeeDocs, salesAlerts] = await Promise.all([
      safe("/api/dashboard", {}),
      safe("/api/tasks?status=pending", []),
      safe("/api/tasks?status=in_progress", []),
      safe("/api/approvals?status=pending", []),
      safe("/api/operations/daily-report", {}),
      safe("/api/weekly-review", {}),
      safe(monthPath, {}),
      safe("/api/hr/calendar/alerts", []),
      safe("/api/hr/government-compliance/summary", {}),
      safe("/api/hr/government-compliance/corporate", []),
      safe("/api/hr/government-compliance/employee-documents", []),
      safe("/api/sales/alerts", { alerts: [] }),
    ]);

    setData({
      dashboard,
      pendingTasks: arrayValue(pendingTasks),
      activeTasks: arrayValue(activeTasks),
      approvals: arrayValue(approvals),
      daily,
      weekly,
      monthly,
      calendarAlerts: arrayValue(calendarAlerts),
      complianceSummary,
      corporate: arrayValue(corporate),
      employeeDocs: arrayValue(employeeDocs),
      salesAlerts: arrayValue(salesAlerts),
      failures,
    });
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const actionItems = useMemo(() => {
    if (!data) return [];
    const items = [];
    const now = Date.now();

    for (const row of data.approvals.slice(0, 8)) {
      items.push({
        key: `approval-${row.id}`,
        title: row.title || row.action_type || "اعتماد يحتاج قرارك",
        detail: row.risk_level ? `مستوى المخاطر: ${row.risk_level}` : "بانتظار اعتمادك",
        severity: row.risk_level || "high",
        href: "/",
      });
    }

    for (const row of [...data.corporate, ...data.employeeDocs]) {
      if (!["renewal_due", "escalation", "expired"].includes(row.status)) continue;
      items.push({
        key: `compliance-${row.id}`,
        title: row.entity_name || row.document_type || row.document_number || "وثيقة حكومية",
        detail: `${statusLabel(row.status)} · ${row.days_remaining == null ? "بدون تاريخ" : `${row.days_remaining} يوم`}`,
        severity: row.status,
        href: "/hr/government-compliance",
      });
    }

    for (const row of data.calendarAlerts.slice(0, 8)) {
      items.push({
        key: `calendar-${row.event_id}`,
        title: row.title_ar || row.title_en || "تنبيه تقويم",
        detail: `موعد ${dateText(row.due_date)} · ${row.days_remaining < 0 ? "متأخر" : `${row.days_remaining} يوم`}`,
        severity: row.severity || "medium",
        href: "/hr/calendar",
      });
    }

    for (const row of data.salesAlerts.slice(0, 5)) {
      items.push({
        key: `sales-${row.entity_id || row.title}`,
        title: row.title || "تنبيه مبيعات",
        detail: row.message || "مراجعة مطلوبة",
        severity: row.severity || "medium",
        href: "/sales/operations",
      });
    }

    for (const row of [...data.pendingTasks, ...data.activeTasks]) {
      const overdue = row.due_at && new Date(row.due_at).getTime() < now;
      if (!overdue && !["high", "critical"].includes(row.priority)) continue;
      items.push({
        key: `task-${row.id}`,
        title: row.title || "مهمة تنفيذية",
        detail: overdue ? `متأخرة · ${statusLabel(row.status)}` : `أولوية ${row.priority}`,
        severity: overdue ? "critical" : row.priority,
        href: taskHref(row),
        cta: "تابع مع الرئيس التنفيذي",
      });
    }

    return items.slice(0, 16);
  }, [data]);

  const pendingTasks = data?.pendingTasks || [];
  const activeTasks = data?.activeTasks || [];
  const summary = data?.dashboard?.summary || {};
  const compliance = data?.complianceSummary || {};
  const monthlyWorkforce = data?.monthly?.workforce || {};
  const monthlyPayroll = data?.monthly?.payroll || {};
  const complianceAlerts = [...(data?.corporate || []), ...(data?.employeeDocs || [])].filter((row) => ["renewal_due", "escalation", "expired"].includes(row.status));
  const weeklyText = data?.weekly?.review || "لا توجد مراجعة أسبوعية محفوظة حالياً.";

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: C.bg, color: C.pale, padding: 28 }}>
      <div style={{ maxWidth: 1640, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ color: C.primary, fontSize: 11, letterSpacing: "1px" }}>
              ENCLAVE AI · EXECUTIVE OFFICE
            </div>
            <h1 style={{ margin: "7px 0 5px", fontSize: 30 }}>الصفحة التنفيذية</h1>
            <div style={{ color: C.mint, fontSize: 13 }}>
              مركز واحد للمهام المعلقة، الإجراءات التي تحتاج قرارك، والتقارير التنفيذية.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              style={{
                border: `1px solid ${C.primary}`,
                borderRadius: 10,
                padding: "9px 13px",
                color: C.primary,
                background: "rgba(24,213,183,.10)",
                cursor: loading ? "default" : "pointer",
                fontWeight: 800,
              }}
            >
              {loading ? "جاري التحديث..." : "تحديث البيانات"}
            </button>
            <a href="/dashboards-reports" style={{ ...linkStyle, color: C.primary }}>
              الداشبورد والتقارير
            </a>
            <a href="/" style={linkStyle}>الرئيسية</a>
          </div>
        </header>

        {data?.failures?.length ? (
          <div style={{ ...noticeStyle, color: C.warning }}>
            تم تحميل الصفحة من المصادر المتاحة. بعض التقارير غير متاحة حالياً، لذلك لن يتم اختلاق أرقام بديلة.
          </div>
        ) : null}
        {error ? <div style={{ ...noticeStyle, color: C.danger }}>{error}</div> : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
            gap: 11,
            marginBottom: 16,
          }}
        >
          <Card title="المهام المعلقة" value={summary.pending_tasks ?? pendingTasks.length} subtitle="Pending tasks" accent={C.warning} />
          <Card title="قيد التنفيذ" value={summary.in_progress_tasks ?? activeTasks.length} subtitle="In progress" accent={C.blue} />
          <Card title="تحتاج اعتمادك" value={summary.pending_approvals ?? data?.approvals?.length ?? 0} subtitle="Pending approvals" accent={C.danger} />
          <Card title="المهام المكتملة" value={summary.completed_tasks ?? 0} subtitle="Completed work" />
          <Card title="تنبيهات الامتثال" value={(compliance.renewal_due || 0) + (compliance.escalation || 0) + (compliance.expired || 0)} subtitle="Expiry and renewal alerts" accent={C.danger} />
          <Card title="آخر تحديث" value={lastUpdated ? lastUpdated.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—"} subtitle="Live operational snapshot" accent={C.mint} />
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(340px,.8fr)", gap: 16, alignItems: "start" }}>
          <Section title="المهام المعلقة" subtitle="كل المهام المفتوحة من السجل التشغيلي · اختر المتابعة لفتح محادثة الرئيس التنفيذي برسالة جاهزة" action={<a href="/dashboard" style={smallLink}>فتح لوحة القيادة</a>}>
            {pendingTasks.length ? (
              <Table>
                <thead><tr>{["المهمة", "الأولوية", "موعد الاستحقاق", "الحالة", "المتابعة"].map((x) => <th key={x} style={{ ...cell, color: C.mint, fontWeight: 700 }}>{x}</th>)}</tr></thead>
                <tbody>
                  {pendingTasks.slice(0, 10).map((row) => (
                    <tr key={row.id}>
                      <td style={cell}>{row.title || "—"}<div style={{ color: C.mint, fontSize: 10, marginTop: 4 }}>{row.agent_slug || "بدون وكيل محدد"}</div></td>
                      <td style={cell}><Badge value={row.priority} /></td>
                      <td style={cell}>{dateText(row.due_at)}</td>
                      <td style={cell}><Badge value={row.status} /></td>
                      <td style={cell}>
                        <a href={taskHref(row)} style={taskActionLink}>
                          تابع مع الرئيس التنفيذي
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <Empty>ما فيه مهام معلقة حالياً.</Empty>}
          </Section>

          <Section title="تحتاج أكشن" subtitle="اعتمادات وتنبيهات ومواعيد قريبة أو متأخرة">
            {actionItems.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {actionItems.map((item) => (
                  <a key={item.key} href={item.href || "#"} style={{ textDecoration: "none", color: C.pale, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 11, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <strong style={{ fontSize: 12 }}>{item.title}</strong>
                      <Badge value={item.severity} />
                    </div>
                    <div style={{ color: C.mint, fontSize: 10, lineHeight: 1.6, marginTop: 5 }}>{item.detail}</div>
                    {item.cta ? <div style={{ color: C.primary, fontSize: 10, fontWeight: 800, marginTop: 7 }}>{item.cta} ←</div> : null}
                  </a>
                ))}
              </div>
            ) : <Empty>ما فيه إجراءات تحتاج أكشن حالياً.</Empty>}
          </Section>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
          <Section title="التقرير التنفيذي اليومي" subtitle={data?.daily?.report_date || "اليوم"} action={<a href="/operations/daily-report" style={smallLink}>التقرير الكامل</a>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
              <Mini label="أعمال مفتوحة" value={data?.daily?.tasks?.open ?? "—"} />
              <Mini label="أعمال متأخرة" value={data?.daily?.tasks?.overdue ?? "—"} accent={C.danger} />
              <Mini label="اعتمادات معلقة" value={data?.daily?.approvals?.pending ?? "—"} accent={C.warning} />
              <Mini label="Leads جديدة" value={data?.daily?.sales?.new_leads ?? "—"} accent={C.blue} />
            </div>
          </Section>

          <Section title="التقرير التنفيذي الأسبوعي" subtitle={data?.weekly?.period_start && data?.weekly?.period_end ? `${dateText(data.weekly.period_start)} → ${dateText(data.weekly.period_end)}` : "مراجعة الأداء الأسبوعية"} action={<a href="/dashboard" style={smallLink}>المراجعة الحالية</a>}>
            <div style={{ color: C.pale, whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 12, maxHeight: 190, overflow: "auto" }}>{weeklyText}</div>
          </Section>

          <Section title="التقرير التنفيذي الشهري" subtitle={data?.monthly?.period ? `${data.monthly.period.year}-${String(data.monthly.period.month).padStart(2, "0")}` : "لقطة الشهر الحالي"} action={<a href="/hr/monthly-dashboard" style={smallLink}>التقرير الشهري</a>}>
            <div style={{ display: "grid", gap: 7 }}>
              <Mini label="الموظفون نهاية الشهر" value={monthlyWorkforce.closing_headcount ?? "—"} />
              <Mini label="تكلفة صاحب العمل" value={monthlyPayroll.employer_total_cost == null ? "—" : money(monthlyPayroll.employer_total_cost)} accent={C.warning} />
              <Mini label="تنبيهات وثائق حكومية" value={(compliance.renewal_due || 0) + (compliance.escalation || 0) + (compliance.expired || 0)} accent={C.danger} />
            </div>
          </Section>
        </div>

        <Section title="تنبيهات الوثائق والخدمات الحكومية" subtitle="هذه التنبيهات تنعكس هنا مباشرة من سجلات الامتثال، بما فيها العنوان الوطني إذا كان مسجلاً في النظام." action={<a href="/hr/government-compliance" style={smallLink}>فتح سجل الامتثال</a>}>
          {complianceAlerts.length ? (
            <Table>
              <thead><tr>{["الخدمة / الشهادة", "الرقم", "تاريخ الانتهاء", "الحالة", "المتبقي"].map((x) => <th key={x} style={{ ...cell, color: C.mint, fontWeight: 700 }}>{x}</th>)}</tr></thead>
              <tbody>
                {complianceAlerts.slice(0, 12).map((row) => (
                  <tr key={row.id}>
                    <td style={cell}>{row.entity_name || row.record_type || "—"}<div style={{ color: C.mint, fontSize: 10, marginTop: 4 }}>{row.issuing_authority || ""}</div></td>
                    <td style={cell}>{row.document_number || "—"}</td>
                    <td style={cell}>{dateText(row.expiry_date)}</td>
                    <td style={cell}><Badge value={row.status} /></td>
                    <td style={cell}>{row.days_remaining == null ? "—" : `${row.days_remaining} يوم`}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <Empty>لا توجد وثائق حكومية قريبة الانتهاء أو منتهية.</Empty>}
        </Section>
      </div>
    </main>
  );
}

function Mini({ label, value, accent = C.pale }) {
  return (
    <div style={{ background: C.soft, borderRadius: 10, padding: "10px 11px" }}>
      <div style={{ color: C.mint, fontSize: 10 }}>{label}</div>
      <strong style={{ display: "block", marginTop: 5, color: accent, fontSize: 17 }}>{value}</strong>
    </div>
  );
}

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "8px 12px",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: C.pale,
  background: C.panel,
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 800,
};

const smallLink = {
  color: C.primary,
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 800,
};

const taskActionLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid rgba(24,213,183,.45)`,
  borderRadius: 8,
  padding: "6px 8px",
  color: C.primary,
  background: "rgba(24,213,183,.08)",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const noticeStyle = {
  border: `1px solid ${C.border}`,
  background: C.panel,
  borderRadius: 11,
  padding: 11,
  marginBottom: 14,
  fontSize: 12,
};
