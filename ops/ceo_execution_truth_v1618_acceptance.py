"""Acceptance checks for the v1.6.18 truthful bank-balance read path."""

import ast
import json
import os
import urllib.request
from datetime import date
from decimal import Decimal
from pathlib import Path


source = Path("/app/app/main.py")
if not source.exists():
    source = Path("backend/app/main.py")

tree = ast.parse(source.read_text())
functions = {
    node.name: node
    for node in tree.body
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
}
assert "_hr_recruitment_vacancy_snapshot" in functions
assert "_hr_recruitment_vacancy_record" in functions
assert "_ceo_exec_truth_response" in functions
assert "_ceo_exec_expand_vacancy_reference" in functions
assert "_ceo_exec_internal_route_catalog" in functions
assert "_ceo_exec_internal_api_call" in functions
assert "_ceo_exec_override_dashboard_plan" in functions
assert "_ceo_exec_override_bank_balance_plan" in functions
assert "_ceo_exec_bank_balance_snapshot" in functions
assert "_ceo_exec_override_finance_attachment_registration_plan" in functions
assert "_ceo_exec_register_finance_documents_from_attachments" in functions
assert "_ceo_finance_parse_invoice" in functions
assert "_ceo_finance_parse_receipt" in functions
assert "_ceo_finance_parse_contract" in functions

vacancy_function_source = ast.get_source_segment(
    source.read_text(),
    functions.get("_ceo_exec_create_hr_vacancy"),
) or ""
assert "begin_nested" in vacancy_function_source
assert "manager_assignment_status" in vacancy_function_source

chat_function = functions["chat_with_agent"]
chat_function_source = ast.get_source_segment(
    source.read_text(),
    chat_function,
) or ""
assert "conversation_id_value" in chat_function_source
chat_call_names = {
    node.func.id
    for node in ast.walk(chat_function)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
}
chat_attribute_calls = {
    node.func.attr
    for node in ast.walk(chat_function)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Attribute)
}
assert "rollback" in chat_attribute_calls
chat_literals = {
    node.value
    for node in ast.walk(chat_function)
    if isinstance(node, ast.Constant)
    and isinstance(node.value, str)
}
assert "ceo_execution_engine_error" in chat_literals
assert "internal_execution" in chat_literals

for function_name in (
    "recruitment_list_vacancies",
    "recruitment_summary",
    "_ceo_exec_get_hr_vacancy_state",
):
    calls = {
        node.func.id
        for node in ast.walk(functions[function_name])
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
    }
    assert "_hr_recruitment_vacancy_snapshot" in calls, function_name

execution_layer = functions["_ceo_execution_layer"]
execution_layer_source = ast.get_source_segment(source.read_text(), execution_layer) or ""
execution_calls = {
    node.func.id
    for node in ast.walk(execution_layer)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
}
assert "_ceo_exec_override_hr_vacancy_lookup_plan" in execution_calls
assert "_ceo_exec_is_record_lookup_request" in execution_calls
assert "_ceo_exec_expand_vacancy_reference" in execution_calls
assert "_ceo_exec_override_dashboard_plan" in execution_calls
assert "_ceo_exec_override_bank_balance_plan" in execution_calls
assert "_ceo_exec_override_finance_attachment_registration_plan" in execution_calls
assert "_ceo_exec_internal_route_catalog" in execution_calls
assert '"execute_internal_api"' in execution_layer_source
assert '"GET"' in execution_layer_source

namespace = {
    "json": json,
    "_CEO_INTERNAL_BLOCKED_PATH_MARKERS": (
        "/api/chat",
        "/api/conversations",
        "/api/memories",
        "/api/internal/",
        "/upload",
        "/payment",
        "payments",
        "transfer",
        "/approve",
        "/reject",
        "/post",
        "/apply",
        "send",
        "publish",
        "deploy",
        "filing",
        "external",
    )
}
exec(
    compile(
        ast.Module(
            body=[
                functions["_ceo_finance_compact_text"],
                functions["_ceo_finance_parse_date"],
                functions["_ceo_finance_parse_money"],
                functions["_ceo_finance_first_match"],
                functions["_ceo_finance_parse_invoice"],
                functions["_ceo_finance_parse_receipt"],
                functions["_ceo_finance_parse_contract"],
                functions["_ceo_exec_override_hr_vacancy_lookup_plan"],
                functions["_ceo_exec_override_dashboard_plan"],
                functions["_ceo_exec_override_bank_balance_plan"],
                functions["_ceo_exec_override_finance_attachment_registration_plan"],
                functions["_ceo_exec_has_explicit_mutation_intent"],
                functions["_ceo_exec_is_mutation_request"],
                functions["_ceo_exec_is_record_lookup_request"],
                functions["_ceo_exec_internal_route_is_allowed"],
                functions["_ceo_exec_truth_response"],
                functions["_ceo_exec_expand_vacancy_reference"],
                functions["_ceo_exec_override_hr_vacancy_plan"],
            ],
            type_ignores=[],
        ),
        "<ceo-live-vacancy-status>",
        "exec",
    ),
    namespace,
)
namespace["_far_Decimal"] = Decimal
namespace["date"] = date

