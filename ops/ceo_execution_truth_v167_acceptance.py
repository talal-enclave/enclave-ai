"""Acceptance checks for the v1.6.7 live-status evidence firewall."""

import ast
import json
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
execution_layer = functions["_ceo_execution_layer"]
execution_calls = {
    node.func.id
    for node in ast.walk(execution_layer)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
}
assert "_ceo_exec_override_hr_vacancy_lookup_plan" in execution_calls
assert "_ceo_exec_is_record_lookup_request" in execution_calls

namespace = {}
exec(
    compile(
        ast.Module(
            body=[
                functions["_ceo_exec_override_hr_vacancy_lookup_plan"],
                functions["_ceo_exec_is_mutation_request"],
                functions["_ceo_exec_is_record_lookup_request"],
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

assert lookup_guard("افتح لي شاغر AI Platform") is False
assert lookup_route({}, "وش وضع الشاغر؟")["actions"] == []

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.7"
assert "get_hr_vacancy_state" in capabilities["allowed_actions"]

print("Live vacancy status routing: PASSED")
print("Unsupported lookup guard: PASSED")
print("Execution capabilities endpoint: PASSED")
