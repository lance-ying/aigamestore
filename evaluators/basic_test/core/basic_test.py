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


async def _press_sequence(page: Page, duration_sec: int = 5) -> None:
    keys = ["Enter", " ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]
    start = time.time()
    while time.time() - start < duration_sec:
        for key in keys:
            try:
                await page.keyboard.press(key)
                await page.wait_for_timeout(120)
            except Exception:
                pass


def test_game(game_path: str, duration: int = 10, timeout: int = 20) -> Dict[str, Any]:
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
                try:
                    canvas = page.locator("canvas").first
                    if await canvas.count() > 0:
                        await canvas.click()
                except Exception:
                    pass

                # initial sample
                before = await _sample_canvas_pixels(page)
                await _press_sequence(page, max(2, duration // 2))
                after = await _sample_canvas_pixels(page)

                # simple diff
                if before and after:
                    changed = sum(1 for b, a in zip(before, after) if b != a)
                    ratio = changed / min(len(before), len(after))
                    res["interaction_changes"] = ratio >= 0.1  # 10% pixels changed

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


