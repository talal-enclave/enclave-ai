"""Acceptance checks for the v1.6.2 non-employee worker path."""

import json
import urllib.request

from app.main import (
    AGENT_SEEDS,
    _ceo_exec_is_confirmation,
    _ceo_exec_is_non_employee_worker_request,
    _ceo_exec_override_non_employee_workers_plan,
)


ceo_prompt = next(
    item["system_prompt"]
    for item in AGENT_SEEDS
    if item["slug"] == "ceo"
)
assert "written delegation" not in ceo_prompt.casefold()
assert _ceo_exec_is_confirmation("أنا مديره") is True
assert _ceo_exec_is_non_employee_worker_request(
    "أضفهم من ملف TalalEnclave_Workers_Template.xlsx"
) is True

plan = _ceo_exec_override_non_employee_workers_plan(
    {},
    "أضفهم من ملف TalalEnclave_Workers_Template.xlsx",
)
assert plan["handled"] is True
assert plan["actions"][0]["type"] == "register_non_employee_workers"

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.2"
assert "register_non_employee_workers" in capabilities["allowed_actions"]

print("CEO internal authorization rule: PASSED")
print("Non-employee worker routing: PASSED")
print("Execution capabilities endpoint: PASSED")
