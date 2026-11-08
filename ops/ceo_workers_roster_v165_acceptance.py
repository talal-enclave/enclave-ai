"""Acceptance checks for formal employee roster import v1.6.5."""

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
namespace = {}
exec(
    compile(
        ast.Module(
            body=[
                functions["_ceo_worker_field"],
                functions["_ceo_exec_override_employee_activation_plan"],
            ],
            type_ignores=[],
        ),
        "<employee-roster-routing>",
        "exec",
    ),
    namespace,
)

route = namespace["_ceo_exec_override_employee_activation_plan"]
field = namespace["_ceo_worker_field"]

# The uploaded bilingual roster has several Arabic headers beginning with
# "رقم".  They must remain distinct instead of overwriting worker ID with a
# phone number or emergency contact.
assert field("رقم / ID") == "worker_id"
assert field("رقم الهوية/جواز السفر / ID/Passport No.") == "id_passport"
assert field("رقم الجوال / Mobile Phone") == "mobile"
assert field("جهة اتصال للطوارئ (اسم+رقم) / Emergency Contact (Name & Phone)") == "emergency_contact"

with_attachment = (
    "فعّل الموظفين بدون رواتب\n\n"
    "ATTACHED DOCUMENTS FOR THIS CEO CONVERSATION\n"
    "FILE: TalalEnclave_Workers_Template.xlsx\n"
)
plan = route({}, with_attachment)
assert plan["handled"] is True
assert plan["actions"][0]["type"] == "register_formal_employees_from_attachment"

without_attachment = route({}, "فعّل الموظفين بدون رواتب")
assert without_attachment["actions"][0]["type"] == "activate_existing_employees"

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.5"
assert "register_formal_employees_from_attachment" in capabilities["allowed_actions"]

print("Formal employee roster routing: PASSED")
print("No-attachment activation routing: PASSED")
print("Execution capabilities endpoint: PASSED")
