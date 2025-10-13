from pathlib import Path
from typing import Dict, List


LIB_URLS = {
    "p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js",
    "p5.collide2D": "https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js",
    "p5play": "https://cdn.jsdelivr.net/npm/p5.play@3.13.0/lib/p5.play.js",
    "planck": "https://cdn.jsdelivr.net/npm/planck-js@0.3.0/dist/planck.min.js",
}


def build_script_tags(libraries: List[str]) -> str:
    tags = []
    for lib in libraries:
        url = LIB_URLS.get(lib)
        if url:
            tags.append(f'<script src="{url}"></script>')
    tags.append('<script type="module" src="game.js"></script>')
    return "\n    ".join(tags)


def render_html_template(template_path: str, libraries: List[str]) -> str:
    html = Path(template_path).read_text(encoding="utf-8")
    scripts = build_script_tags(libraries)
    if "{scripts}" in html:
        return html.replace("{scripts}", scripts)
    if "p5.js" in html and "game.js" in html:
        lines = html.splitlines()
        start = None
        end = None
        for i, line in enumerate(lines):
            if start is None and "<script" in line:
                start = i
            if "game.js" in line:
                end = i
        if start is not None and end is not None and end >= start:
            return "\n".join(lines[:start] + ["    " + l for l in scripts.splitlines()] + lines[end+1:])
    return html.replace("</body>", "    " + scripts + "\n  </body>")


