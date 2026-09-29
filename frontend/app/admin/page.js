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
      typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data?.detail || data)
    );
  }

  return data;
}

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [references, setReferences] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [access, setAccess] = useState([]);
  const [custody, setCustody] = useState([]);
  const [records, setRecords] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [facilityName, setFacilityName] = useState("");
  const [facilityCity, setFacilityCity] = useState("");

  const [workOrder, setWorkOrder] = useState({
    facility_id: "",
    category: "maintenance",
    title: "",
    priority: "normal",
  });

  const [accessForm, setAccessForm] = useState({
    facility_id: "",
    request_type: "visitor",
    person_name: "",
    organization: "",
    host_name: "",
    purpose: "",
    start_at: "",
    end_at: "",
  });

  const [custodyForm, setCustodyForm] = useState({
    facility_id: "",
    item_type: "key",
    item_identifier: "",
    assigned_to_type: "employee",
    assigned_to_name: "",
    issued_at: "",
    due_return_at: "",
  });

  const [recordForm, setRecordForm] = useState({
    title: "",
    record_category: "general",
    owner_department: "",
    confidentiality_level: "confidential",
    retention_until: "",
  });

  const [attachmentRecordId, setAttachmentRecordId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);

  async function load() {
    setError("");

    try {
      const [
        s,
        ref,
        f,
        w,
        a,
        c,
        r,
        att,
      ] = await Promise.all([
        api("/api/admin/summary"),
        api("/api/admin/reference-summary"),
        api("/api/admin/facilities"),
        api("/api/admin/work-orders"),
        api("/api/admin/access-requests"),
        api("/api/admin/custody"),
        api("/api/admin/corporate-records?status=all").catch(
          () => api("/api/admin/corporate-records")
        ),
        api("/api/hr/attachments?module=admin&status=active"),
      ]);

      setSummary(s);
      setReferences(ref);
      setFacilities(f);
      setWorkOrders(w);
      setAccess(a);
      setCustody(c);
      setRecords(r);
      setAttachments(att);

      if (!workOrder.facility_id && f.length) {
        setWorkOrder((x) => ({
          ...x,
          facility_id: f[0].id,
        }));
      }

      if (!accessForm.facility_id && f.length) {
        setAccessForm((x) => ({
          ...x,
          facility_id: f[0].id,
        }));
      }

      if (!custodyForm.facility_id && f.length) {
        setCustodyForm((x) => ({
          ...x,
          facility_id: f[0].id,
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const recordAttachmentCounts = useMemo(() => {
    const counts = {};

    for (const row of attachments) {
      if (row.entity_type !== "corporate_record") continue;
      counts[row.entity_id] = (counts[row.entity_id] || 0) + 1;
    }

    return counts;
  }, [attachments]);

  async function createFacility(event) {
    event.preventDefault();

    try {
      await api("/api/admin/facilities", {
        method: "POST",
        body: JSON.stringify({
          name: facilityName,
          facility_type: "office",
          city: facilityCity || null,
        }),
      });

      setFacilityName("");
      setFacilityCity("");
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ù…Ø±ÙÙ‚ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createWorkOrder(event) {
    event.preventDefault();

    try {
      await api("/api/admin/work-orders", {
        method: "POST",
        body: JSON.stringify({
          ...workOrder,
          responsible_owner: "Admin",
        }),
      });

      setWorkOrder((x) => ({
        ...x,
        title: "",
      }));
      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø£Ù…Ø± Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ø¨Ø¯ÙˆÙ† Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨ Ø´Ø±Ø§Ø¡ Ø£Ùˆ Ù…ØµØ±ÙˆÙ.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAccess(event) {
    event.preventDefault();

    try {
      await api("/api/admin/access-requests", {
        method: "POST",
        body: JSON.stringify({
          ...accessForm,
          organization: accessForm.organization || null,
          host_name: accessForm.host_name || null,
          start_at: new Date(accessForm.start_at).toISOString(),
          end_at: accessForm.end_at
            ? new Date(accessForm.end_at).toISOString()
            : null,
          requested_by: "user",
        }),
      });

      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨ Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙƒÙ…Ø³ÙˆØ¯Ø©. Ù„Ù… ÙŠØªÙ… Ù…Ù†Ø­ Ø¯Ø®ÙˆÙ„ ÙØ¹Ù„ÙŠ.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestAccessApproval(id) {
    try {
      await api(`/api/admin/access-requests/${id}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
        }),
      });

      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„Ø§Ø¹ØªÙ…Ø§Ø¯.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function authorizeAccess(id) {
    try {
      await api(`/api/admin/access-requests/${id}/authorize`, {
        method: "POST",
      });

      setMessage("ØªÙ… ØªÙˆØ«ÙŠÙ‚ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¯Ø§Ø®Ù„ÙŠÙ‹Ø§. Ù„Ø§ ÙŠÙˆØ¬Ø¯ Door Unlock ØªÙ„Ù‚Ø§Ø¦ÙŠ.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkIn(id) {
    try {
      await api(`/api/admin/access-requests/${id}/check-in`, {
        method: "POST",
        body: JSON.stringify({ actor: "user" }),
      });

      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Check-in.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkOut(id) {
    try {
      await api(`/api/admin/access-requests/${id}/check-out`, {
        method: "POST",
        body: JSON.stringify({ actor: "user" }),
      });

      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Check-out.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createCustody(event) {
    event.preventDefault();

    try {
      await api("/api/admin/custody", {
        method: "POST",
        body: JSON.stringify({
          ...custodyForm,
          facility_id: custodyForm.facility_id || null,
          issued_at: new Date(custodyForm.issued_at).toISOString(),
          due_return_at: custodyForm.due_return_at
            ? new Date(custodyForm.due_return_at).toISOString()
            : null,
          issued_by: "user",
        }),
      });

      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¹Ù‡Ø¯Ø© Ø¨Ø¯ÙˆÙ† ØªØ¹Ø¯ÙŠÙ„ Finance Fixed Asset.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function returnCustody(id) {
    try {
      await api(`/api/admin/custody/${id}/return`, {
        method: "POST",
        body: JSON.stringify({
          received_back_by: "user",
          status: "returned",
        }),
      });

      setMessage("ØªÙ… Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø§Ù„Ø¹Ù‡Ø¯Ø©.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createRecord(event) {
    event.preventDefault();

    try {
      await api("/api/admin/corporate-records", {
        method: "POST",
        body: JSON.stringify({
          ...recordForm,
          owner_department: recordForm.owner_department || null,
          retention_until: recordForm.retention_until || null,
        }),
      });

      setMessage("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ÙÙ‡Ø±Ø³ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠ.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function archiveRecord(id) {
    const reason = window.prompt("Ø³Ø¨Ø¨ Ø§Ù„Ø£Ø±Ø´ÙØ©:");
    if (!reason) return;

    try {
      await api(`/api/admin/corporate-records/${id}/archive`, {
        method: "PUT",
        body: JSON.stringify({
          archived_by: "user",
          reason,
        }),
      });

      setMessage("ØªÙ…Øª Ø£Ø±Ø´ÙØ© Ø§Ù„Ø³Ø¬Ù„ Ø¨Ø¯ÙˆÙ† Ø­Ø°Ù Ø§Ù„Ù…Ù„ÙØ§Øª.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadRecordAttachment(event) {
    event.preventDefault();

    if (!attachmentRecordId || !attachmentFile) return;

    const body = new FormData();
    body.append("module", "admin");
    body.append("entity_type", "corporate_record");
    body.append("entity_id", attachmentRecordId);
    body.append("document_type", "corporate_record");
    body.append("uploaded_by", "user");
    body.append("confidentiality_level", "confidential");
    body.append("title", attachmentFile.name);
    body.append("file", attachmentFile);

    try {
      const response = await fetch("/api/hr/attachments/upload", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : JSON.stringify(data?.detail || data)
        );
      }

      setAttachmentFile(null);
      setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ù ÙÙŠ Unified Attachments.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#06131e",
        color: "#f7fafc",
        fontFamily: "Arial,Segoe UI,sans-serif",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <section
          style={{
            background: "#0b1d2d",
            color: "white",
            borderRadius: 18,
            padding: 24,
          }}
        >
          <h1 style={{ marginTop: 0 }}>Admin Agent</h1>
          <p style={{ color: "#d9e7e6", lineHeight: 1.7 }}>
            Ø§Ù„Ù…Ø±Ø§ÙÙ‚ØŒ Ø§Ù„Ø²ÙˆØ§Ø± ÙˆØ§Ù„Ø¯Ø®ÙˆÙ„ØŒ Ø§Ù„Ø¹Ù‡Ø¯ ÙˆØ§Ù„Ù…ÙØ§ØªÙŠØ­ØŒ ÙˆØ§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠØ©.
            Finance ÙˆProcurement ÙˆGovernment Compliance ØªØ¨Ù‚Ù‰ Ø§Ù„Ø£Ù†Ø¸Ù…Ø© Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠØ©
            ÙˆÙ„Ø§ ÙŠØªÙ… ØªÙƒØ±Ø§Ø±Ù‡Ø§ Ø£Ùˆ ØªÙ†ÙÙŠØ° Ø£ÙŠ Ø§Ù„ØªØ²Ø§Ù… Ø®Ø§Ø±Ø¬ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/hr/government-compliance" style={{ color: "white" }}>
              Government Compliance
            </a>
            <a href="/hr/calendar" style={{ color: "white" }}>
              Calendar
            </a>
            <a href="/finance/assets-accruals" style={{ color: "white" }}>
              Fixed Assets
            </a>
            <a href="/procurement" style={{ color: "white" }}>
              Procurement
            </a>
            <a href="/admin/operations" style={{ color: "white" }}>Operations</a>\n            <a href="/" style={{ color: "white" }}>
              Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©
            </a>
          </div>
        </section>

        {error ? (
          <p style={{ background: "#321d26", padding: 12 }}>{error}</p>
        ) : null}

        {message ? (
          <p style={{ background: "#0b302b", padding: 12 }}>{message}</p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 10,
            margin: "16px 0",
          }}
        >
          {[
            ["Ø§Ù„Ù…Ø±Ø§ÙÙ‚ Ø§Ù„Ù†Ø´Ø·Ø©", summary?.facilities?.active],
            ["Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ù…ÙØªÙˆØ­Ø©", summary?.work_orders?.open],
            ["Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©", summary?.access?.pending_approval],
            ["Ø§Ù„Ø¹Ù‡Ø¯ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©", summary?.custody?.issued],
            ["Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©", summary?.records?.active],
            ["Ø§Ù„Ù…Ø±ÙÙ‚Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©", summary?.records?.active_attachments],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#0b1d2d",
                border: "1px solid #234a57",
                borderRadius: 14,
                padding: 15,
              }}
            >
              <div style={{ fontSize: 11, color: "#8fb8b6" }}>{label}</div>
              <div style={{ fontSize: 23, fontWeight: 900, marginTop: 6 }}>
                {value ?? "â€”"}
              </div>
            </div>
          ))}
        </div>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <h3>Authoritative References</h3>
          <div style={{ lineHeight: 1.8 }}>
            Corporate Compliance: {references?.counts?.corporate_compliance_records ?? "â€”"} |
            Finance Fixed Assets: {references?.counts?.finance_fixed_assets ?? "â€”"} |
            Calendar Events: {references?.counts?.calendar_events ?? "â€”"} |
            PRs: {references?.counts?.purchase_requests ?? "â€”"} |
            POs: {references?.counts?.purchase_orders ?? "â€”"}
          </div>
        </section>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <h3>Facilities</h3>
          <form onSubmit={createFacility} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ø±ÙÙ‚"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              required
            />
            <input
              placeholder="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©"
              value={facilityCity}
              onChange={(e) => setFacilityCity(e.target.value)}
            />
            <button>Ø¥Ø¶Ø§ÙØ©</button>
          </form>
          {facilities.map((row) => (
            <p key={row.id}>
              <strong>{row.code}</strong> Â· {row.name} Â· {row.city || "â€”"} Â· {row.status}
            </p>
          ))}
        </section>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <h3>Facility Work Orders</h3>
          <form onSubmit={createWorkOrder} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={workOrder.facility_id}
              onChange={(e) => setWorkOrder({ ...workOrder, facility_id: e.target.value })}
              required
            >
              <option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…Ø±ÙÙ‚</option>
              {facilities.map((x) => (
                <option value={x.id} key={x.id}>{x.name}</option>
              ))}
            </select>
            <select
              value={workOrder.category}
              onChange={(e) => setWorkOrder({ ...workOrder, category: e.target.value })}
            >
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="safety">Safety</option>
              <option value="utilities">Utilities</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Ø£Ù…Ø± Ø§Ù„Ø¹Ù…Ù„"
              value={workOrder.title}
              onChange={(e) => setWorkOrder({ ...workOrder, title: e.target.value })}
              required
            />
            <select
              value={workOrder.priority}
              onChange={(e) => setWorkOrder({ ...workOrder, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button>Ø¥Ù†Ø´Ø§Ø¡</button>
          </form>
          {workOrders.map((row) => (
            <p key={row.id}>
              <strong>{row.code}</strong> Â· {row.title} Â· {row.priority} Â· {row.status}
            </p>
          ))}
        </section>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <h3>Visitors & Access</h3>
          <form onSubmit={createAccess} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
            <select
              value={accessForm.facility_id}
              onChange={(e) => setAccessForm({ ...accessForm, facility_id: e.target.value })}
              required
            >
              <option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…Ø±ÙÙ‚</option>
              {facilities.map((x) => (
                <option value={x.id} key={x.id}>{x.name}</option>
              ))}
            </select>
            <select
              value={accessForm.request_type}
              onChange={(e) => setAccessForm({ ...accessForm, request_type: e.target.value })}
            >
              <option value="visitor">Visitor</option>
              <option value="vendor">Vendor</option>
              <option value="employee">Employee</option>
              <option value="temporary_access">Temporary Access</option>
            </select>
            <input
              placeholder="Ø§Ø³Ù… Ø§Ù„Ø´Ø®Øµ"
              value={accessForm.person_name}
              onChange={(e) => setAccessForm({ ...accessForm, person_name: e.target.value })}
              required
            />
            <input
              placeholder="Ø§Ù„Ø¬Ù‡Ø©"
              value={accessForm.organization}
              onChange={(e) => setAccessForm({ ...accessForm, organization: e.target.value })}
            />
            <input
              placeholder="Ø§Ù„Ù…Ø¶ÙŠÙ"
              value={accessForm.host_name}
              onChange={(e) => setAccessForm({ ...accessForm, host_name: e.target.value })}
            />
            <input
              placeholder="Ø§Ù„ØºØ±Ø¶"
              value={accessForm.purpose}
              onChange={(e) => setAccessForm({ ...accessForm, purpose: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={accessForm.start_at}
              onChange={(e) => setAccessForm({ ...accessForm, start_at: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={accessForm.end_at}
              onChange={(e) => setAccessForm({ ...accessForm, end_at: e.target.value })}
            />
            <button>Ø¥Ù†Ø´Ø§Ø¡ Draft</button>
          </form>

          {access.map((row) => (
            <div key={row.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <strong>{row.code}</strong> Â· {row.person_name} Â· {row.request_type} Â· {row.status}
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <button onClick={() => requestAccessApproval(row.id)}>Request Approval</button>
                <button onClick={() => authorizeAccess(row.id)}>Authorize</button>
                <button onClick={() => checkIn(row.id)}>Check-in</button>
                <button onClick={() => checkOut(row.id)}>Check-out</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <h3>Custody Â· Keys Â· Access Cards</h3>
          <form onSubmit={createCustody} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
            <select
              value={custodyForm.facility_id}
              onChange={(e) => setCustodyForm({ ...custodyForm, facility_id: e.target.value })}
            >
              <option value="">Ø¨Ø¯ÙˆÙ† Ù…Ø±ÙÙ‚</option>
              {facilities.map((x) => (
                <option value={x.id} key={x.id}>{x.name}</option>
              ))}
            </select>
            <select
              value={custodyForm.item_type}
              onChange={(e) => setCustodyForm({ ...custodyForm, item_type: e.target.value })}
            >
              <option value="key">Key</option>
              <option value="access_card">Access Card</option>
              <option value="equipment">Equipment</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Ø±Ù‚Ù…/ÙˆØµÙ Ø§Ù„Ø¹Ù‡Ø¯Ø©"
              value={custodyForm.item_identifier}
              onChange={(e) => setCustodyForm({ ...custodyForm, item_identifier: e.target.value })}
              required
            />
            <input
              placeholder="Ø§Ù„Ù…Ø³ØªÙ„Ù…"
              value={custodyForm.assigned_to_name}
              onChange={(e) => setCustodyForm({ ...custodyForm, assigned_to_name: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={custodyForm.issued_at}
              onChange={(e) => setCustodyForm({ ...custodyForm, issued_at: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={custodyForm.due_return_at}
              onChange={(e) => setCustodyForm({ ...custodyForm, due_return_at: e.target.value })}
            />
            <button>ØªØ³Ù„ÙŠÙ… Ø¹Ù‡Ø¯Ø©</button>
          </form>

          {custody.map((row) => (
            <div key={row.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <strong>{row.code}</strong> Â· {row.item_type} Â· {row.item_identifier} Â· {row.assigned_to_name} Â· {row.status}
              {row.status === "issued" ? (
                <button style={{ marginRight: 8 }} onClick={() => returnCustody(row.id)}>
                  Ø§Ø³ØªØ±Ø¯Ø§Ø¯
                </button>
              ) : null}
            </div>
          ))}
        </section>

        <section style={{ background: "#0b1d2d", padding: 16, borderRadius: 14 }}>
          <h3>Corporate Records Archive</h3>
          <form onSubmit={createRecord} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
            <input
              placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø³Ø¬Ù„"
              value={recordForm.title}
              onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
              required
            />
            <input
              placeholder="Ø§Ù„ØªØµÙ†ÙŠÙ"
              value={recordForm.record_category}
              onChange={(e) => setRecordForm({ ...recordForm, record_category: e.target.value })}
            />
            <input
              placeholder="Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙƒØ©"
              value={recordForm.owner_department}
              onChange={(e) => setRecordForm({ ...recordForm, owner_department: e.target.value })}
            />
            <select
              value={recordForm.confidentiality_level}
              onChange={(e) => setRecordForm({ ...recordForm, confidentiality_level: e.target.value })}
            >
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
            <input
              type="date"
              value={recordForm.retention_until}
              onChange={(e) => setRecordForm({ ...recordForm, retention_until: e.target.value })}
            />
            <button>Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„</button>
          </form>

          <form onSubmit={uploadRecordAttachment} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <select
              value={attachmentRecordId}
              onChange={(e) => setAttachmentRecordId(e.target.value)}
              required
            >
              <option value="">Ø§Ø®ØªØ± Ø§Ù„Ø³Ø¬Ù„ Ù„Ù„Ù…Ø±ÙÙ‚</option>
              {records
                .filter((x) => x.status === "active")
                .map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.code} Â· {x.title}
                  </option>
                ))}
            </select>
            <input
              type="file"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
              required
            />
            <button>Ø±ÙØ¹ Ù…Ù„Ù</button>
          </form>

          {records.map((row) => (
            <div key={row.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <strong>{row.code}</strong> Â· {row.title} Â· {row.record_category} Â· {row.status} Â· Files: {recordAttachmentCounts[row.id] || 0}
              {row.status === "active" ? (
                <button style={{ marginRight: 8 }} onClick={() => archiveRecord(row.id)}>
                  Archive
                </button>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
