"use client";

import { useEffect, useState } from "react";

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

export default function AdminControlsPage() {
  const [leases, setLeases] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [stocktakes, setStocktakes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [l,t,f,s,sm] = await Promise.all([
        api("/api/admin/leases"),
        api("/api/admin/lease-terminations"),
        api("/api/admin/facilities"),
        api("/api/admin/custody-stocktakes"),
        api("/api/admin/phase1c-summary"),
      ]);
      setLeases(l);
      setTerminations(t);
      setFacilities(f);
      setStocktakes(s);
      setSummary(sm);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function requestTermination(id) {
    const reason = window.prompt("سبب إنهاء المقر/العقد:");
    if (reason === null) return;
    try {
      await api(`/api/admin/leases/${id}/termination/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: "user",
          reason: reason || null,
        }),
      });
      setMessage("تم إنشاء طلب اعتماد الإنهاء. لم يتم إنهاء العقد خارجيًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function recordTermination(row) {
    const ref = window.prompt("مرجع الإنهاء المنفذ خارج النظام:");
    if (!ref) return;
    try {
      await api(`/api/admin/lease-terminations/${row.id}/record-execution`, {
        method: "POST",
        body: JSON.stringify({
          external_termination_reference: ref,
          recorded_by: "user",
        }),
      });
      setMessage("تم توثيق الإنهاء الخارجي فقط.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createStocktake(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/admin/custody-stocktakes", {
        method: "POST",
        body: JSON.stringify({
          facility_id: fd.get("facility_id") || null,
          stocktake_date: fd.get("stocktake_date"),
          performed_by: "user",
        }),
      });
      setMessage("تم إنشاء الجرد من العهد القائمة بدون تعديل حالتها.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function observe(stocktakeId, itemId, status) {
    try {
      await api(`/api/admin/custody-stocktakes/${stocktakeId}/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({
          observed_status: status,
          observed_by: "user",
        }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeStocktake(id) {
    try {
      await api(`/api/admin/custody-stocktakes/${id}/complete`, {
        method: "POST",
      });
      setMessage("تم إقفال الجرد. الفروقات لم تغيّر سجل العهدة تلقائيًا.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main dir="rtl" style={{minHeight:"100vh",padding:24,background:"#06131e",fontFamily:"Arial,Segoe UI,sans-serif"}}>
      <div style={{maxWidth:1400,margin:"0 auto"}}>
        <section style={{background:"#0b1d2d",color:"white",padding:24,borderRadius:18}}>
          <h1 style={{marginTop:0}}>Admin Controls</h1>
          <p>إنهاء عقود المقر والجرد الفعلي للعهد. النظام يسجل الاعتماد والدليل فقط ولا ينفذ الإنهاء الخارجي ولا يغيّر حالة العهد تلقائيًا.</p>
          <div style={{display:"flex",gap:12}}>
            <a href="/admin" style={{color:"white"}}>Admin</a>
            <a href="/admin/operations" style={{color:"white"}}>Operations</a>
          </div>
        </section>

        {error ? <p style={{background:"#321d26",padding:12}}>{error}</p> : null}
        {message ? <p style={{background:"#0b302b",padding:12}}>{message}</p> : null}

        <p>
          Terminations: {summary?.lease_terminations?.total ?? "—"} |
          Stocktakes: {summary?.custody_stocktakes?.total ?? "—"} |
          Discrepancies: {summary?.custody_stocktakes?.discrepancies ?? "—"}
        </p>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14,marginBottom:16}}>
          <h3>Lease Termination Control</h3>
          {leases.map((row) => (
            <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
              <strong>{row.code}</strong> · {row.counterparty_name} · {row.status}
              {row.status === "active" ? (
                <button style={{marginRight:8}} onClick={()=>requestTermination(row.id)}>
                  Request Termination Approval
                </button>
              ) : null}
            </div>
          ))}

          {terminations.map((row) => (
            <div key={row.id} style={{borderTop:"1px solid #eee",padding:"10px 0"}}>
              Termination · {row.status} · Approval: {row.approval_status || "—"}
              <button style={{marginRight:8}} onClick={()=>recordTermination(row)}>
                Record External Termination
              </button>
            </div>
          ))}
        </section>

        <section style={{background:"#0b1d2d",padding:16,borderRadius:14}}>
          <h3>Custody Stocktake</h3>
          <form onSubmit={createStocktake} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select name="facility_id">
              <option value="">كل المواقع</option>
              {facilities.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <input name="stocktake_date" type="date" required />
            <button>إنشاء جرد</button>
          </form>

          {stocktakes.map((row)=>(
            <div key={row.id} style={{borderTop:"1px solid #eee",padding:"12px 0"}}>
              <strong>{row.code}</strong> · {row.status} · Discrepancies: {row.discrepancies}
              {row.items.map((item)=>(
                <div key={item.id} style={{marginTop:6}}>
                  {item.item_identifier} · {item.assigned_to_name} · {item.observed_status}
                  {row.status === "draft" ? (
                    <>
                      <button onClick={()=>observe(row.id,item.id,"present")}>Present</button>
                      <button onClick={()=>observe(row.id,item.id,"missing")}>Missing</button>
                      <button onClick={()=>observe(row.id,item.id,"damaged")}>Damaged</button>
                    </>
                  ) : null}
                </div>
              ))}
              {row.status === "draft" ? (
                <button style={{marginTop:8}} onClick={()=>completeStocktake(row.id)}>
                  Complete Stocktake
                </button>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
