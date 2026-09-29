"use client";

import { usePathname } from "next/navigation";

const OFFICES = [
  {
    slug: "ceo",
    short: "CEO",
    ar: "الإدارة التنفيذية",
    en: "Executive Office",
    href: "/dashboard",
    description: "مركز القيادة والقرارات والأولويات والمتابعة التنفيذية.",
    links: [
      { href: "/dashboard", label: "لوحة الإدارة" },
    ],
  },
  {
    slug: "hr",
    short: "HR",
    ar: "الموارد البشرية",
    en: "Human Resources",
    href: "/hr",
    description: "إدارة دورة حياة الموظف، المواهب، الأداء، التعويضات والسياسات.",
    links: [
      { href: "/hr", label: "مركز HR" },
      { href: "/hr/lifecycle", label: "دورة الموظف" },
      { href: "/hr/recruitment", label: "التوظيف" },
      { href: "/hr/onboarding", label: "التهيئة" },
      { href: "/hr/leave-attendance", label: "الإجازات والحضور" },
      { href: "/hr/payroll", label: "الرواتب" },
      { href: "/hr/employee-payments", label: "المدفوعات والمطالبات" },
      { href: "/hr/performance", label: "الأداء" },
      { href: "/hr/talent", label: "المواهب" },
      { href: "/hr/training", label: "التدريب" },
      { href: "/hr/compensation", label: "التعويضات" },
      { href: "/hr/benefits", label: "المزايا" },
      { href: "/hr/workforce-planning", label: "تخطيط القوى العاملة" },
      { href: "/hr/cost-forecast", label: "توقع التكلفة" },
      { href: "/hr/government-compliance", label: "الامتثال الحكومي" },
      { href: "/hr/policies-compliance", label: "السياسات والامتثال" },
      { href: "/hr/employee-relations", label: "علاقات الموظفين" },
      { href: "/hr/final-settlement", label: "التسوية النهائية" },
      { href: "/hr/monthly-dashboard", label: "التقرير الشهري" },
      { href: "/hr/audit-trail", label: "سجل التدقيق" },
    ],
  },
  {
    slug: "finance",
    short: "FIN",
    ar: "المالية",
    en: "Finance",
    href: "/finance",
    description: "الحسابات، النقد والبنوك، الذمم، التقارير والتكاملات المالية.",
    links: [
      { href: "/finance", label: "مركز المالية" },
      { href: "/finance/reports", label: "التقارير" },
      { href: "/finance/cash-bank", label: "النقد والبنوك" },
      { href: "/finance/ap-ar", label: "AP / AR" },
      { href: "/finance/assets-accruals", label: "الأصول والاستحقاقات" },
      { href: "/finance/hr-integration", label: "تكامل HR" },
    ],
  },
  {
    slug: "procurement",
    short: "PR",
    ar: "المشتريات",
    en: "Procurement",
    href: "/procurement",
    description: "طلبات الشراء، الموردون، العروض، أوامر الشراء والاستلام.",
    links: [
      { href: "/procurement", label: "مركز المشتريات" },
    ],
  },
  {
    slug: "sales",
    short: "SLS",
    ar: "المبيعات",
    en: "Sales",
    href: "/sales",
    description: "العملاء المحتملون، الفرص، التسعير، البايبلاين والمتابعة التجارية.",
    links: [
      { href: "/sales", label: "مركز المبيعات" },
      { href: "/sales/leads", label: "Leads" },
      { href: "/sales/operations", label: "العمليات" },
    ],
  },
  {
    slug: "marketing",
    short: "MKT",
    ar: "التسويق",
    en: "Marketing",
    href: "/marketing",
    description: "الحملات، المحتوى، الإسناد، الإنفاق وقياس الأداء التسويقي.",
    links: [
      { href: "/marketing", label: "مركز التسويق" },
      { href: "/marketing/operations", label: "العمليات" },
      { href: "/marketing/spend", label: "الإنفاق" },
    ],
  },
  {
    slug: "admin",
    short: "ADM",
    ar: "الشؤون الإدارية",
    en: "Administration",
    href: "/admin",
    description: "المرافق، العهد، الزوار، السجلات والخدمات الإدارية المشتركة.",
    links: [
      { href: "/admin", label: "مركز الإدارة" },
      { href: "/admin/operations", label: "العمليات" },
      { href: "/admin/controls", label: "الضوابط" },
    ],
  },
  {
    slug: "legal",
    short: "LGL",
    ar: "القانونية",
    en: "Legal",
    href: "/legal",
    description: "العقود، الخصوصية، النزاهة، التفويضات والمسائل القانونية.",
    links: [
      { href: "/legal", label: "مركز القانونية" },
      { href: "/legal/privacy-integrity", label: "الخصوصية والنزاهة" },
      { href: "/legal/controls", label: "الضوابط" },
    ],
  },
  {
    slug: "it",
    short: "IT",
    ar: "تقنية المعلومات",
    en: "Information Technology",
    href: "/it",
    description: "الخدمات التقنية، الوصول، التعافي، التغيير والحوكمة الأمنية.",
    links: [
      { href: "/it", label: "مركز التقنية" },
      { href: "/it/access-recovery", label: "الوصول والتعافي" },
      { href: "/it/security-governance", label: "الحوكمة الأمنية" },
    ],
  },
  {
    slug: "audit",
    short: "AUD",
    ar: "التدقيق الداخلي",
    en: "Internal Audit",
    href: "/audit",
    description: "خطة التدقيق، المخاطر، النزاهة، المتابعة والتحقق المستقل.",
    links: [
      { href: "/audit", label: "مركز التدقيق" },
      { href: "/audit/risk", label: "المخاطر" },
      { href: "/audit/integrity-governance", label: "النزاهة والحوكمة" },
    ],
  },
];

