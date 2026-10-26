"use client";
import {useEffect,useState} from "react";
async function api(p,o={}){const r=await fetch(p,{cache:"no-store",...o});const d=await r.json();if(!r.ok)throw new Error(d?.detail||`HTTP ${r.status}`);return d;}
export default function Daily(){const[d,setD]=useState(null);async function load(){setD(await api("/api/operations/daily-report"))}useEffect(()=>{load()},[]);return <main style={{maxWidth:1400,margin:"0 auto",padding:28,color:"#d9e7e6"}}><h1>Daily Operations Report</h1><p>{d?.report_date||""}</p><button onClick={async()=>setD(await api("/api/operations/daily-report/refresh",{method:"POST"}))}>Save Snapshot</button>{d?<pre style={{whiteSpace:"pre-wrap",background:"#0b1d2d",padding:18,borderRadius:12}}>{JSON.stringify(d,null,2)}</pre>:null}</main>}
