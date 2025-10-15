import os
import json
import asyncio
import time
import shutil
import base64
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


async def record_gameplay_tests(
    game_dir: str,
    duration: int = 15,
    port: int = 8000,
    resolution: Optional[Tuple[int, int]] = None,
) -> List[Tuple[str, str, Dict[str, str]]]:
    if not PLAYWRIGHT_OK:
        raise RuntimeError("Playwright not installed. Install playwright and run 'python -m playwright install firefox'")

    server_proc = await _start_server_if_needed(game_dir, port)
    try:
        async with async_playwright() as p:
            results: List[Tuple[str, str, Dict[str, str]]] = []
            url = _build_url(game_dir, port)
            out_dir = Path(game_dir) / "evaluations" / "vlm_evaluations"
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

            # Spawn one browser per button and record in parallel using MediaRecorder
            if resolution is None:
                viewport_width, viewport_height = 600, 400
            else:
                viewport_width, viewport_height = int(resolution[0]), int(resolution[1])

            async def _record_button(idx: int, btn: Dict[str, Any]) -> Tuple[str, str, Dict[str, str]]:
                browser = await p.firefox.launch(headless=True)
                # Use Playwright video capture to ensure a file is created reliably
                context = await browser.new_context(
                    record_video_dir=str(out_dir),
                    record_video_size={"width": viewport_width, "height": viewport_height},
                    viewport={"width": viewport_width, "height": viewport_height},
                )
                page = await context.new_page()
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(500)

                # Focus canvas
                try:
                    canvas = page.locator("canvas").first
                    if await canvas.count() > 0:
                        await canvas.click()
                except Exception:
                    pass

                # Click test button first
                el = None
                try:
                    if btn.get("id"):
                        el = await page.query_selector(f"#{btn['id']}")
                    else:
                        for candidate in await page.query_selector_all("button"):
                            if (await candidate.inner_text()).strip() == btn.get("text"):
                                el = candidate
                                break
                    if el:
                        await el.click()
                        await page.wait_for_timeout(250)
                except Exception:
                    pass

                # Prepare page to show only canvas at the requested resolution
                try:
                    await page.evaluate(
                        f"""
                        () => {{
                            document.documentElement.style.margin = '0';
                            document.documentElement.style.padding = '0';
                            document.documentElement.style.overflow = 'hidden';
                            document.body.style.margin = '0';
                            document.body.style.padding = '0';
                            document.body.style.overflow = 'hidden';
                            document.body.style.background = '#000';
                            const canvas = document.querySelector('canvas');
                            if (!canvas) return;
                            canvas.width = {viewport_width};
                            canvas.height = {viewport_height};
                            canvas.style.width = '{viewport_width}px';
                            canvas.style.height = '{viewport_height}px';
                            canvas.style.position = 'absolute';
                            canvas.style.left = '0px';
                            canvas.style.top = '0px';
                            canvas.style.margin = '0';
                            canvas.style.padding = '0';
                            Array.from(document.body.children).forEach(el => {{
                                if (el !== canvas && !el.contains(canvas)) {{
                                    el.style.display = 'none';
                                }}
                            }});
                        }}
                        """
                    )
                except Exception:
                    pass

                # Now press Enter to start the game (after button, after layout)
                try:
                    await page.keyboard.press("Enter")
                except Exception:
                    pass

                await page.wait_for_timeout(duration * 1000)

                test_mode = btn.get("id") or f"test_{idx}"
                safe_name = (test_mode or f"test_{idx}").replace("/", "_").replace(os.sep, "_")
                target_webm = str((out_dir / f"{safe_name}.webm").resolve())
                # Close to flush the video file
                await context.close()
                await browser.close()

                # Find the newest Playwright .webm produced in out_dir and rename
                video_path = None
                try:
                    vids = sorted(out_dir.rglob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
                    if vids:
                        latest = vids[0]
                        Path(target_webm).unlink(missing_ok=True)
                        latest.replace(Path(target_webm))
                        video_path = target_webm
                except Exception:
                    video_path = None

                # Convert to mp4
                mp4_or_src_path = video_path or ""
                try:
                    if video_path and not video_path.lower().endswith(".mp4"):
                        if shutil.which("ffmpeg") is None:
                            raise RuntimeError("ffmpeg not found. Please install ffmpeg for video conversion.")
                        target_mp4 = str((out_dir / f"{safe_name}.mp4").resolve())
                        proc = await asyncio.create_subprocess_exec(
                            "ffmpeg", "-y", "-i", video_path, "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", target_mp4,
                            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
                        )
                        await proc.communicate()
                        if proc.returncode != 0:
                            proc2 = await asyncio.create_subprocess_exec(
                                "ffmpeg", "-y", "-i", video_path,
                                "-c:v", "libx264", "-preset", "veryfast", "-crf", "0", "-pix_fmt", "yuv420p",
                                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", target_mp4,
                                stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
                            )
                            await proc2.communicate()
                            if proc2.returncode != 0:
                                raise RuntimeError("ffmpeg failed to convert video to mp4")
                        mp4_or_src_path = target_mp4
                        try:
                            Path(video_path).unlink(missing_ok=True)
                        except Exception:
                            pass
                except Exception:
                    mp4_or_src_path = video_path or ""
                meta = test_meta.get(test_mode, {}) if isinstance(test_meta, dict) else {}
                return (test_mode, mp4_or_src_path or "", meta)

            tasks = [
                _record_button(idx, btn)
                for idx, btn in enumerate(buttons, start=1)
            ]
            done = await asyncio.gather(*tasks, return_exceptions=True)
            for item in done:
                if isinstance(item, tuple):
                    results.append(item)
            return results
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass


