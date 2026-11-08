"""Acceptance checks for CEO organizational-structure execution v1.6.3."""

import json
import urllib.request

from app.main import (
    AGENT_SEEDS,
    _ceo_default_organizational_structure,
    _ceo_exec_override_organizational_structure_plan,
)


ceo_prompt = next(
    item["system_prompt"]
    for item in AGENT_SEEDS
    if item["slug"] == "ceo"
)
assert "execution-first" in ceo_prompt.casefold()

request_text = (
    "انشئ لي ثلاث ادارات حاليا بكامل تفاصيلها يعني بالعربي والانجليزي "
    "ورمز للادارة وحط لها مركز تكلفة. الإدارة التنفيذية تحتها الرئيس التنفيذي "
    "ومدير المكتب التنفيذي ومديره الرئيس التنفيذي، والإدارة التقنية رئيسها "
    "الرئيس التنفيذي للشؤون التقنية ومديره الرئيس التنفيذي، وإدارة الخدمات "
    "المشتركة مديرها الرئيس التنفيذي للخدمات المشتركة ومديره الرئيس التنفيذي."
)

plan = _ceo_exec_override_organizational_structure_plan({}, request_text)
assert plan["handled"] is True
assert plan["actions"][0]["type"] == "create_organizational_structure"

structure = _ceo_default_organizational_structure()
assert [row["code"] for row in structure] == ["EXE", "TECH", "SSC"]
assert [row["cost_center"] for row in structure] == ["CC-100", "CC-200", "CC-300"]
assert [
    position["code"]
    for department in structure
    for position in department["positions"]
] == ["CEO", "EOM", "CTO", "CSSO"]

with urllib.request.urlopen(
    "http://127.0.0.1:8000/api/ceo/execution-capabilities",
    timeout=20,
) as response:
    assert response.status == 200
    capabilities = json.load(response)

assert capabilities["version"] == "1.6.3"
assert "create_organizational_structure" in capabilities["allowed_actions"]

print("Organizational-structure deterministic routing: PASSED")
print("Bilingual department/position defaults: PASSED")
print("Execution capabilities endpoint: PASSED")
