import re
from typing import Dict, List, Tuple, Union


def extract_code_block(text: str, language: str = "javascript") -> Union[str, Dict[str, str]]:
    code_blocks: List[Tuple[str, str]] = re.findall(r"<code filename=\"(.*?)\">(.*?)</code>", text, re.DOTALL)
    if language == "javascript":
        js_files: Dict[str, str] = {}
        for filename, code in code_blocks:
            if filename.endswith(".js"):
                cleaned = re.sub("```(javascript|js)?", "", code)
                js_files[filename.replace("\\", "/")] = cleaned.strip()
        if not js_files:
            js_files["game.js"] = "// Default game.js - Generated empty file\n"
        return js_files
    else:
        for filename, code in code_blocks:
            if filename.endswith(".html"):
                return re.sub("```(html|xml)?", "", code).strip()
        return ""


def extract_title(text: str) -> str:
    match = re.search(r"<game_title>\s*(.*?)\s*</game_title>", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    for pattern in [r"GAME TITLE:\s*(.*?)(?:\n|$)", r"title:\s*(.*?)(?:\n|$)", r"<title>(.*?)</title>"]:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return "Untitled Game"


def extract_game_description(text: str) -> str:
    match = re.search(r"<game_description>\s*(.*?)\s*</game_description>", text, re.DOTALL)
    return match.group(1).strip() if match else ""


def extract_game_controls(text: str) -> str:
    match = re.search(r"<game_controls>\s*(.*?)\s*</game_controls>", text, re.DOTALL)
    return match.group(1).strip() if match else ""


def extract_game_plan(text: str) -> str:
    match = re.search(r"<plan>\s*(.*?)\s*</plan>", text, re.DOTALL)
    return match.group(1).strip() if match else ""


def extract_automated_testing_code(text: str) -> str:
    match = re.search(r"<automated_testing_code>\s*(.*?)\s*</automated_testing_code>", text, re.DOTALL)
    return match.group(1).strip() if match else ""


def extract_automated_testing(text: str) -> str:
    match = re.search(r"<automated_testing>\s*(.*?)\s*</automated_testing>", text, re.DOTALL)
    return match.group(1).strip() if match else ""


def parse_automated_testing(automated_testing_block: str) -> Dict[str, Dict[str, str]]:
    if not automated_testing_block:
        return {}

    tests: Dict[str, Dict[str, str]] = {}
    for m in re.finditer(r"<(TEST_\d+)>\s*(.*?)\s*</\1>", automated_testing_block, re.DOTALL):
        test_tag = m.group(1)
        body = m.group(2)

        def _extract(tag: str) -> str:
            mm = re.search(rf"<{tag}>\s*(.*?)\s*</{tag}>", body, re.DOTALL)
            return (mm.group(1).strip() if mm else "").strip()

        test_desc = _extract("test_description")
        strat_desc = _extract("strategy_description")
        expected = _extract("expected_outcome")

        entry = {
            "test_description": test_desc,
            "strategy_description": strat_desc,
            "expected_outcome": expected,
            "description": test_desc,
            "strategy": strat_desc,
            "expected": expected,
        }

        tests[test_tag] = entry
        try:
            idx = test_tag.split("_")[1]
            button_id = f"test_{idx.lower()}_ModeBtn"
            tests[button_id] = entry
        except Exception:
            pass

    return tests