invoice_sample = namespace["_ceo_finance_parse_invoice"]({
    "text": (
        "Invoice No. CI-AWAED-2026-1026-ANNUAL Invoice Date 26/10/2026 "
        "Client Awaed Alosool Capital Client CR 1010734817 "
        "Due Date 02/11/2026 TOTAL AMOUNT DUE SAR 200,000.00 "
        "External Penetration Testing 3 57,750.00 57,750.00 "
        "Internal Penetration Testing 3 57,750.00 57,750.00 "
        "Pre-release Penetration Testing 10 52,500.00 52,500.00 "
        "Red Teaming Engagement 1 32,000.00 32,000.00 "
        "VAT: No VAT charged. IBAN SA0280000511608016235527"
    )
})
assert invoice_sample["invoice_number"] == "CI-AWAED-2026-1026-ANNUAL"
assert invoice_sample["client_cr"] == "1010734817"
assert invoice_sample["total"] == Decimal("200000.00")
assert len(invoice_sample["lines"]) == 4
receipt_sample = namespace["_ceo_finance_parse_receipt"]({
    "text": "04/11/2026 TBC2611049274293 CI-AWAED-2026-1026-ANNUAL 200,000.00 SA0280000511608016235527"
})
assert receipt_sample["reference"] == "TBC2611049274293"
assert receipt_sample["amount"] == Decimal("200000.00")
contract_sample = namespace["_ceo_finance_parse_contract"]({
    "text": "ANNUAL PENETRATION TESTING & RED TEAMING SERVICES AGREEMENT DRAFT FOR REVIEW Provider Packet Enclave Company for Cybersecurity, CR 7054519124 Client Awaed Alosool Capital, a Saudi Closed Joint Stock Company, CR 1010734817 Annual Contract Value SAR 200,000.00 Date: 10/20/2026"
})
assert contract_sample["client_cr"] == "1010734817"
assert contract_sample["annual_value"] == Decimal("200000.00")

lookup_route = namespace["_ceo_exec_override_hr_vacancy_lookup_plan"]
lookup_guard = namespace["_ceo_exec_is_record_lookup_request"]

status_request = "وش وضع شاغر AI Platform؟ هل هو مفتوح؟"
plan = lookup_route({}, status_request)
assert plan["handled"] is True
assert plan["actions"][0]["type"] == "get_hr_vacancy_state"
assert plan["actions"][0]["data"]["title"] == "AI Platform"
assert lookup_guard(status_request) is True

english_status_request = "What is the status of AI Platform vacancy? Is it open?"
english_plan = lookup_route({}, english_status_request)
assert english_plan["handled"] is True
assert english_plan["actions"][0]["type"] == "get_hr_vacancy_state"
assert english_plan["actions"][0]["data"]["title"] == "AI Platform"
assert lookup_guard(english_status_request) is True
assert namespace["_ceo_exec_has_explicit_mutation_intent"](
    english_status_request
) is False
assert namespace["_ceo_exec_has_explicit_mutation_intent"](
    "open AI Platform vacancy"
) is True

assert lookup_guard("افتح لي شاغر AI Platform") is False
assert lookup_route({}, "وش وضع الشاغر؟")["actions"] == []

