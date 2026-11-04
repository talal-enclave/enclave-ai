"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const OFFICES = [
  ["hr","الموارد البشرية","HR"],
  ["finance","المالية","FIN"],
  ["sales","المبيعات","SLS"],
  ["procurement","المشتريات","PR"],
  ["marketing","التسويق","MKT"],
  ["admin","الشؤون الإدارية","ADM"],
  ["legal","الشؤون القانونية","LEG"],
  ["it","تقنية المعلومات","IT"],
  ["audit","التدقيق والمخاطر","AUD"],
];

const KEYWORDS = {
  finance: [
    "مالية","مالي","المالية","فاتورة","فواتير",
    "فوترة","تحصيل","دفعة","دفعات","عرض مالي",
    "تسعير","سعر","invoice","billing","finance",
    "payment","collection","pricing"
  ],
  sales: [
    "مبيعات","عميل","عملاء","فرصة","فرص",
    "عرض فني","عرض تجاري","proposal","sales",
    "client","customer","opportunity","lead"
  ],
  hr: [
    "موظف","موظفين","توظيف","موارد بشرية",
    "راتب","رواتب","إجازة","اجازة","hr",
    "employee","recruitment","payroll","leave"
  ],
  procurement: [
    "مشتريات","شراء","مورد","موردين","توريد",
    "procurement","supplier","purchase","vendor"
  ],
  marketing: [
    "تسويق","حملة","محتوى","إعلان","اعلان",
    "marketing","campaign","content"
  ],
  admin: [
    "إداري","اداري","إدارية","ادارية",
    "مرفق","مرافق","عنوان وطني","admin",
    "facility","office"
  ],
  legal: [
    "قانون","قانوني","عقد","عقود","nda",
    "legal","contract","agreement"
  ],
  it: [
    "تقنية","نظام","أنظمة","انظمة","it",
    "system","technology","technical"
  ],
  audit: [
    "تدقيق","مراجعة داخلية","مخاطر","حوكمة",
    "audit","risk","governance"
  ],
};

function asList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function inferOffices(text) {
  const source = String(text || "").toLowerCase();

  return Object.entries(KEYWORDS)
    .filter(([, words]) =>
      words.some((word) =>
        source.includes(word.toLowerCase())
      )
    )
    .map(([slug]) => slug);
}

function officeLabel(status) {
  if (status === "waiting_approval") {
    return "بانتظار اعتمادك";
  }
  if (status === "active") {
    return "جارٍ التنفيذ";
  }
  return "متاح";
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] =
    useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] =
    useState([]);
  const [pendingFiles, setPendingFiles] =
    useState([]);
  const [attachments, setAttachments] =
    useState([]);
  const [approvals, setApprovals] =
    useState([]);
  const [remoteOffices, setRemoteOffices] =
    useState([]);
  const [localBusy, setLocalBusy] =
    useState([]);
  const [dailyReport, setDailyReport] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [uploading, setUploading] =
    useState(false);
  const [error, setError] =
    useState("");

  const officeMap = useMemo(() => {
    const value = {};
    for (const row of remoteOffices) {
      value[row.slug] = row;
    }
    return value;
  }, [remoteOffices]);

  async function loadConversations() {
    try {
      const res = await fetch(
        "/api/conversations/ceo"
      );
      const data = await res.json();
      if (res.ok) {
        setConversations(asList(data));
      }
    } catch {
      setConversations([]);
    }
  }

  async function loadApprovals() {
    try {
      const res = await fetch(
        "/api/approvals?status=pending"
      );
      const data = await res.json();
      if (res.ok) {
        setApprovals(asList(data));
      }
    } catch {
      setApprovals([]);
    }
  }

  async function loadOfficeStatus() {
    try {
      const res = await fetch(
        "/api/ceo/office-status"
      );
      const data = await res.json();
      if (res.ok) {
        setRemoteOffices(
          Array.isArray(data.offices)
            ? data.offices
            : []
        );
      }
    } catch {
      setRemoteOffices([]);
    }
  }

  async function loadDailyReport() {
    try {
      const res = await fetch(
        "/api/operations/daily-report"
      );
      const data = await res.json();
      if (res.ok) setDailyReport(data);
    } catch {
      setDailyReport(null);
    }
  }

  async function refreshSide() {
    await Promise.all([
      loadApprovals(),
      loadOfficeStatus(),
      loadDailyReport(),
    ]);
  }

  useEffect(() => {
    loadConversations();
    refreshSide();

    const timer = window.setInterval(
      refreshSide,
      5000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  async function loadAttachments(id) {
    if (!id) {
      setAttachments([]);
      return;
    }

    try {
      const params =
        new URLSearchParams({
          module: "ceo_chat",
          entity_type: "conversation",
          entity_id: id,
          status: "active",
        });

      const res = await fetch(
        `/api/hr/attachments?${params.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        setAttachments(asList(data));
      }
    } catch {
      setAttachments([]);
    }
  }

  async function openConversation(id) {
    if (!id || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/conversations/${id}/messages`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || "تعذر تحميل المحادثة"
        );
      }

      setConversationId(id);
      const rows = asList(
        data.messages || data
      );

      setMessages(
        rows.map((item) => ({
          role: item.role,
          content: item.content,
        }))
      );

      await loadAttachments(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setPendingFiles([]);
    setAttachments([]);
    setLocalBusy([]);
    setError("");
  }

  async function ensureConversation(id) {
    if (id) return id;

    const res = await fetch(
      "/api/ceo/conversations/bootstrap",
      { method: "POST" }
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.detail || "تعذر إنشاء المحادثة"
      );
    }

    setConversationId(data.conversation_id);
    return data.conversation_id;
  }

  async function uploadFiles(id, files) {
    const uploaded = [];

    for (const file of files) {
      const form = new FormData();
      form.append("module", "ceo_chat");
      form.append("entity_type", "conversation");
      form.append("entity_id", id);
      form.append("document_type", "ceo_reference");
      form.append("uploaded_by", "user");
      form.append(
        "confidentiality_level",
        "confidential"
      );
      form.append("title", file.name);
      form.append(
        "description",
        "CEO command source attachment"
      );
      form.append("file", file);

      const res = await fetch(
        "/api/hr/attachments/upload",
        {
          method: "POST",
          body: form,
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || `تعذر رفع ${file.name}`
        );
      }

      uploaded.push(data);
    }

    return uploaded;
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (
      loading
      || uploading
      || (
        !message.trim()
        && pendingFiles.length === 0
      )
    ) {
      return;
    }

    const userText =
      message.trim()
      || "راجع الملفات المرفقة ونفّذ المطلوب.";

    setLocalBusy(
      inferOffices(userText)
    );
    setLoading(true);
    setError("");

    const oldId = conversationId;

    try {
      let activeId = conversationId;
      let uploadedNow = [];

      if (pendingFiles.length) {
        setUploading(true);
        activeId =
          await ensureConversation(activeId);
        uploadedNow =
          await uploadFiles(
            activeId,
            pendingFiles
          );
        setPendingFiles([]);
        await loadAttachments(activeId);
      }

      const names = uploadedNow
        .map((row) =>
          row.original_file_name || row.title
        )
        .filter(Boolean);

      setMessages((previous) => [
        ...previous,
        {
          role: "user",
          content:
            userText
            + (
              names.length
                ? "\n\n📎 "
                  + names.join("\n📎 ")
                : ""
            ),
        },
      ]);

      setMessage("");

      const res = await fetch(
        "/api/chat/ceo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: userText,
            conversation_id: activeId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail
          || "تعذر تنفيذ الطلب"
        );
      }

      setConversationId(
        data.conversation_id
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.message,
        },
      ]);

      if (!oldId) {
        await loadConversations();
      }

      await Promise.all([
        loadAttachments(
          data.conversation_id
        ),
        refreshSide(),
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            `تعذر إكمال الطلب: ${err.message}`,
        },
      ]);
    } finally {
      setUploading(false);
      setLoading(false);
      setLocalBusy([]);

      window.setTimeout(
        loadOfficeStatus,
        350
      );
    }
  }

  async function decideApproval(
    id,
    decision
  ) {
    try {
      const res = await fetch(
        `/api/approvals/${id}/${decision}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            reason:
              decision === "approve"
                ? "Approved from CEO-only command center"
                : "Rejected from CEO-only command center",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || "تعذر تنفيذ القرار"
        );
      }

      await refreshSide();
    } catch (err) {
      setError(err.message);
    }
  }

  const finance =
    dailyReport?.commercial_finance || {};
  const tasks =
    dailyReport?.tasks || {};

  return (
    <main className="shell" dir="rtl">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#06191f;color:#f6fbfc}
        button,input{font:inherit}
        .shell{
          min-height:100vh;
          padding:24px;
          font-family:Arial,"Segoe UI",sans-serif;
          background:
            radial-gradient(circle at 50% 0%,rgba(29,144,143,.16),transparent 32%),
            linear-gradient(180deg,#061c23,#04151b)
        }
        .top{
          max-width:1550px;margin:0 auto 18px;
          display:flex;align-items:center;justify-content:space-between;gap:14px
        }
        .brand{display:flex;gap:11px;align-items:center}
        .brand img{width:44px;height:44px}
        .brand strong{font-size:24px}
        .sub{font-size:11px;color:#72cfc7;margin-top:4px}
        .new{
          border:1px solid rgba(55,220,203,.35);
          color:#cffff9;background:rgba(19,102,101,.18);
          border-radius:10px;padding:10px 14px;cursor:pointer
        }
        .layout{
          max-width:1550px;margin:auto;
          display:grid;grid-template-columns:minmax(0,1fr) 400px;
          gap:18px;align-items:start
        }
        .panel{
          background:rgba(5,38,47,.9);
          border:1px solid rgba(70,205,195,.2);
          border-radius:17px;overflow:hidden
        }
        .chatHead{
          padding:18px 20px;border-bottom:1px solid rgba(70,205,195,.14);
          display:flex;align-items:center;justify-content:space-between
        }
        .ceoLine{display:flex;gap:11px;align-items:center}
        .ceo{
          width:46px;height:46px;border-radius:13px;display:grid;place-items:center;
          background:linear-gradient(135deg,#dbfffb,#2bdec9);color:#05272e;font-weight:900
        }
        .chatBody{min-height:550px;max-height:65vh;overflow:auto;padding:22px}
        .empty{min-height:420px;display:grid;place-items:center;text-align:center;color:#92bbbb}
        .empty h2{color:#fff;font-size:28px;margin:0 0 10px}
        .row{display:flex;margin-bottom:14px}
        .row.user{justify-content:flex-start}
        .row.assistant{justify-content:flex-end}
        .bubble{
          max-width:82%;padding:13px 16px;border-radius:14px;white-space:pre-wrap;line-height:1.8
        }
        .user .bubble{background:linear-gradient(135deg,#38dbc7,#198f89);color:#04262d;font-weight:650}
        .assistant .bubble{background:#0a3943;border:1px solid rgba(87,218,207,.18)}
        .typing{font-size:12px;color:#72e2d5}
        .composerBox{padding:15px;border-top:1px solid rgba(70,205,195,.14)}
        .chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
        .chip{
          padding:6px 9px;border-radius:8px;font-size:11px;text-decoration:none;color:#e3fffb;
          background:rgba(25,100,103,.18);border:1px solid rgba(70,205,195,.25)
        }
        .chip button{border:0;background:none;color:inherit;cursor:pointer}
        .composer{display:flex;gap:8px}
        .attach{
          width:46px;min-width:46px;display:grid;place-items:center;cursor:pointer;font-size:19px;
          border-radius:11px;background:#0a3943;border:1px solid rgba(70,205,195,.25)
        }
        .composer input[type=text]{
          flex:1;min-width:0;background:#082c35;color:white;
          border:1px solid rgba(70,205,195,.22);border-radius:11px;padding:13px;outline:none
        }
        .send{
          min-width:92px;border:0;border-radius:11px;background:linear-gradient(135deg,#68f0e0,#24b7a9);
          color:#03242a;font-weight:900;cursor:pointer
        }
        .side{display:grid;gap:14px}
        .sideBox{padding:16px}
        .sideBox h3{margin:0 0 11px;font-size:16px}
        .hint{font-size:10px;line-height:1.6;color:#799fa1;margin-bottom:10px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .office{
          position:relative;min-height:100px;border-radius:12px;padding:10px;overflow:hidden;
          background:linear-gradient(180deg,rgba(8,63,72,.74),rgba(4,38,46,.94));
          border:1px solid rgba(70,205,195,.17);transition:.25s
        }
        .office.active{
          border-color:#4ff5dc;
          box-shadow:0 0 8px rgba(55,255,224,.72),0 0 27px rgba(33,216,193,.35);
          animation:pulse 1.3s ease-in-out infinite
        }
        .office.waiting{
          border-color:#ffc365;
          box-shadow:0 0 11px rgba(255,183,68,.48)
        }
        @keyframes pulse{50%{filter:brightness(1.27)}}
        .short{
          width:30px;height:30px;border-radius:8px;display:grid;place-items:center;
          background:linear-gradient(135deg,#ddfffb,#2cdcc8);color:#073038;
          font-size:9px;font-weight:900;margin-bottom:7px
        }
        .officeName{font-size:11px;font-weight:800}
        .officeState{font-size:9px;color:#759fa1;margin-top:7px}
        .active .officeState{color:#71ffe7}
        .waiting .officeState{color:#ffd18a}
        .approval{padding:10px 0;border-top:1px solid rgba(70,205,195,.11)}
        .approval:first-of-type{border-top:0}
        .approval strong{font-size:11px;display:block}
        .approval small{color:#86a8aa}
        .actions{display:flex;gap:6px;margin-top:7px}
        .ok,.no{border-radius:7px;padding:5px 8px;font-size:9px;cursor:pointer}
        .ok{color:#a5ffec;border:1px solid rgba(62,230,191,.45);background:rgba(21,113,93,.2)}
        .no{color:#ffc2c8;border:1px solid rgba(255,109,122,.4);background:rgba(130,31,41,.2)}
        .history{display:grid;gap:6px;max-height:175px;overflow:auto}
        .history button{
          text-align:right;padding:8px;border-radius:8px;cursor:pointer;color:#e8fffc;
          border:1px solid rgba(70,205,195,.12);background:rgba(8,48,57,.75)
        }
        .metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
        .metric{padding:10px;border-radius:9px;background:#082f38;border:1px solid rgba(70,205,195,.1)}
        .metric b{display:block;font-size:18px}
        .metric span{font-size:9px;color:#83a7a9}
        .error{
          max-width:1550px;margin:0 auto 12px;padding:10px 13px;border-radius:9px;
          color:#ffc2c8;border:1px solid rgba(255,109,122,.4);background:rgba(130,31,41,.2)
        }
        .foot{font-size:9px;color:#638b8e;text-align:center;margin-top:8px}
        @media(max-width:1000px){.layout{grid-template-columns:1fr}}
        @media(max-width:600px){
          .shell{padding:10px}.grid{grid-template-columns:repeat(2,1fr)}
          .composer{flex-wrap:wrap}.send{min-height:44px}
        }
      `}</style>

      <header className="top">
        <div className="brand">
          <img
            src="/brand/enclave-logo.svg"
            alt="Enclave"
          />
          <div>
            <strong>
              مكتب الرئيس التنفيذي
            </strong>
            <div className="sub">
              CEO-Only Command Center · الإدارات تعمل خلف الكواليس
            </div>
          </div>
        </div>

        <button
          className="new"
          onClick={newConversation}
        >
          + محادثة جديدة
        </button>
      </header>

      {error ? (
        <div className="error">
          {error}
        </div>
      ) : null}

      <div className="layout">
        <section className="panel">
          <div className="chatHead">
            <div className="ceoLine">
              <div className="ceo">
                CEO
              </div>
              <div>
                <strong>
                  الرئيس التنفيذي
                </strong>
                <div className="sub">
                  أنت تتعامل معه فقط، وهو يدير الإدارات داخليًا
                </div>
              </div>
            </div>

            <span
              className="sub"
              style={{
                color: loading
                  ? "#6affea"
                  : "#70a3a4",
              }}
            >
              ●{" "}
              {loading
                ? "جارٍ التنفيذ"
                : "جاهز"}
            </span>
          </div>

          <div className="chatBody">
            {messages.length === 0 ? (
              <div className="empty">
                <div>
                  <h2>
                    وش تبي ننجز؟
                  </h2>
                  <div>
                    قل للرئيس التنفيذي طلبك مباشرة وارفق الملفات إذا احتجت.
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 9,
                    }}
                  >
                    مثال: جهز العرض المالي لشوري، تابع فهد، أو طلع لي الفاتورة المستحقة.
                  </div>
                </div>
              </div>
            ) : (
              messages.map(
                (item, index) => (
                  <div
                    className={
                      `row ${item.role === "user" ? "user" : "assistant"}`
                    }
                    key={index}
                  >
                    <div className="bubble">
                      {item.content}
                    </div>
                  </div>
                )
              )
            )}

            {loading ? (
              <div className="typing">
                الرئيس التنفيذي ينسق التنفيذ مع الإدارات المعنية...
              </div>
            ) : null}
          </div>

          <div className="composerBox">
            {(
              pendingFiles.length
              || attachments.length
            ) ? (
              <div className="chips">
                {pendingFiles.map(
                  (file, index) => (
                    <span
                      className="chip"
                      key={
                        `${file.name}-${index}`
                      }
                    >
                      📎 {file.name}
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles(
                            (previous) =>
                              previous.filter(
                                (_, i) =>
                                  i !== index
                              )
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  )
                )}

                {attachments.map(
                  (item) => (
                    <a
                      className="chip"
                      key={item.id}
                      href={item.download_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📄{" "}
                      {item.original_file_name
                        || item.title
                        || "ملف"}
                    </a>
                  )
                )}
              </div>
            ) : null}

            <form
              className="composer"
              onSubmit={sendMessage}
            >
              <label className="attach">
                📎
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.csv"
                  disabled={
                    loading || uploading
                  }
                  onChange={(event) => {
                    const files =
                      Array.from(
                        event.target.files || []
                      );

                    setPendingFiles(
                      (previous) => [
                        ...previous,
                        ...files,
                      ].slice(0, 10)
                    );

                    event.target.value = "";
                  }}
                  style={{
                    display: "none",
                  }}
                />
              </label>

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="قل للرئيس التنفيذي وش تبي..."
                disabled={
                  loading || uploading
                }
              />

              <button
                className="send"
                type="submit"
                disabled={
                  loading || uploading
                }
              >
                {uploading
                  ? "رفع..."
                  : loading
                    ? "ينفذ..."
                    : "إرسال"}
              </button>
            </form>

            <div className="foot">
              لا يوجد دفع أو إرسال خارجي أو التزام مالي خارج ضوابط النظام والاعتمادات.
            </div>
          </div>
        </section>

        <aside className="side">
          <section className="panel sideBox">
            <h3>
              نشاط الإدارات
            </h3>
            <div className="hint">
              المكاتب هنا مؤشرات فقط. إذا دخلت إدارة في تنفيذ طلبك تنوّر، وبعد انتهاء العمل ترجع للوضع الطبيعي.
            </div>

            <div className="grid">
              {OFFICES.map(
                ([slug, name, short]) => {
                  const remote =
                    officeMap[slug];

                  let status =
                    remote?.status
                    || "idle";

                  if (
                    localBusy.includes(slug)
                  ) {
                    status = "active";
                  }

                  return (
                    <div
                      key={slug}
                      className={
                        `office ${status === "active" ? "active" : status === "waiting_approval" ? "waiting" : ""}`
                      }
                    >
                      <div className="short">
                        {short}
                      </div>
                      <div className="officeName">
                        {name}
                      </div>
                      <div className="officeState">
                        {officeLabel(status)}
                        {remote?.open_tasks
                          ? ` · ${remote.open_tasks} مهمة`
                          : ""}
                        {remote?.pending_approvals
                          ? ` · ${remote.pending_approvals} اعتماد`
                          : ""}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="panel sideBox">
            <h3>
              قرارات تحتاجك
            </h3>

            {approvals.length === 0 ? (
              <div className="hint">
                ما فيه اعتماد معلق حاليًا.
              </div>
            ) : (
              approvals
                .slice(0, 6)
                .map((item) => (
                  <div
                    className="approval"
                    key={item.id}
                  >
                    <strong>
                      {item.title
                        || item.action_type
                        || "اعتماد"}
                    </strong>
                    <small>
                      {item.risk_level
                        ? `المخاطر: ${item.risk_level}`
                        : "بانتظار قرارك"}
                    </small>

                    <div className="actions">
                      <button
                        className="ok"
                        onClick={() =>
                          decideApproval(
                            item.id,
                            "approve"
                          )
                        }
                      >
                        اعتماد
                      </button>
                      <button
                        className="no"
                        onClick={() =>
                          decideApproval(
                            item.id,
                            "reject"
                          )
                        }
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))
            )}
          </section>

          <section className="panel sideBox">
            <h3>
              موجز اليوم
            </h3>

            <div className="metrics">
              <div className="metric">
                <b>
                  {finance
                    ?.ready_for_approval
                    ?? 0}
                </b>
                <span>
                  فواتير للاعتماد
                </span>
              </div>
              <div className="metric">
                <b>
                  {tasks
                    ?.overdue
                    ?? tasks?.open
                    ?? 0}
                </b>
                <span>
                  أعمال مفتوحة
                </span>
              </div>
            </div>

            <div
              className="hint"
              style={{
                marginTop: 9,
                marginBottom: 0,
              }}
            >
              اطلب من الرئيس التنفيذي: «عطني تقرير اليوم».
            </div>
          </section>

          <section className="panel sideBox">
            <h3>
              محادثات الرئيس التنفيذي
            </h3>

            <div className="history">
              {conversations.length === 0 ? (
                <div className="hint">
                  ما فيه محادثات سابقة.
                </div>
              ) : (
                conversations
                  .slice(0, 8)
                  .map(
                    (item, index) => (
                      <button
                        key={
                          item.id || index
                        }
                        onClick={() =>
                          openConversation(
                            item.id
                          )
                        }
                      >
                        {item.title
                          || `محادثة ${index + 1}`}
                      </button>
                    )
                  )
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
