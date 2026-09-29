"use client";

import { useEffect, useMemo, useState } from "react";

const API = "/api/procurement";
const FIN = "/api/finance";

const LABELS = {
  draft: "مسودة",
  pending: "معلق",
  pending_approval: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
  converted_to_po: "تحول لأمر شراء",
  open: "مفتوح",
  closed: "مغلق",
  awarded: "تمت الترسية",
  submitted: "مقدم",
  selected: "مختار",
  not_selected: "غير مختار",
  issued: "صادر",
  partially_received: "استلام جزئي",
  received: "مستلم بالكامل",
  confirmed: "مؤكد",
  qualified: "مؤهل",
  conditional: "مؤهل بشروط",
  expired: "منتهي",
  not_reviewed: "غير مراجع",
};

function money(value, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: currency || "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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

  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await response.json()
    : { detail: await response.text() };

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data || {});
    throw new Error(detail || `HTTP ${response.status}`);
  }

  return data;
}

function Badge({ value }) {
  return (
    <span className={`p9-badge p9-${value || "draft"}`}>
      {LABELS[value] || value || "—"}
    </span>
  );
}

function Card({ label, value, hint }) {
  return (
    <div className="p9-card">
      <div className="p9-muted">{label}</div>
      <div className="p9-value">{value}</div>
      {hint ? <div className="p9-muted">{hint}</div> : null}
    </div>
  );
}

const newPrLine = () => ({
  description: "",
  quantity: "1",
  estimated_unit_price: "",
  vat_rate: "0.15",
  account_id: "",
  cost_center: "",
});

