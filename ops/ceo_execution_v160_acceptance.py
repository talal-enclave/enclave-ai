import json
import urllib.request

from app.main import (
    AGENT_SEEDS,
    _ceo_exec_override_task_lookup_plan,
    _ceo_exec_override_workers_template_plan,
)


ceo_prompt = next(item["system_prompt"] for item in AGENT_SEEDS if item["slug"] == "ceo")
assert "exactly two viable options" not in ceo_prompt
assert "execution-first" in ceo_prompt

task_plan = _ceo_exec_override_task_lookup_plan(
    {},
    "عندي مهام معلقة وش هي؟",
)
assert task_plan["handled"] is True
assert task_plan["actions"][0]["type"] == "list_pending_tasks"

template_plan = _ceo_exec_override_workers_template_plan(
    {},
    "سو لي نموذج اكسل للناس اللي يشتغلون معنا وهم مو موظفين رسميين",
)
assert template_plan["handled"] is True
assert template_plan["actions"][0]["type"] == "generate_workers_template"

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    payload = json.load(response)

assert payload["version"] == "1.6.0"
assert "list_pending_tasks" in payload["allowed_actions"]
assert "generate_workers_template" in payload["allowed_actions"]

print("CEO execution-first contract: PASSED")
print("Pending task lookup action: PASSED")
print("Workers XLSX template action: PASSED")
print("Execution capabilities endpoint: PASSED")
