# Terminal colors
from gen_game_claude import generate


GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

GAME_DESIGN_SYSTEM_PROMPT = open("game_generators/system_prompts/game_design.txt").read()

CODE_GENERATION_SYSTEM_PROMPT = open("game_generators/system_prompts/code_generation.txt").read()

CANVAS_SIZE = {"width": 600, "height": 400}

AVAILABLE_CONTROL_PROMPT = """Available Control Actions (You should only use the following actions):
1. Directional Movement:
   - Arrow Keys: LEFT_ARROW (key: 37), RIGHT_ARROW (key: 39), UP_ARROW (key: 38), DOWN_ARROW (key: 40)
   - Alternative WASD: 'w' (up), 'a' (left), 's' (down), 'd' (right)
2. Special Actions:
   - SHIFT key (key: 16)
   - SPACE key (key: 32)
Note: Both arrow keys and WASD provide the same directional control functionality - choose one control scheme for consistency.
"""

FORMAT_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <style>
      html, body {{
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        background: #222;
      }}
      body {{
        display: flex;
        justify-content: center;
        align-items: center;
      }}
      canvas {{
        border: 1px solid #333;
        width: 600px !important;
        height: 400px !important;
      }}
    </style>
  </head>
  <body>
    <script src="{p5js_url}"></script>
    <!-- Load game modules -->
    <script type="module" src="YOUR_GAME_FILES.js"></script>
  </body>
</html>"""