export default function ProcurementWorkspacePage() {
  const [tab, setTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [summary9, setSummary9] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [prs, setPrs] = useState([]);
  const [pos, setPos] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [prForm, setPrForm] = useState({
    requested_by: "user",
    department_code: "",
    needed_by: "",
    purpose: "",
    preferred_vendor_id: "",
    currency: "SAR",
    lines: [newPrLine()],
  });

  const [rfqForm, setRfqForm] = useState({
    purchase_request_id: "",
    title: "",
    response_due_date: "",
    vendor_ids: [],
  });

  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    vendor_id: "",
    vendor_quote_reference: "",
    valid_until: "",
    delivery_days: "",
    payment_terms_days: "",
    warranty_terms: "",
    notes: "",
    prices: {},
    vat_rates: {},
  });

  const [poForm, setPoForm] = useState({
    purchase_request_id: "",
    vendor_id: "",
    expected_delivery_date: "",
  });

  const [receiptForm, setReceiptForm] = useState({
    purchase_order_id: "",
    receipt_type: "service",
    received_by: "user",
    quantities: {},
  });

  const [billForm, setBillForm] = useState({
    receipt_id: "",
    bill_number: "",
    bill_date: new Date().toISOString().slice(0, 10),
    payable_account_id: "",
    input_vat_account_id: "",
  });

  const [qualificationForm, setQualificationForm] = useState({
    vendor_id: "",
    status: "qualified",
    risk_level: "medium",
    cr_verified: false,
    vat_verified: false,
    iban_verified: false,
    cybersecurity_review_required: false,
    cybersecurity_review_status: "not_required",
    valid_until: "",
    notes: "",
  });

  const [quoteFile, setQuoteFile] = useState(null);
  const [quoteAttachmentTarget, setQuoteAttachmentTarget] = useState("");

  const postingAccounts = useMemo(
    () => accounts.filter((a) => a.is_active && a.allow_posting),
    [accounts]
  );

  const purchaseAccounts = useMemo(
    () =>
      postingAccounts.filter((a) =>
        ["expense", "asset"].includes(a.account_type)
      ),
    [postingAccounts]
  );

  const payableAccounts = useMemo(
    () =>
      postingAccounts.filter((a) => a.account_type === "liability"),
    [postingAccounts]
  );

  const assetAccounts = useMemo(
    () =>
      postingAccounts.filter((a) => a.account_type === "asset"),
    [postingAccounts]
  );

  const selectedRfq = useMemo(
    () => rfqs.find((x) => x.id === selectedRfqId) || null,
    [rfqs, selectedRfqId]
  );

  const selectedRfqPr = useMemo(
    () =>
      selectedRfq
        ? prs.find((x) => x.id === selectedRfq.purchase_request_id) || null
        : null,
    [prs, selectedRfq]
  );

  const selectedReceiptPo = useMemo(
    () =>
      pos.find((x) => x.id === receiptForm.purchase_order_id) || null,
    [pos, receiptForm.purchase_order_id]
  );

  async function refreshAll() {
    const [s, s9, v, a, pr, po, rc, rq, ql, at] = await Promise.all([
      api(`${API}/summary`),
      api(`${API}/batch9/summary`),
      api(`${API}/vendors`),
      api(`${FIN}/accounts`),
      api(`${API}/purchase-requests`),
      api(`${API}/purchase-orders`),
      api(`${API}/receipts`),
      api(`${API}/rfqs`),
      api(`${API}/vendor-qualifications`),
      api("/api/hr/attachments?module=procurement&status=active"),
    ]);

    setSummary(s);
    setSummary9(s9);
    setVendors(v);
    setAccounts(a);
    setPrs(pr);
    setPos(po);
    setReceipts(rc);
    setRfqs(rq);
    setQualifications(ql);
    setAttachments(at);

    if (selectedRfqId) {
      await loadComparison(selectedRfqId, false);
    }
  }

  useEffect(() => {
    refreshAll().catch((e) => setError(e.message));
  }, []);

  async function loadComparison(rfqId, setSelected = true) {
    if (!rfqId) {
      setComparison(null);
      return;
    }

    const data = await api(`${API}/rfqs/${rfqId}/comparison`);
    setComparison(data);

    if (setSelected) {
      setSelectedRfqId(rfqId);
      setQuoteForm({
        vendor_id: "",
        vendor_quote_reference: "",
        valid_until: "",
        delivery_days: "",
        payment_terms_days: "",
        warranty_terms: "",
        notes: "",
        prices: {},
        vat_rates: {},
      });
    }
  }

  async function act(key, fn, success) {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await fn();
      await refreshAll();
      setMessage(success);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  function updatePrLine(index, field, value) {
    setPrForm((current) => {
      const lines = [...current.lines];
      lines[index] = { ...lines[index], [field]: value };
      return { ...current, lines };
    });
  }

  async function createPR(event) {
    event.preventDefault();

    await act(
      "create-pr",
      async () => {
        await api(`${API}/purchase-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requested_by: prForm.requested_by.trim(),
            department_code: prForm.department_code.trim() || null,
            needed_by: prForm.needed_by || null,
            purpose: prForm.purpose.trim(),
            preferred_vendor_id: prForm.preferred_vendor_id || null,
            currency: prForm.currency || "SAR",
            lines: prForm.lines.map((line) => ({
              description: line.description.trim(),
              quantity: Number(line.quantity || 0),
              estimated_unit_price: Number(
                line.estimated_unit_price || 0
              ),
              vat_rate: Number(line.vat_rate || 0),
              account_id: line.account_id || null,
              cost_center: line.cost_center.trim() || null,
            })),
          }),
        });

        setPrForm({
          requested_by: "user",
          department_code: "",
          needed_by: "",
          purpose: "",
          preferred_vendor_id: "",
          currency: "SAR",
          lines: [newPrLine()],
        });
      },
      "تم إنشاء طلب الشراء كمسودة."
    );
  }

  async function requestApproval(kind, id) {
    const path =
      kind === "pr"
        ? `${API}/purchase-requests/${id}/request-approval`
        : `${API}/purchase-orders/${id}/request-approval`;

    await act(
      `${kind}-approval-${id}`,
      () =>
        api(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requested_by: "user" }),
        }),
      kind === "pr"
        ? "تم إرسال طلب الشراء للاعتماد."
        : "تم إرسال أمر الشراء للاعتماد الحرج."
    );
  }

  async function decideApproval(approvalId, decision) {
    await act(
      `${decision}-${approvalId}`,
      () =>
        api(`/api/approvals/${approvalId}/${decision}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason:
              decision === "approve"
                ? "Approved from Procurement Workspace"
                : "Rejected from Procurement Workspace",
          }),
        }),
      decision === "approve" ? "تم الاعتماد." : "تم الرفض."
    );
  }

  async function createRFQ(event) {
    event.preventDefault();

    await act(
      "create-rfq",
      async () => {
        const data = await api(`${API}/rfqs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchase_request_id: rfqForm.purchase_request_id,
            title: rfqForm.title.trim(),
            response_due_date: rfqForm.response_due_date || null,
            vendor_ids: rfqForm.vendor_ids,
            created_by: "user",
          }),
        });

        setSelectedRfqId(data.id);
        setRfqForm({
          purchase_request_id: "",
          title: "",
          response_due_date: "",
          vendor_ids: [],
        });
      },
      "تم إنشاء RFQ كمسودة. لم يتم إرسال أي تواصل خارجي تلقائي."
    );
  }

  function toggleRfqVendor(vendorId) {
    setRfqForm((current) => ({
      ...current,
      vendor_ids: current.vendor_ids.includes(vendorId)
        ? current.vendor_ids.filter((x) => x !== vendorId)
        : [...current.vendor_ids, vendorId],
    }));
  }

  async function openRFQ(id) {
    await act(
      `open-rfq-${id}`,
      () => api(`${API}/rfqs/${id}/open`, { method: "POST" }),
      "تم فتح RFQ داخليًا للتتبع. لا يوجد إرسال تلقائي للموردين."
    );
  }

  async function closeRFQ(id) {
    await act(
      `close-rfq-${id}`,
      () => api(`${API}/rfqs/${id}/close`, { method: "POST" }),
      "تم إغلاق RFQ لاستقبال العروض."
    );
  }

  function selectRFQ(id) {
    loadComparison(id).catch((e) => setError(e.message));
  }

  async function createQuotation(event) {
    event.preventDefault();

    if (!selectedRfq || !selectedRfqPr) return;

    await act(
      "create-quote",
      async () => {
        await api(`${API}/rfqs/${selectedRfq.id}/quotations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: quoteForm.vendor_id,
            vendor_quote_reference:
              quoteForm.vendor_quote_reference.trim() || null,
            valid_until: quoteForm.valid_until || null,
            delivery_days:
              quoteForm.delivery_days === ""
                ? null
                : Number(quoteForm.delivery_days),
            payment_terms_days:
              quoteForm.payment_terms_days === ""
                ? null
                : Number(quoteForm.payment_terms_days),
            warranty_terms: quoteForm.warranty_terms.trim() || null,
            notes: quoteForm.notes.trim() || null,
            lines: (selectedRfqPr.lines || []).map((line) => ({
              purchase_request_line_id: line.id,
              quantity: Number(line.quantity),
              unit_price: Number(quoteForm.prices[line.id] || 0),
              vat_rate: Number(
                quoteForm.vat_rates[line.id] ??
                  line.vat_rate ??
                  0
              ),
              description: line.description,
            })),
          }),
        });

        setQuoteForm({
          vendor_id: "",
          vendor_quote_reference: "",
          valid_until: "",
          delivery_days: "",
          payment_terms_days: "",
          warranty_terms: "",
          notes: "",
          prices: {},
          vat_rates: {},
        });

        await loadComparison(selectedRfq.id, false);
      },
      "تم تسجيل عرض المورد."
    );
  }

  async function requestAward(quotationId) {
    if (!selectedRfq) return;

    await act(
      `award-${quotationId}`,
      () =>
        api(
          `${API}/rfqs/${selectedRfq.id}/award/request-approval`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selected_quotation_id: quotationId,
              requested_by: "user",
              rationale:
                "Supplier selected through Procurement comparison.",
            }),
          }
        ),
      "تم إرسال قرار الترسية للاعتماد."
    );
  }

  async function executeAward() {
    if (!selectedRfq) return;

    await act(
      `execute-award-${selectedRfq.id}`,
      () =>
        api(`${API}/rfqs/${selectedRfq.id}/award/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decided_by: "user" }),
        }),
      "تم تنفيذ قرار الترسية فقط. لم يتم إنشاء أو إصدار PO تلقائيًا."
    );
  }

  async function createPOFromAward() {
    if (!selectedRfq) return;

    await act(
      `award-po-${selectedRfq.id}`,
      () =>
        api(
          `${API}/rfqs/${selectedRfq.id}/create-purchase-order`,
          { method: "POST" }
        ),
      "تم إنشاء PO كمسودة من العرض الفائز. ما زال الاعتماد الحرج والإصدار مطلوبين."
    );
  }

  async function createDirectPO(event) {
    event.preventDefault();

    await act(
      "create-po",
      async () => {
        await api(
          `${API}/purchase-requests/${poForm.purchase_request_id}/purchase-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vendor_id: poForm.vendor_id,
              expected_delivery_date:
                poForm.expected_delivery_date || null,
            }),
          }
        );

        setPoForm({
          purchase_request_id: "",
          vendor_id: "",
          expected_delivery_date: "",
        });
      },
      "تم إنشاء PO مباشر كمسودة."
    );
  }

  async function issuePO(id) {
    await act(
      `issue-po-${id}`,
      () =>
        api(`${API}/purchase-orders/${id}/issue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issued_by: "user" }),
        }),
      "تم إصدار PO داخل النظام. لا يوجد إرسال خارجي تلقائي."
    );
  }

  function chooseReceiptPO(poId) {
    const po = pos.find((x) => x.id === poId);
    const quantities = {};

    for (const line of po?.lines || []) {
      if (Number(line.remaining_quantity || 0) > 0) {
        quantities[line.id] = String(line.remaining_quantity);
      }
    }

    setReceiptForm({
      ...receiptForm,
      purchase_order_id: poId,
      quantities,
    });
  }

  async function createReceipt(event) {
    event.preventDefault();

    const lines = (selectedReceiptPo?.lines || [])
      .map((line) => ({
        purchase_order_line_id: line.id,
        quantity_received: Number(
          receiptForm.quantities[line.id] || 0
        ),
      }))
      .filter((line) => line.quantity_received > 0);

    await act(
      "create-receipt",
      async () => {
        await api(
          `${API}/purchase-orders/${receiptForm.purchase_order_id}/receipts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receipt_type: receiptForm.receipt_type,
              received_by: receiptForm.received_by.trim(),
              lines,
            }),
          }
        );

        setReceiptForm({
          purchase_order_id: "",
          receipt_type: "service",
          received_by: "user",
          quantities: {},
        });
      },
      "تم تسجيل الاستلام كمسودة."
    );
  }

  async function confirmReceipt(id) {
    await act(
      `confirm-${id}`,
      () => api(`${API}/receipts/${id}/confirm`, { method: "POST" }),
      "تم تأكيد الاستلام."
    );
  }

  async function createBill(event) {
    event.preventDefault();

    await act(
      "create-bill",
      async () => {
        await api(
          `${API}/receipts/${billForm.receipt_id}/create-finance-bill`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bill_number: billForm.bill_number.trim(),
              bill_date: billForm.bill_date,
              payable_account_id: billForm.payable_account_id,
              input_vat_account_id:
                billForm.input_vat_account_id || null,
              created_by: "procurement",
            }),
          }
        );

        setBillForm({
          receipt_id: "",
          bill_number: "",
          bill_date: new Date().toISOString().slice(0, 10),
          payable_account_id: "",
          input_vat_account_id: "",
        });
      },
      "تم إنشاء Finance AP Bill كمسودة فقط."
    );
  }

  async function saveQualification(event) {
    event.preventDefault();

    await act(
      "qualification",
      () =>
        api(
          `${API}/vendors/${qualificationForm.vendor_id}/qualification`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: qualificationForm.status,
              risk_level: qualificationForm.risk_level,
              cr_verified: qualificationForm.cr_verified,
              vat_verified: qualificationForm.vat_verified,
              iban_verified: qualificationForm.iban_verified,
              cybersecurity_review_required:
                qualificationForm.cybersecurity_review_required,
              cybersecurity_review_status:
                qualificationForm.cybersecurity_review_required
                  ? qualificationForm.cybersecurity_review_status
                  : "not_required",
              valid_until: qualificationForm.valid_until || null,
              reviewed_by: "user",
              notes: qualificationForm.notes.trim() || null,
            }),
          }
        ),
      "تم تحديث تأهيل المورد."
    );
  }

  async function uploadQuoteAttachment(event) {
    event.preventDefault();

    if (!quoteFile || !quoteAttachmentTarget) {
      setError("اختر العرض والملف أولًا.");
      return;
    }

    setBusy("quote-file");
    setError("");
    setMessage("");

    try {
      const form = new FormData();
      form.append("module", "procurement");
      form.append("entity_type", "quotation");
      form.append("entity_id", quoteAttachmentTarget);
      form.append("document_type", "supplier_quotation");
      form.append("uploaded_by", "user");
      form.append("confidentiality_level", "confidential");
      form.append("title", quoteFile.name);
      form.append("description", "Supplier quotation attachment");
      form.append("file", quoteFile);

      await api("/api/hr/attachments/upload", {
        method: "POST",
        body: form,
      });

      setQuoteFile(null);
      setQuoteAttachmentTarget("");
      await refreshAll();
      setMessage("تم رفع ملف عرض المورد وحفظه في التخزين المشترك.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  const approvedPRs = prs.filter(
    (x) => x.approval_status === "approved"
  );

  const directPoEligible = approvedPRs.filter(
    (pr) =>
      !pos.some((po) => po.purchase_request_id === pr.id)
  );

  const receivablePOs = pos.filter((x) =>
    ["issued", "partially_received"].includes(x.status)
  );

  const billableReceipts = receipts.filter(
    (x) => x.status === "confirmed" && !x.finance_bill_id
  );

  const selectedRfqQuotedVendorIds = new Set(
    comparison?.rows?.map((x) => x.vendor_id) || []
  );

  const selectedRfqAvailableVendors = (
    selectedRfq?.vendors || []
  ).filter(
    (item) =>
      !selectedRfqQuotedVendorIds.has(item.vendor_id)
  );

  const award = selectedRfq?.award || null;

  const allQuotes = comparison?.rows || [];

  const tabs = [
    ["dashboard", "الملخص"],
    ["requests", "طلبات الشراء"],
    ["sourcing", "RFQ والعروض"],
    ["orders", "أوامر الشراء"],
    ["receipts", "الاستلام وAP"],
    ["vendors", "الموردون والتأهيل"],
  ];

  return (
    <main className="p9-page" dir="rtl">
      <style>{`
        :root { color-scheme: dark; }
        body { margin: 0; background: #06131e; }
        .p9-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(24,213,183,.09), transparent 32%),
            #06131e;
          color: #f7fafc;
          padding: 22px;
          font-family: Arial, sans-serif;
        }
        .p9-shell { max-width: 1500px; margin: 0 auto; }
        .p9-hero, .p9-panel, .p9-card {
          border: 1px solid rgba(255,255,255,.09);
          background: #0b1d2d;
          border-radius: 17px;
        }
        .p9-hero {
          padding: 22px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }
        .p9-hero h1 { margin: 5px 0 8px; font-size: 27px; }
        .p9-hero p {
          color: #71c8c1;
          max-width: 900px;
          line-height: 1.75;
          margin: 0;
        }
        .p9-eyebrow {
          color: #18d5b7;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .08em;
        }
        .p9-actions, .p9-row-actions, .p9-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .p9-btn, .p9-link, .p9-tab {
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 9px;
          background: #142b3d;
          color: #f7fafc;
          padding: 9px 11px;
          text-decoration: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 11px;
        }
        .p9-primary {
          background: #18d5b7;
          color: #042015;
          border-color: #18d5b7;
        }
        .p9-danger {
          color: #ff9da5;
          border-color: rgba(255,107,107,.35);
          background: #2a1114;
        }
        .p9-btn:disabled { opacity: .45; cursor: not-allowed; }
        .p9-notice {
          padding: 11px 13px;
          border-radius: 11px;
          margin: 9px 0;
          border: 1px solid rgba(255,255,255,.09);
          background: #142b3d;
          font-size: 11px;
        }
        .p9-safety { color: #f5d993; border-color: rgba(245,201,107,.3); }
        .p9-error { color: #ff9da5; border-color: rgba(255,107,107,.35); }
        .p9-success { color: #8ff2c4; border-color: rgba(24,213,183,.3); }
        .p9-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 9px;
          margin: 14px 0;
        }
        .p9-card { padding: 14px; }
        .p9-muted { color: #71c8c1; font-size: 10px; }
        .p9-value {
          color: #18d5b7;
          font-size: 25px;
          font-weight: 850;
          margin: 6px 0 3px;
        }
        .p9-tabs { margin: 15px 0; }
        .p9-tab { color: #71c8c1; }
        .p9-tab-active {
          background: #18d5b7;
          color: #042015;
          border-color: #18d5b7;
        }
        .p9-panel { margin-bottom: 13px; overflow: hidden; }
        .p9-panel-head {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .p9-panel-head h2 { margin: 0; font-size: 15px; }
        .p9-panel-body { padding: 15px; }
        .p9-form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 9px;
        }
        .p9-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }
        .p9-field label {
          display: block;
          color: #71c8c1;
          font-size: 10px;
          margin-bottom: 4px;
        }
        .p9-input {
          width: 100%;
          box-sizing: border-box;
          background: #142b3d;
          color: #f7fafc;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 8px;
          padding: 9px;
          outline: none;
        }
        textarea.p9-input { min-height: 72px; resize: vertical; }
        .p9-line {
          display: grid;
          grid-template-columns: 2fr .7fr .9fr .7fr 1.5fr 1fr auto;
          gap: 7px;
          align-items: end;
          margin-top: 8px;
        }
        .p9-table-wrap { overflow-x: auto; }
        .p9-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }
        .p9-table th, .p9-table td {
          padding: 9px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          text-align: right;
          font-size: 10px;
          vertical-align: top;
        }
        .p9-table th { color: #71c8c1; }
        .p9-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 4px 7px;
          background: #15222b;
          color: #d2dbe0;
          font-size: 9px;
          white-space: nowrap;
        }
        .p9-approved, .p9-qualified, .p9-confirmed, .p9-received,
        .p9-selected, .p9-awarded {
          background: #0e2a20;
          color: #75efb7;
        }
        .p9-pending, .p9-pending_approval, .p9-conditional,
        .p9-partially_received {
          background: #302711;
          color: #f7d67a;
        }
        .p9-rejected, .p9-expired {
          background: #301419;
          color: #ff8d98;
        }
        .p9-open, .p9-issued, .p9-submitted, .p9-converted_to_po {
          background: #11283b;
          color: #84c6ff;
        }
        .p9-mini { font-size: 9px; color: #71c8c1; margin-top: 3px; }
        .p9-checks {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 7px;
        }
        .p9-check {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 8px;
          padding: 8px;
          background: #142b3d;
          font-size: 10px;
        }
        @media (max-width: 1100px) {
          .p9-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .p9-form-grid, .p9-two { grid-template-columns: 1fr 1fr; }
          .p9-line { grid-template-columns: repeat(3, minmax(0,1fr)); }
        }
        @media (max-width: 650px) {
          .p9-page { padding: 11px; }
          .p9-hero { flex-direction: column; }
          .p9-grid, .p9-form-grid, .p9-two, .p9-checks {
            grid-template-columns: 1fr;
          }
          .p9-line { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="p9-shell">
        <section className="p9-hero">
          <div>
            <div className="p9-eyebrow">
              PROCUREMENT · SOURCING · PURCHASE-TO-PAY
            </div>
            <h1>Procurement Workspace · إدارة المشتريات</h1>
            <p>
              دورة تشغيلية كاملة من طلب الشراء إلى RFQ وعروض الموردين والمقارنة
              والترسية المعتمدة ثم PO والاستلام وربط AP. المورد Master واحد في
              FinanceVendor، ولا يوجد أي دفع أو ترحيل محاسبي أو تواصل خارجي تلقائي.
            </p>
          </div>
          <div className="p9-actions">
            <button
              className="p9-btn"
              onClick={() =>
                refreshAll().catch((e) => setError(e.message))
              }
            >
              تحديث
            </button>
            <a className="p9-link" href="/finance/ap-ar">
              Finance AP / AR
            </a>
            <a className="p9-link" href="/finance">
              Finance
            </a>
            <a className="p9-link" href="/">
              الرئيسية
            </a>
          </div>
        </section>

        <div className="p9-notice p9-safety">
          Safety: Award لا ينشئ PO تلقائيًا، وإنشاء PO لا يصدره، والاستلام لا
          ينشئ قيدًا، وAP Bill تبقى Draft، ولا توجد دفعة أو Bank Transfer تلقائية.
        </div>

        {error ? (
          <div className="p9-notice p9-error">{error}</div>
        ) : null}

        {message ? (
          <div className="p9-notice p9-success">{message}</div>
        ) : null}

        <div className="p9-grid">
          <Card
            label="RFQs"
            value={summary9?.rfqs?.total ?? 0}
            hint={`Quotes ${summary9?.quotations?.total ?? 0}`}
          />
          <Card
            label="PO Value"
            value={money(
              summary9?.spend?.purchase_order_total || 0
            )}
            hint={`Variance ${money(
              summary9?.spend?.variance_vs_pr_estimate || 0
            )}`}
          />
          <Card
            label="Open Delivery"
            value={
              summary9?.delivery?.open_purchase_orders ?? 0
            }
            hint={`Overdue ${
              summary9?.delivery?.overdue_purchase_orders ?? 0
            }`}
          />
          <Card
            label="Qualified Vendors"
            value={
              summary9?.supplier_qualification?.by_status
                ?.qualified ?? 0
            }
            hint={`Reviewed ${
              summary9?.supplier_qualification?.total_reviewed ??
              0
            }`}
          />
          <Card
            label="Procurement Files"
            value={
              summary9?.attachments?.active_procurement_files ??
              0
            }
            hint="Shared secure storage"
          />
        </div>

        <div className="p9-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={`p9-tab ${
                tab === key ? "p9-tab-active" : ""
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" ? (
          <div className="p9-two">
            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>Spend by Vendor</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>المورد</th>
                      <th>POs</th>
                      <th>القيمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary9?.spend?.by_vendor || []).map(
                      (row) => (
                        <tr key={row.vendor_id}>
                          <td>{row.vendor_name || row.vendor_id}</td>
                          <td>{row.po_count}</td>
                          <td>{money(row.po_value)}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>متابعة التسليم</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>PO</th>
                      <th>التاريخ المتوقع</th>
                      <th>متأخر</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary9?.delivery?.overdue || []).map(
                      (row) => (
                        <tr key={row.purchase_order_id}>
                          <td>{row.po_number}</td>
                          <td>
                            {fmtDate(
                              row.expected_delivery_date
                            )}
                          </td>
                          <td>{row.outstanding_days} يوم</td>
                          <td>
                            <Badge value={row.status} />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {tab === "requests" ? (
          <>
            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>طلب شراء جديد</h2>
                <button
                  className="p9-btn"
                  type="button"
                  onClick={() =>
                    setPrForm({
                      ...prForm,
                      lines: [...prForm.lines, newPrLine()],
                    })
                  }
                >
                  + بند
                </button>
              </div>
              <div className="p9-panel-body">
                <form onSubmit={createPR}>
                  <div className="p9-form-grid">
                    <div className="p9-field">
                      <label>طالب الشراء</label>
                      <input
                        className="p9-input"
                        value={prForm.requested_by}
                        onChange={(e) =>
                          setPrForm({
                            ...prForm,
                            requested_by: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="p9-field">
                      <label>الإدارة</label>
                      <input
                        className="p9-input"
                        value={prForm.department_code}
                        onChange={(e) =>
                          setPrForm({
                            ...prForm,
                            department_code: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="p9-field">
                      <label>المورد المفضل</label>
                      <select
                        className="p9-input"
                        value={prForm.preferred_vendor_id}
                        onChange={(e) =>
                          setPrForm({
                            ...prForm,
                            preferred_vendor_id: e.target.value,
                          })
                        }
                      >
                        <option value="">بدون تحديد</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code} — {v.name_ar || v.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>مطلوب بتاريخ</label>
                      <input
                        className="p9-input"
                        type="date"
                        value={prForm.needed_by}
                        onChange={(e) =>
                          setPrForm({
                            ...prForm,
                            needed_by: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="p9-field"
                    style={{ marginTop: 9 }}
                  >
                    <label>الغرض من الشراء</label>
                    <textarea
                      className="p9-input"
                      value={prForm.purpose}
                      onChange={(e) =>
                        setPrForm({
                          ...prForm,
                          purpose: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {prForm.lines.map((line, index) => (
                    <div className="p9-line" key={index}>
                      <div className="p9-field">
                        <label>الوصف</label>
                        <input
                          className="p9-input"
                          value={line.description}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="p9-field">
                        <label>الكمية</label>
                        <input
                          className="p9-input"
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={line.quantity}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="p9-field">
                        <label>السعر التقديري</label>
                        <input
                          className="p9-input"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.estimated_unit_price}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "estimated_unit_price",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="p9-field">
                        <label>VAT</label>
                        <select
                          className="p9-input"
                          value={line.vat_rate}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "vat_rate",
                              e.target.value
                            )
                          }
                        >
                          <option value="0.15">15%</option>
                          <option value="0">0%</option>
                        </select>
                      </div>
                      <div className="p9-field">
                        <label>حساب المصروف/الأصل</label>
                        <select
                          className="p9-input"
                          value={line.account_id}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "account_id",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">اختر الحساب</option>
                          {purchaseAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="p9-field">
                        <label>Cost Center</label>
                        <input
                          className="p9-input"
                          value={line.cost_center}
                          onChange={(e) =>
                            updatePrLine(
                              index,
                              "cost_center",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="p9-btn p9-danger"
                        onClick={() =>
                          setPrForm({
                            ...prForm,
                            lines:
                              prForm.lines.length === 1
                                ? prForm.lines
                                : prForm.lines.filter(
                                    (_, i) => i !== index
                                  ),
                          })
                        }
                      >
                        حذف
                      </button>
                    </div>
                  ))}

                  <button
                    className="p9-btn p9-primary"
                    style={{ marginTop: 11 }}
                    disabled={busy === "create-pr"}
                  >
                    إنشاء PR
                  </button>
                </form>
              </div>
            </section>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>طلبات الشراء</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>PR</th>
                      <th>الغرض</th>
                      <th>القيمة</th>
                      <th>الحالة</th>
                      <th>الاعتماد</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.request_number}</td>
                        <td>{row.purpose}</td>
                        <td>
                          {money(
                            row.estimated_total,
                            row.currency
                          )}
                        </td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          <Badge value={row.approval_status} />
                        </td>
                        <td>
                          <div className="p9-row-actions">
                            {row.approval_status ===
                            "not_requested" ? (
                              <button
                                className="p9-btn"
                                onClick={() =>
                                  requestApproval("pr", row.id)
                                }
                              >
                                طلب اعتماد
                              </button>
                            ) : null}
                            {row.approval_status === "pending" &&
                            row.approval_id ? (
                              <>
                                <button
                                  className="p9-btn p9-primary"
                                  onClick={() =>
                                    decideApproval(
                                      row.approval_id,
                                      "approve"
                                    )
                                  }
                                >
                                  اعتماد
                                </button>
                                <button
                                  className="p9-btn p9-danger"
                                  onClick={() =>
                                    decideApproval(
                                      row.approval_id,
                                      "reject"
                                    )
                                  }
                                >
                                  رفض
                                </button>
                              </>
                            ) : null}
                            {row.approval_status === "approved" &&
                            !pos.some(
                              (po) =>
                                po.purchase_request_id === row.id
                            ) ? (
                              <button
                                className="p9-btn"
                                onClick={() => {
                                  setRfqForm({
                                    ...rfqForm,
                                    purchase_request_id: row.id,
                                    title: `RFQ - ${row.request_number}`,
                                  });
                                  setTab("sourcing");
                                }}
                              >
                                RFQ
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {tab === "sourcing" ? (
          <>
            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>إنشاء RFQ</h2>
              </div>
              <div className="p9-panel-body">
                <form onSubmit={createRFQ}>
                  <div className="p9-form-grid">
                    <div className="p9-field">
                      <label>PR المعتمد</label>
                      <select
                        className="p9-input"
                        value={rfqForm.purchase_request_id}
                        onChange={(e) =>
                          setRfqForm({
                            ...rfqForm,
                            purchase_request_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">اختر PR</option>
                        {directPoEligible.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.request_number} —{" "}
                            {money(
                              pr.estimated_total,
                              pr.currency
                            )}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>العنوان</label>
                      <input
                        className="p9-input"
                        value={rfqForm.title}
                        onChange={(e) =>
                          setRfqForm({
                            ...rfqForm,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="p9-field">
                      <label>آخر موعد للعروض</label>
                      <input
                        className="p9-input"
                        type="date"
                        value={rfqForm.response_due_date}
                        onChange={(e) =>
                          setRfqForm({
                            ...rfqForm,
                            response_due_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="p9-checks" style={{ marginTop: 10 }}>
                    {vendors.map((v) => (
                      <label className="p9-check" key={v.id}>
                        <input
                          type="checkbox"
                          checked={rfqForm.vendor_ids.includes(
                            v.id
                          )}
                          onChange={() => toggleRfqVendor(v.id)}
                        />{" "}
                        {v.code} — {v.name_ar || v.name_en}
                      </label>
                    ))}
                  </div>

                  <button
                    className="p9-btn p9-primary"
                    style={{ marginTop: 11 }}
                    disabled={busy === "create-rfq"}
                  >
                    إنشاء RFQ
                  </button>
                </form>
              </div>
            </section>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>RFQs</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>RFQ</th>
                      <th>PR</th>
                      <th>الموردون</th>
                      <th>العروض</th>
                      <th>الحالة</th>
                      <th>الترسية</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.rfq_number}</td>
                        <td>{row.purchase_request_number}</td>
                        <td>{row.vendors.length}</td>
                        <td>{row.quotation_count}</td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          {row.award ? (
                            <>
                              <Badge value={row.award.status} />
                              <div className="p9-mini">
                                {row.award.approval_status}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div className="p9-row-actions">
                            <button
                              className="p9-btn"
                              onClick={() => selectRFQ(row.id)}
                            >
                              فتح التفاصيل
                            </button>
                            {row.status === "draft" ? (
                              <button
                                className="p9-btn p9-primary"
                                onClick={() => openRFQ(row.id)}
                              >
                                فتح RFQ
                              </button>
                            ) : null}
                            {row.status === "open" &&
                            row.quotation_count > 0 ? (
                              <button
                                className="p9-btn"
                                onClick={() => closeRFQ(row.id)}
                              >
                                إغلاق
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedRfq ? (
              <>
                <section className="p9-panel">
                  <div className="p9-panel-head">
                    <div>
                      <h2>
                        {selectedRfq.rfq_number} ·{" "}
                        {selectedRfq.title}
                      </h2>
                      <div className="p9-muted">
                        {selectedRfq.purchase_request_number} ·{" "}
                        {selectedRfq.vendors.length} مورد
                      </div>
                    </div>
                    <Badge value={selectedRfq.status} />
                  </div>

                  <div className="p9-panel-body">
                    {selectedRfq.status === "open" &&
                    selectedRfqAvailableVendors.length > 0 ? (
                      <form onSubmit={createQuotation}>
                        <h3>تسجيل عرض مورد</h3>

                        <div className="p9-form-grid">
                          <div className="p9-field">
                            <label>المورد</label>
                            <select
                              className="p9-input"
                              value={quoteForm.vendor_id}
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  vendor_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">اختر المورد</option>
                              {selectedRfqAvailableVendors.map(
                                (item) => (
                                  <option
                                    key={item.vendor_id}
                                    value={item.vendor_id}
                                  >
                                    {item.vendor?.code} —{" "}
                                    {item.vendor?.name_ar ||
                                      item.vendor?.name_en}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                          <div className="p9-field">
                            <label>مرجع عرض المورد</label>
                            <input
                              className="p9-input"
                              value={
                                quoteForm.vendor_quote_reference
                              }
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  vendor_quote_reference:
                                    e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="p9-field">
                            <label>صلاحية العرض</label>
                            <input
                              className="p9-input"
                              type="date"
                              value={quoteForm.valid_until}
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  valid_until: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="p9-field">
                            <label>مدة التسليم بالأيام</label>
                            <input
                              className="p9-input"
                              type="number"
                              min="0"
                              value={quoteForm.delivery_days}
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  delivery_days: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="p9-field">
                            <label>شروط الدفع بالأيام</label>
                            <input
                              className="p9-input"
                              type="number"
                              min="0"
                              value={
                                quoteForm.payment_terms_days
                              }
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  payment_terms_days:
                                    e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="p9-field">
                            <label>الضمان</label>
                            <input
                              className="p9-input"
                              value={quoteForm.warranty_terms}
                              onChange={(e) =>
                                setQuoteForm({
                                  ...quoteForm,
                                  warranty_terms: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        {(selectedRfqPr?.lines || []).map(
                          (line) => (
                            <div
                              className="p9-line"
                              style={{
                                gridTemplateColumns:
                                  "2fr .8fr 1fr .8fr",
                              }}
                              key={line.id}
                            >
                              <div>
                                <b>{line.description}</b>
                                <div className="p9-mini">
                                  Qty {line.quantity}
                                </div>
                              </div>
                              <div className="p9-field">
                                <label>سعر الوحدة</label>
                                <input
                                  className="p9-input"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    quoteForm.prices[line.id] || ""
                                  }
                                  onChange={(e) =>
                                    setQuoteForm({
                                      ...quoteForm,
                                      prices: {
                                        ...quoteForm.prices,
                                        [line.id]: e.target.value,
                                      },
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="p9-field">
                                <label>VAT</label>
                                <select
                                  className="p9-input"
                                  value={
                                    quoteForm.vat_rates[
                                      line.id
                                    ] ??
                                    line.vat_rate ??
                                    0
                                  }
                                  onChange={(e) =>
                                    setQuoteForm({
                                      ...quoteForm,
                                      vat_rates: {
                                        ...quoteForm.vat_rates,
                                        [line.id]: e.target.value,
                                      },
                                    })
                                  }
                                >
                                  <option value="0.15">15%</option>
                                  <option value="0">0%</option>
                                </select>
                              </div>
                              <div>
                                {money(
                                  Number(
                                    quoteForm.prices[line.id] || 0
                                  ) *
                                    Number(line.quantity || 0) *
                                    (1 +
                                      Number(
                                        quoteForm.vat_rates[
                                          line.id
                                        ] ??
                                          line.vat_rate ??
                                          0
                                      )),
                                  selectedRfq.currency
                                )}
                              </div>
                            </div>
                          )
                        )}

                        <button
                          className="p9-btn p9-primary"
                          style={{ marginTop: 10 }}
                          disabled={busy === "create-quote"}
                        >
                          حفظ عرض المورد
                        </button>
                      </form>
                    ) : null}
                  </div>
                </section>

                <section className="p9-panel">
                  <div className="p9-panel-head">
                    <div>
                      <h2>مقارنة العروض</h2>
                      <div className="p9-muted">
                        المقارنة وصفية فقط؛ الترسية تحتاج اعتمادًا
                        صريحًا.
                      </div>
                    </div>
                  </div>

                  <div className="p9-table-wrap">
                    <table className="p9-table">
                      <thead>
                        <tr>
                          <th>المورد</th>
                          <th>الإجمالي</th>
                          <th>فرق عن الأقل</th>
                          <th>التسليم</th>
                          <th>الدفع</th>
                          <th>التأهيل</th>
                          <th>الحالة</th>
                          <th>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allQuotes.map((row) => (
                          <tr key={row.quotation_id}>
                            <td>
                              {row.vendor_code} —{" "}
                              {row.vendor_name}
                              {row.is_lowest_total ? (
                                <div className="p9-mini">
                                  الأقل سعراً
                                </div>
                              ) : null}
                            </td>
                            <td>
                              {money(
                                row.total_amount,
                                row.currency
                              )}
                            </td>
                            <td>
                              {money(
                                row.difference_from_lowest,
                                row.currency
                              )}{" "}
                              ({row.difference_from_lowest_pct}%)
                            </td>
                            <td>
                              {row.delivery_days ?? "—"} يوم
                              {row.is_shortest_delivery ? (
                                <div className="p9-mini">
                                  الأقصر
                                </div>
                              ) : null}
                            </td>
                            <td>
                              {row.payment_terms_days ?? "—"} يوم
                            </td>
                            <td>
                              <Badge
                                value={
                                  row.qualification?.status
                                }
                              />
                            </td>
                            <td>
                              <Badge value={row.status} />
                            </td>
                            <td>
                              {!award ? (
                                <button
                                  className="p9-btn"
                                  onClick={() =>
                                    requestAward(
                                      row.quotation_id
                                    )
                                  }
                                >
                                  طلب ترسية
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {award ? (
                    <div className="p9-panel-body">
                      <div className="p9-actions">
                        <Badge value={award.status} />
                        <Badge
                          value={award.approval_status}
                        />

                        {award.approval_status === "pending" &&
                        award.approval_id ? (
                          <>
                            <button
                              className="p9-btn p9-primary"
                              onClick={() =>
                                decideApproval(
                                  award.approval_id,
                                  "approve"
                                )
                              }
                            >
                              اعتماد الترسية
                            </button>
                            <button
                              className="p9-btn p9-danger"
                              onClick={() =>
                                decideApproval(
                                  award.approval_id,
                                  "reject"
                                )
                              }
                            >
                              رفض
                            </button>
                          </>
                        ) : null}

                        {award.approval_status === "approved" &&
                        award.status !== "executed" ? (
                          <button
                            className="p9-btn p9-primary"
                            onClick={executeAward}
                          >
                            تنفيذ قرار الترسية
                          </button>
                        ) : null}

                        {award.status === "executed" ? (
                          <button
                            className="p9-btn p9-primary"
                            onClick={createPOFromAward}
                          >
                            إنشاء PO مسودة
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="p9-panel">
                  <div className="p9-panel-head">
                    <h2>مرفقات عروض الموردين</h2>
                  </div>
                  <div className="p9-panel-body">
                    <form onSubmit={uploadQuoteAttachment}>
                      <div className="p9-form-grid">
                        <div className="p9-field">
                          <label>العرض</label>
                          <select
                            className="p9-input"
                            value={quoteAttachmentTarget}
                            onChange={(e) =>
                              setQuoteAttachmentTarget(
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">اختر العرض</option>
                            {allQuotes.map((row) => (
                              <option
                                key={row.quotation_id}
                                value={row.quotation_id}
                              >
                                {row.quotation_number} —{" "}
                                {row.vendor_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="p9-field">
                          <label>الملف</label>
                          <input
                            className="p9-input"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
                            onChange={(e) =>
                              setQuoteFile(
                                e.target.files?.[0] || null
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                      <button
                        className="p9-btn p9-primary"
                        style={{ marginTop: 9 }}
                        disabled={busy === "quote-file"}
                      >
                        رفع الملف
                      </button>
                    </form>

                    <div
                      className="p9-table-wrap"
                      style={{ marginTop: 12 }}
                    >
                      <table className="p9-table">
                        <thead>
                          <tr>
                            <th>الملف</th>
                            <th>العرض</th>
                            <th>النوع</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attachments
                            .filter(
                              (x) =>
                                x.entity_type === "quotation"
                            )
                            .map((x) => (
                              <tr key={x.id}>
                                <td>
                                  {x.original_file_name ||
                                    x.title ||
                                    x.id}
                                </td>
                                <td>{x.entity_id}</td>
                                <td>{x.document_type}</td>
                                <td>
                                  <a
                                    className="p9-link"
                                    href={`/api/hr/attachments/${x.id}/download`}
                                  >
                                    تنزيل
                                  </a>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </>
        ) : null}

        {tab === "orders" ? (
          <>
            <section className="p9-panel">
              <div className="p9-panel-head">
                <div>
                  <h2>PO مباشر من PR معتمد</h2>
                  <div className="p9-muted">
                    يستخدم فقط عندما لا تحتاج RFQ.
                  </div>
                </div>
              </div>
              <div className="p9-panel-body">
                <form onSubmit={createDirectPO}>
                  <div className="p9-form-grid">
                    <div className="p9-field">
                      <label>PR</label>
                      <select
                        className="p9-input"
                        value={poForm.purchase_request_id}
                        onChange={(e) => {
                          const pr = prs.find(
                            (x) => x.id === e.target.value
                          );
                          setPoForm({
                            ...poForm,
                            purchase_request_id: e.target.value,
                            vendor_id:
                              pr?.preferred_vendor_id || "",
                          });
                        }}
                        required
                      >
                        <option value="">اختر PR</option>
                        {directPoEligible.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.request_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>المورد</label>
                      <select
                        className="p9-input"
                        value={poForm.vendor_id}
                        onChange={(e) =>
                          setPoForm({
                            ...poForm,
                            vendor_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">اختر المورد</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code} — {v.name_ar || v.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>التسليم المتوقع</label>
                      <input
                        className="p9-input"
                        type="date"
                        value={poForm.expected_delivery_date}
                        onChange={(e) =>
                          setPoForm({
                            ...poForm,
                            expected_delivery_date:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="p9-field">
                      <label>&nbsp;</label>
                      <button
                        className="p9-btn p9-primary"
                        disabled={busy === "create-po"}
                      >
                        إنشاء PO
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>أوامر الشراء</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>PO</th>
                      <th>المورد</th>
                      <th>القيمة</th>
                      <th>الحالة</th>
                      <th>الاعتماد</th>
                      <th>التسليم</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((row) => (
                      <tr key={row.id}>
                        <td>{row.po_number}</td>
                        <td>
                          {vendors.find(
                            (v) => v.id === row.vendor_id
                          )?.name_ar || row.vendor_id}
                        </td>
                        <td>
                          {money(
                            row.total_amount,
                            row.currency
                          )}
                        </td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          <Badge value={row.approval_status} />
                        </td>
                        <td>
                          {fmtDate(
                            row.expected_delivery_date
                          )}
                        </td>
                        <td>
                          <div className="p9-row-actions">
                            {row.approval_status ===
                              "not_requested" &&
                            row.status === "draft" ? (
                              <button
                                className="p9-btn"
                                onClick={() =>
                                  requestApproval("po", row.id)
                                }
                              >
                                طلب اعتماد
                              </button>
                            ) : null}

                            {row.approval_status === "pending" &&
                            row.approval_id ? (
                              <>
                                <button
                                  className="p9-btn p9-primary"
                                  onClick={() =>
                                    decideApproval(
                                      row.approval_id,
                                      "approve"
                                    )
                                  }
                                >
                                  اعتماد
                                </button>
                                <button
                                  className="p9-btn p9-danger"
                                  onClick={() =>
                                    decideApproval(
                                      row.approval_id,
                                      "reject"
                                    )
                                  }
                                >
                                  رفض
                                </button>
                              </>
                            ) : null}

                            {row.status === "pending_approval" &&
                            row.approval_status === "approved" ? (
                              <button
                                className="p9-btn p9-primary"
                                onClick={() => issuePO(row.id)}
                              >
                                إصدار PO
                              </button>
                            ) : null}

                            {["issued", "partially_received"].includes(
                              row.status
                            ) ? (
                              <button
                                className="p9-btn"
                                onClick={() => {
                                  chooseReceiptPO(row.id);
                                  setTab("receipts");
                                }}
                              >
                                استلام
                              </button>
                            ) : null}

                            <a
                              className="p9-link"
                              href={`/procurement/po/${row.id}/print`}
                              target="_blank"
                            >
                              طباعة / PDF
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {tab === "receipts" ? (
          <>
            <div className="p9-two">
              <section className="p9-panel">
                <div className="p9-panel-head">
                  <h2>استلام بضائع / خدمات</h2>
                </div>
                <div className="p9-panel-body">
                  <form onSubmit={createReceipt}>
                    <div className="p9-field">
                      <label>PO</label>
                      <select
                        className="p9-input"
                        value={receiptForm.purchase_order_id}
                        onChange={(e) =>
                          chooseReceiptPO(e.target.value)
                        }
                        required
                      >
                        <option value="">اختر PO</option>
                        {receivablePOs.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.po_number} —{" "}
                            {money(
                              po.total_amount,
                              po.currency
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className="p9-form-grid"
                      style={{ marginTop: 9 }}
                    >
                      <div className="p9-field">
                        <label>نوع الاستلام</label>
                        <select
                          className="p9-input"
                          value={receiptForm.receipt_type}
                          onChange={(e) =>
                            setReceiptForm({
                              ...receiptForm,
                              receipt_type: e.target.value,
                            })
                          }
                        >
                          <option value="service">خدمة</option>
                          <option value="goods">بضاعة</option>
                        </select>
                      </div>
                      <div className="p9-field">
                        <label>المستلم</label>
                        <input
                          className="p9-input"
                          value={receiptForm.received_by}
                          onChange={(e) =>
                            setReceiptForm({
                              ...receiptForm,
                              received_by: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {(selectedReceiptPo?.lines || []).map(
                      (line) => (
                        <div
                          className="p9-line"
                          style={{
                            gridTemplateColumns:
                              "2fr 1fr 1fr",
                          }}
                          key={line.id}
                        >
                          <div>
                            <b>{line.description}</b>
                            <div className="p9-mini">
                              المتبقي {line.remaining_quantity}
                            </div>
                          </div>
                          <div className="p9-field">
                            <label>الكمية</label>
                            <input
                              className="p9-input"
                              type="number"
                              step="0.0001"
                              min="0"
                              max={line.remaining_quantity}
                              value={
                                receiptForm.quantities[
                                  line.id
                                ] || ""
                              }
                              onChange={(e) =>
                                setReceiptForm({
                                  ...receiptForm,
                                  quantities: {
                                    ...receiptForm.quantities,
                                    [line.id]: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            {money(
                              Number(
                                receiptForm.quantities[
                                  line.id
                                ] || 0
                              ) *
                                Number(line.unit_price || 0),
                              selectedReceiptPo?.currency
                            )}
                          </div>
                        </div>
                      )
                    )}

                    <button
                      className="p9-btn p9-primary"
                      style={{ marginTop: 9 }}
                      disabled={busy === "create-receipt"}
                    >
                      تسجيل الاستلام
                    </button>
                  </form>
                </div>
              </section>

              <section className="p9-panel">
                <div className="p9-panel-head">
                  <h2>AP Bill من استلام مؤكد</h2>
                </div>
                <div className="p9-panel-body">
                  <form onSubmit={createBill}>
                    <div className="p9-field">
                      <label>الاستلام</label>
                      <select
                        className="p9-input"
                        value={billForm.receipt_id}
                        onChange={(e) =>
                          setBillForm({
                            ...billForm,
                            receipt_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">اختر الاستلام</option>
                        {billableReceipts.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.receipt_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className="p9-form-grid"
                      style={{ marginTop: 9 }}
                    >
                      <div className="p9-field">
                        <label>رقم فاتورة المورد</label>
                        <input
                          className="p9-input"
                          value={billForm.bill_number}
                          onChange={(e) =>
                            setBillForm({
                              ...billForm,
                              bill_number: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="p9-field">
                        <label>التاريخ</label>
                        <input
                          className="p9-input"
                          type="date"
                          value={billForm.bill_date}
                          onChange={(e) =>
                            setBillForm({
                              ...billForm,
                              bill_date: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="p9-field">
                        <label>Accounts Payable</label>
                        <select
                          className="p9-input"
                          value={billForm.payable_account_id}
                          onChange={(e) =>
                            setBillForm({
                              ...billForm,
                              payable_account_id:
                                e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">اختر الحساب</option>
                          {payableAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="p9-field">
                        <label>Input VAT</label>
                        <select
                          className="p9-input"
                          value={
                            billForm.input_vat_account_id
                          }
                          onChange={(e) =>
                            setBillForm({
                              ...billForm,
                              input_vat_account_id:
                                e.target.value,
                            })
                          }
                        >
                          <option value="">بدون</option>
                          {assetAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      className="p9-btn p9-primary"
                      style={{ marginTop: 9 }}
                      disabled={busy === "create-bill"}
                    >
                      إنشاء AP Bill Draft
                    </button>
                  </form>
                </div>
              </section>
            </div>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>الاستلامات</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>PO</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>Finance Bill</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((row) => (
                      <tr key={row.id}>
                        <td>{row.receipt_number}</td>
                        <td>
                          {pos.find(
                            (p) =>
                              p.id === row.purchase_order_id
                          )?.po_number || row.purchase_order_id}
                        </td>
                        <td>{row.receipt_type}</td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td>
                          {row.finance_bill
                            ? `${row.finance_bill.bill_number} · ${
                                LABELS[
                                  row.finance_bill.status
                                ] || row.finance_bill.status
                              }`
                            : "—"}
                        </td>
                        <td>
                          {row.status === "draft" ? (
                            <button
                              className="p9-btn p9-primary"
                              onClick={() =>
                                confirmReceipt(row.id)
                              }
                            >
                              تأكيد
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {tab === "vendors" ? (
          <>
            <section className="p9-panel">
              <div className="p9-panel-head">
                <div>
                  <h2>تأهيل المورد</h2>
                  <div className="p9-muted">
                    المورد نفسه FinanceVendor؛ هذه سجلات تأهيل فقط.
                  </div>
                </div>
              </div>

              <div className="p9-panel-body">
                <form onSubmit={saveQualification}>
                  <div className="p9-form-grid">
                    <div className="p9-field">
                      <label>المورد</label>
                      <select
                        className="p9-input"
                        value={qualificationForm.vendor_id}
                        onChange={(e) =>
                          setQualificationForm({
                            ...qualificationForm,
                            vendor_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">اختر المورد</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code} — {v.name_ar || v.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>الحالة</label>
                      <select
                        className="p9-input"
                        value={qualificationForm.status}
                        onChange={(e) =>
                          setQualificationForm({
                            ...qualificationForm,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="qualified">مؤهل</option>
                        <option value="conditional">
                          مؤهل بشروط
                        </option>
                        <option value="pending">معلق</option>
                        <option value="rejected">مرفوض</option>
                        <option value="expired">منتهي</option>
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>المخاطر</label>
                      <select
                        className="p9-input"
                        value={qualificationForm.risk_level}
                        onChange={(e) =>
                          setQualificationForm({
                            ...qualificationForm,
                            risk_level: e.target.value,
                          })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="p9-field">
                      <label>صالح حتى</label>
                      <input
                        className="p9-input"
                        type="date"
                        value={qualificationForm.valid_until}
                        onChange={(e) =>
                          setQualificationForm({
                            ...qualificationForm,
                            valid_until: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="p9-checks"
                    style={{ marginTop: 9 }}
                  >
                    {[
                      ["cr_verified", "CR Verified"],
                      ["vat_verified", "VAT Verified"],
                      ["iban_verified", "IBAN Verified"],
                      [
                        "cybersecurity_review_required",
                        "Cyber Review Required",
                      ],
                    ].map(([key, label]) => (
                      <label className="p9-check" key={key}>
                        <input
                          type="checkbox"
                          checked={qualificationForm[key]}
                          onChange={(e) =>
                            setQualificationForm({
                              ...qualificationForm,
                              [key]: e.target.checked,
                            })
                          }
                        />{" "}
                        {label}
                      </label>
                    ))}
                  </div>

                  {qualificationForm.cybersecurity_review_required ? (
                    <div
                      className="p9-field"
                      style={{ marginTop: 9 }}
                    >
                      <label>Cyber Review Status</label>
                      <select
                        className="p9-input"
                        value={
                          qualificationForm.cybersecurity_review_status
                        }
                        onChange={(e) =>
                          setQualificationForm({
                            ...qualificationForm,
                            cybersecurity_review_status:
                              e.target.value,
                          })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  ) : null}

                  <div
                    className="p9-field"
                    style={{ marginTop: 9 }}
                  >
                    <label>ملاحظات</label>
                    <textarea
                      className="p9-input"
                      value={qualificationForm.notes}
                      onChange={(e) =>
                        setQualificationForm({
                          ...qualificationForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    className="p9-btn p9-primary"
                    style={{ marginTop: 9 }}
                    disabled={busy === "qualification"}
                  >
                    حفظ التأهيل
                  </button>
                </form>
              </div>
            </section>

            <section className="p9-panel">
              <div className="p9-panel-head">
                <h2>الموردون والتأهيل</h2>
              </div>
              <div className="p9-table-wrap">
                <table className="p9-table">
                  <thead>
                    <tr>
                      <th>المورد</th>
                      <th>CR</th>
                      <th>VAT</th>
                      <th>IBAN</th>
                      <th>التأهيل</th>
                      <th>المخاطر</th>
                      <th>Cyber</th>
                      <th>صالح حتى</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualifications.map((row) => (
                      <tr key={row.vendor.id}>
                        <td>
                          {row.vendor.code} —{" "}
                          {row.vendor.name_ar ||
                            row.vendor.name_en}
                        </td>
                        <td>
                          {row.qualification.cr_verified
                            ? "✓"
                            : "—"}
                        </td>
                        <td>
                          {row.qualification.vat_verified
                            ? "✓"
                            : "—"}
                        </td>
                        <td>
                          {row.qualification.iban_verified
                            ? "✓"
                            : "—"}
                        </td>
                        <td>
                          <Badge
                            value={
                              row.qualification.status
                            }
                          />
                        </td>
                        <td>
                          {row.qualification.risk_level ||
                            "—"}
                        </td>
                        <td>
                          {
                            row.qualification
                              .cybersecurity_review_status
                          }
                        </td>
                        <td>
                          {fmtDate(
                            row.qualification.valid_until
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