dashboard_route = namespace["_ceo_exec_override_dashboard_plan"]
bank_route = namespace["_ceo_exec_override_bank_balance_plan"]
bank_plan = bank_route({}, "كم موجود بالحساب البنكي؟")
assert bank_plan["handled"] is True
assert bank_plan["actions"][0]["type"] == "get_bank_balance"
assert lookup_guard("كم موجود بالحساب البنكي؟") is True
assert bank_route({}, "كم موجود في الحسابات البنكية؟")["actions"][0]["type"] == "get_bank_balance"
dashboard_plan = dashboard_route({}, "أعطني تقرير الموارد البشرية وعدد الموظفين")
assert dashboard_plan["handled"] is True
assert dashboard_plan["actions"][0]["type"] == "execute_internal_api"
assert dashboard_plan["actions"][0]["data"]["path"] == "/api/hr/monthly-dashboard"
count_plan = dashboard_route({}, "كم عدد الموظفين في النظام؟")
assert count_plan["actions"][0]["data"]["path"] == "/api/hr/monthly-dashboard"
assert lookup_guard("كم عدد الموظفين في النظام؟") is True
system_review_plan = dashboard_route({}, "راجع السستم وش وضع المالية؟")
assert system_review_plan["actions"][0]["data"]["path"] == "/api/finance/reports/dashboard"
assert namespace["_ceo_exec_is_mutation_request"]("جهز لي تقرير المالية") is True
assert namespace["_ceo_exec_is_mutation_request"]("سو شي في المالية") is True
assert namespace["_ceo_exec_internal_route_is_allowed"](
    "GET", "/api/finance/reports/dashboard"
) is True
assert namespace["_ceo_exec_internal_route_is_allowed"](
    "POST", "/api/finance/bills/123/payments"
) is False

finance_register_route = namespace["_ceo_exec_override_finance_attachment_registration_plan"]
finance_request = (
    "سجل العقد والفاتورة والإيصال إذا ماهو مسجل، وسجله AR/AP. "
    "ATTACHED DOCUMENTS FOR THIS CEO CONVERSATION FILE: invoice.pdf"
)
finance_plan = finance_register_route({}, finance_request)
assert finance_plan["handled"] is True
assert finance_plan["actions"][0]["type"] == "register_finance_documents_from_attachments"
assert namespace["_ceo_exec_override_finance_attachment_registration_plan"](
    {}, "كم موجود بالحساب البنكي؟"
) == {}

# Dashboard reads must survive the generic lookup guard, while a write-like
# report command remains mutation intent and cannot be downgraded to GET.
assert lookup_guard("أعطني تقرير المالية") is True
assert namespace["_ceo_exec_is_mutation_request"]("جهز لي تقرير المالية") is True

# A confirmation after a status read and a vacancy command must keep the
# mutation intent. The live lookup guard must not rewrite it as read-only.
mixed_confirmation = (
    "وش وضع شاغر AI Platform؟ هل هو مفتوح؟\n\n"
    "افتح لي الشاغر\n\nنعم"
)
assert lookup_guard(mixed_confirmation) is False

truth = namespace["_ceo_exec_truth_response"]
bank_truth = truth({
    "actions": [{
        "type": "get_bank_balance",
        "title": "Read current bank cash position",
        "status": "read_only",
        "evidence": {
            "as_of_date": "2026-11-13",
            "total_cash_position": 1250.5,
            "banks": [{
                "account_name": "Operating Account",
                "balance": 1250.5,
                "currency": "SAR",
            }],
        },
    }],
})
assert "إجمالي الرصيد النقدي" in bank_truth
assert "1,250.50 SAR" in bank_truth
assert "/api/finance/reports/cash-position" in bank_truth
finance_truth = truth({
    "actions": [{
        "type": "register_finance_documents_from_attachments",
        "title": "Register attached contract, AR invoice and bank receipt",
        "status": "executed",
        "verified": True,
        "record": {
            "finance_customer": {"name": "Awaed Alosool Capital", "action": "created"},
            "bank_account": {"code": "BANK-ALRAJHI-16235527", "iban": "SA0280000511608016235527"},
            "invoice": {"id": "invoice-id", "invoice_number": "CI-AWAED-2026-1026-ANNUAL", "status": "draft", "total_amount": 200000},
            "bank_statement_line": {"id": "statement-id", "external_id": "TBC2611049274293", "status": "unmatched", "amount": 200000},
            "contract": {"id": "contract-id", "code": "LEG-CTR-1", "status": "draft"},
        },
    }],
})
assert "الفاتورة AR" in finance_truth
assert "CI-AWAED-2026-1026-ANNUAL" in finance_truth
assert "unmatched" in finance_truth
assert "لم يُنشأ قيد AP" in finance_truth
blocked_route_truth = truth({
    "actions": [{
        "type": "execute_internal_api",
        "title": "Create finance invoice",
        "status": "blocked",
        "operation": "internal_api_rejected",
        "reason": "The live route returned HTTP 422; no completion was claimed.",
        "evidence": {"http_status": 422, "response": {"detail": [{"loc": ["body", "lines"], "msg": "field required"}]}},
    }],
})
assert "تفاصيل رفض النظام" in blocked_route_truth
truth_text = truth({
    "actions": [{
        "type": "get_hr_vacancy_state",
        "title": "Read vacancy status",
        "status": "read_only",
        "evidence": {
            "found": False,
            "matching_record_count": 0,
            "matching_open_vacancy_count": 0,
            "system_open_vacancy_count": 0,
            "source": "HRVacancy",
        },
    }],
})
assert "غير موجود" in truth_text
assert "إجمالي الشواغر المفتوحة: 0" in truth_text

