"use client";

import { useEffect, useState } from "react";

const C = {
  bg: "#06131e",
  panel: "#0b1d2d",
  primary: "#18d5b7",
  soft: "rgba(24,213,183,.12)",
  beige: "#d9e7e6",
  text: "#fff",
  muted: "#71c8c1",
  border: "rgba(255,255,255,.09)",
  danger: "#ff9a9a",
};

function money(v) {
  return new Intl.NumberFormat("ar-SA").format(
    Number(v || 0)
  );
}

export default function HiringWorkspace() {
  const [candidates, setCandidates] = useState([]);
  const [offers, setOffers] = useState([]);
  const [approvals, setApprovals] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const [offerForm, setOfferForm] = useState({
    candidate_id: "",
    proposed_start_date: "",
    basic_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    other_allowances: "",
  });

  const [selectedOffer, setSelectedOffer] = useState(null);

  const [hireForm, setHireForm] = useState({
    employee_number: "",
    work_email: "",
    contract_number: "",
    contract_type: "",
    end_date: "",
    auto_renew: false,
    notice_period_days: "60",
    employer_gosi_cost: "",
    medical_insurance_cost_annual: "",
    other_annual_cost: "",
  });

  async function api(path, options = {}) {
    const r = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const d = await r.json();

    if (!r.ok) {
      throw new Error(
        d.detail || "تعذر تنفيذ العملية"
      );
    }

    return d;
  }

  async function load() {
    const [c, o] = await Promise.all([
      api("/api/hr/recruitment/candidates"),
      api("/api/hr/recruitment/offers"),
    ]);

    setCandidates(c);
    setOffers(o);

    const statuses = {};

    await Promise.all(
      o.map(async (offer) => {
        try {
          statuses[offer.id] = await api(
            `/api/hr/recruitment/offers/${offer.id}/approval-status`
          );
        } catch {
          statuses[offer.id] = {
            approval_status: "unknown",
          };
        }
      })
    );

    setApprovals(statuses);
  }

  useEffect(() => {
    load();
  }, []);

  async function createOffer(e) {
    e.preventDefault();

    try {
      setBusy("offer");
      setError("");

      await api("/api/hr/recruitment/offers", {
        method: "POST",
        body: JSON.stringify({
          candidate_id: offerForm.candidate_id,
          proposed_start_date:
            offerForm.proposed_start_date || null,
          basic_salary:
            Number(offerForm.basic_salary || 0),
          housing_allowance:
            Number(
              offerForm.housing_allowance || 0
            ),
          transport_allowance:
            Number(
              offerForm.transport_allowance || 0
            ),
          other_allowances:
            Number(
              offerForm.other_allowances || 0
            ),
        }),
      });

      setOfferForm({
        candidate_id: "",
        proposed_start_date: "",
        basic_salary: "",
        housing_allowance: "",
        transport_allowance: "",
        other_allowances: "",
      });

      setNotice("تم إنشاء مسودة العرض.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function requestApproval(id) {
    try {
      setBusy(id);
      setError("");

      await api(
        `/api/hr/recruitment/offers/${id}/request-approval`,
        { method: "POST" }
      );

      setNotice(
        "تم إرسال العرض إلى مركز الموافقات. لم يتم إرسال أي شيء للمرشح."
      );

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function confirmHire(e) {
    e.preventDefault();

    if (!selectedOffer) return;

    try {
      setBusy("hire");
      setError("");

      const result = await api(
        `/api/hr/recruitment/offers/${selectedOffer.id}/confirm-hire`,
        {
          method: "POST",
          body: JSON.stringify({
            employee_number:
              hireForm.employee_number || null,
            work_email:
              hireForm.work_email || null,
            contract_number:
              hireForm.contract_number || null,
            contract_type:
              hireForm.contract_type,
            end_date:
              hireForm.end_date || null,
            auto_renew:
              hireForm.auto_renew,
            notice_period_days:
              hireForm.notice_period_days
                ? Number(
                    hireForm.notice_period_days
                  )
                : null,
            employer_gosi_cost:
              Number(
                hireForm.employer_gosi_cost || 0
              ),
            medical_insurance_cost_annual:
              Number(
                hireForm.medical_insurance_cost_annual
                || 0
              ),
            other_annual_cost:
              Number(
                hireForm.other_annual_cost || 0
              ),
          }),
        }
      );

      setNotice(
        `تم التعيين وإنشاء ملف الموظف والعقد. الرقم الوظيفي: ${result.employee.employee_number}`
      );

      setSelectedOffer(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  function approvalLabel(status) {
    return {
      not_requested: "لم يطلب",
      pending: "بانتظار الموافقة",
      approved: "معتمد",
      rejected: "مرفوض",
    }[status] || status;
  }

  return (
    <main dir="rtl">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:${C.bg}}
        main{
          min-height:100vh;
          background:${C.bg};
          color:${C.text};
          padding:28px
        }
        .wrap{max-width:1500px;margin:auto}
        .head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:18px;
          margin-bottom:24px
        }
        .brand{
          display:flex;
          align-items:center;
          gap:18px
        }
        .brand img{width:135px}
        .eye{
          color:${C.primary};
          font-size:11px;
          letter-spacing:1.3px
        }
        h1{margin:5px 0;font-size:28px}
        h2{margin-top:0}
        .muted{
          color:${C.muted};
          font-size:12px;
          line-height:1.8
        }
        a,button{
          padding:10px 15px;
          border-radius:10px;
          border:1px solid ${C.border};
          background:${C.panel};
          color:${C.text};
          text-decoration:none;
          cursor:pointer;
          font-weight:700
        }
        .primary{
          color:${C.primary};
          border-color:${C.primary};
          background:${C.soft}
        }
        .panel{
          background:${C.panel};
          border:1px solid ${C.border};
          border-radius:18px;
          padding:22px;
          margin-bottom:18px
        }
        .grid{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:12px
        }
        label{
          display:block;
          color:${C.muted};
          font-size:11px;
          margin:10px 0 6px
        }
        input,select{
          width:100%;
          background:${C.bg};
          color:${C.text};
          border:1px solid ${C.border};
          padding:11px;
          border-radius:9px
        }
        table{
          width:100%;
          border-collapse:collapse
        }
        th,td{
          text-align:right;
          padding:12px 8px;
          border-bottom:1px solid ${C.border};
          font-size:12px
        }
        th{color:${C.muted}}
        .badge{
          display:inline-block;
          color:${C.beige};
          background:rgba(217,201,170,.1);
          padding:5px 9px;
          border-radius:999px
        }
        .notice,.warning,.error{
          padding:12px 15px;
          border-radius:10px;
          margin-bottom:15px;
          line-height:1.7;
          font-size:12px
        }
        .notice{
          color:${C.primary};
          border:1px solid rgba(24,213,183,.3);
          background:${C.soft}
        }
        .warning{
          color:${C.beige};
          border:1px solid rgba(217,201,170,.25)
        }
        .error{
          color:${C.danger};
          border:1px solid rgba(255,100,100,.25)
        }
        @media(max-width:900px){
          main{padding:15px}
          .grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="wrap">
        <header className="head">
          <div className="brand">
            <img
              src="/brand/enclave-logo.svg"
              alt="Enclave"
            />
            <div>
              <div className="eye">
                ENCLAVE AI · OFFER & HIRING
              </div>
              <h1>العروض والتعيين</h1>
              <div className="muted">
                Offer Approval · Human Decision · Employee Creation
              </div>
            </div>
          </div>

          <div>
            <a href="/hr/recruitment">
              التوظيف
            </a>{" "}
            <a href="/dashboard" className="primary">
              مركز الموافقات
            </a>
          </div>
        </header>

        <div className="warning">
          اعتماد العرض لا يرسل أي بريد أو رسالة للمرشح.
          تأكيد التعيين يجب استخدامه فقط بعد موافقة الإدارة
          وقبول المرشح للعرض فعليًا.
        </div>

        {notice && (
          <div className="notice">{notice}</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        <section className="panel">
          <h2>إنشاء مسودة عرض وظيفي</h2>

          <form onSubmit={createOffer}>
            <div className="grid">
              <div>
                <label>المرشح *</label>
                <select
                  required
                  value={offerForm.candidate_id}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      candidate_id:e.target.value
                    })
                  }
                >
                  <option value="">
                    اختر المرشح
                  </option>

                  {candidates
                    .filter(c => c.stage !== "hired")
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label>تاريخ المباشرة المقترح</label>
                <input
                  type="date"
                  value={offerForm.proposed_start_date}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      proposed_start_date:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>الراتب الأساسي</label>
                <input
                  type="number"
                  value={offerForm.basic_salary}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      basic_salary:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>بدل السكن</label>
                <input
                  type="number"
                  value={offerForm.housing_allowance}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      housing_allowance:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>بدل النقل</label>
                <input
                  type="number"
                  value={offerForm.transport_allowance}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      transport_allowance:e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>بدلات أخرى</label>
                <input
                  type="number"
                  value={offerForm.other_allowances}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      other_allowances:e.target.value
                    })
                  }
                />
              </div>
            </div>

            <button
              className="primary"
              style={{marginTop:15}}
              disabled={busy === "offer"}
            >
              إنشاء مسودة العرض
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>العروض الوظيفية</h2>

          {offers.length ? (
            <table>
              <thead>
                <tr>
                  <th>المرشح</th>
                  <th>النقدي الشهري</th>
                  <th>حالة العرض</th>
                  <th>الموافقة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((offer) => {
                  const approval =
                    approvals[offer.id]
                    ?.approval_status
                    || "not_requested";

                  return (
                    <tr key={offer.id}>
                      <td>{offer.candidate_name}</td>

                      <td>
                        {money(
                          offer.monthly_cash_compensation
                        )} ر.س
                      </td>

                      <td>{offer.status}</td>

                      <td>
                        <span className="badge">
                          {approvalLabel(approval)}
                        </span>
                      </td>

                      <td>
                        {approval === "not_requested" ||
                        approval === "rejected" ? (
                          <button
                            onClick={() =>
                              requestApproval(offer.id)
                            }
                            disabled={busy === offer.id}
                          >
                            طلب الموافقة
                          </button>
                        ) : null}

                        {approval === "pending" ? (
                          <span className="muted">
                            راجع مركز الموافقات
                          </span>
                        ) : null}

                        {approval === "approved" &&
                        offer.status !== "hired" ? (
                          <button
                            className="primary"
                            onClick={() =>
                              setSelectedOffer(offer)
                            }
                          >
                            تأكيد قبول العرض والتعيين
                          </button>
                        ) : null}

                        {offer.status === "hired" ? (
                          <span className="badge">
                            تم التعيين
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="muted">
              لا توجد عروض حتى الآن.
            </div>
          )}
        </section>

        {selectedOffer && (
          <section className="panel">
            <h2>
              تأكيد التعيين — {selectedOffer.candidate_name}
            </h2>

            <div className="warning">
              هذه الخطوة ستنشئ موظفًا وعقدًا نشطًا داخل
              Enclave HR. استخدمها فقط بعد قبول المرشح.
            </div>

            <form onSubmit={confirmHire}>
              <div className="grid">
                <div>
                  <label>
                    الرقم الوظيفي
                  </label>
                  <input
                    placeholder="يُولد تلقائيًا إذا ترك فارغًا"
                    value={hireForm.employee_number}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        employee_number:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>البريد الوظيفي</label>
                  <input
                    type="email"
                    value={hireForm.work_email}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        work_email:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>نوع العقد *</label>
                  <select
                    required
                    value={hireForm.contract_type}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        contract_type:e.target.value,
                        end_date:
                          e.target.value === "indefinite"
                            ? ""
                            : hireForm.end_date
                      })
                    }
                  >
                    <option value="">
                      حدد نوع العقد
                    </option>
                    <option value="fixed_term">
                      محدد المدة
                    </option>
                    <option value="indefinite">
                      غير محدد المدة
                    </option>
                  </select>
                </div>

                {hireForm.contract_type === "fixed_term" && (
                  <div>
                    <label>نهاية العقد *</label>
                    <input
                      required
                      type="date"
                      value={hireForm.end_date}
                      onChange={(e) =>
                        setHireForm({
                          ...hireForm,
                          end_date:e.target.value
                        })
                      }
                    />
                  </div>
                )}

                <div>
                  <label>فترة الإشعار بالأيام</label>
                  <input
                    type="number"
                    value={hireForm.notice_period_days}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        notice_period_days:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>
                    تكلفة GOSI الشهرية للشركة
                  </label>
                  <input
                    type="number"
                    value={hireForm.employer_gosi_cost}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        employer_gosi_cost:e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>التأمين الطبي السنوي</label>
                  <input
                    type="number"
                    value={
                      hireForm.medical_insurance_cost_annual
                    }
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        medical_insurance_cost_annual:
                          e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>تكاليف سنوية أخرى</label>
                  <input
                    type="number"
                    value={hireForm.other_annual_cost}
                    onChange={(e) =>
                      setHireForm({
                        ...hireForm,
                        other_annual_cost:e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <button
                className="primary"
                style={{marginTop:15}}
                disabled={busy === "hire"}
              >
                تأكيد التعيين وإنشاء الموظف والعقد
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
