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

function list(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

async function api(path) {
  const response = await fetch(path, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.detail || `HTTP ${response.status}`);
  return body;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("en-SA", { maximumFractionDigits: 2 })} ر.س`;
}

function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar-SA", { day: "2-digit", month: "short", year: "numeric" });
}

function statusText(value) {
  return {
    pending: "معلقة",
    in_progress: "قيد التنفيذ",
    completed: "مكتملة",
    cancelled: "ملغاة",
    open: "جارية",
    won: "موقعة / فائزة",
    closed_won: "موقعة / فائزة",
    signed: "موقعة",
    active: "سارية",
    renewal_due: "تجديد قريب",
    escalation: "تحتاج تصعيد",
    expired: "منتهية",
  }[value] || value || "—";
}

function colorFor(value) {
  const text = String(value || "").toLowerCase();
  if (["expired", "escalation", "critical", "high"].includes(text)) return C.danger;
  if (["renewal_due", "warning", "medium", "pending"].includes(text)) return C.warning;
  if (["completed", "won", "closed_won", "signed", "active"].includes(text)) return C.primary;
  return C.blue;
}

function Badge({ value }) {
  const color = colorFor(value);
  return <span style={{ color, background: `${color}18`, borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{statusText(value)}</span>;
}

function Card({ title, value, subtitle, accent = C.primary }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 15, minHeight: 108 }}>
      <div style={{ color: C.mint, fontSize: 11 }}>{title}</div>
      <div style={{ color: accent, fontWeight: 850, fontSize: 26, marginTop: 8 }}>{value ?? "—"}</div>
      <div style={{ color: C.mint, fontSize: 10, marginTop: 6 }}>{subtitle}</div>
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          {subtitle ? <div style={{ color: C.mint, fontSize: 11, marginTop: 5 }}>{subtitle}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children = "لا توجد بيانات مسجلة حالياً." }) {
  return <div style={{ padding: 20, border: `1px dashed ${C.border}`, borderRadius: 12, color: C.mint, textAlign: "center", fontSize: 12 }}>{children}</div>;
}

function Table({ children, minWidth = 620 }) {
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth, borderCollapse: "collapse", fontSize: 12 }}>{children}</table></div>;
}

const cell = { padding: "10px 8px", borderBottom: `1px solid ${C.border}`, textAlign: "right", verticalAlign: "top" };

function ChartCard({ title, subtitle, children }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 17, minWidth: 0 }}>
      <h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2>
      <div style={{ color: C.mint, fontSize: 11, marginTop: 5 }}>{subtitle}</div>
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

function HorizontalBars({ items, formatter = (value) => value }) {
  const rows = (items || []).filter((item) => Number(item.value || 0) !== 0 || item.showZero);
  if (!rows.length) return <Empty>لا توجد بيانات كافية لعرض الرسم حالياً.</Empty>;

  const max = Math.max(1, ...rows.map((item) => Math.abs(Number(item.value || 0))));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((item) => {
        const value = Number(item.value || 0);
        const width = Math.max(value === 0 ? 0 : 4, Math.round((Math.abs(value) / max) * 100));
        const color = item.color || C.primary;
        return (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: C.pale, fontSize: 11 }}>
              <span>{item.label}</span>
              <strong style={{ color: value < 0 ? C.danger : color }}>{formatter(value)}</strong>
            </div>
            <div style={{ height: 9, marginTop: 6, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
              <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments, centerLabel = "الإجمالي" }) {
  const rows = (segments || []).filter((item) => Number(item.value || 0) > 0);
  const total = rows.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return <Empty>لا توجد بيانات كافية لعرض الرسم حالياً.</Empty>;

  let cursor = 0;
  const stops = rows.map((item) => {
    const start = (cursor / total) * 360;
    cursor += Number(item.value || 0);
    const end = (cursor / total) * 360;
    return `${item.color || C.primary} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <div style={{ width: 132, height: 132, borderRadius: "50%", background: `conic-gradient(${stops})`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <div style={{ width: 78, height: 78, borderRadius: "50%", background: C.panel, display: "grid", placeItems: "center", textAlign: "center" }}>
          <strong style={{ fontSize: 20, color: C.pale }}>{total.toLocaleString("en-SA")}</strong>
          <span style={{ color: C.mint, fontSize: 9 }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8, minWidth: 150 }}>
        {rows.map((item) => <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, color: C.pale, fontSize: 11 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: item.color || C.primary }} /><span style={{ flex: 1 }}>{item.label}</span><strong>{Number(item.value || 0).toLocaleString("en-SA")}</strong></div>)}
      </div>
    </div>
  );
}

