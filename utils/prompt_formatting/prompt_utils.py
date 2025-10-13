from pathlib import Path
from typing import Any, Dict, Optional
import re
import yaml

DEFAULT_LIBRARIES = ["p5.js", "p5.collide2D"]
DEFAULT_ACTIONS = ["Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Shift", "Z", "R", "Escape"]

def get_key_code(name: str) -> Optional[int]:
    key = name.strip()
    key_code_map = {
        "ArrowLeft": 37,
        "ArrowUp": 38,
        "ArrowRight": 39,
        "ArrowDown": 40,
        " ": 32,  # SPACE
        "Space": 32,
        "SPACE": 32,
        "Shift": 16,
        "SHIFT": 16,
        "Enter": 13,
        "ENTER": 13,
        "Escape": 27,
        "ESC": 27,
        "Esc": 27,
        "R": 82,
        "Z": 90,
    }
    if key in key_code_map:
        return key_code_map[key]
    if len(key) == 1:
        return ord(key.upper())
    return None

def _read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")

def format_hard_constraints(config: Dict[str, Any]) -> str:
    libs = config.get("libraries_allowed") or DEFAULT_LIBRARIES
    # Prefer explicit groups if provided in config
    game_controls_cfg = config.get("game_controls")
    game_phase_cfg = config.get("game_phase_control")
    acts = config.get("actions_allowed") or DEFAULT_ACTIONS
    cw = int(config.get("canvas_width", 600))
    ch = int(config.get("canvas_height", 400))


    arrow_keys = {"ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"}
    # Determine gameplay keys source
    if isinstance(game_controls_cfg, list) and game_controls_cfg:
        gameplay_keys: list[str] = list(game_controls_cfg)
    else:
        acts_set = set(acts)
        gameplay_keys = [
            k for k in acts if k not in ("Enter", "ENTER", "ESC", "Esc", "Escape", "R")
        ]
    # Determine phase controls source
    if isinstance(game_phase_cfg, list) and game_phase_cfg:
        phase_keys_present = {
            "ENTER": any(k in game_phase_cfg for k in ("Enter", "ENTER")),
            "ESC": any(k in game_phase_cfg for k in ("ESC", "Esc", "Escape")),
            "R": any(k in game_phase_cfg for k in ("R",)),
        }
    else:
        acts_set = set(acts)
        phase_keys_present = {
            "ENTER": any(k in acts_set for k in ("Enter", "ENTER")),
            "ESC": any(k in acts_set for k in ("ESC", "Esc", "Escape")),
            "R": "R" in acts_set,
        }

    def format_key_item(name: str) -> str:
        display = "SPACE" if name == " " else name.upper() if len(name) == 1 else name
        code = get_key_code(name)
        return f"{display} ({code})" if code is not None else display

    gameplay_items: list[str] = []
    have_all_arrows = set(gameplay_keys) >= arrow_keys
    if have_all_arrows:
        gameplay_items.append("Arrow keys (37-40)")
        # remove individual arrows if present
        gameplay_keys = [k for k in gameplay_keys if k not in arrow_keys]
    for k in gameplay_keys:
        gameplay_items.append(format_key_item(k))
    game_controls_text = ""
    if gameplay_items:
        game_controls_text = "- Allowed gameplay control keys: " + ", ".join(gameplay_items)

    phase_lines: list[str] = []
    if phase_keys_present["ENTER"]:
        phase_lines.append("    - ENTER (13)  – start the game")
    if phase_keys_present["ESC"]:
        phase_lines.append("    - ESC (27)    – pause / unpause")
    if phase_keys_present["R"]:
        phase_lines.append("    - R (82)      – restart; returns to the start screen, where the player can press ENTER to play again")

    phase_block = ""
    if phase_lines:
        phase_block = "- Game phase specific controls:\n" + "\n".join(phase_lines)

    hc = _read("prompts/common/hard_constraints.md")
    hc = hc.replace("{libraries_allowed}", ", ".join(libs))
    hc = hc.replace("{game_controls}", game_controls_text)
    hc = hc.replace("{game_phase_control}", phase_block)
    return hc


def build_system_prompt(path: Optional[str] = None) -> str:
    if path:
        return _read(path)
    return _read("prompts/common/system_prompt.md")


def build_code_instructions(config: Dict[str, Any]) -> str:
    # Could branch on libraries to add guidance; for now use common file
    return _read("prompts/common/code_instructions.md")


def assemble_prompt(parts: Dict[str, str]) -> str:
    ordered = [
        parts.get("hard_constraints", ""),
        parts.get("instructions", ""),
        parts.get("code_instructions", ""),
        parts.get("extras", ""),
    ]
    return "\n\n".join([p for p in ordered if p])


def build_user_prompt(mode: str, config: Dict[str, Any]) -> str:
    hard_constraints = format_hard_constraints(config)
    code_inst = build_code_instructions(config)
    cw = int(config.get("canvas_width", 600))
    ch = int(config.get("canvas_height", 400))
    if mode == "concept_and_game":
        instr = _read("prompts/generation/baseline_concept_and_game_instructions.md")
        # Fill previous concepts if placeholder present
        try:
            concepts_dir = Path("game_concepts")
            previous: list[str] = []
            if concepts_dir.exists():
                for p in sorted(concepts_dir.glob("game_*.yaml")):
                    concept_value = yaml.safe_load(p.read_text(encoding="utf-8"))["concept"]
                    # concept_value = ""
                    # if text.startswith("concept:"):
                    #     lines = text.splitlines()
                    #     if len(lines) >= 1:
                    #         # single-line value on the same line as key
                    #         if len(lines) == 1 and ":" in lines[0]:
                    #             concept_value = lines[0].split(":", 1)[1].strip()
                    #         else:
                    #             # handle indented block scalar style; join wrapped lines into one
                    #             block: list[str] = []
                    #             for ln in lines[:]:
                    #                 if ln.startswith("  "):
                    #                     block.append(ln[2:].strip())
                    #             concept_value = " ".join([b for b in " ".join(block).split()])
                    if concept_value:
                        previous.append(f'- "{concept_value}"')
                
            prev_block = "\n".join(previous)
            instr = instr.replace("{canvas_width}", str(cw)).replace("{canvas_height}", str(ch))
            if prev_block.strip():
                instr = instr.replace("{previous_concepts_text}", prev_block)
            else:
                # Remove the entire previous concepts section when empty
                instr = re.sub(
                    r"Here are previously generated game concepts[\s\S]*?<previous_concepts>[\s\S]*?</previous_concepts>\n?",
                    "",
                    instr,
                    flags=re.MULTILINE,
                )
        except Exception:
            instr = instr.replace("{previous_concepts_text}", "")
    else:
        instr = _read("prompts/generation/single_prompt_with_testing_instructions.md")
    # Fill placeholders in instruction files if present
    instr = instr.replace("{code_instructions}", code_inst)
    if "{hard_constraints}" in instr:
        instr = instr.replace("{hard_constraints}", hard_constraints)
        return assemble_prompt({"instructions": instr})
    # If the instruction file already embeds a <hard_constraints> block, avoid duplicating
    if "<hard_constraints>" in instr:
        return assemble_prompt({"instructions": instr})
    return assemble_prompt({"hard_constraints": hard_constraints, "instructions": instr})


