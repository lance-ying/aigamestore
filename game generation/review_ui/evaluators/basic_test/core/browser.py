import os
import time
import logging
import asyncio
import subprocess
from typing import Any, Dict, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

try:
    from playwright.async_api import async_playwright, Page
    HEADLESS_BROWSER_ENABLED = True
except Exception:
    logging.warning("Playwright not installed. Install with: pip install playwright && python -m playwright install --with-deps firefox")
    HEADLESS_BROWSER_ENABLED = False


async def _start_server_if_needed(game_path: str, port: int) -> subprocess.Popen | None:
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
        abs_path = os.path.abspath(game_path)
        return f"file://{abs_path}"
    return f"http://localhost:{port}"


async def _setup_event_listeners(page: Page, console_errors: Dict[str, List[str]], request_failures: List[Dict[str, Any]], page_errors: List[str]) -> None:
    page.on(
        "console",
        lambda msg: console_errors.setdefault(msg.type, []).append(msg.text),
    )
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
        request_failures.append({
            "url": req.url,
            "method": req.method,
            "failure": failure_text,
        })
    
    page.on("requestfailed", handle_request_failed)
    page.on(
        "response",
        lambda resp: (request_failures.append({
            "url": resp.url,
            "status": resp.status,
            "status_text": resp.status_text,
        }) if resp.status >= 400 else None),
    )


async def _add_js_hooks(page: Page) -> None:
    await page.add_init_script(
        """
        window.capturedECS = { entities: {}, components: {}, systems: {}, entity_snapshots: [] };

        window.extractEntitiesFromGlobal = function() {
          const result = {};
          const trackProps = ['position','pos','x','y','z','transform','velocity','vel','speed','direction','angle','rotation','health','hp','lives','score','points','state','visible','active','enabled'];
          const track = (entity) => {
            const out = {};
            for (const prop of trackProps) {
              if (entity[prop] !== undefined) out[prop] = typeof entity[prop] === 'object' ? JSON.parse(JSON.stringify(entity[prop])) : entity[prop];
            }
            if (entity.components) {
              for (const [compName, comp] of Object.entries(entity.components)) {
                for (const prop of trackProps) {
                  if (comp[prop] !== undefined) out[`${compName}.${prop}`] = typeof comp[prop] === 'object' ? JSON.parse(JSON.stringify(comp[prop])) : comp[prop];
                }
              }
            }
            return out;
          };

          const ingestEntity = (id, entity) => {
            const components = {};
            if (entity.components && typeof entity.components === 'object') {
              for (const [name, comp] of Object.entries(entity.components)) {
                const norm = name.endsWith('Component') ? name : name + 'Component';
                components[norm] = comp && typeof comp === 'object' ? Object.keys(comp) : [];
                window.capturedECS.components[norm] = window.capturedECS.components[norm] || components[norm];
              }
            }
            if (Object.keys(components).length > 0) {
              result[id] = components;
              result[id]._tracked_properties = track(entity);
            }
          };

          if (Array.isArray(window.entities)) {
            window.entities.forEach((e, i) => { if (e && typeof e === 'object') ingestEntity(e.id || e.name || e.type || `entity_${i}`, e); });
          } else if (window.entities && typeof window.entities === 'object') {
            Object.entries(window.entities).forEach(([id, e]) => { if (e && typeof e === 'object') ingestEntity(id, e); });
          }

          window.capturedECS.entities = Object.assign({}, window.capturedECS.entities, result);
          try {
            window.capturedECS.entity_snapshots.push({ timestamp: Date.now(), entities: JSON.parse(JSON.stringify(result)) });
            if (window.capturedECS.entity_snapshots.length > 5) window.capturedECS.entity_snapshots.shift();
          } catch (e) {}
          return result;
        };
        """
    )


