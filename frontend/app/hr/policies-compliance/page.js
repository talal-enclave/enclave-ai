"use client";

import { useEffect, useMemo, useState } from "react";

const C = {
  bg: "#06131e",
  panel: "#0b1d2d",
  soft: "#142b3d",
  primary: "#18d5b7",
  text: "#f7fafc",
  muted: "#71c8c1",
  border: "rgba(255,255,255,.09)",
  danger: "#ff6b6b",
  warning: "#f5c96b",
  blue: "#72b7ff",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  background: C.soft,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "11px 12px",
  outline: "none",
};

const label = {
  display: "block",
  color: C.muted,
  fontSize: 12,
  marginBottom: 6,
};

function Badge({ children }) {
  const value = String(children || "").toLowerCase();

  const s =
    ["approved", "completed", "resolved", "current"].includes(value)
      ? { color: C.primary, background: "rgba(24,213,183,.10)" }
      : ["review", "review_due", "due_soon", "pending", "in_progress"].includes(value)
      ? { color: C.warning, background: "rgba(245,201,107,.10)" }
      : ["overdue", "critical", "archived"].includes(value)
      ? { color: C.danger, background: "rgba(255,107,107,.10)" }
      : { color: C.blue, background: "rgba(114,183,255,.10)" };

  return (
    <span
      style={{
        ...s,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-block",
        textTransform: "capitalize",
      }}
    >
      {String(children || "—").replaceAll("_", " ")}
    </span>
  );
}

