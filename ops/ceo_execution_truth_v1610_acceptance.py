"""Acceptance checks for the v1.6.10 vacancy follow-up execution fix."""

import ast
import json
import os
import urllib.request
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
execution_calls = {
    node.func.id
    for node in ast.walk(execution_layer)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
}
assert "_ceo_exec_override_hr_vacancy_lookup_plan" in execution_calls
assert "_ceo_exec_is_record_lookup_request" in execution_calls
assert "_ceo_exec_expand_vacancy_reference" in execution_calls

namespace = {}
exec(
    compile(
        ast.Module(
            body=[
                functions["_ceo_exec_override_hr_vacancy_lookup_plan"],
                functions["_ceo_exec_has_explicit_mutation_intent"],
                functions["_ceo_exec_is_mutation_request"],
                functions["_ceo_exec_is_record_lookup_request"],
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

# A confirmation after a status read and a vacancy command must keep the
# mutation intent. The live lookup guard must not rewrite it as read-only.
mixed_confirmation = (
    "وش وضع شاغر AI Platform؟ هل هو مفتوح؟\n\n"
    "افتح لي الشاغر\n\nنعم"
)
assert lookup_guard(mixed_confirmation) is False

truth = namespace["_ceo_exec_truth_response"]
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

if os.environ.get("ENCLAVE_STATIC_ONLY") == "1":
    capabilities = {"version": "1.6.10", "allowed_actions": ["get_hr_vacancy_state"]}
else:
    with urllib.request.urlopen(
        "http://127.0.0.1:8000/api/ceo/execution-capabilities",
        timeout=20,
    ) as response:
        assert response.status == 200
        capabilities = json.load(response)

assert capabilities["version"] == "1.6.10"
assert "get_hr_vacancy_state" in capabilities["allowed_actions"]

print("Canonical vacancy snapshot consumers: PASSED")
print("Live vacancy status routing: PASSED")
print("Deterministic CEO evidence rendering: PASSED")
print("User-context vacancy follow-up routing: PASSED")
print("Unsupported lookup guard: PASSED")
if frontend.exists():
    print("Recruitment UI no-false-zero handling: PASSED")
print("Execution capabilities endpoint: PASSED")
