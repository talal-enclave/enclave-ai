"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

async function api(path) {
  const response = await fetch(path, { cache: "no-store" });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `HTTP ${response.status}`
    );
  }

  return data;
}

function money(value, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: currency || "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function date(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PurchaseOrderPrintPage() {
  const params = useParams();
  const id = params?.id;
  const [po, setPo] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([
      api(`/api/procurement/purchase-orders/${id}`),
      api("/api/procurement/vendors?active_only=false"),
    ])
      .then(([poData, vendorData]) => {
        setPo(poData);
        setVendors(vendorData);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const vendor = useMemo(
    () => vendors.find((v) => v.id === po?.vendor_id) || null,
    [vendors, po]
  );

  if (error) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial" }}>
        <h1>Unable to load Purchase Order</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!po) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial" }}>
        Loading Purchase Order...
      </main>
    );
  }

  return (
    <main className="po-print" dir="rtl">
      <style>{`
        body {
          margin: 0;
          background: #fff;
          color: #111;
          font-family: Arial, sans-serif;
        }
        .po-print {
          max-width: 950px;
          margin: 0 auto;
          padding: 34px;
        }
        .po-actions {
          display: flex;
          justify-content: flex-start;
          gap: 8px;
          margin-bottom: 18px;
        }
        .po-button {
          border: 1px solid #222;
          background: #111;
          color: white;
          border-radius: 7px;
          padding: 9px 13px;
          cursor: pointer;
          text-decoration: none;
          font-size: 12px;
        }
        .po-head {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          border-bottom: 2px solid #111;
          padding-bottom: 18px;
        }
        .po-title {
          font-size: 29px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .po-sub {
          color: #555;
          font-size: 12px;
          line-height: 1.7;
        }
        .po-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
          margin: 22px 0;
        }
        .po-box {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
        }
        .po-label {
          color: #666;
          font-size: 10px;
          margin-bottom: 5px;
        }
        .po-value {
          font-size: 13px;
          font-weight: 700;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 9px;
          text-align: right;
          font-size: 11px;
        }
        th {
          background: #f3f4f5;
        }
        .po-totals {
          margin-top: 16px;
          margin-right: auto;
          width: 330px;
        }
        .po-total-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }
        .po-grand {
          font-weight: 800;
          font-size: 14px;
        }
        .po-note {
          margin-top: 24px;
          border-top: 1px solid #ddd;
          padding-top: 14px;
          color: #555;
          font-size: 10px;
          line-height: 1.7;
        }
        @media print {
          .po-actions {
            display: none !important;
          }
          .po-print {
            max-width: none;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 14mm;
          }
        }
      `}</style>

      <div className="po-actions">
        <button
          className="po-button"
          type="button"
          onClick={() => window.print()}
        >
          طباعة / حفظ PDF
        </button>
        <a className="po-button" href="/procurement">
          العودة للمشتريات
        </a>
      </div>

      <header className="po-head">
        <div>
          <div className="po-title">أمر شراء</div>
          <div className="po-sub">PURCHASE ORDER</div>
          <div className="po-sub">
            Packet Enclave Company for Cybersecurity · CR 7054519124
          </div>
        </div>

        <div>
          <div className="po-label">PO Number</div>
          <div className="po-value">{po.po_number}</div>
          <div className="po-label" style={{ marginTop: 9 }}>
            Status
          </div>
          <div className="po-value">{po.status}</div>
        </div>
      </header>

      <section className="po-meta">
        <div className="po-box">
          <div className="po-label">المورد / Vendor</div>
          <div className="po-value">
            {vendor?.name_ar || vendor?.name_en || po.vendor_id}
          </div>
          <div className="po-sub">
            {vendor?.code ? `Code: ${vendor.code}` : ""}
          </div>
          <div className="po-sub">
            {vendor?.vat_number
              ? `VAT: ${vendor.vat_number}`
              : ""}
          </div>
          <div className="po-sub">
            {vendor?.cr_number
              ? `CR: ${vendor.cr_number}`
              : ""}
          </div>
        </div>

        <div className="po-box">
          <div className="po-label">تفاصيل الأمر</div>
          <div className="po-sub">
            Order Date: {date(po.order_date)}
          </div>
          <div className="po-sub">
            Expected Delivery:{" "}
            {date(po.expected_delivery_date)}
          </div>
          <div className="po-sub">
            Currency: {po.currency}
          </div>
          <div className="po-sub">
            PR ID: {po.purchase_request_id}
          </div>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>الوصف / Description</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>VAT</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {(po.lines || []).map((line) => (
            <tr key={line.id}>
              <td>{line.line_number}</td>
              <td>{line.description}</td>
              <td>{line.quantity}</td>
              <td>{money(line.unit_price, po.currency)}</td>
              <td>
                {(Number(line.vat_rate || 0) * 100).toFixed(0)}%
              </td>
              <td>{money(line.total_amount, po.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="po-totals">
        <div className="po-total-row">
          <span>Subtotal</span>
          <span>{money(po.subtotal, po.currency)}</span>
        </div>
        <div className="po-total-row">
          <span>VAT</span>
          <span>{money(po.vat_amount, po.currency)}</span>
        </div>
        <div className="po-total-row po-grand">
          <span>Total</span>
          <span>{money(po.total_amount, po.currency)}</span>
        </div>
      </div>

      <div className="po-note">
        هذا المستند يعكس أمر الشراء المسجل داخل النظام. إصدار أمر
        الشراء داخل النظام لا يعني أن النظام أرسل المستند للمورد
        إلكترونيًا، ولا ينفذ أي دفعة أو تحويل بنكي تلقائي.
        {po.notes ? ` Notes: ${po.notes}` : ""}
      </div>
    </main>
  );
}
