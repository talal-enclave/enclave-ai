"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const AGENTS = [
  {
    slug: "ceo",
    name: "CEO",
    ar: "الإدارة التنفيذية",
    short: "CEO",
    route: "/dashboard",
    description: "الاستراتيجية، القرارات، الأولويات والتنسيق التنفيذي",
    office: "مكتب القيادة والتحكم",
  },
  {
    slug: "hr",
    name: "HR",
    ar: "الموارد البشرية",
    short: "HR",
    route: "/hr",
    description: "إدارة المواهب، القوى العاملة، الأداء والسياسات",
    office: "مكتب رأس المال البشري",
  },
  {
    slug: "finance",
    name: "Finance",
    ar: "المالية",
    short: "FIN",
    route: "/finance",
    description: "التخطيط المالي، الحسابات، التدفقات والتقارير",
    office: "مكتب الإدارة المالية",
  },
  {
    slug: "procurement",
    name: "Procurement",
    ar: "المشتريات",
    short: "PR",
    route: "/procurement",
    description: "الموردون، المنافسات، أوامر الشراء والاستلام",
    office: "مكتب سلسلة التوريد",
  },
  {
    slug: "sales",
    name: "Sales",
    ar: "المبيعات",
    short: "SLS",
    route: "/sales",
    description: "العملاء، الفرص، التسعير والتحصيل التجاري",
    office: "مكتب النمو التجاري",
  },
  {
    slug: "marketing",
    name: "Marketing",
    ar: "التسويق",
    short: "MKT",
    route: "/marketing",
    description: "الحملات، المحتوى، الأداء والإسناد التسويقي",
    office: "مكتب العلامة والنمو",
  },
  {
    slug: "admin",
    name: "Admin",
    ar: "الشؤون الإدارية",
    short: "ADM",
    route: "/admin",
    description: "المرافق، العهد، السجلات والخدمات الإدارية",
    office: "مكتب العمليات الإدارية",
  },
  {
    slug: "legal",
    name: "Legal",
    ar: "القانونية",
    short: "LGL",
    route: "/legal",
    description: "العقود، الخصوصية، النزاهة والمسائل القانونية",
    office: "مكتب الشؤون القانونية",
  },
  {
    slug: "it",
    name: "IT",
    ar: "تقنية المعلومات",
    short: "IT",
    route: "/it",
    description: "الخدمات التقنية، التغيير، الوصول والأمن التقني",
    office: "مكتب التقنية والأمن",
  },
  {
    slug: "audit",
    name: "Audit",
    ar: "التدقيق الداخلي",
    short: "AUD",
    route: "/audit",
    description: "التدقيق، المخاطر، المتابعة والتحقق المستقل",
    office: "مكتب المراجعة والحوكمة",
  },
];

function statusLabel(status) {
  if (status === "completed") return "مكتملة";
  if (status === "in_progress") return "قيد التنفيذ";
  if (status === "cancelled") return "ملغاة";
  return "معلقة";
}

function priorityLabel(priority) {
  if (priority === "critical") return "حرجة";
  if (priority === "high") return "عالية";
  if (priority === "low") return "منخفضة";
  return "عادية";
}