const UTILITIES = [
  { href: "/document-intelligence", label: "المستندات الذكية", short: "DOC" },
  { href: "/company-control", label: "حوكمة الشركة", short: "GOV" },
];

function currentOffice(pathname) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return OFFICES[0];
  }

  return (
    OFFICES.find(
      (office) =>
        office.slug !== "ceo" &&
        (pathname === `/${office.slug}` || pathname.startsWith(`/${office.slug}/`))
    ) || null
  );
}

function contextForPath(pathname) {
  const office = currentOffice(pathname);
  if (office) return office;

  if (pathname.startsWith("/document-intelligence")) {
    return {
      slug: "documents",
      short: "DOC",
      ar: "المستندات الذكية",
      en: "Document Intelligence",
      href: "/document-intelligence",
      description: "قراءة المستندات واستخراج المعرفة وربطها بسياق العمل.",
      links: [{ href: "/document-intelligence", label: "مركز المستندات" }],
    };
  }

  if (pathname.startsWith("/company-control")) {
    return {
      slug: "governance",
      short: "GOV",
      ar: "حوكمة الشركة",
      en: "Company Control",
      href: "/company-control",
      description: "مرجع الشركة، الأدوار، الصلاحيات ومصفوفة الحوكمة.",
      links: [{ href: "/company-control", label: "مركز الحوكمة" }],
    };
  }

  return {
    slug: "system",
    short: "AI",
    ar: "Enclave AI",
    en: "Command Center",
    href: "/",
    description: "مركز القيادة الموحد لوكلاء Enclave.",
    links: [{ href: "/", label: "الرئيسية" }],
  };
}

function routeIsActive(pathname, href) {
  if (pathname === href) return true;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(`${href}/`);
}

function OfficeInterior({ office, pathname }) {
  return (
    <section className="enclave-office-interior" aria-label={`${office.ar} Office`}>
      <div className="enclave-office-interior-copy">
        <div className="enclave-office-interior-kicker">
          <span className="enclave-office-interior-live" />
          AI OFFICE · {office.short}
        </div>

        <h1>{office.ar}</h1>
        <p>{office.description}</p>

        <nav className="enclave-office-subnav" aria-label={`${office.ar} navigation`}>
          {office.links?.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={routeIsActive(pathname, item.href) ? "is-active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="enclave-office-scene" aria-hidden="true">
        <div className="enclave-office-scene-grid" />

        <div className="enclave-office-wall-panel enclave-office-wall-panel-right">
          <small>OFFICE</small>
          <strong>{office.short}</strong>
          <i />
          <i />
          <i />
        </div>

        <div className="enclave-office-wall-panel enclave-office-wall-panel-left">
          <small>ENCLAVE AI</small>
          <div className="enclave-office-mini-bars">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="enclave-office-agent">
          <span className="enclave-office-agent-head" />
          <span className="enclave-office-agent-body" />
        </div>

        <div className="enclave-office-monitor">
          <span />
          <i />
        </div>

        <div className="enclave-office-desk">
          <span />
        </div>

        <div className="enclave-office-chair" />

        <div className="enclave-office-plant enclave-office-plant-a">
          <i />
          <i />
          <i />
          <span />
        </div>

        <div className="enclave-office-plant enclave-office-plant-b">
          <i />
          <i />
          <i />
          <span />
        </div>

        <div className="enclave-office-floor-line" />
      </div>
    </section>
  );
}

export default function EnclaveSystemShell({ children }) {
  const pathname = usePathname() || "/";

  if (
    pathname === "/" ||
    (pathname.startsWith("/procurement/po/") && pathname.endsWith("/print"))
  ) {
    return children;
  }

  const active = contextForPath(pathname);

  return (
    <div className="enclave-system-shell" data-office={active.slug}>
      <header className="enclave-system-topbar">
        <a href="/" className="enclave-system-brand" aria-label="Enclave Home">
          <img src="/brand/enclave-favicon.svg" alt="Enclave" />
          <div>
            <strong>Enclave</strong>
            <span>AI Command Center</span>
          </div>
        </a>

        <div className="enclave-system-context">
          <span className="enclave-system-context-icon">{active.short}</span>
          <div>
            <small>ACTIVE OFFICE</small>
            <strong>{active.ar}</strong>
            <span>{active.en}</span>
          </div>
        </div>

        <nav className="enclave-system-utilities" aria-label="System utilities">
          {UTILITIES.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? "is-active" : ""}
            >
              <span>{item.short}</span>
              {item.label}
            </a>
          ))}
          <a href="/" className="enclave-system-home-link">
            الرئيسية
          </a>
        </nav>
      </header>

      <nav className="enclave-office-rail" aria-label="Agent offices">
        <div className="enclave-office-rail-title">
          <span>AI OFFICES</span>
          <strong>مكاتب الوكلاء</strong>
        </div>

        <div className="enclave-office-rail-scroll">
          {OFFICES.map((office) => {
            const selected = currentOffice(pathname)?.slug === office.slug;

            return (
              <a
                href={office.href}
                key={office.slug}
                className={`enclave-office-door ${selected ? "is-active" : ""}`}
              >
                <span className="enclave-office-door-icon">
                  <b>{office.short}</b>
                  <i />
                </span>
                <span className="enclave-office-door-copy">
                  <strong>{office.ar}</strong>
                  <small>{office.en}</small>
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      <OfficeInterior office={active} pathname={pathname} />

      <div className="enclave-system-content" data-office={active.slug}>
        {children}
      </div>

      <footer className="enclave-system-footer">
        <div>
          <span className="enclave-system-live-dot" />
          Enclave AI · Private Command Center
        </div>
        <span>كل إدارة لها مكتبها ووكيلها المتخصص</span>
      </footer>
    </div>
  );
}
