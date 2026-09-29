"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = {
  bg: "#06131e",
  panel: "#0b1d2d",
  panel2: "#142b3d",
  primary: "#18d5b7",
  primarySoft: "rgba(24,213,183,0.12)",
  beige: "#d9e7e6",
  text: "#ffffff",
  muted: "#71c8c1",
  border: "rgba(255,255,255,0.09)",
  danger: "#ff8b8b",
};

function money(value) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function Card({ title, value, subtitle }) {
  return (
    <div className="metric">
      <div className="metricTitle">{title}</div>
      <div className="metricValue">{value}</div>
      <div className="metricSub">{subtitle}</div>
    </div>
  );
}

export default function HRWorkspace() {
  const [tab, setTab] = useState("employees");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({});
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);

  const [departmentForm, setDepartmentForm] = useState({
    code: "",
    name_ar: "",
    name_en: "",
    cost_center: "",
  });

  const [positionForm, setPositionForm] = useState({
    code: "",
    title_ar: "",
    title_en: "",
    department_id: "",
    grade: "",
    employment_level: "",
    headcount_budget: "1",
    min_salary: "",
    midpoint_salary: "",
    max_salary: "",
  });

  const [employeeForm, setEmployeeForm] = useState({
    employee_number: "",
    full_name_ar: "",
    full_name_en: "",
    nationality: "",
    work_email: "",
    mobile: "",
    department_id: "",
    position_id: "",
    hire_date: "",
    employment_status: "active",
    employment_type: "full_time",
    work_location: "Riyadh",
    gosi_registered: false,
  });

  const [contractForm, setContractForm] = useState({
    employee_id: "",
    contract_number: "",
    contract_type: "fixed_term",
    start_date: "",
    end_date: "",
    auto_renew: false,
    notice_period_days: "60",
    basic_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    other_fixed_allowances: "",
    employer_gosi_cost: "",
    medical_insurance_cost_annual: "",
    other_annual_cost: "",
  });

  async function request(path, options = {}) {
    const res = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.detail ||
        data?.message ||
        "تعذر تنفيذ العملية"
      );
    }

    return data;
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        departmentData,
        positionData,
        employeeData,
        contractData,
      ] = await Promise.all([
        request("/api/hr/summary"),
        request("/api/hr/departments"),
        request("/api/hr/positions"),
        request("/api/hr/employees"),
        request("/api/hr/contracts"),
      ]);

      setSummary(summaryData || {});
      setDepartments(departmentData || []);
      setPositions(positionData || []);
      setEmployees(employeeData || []);
      setContracts(contractData || []);
    } catch (err) {
      setError(err.message || "تعذر تحميل بيانات الموارد البشرية.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const totalAnnualCost = useMemo(
    () =>
      contracts
        .filter((x) => x.status === "active")
        .reduce(
          (sum, x) =>
            sum + Number(x.annual_employment_cost || 0),
          0
        ),
    [contracts]
  );

  const totalMonthlyCash = useMemo(
    () =>
      contracts
        .filter((x) => x.status === "active")
        .reduce(
          (sum, x) =>
            sum + Number(x.monthly_cash_compensation || 0),
          0
        ),
    [contracts]
  );

  function showSuccess(message) {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function submitDepartment(e) {
    e.preventDefault();

    try {
      await request("/api/hr/departments", {
        method: "POST",
        body: JSON.stringify({
          ...departmentForm,
          name_en: departmentForm.name_en || null,
          cost_center: departmentForm.cost_center || null,
        }),
      });

      setDepartmentForm({
        code: "",
        name_ar: "",
        name_en: "",
        cost_center: "",
      });

      showSuccess("تم إنشاء الإدارة بنجاح.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitPosition(e) {
    e.preventDefault();

    try {
      await request("/api/hr/positions", {
        method: "POST",
        body: JSON.stringify({
          code: positionForm.code,
          title_ar: positionForm.title_ar,
          title_en: positionForm.title_en || null,
          department_id:
            positionForm.department_id || null,
          grade: positionForm.grade || null,
          employment_level:
            positionForm.employment_level || null,
          headcount_budget:
            Number(positionForm.headcount_budget || 1),
          min_salary:
            positionForm.min_salary
              ? Number(positionForm.min_salary)
              : null,
          midpoint_salary:
            positionForm.midpoint_salary
              ? Number(positionForm.midpoint_salary)
              : null,
          max_salary:
            positionForm.max_salary
              ? Number(positionForm.max_salary)
              : null,
        }),
      });

      setPositionForm({
        code: "",
        title_ar: "",
        title_en: "",
        department_id: "",
        grade: "",
        employment_level: "",
        headcount_budget: "1",
        min_salary: "",
        midpoint_salary: "",
        max_salary: "",
      });

      showSuccess("تم إنشاء المنصب بنجاح.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitEmployee(e) {
    e.preventDefault();

    try {
      await request("/api/hr/employees", {
        method: "POST",
        body: JSON.stringify({
          ...employeeForm,
          full_name_en:
            employeeForm.full_name_en || null,
          nationality:
            employeeForm.nationality || null,
          work_email:
            employeeForm.work_email || null,
          mobile:
            employeeForm.mobile || null,
          department_id:
            employeeForm.department_id || null,
          position_id:
            employeeForm.position_id || null,
          hire_date:
            employeeForm.hire_date || null,
          work_location:
            employeeForm.work_location || null,
        }),
      });

      setEmployeeForm({
        employee_number: "",
        full_name_ar: "",
        full_name_en: "",
        nationality: "",
        work_email: "",
        mobile: "",
        department_id: "",
        position_id: "",
        hire_date: "",
        employment_status: "active",
        employment_type: "full_time",
        work_location: "Riyadh",
        gosi_registered: false,
      });

      showSuccess("تم إنشاء ملف الموظف بنجاح.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitContract(e) {
    e.preventDefault();

    try {
      const result = await request("/api/hr/contracts", {
        method: "POST",
        body: JSON.stringify({
          employee_id: contractForm.employee_id,
          contract_number:
            contractForm.contract_number || null,
          contract_type: contractForm.contract_type,
          start_date: contractForm.start_date,
          end_date: contractForm.end_date || null,
          auto_renew: contractForm.auto_renew,
          notice_period_days:
            contractForm.notice_period_days
              ? Number(contractForm.notice_period_days)
              : null,
          currency: "SAR",
          basic_salary:
            Number(contractForm.basic_salary || 0),
          housing_allowance:
            Number(contractForm.housing_allowance || 0),
          transport_allowance:
            Number(contractForm.transport_allowance || 0),
          other_fixed_allowances:
            Number(
              contractForm.other_fixed_allowances || 0
            ),
          employer_gosi_cost:
            Number(contractForm.employer_gosi_cost || 0),
          medical_insurance_cost_annual:
            Number(
              contractForm.medical_insurance_cost_annual || 0
            ),
          other_annual_cost:
            Number(contractForm.other_annual_cost || 0),
        }),
      });

      setContractForm({
        employee_id: "",
        contract_number: "",
        contract_type: "fixed_term",
        start_date: "",
        end_date: "",
        auto_renew: false,
        notice_period_days: "60",
        basic_salary: "",
        housing_allowance: "",
        transport_allowance: "",
        other_fixed_allowances: "",
        employer_gosi_cost: "",
        medical_insurance_cost_annual: "",
        other_annual_cost: "",
      });

      showSuccess(
        `تم إنشاء العقد. التكلفة السنوية: ${money(
          result.annual_employment_cost
        )} ريال`
      );

      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  const visiblePositions = employeeForm.department_id
    ? positions.filter(
        (p) =>
          p.department_id ===
          employeeForm.department_id
      )
    : positions;

  return (
    <main dir="rtl" className="page">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${COLORS.bg}; }
        button, input, select, textarea { font: inherit; }

        .page {
          min-height: 100vh;
          background: ${COLORS.bg};
          color: ${COLORS.text};
          padding: 28px;
        }

        .wrap {
          max-width: 1540px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .logo {
          width: 135px;
          height: auto;
        }

        .eyebrow {
          color: ${COLORS.primary};
          font-size: 11px;
          letter-spacing: 1.4px;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        .subtitle {
          color: ${COLORS.muted};
          font-size: 13px;
          margin-top: 6px;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .linkBtn, .btn {
          border-radius: 10px;
          padding: 10px 15px;
          text-decoration: none;
          cursor: pointer;
          font-weight: 700;
          border: 1px solid ${COLORS.border};
          background: ${COLORS.panel};
          color: ${COLORS.text};
        }

        .btnPrimary {
          background: ${COLORS.primarySoft};
          border-color: ${COLORS.primary};
          color: ${COLORS.primary};
        }

        .metrics {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .metric {
          min-height: 120px;
          background: ${COLORS.panel};
          border: 1px solid ${COLORS.border};
          border-radius: 17px;
          padding: 20px;
        }

        .metricTitle {
          color: ${COLORS.muted};
          font-size: 12px;
          margin-bottom: 12px;
        }

        .metricValue {
          font-size: 28px;
          font-weight: 800;
        }

        .metricSub {
          margin-top: 10px;
          color: ${COLORS.muted};
          font-size: 11px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .tab {
          border: 1px solid ${COLORS.border};
          color: ${COLORS.muted};
          background: ${COLORS.panel};
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .tabActive {
          color: ${COLORS.primary};
          border-color: ${COLORS.primary};
          background: ${COLORS.primarySoft};
        }

        .panel {
          background: ${COLORS.panel};
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 18px;
        }

        .panelTitle {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .panelSub {
          color: ${COLORS.muted};
          font-size: 12px;
          margin-bottom: 20px;
        }

        .grid2 {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .grid3 {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field label {
          font-size: 12px;
          color: ${COLORS.muted};
        }

        input, select, textarea {
          width: 100%;
          color: ${COLORS.text};
          background: ${COLORS.bg};
          border: 1px solid ${COLORS.border};
          border-radius: 9px;
          padding: 11px 12px;
          outline: none;
        }

        input:focus, select:focus, textarea:focus {
          border-color: ${COLORS.primary};
        }

        option {
          background: ${COLORS.panel};
        }

        .submitRow {
          margin-top: 16px;
          display: flex;
          justify-content: flex-start;
        }

        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        th, td {
          padding: 13px 10px;
          text-align: right;
          border-bottom: 1px solid ${COLORS.border};
          font-size: 12px;
        }

        th {
          color: ${COLORS.muted};
          font-weight: 600;
        }

        td {
          color: ${COLORS.text};
        }

        .badge {
          display: inline-block;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 10px;
          color: ${COLORS.primary};
          background: ${COLORS.primarySoft};
        }

        .empty {
          color: ${COLORS.muted};
          padding: 28px 5px;
          text-align: center;
        }

        .notice {
          background: ${COLORS.primarySoft};
          border: 1px solid rgba(24,213,183,.35);
          color: ${COLORS.primary};
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .error {
          background: rgba(255,100,100,.08);
          border: 1px solid rgba(255,100,100,.25);
          color: ${COLORS.danger};
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .sectionLabel {
          color: ${COLORS.beige};
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        @media (max-width: 900px) {
          .grid2, .grid3 {
            grid-template-columns: 1fr;
          }
          .page {
            padding: 16px;
          }
          h1 {
            font-size: 23px;
          }
        }
      `}</style>

      <div className="wrap">
        <header className="header">
          <div className="brand">
            <img
              src="/brand/enclave-logo.svg"
              alt="Enclave"
              className="logo"
            />

            <div>
              <div className="eyebrow">
                ENCLAVE AI · HR COMMAND CENTER
              </div>
              <h1>مساحة عمل الموارد البشرية</h1>
              <div className="subtitle">
                Employee Intelligence & Workforce Management
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              className="btn btnPrimary"
              onClick={loadAll}
            >
              تحديث البيانات
            </button>

                        <a
              className="linkBtn"
              href="/hr/monthly-dashboard"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Monthly HR Dashboard
            </a>

            <a
              className="linkBtn"
              href="/hr/audit-trail"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              HR Audit Trail
            </a>

<a
              className="linkBtn"
              href="/hr/payroll"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              الرواتب
            </a>

            <a
              className="linkBtn"
              href="/hr/benefits"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Benefits & Insurance
            </a>

            <a
              className="linkBtn"
              href="/hr/employee-payments"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Employee Payments & Claims
            </a>

            <a
              className="linkBtn"
              href="/hr/final-settlement"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              EOSB / Final Settlement
            </a>

            <a
              className="linkBtn"
              href="/hr/employee-relations"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Employee Relations & Disciplinary
            </a>

            <a
              className="linkBtn"
              href="/hr/government-compliance"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Government & Corporate Compliance
            </a>

            <a
              className="linkBtn"
              href="/hr/training"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Training & Development
            </a>

            <a
              className="linkBtn"
              href="/hr/talent"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Succession & Talent Management
            </a>

            <a
              className="linkBtn"
              href="/hr/workforce-planning"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Workforce Planning & Manpower
            </a>

            <a
              className="linkBtn"
              href="/hr/cost-forecast"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              HR Cost Forecast
            </a>

            <a
              className="linkBtn"
              href="/hr/policies-compliance"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              HR Policies & Compliance
            </a>

            <a
              className="linkBtn"
              href="/hr/confidential-notes"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Confidential HR Notes
            </a>

            <a
              className="linkBtn"
              href="/hr/calendar"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              HR Calendar
            </a>

            <a
              className="linkBtn"
              href="/hr/leave-attendance"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              Leave & Attendance
            </a>

            <a
              className="linkBtn"
              href="/hr/compensation"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              التعويضات والمكافآت
            </a>

            <a
              className="linkBtn"
              href="/hr/performance"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              الأداء وKPI
            </a>

            <a
              className="linkBtn"
              href="/hr/lifecycle"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              دورة حياة الموظف
            </a>

            <a
              className="linkBtn"
              href="/hr/onboarding"
              style={{
                color: COLORS.beige,
                borderColor: COLORS.beige,
              }}
            >
              تهيئة الموظفين
            </a>

            <a
              className="linkBtn"
              href="/hr/recruitment"
              style={{
                color: COLORS.primary,
                borderColor: COLORS.primary,
              }}
            >
              التوظيف والاستقطاب
            </a>

            <a className="linkBtn" href="/dashboard">
              لوحة القيادة
            </a>

            <a className="linkBtn" href="/">
              العودة للوكلاء
            </a>
          </div>
        </header>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error">{error}</div>}

        <section className="metrics">
          <Card
            title="إجمالي الموظفين"
            value={summary.total_employees ?? "—"}
            subtitle="Total Employees"
          />
          <Card
            title="الموظفون النشطون"
            value={summary.active_employees ?? "—"}
            subtitle="Active Employees"
          />
          <Card
            title="الإدارات"
            value={summary.departments ?? "—"}
            subtitle="Departments"
          />
          <Card
            title="المناصب"
            value={summary.positions ?? "—"}
            subtitle="Positions"
          />
          <Card
            title="العقود النشطة"
            value={summary.active_contracts ?? "—"}
            subtitle="Active Contracts"
          />
          <Card
            title="إجمالي التكلفة السنوية"
            value={`${money(totalAnnualCost)} ر.س`}
            subtitle={`شهري نقدي ${money(totalMonthlyCash)} ر.س`}
          />
        </section>

        <div className="tabs">
          {[
            ["employees", "الموظفون"],
            ["organization", "الهيكل والمناصب"],
            ["contracts", "العقود والتكلفة"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={
                tab === key
                  ? "tab tabActive"
                  : "tab"
              }
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <section className="panel">
            جاري تحميل بيانات الموارد البشرية...
          </section>
        )}

        {!loading && tab === "employees" && (
          <>
            <section className="panel">
              <div className="sectionLabel">
                EMPLOYEE MASTER DATA
              </div>
              <div className="panelTitle">
                إضافة موظف
              </div>
              <div className="panelSub">
                إنشاء الملف الأساسي للموظف وربطه
                بالإدارة والمنصب.
              </div>

              <form onSubmit={submitEmployee}>
                <div className="grid3">
                  <div className="field">
                    <label>الرقم الوظيفي *</label>
                    <input
                      required
                      value={employeeForm.employee_number}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          employee_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الاسم بالعربي *</label>
                    <input
                      required
                      value={employeeForm.full_name_ar}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          full_name_ar: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الاسم بالإنجليزي</label>
                    <input
                      value={employeeForm.full_name_en}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          full_name_en: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الإدارة</label>
                    <select
                      value={employeeForm.department_id}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          department_id: e.target.value,
                          position_id: "",
                        })
                      }
                    >
                      <option value="">بدون تحديد</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>المنصب</label>
                    <select
                      value={employeeForm.position_id}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          position_id: e.target.value,
                        })
                      }
                    >
                      <option value="">بدون تحديد</option>
                      {visiblePositions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>تاريخ المباشرة</label>
                    <input
                      type="date"
                      value={employeeForm.hire_date}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          hire_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الجنسية</label>
                    <input
                      value={employeeForm.nationality}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nationality: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>البريد الوظيفي</label>
                    <input
                      type="email"
                      value={employeeForm.work_email}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          work_email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>رقم الجوال</label>
                    <input
                      value={employeeForm.mobile}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          mobile: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>نوع التوظيف</label>
                    <select
                      value={employeeForm.employment_type}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          employment_type: e.target.value,
                        })
                      }
                    >
                      <option value="full_time">دوام كامل</option>
                      <option value="part_time">دوام جزئي</option>
                      <option value="contractor">متعاقد</option>
                      <option value="intern">متدرب</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>موقع العمل</label>
                    <input
                      value={employeeForm.work_location}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          work_location: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>التأمينات الاجتماعية</label>
                    <select
                      value={
                        employeeForm.gosi_registered
                          ? "yes"
                          : "no"
                      }
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          gosi_registered:
                            e.target.value === "yes",
                        })
                      }
                    >
                      <option value="no">غير مسجل</option>
                      <option value="yes">مسجل</option>
                    </select>
                  </div>
                </div>

                <div className="submitRow">
                  <button className="btn btnPrimary">
                    إضافة الموظف
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panelTitle">
                سجل الموظفين
              </div>
              <div className="panelSub">
                Master Employee Register
              </div>

              <div className="tableWrap">
                {employees.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>الرقم</th>
                        <th>الموظف</th>
                        <th>الحالة</th>
                        <th>نوع التوظيف</th>
                        <th>البريد</th>
                        <th>المباشرة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((x) => (
                        <tr key={x.id}>
                          <td>{x.employee_number}</td>
                          <td>{x.full_name_ar}</td>
                          <td>
                            <span className="badge">
                              {x.employment_status}
                            </span>
                          </td>
                          <td>{x.employment_type}</td>
                          <td>{x.work_email || "—"}</td>
                          <td>{x.hire_date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty">
                    لا يوجد موظفون حتى الآن.
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {!loading && tab === "organization" && (
          <div className="grid2">
            <section className="panel">
              <div className="sectionLabel">
                ORGANIZATION
              </div>
              <div className="panelTitle">
                الإدارات
              </div>
              <div className="panelSub">
                إنشاء وإدارة الهيكل الإداري.
              </div>

              <form onSubmit={submitDepartment}>
                <div className="field">
                  <label>رمز الإدارة *</label>
                  <input
                    required
                    value={departmentForm.code}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        code: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>اسم الإدارة بالعربي *</label>
                  <input
                    required
                    value={departmentForm.name_ar}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        name_ar: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>الاسم بالإنجليزي</label>
                  <input
                    value={departmentForm.name_en}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        name_en: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>مركز التكلفة</label>
                  <input
                    value={departmentForm.cost_center}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        cost_center: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="submitRow">
                  <button className="btn btnPrimary">
                    إنشاء الإدارة
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 24 }}>
                {departments.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        `1px solid ${COLORS.border}`,
                    }}
                  >
                    <strong>{d.name_ar}</strong>
                    <div className="subtitle">
                      {d.code}
                      {d.cost_center
                        ? ` · ${d.cost_center}`
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="sectionLabel">
                POSITION CONTROL
              </div>
              <div className="panelTitle">
                المناصب
              </div>
              <div className="panelSub">
                Position Control & Salary Range
              </div>

              <form onSubmit={submitPosition}>
                <div className="grid2">
                  <div className="field">
                    <label>رمز المنصب *</label>
                    <input
                      required
                      value={positionForm.code}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          code: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>المسمى بالعربي *</label>
                    <input
                      required
                      value={positionForm.title_ar}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          title_ar: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الإدارة</label>
                    <select
                      value={positionForm.department_id}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          department_id: e.target.value,
                        })
                      }
                    >
                      <option value="">بدون تحديد</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>الدرجة</label>
                    <input
                      value={positionForm.grade}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          grade: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>العدد المعتمد</label>
                    <input
                      type="number"
                      min="1"
                      value={positionForm.headcount_budget}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          headcount_budget: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الراتب الأدنى</label>
                    <input
                      type="number"
                      value={positionForm.min_salary}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          min_salary: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>منتصف النطاق</label>
                    <input
                      type="number"
                      value={positionForm.midpoint_salary}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          midpoint_salary: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الراتب الأعلى</label>
                    <input
                      type="number"
                      value={positionForm.max_salary}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          max_salary: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="submitRow">
                  <button className="btn btnPrimary">
                    إنشاء المنصب
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 24 }}>
                {positions.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        `1px solid ${COLORS.border}`,
                    }}
                  >
                    <strong>{p.title_ar}</strong>
                    <div className="subtitle">
                      {p.code} · HC {p.headcount_budget}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!loading && tab === "contracts" && (
          <>
            <section className="panel">
              <div className="sectionLabel">
                TOTAL EMPLOYMENT COST
              </div>
              <div className="panelTitle">
                إضافة عقد وتكلفة موظف
              </div>
              <div className="panelSub">
                حساب الراتب النقدي والتكلفة السنوية
                الإجمالية على الشركة.
              </div>

              <form onSubmit={submitContract}>
                <div className="grid3">
                  <div className="field">
                    <label>الموظف *</label>
                    <select
                      required
                      value={contractForm.employee_id}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          employee_id: e.target.value,
                        })
                      }
                    >
                      <option value="">اختر الموظف</option>
                      {employees.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.employee_number} · {x.full_name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>رقم العقد</label>
                    <input
                      value={contractForm.contract_number}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          contract_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>نوع العقد</label>
                    <select
                      value={contractForm.contract_type}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          contract_type: e.target.value,
                        })
                      }
                    >
                      <option value="fixed_term">
                        محدد المدة
                      </option>
                      <option value="indefinite">
                        غير محدد المدة
                      </option>
                    </select>
                  </div>

                  <div className="field">
                    <label>بداية العقد *</label>
                    <input
                      required
                      type="date"
                      value={contractForm.start_date}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>نهاية العقد</label>
                    <input
                      type="date"
                      value={contractForm.end_date}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>فترة الإشعار بالأيام</label>
                    <input
                      type="number"
                      value={contractForm.notice_period_days}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          notice_period_days: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>الراتب الأساسي</label>
                    <input
                      type="number"
                      value={contractForm.basic_salary}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          basic_salary: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>بدل السكن</label>
                    <input
                      type="number"
                      value={contractForm.housing_allowance}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          housing_allowance: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>بدل النقل</label>
                    <input
                      type="number"
                      value={contractForm.transport_allowance}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          transport_allowance: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>بدلات شهرية أخرى</label>
                    <input
                      type="number"
                      value={
                        contractForm.other_fixed_allowances
                      }
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          other_fixed_allowances: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>تكلفة GOSI الشهرية للشركة</label>
                    <input
                      type="number"
                      value={contractForm.employer_gosi_cost}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          employer_gosi_cost: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>التأمين الطبي السنوي</label>
                    <input
                      type="number"
                      value={
                        contractForm.medical_insurance_cost_annual
                      }
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          medical_insurance_cost_annual:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>تكاليف سنوية أخرى</label>
                    <input
                      type="number"
                      value={contractForm.other_annual_cost}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          other_annual_cost: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="submitRow">
                  <button className="btn btnPrimary">
                    إنشاء العقد وحساب التكلفة
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panelTitle">
                تكلفة الموظفين
              </div>
              <div className="panelSub">
                Total Employment Cost Register
              </div>

              <div className="tableWrap">
                {contracts.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>الموظف</th>
                        <th>الأساسي</th>
                        <th>النقدي الشهري</th>
                        <th>التكلفة السنوية</th>
                        <th>نوع العقد</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((x) => (
                        <tr key={x.id}>
                          <td>{x.employee_name}</td>
                          <td>
                            {money(x.basic_salary)} ر.س
                          </td>
                          <td>
                            {money(
                              x.monthly_cash_compensation
                            )} ر.س
                          </td>
                          <td>
                            <strong>
                              {money(
                                x.annual_employment_cost
                              )} ر.س
                            </strong>
                          </td>
                          <td>{x.contract_type}</td>
                          <td>
                            <span className="badge">
                              {x.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty">
                    لا توجد عقود حتى الآن.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
