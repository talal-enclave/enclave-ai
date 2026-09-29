"use client";

import { useEffect, useMemo, useState } from "react";

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail || `Request failed: ${response.status}`
    );
  }

  return data;
}

function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`cc-badge cc-${tone}`}>
      {children}
    </span>
  );
}

function Card({ title, value, hint }) {
  return (
    <div className="cc-card">
      <div className="cc-card-title">{title}</div>
      <div className="cc-card-value">{value}</div>
      {hint ? <div className="cc-card-hint">{hint}</div> : null}
    </div>
  );
}

export default function CompanyControlPage() {
  const [summary, setSummary] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rules, setRules] = useState([]);
  const [limits, setLimits] = useState([]);
  const [tab, setTab] = useState("profile");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const [s, r, a, l] = await Promise.all([
        api("/api/company/control-summary"),
        api("/api/company/authority/roles"),
        api("/api/company/authority/rules?limit=250"),
        api("/api/company/authority/limits"),
      ]);

      setSummary(s);
      setRoles(Array.isArray(r) ? r : []);
      setRules(Array.isArray(a) ? a : []);
      setLimits(Array.isArray(l) ? l : []);
    } catch (err) {
      setError(err?.message || "Unable to load company control data");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const domains = useMemo(
    () =>
      Array.from(new Set(rules.map((x) => x.domain))).sort(),
    [rules]
  );

  const visibleRules = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rules.filter((row) => {
      if (domain && row.domain !== domain) return false;
      if (!q) return true;

      return [
        row.activity,
        row.authority_condition,
        row.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        );
    });
  }, [rules, query, domain]);

  const company = summary?.company;
  const authority = summary?.authority;

  return (
    <main className="cc-page" dir="rtl">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06131e; }
        .cc-page {
          min-height: 100vh;
          padding: 26px;
          color: #f7fafc;
          font-family: Arial, "Segoe UI", sans-serif;
        }
        .cc-shell { max-width: 1600px; margin: 0 auto; }
        .cc-hero {
          background: #0b1d2d;
          color: white;
          border-radius: 20px;
          padding: 26px 28px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .cc-eyebrow {
          color: #71c8c1;
          font-size: 12px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .cc-hero h1 { margin: 8px 0 0; font-size: 32px; }
        .cc-hero p {
          color: #d9e7e6;
          line-height: 1.8;
          max-width: 850px;
          margin-bottom: 0;
        }
        .cc-back {
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          border-radius: 11px;
          padding: 10px 13px;
          height: fit-content;
          font-weight: 800;
          font-size: 12px;
        }
        .cc-notice {
          margin: 16px 0;
          padding: 13px 15px;
          border-radius: 12px;
          background: #332b17;
          border: 1px solid #6b5a28;
          color: #f5c96b;
          line-height: 1.75;
          font-size: 12px;
        }
        .cc-error {
          margin: 16px 0;
          padding: 13px;
          background: #321d26;
          border: 1px solid #71404a;
          color: #ff9cac;
          border-radius: 12px;
        }
        .cc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap: 12px;
          margin: 18px 0;
        }
        .cc-card {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 14px;
          padding: 16px;
        }
        .cc-card-title { color: #8fb8b6; font-size: 11px; }
        .cc-card-value {
          font-size: 24px;
          font-weight: 900;
          margin-top: 7px;
        }
        .cc-card-hint {
          font-size: 10px;
          color: #71c8c1;
          margin-top: 6px;
        }
        .cc-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 18px 0;
        }
        .cc-tab {
          border: 1px solid #234a57;
          background: #0b1d2d;
          color: #9bbfbd;
          border-radius: 999px;
          padding: 9px 13px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .cc-tab-active { background: #0b1d2d; color: white; }
        .cc-panel {
          background: #0b1d2d;
          border: 1px solid #234a57;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .cc-panel-head {
          padding: 16px 18px;
          border-bottom: 1px solid #234a57;
          font-weight: 900;
        }
        .cc-panel-body { padding: 18px; }
        .cc-profile {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(230px,1fr));
          gap: 12px;
        }
        .cc-field {
          background: #102735;
          border-radius: 11px;
          padding: 13px;
        }
        .cc-field-label { color: #8fb8b6; font-size: 10px; }
        .cc-field-value {
          margin-top: 6px;
          font-weight: 800;
          word-break: break-word;
        }
        .cc-table-wrap {
          overflow: auto;
          border: 1px solid #234a57;
          border-radius: 12px;
        }
        .cc-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
          font-size: 11px;
        }
        .cc-table th {
          background: #102735;
          padding: 10px;
          text-align: right;
          color: #9bbfbd;
          white-space: nowrap;
          border-bottom: 1px solid #234a57;
        }
        .cc-table td {
          padding: 10px;
          vertical-align: top;
          border-bottom: 1px solid #102735;
          line-height: 1.55;
        }
        .cc-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }
        .cc-neutral { background: #102735; color: #9bbfbd; }
        .cc-safe { background: #0b302b; color: #72dfc7; }
        .cc-warn { background: #332b17; color: #f5c96b; }
        .cc-filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 13px;
        }
        .cc-input {
          border: 1px solid #234a57;
          border-radius: 10px;
          padding: 10px 11px;
          background: #0b1d2d;
          min-width: 220px;
        }
        .cc-raci {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .cc-raci-item {
          direction: ltr;
          border: 1px solid #234a57;
          border-radius: 8px;
          padding: 4px 6px;
          background: #102735;
          white-space: nowrap;
          font-size: 9px;
        }
        @media (max-width: 700px) {
          .cc-page { padding: 12px; }
          .cc-hero { padding: 20px; }
          .cc-hero h1 { font-size: 26px; }
        }
      `}</style>

      <div className="cc-shell">
        <section className="cc-hero">
          <div>
            <div className="cc-eyebrow">Company Control Center</div>
            <h1>مركز التحكم بالشركة</h1>
            <p>
              الملف القانوني الأساسي، مصفوفة الصلاحيات RACI، الأدوار،
              وحدود الصلاحيات المقترحة — بدون تفعيل آلي لأي صلاحية أو حد مالي.
            </p>
          </div>
          <a href="/" className="cc-back">العودة للرئيسية</a>
        </section>

        {error ? <div className="cc-error">{error}</div> : null}

        <div className="cc-notice">
          مصفوفة الصلاحيات محمّلة كمرجع فقط. التوجيه الآلي للاعتمادات غير
          مفعّل، والحدود المالية في ملف المصدر موصوفة بأنها مقترحة وتحتاج
          اعتمادًا قبل تطبيقها.
        </div>

        <div className="cc-grid">
          <Card
            title="أنشطة وقرارات RACI"
            value={authority?.rules?.total ?? "—"}
            hint={`${authority?.rules?.domains?.length ?? 0} مجالات`}
          />
          <Card
            title="الأدوار"
            value={authority?.roles?.total ?? "—"}
            hint={`المعين حاليًا: ${authority?.roles?.assigned ?? 0}`}
          />
          <Card
            title="حدود الصلاحيات المقترحة"
            value={authority?.proposed_limits?.total ?? "—"}
            hint="التنفيذ الآلي: متوقف"
          />
          <Card
            title="VAT"
            value={company?.vat_status || "—"}
            hint={company?.vat_number || "لا يوجد رقم مثبت"}
          />
        </div>

        <div className="cc-tabs">
          {[
            ["profile", "ملف الشركة"],
            ["rules", "مصفوفة RACI"],
            ["limits", "حدود الصلاحيات"],
            ["roles", "الأدوار"],
            ["numbering", "ترقيم المستندات"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`cc-tab ${tab === key ? "cc-tab-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "profile" ? (
          <section className="cc-panel">
            <div className="cc-panel-head">الملف الأساسي للشركة</div>
            <div className="cc-panel-body">
              <div className="cc-profile">
                {[
                  ["الاسم القانوني", company?.legal_name_en],
                  ["السجل التجاري", company?.commercial_registration_no],
                  ["المدينة", company?.city],
                  ["الدولة", company?.country_code],
                  ["العملة الأساسية", company?.base_currency],
                  ["المنطقة الزمنية", company?.timezone],
                  ["حالة VAT", company?.vat_status],
                  ["رقم VAT", company?.vat_number || "غير مثبت"],
                ].map(([label, value]) => (
                  <div className="cc-field" key={label}>
                    <div className="cc-field-label">{label}</div>
                    <div className="cc-field-value">{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "rules" ? (
          <section className="cc-panel">
            <div className="cc-panel-head">
              مصفوفة الصلاحيات والمسؤوليات
            </div>
            <div className="cc-panel-body">
              <div className="cc-filter-row">
                <select
                  className="cc-input"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="">كل المجالات</option>
                  {domains.map((x) => (
                    <option value={x} key={x}>{x}</option>
                  ))}
                </select>
                <input
                  className="cc-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث في النشاط أو الشرط..."
                />
                <Badge tone="neutral">
                  {visibleRules.length} نتيجة
                </Badge>
              </div>

              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>م</th>
                      <th>المجال</th>
                      <th>النشاط / القرار</th>
                      <th>الشرط</th>
                      <th>RACI</th>
                      <th>الزمن المستهدف</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRules.map((row) => (
                      <tr key={row.id}>
                        <td>{row.source_row_number}</td>
                        <td>{row.domain}</td>
                        <td>{row.activity}</td>
                        <td>{row.authority_condition || "—"}</td>
                        <td>
                          <div className="cc-raci" dir="ltr">
                            {Object.entries(row.raci || {})
                              .filter(([, value]) => value && value !== "—")
                              .map(([key, value]) => (
                                <span className="cc-raci-item" key={key}>
                                  {key}: {value}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td>{row.target_sla || "—"}</td>
                        <td>
                          <Badge tone="safe">
                            مرجع فقط
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "limits" ? (
          <section className="cc-panel">
            <div className="cc-panel-head">
              حدود الصلاحيات الواردة في المصدر
            </div>
            <div className="cc-panel-body">
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>المجال</th>
                      <th>الشريحة / الحالة</th>
                      <th>الطريقة / الشرط</th>
                      <th>R</th>
                      <th>C</th>
                      <th>A</th>
                      <th>التصعيد</th>
                      <th>الوثائق</th>
                      <th>حالة المصدر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits.map((row) => (
                      <tr key={row.id}>
                        <td>{row.domain}</td>
                        <td>{row.band_or_case}</td>
                        <td>{row.method_or_condition || "—"}</td>
                        <td>{row.responsible || "—"}</td>
                        <td>{row.consulted || "—"}</td>
                        <td>{row.accountable || "—"}</td>
                        <td>{row.escalation || "—"}</td>
                        <td>{row.required_documents || "—"}</td>
                        <td>
                          <Badge tone="warn">
                            {row.source_status || "مقترح"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "roles" ? (
          <section className="cc-panel">
            <div className="cc-panel-head">
              قائمة الأدوار
            </div>
            <div className="cc-panel-body">
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>الرمز</th>
                      <th>الدور</th>
                      <th>نطاق الصلاحية</th>
                      <th>شاغل الدور</th>
                      <th>البديل المفوض</th>
                      <th>الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((row) => (
                      <tr key={row.id}>
                        <td dir="ltr"><strong>{row.code}</strong></td>
                        <td>{row.name_ar}</td>
                        <td>{row.scope_ar}</td>
                        <td>{row.incumbent_name || "غير معيّن"}</td>
                        <td>{row.delegate_name || "غير معيّن"}</td>
                        <td>{row.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "numbering" ? (
          <section className="cc-panel">
            <div className="cc-panel-head">جاهزية ترقيم المستندات</div>
            <div className="cc-panel-body">
              <div className="cc-notice" style={{ margin: 0 }}>
                لم يتم تغيير آليات الترقيم الحالية في Finance أو Procurement.
                السجل المركزي للترقيم غير مفعّل الآن؛ وسيتم ربطه في مرحلة مستقلة
                بعد تدقيق صيغ PR / RFQ / PO / القيود والمستندات التجارية
                الموجودة فعليًا، حتى لا ننشئ ترقيمًا متعارضًا.
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
