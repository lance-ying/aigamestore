import os
import time
import asyncio
import logging
import subprocess
from typing import Any, Dict, List, Optional

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
    page.on("requestfailed", lambda req: request_failures.append({"url": req.url, "method": req.method, "failure": req.failure.error_text if req.failure else "unknown"}))
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


def test_game(game_path: str, duration: int = 10, timeout: int = 20, debug: bool = False) -> Dict[str, Any]:
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
                        if debug:
                            logging.info(f"State after Enter: {cur}")
                        if isinstance(cur, dict) and (cur.get('phase') == 'PLAYING' or cur.get('phase') == 'PAUSED'):
                            break
                    except Exception as e:
                        if debug:
                            logging.info(f"Enter press error: {e}")
                    enter_attempts += 1

                # Press a sequence of keys while logging
                keys = [" ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]
                start_t = time.time()
                while time.time() - start_t < max(2, duration // 2):
                    for k in keys:
                        try:
                            if debug:
                                logging.info(f"Pressing: {k}")
                            await _press_key_robust(page, k, debug)
                            if debug:
                                cur_state = await _get_game_state(page)
                                logging.info(f"Observed state after {k}: {cur_state}")
                        except Exception as e:
                            if debug:
                                logging.info(f"Key {k} press error: {e}")

                after_pixels = await _sample_canvas_pixels(page)
                after_state = await _get_game_state(page)
                after_img = await _capture_canvas_dataurl(page)
                if debug:
                    logging.info(f"Final state: {after_state}")

                # simple diff
                pixel_change = False
                if before_pixels and after_pixels:
                    changed = sum(1 for b, a in zip(before_pixels, after_pixels) if b != a)
                    ratio = changed / min(len(before_pixels), len(after_pixels))
                    pixel_change = ratio >= 0.1

                # game state change heuristic
                state_change = False
                try:
                    if isinstance(before_state, dict) and isinstance(after_state, dict):
                        if before_state.get("phase") != after_state.get("phase"):
                            state_change = True
                        elif before_state.get("score") != after_state.get("score"):
                            state_change = True
                        elif (before_state.get("player") or {}) != (after_state.get("player") or {}):
                            state_change = True
                except Exception:
                    pass

                img_change = False
                try:
                    if before_img and after_img and before_img != after_img:
                        img_change = True
                except Exception:
                    pass

                res["interaction_changes"] = bool(pixel_change or state_change or img_change)

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

    # Determine final result
    ok = bool(out.get("loaded")) and bool(out.get("interaction_changes")) and not out.get("page_errors")
    return {"test_result": ok, **out}