function TargetProgressChart({ targets }) {
  const rows = (targets || []).filter((row) => Number(row.target_amount || 0) > 0);
  if (!rows.length) return <Empty>لا توجد أهداف مبيعات معتمدة حالياً.</Empty>;

  return (
    <div style={{ display: "grid", gap: 13 }}>
      {rows.slice(0, 8).map((row) => {
        const target = Number(row.target_amount || 0);
        const realized = Number(row.realized_amount || 0);
        const pipeline = Number(row.qualified_pipeline || 0);
        const realizedWidth = Math.min(100, Math.max(0, (realized / target) * 100));
        const pipelineWidth = Math.min(100, Math.max(0, (pipeline / target) * 100));
        return (
          <div key={row.target_id || `${row.period_label}-${row.owner_name}`}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11 }}>
              <span>{row.period_label || "الفترة"} · {row.owner_name || "كل الفريق"}</span>
              <strong style={{ color: C.pale }}>{money(realized)} / {money(target)}</strong>
            </div>
            <div style={{ position: "relative", height: 11, marginTop: 6, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${pipelineWidth}%`, background: `${C.blue}99`, borderRadius: 999 }} />
              <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${realizedWidth}%`, background: C.primary, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", gap: 12, color: C.mint, fontSize: 9, marginTop: 5 }}>
              <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: C.primary, marginLeft: 4 }} />المحقق {money(realized)}</span>
              <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: C.blue, marginLeft: 4 }} />البايبلاين {money(pipeline)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardsReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState(false);

  async function load() {
    setLoading(true);
    let failed = 0;
    const safe = async (path, fallback) => {
      try { return await api(path); } catch { failed += 1; return fallback; }
    };
    const now = new Date();
    const monthPath = `/api/hr/monthly-dashboard?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
    const [dashboard, hrSummary, employees, contracts, hrMonthly, salesSummary, opportunities, forecast, finance, complianceSummary, corporate, employeeDocs] = await Promise.all([
      safe("/api/dashboard", {}),
      safe("/api/hr/summary", {}),
      safe("/api/hr/employees", []),
      safe("/api/hr/contracts", []),
      safe(monthPath, {}),
      safe("/api/sales/phase1c-summary", {}),
      safe("/api/sales/opportunities", []),
      safe(`/api/sales/forecast-dashboard?year=${now.getFullYear()}`, { targets: [] }),
      safe(`/api/finance/reports/dashboard?as_of_date=${now.toISOString().slice(0, 10)}`, {}),
      safe("/api/hr/government-compliance/summary", {}),
      safe("/api/hr/government-compliance/corporate", []),
      safe("/api/hr/government-compliance/employee-documents", []),
    ]);
    setData({ dashboard, hrSummary, employees: list(employees), contracts: list(contracts), hrMonthly, salesSummary, opportunities: list(opportunities), forecast, finance, complianceSummary, corporate: list(corporate), employeeDocs: list(employeeDocs) });
    setPartial(failed > 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const summary = data?.dashboard?.summary || {};
  const opportunities = data?.opportunities || [];
  const signed = useMemo(() => opportunities.filter((row) => ["won", "closed_won", "signed", "contracted"].includes(String(row.status || "").toLowerCase()) || Number(row.stage) === 8), [opportunities]);
  const activeOpportunities = useMemo(() => opportunities.filter((row) => String(row.status || "").toLowerCase() === "open"), [opportunities]);
  const complianceRows = [...(data?.corporate || []), ...(data?.employeeDocs || [])];
  const complianceAlerts = complianceRows.filter((row) => ["renewal_due", "escalation", "expired"].includes(row.status));
  const sortedContracts = [...(data?.contracts || [])].filter((row) => row.end_date).sort((a, b) => String(a.end_date).localeCompare(String(b.end_date)));
  const hrMonthly = data?.hrMonthly || {};
  const payroll = hrMonthly.payroll || {};
  const workforce = hrMonthly.workforce || {};
  const finance = data?.finance || {};

  const taskSegments = [
    { label: "مكتملة", value: Number(summary.completed_tasks || 0), color: C.primary },
    { label: "قيد التنفيذ", value: Number(summary.in_progress_tasks || 0), color: C.blue },
    { label: "معلقة", value: Number(summary.pending_tasks || 0), color: C.warning },
    { label: "بانتظار اعتماد", value: Number(summary.pending_approvals || 0), color: C.danger },
  ];

  const salesStatusCounts = opportunities.reduce((result, row) => {
    const key = String(row.status || "open").toLowerCase();
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  const salesChartItems = [
    { label: "جارية", value: salesStatusCounts.open || activeOpportunities.length, color: C.blue, showZero: true },
    { label: "موقعة / فائزة", value: (salesStatusCounts.won || 0) + (salesStatusCounts.closed_won || 0) + (salesStatusCounts.signed || 0) + (salesStatusCounts.contracted || 0), color: C.primary, showZero: true },
    { label: "مغلقة / خاسرة", value: salesStatusCounts.lost || salesStatusCounts.closed_lost || 0, color: C.danger, showZero: true },
  ];

  const complianceChartItems = [
    { label: "سارية", value: complianceRows.filter((row) => ["active", "valid", "current"].includes(String(row.status || "").toLowerCase())).length, color: C.primary, showZero: true },
    { label: "تجديد قريب", value: complianceRows.filter((row) => row.status === "renewal_due").length, color: C.warning, showZero: true },
    { label: "تحتاج تصعيد", value: complianceRows.filter((row) => row.status === "escalation").length, color: C.danger, showZero: true },
    { label: "منتهية", value: complianceRows.filter((row) => row.status === "expired").length, color: C.danger, showZero: true },
  ];

  const financialChartItems = [
    { label: "الإيرادات YTD", value: Number(finance.year_to_date?.revenue || 0), color: C.primary },
    { label: "المصروفات YTD", value: Number(finance.year_to_date?.expense || 0), color: C.warning },
    { label: "صافي الربح YTD", value: Number(finance.year_to_date?.net_profit || 0), color: Number(finance.year_to_date?.net_profit || 0) < 0 ? C.danger : C.blue },
  ];

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: C.bg, color: C.pale, padding: 28 }}>
      <div style={{ maxWidth: 1660, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ color: C.primary, fontSize: 11, letterSpacing: "1px" }}>ENCLAVE AI · DASHBOARDS & REPORTS</div>
            <h1 style={{ margin: "7px 0 5px", fontSize: 30 }}>الداشبورد والتقارير</h1>
            <div style={{ color: C.mint, fontSize: 13 }}>جداول ومؤشرات موحدة للأعمال المكتملة والجارية والأهداف وتقارير الإدارات.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={load} disabled={loading} style={buttonStyle}>{loading ? "جاري التحديث..." : "تحديث البيانات"}</button>
            <a href="/executive" style={linkStyle}>الصفحة التنفيذية</a>
            <a href="/" style={linkStyle}>الرئيسية</a>
          </div>
        </header>

        {partial ? <div style={{ border: `1px solid ${C.warning}55`, background: `${C.warning}10`, borderRadius: 11, padding: 11, marginBottom: 14, color: C.warning, fontSize: 12 }}>بعض المصادر لم تستجب. الأرقام المعروضة مأخوذة من السجلات المتاحة فقط، ولا يتم إنشاء أرقام تقديرية.</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 11, marginBottom: 16 }}>
          <Card title="المهام المكتملة" value={summary.completed_tasks ?? "—"} subtitle="Completed work" />
          <Card title="قيد التنفيذ" value={summary.in_progress_tasks ?? "—"} subtitle="In progress" accent={C.blue} />
          <Card title="المهام المعلقة" value={summary.pending_tasks ?? "—"} subtitle="Pending work" accent={C.warning} />
          <Card title="أهداف معتمدة" value={data?.forecast?.targets?.length ?? 0} subtitle="Approved sales targets" accent={C.blue} />
          <Card title="عدد الموظفين" value={data?.hrSummary?.active_employees ?? data?.employees?.length ?? "—"} subtitle="Active headcount" />
          <Card title="البايبلاين الجاري" value={data?.salesSummary?.pipeline?.open ?? activeOpportunities.length} subtitle="Open opportunities" accent={C.warning} />
          <Card title="تنبيهات حكومية" value={complianceAlerts.length} subtitle="Renewal / expiry alerts" accent={C.danger} />
          <Card title="صافي الربح YTD" value={finance.year_to_date?.net_profit == null ? "—" : money(finance.year_to_date.net_profit)} subtitle="Finance snapshot" accent={finance.year_to_date?.net_profit >= 0 ? C.primary : C.danger} />
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 16, marginBottom: 16 }}>
          <ChartCard title="توزيع الأعمال" subtitle="المهام والاعتمادات المسجلة في النظام">
            <DonutChart segments={taskSegments} centerLabel="عمل" />
          </ChartCard>
          <ChartCard title="البايبلاين حسب الحالة" subtitle="عدد الفرص التجارية الفعلية">
            <HorizontalBars items={salesChartItems} formatter={(value) => `${value.toLocaleString("en-SA")} فرصة`} />
          </ChartCard>
          <ChartCard title="الامتثال والانتهاءات" subtitle="الخدمات الحكومية والشهادات المسجلة">
            <HorizontalBars items={complianceChartItems} formatter={(value) => `${value.toLocaleString("en-SA")} سجل`} />
          </ChartCard>
          <ChartCard title="الملخص المالي YTD" subtitle="الإيرادات والمصروفات وصافي الربح">
            <HorizontalBars items={financialChartItems} formatter={money} />
          </ChartCard>
        </div>

        <Section title="الأهداف مقابل المحقق" subtitle="المحقق والبايبلاين مقارنة بالهدف المعتمد. الأزرق للبايبلاين والأخضر للمحقق.">
          <TargetProgressChart targets={data?.forecast?.targets || []} />
        </Section>

        <Section title="ملخص الأعمال والأهداف" subtitle="الأرقام مبنية على المهام والأهداف المعتمدة المسجلة في النظام." action={<a href="/dashboard" style={smallLink}>لوحة القيادة الحالية</a>}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
            <Table minWidth={500}>
              <thead><tr>{["الحالة", "العدد", "المعنى"].map((x) => <th key={x} style={{ ...cell, color: C.mint }}>{x}</th>)}</tr></thead>
              <tbody>
                {[["completed_tasks", "المكتملة", "الأعمال التي أغلقت"], ["in_progress_tasks", "قيد التنفيذ", "أعمال تعمل عليها الإدارات"], ["pending_tasks", "المعلقة", "تحتاج متابعة أو بدء"], ["pending_approvals", "بانتظار الاعتماد", "قرار مطلوب من صاحب الصلاحية"]].map(([key, label, description]) => <tr key={key}><td style={cell}><Badge value={key === "completed_tasks" ? "completed" : key === "pending_tasks" ? "pending" : key === "pending_approvals" ? "high" : "in_progress"} /></td><td style={{ ...cell, fontWeight: 850, fontSize: 17 }}>{summary[key] ?? "—"}</td><td style={{ ...cell, color: C.mint }}>{label} · {description}</td></tr>)}
              </tbody>
            </Table>
            {data?.forecast?.targets?.length ? (
              <Table minWidth={600}>
                <thead><tr>{["الفترة", "المالك", "المستهدف", "المحقق", "البايبلاين"].map((x) => <th key={x} style={{ ...cell, color: C.mint }}>{x}</th>)}</tr></thead>
                <tbody>{data.forecast.targets.slice(0, 8).map((row) => <tr key={row.target_id}><td style={cell}>{row.period_label || "—"}</td><td style={cell}>{row.owner_name || "كل الفريق"}</td><td style={cell}>{money(row.target_amount)}</td><td style={cell}>{money(row.realized_amount)}</td><td style={cell}>{money(row.qualified_pipeline)}</td></tr>)}</tbody>
              </Table>
            ) : <Empty>لا توجد أهداف مبيعات معتمدة حالياً. عند اعتماد هدف سيظهر هنا تلقائياً.</Empty>}
          </div>
        </Section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
          <ReportCard title="تقرير الموارد البشرية" subtitle="الموظفون والتكلفة والعقود" href="/hr/monthly-dashboard" metrics={[
            ["الموظفون النشطون", data?.hrSummary?.active_employees ?? "—"],
            ["التكلفة الشهرية", payroll.employer_total_cost == null ? "—" : money(payroll.employer_total_cost)],
            ["العقود النشطة", data?.hrSummary?.active_contracts ?? "—"],
            ["أقرب انتهاء", sortedContracts[0]?.end_date ? dateText(sortedContracts[0].end_date) : "—"],
          ]} />
          <ReportCard title="تقرير المبيعات" subtitle="البايبلاين والأعمال الموقعة والجارية" href="/sales/operations" metrics={[
            ["البايبلاين", data?.salesSummary?.pipeline?.open ?? activeOpportunities.length],
            ["تحتاج مراجعة", data?.salesSummary?.pipeline?.needs_review ?? "—"],
            ["موقعة / فائزة", signed.length],
            ["أنشطة مخططة", data?.salesSummary?.activities?.planned ?? "—"],
          ]} />
          <ReportCard title="تقرير الخدمات الحكومية" subtitle="الشهادات والأرقام والانتهاء" href="/hr/government-compliance" metrics={[
            ["إجمالي السجلات", data?.complianceSummary?.total_records ?? complianceRows.length],
            ["تجديد قريب", data?.complianceSummary?.renewal_due ?? "—"],
            ["تحتاج تصعيد", data?.complianceSummary?.escalation ?? "—"],
            ["منتهية", data?.complianceSummary?.expired ?? "—"],
          ]} />
          <ReportCard title="تقرير المالية" subtitle="الإيرادات والمصروفات والسيولة" href="/finance/reports" metrics={[
            ["الإيرادات YTD", finance.year_to_date?.revenue == null ? "—" : money(finance.year_to_date.revenue)],
            ["المصروفات YTD", finance.year_to_date?.expense == null ? "—" : money(finance.year_to_date.expense)],
            ["النقد", finance.cash_position == null ? "—" : money(finance.cash_position)],
            ["الذمم المدينة", finance.ar_outstanding == null ? "—" : money(finance.ar_outstanding)],
          ]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 16 }}>
          <Section title="العقود وتواريخ الانتهاء" subtitle="من سجل عقود الموظفين" action={<a href="/hr" style={smallLink}>فتح HR Workspace</a>}>
            {sortedContracts.length ? <Table minWidth={720}><thead><tr>{["الموظف", "نوع العقد", "التكلفة الشهرية", "تاريخ الانتهاء", "الحالة"].map((x) => <th key={x} style={{ ...cell, color: C.mint }}>{x}</th>)}</tr></thead><tbody>{sortedContracts.slice(0, 12).map((row) => <tr key={row.id}><td style={cell}>{row.employee_name || row.employee_number || "—"}</td><td style={cell}>{row.contract_type || "—"}</td><td style={cell}>{row.monthly_cash_compensation == null ? "—" : money(row.monthly_cash_compensation)}</td><td style={cell}>{dateText(row.end_date)}</td><td style={cell}><Badge value={row.status} /></td></tr>)}</tbody></Table> : <Empty>لا توجد عقود مسجلة بتواريخ انتهاء.</Empty>}
          </Section>

          <Section title="المبيعات: الأعمال الجارية والموقعة" subtitle="من سجل الفرص التجارية" action={<a href="/sales/operations" style={smallLink}>فتح عمليات المبيعات</a>}>
            {opportunities.length ? <Table minWidth={720}><thead><tr>{["الفرصة", "العميل", "المرحلة", "القيمة", "الحالة"].map((x) => <th key={x} style={{ ...cell, color: C.mint }}>{x}</th>)}</tr></thead><tbody>{opportunities.slice(0, 12).map((row) => <tr key={row.id}><td style={cell}>{row.name || row.code || "—"}</td><td style={cell}>{row.account_name || row.company_name || "—"}</td><td style={cell}>{row.stage_label || row.stage || "—"}</td><td style={cell}>{row.net_revenue_ex_vat == null ? "—" : money(row.net_revenue_ex_vat)}</td><td style={cell}><Badge value={row.status} /></td></tr>)}</tbody></Table> : <Empty>لا توجد فرص مبيعات مسجلة حالياً.</Empty>}
          </Section>
        </div>

        <Section title="الخدمات الحكومية والشهادات" subtitle="رقم الوثيقة وتاريخ الانتهاء والتنبيه الحالي" action={<a href="/hr/government-compliance" style={smallLink}>فتح سجل الخدمات الحكومية</a>}>
          {complianceRows.length ? <Table minWidth={840}><thead><tr>{["الخدمة / المستند", "الجهة", "الرقم", "تاريخ الانتهاء", "الحالة", "المتبقي"].map((x) => <th key={x} style={{ ...cell, color: C.mint }}>{x}</th>)}</tr></thead><tbody>{complianceRows.slice(0, 20).map((row) => <tr key={`${row.id}-${row.document_number || row.document_type}`}><td style={cell}>{row.entity_name || row.record_type || row.document_type || "—"}</td><td style={cell}>{row.issuing_authority || "—"}</td><td style={cell}>{row.document_number || "—"}</td><td style={cell}>{dateText(row.expiry_date)}</td><td style={cell}><Badge value={row.status} /></td><td style={{ ...cell, color: colorFor(row.status) }}>{row.days_remaining == null ? "—" : `${row.days_remaining} يوم`}</td></tr>)}</tbody></Table> : <Empty>لا توجد شهادات أو وثائق حكومية مسجلة حالياً.</Empty>}
        </Section>
      </div>
    </main>
  );
}

function ReportCard({ title, subtitle, href, metrics }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 17 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div><h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2><div style={{ color: C.mint, fontSize: 11, marginTop: 5 }}>{subtitle}</div></div>
        <a href={href} style={smallLink}>فتح التقرير</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
        {metrics.map(([label, value]) => <div key={label} style={{ background: C.soft, borderRadius: 10, padding: "9px 10px" }}><div style={{ color: C.mint, fontSize: 10 }}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 15, color: C.pale }}>{value}</strong></div>)}
      </div>
    </section>
  );
}

const buttonStyle = { border: `1px solid ${C.primary}`, borderRadius: 10, padding: "9px 13px", color: C.primary, background: "rgba(24,213,183,.10)", cursor: "pointer", fontWeight: 800, fontSize: 11 };
const linkStyle = { display: "inline-flex", alignItems: "center", minHeight: 40, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 10, color: C.pale, background: C.panel, textDecoration: "none", fontSize: 11, fontWeight: 800 };
const smallLink = { color: C.primary, textDecoration: "none", fontSize: 11, fontWeight: 800 };
