from __future__ import annotations

import os
import time
import asyncio
import logging
import subprocess
from typing import Any, Dict, List, Optional
import random
import base64
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

try:
    from playwright.async_api import async_playwright, Page
    PLAYWRIGHT_OK = True
except Exception:
    PLAYWRIGHT_OK = False
    logging.warning("Playwright not installed. Install with: pip install playwright && python -m playwright install firefox")


async def _start_server_if_needed(game_path: str, port: int) -> Optional[subprocess.Popen]:
    if os.path.isdir(game_path):
        proc = subprocess.Popen(
            ["python", "-m", "http.server", str(port)],
            cwd=game_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        await asyncio.sleep(1)
        return proc
    return None


def _build_url(game_path: str, port: int) -> str:
    if os.path.isfile(game_path) and game_path.lower().endswith(".html"):
        return f"file://{os.path.abspath(game_path)}"
    # If a directory is provided, prefer navigating directly to an index.html if present
    if os.path.isdir(game_path):
        # Serve the directory as root at /
        # If the directory itself has index.html, root URL is fine
        index_at_root = os.path.join(game_path, "index.html")
        if os.path.exists(index_at_root):
            return f"http://localhost:{port}"
        # Otherwise, search for an index.html within subdirectories (e.g., sample_0/index.html)
        try:
            for root, _dirs, files in os.walk(game_path):
                if "index.html" in files:
                    # Build the relative path from game_path to the found index
                    rel = os.path.relpath(os.path.join(root, "index.html"), start=game_path)
                    # Normalize to URL path separators
                    rel_url = rel.replace(os.sep, "/")
                    return f"http://localhost:{port}/{rel_url}"
        except Exception:
            # Fallback to root if any issue during search
            pass
    return f"http://localhost:{port}"


async def _setup_event_listeners(page: Page, console_errors: Dict[str, List[str]], page_errors: List[str], request_failures: List[Dict[str, Any]]) -> None:
    page.on("console", lambda msg: console_errors.setdefault(msg.type, []).append(msg.text))
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    
    def handle_request_failed(req):
        # Handle both old (string) and new (method) Playwright API
        failure_text = "unknown"
        if req.failure:
            if callable(req.failure):
                # New API: req.failure() returns object with errorText
                failure_obj = req.failure()
                if failure_obj:
                    failure_text = getattr(failure_obj, 'errorText', getattr(failure_obj, 'error_text', str(failure_obj)))
            else:
                # Old API: req.failure is already a string
                failure_text = str(req.failure)
        request_failures.append({"url": req.url, "method": req.method, "failure": failure_text})
    
    page.on("requestfailed", handle_request_failed)
    page.on("response", lambda resp: (request_failures.append({"url": resp.url, "status": resp.status, "status_text": resp.status_text}) if resp.status >= 400 else None))


async def _sample_canvas_pixels(page: Page, sample_count: int = 200) -> List[int]:
    return await page.evaluate(
        """
(() => {
  const cvs = document.querySelector('canvas');
  if (!cvs) return [];
  const ctx = cvs.getContext('2d');
  if (!ctx) return [];
  const w = cvs.width || 600;
  const h = cvs.height || 400;
  const samples = [];
  const rand = (n) => Math.floor(Math.random() * n);
  for (let i = 0; i < %d; i++) {
    const x = rand(w), y = rand(h);
    const d = ctx.getImageData(x, y, 1, 1).data; // [r,g,b,a]
    samples.push((d[0]<<24) | (d[1]<<16) | (d[2]<<8) | d[3]);
  }
  return samples;
})()
        """
        % sample_count
    )
async def _capture_canvas_dataurl(page: Page) -> str:
    try:
        data_url = await page.evaluate(
            """
(() => {
  const cvs = document.querySelector('canvas');
  if (!cvs) return '';
  try { return cvs.toDataURL('image/png'); } catch (e) { return ''; }
})()
            """
        )
        return data_url or ""
    except Exception:
        return ""


def _write_data_url_png(data_url: str, path: str) -> bool:
    try:
        if not data_url or not data_url.startswith("data:image/png;base64,"):
            return False
        b64 = data_url.split(",", 1)[1]
        raw = base64.b64decode(b64)
        with open(path, "wb") as f:
            f.write(raw)
        return True
    except Exception:
        return False


async def _focus_canvas(page: Page) -> None:
    try:
        await page.evaluate(
            r"""() => {
  document.body.click();
  const canvas = document.querySelector('canvas');
  if (canvas) {
    if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '1');
    canvas.focus();
    canvas.click();
  }
}"""
        )
    except Exception:
        pass


KEY_CODE_MAP: Dict[str, int] = {
    "Enter": 13,
    " ": 32,
    "Space": 32,
    "ArrowLeft": 37,
    "ArrowUp": 38,
    "ArrowRight": 39,
    "ArrowDown": 40,
    "Shift": 16,
    "Z": 90,
    "z": 90,
    "R": 82,
    "r": 82,
}


async def _press_key_robust(page: Page, key: str, debug: bool = False) -> None:
    try:
        # Method 1: normal press
        await page.keyboard.press(key)
        await page.wait_for_timeout(60)
    except Exception as e:
        if debug:
            logging.info(f"Standard press failed for {key}: {e}")
    try:
        # Method 2: down/up
        await page.keyboard.down(key)
        await page.wait_for_timeout(30)
        await page.keyboard.up(key)
        await page.wait_for_timeout(60)
    except Exception as e:
        if debug:
            logging.info(f"Down/Up press failed for {key}: {e}")
    try:
        # Method 3: dispatch DOM KeyboardEvents on canvas using a single args object
        code = KEY_CODE_MAP.get(key, 0)
        await page.evaluate(
            """
(args) => {
  const { k, code } = args;
  const canvas = document.querySelector('canvas') || document.body;
  const evs = ['keydown','keypress','keyup'];
  evs.forEach(t => {
    const ev = new KeyboardEvent(t, { key: k, keyCode: code, which: code, code: k, bubbles: true, cancelable: true });
    canvas.dispatchEvent(ev);
  });
}
            """,
            {"k": key, "code": code},
        )
        await page.wait_for_timeout(80)
    except Exception as e:
        if debug:
            logging.info(f"Dispatch event failed for {key}: {e}")


async def _press_sequence(page: Page, duration_sec: int = 5, debug: bool = False) -> None:
    keys = [" ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]
    start = time.time()
    while time.time() - start < duration_sec:
        for key in keys:
            try:
                if debug:
                    logging.info(f"Pressing: {key}")
                await _press_key_robust(page, key, debug)
            except Exception as e:
                if debug:
                    logging.info(f"Key press error {key}: {e}")


async def _get_game_state(page: Page) -> Dict[str, Any]:
    try:
        state = await page.evaluate(
            """
(() => {
  try {
    // Preferred API
    if (typeof window.getGameState === 'function') {
      const s = window.getGameState();
      if (s && typeof s === 'object') return { source: 'getGameState()', raw: s, phase: s.gamePhase || s.phase || null, score: s.score || 0, player: s.player || null, controlMode: s.controlMode || null };
    }
    // Global object fallback
    if (window.gameState && typeof window.gameState === 'object') {
      const s = window.gameState;
      return { source: 'window.gameState', raw: s, phase: s.gamePhase || s.phase || null, score: s.score || 0, player: s.player || null, controlMode: s.controlMode || null };
    }
    // Heuristic scan of globals by name
    for (const k of Object.keys(window)) {
      try {
        if (/game.*state/i.test(k)) {
          const s = window[k];
          if (s && typeof s === 'object') {
            return { source: `window[${k}]`, raw: s, phase: s.gamePhase || s.phase || null, score: s.score || 0, player: s.player || null, controlMode: s.controlMode || null };
          }
        }
      } catch (e) {}
    }
    // Heuristic scan for any object with a gamePhase-like field
    for (const k of Object.keys(window)) {
      try {
        const s = window[k];
        if (s && typeof s === 'object' && ('gamePhase' in s || 'phase' in s)) {
          return { source: `window[${k}]`, raw: s, phase: s.gamePhase || s.phase || null, score: s.score || 0, player: s.player || null, controlMode: s.controlMode || null };
        }
      } catch (e) {}
    }
    // Check for p5 instance logs or any global with logs
    const candidates = [];
    const inst = (window.gameInstance ? window.gameInstance : null);
    if (inst && typeof inst === 'object' && inst.logs) candidates.push({ source: 'window.gameInstance.logs', logs: inst.logs });
    for (const k of Object.keys(window)) {
      try {
        const v = window[k];
        if (v && typeof v === 'object' && v.logs && (v.logs.game_info || v.logs.inputs || v.logs.player_info)) {
          candidates.push({ source: `window[${k}].logs`, logs: v.logs });
        }
      } catch (e) {}
    }
    if (candidates.length > 0) {
      // Build a small snapshot
      const c = candidates[0];
      const gi = Array.isArray(c.logs.game_info) ? c.logs.game_info.slice(-3) : [];
      const inp = Array.isArray(c.logs.inputs) ? c.logs.inputs.slice(-3) : [];
      const pl = Array.isArray(c.logs.player_info) ? c.logs.player_info.slice(-3) : [];
      return { source: c.source, raw: { logs: c.logs }, phase: null, score: null, player: null, controlMode: null, logs_tail: { game_info: gi, inputs: inp, player_info: pl } };
    }
  } catch (e) {}
  return {};
})()
            """
        )
        return state or {}
    except Exception:
        return {}


async def _get_full_game_state(page: Page) -> Optional[Dict[str, Any]]:
    try:
        gs = await page.evaluate(
            r"""
(() => {
  try {
    if (typeof window.getGameState === 'function') {
      const s = window.getGameState();
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(s, (k, v) => {
        if (typeof v === 'function') return undefined;
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return undefined;
          seen.add(v);
        }
        return v;
      }));
    }
  } catch (e) {}
  return null;
})()
            """
        )
        return gs if isinstance(gs, dict) else None
    except Exception:
        return None


def _shallow_state_view(state: Dict[str, Any]) -> Dict[str, Any]:
    """Return a minimal, JSON-safe view of the state to avoid cycles and large payloads."""
    if not isinstance(state, dict):
        return {}
    return {
        "phase": state.get("phase"),
        "score": state.get("score"),
        "controlMode": state.get("controlMode"),
    }


def test_game(game_path: str, duration: int = 10, timeout: int = 20, debug: bool = False, save_dir: Optional[str] = None) -> Dict[str, Any]:
    if not PLAYWRIGHT_OK:
        return {"test_result": False, "error": "Playwright not installed"}

    if not os.path.exists(game_path):
        return {"test_result": False, "error": f"Path does not exist: {game_path}"}

    async def _run() -> Dict[str, Any]:
        res: Dict[str, Any] = {
            "loaded": False,
            "interaction_changes": False,
            "console_errors": {},
            "page_errors": [],
            "request_failures": [],
            "keypress_log": [],
        }

        server_proc: Optional[subprocess.Popen] = None
        try:
            url = _build_url(game_path, 8000)
            if os.path.isdir(game_path):
                server_proc = await _start_server_if_needed(game_path, 8000)

            async with async_playwright() as p:
                browser = await p.firefox.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                await _setup_event_listeners(page, res["console_errors"], res["page_errors"], res["request_failures"])  # type: ignore[arg-type]
                try:
                    await page.goto(url, wait_until="networkidle", timeout=timeout * 1000)
                    res["loaded"] = True
                except Exception as e:
                    res["page_errors"].append(f"goto error: {e}")
                    await browser.close()
                    return res

                # focus canvas if present
                await _focus_canvas(page)

                # initial samples and state
                before_pixels = await _sample_canvas_pixels(page)
                before_state = await _get_game_state(page)
                before_img = await _capture_canvas_dataurl(page)
                # Prepare screenshots subfolder
                shots_dir = None
                if save_dir:
                    try:
                        os.makedirs(save_dir, exist_ok=True)
                        shots_dir = os.path.join(save_dir, "screenshots")
                        os.makedirs(shots_dir, exist_ok=True)
                    except Exception:
                        shots_dir = save_dir
                # Optionally save initial frame
                if (shots_dir or save_dir) and before_img:
                    try:
                        target_dir = shots_dir or save_dir  # type: ignore[truthy-bool]
                        _write_data_url_png(before_img, os.path.join(target_dir, f"0000_initial.png"))
                    except Exception:
                        pass
                if debug:
                    logging.info(f"Initial state: {before_state}")
                    if isinstance(before_state, dict) and 'source' in before_state:
                        logging.info(f"State source: {before_state.get('source')}")

                # Ensure game starts: press Enter first
                # Try multiple Enter presses with focus
                enter_attempts = 0
                while enter_attempts < 5:
                    try:
                        await _focus_canvas(page)
                        if debug:
                            logging.info("Pressing: Enter")
                        await _press_key_robust(page, "Enter", debug)
                        await page.wait_for_timeout(200)
                        cur = await _get_game_state(page)
                        # Try to capture full, JSON-safe gameState via getGameState
                        gs = await _get_full_game_state(page)
                        # Save frame after Enter attempt
                        if (shots_dir or save_dir):
                            try:
                                img = await _capture_canvas_dataurl(page)
                                if img:
                                    target_dir = shots_dir or save_dir  # type: ignore[truthy-bool]
                                    filename = f"{enter_attempts+1:04d}_Enter.png"
                                    _write_data_url_png(img, os.path.join(target_dir, filename))
                                    image_rel = os.path.join("screenshots", filename) if shots_dir else filename
                            except Exception:
                                pass
                        # Log Enter attempt state
                        try:
                            (res.setdefault("keypress_log", [])).append({
                                "t": time.time(),
                                "key": "Enter",
                                "state": _shallow_state_view(cur),
                                "attempt": enter_attempts + 1,
                                "gameState": gs if isinstance(gs, dict) else None,
                                "image": image_rel if (shots_dir or save_dir) else None,
                            })
                        except Exception:
                            pass
                        if debug:
                            logging.info(f"State after Enter: {cur}")
                        if isinstance(cur, dict) and (cur.get('phase') == 'PLAYING' or cur.get('phase') == 'PAUSED'):
                            break
                    except Exception as e:
                        if debug:
                            logging.info(f"Enter press error: {e}")
                    enter_attempts += 1

                # Baseline after start (post-Enter) for interaction comparison
                baseline_gs = await _get_full_game_state(page)

                # Capture state right after trying to start the game
                after_enter_pixels = await _sample_canvas_pixels(page)
                after_enter_state = await _get_game_state(page)
                after_enter_img = await _capture_canvas_dataurl(page)

                # Compute start-on-enter checks: require BOTH visual change and phase change
                start_pixel_change = False
                if before_pixels and after_enter_pixels:
                    changed = sum(1 for b, a in zip(before_pixels, after_enter_pixels) if b != a)
                    ratio = changed / min(len(before_pixels), len(after_enter_pixels))
                    # small threshold to detect meaningful change
                    start_pixel_change = ratio >= 0.005

                start_img_change = False
                try:
                    if before_img and after_enter_img and before_img != after_enter_img:
                        start_img_change = True
                except Exception:
                    pass

                start_phase_changed = False
                try:
                    if isinstance(before_state, dict) and isinstance(after_enter_state, dict):
                        # Prefer explicit transition to PLAYING
                        if before_state.get("phase") != after_enter_state.get("phase") and after_enter_state.get("phase") in ("PLAYING", "PAUSED"):
                            start_phase_changed = True
                except Exception:
                    pass

                res["start_on_enter"] = {
                    "phase_before": (before_state or {}).get("phase") if isinstance(before_state, dict) else None,
                    "phase_after": (after_enter_state or {}).get("phase") if isinstance(after_enter_state, dict) else None,
                    "phase_changed": bool(start_phase_changed),
                    "visual_changed": bool(start_pixel_change or start_img_change),
                }
                res["start_on_enter"]["passed"] = bool(res["start_on_enter"]["phase_changed"] and res["start_on_enter"]["visual_changed"])  # type: ignore[index]

                # Random interaction test: send random gameplay keys (exclude Enter)
                interaction_keys = [" ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Z", "Shift"]
                inter_start_t = time.time()
                # Bound the loop by duration; at least 2 seconds of random interactions
                img_counter = 10000  # start high to separate from enter attempts
                prev_gs = baseline_gs
                while time.time() - inter_start_t < max(2, duration // 2):
                    k = random.choice(interaction_keys)
                    try:
                        if debug:
                            logging.info(f"Pressing: {k}")
                        await _press_key_robust(page, k, debug)
                        cur_state = await _get_game_state(page)
                        gs = await _get_full_game_state(page)
                        # Save frame after this action
                        if (shots_dir or save_dir):
                            try:
                                img = await _capture_canvas_dataurl(page)
                                if img:
                                    target_dir = shots_dir or save_dir  # type: ignore[truthy-bool]
                                    filename = f"{img_counter:04d}_{k.replace(' ', 'Space')}.png"
                                    _write_data_url_png(img, os.path.join(target_dir, filename))
                                    image_rel = os.path.join("screenshots", filename) if shots_dir else filename
                            except Exception:
                                pass
                        # Compute per-action state change vs previous snapshot
                        per_action_changed = False
                        try:
                            if isinstance(prev_gs, dict) and isinstance(gs, dict):
                                left = json.dumps(prev_gs, sort_keys=True, default=str)
                                right = json.dumps(gs, sort_keys=True, default=str)
                                per_action_changed = (left != right)
                        except Exception:
                            pass
                        try:
                            (res.setdefault("keypress_log", [])).append({
                                "t": time.time(),
                                "key": k,
                                "state": _shallow_state_view(cur_state),
                                "gameState": gs if isinstance(gs, dict) else None,
                                "image": image_rel if (shots_dir or save_dir) else None,
                                "state_changed": bool(per_action_changed),
                            })
                        except Exception:
                            pass
                        if debug:
                            logging.info(f"Observed state after {k}: {cur_state}")
                        img_counter += 1
                        prev_gs = gs if isinstance(gs, dict) else prev_gs
                    except Exception as e:
                        if debug:
                            logging.info(f"Key {k} press error: {e}")

                after_pixels = await _sample_canvas_pixels(page)
                after_state = await _get_game_state(page)
                after_img = await _capture_canvas_dataurl(page)
                # Final gs after interactions (from last loop iteration if available)
                last_gs = prev_gs or await _get_full_game_state(page)
                if debug:
                    logging.info(f"Final state: {after_state}")

                # Interaction diffs: compare AFTER ENTER vs AFTER INTERACTION
                inter_pixel_change = False
                if after_enter_pixels and after_pixels:
                    changed = sum(1 for b, a in zip(after_enter_pixels, after_pixels) if b != a)
                    ratio = changed / min(len(after_enter_pixels), len(after_pixels))
                    inter_pixel_change = ratio >= 0.01

                inter_state_change = False
                try:
                    # Prefer comparing full gameState snapshots when available
                    if isinstance(baseline_gs, dict) and isinstance(last_gs, dict):
                        left = json.dumps(baseline_gs, sort_keys=True, default=str)
                        right = json.dumps(last_gs, sort_keys=True, default=str)
                        inter_state_change = (left != right)
                    elif isinstance(after_enter_state, dict) and isinstance(after_state, dict):
                        if after_enter_state.get("phase") != after_state.get("phase"):
                            inter_state_change = True
                        elif after_enter_state.get("score") != after_state.get("score"):
                            inter_state_change = True
                        elif (after_enter_state.get("player") or {}) != (after_state.get("player") or {}):
                            inter_state_change = True
                except Exception:
                    pass

                inter_img_change = False
                try:
                    if after_enter_img and after_img and after_enter_img != after_img:
                        inter_img_change = True
                except Exception:
                    pass

                # Record strict interaction requirement: BOTH state and visual changes
                res["interaction"] = {
                    "state_changed": bool(inter_state_change),
                    "visual_changed": bool(inter_pixel_change or inter_img_change),
                }
                res["interaction"]["passed"] = bool(res["interaction"]["state_changed"] and res["interaction"]["visual_changed"])  # type: ignore[index]

                # Back-compat field: true if any change observed (not used for pass/fail now)
                res["interaction_changes"] = bool(inter_pixel_change or inter_state_change or inter_img_change)

                await browser.close()
                return res
        finally:
            if server_proc:
                try:
                    server_proc.terminate()
                except Exception:
                    pass

    loop = asyncio.get_event_loop()
    fut = asyncio.ensure_future(_run())
    if not loop.is_running():
        out = loop.run_until_complete(fut)
    else:
        start = time.time()
        while not fut.done():
            if time.time() - start > timeout + duration + 5:
                fut.cancel()
                return {"test_result": False, "error": "Test timed out"}
            time.sleep(0.1)
        out = fut.result()

    # Determine final result: must load, start on Enter (phase + visual), and pass interaction (state + visual)
    start_ok = bool((out.get("start_on_enter") or {}).get("passed"))
    interact_ok = bool((out.get("interaction") or {}).get("passed"))
    ok = bool(out.get("loaded")) and start_ok and interact_ok and not out.get("page_errors")
    return {"test_result": ok, **out}