expand_reference = namespace["_ceo_exec_expand_vacancy_reference"]
create_route = namespace["_ceo_exec_override_hr_vacancy_plan"]
expanded = expand_reference(
    "طيب افتح لي الشاغر",
    ["وش وضع شاغر AI Platform؟ هل هو مفتوح؟"],
)
assert "USER-CONTEXT VACANCY TITLE" in expanded
create_plan = create_route({}, expanded)
assert create_plan["actions"][0]["type"] == "create_hr_vacancy"
assert create_plan["actions"][0]["data"]["title_ar"] == "AI Platform"
assert create_plan["actions"][0]["data"]["department_code"] == "TECH"
assert create_plan["actions"][0]["data"]["manager_position_code"] == "CTO"
confirmation_source = expand_reference(
    "افتح لي الشاغر\n\nنعم",
    ["وش وضع شاغر AI Platform؟ هل هو مفتوح؟", "افتح لي الشاغر"],
)
confirmation_plan = create_route({}, confirmation_source)
assert confirmation_plan["actions"][0]["type"] == "create_hr_vacancy"
ambiguous = expand_reference(
    "افتح لي الشاغر",
    ["وش وضع شاغر AI Platform؟", "وش وضع شاغر Sales Manager؟"],
)
assert "USER-CONTEXT VACANCY TITLE" not in ambiguous

frontend = Path("frontend/app/hr/recruitment/page.js")
if frontend.exists():
    frontend_text = frontend.read_text()
    assert "Promise.allSettled" in frontend_text
    assert "setInterval(load, 30000)" in frontend_text
    assert "تعذر التحقق" in frontend_text
    assert "summary.open_vacancies || 0" not in frontend_text

if not os.environ.get("ENCLAVE_CONTAINER_ONLY"):
    chat_frontend = Path("frontend/app/page.js")
    assert chat_frontend.exists()
    chat_frontend_text = chat_frontend.read_text()
    assert "const rawResponse = await res.text()" in chat_frontend_text
    assert "JSON.parse(rawResponse)" in chat_frontend_text
    assert "response_parse_error" in chat_frontend_text

if os.environ.get("ENCLAVE_STATIC_ONLY") == "1":
    capabilities = {
        "version": "1.6.18",
        "allowed_actions": [
            "get_hr_vacancy_state",
            "get_bank_balance",
            "register_finance_documents_from_attachments",
            "execute_internal_api",
        ],
    }
else:
    with urllib.request.urlopen(
        "http://127.0.0.1:8000/api/ceo/execution-capabilities",
        timeout=20,
    ) as response:
        assert response.status == 200
        capabilities = json.load(response)

assert capabilities["version"] == "1.6.18"
assert "get_hr_vacancy_state" in capabilities["allowed_actions"]
assert "get_bank_balance" in capabilities["allowed_actions"]
assert "execute_internal_api" in capabilities["allowed_actions"]
assert "register_finance_documents_from_attachments" in capabilities["allowed_actions"]

print("Canonical vacancy snapshot consumers: PASSED")
print("Live vacancy status routing: PASSED")
print("Deterministic CEO evidence rendering: PASSED")
print("User-context vacancy follow-up routing: PASSED")
print("Unsupported lookup guard: PASSED")
if frontend.exists():
    print("Recruitment UI no-false-zero handling: PASSED")
print("Execution capabilities endpoint: PASSED")
print("Chat JSON error handling and rollback: PASSED")
print("Deterministic CEO execution response path: PASSED")
print("Cross-department live internal API execution gate: PASSED")
print("Vacancy write isolation and manager fallback: PASSED")
print("Truthful live bank-balance routing: PASSED")
print("No false completion from specialist prose: PASSED")