function StatCard({ title, value, subtitle, accent = C.primary }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div style={{ color: C.muted, fontSize: 12 }}>{title}</div>
      <div
        style={{
          color: accent,
          fontSize: 29,
          fontWeight: 850,
          marginTop: 8,
        }}
      >
        {value ?? 0}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
        {subtitle}
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        color: C.muted,
        border: `1px dashed ${C.border}`,
        borderRadius: 12,
        padding: 25,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function HRPoliciesCompliancePage() {
  const [policies, setPolicies] = useState([]);
  const [versions, setVersions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [versionFile, setVersionFile] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState({});

  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [analyzingVersionId, setAnalyzingVersionId] =
    useState("");
  const [conflictAnalysisResults, setConflictAnalysisResults] =
    useState({});

  const [impactAssessments, setImpactAssessments] = useState([]);
  const [impactItems, setImpactItems] = useState([]);
  const [enforcementRules, setEnforcementRules] = useState([]);
  const [policyMismatches, setPolicyMismatches] = useState([]);
  const [technicalVerifications, setTechnicalVerifications] =
    useState([]);

  const [policyItTasks, setPolicyItTasks] = useState([]);
  const [policyApprovals, setPolicyApprovals] = useState([]);
  const [changeDecisions, setChangeDecisions] = useState([]);

  const [decidingChangeId, setDecidingChangeId] = useState("");

  const [editingImpactId, setEditingImpactId] = useState("");
  const [impactEditForm, setImpactEditForm] = useState(null);
  const [savingImpactEdit, setSavingImpactEdit] = useState(false);

  const [updatingItTaskId, setUpdatingItTaskId] = useState("");
  const [verifyingMismatchId, setVerifyingMismatchId] = useState("");
  const [decidingApprovalId, setDecidingApprovalId] = useState("");

  const [analyzingImpactVersionId, setAnalyzingImpactVersionId] =
    useState("");

  const [impactAnalysisResults, setImpactAnalysisResults] =
    useState({});

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [policyForm, setPolicyForm] = useState({
    code: "",
    title_ar: "",
    title_en: "",
    category: "hr_policy",
    scope: "all_employees",
    policy_owner: "",
    description: "",
  });

  const [versionForm, setVersionForm] = useState({
    policy_id: "",
    version_number: "1.0",
    effective_date: "",
    review_date: "",
    prepared_by: "",
    change_summary: "",
    content_text: "",
  });

  const [conflictForm, setConflictForm] = useState({
    source_version_id: "",
    conflicting_version_id: "",
    conflict_type: "content_conflict",
    severity: "medium",
    description: "",
  });

  const [checklistForm, setChecklistForm] = useState({
    code: "",
    title: "",
    category: "hr_compliance",
    frequency: "annual",
    responsible_owner: "",
    due_date: "",
    description: "",
  });

  const [itemForm, setItemForm] = useState({
    checklist_id: "",
    item_order: "1",
    title: "",
    requirement_reference: "",
    responsible_owner: "",
    due_date: "",
  });

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || `Request failed: ${response.status}`);
    }

    return data;
  }

  async function load() {
    try {
      setError("");

      const [
        p,
        v,
        c,
        ch,
        i,
        a,
        s,
        attachmentData,
        impactAssessmentData,
        impactItemData,
        enforcementRuleData,
        mismatchData,
        verificationData,
        taskData,
        approvalData,
        changeDecisionData,
      ] = await Promise.all([
        api("/api/hr/policies"),
        api("/api/hr/policy-versions"),
        api("/api/hr/policy-conflicts"),
        api("/api/hr/compliance-checklists"),
        api("/api/hr/compliance-checklist-items"),
        api("/api/hr/policies-compliance/alerts"),
        api("/api/hr/policies-compliance/summary"),
        api(
          "/api/hr/attachments?module=policies_compliance&status=active"
        ),
        api("/api/policy-impact/assessments"),
        api("/api/policy-impact/items"),
        api("/api/policy-impact/enforcement-rules"),
        api("/api/policy-impact/mismatches"),
        api("/api/policy-impact/technical-verifications"),
        api("/api/tasks?agent_slug=it"),
        api("/api/approvals"),
        api("/api/policy-impact/change-decisions"),
      ]);

      setPolicies(Array.isArray(p) ? p : []);
      setVersions(Array.isArray(v) ? v : []);
      setConflicts(Array.isArray(c) ? c : []);
      setChecklists(Array.isArray(ch) ? ch : []);
      setItems(Array.isArray(i) ? i : []);
      setAlerts(Array.isArray(a) ? a : []);
      setSummary(s || {});

      setImpactAssessments(
        Array.isArray(impactAssessmentData)
          ? impactAssessmentData
          : []
      );

      setImpactItems(
        Array.isArray(impactItemData)
          ? impactItemData
          : []
      );

      setEnforcementRules(
        Array.isArray(enforcementRuleData)
          ? enforcementRuleData
          : []
      );

      setPolicyMismatches(
        Array.isArray(mismatchData)
          ? mismatchData
          : []
      );

      setTechnicalVerifications(
        Array.isArray(verificationData)
          ? verificationData
          : []
      );

      setPolicyItTasks(
        Array.isArray(taskData)
          ? taskData
          : []
      );

      setPolicyApprovals(
        Array.isArray(approvalData)
          ? approvalData
          : []
      );

      setChangeDecisions(
        Array.isArray(changeDecisionData)
          ? changeDecisionData
          : []
      );

      setAttachments(
        Array.isArray(attachmentData)
          ? attachmentData
          : []
      );
    } catch (err) {
      setError(err?.message || "Unable to load Policies & Compliance");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function attachmentsFor(entityType, entityId) {
    return attachments.filter(
      (item) =>
        item.entity_type === entityType &&
        String(item.entity_id) ===
          String(entityId)
    );
  }

  async function uploadUnifiedAttachment({
    entityType,
    entityId,
    documentType,
    file,
    uploadedBy = "HR",
    title = null,
  }) {
    const formData = new FormData();

    formData.append(
      "module",
      "policies_compliance"
    );

    formData.append(
      "entity_type",
      entityType
    );

    formData.append(
      "entity_id",
      String(entityId)
    );

    formData.append(
      "document_type",
      documentType
    );

    formData.append(
      "uploaded_by",
      uploadedBy || "HR"
    );

    formData.append(
      "confidentiality_level",
      "confidential"
    );

    if (title) {
      formData.append(
        "title",
        title
      );
    }

    formData.append(
      "file",
      file
    );

    const response = await fetch(
      "/api/hr/attachments/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          `Attachment upload failed: ${response.status}`
      );
    }

    return data;
  }

  async function archiveAttachment(item) {
    const reason = window.prompt(
      "Archive reason / سبب أرشفة المرفق:"
    );

    if (!reason) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api(
        `/api/hr/attachments/${item.id}/archive`,
        {
          method: "PUT",
          body: JSON.stringify({
            archived_by: "HR",
            reason: reason.trim(),
          }),
        }
      );

      setMessage(
        "Attachment archived successfully."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to archive attachment"
      );
    } finally {
      setSaving(false);
    }
  }

  const policyMap = useMemo(
    () =>
      Object.fromEntries(
        policies.map((row) => [
          row.id,
          `${row.code} — ${row.title_en || row.title_ar}`,
        ])
      ),
    [policies]
  );

  const versionMap = useMemo(
    () =>
      Object.fromEntries(
        versions.map((row) => [
          row.id,
          `${policyMap[row.policy_id] || row.policy_id} • V${row.version_number}`,
        ])
      ),
    [versions, policyMap]
  );

  const checklistMap = useMemo(
    () =>
      Object.fromEntries(
        checklists.map((row) => [row.id, `${row.code} — ${row.title}`])
      ),
    [checklists]
  );

  async function createPolicy(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api("/api/hr/policies", {
        method: "POST",
        body: JSON.stringify({
          code: policyForm.code.trim(),
          title_ar: policyForm.title_ar.trim(),
          title_en: policyForm.title_en.trim() || null,
          category: policyForm.category,
          scope: policyForm.scope,
          policy_owner: policyForm.policy_owner.trim() || null,
          description: policyForm.description.trim() || null,
          notes: null,
        }),
      });

      setPolicyForm({
        code: "",
        title_ar: "",
        title_en: "",
        category: "hr_policy",
        scope: "all_employees",
        policy_owner: "",
        description: "",
      });

      setMessage("Policy created.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to create policy");
    } finally {
      setSaving(false);
    }
  }

  async function createVersion(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const createdVersion =
        await api("/api/hr/policy-versions", {
          method: "POST",
          body: JSON.stringify({
            policy_id: versionForm.policy_id,
            version_number:
              versionForm.version_number.trim(),
            effective_date:
              versionForm.effective_date || null,
            review_date:
              versionForm.review_date || null,
            prepared_by:
              versionForm.prepared_by.trim() || null,
            change_summary:
              versionForm.change_summary.trim() || null,
            content_text:
              versionForm.content_text || null,

            // Legacy compatibility only.
            // Real files use Unified HR Attachments.
            attachment_url: null,
          }),
        });

      let uploadText = "";

      if (versionFile) {
        try {
          await uploadUnifiedAttachment({
            entityType: "policy_version",
            entityId: createdVersion.id,
            documentType: "policy_document",
            file: versionFile,
            uploadedBy:
              versionForm.prepared_by.trim() ||
              "HR",
            title: versionFile.name,
          });

          uploadText =
            " Policy document uploaded.";
        } catch (uploadErr) {
          uploadText =
            " Version created, but policy document upload failed.";

          setError(
            uploadErr?.message ||
              "Policy version created but attachment upload failed"
          );
        }
      }

      setVersionFile(null);

      setMessage(
        `Policy version created.${uploadText}`
      );

      await load();
    } catch (err) {
      setError(err?.message || "Unable to create policy version");
    } finally {
      setSaving(false);
    }
  }

  async function analyzePolicyConflicts(row) {
    try {
      setAnalyzingVersionId(row.id);
      setError("");
      setMessage("");

      const result = await api(
        `/api/hr/policy-versions/${row.id}/analyze-conflicts`,
        {
          method: "POST",
        }
      );

      setConflictAnalysisResults(
        (current) => ({
          ...current,
          [row.id]: result,
        })
      );

      const created =
        Number(
          result.created_conflicts || 0
        );

      const detected =
        Number(
          result.detected_conflicts || 0
        );

      const ignored =
        Number(
          result.ignored_low_confidence || 0
        );

      const skipped =
        Number(
          result.skipped_existing || 0
        );

      setMessage(
        `AI policy analysis completed. ` +
        `${detected} conflict(s) detected, ` +
        `${created} added to Conflict Register, ` +
        `${ignored} below confidence threshold, ` +
        `${skipped} already recorded.`
      );

      // Reload so newly created AI conflicts
      // immediately appear in Conflict Register.
      await load();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to analyze policy conflicts"
      );
    } finally {
      setAnalyzingVersionId("");
    }
  }


  function assessmentForVersion(versionId) {
    return impactAssessments.find(
      (item) =>
        String(item.policy_version_id) ===
        String(versionId)
    );
  }

  function impactItemsForAssessment(assessmentId) {
    return impactItems.filter(
      (item) =>
        String(item.assessment_id) ===
        String(assessmentId)
    );
  }

  function rulesForVersion(versionId) {
    return enforcementRules.filter(
      (item) =>
        String(item.policy_version_id) ===
        String(versionId)
    );
  }

  function mismatchesForVersion(versionId) {
    return policyMismatches.filter(
      (item) =>
        String(item.policy_version_id) ===
        String(versionId)
    );
  }

  function versionById(versionId) {
    return versions.find(
      (item) =>
        String(item.id) ===
        String(versionId)
    );
  }

  function policyForVersion(versionId) {
    const version =
      versionById(versionId);

    if (!version) return null;

    return policies.find(
      (item) =>
        String(item.id) ===
        String(version.policy_id)
    );
  }

  function taskById(taskId) {
    if (!taskId) return null;

    return policyItTasks.find(
      (item) =>
        String(item.id) ===
        String(taskId)
    );
  }

  function approvalById(approvalId) {
    if (!approvalId) return null;

    return policyApprovals.find(
      (item) =>
        String(item.id) ===
        String(approvalId)
    );
  }

  function verificationsForMismatch(mismatchId) {
    return technicalVerifications
      .filter(
        (item) =>
          String(item.mismatch_id) ===
          String(mismatchId)
      )
      .sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
  }

  function changeDecisionForItem(itemId) {
    return changeDecisions.find(
      (item) =>
        String(item.impact_item_id) ===
        String(itemId)
    );
  }

  function approvalDecisionForChangeType(changeType) {
    if (changeType === "add") {
      return {
        value: "approve_add",
        label: "Approve Add",
      };
    }

    if (changeType === "modify") {
      return {
        value: "approve_modify",
        label: "Approve Modify",
      };
    }

    if (changeType === "remove") {
      return {
        value: "approve_remove",
        label: "Approve Remove",
      };
    }

    return null;
  }

  async function decidePolicyChange(
    decisionRow,
    decisionValue
  ) {
    if (!decisionRow?.id) return;

    const labels = {
      approve_add: "Approve Add",
      approve_modify: "Approve Modify",
      approve_remove: "Approve Remove",
      keep_existing: "Keep Existing",
      ignore: "Ignore",
    };

    const label =
      labels[decisionValue] ||
      decisionValue;

    const confirmed = window.confirm(
      `${label}?\n\n` +
      "This decision will be recorded in the Audit Trail. " +
      "Approved system impacts may create enforcement rules " +
      "or IT change tasks."
    );

    if (!confirmed) return;

    const notes = window.prompt(
      "Decision Notes / ملاحظات القرار — Optional:",
      ""
    );

    if (notes === null) return;

    try {
      setError("");
      setMessage("");
      setDecidingChangeId(
        decisionRow.id
      );

      const result = await api(
        `/api/policy-impact/change-decisions/${decisionRow.id}/decide`,
        {
          method: "POST",
          body: JSON.stringify({
            decision:
              decisionValue,
            notes:
              notes.trim() || null,
          }),
        }
      );

      let outcome = "";

      if (result?.enforcement_rule) {
        outcome =
          ` Rule ${result.enforcement_rule.status}.`;
      }

      if (result?.it_task) {
        outcome +=
          ` IT task created (${result.it_task.status}).`;
      }

      if (result?.system_mismatch) {
        outcome +=
          " Policy/System Mismatch opened.";
      }

      setMessage(
        `${label} recorded.${outcome}`
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save policy change decision"
      );
    } finally {
      setDecidingChangeId("");
    }
  }


  function safeJsonObject(value) {
    try {
      const parsed = JSON.parse(
        value || "{}"
      );

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }

      return {};
    } catch {
      return {};
    }
  }

  function readableFieldName(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  function readableFieldValue(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (
      typeof value === "object"
    ) {
      return JSON.stringify(
        value,
        null,
        2
      );
    }

    return String(value);
  }


  function startEditImpactProposal(item) {
    setEditingImpactId(item.id);

    setImpactEditForm({
      impact_type:
        item.impact_type || "manual_review",

      change_type:
        item.change_type || "modify",

      affected_module:
        item.affected_module || "",

      affected_component:
        item.affected_component || "",

      description:
        item.description || "",

      recommended_action:
        item.recommended_action || "",

      severity:
        item.severity || "medium",

      enforcement_mode:
        item.enforcement_mode || "manual_review",

      auto_applicable:
        Boolean(item.auto_applicable),

      current_value_json:
        JSON.stringify(
          item.current_value || {},
          null,
          2
        ),

      proposed_value_json:
        JSON.stringify(
          item.proposed_value || {},
          null,
          2
        ),

      acceptance_criteria_json:
        JSON.stringify(
          item.acceptance_criteria || {
            items: [],
          },
          null,
          2
        ),

      acceptance_criteria_text:
        Array.isArray(
          item.acceptance_criteria?.items
        )
          ? item.acceptance_criteria.items
              .map((value) =>
                String(value)
              )
              .join("\n")
          : "",
    });
  }

  function cancelEditImpactProposal() {
    setEditingImpactId("");
    setImpactEditForm(null);
  }

  async function saveImpactProposal(decisionRow) {
    if (!decisionRow?.id || !impactEditForm) {
      return;
    }

    let currentValue;
    let proposedValue;
    let acceptanceCriteria;

    try {
      currentValue = JSON.parse(
        impactEditForm.current_value_json || "{}"
      );

      proposedValue = JSON.parse(
        impactEditForm.proposed_value_json || "{}"
      );

      acceptanceCriteria = JSON.parse(
        impactEditForm.acceptance_criteria_json ||
          '{"items":[]}'
      );

      if (
        !acceptanceCriteria ||
        typeof acceptanceCriteria !== "object" ||
        Array.isArray(acceptanceCriteria)
      ) {
        acceptanceCriteria = {};
      }

      acceptanceCriteria = {
        ...acceptanceCriteria,
        items: String(
          impactEditForm.acceptance_criteria_text ||
            ""
        )
          .split("\n")
          .map((value) =>
            value.trim()
          )
          .filter(Boolean),
      };
    } catch {
      setError(
        "Current / Proposed / Acceptance Criteria must contain valid JSON."
      );
      return;
    }

    try {
      setSavingImpactEdit(true);
      setError("");
      setMessage("");

      const result = await api(
        `/api/policy-impact/change-decisions/${decisionRow.id}/proposal`,
        {
          method: "PUT",
          body: JSON.stringify({
            impact_type:
              impactEditForm.impact_type,

            change_type:
              impactEditForm.change_type,

            affected_module:
              impactEditForm.affected_module.trim() || null,

            affected_component:
              impactEditForm.affected_component.trim() || null,

            description:
              impactEditForm.description.trim(),

            recommended_action:
              impactEditForm.recommended_action.trim() || null,

            severity:
              impactEditForm.severity,

            enforcement_mode:
              impactEditForm.enforcement_mode,

            auto_applicable:
              Boolean(
                impactEditForm.auto_applicable
              ),

            current_value:
              currentValue,

            proposed_value:
              proposedValue,

            acceptance_criteria:
              acceptanceCriteria,
          }),
        }
      );

      const edited =
        result?.impact_item;

      let safetyMessage = "";

      if (
        edited &&
        [
          "application_code",
          "workflow",
          "database",
          "calculator",
          "reporting",
          "integration",
        ].includes(edited.impact_type) &&
        edited.enforcement_mode === "it_task"
      ) {
        safetyMessage =
          " Technical impact is protected and will require IT implementation.";
      }

      setMessage(
        "Impact proposal updated successfully." +
          safetyMessage
      );

      setEditingImpactId("");
      setImpactEditForm(null);

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update impact proposal"
      );
    } finally {
      setSavingImpactEdit(false);
    }
  }


  async function updatePolicyItTask(
    task,
    nextStatus
  ) {
    if (!task?.id) return;

    if (
      nextStatus === "completed" &&
      !window.confirm(
        "Mark this IT Task as completed?\n\n" +
        "Technical Verification will still be required before " +
        "the Policy/System Mismatch can be closed."
      )
    ) {
      return;
    }

    try {
      setUpdatingItTaskId(task.id);
      setError("");
      setMessage("");

      await api(
        `/api/tasks/${task.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      setMessage(
        nextStatus === "in_progress"
          ? "IT Task moved to In Progress."
          : "IT Task marked Completed. Technical Verification is now required."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update IT Task"
      );
    } finally {
      setUpdatingItTaskId("");
    }
  }

  async function verifyPolicyTechnicalChange(
    mismatch,
    passed
  ) {
    if (!mismatch?.id) return;

    const confirmed = window.confirm(
      passed
        ? "Record Technical Verification as PASSED?"
        : "Record Technical Verification as FAILED?"
    );

    if (!confirmed) return;

    const summary = window.prompt(
      passed
        ? "Verification Summary / ملخص الاختبار الناجح:"
        : "Failure Summary / سبب فشل الاختبار:",
      ""
    );

    if (summary === null) return;

    if (!summary.trim()) {
      setError(
        "Technical Verification summary is required."
      );
      return;
    }

    try {
      setVerifyingMismatchId(
        mismatch.id
      );

      setError("");
      setMessage("");

      const result = await api(
        `/api/policy-impact/mismatches/${mismatch.id}/verify`,
        {
          method: "POST",
          body: JSON.stringify({
            passed: Boolean(passed),

            verification_method:
              "manual_test",

            test_summary:
              summary.trim(),

            test_results: {
              result:
                passed
                  ? "passed"
                  : "failed",
            },

            evidence: {
              source:
                "policy_impact_review_ui",
            },

            verified_by:
              "user",
          }),
        }
      );

      if (passed) {
        setMessage(
          result?.approval
            ? "Technical Verification passed. Final Approval is now waiting for your decision."
            : "Technical Verification passed."
        );
      } else {
        setMessage(
          "Technical Verification failed. IT Task returned to In Progress and the mismatch remains open."
        );
      }

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to record Technical Verification"
      );
    } finally {
      setVerifyingMismatchId("");
    }
  }

  async function decidePolicyTechnicalApproval(
    approval,
    approved
  ) {
    if (!approval?.id) return;

    const actionLabel =
      approved
        ? "Approve"
        : "Reject";

    const confirmed = window.confirm(
      `${actionLabel} final technical acceptance?\n\n` +
      (
        approved
          ? "Approval will resolve the Policy/System Mismatch."
          : "Rejection will keep the mismatch open and return the IT Task to In Progress."
      )
    );

    if (!confirmed) return;

    const reason = window.prompt(
      approved
        ? "Approval Notes / ملاحظات الاعتماد — Optional:"
        : "Rejection Reason / سبب الرفض:",
      ""
    );

    if (reason === null) return;

    try {
      setDecidingApprovalId(
        approval.id
      );

      setError("");
      setMessage("");

      await api(
        `/api/approvals/${approval.id}/${approved ? "approve" : "reject"}`,
        {
          method: "POST",
          body: JSON.stringify({
            reason:
              reason.trim() || null,
          }),
        }
      );

      setMessage(
        approved
          ? "Final technical acceptance approved. Policy/System Mismatch resolved."
          : "Final technical acceptance rejected. IT work returned to In Progress."
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to record Final Approval decision"
      );
    } finally {
      setDecidingApprovalId("");
    }
  }


  function impactStatusLabel(item) {
    if (item.status === "verified") {
      return "Verified";
    }

    if (item.status === "applied") {
      return "Applied";
    }

    if (
      item.enforcement_mode === "it_task"
    ) {
      const task =
        taskById(item.task_id);

      if (task?.status === "completed") {
        return "IT Completed";
      }

      if (task?.status === "in_progress") {
        return "IT In Progress";
      }

      return "IT Required";
    }

    if (
      item.status ===
      "ready_for_enforcement"
    ) {
      return "Ready";
    }

    return item.status || "Pending";
  }


  async function analyzePolicyImpact(row) {
    try {
      setError("");
      setMessage("");
      setAnalyzingImpactVersionId(row.id);

      const result = await api(
        `/api/policy-impact/policy-versions/${row.id}/analyze`,
        {
          method: "POST",
        }
      );

      setImpactAnalysisResults((current) => ({
        ...current,
        [row.id]: result,
      }));

      const itemCount = Array.isArray(result?.impact_items)
        ? result.impact_items.length
        : 0;

      const ruleCount = Array.isArray(result?.enforcement_rules)
        ? result.enforcement_rules.length
        : 0;

      const taskCount = Array.isArray(result?.it_tasks)
        ? result.it_tasks.length
        : 0;

      const mismatchCount = Array.isArray(
        result?.system_mismatches
      )
        ? result.system_mismatches.length
        : 0;

      setMessage(
        `Policy impact analyzed: ${itemCount} impacts, ` +
          `${ruleCount} enforcement rules, ` +
          `${taskCount} IT tasks, ` +
          `${mismatchCount} system mismatches.`
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to analyze policy impact"
      );
    } finally {
      setAnalyzingImpactVersionId("");
    }
  }


  async function changeVersionStatus(row, status) {
    const actor = window.prompt(
      "Actor / المراجع أو المعتمد:",
      "HR"
    );

    if (!actor) return;

    try {
      setSaving(true);

      await api(`/api/hr/policy-versions/${row.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          actor: actor.trim(),
          approval_notes: null,
        }),
      });

      setMessage(`Policy version moved to ${status}.`);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to update version");
    } finally {
      setSaving(false);
    }
  }

  async function createConflict(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await api("/api/hr/policy-conflicts", {
        method: "POST",
        body: JSON.stringify({
          source_version_id: conflictForm.source_version_id,
          conflicting_version_id: conflictForm.conflicting_version_id,
          conflict_type: conflictForm.conflict_type,
          severity: conflictForm.severity,
          description: conflictForm.description.trim(),
          detected_by: "manual",
        }),
      });

      setMessage("Policy conflict recorded.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to record conflict");
    } finally {
      setSaving(false);
    }
  }

  async function resolveConflict(row) {
    const resolution = window.prompt(
      "Resolution / المعالجة:"
    );

    if (!resolution) return;

    const resolvedBy = window.prompt(
      "Resolved By:",
      "HR"
    );

    if (!resolvedBy) return;

    try {
      setSaving(true);

      await api(`/api/hr/policy-conflicts/${row.id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({
          resolution: resolution.trim(),
          resolved_by: resolvedBy.trim(),
        }),
      });

      setMessage("Policy conflict resolved.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to resolve conflict");
    } finally {
      setSaving(false);
    }
  }

  async function createChecklist(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await api("/api/hr/compliance-checklists", {
        method: "POST",
        body: JSON.stringify({
          code: checklistForm.code.trim(),
          title: checklistForm.title.trim(),
          category: checklistForm.category,
          frequency: checklistForm.frequency,
          responsible_owner:
            checklistForm.responsible_owner.trim() || null,
          due_date: checklistForm.due_date || null,
          description: checklistForm.description.trim() || null,
          notes: null,
        }),
      });

      setMessage("Compliance checklist created.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to create checklist");
    } finally {
      setSaving(false);
    }
  }

  async function createChecklistItem(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await api("/api/hr/compliance-checklist-items", {
        method: "POST",
        body: JSON.stringify({
          checklist_id: itemForm.checklist_id,
          item_order: Number(itemForm.item_order || 1),
          title: itemForm.title.trim(),
          requirement_reference:
            itemForm.requirement_reference.trim() || null,
          responsible_owner:
            itemForm.responsible_owner.trim() || null,
          due_date: itemForm.due_date || null,
        }),
      });

      setMessage("Checklist item created.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to create checklist item");
    } finally {
      setSaving(false);
    }
  }

  async function updateChecklistItem(row) {
    const status = window.prompt(
      "Status: pending / in_progress / completed / not_applicable",
      row.stored_status || row.status
    );

    if (!status) return;

    const owner = window.prompt(
      "Completed By / المسؤول:",
      "HR"
    );

    if (owner === null) return;

    const notes = window.prompt(
      "Evidence Notes / ملاحظات الدليل:",
      row.evidence_notes || ""
    );

    if (notes === null) return;

    try {
      setSaving(true);

      await api(`/api/hr/compliance-checklist-items/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status.trim(),
          completed_by:
            owner.trim() || null,

          // Legacy compatibility only.
          evidence_url: null,

          evidence_notes:
            notes.trim() || null,
        }),
      });

      let uploadText = "";

      const evidenceFile =
        evidenceFiles[row.id];

      if (evidenceFile) {
        try {
          await uploadUnifiedAttachment({
            entityType:
              "compliance_checklist_item",
            entityId: row.id,
            documentType:
              "compliance_evidence",
            file: evidenceFile,
            uploadedBy:
              owner.trim() || "HR",
            title: evidenceFile.name,
          });

          uploadText =
            " Evidence uploaded.";

          setEvidenceFiles(
            (current) => ({
              ...current,
              [row.id]: null,
            })
          );
        } catch (uploadErr) {
          uploadText =
            " Checklist updated, but evidence upload failed.";

          setError(
            uploadErr?.message ||
              "Checklist updated but evidence upload failed"
          );
        }
      }

      setMessage(
        `Checklist item updated.${uploadText}`
      );

      await load();
    } catch (err) {
      setError(err?.message || "Unable to update checklist item");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    ["overview", "Overview"],
    ["policies", "Policy Register"],
    ["versions", "Version Control"],
    ["impact", "Policy Impact Review"],
    ["conflicts", "Conflict Register"],
    ["checklists", "Compliance Checklists"],
    ["alerts", "Alerts"],
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        padding: 28,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <a
          href="/hr"
          style={{
            color: C.muted,
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          ← HR Workspace
        </a>

        <h1 style={{ margin: "13px 0 5px", fontSize: 31 }}>
          HR Policies & Compliance
        </h1>

        <div style={{ color: C.muted, marginBottom: 22 }}>
          سياسات الموارد البشرية والامتثال
        </div>

        {error ? (
          <div
            style={{
              color: C.danger,
              background: "rgba(255,107,107,.08)",
              padding: 13,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              color: C.primary,
              background: "rgba(24,213,183,.08)",
              padding: 13,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Active Policies"
            value={summary.active_policies}
            subtitle="سياسات فعالة"
          />

          <StatCard
            title="In Review"
            value={summary.versions_in_review}
            subtitle="إصدارات تحت المراجعة"
            accent={C.blue}
          />

          <StatCard
            title="Review Due"
            value={summary.policy_reviews_due}
            subtitle="مراجعات قريبة"
            accent={C.warning}
          />

          <StatCard
            title="Review Overdue"
            value={summary.policy_reviews_overdue}
            subtitle="مراجعات متأخرة"
            accent={C.danger}
          />

          <StatCard
            title="Open Conflicts"
            value={summary.open_conflicts}
            subtitle="تعارضات مفتوحة"
            accent={C.warning}
          />

          <StatCard
            title="Overdue Checklists"
            value={summary.overdue_checklists}
            subtitle="قوائم امتثال متأخرة"
            accent={C.danger}
          />

          <StatCard
            title="Pending Items"
            value={summary.pending_checklist_items}
            subtitle="بنود امتثال غير مكتملة"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {tabs.map(([key, name]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                background: tab === key ? C.primary : C.panel,
                color: tab === key ? "#04100b" : C.text,
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(430px,1fr))",
              gap: 18,
            }}
          >
            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Current Policies</h3>

              {versions.filter((row) => row.is_current).length === 0 ? (
                <Empty>No approved current policies</Empty>
              ) : (
                versions
                  .filter((row) => row.is_current)
                  .slice(0, 10)
                  .map((row) => (
                    <div
                      key={row.id}
                      style={{
                        background: C.soft,
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 8,
                      }}
                    >
                      <strong>{policyMap[row.policy_id] || row.policy_id}</strong>
                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        V{row.version_number} • Review:{" "}
                        {row.review_date || "Not scheduled"}
                      </div>
                      <div style={{ marginTop: 7 }}>
                        <Badge>{row.review_status}</Badge>
                      </div>
                    </div>
                  ))
              )}
            </section>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Priority Alerts</h3>

              {alerts.length === 0 ? (
                <Empty>No policy/compliance alerts</Empty>
              ) : (
                alerts.slice(0, 12).map((row, index) => (
                  <div
                    key={`${row.type}-${index}`}
                    style={{
                      background: C.soft,
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <strong>{row.message}</strong>
                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      {row.type.replaceAll("_", " ")}
                      {row.due_date ? ` • ${row.due_date}` : ""}
                    </div>
                    <div style={{ marginTop: 7 }}>
                      <Badge>{row.severity}</Badge>
                    </div>

                    {conflictAnalysisResults[
                      row.id
                    ] ? (
                      <div
                        style={{
                          marginTop: 11,
                          padding: 12,
                          background:
                            "rgba(114,183,255,.06)",
                          border:
                            `1px solid ${C.blue}33`,
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems:
                              "center",
                          }}
                        >
                          <strong
                            style={{
                              color: C.blue,
                              fontSize: 12,
                            }}
                          >
                            AI Conflict Analysis
                          </strong>

                          <div
                            style={{
                              color: C.muted,
                              fontSize: 10,
                            }}
                          >
                            Compared with{" "}
                            {conflictAnalysisResults[
                              row.id
                            ].comparison_versions ||
                              0}{" "}
                            approved policy version(s)
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(130px,1fr))",
                            gap: 7,
                            marginTop: 9,
                          }}
                        >
                          <div
                            style={{
                              background:
                                C.panel,
                              borderRadius: 8,
                              padding: 8,
                              fontSize: 11,
                            }}
                          >
                            Detected:{" "}
                            <strong>
                              {conflictAnalysisResults[
                                row.id
                              ].detected_conflicts ||
                                0}
                            </strong>
                          </div>

                          <div
                            style={{
                              background:
                                C.panel,
                              borderRadius: 8,
                              padding: 8,
                              fontSize: 11,
                            }}
                          >
                            Registered:{" "}
                            <strong
                              style={{
                                color:
                                  C.warning,
                              }}
                            >
                              {conflictAnalysisResults[
                                row.id
                              ].created_conflicts ||
                                0}
                            </strong>
                          </div>

                          <div
                            style={{
                              background:
                                C.panel,
                              borderRadius: 8,
                              padding: 8,
                              fontSize: 11,
                            }}
                          >
                            Below 70%:{" "}
                            <strong>
                              {conflictAnalysisResults[
                                row.id
                              ]
                                .ignored_low_confidence ||
                                0}
                            </strong>
                          </div>

                          <div
                            style={{
                              background:
                                C.panel,
                              borderRadius: 8,
                              padding: 8,
                              fontSize: 11,
                            }}
                          >
                            Existing:{" "}
                            <strong>
                              {conflictAnalysisResults[
                                row.id
                              ].skipped_existing ||
                                0}
                            </strong>
                          </div>
                        </div>

                        {(conflictAnalysisResults[
                          row.id
                        ].conflicts || [])
                          .length === 0 ? (
                          <div
                            style={{
                              color:
                                C.primary,
                              fontSize: 11,
                              marginTop: 9,
                            }}
                          >
                            No policy conflicts
                            detected.
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gap: 7,
                              marginTop: 10,
                            }}
                          >
                            {(
                              conflictAnalysisResults[
                                row.id
                              ].conflicts || []
                            ).map(
                              (
                                conflict,
                                index
                              ) => (
                                <div
                                  key={
                                    `${conflict.conflicting_version_id}-${index}`
                                  }
                                  style={{
                                    background:
                                      C.panel,
                                    border:
                                      `1px solid ${C.border}`,
                                    borderRadius:
                                      8,
                                    padding:
                                      9,
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      gap: 8,
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize:
                                          11,
                                      }}
                                    >
                                      {conflict.conflict_type?.replaceAll(
                                        "_",
                                        " "
                                      ) ||
                                        "Policy conflict"}
                                    </strong>

                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        gap: 6,
                                      }}
                                    >
                                      <Badge>
                                        {
                                          conflict.severity
                                        }
                                      </Badge>

                                      <span
                                        style={{
                                          color:
                                            Number(
                                              conflict.confidence ||
                                                0
                                            ) >=
                                            70
                                              ? C.primary
                                              : C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        {Number(
                                          conflict.confidence ||
                                            0
                                        ).toFixed(
                                          0
                                        )}
                                        % confidence
                                      </span>
                                    </div>
                                  </div>

                                  <div
                                    dir="rtl"
                                    style={{
                                      color:
                                        C.muted,
                                      fontSize:
                                        11,
                                      lineHeight:
                                        1.6,
                                      marginTop:
                                        6,
                                    }}
                                  >
                                    {
                                      conflict.description
                                    }
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        C.muted,
                                      fontSize:
                                        9,
                                      marginTop:
                                        5,
                                    }}
                                  >
                                    Compared version:{" "}
                                    {versionMap[
                                      conflict
                                        .conflicting_version_id
                                    ] ||
                                      conflict
                                        .conflicting_version_id}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {conflictAnalysisResults[
                          row.id
                        ].message ? (
                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize: 10,
                              marginTop: 9,
                            }}
                          >
                            {
                              conflictAnalysisResults[
                                row.id
                              ].message
                            }
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          </div>
        ) : null}

        {tab === "policies" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createPolicy}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Create Policy</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                  gap: 11,
                }}
              >
                <input
                  style={input}
                  placeholder="Policy Code"
                  value={policyForm.code}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, code: e.target.value })
                  }
                />

                <input
                  style={input}
                  dir="rtl"
                  placeholder="اسم السياسة بالعربي"
                  value={policyForm.title_ar}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, title_ar: e.target.value })
                  }
                />

                <input
                  style={input}
                  placeholder="English Title"
                  value={policyForm.title_en}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, title_en: e.target.value })
                  }
                />

                <input
                  style={input}
                  placeholder="Policy Owner"
                  value={policyForm.policy_owner}
                  onChange={(e) =>
                    setPolicyForm({
                      ...policyForm,
                      policy_owner: e.target.value,
                    })
                  }
                />

                <select
                  style={input}
                  value={policyForm.scope}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, scope: e.target.value })
                  }
                >
                  <option value="all_employees">All Employees</option>
                  <option value="saudi_employees">Saudi Employees</option>
                  <option value="non_saudi_employees">
                    Non-Saudi Employees
                  </option>
                  <option value="managers">Managers</option>
                  <option value="specific_group">Specific Group</option>
                </select>
              </div>

              <textarea
                style={{ ...input, minHeight: 75, marginTop: 11 }}
                placeholder="Description"
                value={policyForm.description}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    description: e.target.value,
                  })
                }
              />

              <button
                disabled={saving}
                type="submit"
                style={{
                  marginTop: 12,
                  background: C.primary,
                  color: "#04100b",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontWeight: 800,
                }}
              >
                Create Policy
              </button>
            </form>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Policy Register</h3>

              {policies.length === 0 ? (
                <Empty>No policies yet — لا توجد سياسات</Empty>
              ) : (
                policies.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      padding: 13,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <strong>
                      {row.code} — {row.title_en || row.title_ar}
                    </strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      {row.title_ar} • Owner: {row.policy_owner || "—"} •{" "}
                      Scope: {row.scope}
                    </div>

                    {(() => {
                      const assessment =
                        assessmentForVersion(
                          row.id
                        );

                      const liveResult =
                        impactAnalysisResults[
                          row.id
                        ];

                      if (
                        !assessment &&
                        !liveResult
                      ) {
                        return null;
                      }

                      const assessmentId =
                        assessment?.id ||
                        liveResult?.assessment?.id;

                      const rowItems =
                        assessmentId
                          ? impactItemsForAssessment(
                              assessmentId
                            )
                          : liveResult?.impact_items ||
                            [];

                      const rowRules =
                        rulesForVersion(
                          row.id
                        );

                      const rowMismatches =
                        mismatchesForVersion(
                          row.id
                        );

                      const openMismatches =
                        rowMismatches.filter(
                          (item) =>
                            item.status ===
                            "open"
                        );

                      const itTaskItems =
                        rowItems.filter(
                          (item) =>
                            item.enforcement_mode ===
                            "it_task"
                        );

                      return (
                        <div
                          style={{
                            marginTop: 10,
                            background: C.panel,
                            border:
                              `1px solid ${C.border}`,
                            borderRadius: 10,
                            padding: 11,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 12,
                              color: C.primary,
                              marginBottom: 7,
                            }}
                          >
                            Policy Impact Summary
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              flexWrap: "wrap",
                            }}
                          >
                            <Badge>
                              Risk:{" "}
                              {assessment?.overall_risk ||
                                liveResult
                                  ?.assessment
                                  ?.overall_risk ||
                                "—"}
                            </Badge>

                            <Badge>
                              Impacts:{" "}
                              {rowItems.length}
                            </Badge>

                            <Badge>
                              Rules:{" "}
                              {rowRules.length ||
                                liveResult
                                  ?.enforcement_rules
                                  ?.length ||
                                0}
                            </Badge>

                            <Badge>
                              IT Changes:{" "}
                              {itTaskItems.length}
                            </Badge>

                            <Badge>
                              Open Mismatches:{" "}
                              {openMismatches.length}
                            </Badge>
                          </div>

                          {openMismatches.length >
                          0 ? (
                            <div
                              style={{
                                marginTop: 8,
                                color: C.warning,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              ⚠ Approved policy has
                              technical changes not yet
                              fully verified / accepted.
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}
            </section>
          </div>
        ) : null}

        {tab === "versions" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createVersion}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>New Policy Version</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                  gap: 11,
                }}
              >
                <select
                  style={input}
                  value={versionForm.policy_id}
                  onChange={(e) =>
                    setVersionForm({
                      ...versionForm,
                      policy_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select policy...</option>
                  {policies.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.code} — {row.title_en || row.title_ar}
                    </option>
                  ))}
                </select>

                <input
                  style={input}
                  placeholder="Version Number"
                  value={versionForm.version_number}
                  onChange={(e) =>
                    setVersionForm({
                      ...versionForm,
                      version_number: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={versionForm.effective_date}
                  onChange={(e) =>
                    setVersionForm({
                      ...versionForm,
                      effective_date: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  type="date"
                  value={versionForm.review_date}
                  onChange={(e) =>
                    setVersionForm({
                      ...versionForm,
                      review_date: e.target.value,
                    })
                  }
                />

                <input
                  style={input}
                  placeholder="Prepared By"
                  value={versionForm.prepared_by}
                  onChange={(e) =>
                    setVersionForm({
                      ...versionForm,
                      prepared_by: e.target.value,
                    })
                  }
                />

                <div>
                  <input
                    key={
                      versionFile
                        ? versionFile.name
                        : "empty-policy-file"
                    }
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                    style={{
                      ...input,
                      padding: "9px 10px",
                    }}
                    onChange={(e) =>
                      setVersionFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                  <div
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      marginTop: 5,
                    }}
                  >
                    Policy File • Optional • Max
                    20 MB • Private HR Storage
                  </div>

                  {versionFile ? (
                    <div
                      style={{
                        color: C.primary,
                        fontSize: 11,
                        marginTop: 5,
                      }}
                    >
                      Selected:{" "}
                      {versionFile.name}
                    </div>
                  ) : null}
                </div>
              </div>

              <textarea
                style={{ ...input, minHeight: 70, marginTop: 11 }}
                placeholder="Change Summary"
                value={versionForm.change_summary}
                onChange={(e) =>
                  setVersionForm({
                    ...versionForm,
                    change_summary: e.target.value,
                  })
                }
              />

              <textarea
                style={{ ...input, minHeight: 130, marginTop: 11 }}
                placeholder="Policy Text — النص الكامل للسياسة"
                value={versionForm.content_text}
                onChange={(e) =>
                  setVersionForm({
                    ...versionForm,
                    content_text: e.target.value,
                  })
                }
              />

              <button
                disabled={saving}
                type="submit"
                style={{
                  marginTop: 12,
                  background: C.primary,
                  color: "#04100b",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontWeight: 800,
                }}
              >
                Create Version
              </button>
            </form>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Version Register</h3>

              {versions.length === 0 ? (
                <Empty>No policy versions</Empty>
              ) : (
                versions.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      padding: 13,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <strong>
                      {policyMap[row.policy_id] || row.policy_id} • V
                      {row.version_number}
                    </strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Effective: {row.effective_date || "—"} • Review:{" "}
                      {row.review_date || "—"}
                    </div>

                    {attachmentsFor(
                      "policy_version",
                      row.id
                    ).length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gap: 6,
                          marginTop: 9,
                        }}
                      >
                        {attachmentsFor(
                          "policy_version",
                          row.id
                        ).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: C.panel,
                              border:
                                `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: "7px 9px",
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                              }}
                            >
                              📎{" "}
                              {
                                item.original_file_name
                              }
                            </span>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                              }}
                            >
                              <a
                                href={
                                  item.download_url
                                }
                                style={{
                                  color: C.blue,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textDecoration:
                                    "none",
                                }}
                              >
                                Download
                              </a>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  archiveAttachment(
                                    item
                                  )
                                }
                                style={{
                                  background:
                                    "transparent",
                                  border: 0,
                                  padding: 0,
                                  color: C.warning,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                Archive
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      <Badge>{row.status}</Badge>
                      <Badge>{row.review_status}</Badge>

                      {row.status !== "archived" ? (
                        <button
                          type="button"
                          disabled={
                            saving ||
                            analyzingVersionId ===
                              row.id
                          }
                          onClick={() =>
                            analyzePolicyConflicts(
                              row
                            )
                          }
                          style={{
                            background:
                              "rgba(114,183,255,.10)",
                            color: C.blue,
                            border:
                              `1px solid ${C.blue}55`,
                            borderRadius: 8,
                            padding:
                              "7px 10px",
                            fontWeight: 800,
                            cursor:
                              analyzingVersionId ===
                              row.id
                                ? "wait"
                                : "pointer",
                          }}
                        >
                          {analyzingVersionId ===
                          row.id
                            ? "Analyzing..."
                            : "Analyze Conflicts with AI"}
                        </button>
                      ) : null}

                      {row.status === "approved" &&
                      row.is_current ? (
                        <button
                          type="button"
                          disabled={
                            saving ||
                            analyzingImpactVersionId ===
                              row.id ||
                            Boolean(
                              assessmentForVersion(
                                row.id
                              )
                            )
                          }
                          onClick={() =>
                            analyzePolicyImpact(row)
                          }
                          style={{
                            background:
                              "rgba(24,213,183,.10)",
                            color: C.primary,
                            border:
                              `1px solid ${C.primary}55`,
                            borderRadius: 8,
                            padding: "7px 10px",
                            fontWeight: 800,
                            cursor:
                              analyzingImpactVersionId ===
                              row.id
                                ? "wait"
                                : "pointer",
                          }}
                        >
                          {analyzingImpactVersionId ===
                          row.id
                            ? "Analyzing Impact..."
                            : assessmentForVersion(
                                row.id
                              )
                            ? "Impact Analyzed"
                            : "Analyze Policy Impact"}
                        </button>
                      ) : null}

                      {row.status === "draft" ? (
                        <button
                          disabled={saving}
                          onClick={() => changeVersionStatus(row, "review")}
                        >
                          Send to Review
                        </button>
                      ) : null}

                      {row.status === "review" ? (
                        <>
                          <button
                            disabled={saving}
                            onClick={() => changeVersionStatus(row, "approved")}
                          >
                            Approve
                          </button>

                          <button
                            disabled={saving}
                            onClick={() => changeVersionStatus(row, "draft")}
                          >
                            Return to Draft
                          </button>
                        </>
                      ) : null}

                      {["draft", "review", "approved", "superseded"].includes(
                        row.status
                      ) ? (
                        <button
                          disabled={saving}
                          onClick={() => changeVersionStatus(row, "archived")}
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        ) : null}


        {tab === "impact" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <section
              style={{
                background: C.panel,
                border:
                  `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    Policy Impact Review
                  </h3>

                  <div
                    style={{
                      color: C.muted,
                      fontSize: 12,
                      marginTop: 5,
                    }}
                  >
                    مراجعة أثر السياسات على
                    الوكلاء، الإعدادات،
                    النظام، مهام IT،
                    الاختبارات والاعتمادات.
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge>
                    Assessments:{" "}
                    {impactAssessments.length}
                  </Badge>

                  <Badge>
                    Impact Items:{" "}
                    {impactItems.length}
                  </Badge>

                  <Badge>
                    Open Mismatches:{" "}
                    {
                      policyMismatches.filter(
                        (item) =>
                          item.status ===
                          "open"
                      ).length
                    }
                  </Badge>

                  <Badge>
                    Pending Decisions:{" "}
                    {
                      changeDecisions.filter(
                        (item) =>
                          item.decision ===
                          "pending"
                      ).length
                    }
                  </Badge>

                  <Badge>
                    Awaiting Approval:{" "}
                    {
                      technicalVerifications.filter(
                        (item) =>
                          item.status ===
                          "awaiting_approval"
                      ).length
                    }
                  </Badge>
                </div>
              </div>
            </section>

            {impactAssessments.length ===
            0 ? (
              <Empty>
                No Policy Impact Assessments
                yet. Approve a policy version
                and run Analyze Policy Impact.
              </Empty>
            ) : (
              impactAssessments.map(
                (assessment) => {
                  const version =
                    versionById(
                      assessment.policy_version_id
                    );

                  const policy =
                    policyForVersion(
                      assessment.policy_version_id
                    );

                  const rowItems =
                    impactItemsForAssessment(
                      assessment.id
                    );

                  const rowRules =
                    rulesForVersion(
                      assessment.policy_version_id
                    );

                  const rowMismatches =
                    mismatchesForVersion(
                      assessment.policy_version_id
                    );

                  return (
                    <section
                      key={assessment.id}
                      style={{
                        background:
                          C.panel,
                        border:
                          `1px solid ${C.border}`,
                        borderRadius: 18,
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems:
                            "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 16,
                            }}
                          >
                            {policy?.code ||
                              "Policy"}{" "}
                            •{" "}
                            {policy?.title_ar ||
                              policy?.title_en ||
                              "—"}
                          </div>

                          <div
                            style={{
                              color:
                                C.muted,
                              fontSize: 12,
                              marginTop: 5,
                            }}
                          >
                            Version{" "}
                            {version
                              ?.version_number ||
                              "—"}{" "}
                            • Effective{" "}
                            {assessment.effective_date ||
                              version
                                ?.effective_date ||
                              "—"}
                          </div>

                          {assessment.analysis_summary ? (
                            <div
                              style={{
                                color:
                                  C.muted,
                                fontSize: 12,
                                marginTop: 8,
                                maxWidth:
                                  850,
                              }}
                            >
                              {
                                assessment.analysis_summary
                              }
                            </div>
                          ) : null}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 7,
                            flexWrap: "wrap",
                          }}
                        >
                          <Badge>
                            {
                              assessment.status
                            }
                          </Badge>

                          <Badge>
                            Risk:{" "}
                            {
                              assessment.overall_risk
                            }
                          </Badge>

                          <Badge>
                            Impacts:{" "}
                            {rowItems.length}
                          </Badge>

                          <Badge>
                            Rules:{" "}
                            {rowRules.length}
                          </Badge>

                          <Badge>
                            Mismatches:{" "}
                            {
                              rowMismatches.length
                            }
                          </Badge>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                          marginTop: 16,
                        }}
                      >
                        {rowItems.length ===
                        0 ? (
                          <Empty>
                            No impact items for
                            this assessment.
                          </Empty>
                        ) : (
                          rowItems.map(
                            (item) => {
                              const rule =
                                rowRules.find(
                                  (candidate) =>
                                    String(
                                      candidate
                                        .impact_item_id
                                    ) ===
                                    String(
                                      item.id
                                    )
                                );

                              const mismatch =
                                rowMismatches.find(
                                  (candidate) =>
                                    String(
                                      candidate
                                        .impact_item_id
                                    ) ===
                                    String(
                                      item.id
                                    )
                                );

                              const task =
                                taskById(
                                  item.task_id ||
                                    mismatch
                                      ?.task_id
                                );

                              const verifications =
                                mismatch
                                  ? verificationsForMismatch(
                                      mismatch.id
                                    )
                                  : [];

                              const latestVerification =
                                verifications.length
                                  ? verifications[
                                      verifications.length -
                                        1
                                    ]
                                  : null;

                              const approval =
                                approvalById(
                                  latestVerification
                                    ?.approval_id
                                );

                              const changeDecision =
                                changeDecisionForItem(
                                  item.id
                                );

                              const approveAction =
                                approvalDecisionForChangeType(
                                  item.change_type
                                );

                              const decisionPending =
                                changeDecision &&
                                changeDecision.decision ===
                                  "pending" &&
                                changeDecision.status ===
                                  "pending";

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  style={{
                                    background:
                                      C.soft,
                                    border:
                                      `1px solid ${C.border}`,
                                    borderRadius:
                                      12,
                                    padding: 14,
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      gap: 10,
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          fontWeight:
                                            900,
                                        }}
                                      >
                                        {item.affected_module ||
                                          item.domain ||
                                          "Policy Impact"}
                                        {" • "}
                                        {item.affected_component ||
                                          item.impact_type}
                                      </div>

                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            12,
                                          marginTop:
                                            5,
                                        }}
                                      >
                                        {
                                          item.description
                                        }
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        gap: 6,
                                        flexWrap:
                                          "wrap",
                                      }}
                                    >
                                      <Badge>
                                        {
                                          item.change_type
                                        }
                                      </Badge>

                                      <Badge>
                                        {
                                          item.impact_type
                                        }
                                      </Badge>

                                      <Badge>
                                        {
                                          item.enforcement_mode
                                        }
                                      </Badge>

                                      <Badge>
                                        {
                                          item.severity
                                        }
                                      </Badge>

                                      <Badge>
                                        {impactStatusLabel(
                                          item
                                        )}
                                      </Badge>
                                    </div>
                                  </div>

                                  {(Object.keys(
                                    item.current_value ||
                                      {}
                                  ).length >
                                    0 ||
                                    Object.keys(
                                      item.proposed_value ||
                                        {}
                                    ).length >
                                      0) ? (
                                    <div
                                      style={{
                                        display:
                                          "grid",
                                        gridTemplateColumns:
                                          "repeat(auto-fit, minmax(220px, 1fr))",
                                        gap: 8,
                                        marginTop:
                                          12,
                                      }}
                                    >
                                      <div
                                        style={{
                                          background:
                                            C.panel,
                                          borderRadius:
                                            9,
                                          padding:
                                            10,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color:
                                              C.muted,
                                            fontSize:
                                              10,
                                            fontWeight:
                                              800,
                                          }}
                                        >
                                          CURRENT
                                        </div>

                                        <pre
                                          style={{
                                            margin:
                                              "6px 0 0",
                                            fontSize:
                                              11,
                                            whiteSpace:
                                              "pre-wrap",
                                          }}
                                        >
                                          {JSON.stringify(
                                            item.current_value ||
                                              {},
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>

                                      <div
                                        style={{
                                          background:
                                            C.panel,
                                          borderRadius:
                                            9,
                                          padding:
                                            10,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color:
                                              C.primary,
                                            fontSize:
                                              10,
                                            fontWeight:
                                              800,
                                          }}
                                        >
                                          PROPOSED
                                        </div>

                                        <pre
                                          style={{
                                            margin:
                                              "6px 0 0",
                                            fontSize:
                                              11,
                                            whiteSpace:
                                              "pre-wrap",
                                          }}
                                        >
                                          {JSON.stringify(
                                            item.proposed_value ||
                                              {},
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    </div>
                                  ) : null}

                                  {editingImpactId ===
                                    item.id &&
                                  impactEditForm ? (
                                    <div
                                      style={{
                                        marginTop: 12,
                                        padding: 16,
                                        background:
                                          "rgba(245,201,107,.05)",
                                        border:
                                          `1px solid ${C.warning}55`,
                                        borderRadius: 12,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent:
                                            "space-between",
                                          alignItems:
                                            "flex-start",
                                          gap: 12,
                                          flexWrap: "wrap",
                                          marginBottom: 16,
                                        }}
                                      >
                                        <div>
                                          <div
                                            style={{
                                              color: C.warning,
                                              fontSize: 17,
                                              fontWeight: 900,
                                            }}
                                          >
                                            Edit Impact Proposal
                                          </div>

                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 11,
                                              marginTop: 4,
                                            }}
                                          >
                                            تعديل ومراجعة اقتراح الذكاء
                                            الاصطناعي قبل اعتماد أي تغيير
                                          </div>
                                        </div>

                                        <Badge>
                                          Human Review
                                        </Badge>
                                      </div>

                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "repeat(auto-fit, minmax(210px, 1fr))",
                                          gap: 10,
                                        }}
                                      >
                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            IMPACT TYPE
                                          </div>

                                          <select
                                            value={
                                              impactEditForm
                                                .impact_type
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                impact_type:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          >
                                            <option value="agent_behavior">
                                              Agent Behavior
                                            </option>
                                            <option value="configuration">
                                              Configuration
                                            </option>
                                            <option value="application_code">
                                              Application Code
                                            </option>
                                            <option value="workflow">
                                              Workflow
                                            </option>
                                            <option value="database">
                                              Database
                                            </option>
                                            <option value="calculator">
                                              Calculator
                                            </option>
                                            <option value="reporting">
                                              Reporting
                                            </option>
                                            <option value="integration">
                                              Integration
                                            </option>
                                            <option value="documentation">
                                              Documentation
                                            </option>
                                            <option value="no_system_impact">
                                              No System Impact
                                            </option>
                                          </select>
                                        </label>

                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            CHANGE TYPE
                                          </div>

                                          <select
                                            value={
                                              impactEditForm
                                                .change_type
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                change_type:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          >
                                            <option value="add">
                                              Add
                                            </option>
                                            <option value="modify">
                                              Modify
                                            </option>
                                            <option value="remove">
                                              Remove
                                            </option>
                                            <option value="no_change">
                                              No Change
                                            </option>
                                          </select>
                                        </label>

                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            SEVERITY
                                          </div>

                                          <select
                                            value={
                                              impactEditForm
                                                .severity
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                severity:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          >
                                            <option value="low">
                                              Low
                                            </option>
                                            <option value="medium">
                                              Medium
                                            </option>
                                            <option value="high">
                                              High
                                            </option>
                                            <option value="critical">
                                              Critical
                                            </option>
                                          </select>
                                        </label>

                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            ENFORCEMENT METHOD
                                          </div>

                                          <select
                                            value={
                                              impactEditForm
                                                .enforcement_mode
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                enforcement_mode:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          >
                                            <option value="automatic">
                                              Automatic
                                            </option>
                                            <option value="configuration">
                                              Configuration
                                            </option>
                                            <option value="it_task">
                                              IT Task
                                            </option>
                                            <option value="manual_review">
                                              Manual Review
                                            </option>
                                            <option value="documentation_only">
                                              Documentation Only
                                            </option>
                                          </select>
                                        </label>

                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            AFFECTED MODULE
                                          </div>

                                          <input
                                            value={
                                              impactEditForm
                                                .affected_module
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                affected_module:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              boxSizing: "border-box",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          />
                                        </label>

                                        <label>
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 5,
                                            }}
                                          >
                                            AFFECTED COMPONENT
                                          </div>

                                          <input
                                            value={
                                              impactEditForm
                                                .affected_component
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                affected_component:
                                                  e.target.value,
                                              })
                                            }
                                            style={{
                                              width: "100%",
                                              boxSizing: "border-box",
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: "9px 10px",
                                            }}
                                          />
                                        </label>
                                      </div>

                                      <label
                                        style={{
                                          display: "block",
                                          marginTop: 12,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: C.muted,
                                            fontSize: 10,
                                            fontWeight: 900,
                                            marginBottom: 5,
                                          }}
                                        >
                                          IMPACT DESCRIPTION
                                        </div>

                                        <textarea
                                          value={
                                            impactEditForm
                                              .description
                                          }
                                          onChange={(e) =>
                                            setImpactEditForm({
                                              ...impactEditForm,
                                              description:
                                                e.target.value,
                                            })
                                          }
                                          style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            minHeight: 75,
                                            background: C.soft,
                                            color: C.text,
                                            border:
                                              `1px solid ${C.border}`,
                                            borderRadius: 8,
                                            padding: "9px 10px",
                                          }}
                                        />
                                      </label>

                                      <label
                                        style={{
                                          display: "block",
                                          marginTop: 10,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: C.muted,
                                            fontSize: 10,
                                            fontWeight: 900,
                                            marginBottom: 5,
                                          }}
                                        >
                                          RECOMMENDED ACTION
                                        </div>

                                        <textarea
                                          value={
                                            impactEditForm
                                              .recommended_action
                                          }
                                          onChange={(e) =>
                                            setImpactEditForm({
                                              ...impactEditForm,
                                              recommended_action:
                                                e.target.value,
                                            })
                                          }
                                          style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            minHeight: 65,
                                            background: C.soft,
                                            color: C.text,
                                            border:
                                              `1px solid ${C.border}`,
                                            borderRadius: 8,
                                            padding: "9px 10px",
                                          }}
                                        />
                                      </label>

                                      <label
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          marginTop: 12,
                                          fontSize: 12,
                                          fontWeight: 800,
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            impactEditForm
                                              .auto_applicable
                                          }
                                          onChange={(e) =>
                                            setImpactEditForm({
                                              ...impactEditForm,
                                              auto_applicable:
                                                e.target.checked,
                                            })
                                          }
                                        />

                                        Auto Applicable
                                        — قابل للتطبيق تلقائيًا
                                      </label>

                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "repeat(auto-fit, minmax(280px, 1fr))",
                                          gap: 10,
                                          marginTop: 14,
                                        }}
                                      >
                                        <div
                                          style={{
                                            background: C.panel,
                                            border:
                                              `1px solid ${C.border}`,
                                            borderRadius: 10,
                                            padding: 12,
                                          }}
                                        >
                                          <div
                                            style={{
                                              color: C.muted,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 8,
                                            }}
                                          >
                                            CURRENT STATE
                                          </div>

                                          {Object.entries(
                                            safeJsonObject(
                                              impactEditForm
                                                .current_value_json
                                            )
                                          ).length === 0 ? (
                                            <div
                                              style={{
                                                color: C.muted,
                                                fontSize: 11,
                                              }}
                                            >
                                              No structured current value
                                            </div>
                                          ) : (
                                            Object.entries(
                                              safeJsonObject(
                                                impactEditForm
                                                  .current_value_json
                                              )
                                            ).map(
                                              ([key, value]) => (
                                                <div
                                                  key={key}
                                                  style={{
                                                    marginBottom: 7,
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      color: C.muted,
                                                      fontSize: 9,
                                                      fontWeight: 900,
                                                    }}
                                                  >
                                                    {readableFieldName(
                                                      key
                                                    )}
                                                  </div>

                                                  <div
                                                    style={{
                                                      marginTop: 3,
                                                      fontSize: 11,
                                                      whiteSpace:
                                                        "pre-wrap",
                                                      wordBreak:
                                                        "break-word",
                                                    }}
                                                  >
                                                    {readableFieldValue(
                                                      value
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            )
                                          )}
                                        </div>

                                        <div
                                          style={{
                                            background: C.panel,
                                            border:
                                              `1px solid ${C.primary}44`,
                                            borderRadius: 10,
                                            padding: 12,
                                          }}
                                        >
                                          <div
                                            style={{
                                              color: C.primary,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              marginBottom: 8,
                                            }}
                                          >
                                            PROPOSED STATE
                                          </div>

                                          {Object.entries(
                                            safeJsonObject(
                                              impactEditForm
                                                .proposed_value_json
                                            )
                                          ).length === 0 ? (
                                            <div
                                              style={{
                                                color: C.muted,
                                                fontSize: 11,
                                              }}
                                            >
                                              No structured proposed value
                                            </div>
                                          ) : (
                                            Object.entries(
                                              safeJsonObject(
                                                impactEditForm
                                                  .proposed_value_json
                                              )
                                            ).map(
                                              ([key, value]) => (
                                                <div
                                                  key={key}
                                                  style={{
                                                    marginBottom: 7,
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      color: C.muted,
                                                      fontSize: 9,
                                                      fontWeight: 900,
                                                    }}
                                                  >
                                                    {readableFieldName(
                                                      key
                                                    )}
                                                  </div>

                                                  <div
                                                    style={{
                                                      marginTop: 3,
                                                      fontSize: 11,
                                                      whiteSpace:
                                                        "pre-wrap",
                                                      wordBreak:
                                                        "break-word",
                                                    }}
                                                  >
                                                    {readableFieldValue(
                                                      value
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            )
                                          )}
                                        </div>
                                      </div>

                                      <label
                                        style={{
                                          display: "block",
                                          marginTop: 14,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: C.muted,
                                            fontSize: 10,
                                            fontWeight: 900,
                                            marginBottom: 5,
                                          }}
                                        >
                                          ACCEPTANCE CRITERIA
                                          — معيار القبول
                                        </div>

                                        <textarea
                                          value={
                                            impactEditForm
                                              .acceptance_criteria_text
                                          }
                                          onChange={(e) =>
                                            setImpactEditForm({
                                              ...impactEditForm,
                                              acceptance_criteria_text:
                                                e.target.value,
                                            })
                                          }
                                          placeholder={
                                            "One acceptance criterion per line"
                                          }
                                          style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            minHeight: 105,
                                            background: C.soft,
                                            color: C.text,
                                            border:
                                              `1px solid ${C.border}`,
                                            borderRadius: 8,
                                            padding: 10,
                                            lineHeight: 1.6,
                                          }}
                                        />
                                      </label>

                                      <details
                                        style={{
                                          marginTop: 14,
                                          background: C.panel,
                                          border:
                                            `1px solid ${C.border}`,
                                          borderRadius: 10,
                                          padding: 11,
                                        }}
                                      >
                                        <summary
                                          style={{
                                            cursor: "pointer",
                                            color: C.muted,
                                            fontSize: 11,
                                            fontWeight: 900,
                                          }}
                                        >
                                          Advanced JSON
                                          — إعدادات متقدمة
                                        </summary>

                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "repeat(auto-fit, minmax(280px, 1fr))",
                                            gap: 9,
                                            marginTop: 12,
                                          }}
                                        >
                                          <textarea
                                            value={
                                              impactEditForm
                                                .current_value_json
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                current_value_json:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder="Current Value JSON"
                                            style={{
                                              minHeight: 120,
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: 9,
                                              fontFamily:
                                                "monospace",
                                              fontSize: 11,
                                            }}
                                          />

                                          <textarea
                                            value={
                                              impactEditForm
                                                .proposed_value_json
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                proposed_value_json:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder="Proposed Value JSON"
                                            style={{
                                              minHeight: 120,
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: 9,
                                              fontFamily:
                                                "monospace",
                                              fontSize: 11,
                                            }}
                                          />

                                          <textarea
                                            value={
                                              impactEditForm
                                                .acceptance_criteria_json
                                            }
                                            onChange={(e) =>
                                              setImpactEditForm({
                                                ...impactEditForm,
                                                acceptance_criteria_json:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder="Acceptance Criteria JSON"
                                            style={{
                                              minHeight: 120,
                                              background: C.soft,
                                              color: C.text,
                                              border:
                                                `1px solid ${C.border}`,
                                              borderRadius: 8,
                                              padding: 9,
                                              fontFamily:
                                                "monospace",
                                              fontSize: 11,
                                            }}
                                          />
                                        </div>
                                      </details>

                                      {[
                                        "application_code",
                                        "workflow",
                                        "database",
                                        "calculator",
                                        "reporting",
                                        "integration",
                                      ].includes(
                                        impactEditForm
                                          .impact_type
                                      ) ? (
                                        <div
                                          style={{
                                            marginTop: 12,
                                            padding: "9px 11px",
                                            border:
                                              `1px solid ${C.warning}44`,
                                            background:
                                              "rgba(245,201,107,.06)",
                                            borderRadius: 8,
                                            color: C.warning,
                                            fontSize: 11,
                                            fontWeight: 800,
                                          }}
                                        >
                                          ⚠ Technical impact detected.
                                          Even if Automatic is selected,
                                          the backend will force this
                                          change through an IT Task and
                                          technical verification workflow.
                                        </div>
                                      ) : null}

                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 8,
                                          flexWrap: "wrap",
                                          marginTop: 14,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          disabled={
                                            savingImpactEdit
                                          }
                                          onClick={() =>
                                            saveImpactProposal(
                                              changeDecision
                                            )
                                          }
                                          style={{
                                            background:
                                              C.primary,
                                            color: "#04100b",
                                            border: 0,
                                            borderRadius: 8,
                                            padding:
                                              "9px 14px",
                                            fontWeight: 900,
                                          }}
                                        >
                                          {savingImpactEdit
                                            ? "Saving..."
                                            : "Save Proposal"}
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            savingImpactEdit
                                          }
                                          onClick={
                                            cancelEditImpactProposal
                                          }
                                          style={{
                                            background:
                                              "transparent",
                                            color: C.muted,
                                            border:
                                              `1px solid ${C.border}`,
                                            borderRadius: 8,
                                            padding:
                                              "9px 14px",
                                            fontWeight: 800,
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}

                                  {changeDecision ? (
                                    <div
                                      style={{
                                        marginTop: 12,
                                        background:
                                          C.panel,
                                        border:
                                          `1px solid ${
                                            decisionPending
                                              ? C.primary + "55"
                                              : C.border
                                          }`,
                                        borderRadius: 10,
                                        padding: 12,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          justifyContent:
                                            "space-between",
                                          gap: 10,
                                          flexWrap:
                                            "wrap",
                                          alignItems:
                                            "center",
                                        }}
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontSize:
                                                10,
                                              color:
                                                C.muted,
                                              fontWeight:
                                                900,
                                            }}
                                          >
                                            YOUR CHANGE
                                            DECISION
                                          </div>

                                          <div
                                            style={{
                                              marginTop:
                                                5,
                                              fontSize:
                                                12,
                                              fontWeight:
                                                800,
                                              color:
                                                decisionPending
                                                  ? C.warning
                                                  : C.primary,
                                            }}
                                          >
                                            {decisionPending
                                              ? "Awaiting your decision"
                                              : `${changeDecision.decision} • ${changeDecision.status}`}
                                          </div>

                                          {changeDecision
                                            .decision_notes ? (
                                            <div
                                              style={{
                                                color:
                                                  C.muted,
                                                fontSize:
                                                  11,
                                                marginTop:
                                                  5,
                                              }}
                                            >
                                              {
                                                changeDecision
                                                  .decision_notes
                                              }
                                            </div>
                                          ) : null}
                                        </div>

                                        {decisionPending ? (
                                          <div
                                            style={{
                                              display:
                                                "flex",
                                              gap: 7,
                                              flexWrap:
                                                "wrap",
                                            }}
                                          >
                                            <button
                                              type="button"
                                              disabled={
                                                decidingChangeId ===
                                                  changeDecision.id ||
                                                savingImpactEdit
                                              }
                                              onClick={() =>
                                                editingImpactId ===
                                                item.id
                                                  ? cancelEditImpactProposal()
                                                  : startEditImpactProposal(
                                                      item
                                                    )
                                              }
                                              style={{
                                                background:
                                                  "rgba(245,201,107,.10)",
                                                color:
                                                  C.warning,
                                                border:
                                                  `1px solid ${C.warning}55`,
                                                borderRadius:
                                                  8,
                                                padding:
                                                  "7px 10px",
                                                fontWeight:
                                                  900,
                                              }}
                                            >
                                              {editingImpactId ===
                                              item.id
                                                ? "Cancel Edit"
                                                : "Edit Proposal"}
                                            </button>

                                            {approveAction ? (
                                              <button
                                                type="button"
                                                disabled={
                                                  decidingChangeId ===
                                                  changeDecision.id
                                                }
                                                onClick={() =>
                                                  decidePolicyChange(
                                                    changeDecision,
                                                    approveAction.value
                                                  )
                                                }
                                                style={{
                                                  background:
                                                    C.primary,
                                                  color:
                                                    "#04100b",
                                                  border:
                                                    0,
                                                  borderRadius:
                                                    8,
                                                  padding:
                                                    "7px 10px",
                                                  fontWeight:
                                                    900,
                                                  cursor:
                                                    decidingChangeId ===
                                                    changeDecision.id
                                                      ? "wait"
                                                      : "pointer",
                                                }}
                                              >
                                                {decidingChangeId ===
                                                changeDecision.id
                                                  ? "Saving..."
                                                  : approveAction.label}
                                              </button>
                                            ) : null}

                                            <button
                                              type="button"
                                              disabled={
                                                decidingChangeId ===
                                                changeDecision.id
                                              }
                                              onClick={() =>
                                                decidePolicyChange(
                                                  changeDecision,
                                                  "keep_existing"
                                                )
                                              }
                                              style={{
                                                background:
                                                  "rgba(114,183,255,.10)",
                                                color:
                                                  C.blue,
                                                border:
                                                  `1px solid ${C.blue}55`,
                                                borderRadius:
                                                  8,
                                                padding:
                                                  "7px 10px",
                                                fontWeight:
                                                  900,
                                              }}
                                            >
                                              Keep Existing
                                            </button>

                                            <button
                                              type="button"
                                              disabled={
                                                decidingChangeId ===
                                                changeDecision.id
                                              }
                                              onClick={() =>
                                                decidePolicyChange(
                                                  changeDecision,
                                                  "ignore"
                                                )
                                              }
                                              style={{
                                                background:
                                                  "transparent",
                                                color:
                                                  C.muted,
                                                border:
                                                  `1px solid ${C.border}`,
                                                borderRadius:
                                                  8,
                                                padding:
                                                  "7px 10px",
                                                fontWeight:
                                                  800,
                                              }}
                                            >
                                              Ignore
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : null}

                                  <div
                                    style={{
                                      display:
                                        "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(190px, 1fr))",
                                      gap: 8,
                                      marginTop:
                                        12,
                                    }}
                                  >
                                    <div
                                      style={{
                                        background:
                                          C.panel,
                                        borderRadius:
                                          9,
                                        padding:
                                          10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        ENFORCEMENT RULE
                                      </div>

                                      <div
                                        style={{
                                          marginTop:
                                            5,
                                          fontSize:
                                            11,
                                        }}
                                      >
                                        {rule
                                          ? `${rule.rule_key} • ${rule.status}`
                                          : "Not required"}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        background:
                                          C.panel,
                                        borderRadius:
                                          9,
                                        padding:
                                          10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        IT TASK
                                      </div>

                                      <div
                                        style={{
                                          marginTop: 5,
                                          fontSize: 11,
                                        }}
                                      >
                                        {task
                                          ? `${task.status} • ${task.priority}`
                                          : "Not required"}
                                      </div>

                                      {task?.status ===
                                      "pending" ? (
                                        <button
                                          type="button"
                                          disabled={
                                            updatingItTaskId ===
                                            task.id
                                          }
                                          onClick={() =>
                                            updatePolicyItTask(
                                              task,
                                              "in_progress"
                                            )
                                          }
                                          style={{
                                            marginTop: 8,
                                            background:
                                              "rgba(114,183,255,.12)",
                                            color: C.blue,
                                            border:
                                              `1px solid ${C.blue}55`,
                                            borderRadius: 7,
                                            padding:
                                              "6px 8px",
                                            fontSize: 10,
                                            fontWeight: 900,
                                          }}
                                        >
                                          {updatingItTaskId ===
                                          task.id
                                            ? "Updating..."
                                            : "Start IT Work"}
                                        </button>
                                      ) : null}

                                      {task?.status ===
                                      "in_progress" ? (
                                        <button
                                          type="button"
                                          disabled={
                                            updatingItTaskId ===
                                            task.id
                                          }
                                          onClick={() =>
                                            updatePolicyItTask(
                                              task,
                                              "completed"
                                            )
                                          }
                                          style={{
                                            marginTop: 8,
                                            background:
                                              "rgba(24,213,183,.10)",
                                            color:
                                              C.primary,
                                            border:
                                              `1px solid ${C.primary}55`,
                                            borderRadius: 7,
                                            padding:
                                              "6px 8px",
                                            fontSize: 10,
                                            fontWeight: 900,
                                          }}
                                        >
                                          {updatingItTaskId ===
                                          task.id
                                            ? "Updating..."
                                            : "Mark IT Completed"}
                                        </button>
                                      ) : null}
                                    </div>

                                    <div
                                      style={{
                                        background:
                                          C.panel,
                                        borderRadius:
                                          9,
                                        padding:
                                          10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        POLICY / SYSTEM
                                        MISMATCH
                                      </div>

                                      <div
                                        style={{
                                          marginTop:
                                            5,
                                          fontSize:
                                            11,
                                          color:
                                            mismatch?.status ===
                                            "open"
                                              ? C.warning
                                              : undefined,
                                        }}
                                      >
                                        {mismatch
                                          ? `${mismatch.status} • ${mismatch.severity}`
                                          : "None"}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        background:
                                          C.panel,
                                        borderRadius:
                                          9,
                                        padding:
                                          10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        TECHNICAL
                                        VERIFICATION
                                      </div>

                                      <div
                                        style={{
                                          marginTop: 5,
                                          fontSize: 11,
                                        }}
                                      >
                                        {latestVerification
                                          ? latestVerification.status
                                          : "Not started"}
                                      </div>

                                      {task?.status ===
                                        "completed" &&
                                      mismatch?.status ===
                                        "open" &&
                                      (
                                        !latestVerification ||
                                        [
                                          "failed",
                                          "rejected",
                                        ].includes(
                                          latestVerification.status
                                        )
                                      ) ? (
                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            gap: 5,
                                            flexWrap:
                                              "wrap",
                                            marginTop: 8,
                                          }}
                                        >
                                          <button
                                            type="button"
                                            disabled={
                                              verifyingMismatchId ===
                                              mismatch.id
                                            }
                                            onClick={() =>
                                              verifyPolicyTechnicalChange(
                                                mismatch,
                                                true
                                              )
                                            }
                                            style={{
                                              background:
                                                "rgba(24,213,183,.10)",
                                              color:
                                                C.primary,
                                              border:
                                                `1px solid ${C.primary}55`,
                                              borderRadius:
                                                7,
                                              padding:
                                                "6px 8px",
                                              fontSize:
                                                10,
                                              fontWeight:
                                                900,
                                            }}
                                          >
                                            Pass
                                          </button>

                                          <button
                                            type="button"
                                            disabled={
                                              verifyingMismatchId ===
                                              mismatch.id
                                            }
                                            onClick={() =>
                                              verifyPolicyTechnicalChange(
                                                mismatch,
                                                false
                                              )
                                            }
                                            style={{
                                              background:
                                                "rgba(255,107,107,.08)",
                                              color:
                                                C.danger,
                                              border:
                                                `1px solid ${C.danger}55`,
                                              borderRadius:
                                                7,
                                              padding:
                                                "6px 8px",
                                              fontSize:
                                                10,
                                              fontWeight:
                                                900,
                                            }}
                                          >
                                            Fail
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>

                                    <div
                                      style={{
                                        background:
                                          C.panel,
                                        borderRadius:
                                          9,
                                        padding:
                                          10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            C.muted,
                                          fontSize:
                                            10,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        FINAL APPROVAL
                                      </div>

                                      <div
                                        style={{
                                          marginTop: 5,
                                          fontSize: 11,
                                          color:
                                            approval?.status ===
                                            "pending"
                                              ? C.warning
                                              : undefined,
                                        }}
                                      >
                                        {approval
                                          ? approval.status
                                          : latestVerification
                                              ?.status ===
                                            "awaiting_approval"
                                          ? "Awaiting user approval"
                                          : "Not required / not reached"}
                                      </div>

                                      {approval?.status ===
                                      "pending" ? (
                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            gap: 5,
                                            flexWrap:
                                              "wrap",
                                            marginTop: 8,
                                          }}
                                        >
                                          <button
                                            type="button"
                                            disabled={
                                              decidingApprovalId ===
                                              approval.id
                                            }
                                            onClick={() =>
                                              decidePolicyTechnicalApproval(
                                                approval,
                                                true
                                              )
                                            }
                                            style={{
                                              background:
                                                C.primary,
                                              color:
                                                "#04100b",
                                              border: 0,
                                              borderRadius:
                                                7,
                                              padding:
                                                "6px 8px",
                                              fontSize:
                                                10,
                                              fontWeight:
                                                900,
                                            }}
                                          >
                                            Approve
                                          </button>

                                          <button
                                            type="button"
                                            disabled={
                                              decidingApprovalId ===
                                              approval.id
                                            }
                                            onClick={() =>
                                              decidePolicyTechnicalApproval(
                                                approval,
                                                false
                                              )
                                            }
                                            style={{
                                              background:
                                                "transparent",
                                              color:
                                                C.danger,
                                              border:
                                                `1px solid ${C.danger}55`,
                                              borderRadius:
                                                7,
                                              padding:
                                                "6px 8px",
                                              fontSize:
                                                10,
                                              fontWeight:
                                                900,
                                            }}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  {mismatch?.status ===
                                  "open" ? (
                                    <div
                                      style={{
                                        marginTop:
                                          10,
                                        padding:
                                          "8px 10px",
                                        background:
                                          "rgba(245,201,107,.08)",
                                        border:
                                          `1px solid ${C.warning}44`,
                                        borderRadius:
                                          8,
                                        color:
                                          C.warning,
                                        fontSize:
                                          11,
                                        fontWeight:
                                          800,
                                      }}
                                    >
                                      ⚠ Policy/System
                                      Mismatch is still
                                      open. The Agent may
                                      explain the approved
                                      policy but must not
                                      claim the application
                                      has fully implemented
                                      this change yet.
                                    </div>
                                  ) : null}

                                  {mismatch?.status ===
                                  "resolved" ? (
                                    <div
                                      style={{
                                        marginTop:
                                          10,
                                        padding:
                                          "8px 10px",
                                        background:
                                          "rgba(24,213,183,.08)",
                                        border:
                                          `1px solid ${C.primary}44`,
                                        borderRadius:
                                          8,
                                        color:
                                          C.primary,
                                        fontSize:
                                          11,
                                        fontWeight:
                                          800,
                                      }}
                                    >
                                      ✓ Technical impact
                                      verified and final
                                      acceptance completed.
                                    </div>
                                  ) : null}
                                </div>
                              );
                            }
                          )
                        )}
                      </div>
                    </section>
                  );
                }
              )
            )}
          </div>
        ) : null}

        {tab === "conflicts" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <form
              onSubmit={createConflict}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Register Policy Conflict</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
                  gap: 11,
                }}
              >
                <select
                  style={input}
                  value={conflictForm.source_version_id}
                  onChange={(e) =>
                    setConflictForm({
                      ...conflictForm,
                      source_version_id: e.target.value,
                    })
                  }
                >
                  <option value="">Source Version...</option>
                  {versions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {versionMap[row.id]}
                    </option>
                  ))}
                </select>

                <select
                  style={input}
                  value={conflictForm.conflicting_version_id}
                  onChange={(e) =>
                    setConflictForm({
                      ...conflictForm,
                      conflicting_version_id: e.target.value,
                    })
                  }
                >
                  <option value="">Conflicting Version...</option>
                  {versions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {versionMap[row.id]}
                    </option>
                  ))}
                </select>

                <select
                  style={input}
                  value={conflictForm.severity}
                  onChange={(e) =>
                    setConflictForm({
                      ...conflictForm,
                      severity: e.target.value,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <textarea
                style={{ ...input, minHeight: 90, marginTop: 11 }}
                placeholder="Conflict Description"
                value={conflictForm.description}
                onChange={(e) =>
                  setConflictForm({
                    ...conflictForm,
                    description: e.target.value,
                  })
                }
              />

              <button
                disabled={saving}
                type="submit"
                style={{
                  marginTop: 12,
                  background: C.warning,
                  color: "#171005",
                  border: 0,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontWeight: 800,
                }}
              >
                Register Conflict
              </button>
            </form>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Conflict Register</h3>

              {conflicts.length === 0 ? (
                <Empty>No policy conflicts</Empty>
              ) : (
                conflicts.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: C.soft,
                      padding: 13,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <strong>{row.description}</strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      {versionMap[row.source_version_id] || row.source_version_id}
                      {" ↔ "}
                      {versionMap[row.conflicting_version_id] ||
                        row.conflicting_version_id}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge>{row.severity}</Badge>
                      <Badge>{row.status}</Badge>

                      {row.status === "open" ? (
                        <button
                          disabled={saving}
                          onClick={() => resolveConflict(row)}
                        >
                          Resolve
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        ) : null}

        {tab === "checklists" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(430px,1fr))",
                gap: 18,
              }}
            >
              <form
                onSubmit={createChecklist}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <h3 style={{ marginTop: 0 }}>New Compliance Checklist</h3>

                <input
                  style={input}
                  placeholder="Checklist Code"
                  value={checklistForm.code}
                  onChange={(e) =>
                    setChecklistForm({
                      ...checklistForm,
                      code: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Checklist Title"
                  value={checklistForm.title}
                  onChange={(e) =>
                    setChecklistForm({
                      ...checklistForm,
                      title: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Responsible Owner"
                  value={checklistForm.responsible_owner}
                  onChange={(e) =>
                    setChecklistForm({
                      ...checklistForm,
                      responsible_owner: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  type="date"
                  value={checklistForm.due_date}
                  onChange={(e) =>
                    setChecklistForm({
                      ...checklistForm,
                      due_date: e.target.value,
                    })
                  }
                />

                <textarea
                  style={{ ...input, minHeight: 70, marginTop: 10 }}
                  placeholder="Description"
                  value={checklistForm.description}
                  onChange={(e) =>
                    setChecklistForm({
                      ...checklistForm,
                      description: e.target.value,
                    })
                  }
                />

                <button disabled={saving} type="submit" style={{ marginTop: 10 }}>
                  Create Checklist
                </button>
              </form>

              <form
                onSubmit={createChecklistItem}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 20,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Add Checklist Item</h3>

                <select
                  style={input}
                  value={itemForm.checklist_id}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      checklist_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select checklist...</option>
                  {checklists.map((row) => (
                    <option key={row.id} value={row.id}>
                      {checklistMap[row.id]}
                    </option>
                  ))}
                </select>

                <input
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Requirement"
                  value={itemForm.title}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      title: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Reference / المادة أو المتطلب"
                  value={itemForm.requirement_reference}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      requirement_reference: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  placeholder="Responsible Owner"
                  value={itemForm.responsible_owner}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      responsible_owner: e.target.value,
                    })
                  }
                />

                <input
                  style={{ ...input, marginTop: 10 }}
                  type="date"
                  value={itemForm.due_date}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      due_date: e.target.value,
                    })
                  }
                />

                <button disabled={saving} type="submit" style={{ marginTop: 10 }}>
                  Add Item
                </button>
              </form>
            </div>

            <section
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Compliance Register</h3>

              {checklists.length === 0 ? (
                <Empty>No compliance checklists</Empty>
              ) : (
                checklists.map((checklist) => (
                  <div
                    key={checklist.id}
                    style={{
                      background: C.soft,
                      padding: 14,
                      borderRadius: 11,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{checklistMap[checklist.id]}</strong>
                      <Badge>{checklist.status}</Badge>
                    </div>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Owner: {checklist.responsible_owner || "—"} • Due:{" "}
                      {checklist.due_date || "—"}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 7,
                        marginTop: 10,
                      }}
                    >
                      {items
                        .filter(
                          (item) => item.checklist_id === checklist.id
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: C.panel,
                              padding: 10,
                              borderRadius: 9,
                            }}
                          >
                            <strong>{item.title}</strong>

                            <div
                              style={{
                                color: C.muted,
                                fontSize: 12,
                                marginTop: 5,
                              }}
                            >
                              {item.requirement_reference || "No reference"} • Due:{" "}
                              {item.due_date || "—"}
                            </div>

                            {attachmentsFor(
                              "compliance_checklist_item",
                              item.id
                            ).length > 0 ? (
                              <div
                                style={{
                                  display: "grid",
                                  gap: 5,
                                  marginTop: 8,
                                }}
                              >
                                {attachmentsFor(
                                  "compliance_checklist_item",
                                  item.id
                                ).map(
                                  (
                                    attachment
                                  ) => (
                                    <div
                                      key={
                                        attachment.id
                                      }
                                      style={{
                                        display:
                                          "flex",
                                        justifyContent:
                                          "space-between",
                                        alignItems:
                                          "center",
                                        gap: 8,
                                        flexWrap:
                                          "wrap",
                                        background:
                                          C.soft,
                                        border:
                                          `1px solid ${C.border}`,
                                        borderRadius:
                                          7,
                                        padding:
                                          "6px 8px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize:
                                            11,
                                        }}
                                      >
                                        📎{" "}
                                        {
                                          attachment.original_file_name
                                        }
                                      </span>

                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          gap: 8,
                                        }}
                                      >
                                        <a
                                          href={
                                            attachment.download_url
                                          }
                                          style={{
                                            color:
                                              C.blue,
                                            fontSize:
                                              10,
                                            fontWeight:
                                              800,
                                            textDecoration:
                                              "none",
                                          }}
                                        >
                                          Download
                                        </a>

                                        <button
                                          type="button"
                                          disabled={
                                            saving
                                          }
                                          onClick={() =>
                                            archiveAttachment(
                                              attachment
                                            )
                                          }
                                          style={{
                                            background:
                                              "transparent",
                                            border:
                                              0,
                                            padding:
                                              0,
                                            color:
                                              C.warning,
                                            fontSize:
                                              10,
                                            fontWeight:
                                              800,
                                            cursor:
                                              "pointer",
                                          }}
                                        >
                                          Archive
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : null}

                            <div
                              style={{
                                marginTop: 8,
                              }}
                            >
                              <input
                                key={`${item.id}-${
                                  evidenceFiles[
                                    item.id
                                  ]?.name ||
                                  "empty"
                                }`}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                                style={{
                                  ...input,
                                  padding:
                                    "7px 8px",
                                  fontSize:
                                    11,
                                }}
                                onChange={(e) =>
                                  setEvidenceFiles(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      [item.id]:
                                        e
                                          .target
                                          .files?.[0] ||
                                        null,
                                    })
                                  )
                                }
                              />

                              <div
                                style={{
                                  color:
                                    C.muted,
                                  fontSize:
                                    10,
                                  marginTop:
                                    4,
                                }}
                              >
                                Evidence File •
                                Optional • Max 20 MB
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 7,
                                marginTop: 7,
                                flexWrap: "wrap",
                              }}
                            >
                              <Badge>{item.status}</Badge>

                              <button
                                disabled={saving}
                                onClick={() =>
                                  updateChecklistItem(
                                    item
                                  )
                                }
                              >
                                {evidenceFiles[
                                  item.id
                                ]
                                  ? "Update & Upload Evidence"
                                  : "Update"}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        ) : null}

        {tab === "alerts" ? (
          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Policy & Compliance Alerts</h3>

            {alerts.length === 0 ? (
              <Empty>No alerts — لا توجد تنبيهات</Empty>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {alerts.map((row, index) => (
                  <div
                    key={`${row.type}-${index}`}
                    style={{
                      background: C.soft,
                      padding: 13,
                      borderRadius: 10,
                    }}
                  >
                    <strong>{row.message}</strong>

                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      {row.type.replaceAll("_", " ")}
                      {row.due_date ? ` • Due: ${row.due_date}` : ""}
                      {row.days_remaining !== undefined
                        ? ` • ${row.days_remaining} days`
                        : ""}
                    </div>

                    <div style={{ marginTop: 7 }}>
                      <Badge>{row.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
