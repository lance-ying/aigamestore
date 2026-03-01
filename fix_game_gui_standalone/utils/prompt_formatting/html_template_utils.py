from pathlib import Path
from typing import Dict, List


LIB_URLS = {
    "p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js",
    "p5.collide2D": "https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js",
    "p5play": "https://cdn.jsdelivr.net/npm/p5.play@3.13.0/lib/p5.play.js",
    "planck": "https://cdn.jsdelivr.net/npm/planck-js@0.3.0/dist/planck.min.js",
    "matter.js": "https://cdn.jsdelivr.net/npm/matter-js@0.17.1/dist/matter.min.js",
    "three.js": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "seedrandom": "https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js",
}


def build_script_tags(libraries: List[str]) -> str:
    tags = []
    for lib in libraries:
        url = LIB_URLS.get(lib)
        if url:
            tags.append(f'<script src="{url}"></script>')
    tags.append('<script type="module" src="game.js"></script>')
    return "\n    ".join(tags)


def get_default_html_template() -> str:
    """Return a default HTML template with {scripts} placeholder."""
    return """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Title</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
      }
      main {
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main></main>
    {scripts}
  </body>
</html>"""


def render_html_template(template_path: str, libraries: List[str]) -> str:
    # Try to read template file, fall back to default if it doesn't exist
    template_file = Path(template_path)
    if template_file.exists():
        html = template_file.read_text(encoding="utf-8")
    else:
        html = get_default_html_template()
    
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
