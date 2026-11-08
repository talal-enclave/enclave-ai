"""Acceptance checks for the v1.6.6 CEO evidence firewall."""

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
assert "_ceo_exec_override_hr_vacancy_plan" in execution_calls
assert "_ceo_exec_is_mutation_request" in execution_calls

namespace = {}
exec(
    compile(
        ast.Module(
            body=[
                functions["_ceo_exec_override_hr_vacancy_plan"],
                functions["_ceo_exec_is_mutation_request"],
            ],
            type_ignores=[],
        ),
        "<ceo-evidence-firewall>",
        "exec",
    ),
    namespace,
)

vacancy_route = namespace["_ceo_exec_override_hr_vacancy_plan"]
mutation_guard = namespace["_ceo_exec_is_mutation_request"]

request = (
    "افتح لي شاغر وظيفي AI Platform تحت الإدارة التقنية (TECH) "
    "مع CTO كمدير مباشر"
)
plan = vacancy_route({}, request)
assert plan["handled"] is True
assert plan["actions"][0]["type"] == "create_hr_vacancy"
assert plan["actions"][0]["data"]["title_en"] == "AI Platform"
assert plan["actions"][0]["data"]["department_code"] == "TECH"
assert plan["actions"][0]["data"]["manager_position_code"] == "CTO"

assert mutation_guard(request) is True
assert mutation_guard("ما هي الشواغر المفتوحة؟") is False
assert mutation_guard("أنشئ فاتورة للعميل") is True

missing = vacancy_route({}, "افتح لي شاغر وظيفي بدون اسم")
assert missing["handled"] is True
assert missing["actions"] == []
assert "department name or code" in missing["blocked_reason"]

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.6"
assert "create_hr_vacancy" in capabilities["allowed_actions"]

print("HR vacancy deterministic routing: PASSED")
print("Unsupported mutation guard: PASSED")
print("Execution capabilities endpoint: PASSED")
