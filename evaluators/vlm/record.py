import os
import json
import asyncio
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from playwright.async_api import async_playwright, Page
    PLAYWRIGHT_OK = True
except Exception:
    PLAYWRIGHT_OK = False


async def _start_server_if_needed(game_path: str, port: int) -> Optional[Any]:
    import subprocess

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
    # default to index.html when serving directory
    return f"http://localhost:{port}/index.html"


async def _find_test_buttons(page: Page) -> List[Dict[str, Any]]:
    buttons: List[Dict[str, Any]] = []
    # Prefer id pattern
    candidates = await page.query_selector_all("button[id*='ModeBtn'], button")
    for el in candidates:
        try:
            _id = await el.get_attribute("id")
            txt = (await el.inner_text()).strip()
            if _id and "ModeBtn" in _id:
                buttons.append({"id": _id, "text": txt})
            elif "test" in txt.lower():
                buttons.append({"id": _id or "", "text": txt})
        except Exception:
            continue
    # dedupe by id/text
    uniq: Dict[str, Dict[str, Any]] = {}
    for b in buttons:
        key = b.get("id") or b.get("text")
        if key and key not in uniq:
            uniq[key] = b
    return list(uniq.values())


def _load_test_metadata(game_dir: str) -> Dict[str, Dict[str, str]]:
    meta_path = Path(game_dir) / "metadata.json"
    if not meta_path.exists():
        return {}
    try:
        data = json.loads(meta_path.read_text(encoding="utf-8"))
        auto = (
            data.get("game_info", {}).get("automated_testing")
            if isinstance(data, dict)
            else None
        )
        # If structured, expect mapping; otherwise return an empty map
        return auto if isinstance(auto, dict) else {}
    except Exception:
        return {}


async def record_gameplay_tests(game_dir: str, duration: int = 15, port: int = 8000) -> List[Tuple[str, str, Dict[str, str]]]:
    if not PLAYWRIGHT_OK:
        raise RuntimeError("Playwright not installed. Install playwright and run 'python -m playwright install firefox'")

    server_proc = await _start_server_if_needed(game_dir, port)
    try:
        async with async_playwright() as p:
            results: List[Tuple[str, str, Dict[str, str]]] = []
            url = _build_url(game_dir, port)
            out_dir = Path(game_dir) / "vlm_results"
            out_dir.mkdir(parents=True, exist_ok=True)

            # Discover tests first (no recording)
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(1000)
            buttons = await _find_test_buttons(page)
            await context.close()
            await browser.close()

            # Load metadata for test descriptions
            test_meta = _load_test_metadata(game_dir)

            # Record each test sequentially
            for idx, btn in enumerate(buttons, start=1):
                browser = await p.firefox.launch(headless=True)
                context = await browser.new_context(record_video_dir=str(out_dir))
                page = await context.new_page()
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(800)

                # Focus canvas
                try:
                    canvas = page.locator("canvas").first
                    if await canvas.count() > 0:
                        await canvas.click()
                except Exception:
                    pass

                # Click the test button if identifiable by id or by text
                if btn.get("id"):
                    el = await page.query_selector(f"#{btn['id']}")
                else:
                    # fallback: find button by text
                    el = None
                    for candidate in await page.query_selector_all("button"):
                        if (await candidate.inner_text()).strip() == btn.get("text"):
                            el = candidate
                            break
                try:
                    if el:
                        await el.click()
                        await page.wait_for_timeout(250)
                except Exception:
                    pass

                # Start the game
                try:
                    await page.keyboard.press("Enter")
                except Exception:
                    pass

                await page.wait_for_timeout(duration * 1000)

                # Close to finalize video
                await page.close()
                await context.close()

                # Find the last video file in out_dir
                video_path = None
                try:
                    # Playwright stores per-page video in a temp subdir; get newest .webm
                    vids = sorted(out_dir.rglob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
                    if vids:
                        video_path = str(vids[0])
                except Exception:
                    pass
                await browser.close()

                test_mode = btn.get("id") or f"test_{idx}"
                meta = test_meta.get(test_mode, {}) if isinstance(test_meta, dict) else {}
                results.append((test_mode, video_path or "", meta))

            return results
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass


