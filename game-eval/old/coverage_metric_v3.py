from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    path = p.chromium.executable_path
    print(path)

import tempfile
import time
import signal
import multiprocessing
import json
import urllib.parse
from multiprocessing import Queue
from pathlib import Path
from collections import defaultdict
from playwright.sync_api import sync_playwright

def get_line_number_offsets(source: str):
    """
    Build a list mapping byte offsets to line numbers. Returns List[(offset, line)]
    """
    lines = source.splitlines(keepends=True)
    offsets = []
    offset = 0
    for idx, line in enumerate(lines):
        offsets.append((offset, idx + 1))
        offset += len(line.encode('utf-8'))
    return offsets

def offset_to_line(offsets, byte_offset: int) -> int:
    """Find line number for a byte offset."""
    for i in range(len(offsets) - 1):
        if offsets[i][0] <= byte_offset < offsets[i + 1][0]:
            return offsets[i][1]
    return offsets[-1][1]

def run_game(game_code: dict[str, str], headless: bool = True,
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 60000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 180000) -> dict:
    """Test a p5.js game, returning errors and coverage per file/line."""
    import warnings
    assert isinstance(game_code, dict), "game_code must be a dictionary"
    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "Enter", "r")

    def run_test(code_copy, result_queue, **kwargs):
        errors = []
        coverage_report = []
        if "index.html" not in code_copy:
            errors.append("Critical Error: index.html not found.")
            result_queue.put({'errors': errors, 'coverage': coverage_report})
            return

        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir)
            # write files
            for rel, content in code_copy.items():
                path = base / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')

            # start Playwright
            pw = sync_playwright().start()
            # browser = pw.chromium.launch(headless=kwargs['headless'])
            browser = pw.chromium.launch(
                args=[
                    '--disable-gpu',
                    '--disable-gpu-compositing',
                    '--disable-gpu-rasterization',
                    '--disable-gpu-sandbox',
                    '--disable-software-rasterizer',
                    '--force-cpu-draw',
                    '--disable-web-security',
                    '--disable-site-isolation-trials'
                ],
                headless=False
            )

            context = browser.new_context(viewport={'width': kwargs['viewport_width'], 'height': kwargs['viewport_height']})
            page = context.new_page()
            # inject error collector
            error_js = "window.jsErrors=[]; window.onerror=(m,s,l,c,e)=>{window.jsErrors.push({msg:m,src:s,lin:l}); return true;};"
            page.add_init_script(error_js)

            # start JS coverage
            client = context.new_cdp_session(page)
            client.send("Profiler.enable")
            client.send("Profiler.startPreciseCoverage", {"callCount": True, "detailed": True})

            # load game
            page.goto(f"file://{(base / 'index.html').resolve()}")
            page.wait_for_selector('canvas', timeout=10000)
            page.wait_for_timeout(kwargs['initial_wait'])
            # interactions
            import random
            curr = None
            elapsed = 0
            while elapsed < kwargs['total_test_time']:
                if curr and random.random() < kwargs['sticky_prob']:
                    pass
                else:
                    if curr: page.keyboard.up(curr)
                    curr = random.choice(kwargs['sticky_actions'])
                    page.keyboard.down(curr)
                page.wait_for_timeout(kwargs['action_duration'])
                elapsed += kwargs['action_duration']
            if curr: page.keyboard.up(curr)
            page.wait_for_timeout(100)

            # stop coverage
            cov = client.send("Profiler.takePreciseCoverage")
            client.send("Profiler.stopPreciseCoverage")
            client.send("Profiler.disable")

            # process coverage per file
            for entry in cov.get('result', []):
                url = entry.get('url', '')
                if url.startswith('file://'):
                    local = url.replace('file://', '')
                    rel = Path(local).relative_to(base)
                    if rel.name in code_copy:
                        src = code_copy[rel.name]
                        offsets = get_line_number_offsets(src)
                        counts = defaultdict(int)
                        for func in entry.get('functions', []):
                            for r in func.get('ranges', []):
                                c = r.get('count', 0)
                                if c:
                                    start = offset_to_line(offsets, r['startOffset'])
                                    end = offset_to_line(offsets, r['endOffset'])
                                    for ln in range(start, end+1): counts[ln] += c
                        for ln, c in sorted(counts.items()):
                            coverage_report.append({'file': str(rel), 'line': ln, 'count': c})

            # collect errors
            errs = page.evaluate("window.jsErrors")
            for e in errs:
                errors.append(f"{e['msg']} at {e['src']}:{e['lin']}")

            # cleanup
            context.close(); browser.close(); pw.stop()

        result_queue.put({'errors': errors, 'coverage': coverage_report})

    # warn on long tests
    if total_test_time > max_execution_time:
        warnings.warn(...)
    q = Queue()
    p = multiprocessing.Process(target=run_test, args=(game_code, q), kwargs={
        'headless': headless, 'initial_wait': initial_wait,
        'sticky_prob': sticky_prob, 'action_duration': action_duration,
        'total_test_time': total_test_time, 'viewport_width': viewport_width,
        'viewport_height': viewport_height, 'sticky_actions': sticky_actions
    })
    p.start(); start=time.time()
    while p.is_alive():
        if time.time()-start > max_execution_time/1000:
            p.terminate(); p.join(2); q.put({'errors': ['Timeout'], 'coverage': []}); break
        time.sleep(0.5)
    res = q.get() if not q.empty() else {'errors': ['No result'], 'coverage': []}
    # display coverage
    print(json.dumps(res['coverage'], indent=2))
    return res['errors']





if __name__ == "__main__":
    from utils import code_from_dir

    games_dir = Path(__file__).parent / "results" / "gen_minigame_improve_batch" / "run1" / "claude-3-7-sonnet-20250219" / "thinking" / "top-down"

    themes_dir = sorted(games_dir.glob("theme_*"), key=lambda x: int(x.stem.split("_")[-1]))
    for theme_dir in themes_dir:
        if theme_dir.stem != "theme_4":
            continue
        code_original = code_from_dir(theme_dir / "code_original")

        improved_sample_dirs = sorted((theme_dir / "improve_iter1").glob("sample_*"), key=lambda x: int(x.stem.split("_")[-1]))
        print(improved_sample_dirs)
        code_improved = code_from_dir(improved_sample_dirs[-1])

        run_game(code_original, headless=False, max_execution_time=10000)
        # run_game(code_improved, headless=False)