export default function Home() {
  const [selected, setSelected] = useState("ceo");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [agentRegistry, setAgentRegistry] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const activeAgent =
    AGENTS.find((agent) => agent.slug === selected) || AGENTS[0];

  const registryBySlug = Object.fromEntries(
    agentRegistry.map((agent) => [agent.slug, agent])
  );

  const enabledCount = AGENTS.filter(
    (agent) => registryBySlug[agent.slug]?.enabled !== false
  ).length;

  const openTaskCount = allTasks.filter(
    (task) => !["completed", "cancelled"].includes(task.status)
  ).length;

  async function loadOverview() {
    setOverviewLoading(true);

    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/tasks"),
      ]);

      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();

      setAgentRegistry(agentsRes.ok && Array.isArray(agentsData) ? agentsData : []);
      setAllTasks(tasksRes.ok && Array.isArray(tasksData) ? tasksData : []);
    } catch {
      setAgentRegistry([]);
      setAllTasks([]);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadConversations(slug) {
    setHistoryLoading(true);

    try {
      const res = await fetch(`/api/conversations/${slug}`);
      const data = await res.json();
      setConversations(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadTasks(slug) {
    setTasksLoading(true);

    try {
      const res = await fetch(`/api/tasks?agent_slug=${slug}`);
      const data = await res.json();
      setTasks(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function loadApprovals() {
    setApprovalsLoading(true);

    try {
      const res = await fetch("/api/approvals?status=pending");
      const data = await res.json();
      setApprovals(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  }

  async function refreshWorkspace() {
    await Promise.all([
      loadTasks(selected),
      loadApprovals(),
      loadOverview(),
    ]);
  }

  async function updateTaskStatus(taskId, status) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "تعذر تحديث المهمة");
      }

      await refreshWorkspace();
    } catch (err) {
      alert(err.message);
    }
  }

  async function decideApproval(id, decision) {
    try {
      const res = await fetch(`/api/approvals/${id}/${decision}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "تعذر تحديث طلب الموافقة");
      }

      await Promise.all([loadApprovals(), loadOverview()]);
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    loadOverview();
    loadApprovals();
  }, []);

  useEffect(() => {
    loadConversations(selected);
    loadTasks(selected);
  }, [selected]);

  async function openConversation(id) {
    setLoading(true);

    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "تعذر تحميل المحادثة");
      }

      setConversationId(id);
      setMessages(
        (data.messages || []).map((item) => ({
          role: item.role,
          content: item.content,
        }))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage("");
  }

  function changeAgent(slug) {
    setSelected(slug);
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setConversations([]);
    setTasks([]);
  }

  function enterOffice(slug) {
    changeAgent(slug);

    window.setTimeout(() => {
      document
        .getElementById("agent-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!message.trim() || loading) return;

    const userText = message.trim();

    setMessages((previous) => [
      ...previous,
      { role: "user", content: userText },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/${selected}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "تعذر التواصل مع الوكيل");
      }

      const wasNew = !conversationId;

      setConversationId(data.conversation_id);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.message,
        },
      ]);

      if (wasNew) {
        await loadConversations(selected);
      }

      await refreshWorkspace();
    } catch (err) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `حدث خطأ أثناء التواصل مع الوكيل: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.appShell} dir="rtl">
      <header className={styles.topbar}>
        <a className={styles.brand} href="/">
          <img src="/brand/enclave-logo.svg" alt="Enclave" />
          <div>
            <strong>Enclave</strong>
            <span>AI Command Center</span>
          </div>
        </a>

        <nav className={styles.topnav}>
          <a className={styles.navActive} href="/">الرئيسية</a>
          <a href="#offices">الوكلاء</a>
          <a href="/dashboard">لوحة الإدارة</a>
          <a href="#agent-workspace">المهام</a>
          <a href="/document-intelligence">المستندات</a>
          <a href="/company-control">الحوكمة</a>
        </nav>

        <div className={styles.topStatus}>
          <span className={styles.liveDot} />
          <div>
            <strong>{overviewLoading ? "..." : enabledCount}</strong>
            <span>وكلاء جاهزون</span>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <span className={styles.eyebrow}>ENCLAVE AI · DIGITAL WORKFORCE</span>
          <h1>
            فريقك الرقمي
            <br />
            يعمل من أجلك
          </h1>
          <p>
            وكلاء ذكاء اصطناعي متخصصون داخل مكاتب تشغيلية مترابطة،
            يساعدونك على إدارة الأعمال واتخاذ القرار من مركز قيادة واحد.
          </p>

          <div className={styles.heroStats}>
            <div>
              <strong>{overviewLoading ? "—" : enabledCount}</strong>
              <span>وكلاء نشطون</span>
            </div>
            <div>
              <strong>{overviewLoading ? "—" : openTaskCount}</strong>
              <span>مهام مفتوحة</span>
            </div>
            <div>
              <strong>{approvalsLoading ? "—" : approvals.length}</strong>
              <span>موافقات معلقة</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button onClick={() => enterOffice("ceo")}>
              تحدث مع الإدارة التنفيذية
            </button>
            <a href="/dashboard">فتح لوحة الإدارة</a>
          </div>
        </div>

        <div className={styles.ceoOffice}>
          <div className={styles.officeHeader}>
            <div>
              <span className={styles.officeMark}>CEO</span>
              <div>
                <strong>الإدارة التنفيذية</strong>
                <span>مكتب القيادة والتحكم</span>
              </div>
            </div>
            <span className={styles.onlineBadge}>
              <i />
              متصل الآن
            </span>
          </div>

          <div className={styles.executiveScene}>
            <div className={styles.sceneGrid} />
            <div className={styles.scenePanelLeft}>
              <small>مركز القرار</small>
              <strong>جاهز</strong>
              <div className={styles.miniChart}>
                <i /><i /><i /><i /><i />
              </div>
            </div>

            <div className={styles.ceoDesk}>
              <div className={styles.ceoAvatar}>
                <span />
              </div>
              <div className={styles.monitor} />
              <div className={styles.deskSurface} />
              <div className={styles.deskLeg} />
            </div>

            <div className={styles.sceneMessage}>
              <span>مرحبًا بك</span>
              <strong>كل مكتب لديه وكيله المتخصص.</strong>
              <small>اختر أي مكتب وابدأ العمل مباشرة.</small>
            </div>

            <div className={styles.scenePanelRight}>
              <small>حالة المنصة</small>
              <div className={styles.statusRing}>
                <span>{enabledCount}</span>
              </div>
              <strong>وكلاء جاهزون</strong>
            </div>

            <div className={`${styles.plant} ${styles.plantRight}`}>
              <i /><i /><i />
            </div>
            <div className={`${styles.plant} ${styles.plantLeft}`}>
              <i /><i /><i />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.officeSection} id="offices">
        <div className={styles.sectionHeading}>
          <div>
            <span>AI OFFICES</span>
            <h2>مكاتب الوكلاء</h2>
          </div>
          <p>
            كل مكتب يمثل إدارة مستقلة، والوكيل داخل المكتب مرتبط
            بأدوات ووظائف الإدارة نفسها.
          </p>
        </div>

        <div className={styles.officeGrid}>
          {AGENTS.filter((agent) => agent.slug !== "ceo").map((agent) => {
            const registry = registryBySlug[agent.slug];
            const online = registry ? registry.enabled === true : true;
            const agentOpenTasks = allTasks.filter(
              (task) =>
                task.agent_slug === agent.slug &&
                !["completed", "cancelled"].includes(task.status)
            ).length;

            return (
              <article
                className={`${styles.officeCard} ${
                  selected === agent.slug ? styles.officeCardSelected : ""
                }`}
                key={agent.slug}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIdentity}>
                    <span className={styles.agentIcon}>{agent.short}</span>
                    <div>
                      <h3>{agent.ar}</h3>
                      <span>{agent.name}</span>
                    </div>
                  </div>

                  <span className={online ? styles.onlineBadge : styles.offlineBadge}>
                    <i />
                    {online ? "متصل الآن" : "غير متاح"}
                  </span>
                </div>

                <div className={styles.miniOffice}>
                  <div className={styles.miniWall}>
                    <div className={styles.miniBars}>
                      <i /><i /><i /><i />
                    </div>
                    <div className={styles.miniData}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className={styles.miniAgent}>
                    <i />
                  </div>
                  <div className={styles.miniDesk}>
                    <span />
                  </div>
                  <div className={styles.miniChair} />
                  <div className={styles.miniPlant}>
                    <i /><i /><i />
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <strong>{agent.office}</strong>
                  <p>{agent.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span>
                    {agentOpenTasks} مهام مفتوحة
                  </span>
                  <div>
                    <button onClick={() => enterOffice(agent.slug)}>
                      تحدث مع الوكيل
                    </button>
                    <a href={agent.route}>فتح الإدارة</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.workspaceSection} id="agent-workspace">
        <div className={styles.workspaceHeader}>
          <div>
            <span className={styles.workspaceKicker}>ACTIVE OFFICE</span>
            <h2>{activeAgent.ar}</h2>
            <p>{activeAgent.description}</p>
          </div>

          <div className={styles.workspaceActions}>
            <span className={styles.onlineBadge}>
              <i />
              {registryBySlug[selected]?.enabled === false ? "غير متاح" : "متصل الآن"}
            </span>
            <a href={activeAgent.route}>فتح نظام الإدارة</a>
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          <aside className={styles.workspaceSidebar}>
            <div className={styles.sideBlock}>
              <div className={styles.sideTitle}>
                <strong>المحادثات</strong>
                <button onClick={newConversation}>+ جديدة</button>
              </div>

              {historyLoading && <p className={styles.mutedText}>جاري التحميل...</p>}

              {!historyLoading && conversations.length === 0 && (
                <p className={styles.emptySmall}>لا توجد محادثات سابقة.</p>
              )}

              <div className={styles.conversationList}>
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={
                      conversationId === conversation.id
                        ? styles.conversationActive
                        : ""
                    }
                    onClick={() => openConversation(conversation.id)}
                  >
                    <strong>{conversation.title || "محادثة"}</strong>
                    <span>{conversation.created_at || ""}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideTitle}>
                <strong>مهام المكتب</strong>
                <span>{tasks.length}</span>
              </div>

              {tasksLoading && <p className={styles.mutedText}>جاري التحميل...</p>}

              {!tasksLoading && tasks.length === 0 && (
                <p className={styles.emptySmall}>لا توجد مهام لهذا الوكيل.</p>
              )}

              <div className={styles.taskList}>
                {tasks.slice(0, 6).map((task) => (
                  <div className={styles.taskItem} key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        {statusLabel(task.status)} · {priorityLabel(task.priority)}
                      </span>
                    </div>

                    {task.status !== "completed" && task.status !== "cancelled" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "completed")}
                      >
                        إنهاء
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sideBlock}>
              <div className={styles.sideTitle}>
                <strong>الموافقات المعلقة</strong>
                <span>{approvals.length}</span>
              </div>

              {approvalsLoading && <p className={styles.mutedText}>جاري التحميل...</p>}

              {!approvalsLoading && approvals.length === 0 && (
                <p className={styles.emptySmall}>لا توجد موافقات معلقة.</p>
              )}

              <div className={styles.approvalList}>
                {approvals.slice(0, 4).map((approval) => (
                  <div className={styles.approvalItem} key={approval.id}>
                    <strong>{approval.title}</strong>
                    <span>{approval.risk_level || "normal"}</span>
                    <div>
                      <button
                        onClick={() => decideApproval(approval.id, "approve")}
                      >
                        اعتماد
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => decideApproval(approval.id, "reject")}
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <div className={styles.chatAgentBadge}>{activeAgent.short}</div>
              <div>
                <strong>{activeAgent.ar}</strong>
                <span>{activeAgent.office}</span>
              </div>
              <span className={styles.chatOnline}>
                <i />
                Online
              </span>
            </div>

            <div className={styles.messagesArea}>
              {messages.length === 0 && (
                <div className={styles.chatEmpty}>
                  <div className={styles.emptyOfficeIcon}>
                    <span>{activeAgent.short}</span>
                  </div>
                  <h3>كيف أقدر أخدمك اليوم؟</h3>
                  <p>ابدأ محادثة مع {activeAgent.ar}</p>
                </div>
              )}

              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={
                    item.role === "user"
                      ? styles.userMessageRow
                      : styles.agentMessageRow
                  }
                >
                  <div
                    className={
                      item.role === "user"
                        ? styles.userMessage
                        : styles.agentMessage
                    }
                  >
                    {item.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={styles.typing}>
                  <i /><i /><i />
                  الوكيل يقوم بتحليل طلبك...
                </div>
              )}
            </div>

            <form className={styles.chatComposer} onSubmit={sendMessage}>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={`اسأل ${activeAgent.ar}...`}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                إرسال
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <img src="/brand/enclave-logo.svg" alt="Enclave" />
          <div>
            <strong>Enclave</strong>
            <span>AI Agents for a Smarter Business</span>
          </div>
        </div>

        <p>من وكلاء متخصصين إلى مؤسسة تعمل بذكاء مترابط.</p>

        <span className={styles.footerStatus}>
          <i />
          النظام جاهز
        </span>
      </footer>
    </main>
  );
}