async def _press_basic_keys(page: Page) -> None:
    for key in ["Enter", " ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]:
        try:
            await page.keyboard.press(key)
            await page.wait_for_timeout(250)
        except Exception:
            pass


async def extract_runtime_ecs_data(
    game_path: str,
    port: int = 8000,
    timeout: int = 60,
    capture_baseline: bool = False,
    capture_action: bool = False,
) -> Dict[str, Any]:
    if not HEADLESS_BROWSER_ENABLED:
        return {
            "error": "Playwright not installed. Run 'pip install playwright && python -m playwright install firefox'",
        }

    result: Dict[str, Any] = {
        "entities": {},
        "components": {},
        "systems": {},
        "errors": [],
        "console_errors": {},
        "request_failures": [],
        "screenshots": [],
        "_meta": {},
    }

    server_proc: Optional[subprocess.Popen] = None
    url = _build_url(game_path, port)

    try:
        if os.path.isdir(game_path):
            server_proc = await _start_server_if_needed(game_path, port)

        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            await _setup_event_listeners(page, result["console_errors"], result["request_failures"], result["errors"])  # type: ignore[arg-type]
            await _add_js_hooks(page)

            try:
                await page.goto(url, wait_until="networkidle", timeout=timeout * 1000)
            except Exception as e:
                result["errors"].append(f"goto error: {e}")
                await browser.close()
                return result

            # Try focus canvas if present
            try:
                canvas = page.locator("canvas").first
                if await canvas.count() > 0:
                    await canvas.click()
            except Exception:
                pass

            # Interact a bit to kick things off
            await _press_basic_keys(page)

            # Extract baseline or action states
            try:
                await page.evaluate("window.extractEntitiesFromGlobal()")
            except Exception as e:
                result["errors"].append(f"extract error: {e}")

            # Take a quick screenshot path (best-effort; not critical)
            try:
                screenshots_dir = os.path.join(game_path if os.path.isdir(game_path) else os.path.dirname(game_path), "metrics_results", "screenshots")
                os.makedirs(screenshots_dir, exist_ok=True)
                shot_path = os.path.join(screenshots_dir, f"state_{int(time.time())}.png")
                await page.screenshot(path=shot_path)
                result["screenshots"].append(shot_path)
            except Exception:
                pass

            # Pull captured data back
            try:
                captured = await page.evaluate("window.capturedECS")
                if isinstance(captured, dict):
                    for key in ("entities", "components", "systems", "entity_snapshots"):
                        if key in captured:
                            result[key] = captured[key]
            except Exception as e:
                result["errors"].append(f"capture read error: {e}")

            await browser.close()

    except Exception as e:
        result["errors"].append(str(e))
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

    if capture_baseline:
        result["_meta"]["capture_type"] = "baseline"
        result["_meta"]["capture_time"] = time.time()
    if capture_action:
        result["_meta"]["capture_type"] = "post_action"
        result["_meta"]["capture_time"] = time.time()

    return result


async def extract_runtime_ecs_data_with_recording(
    game_path: str,
    recording_duration: int = 30,
    port: int = 8000,
    timeout: int = 60,
) -> Dict[str, Any]:
    # For now, reuse extract and add periodic screenshots
    base = await extract_runtime_ecs_data(game_path, port=port, timeout=timeout)
    if "error" in base:
        return base

    if not HEADLESS_BROWSER_ENABLED:
        return base

    server_proc: Optional[subprocess.Popen] = None
    url = _build_url(game_path, port)

    try:
        if os.path.isdir(game_path):
            server_proc = await _start_server_if_needed(game_path, port)

        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            await _setup_event_listeners(page, base["console_errors"], base["request_failures"], base["errors"])  # type: ignore[arg-type]
            await _add_js_hooks(page)
            await page.goto(url, wait_until="networkidle", timeout=timeout * 1000)
            try:
                canvas = page.locator("canvas").first
                if await canvas.count() > 0:
                    await canvas.click()
            except Exception:
                pass

            screenshots_dir = os.path.join(game_path if os.path.isdir(game_path) else os.path.dirname(game_path), "metrics_results", "screenshots")
            os.makedirs(screenshots_dir, exist_ok=True)

            start = time.time()
            while time.time() - start < recording_duration:
                await _press_basic_keys(page)
                try:
                    await page.evaluate("window.extractEntitiesFromGlobal()")
                except Exception:
                    pass
                try:
                    shot_path = os.path.join(screenshots_dir, f"record_{int(time.time())}.png")
                    await page.screenshot(path=shot_path)
                    base["screenshots"].append(shot_path)
                except Exception:
                    pass
                await asyncio.sleep(2)

            captured = await page.evaluate("window.capturedECS")
            if isinstance(captured, dict):
                for key in ("entities", "components", "systems", "entity_snapshots"):
                    if key in captured:
                        base[key] = captured[key]
            await browser.close()
    except Exception as e:
        base["errors"].append(str(e))
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

    return base



