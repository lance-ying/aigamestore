# Terminal colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

GAME_DESIGN_SYSTEM_PROMPT = """You are a creative and innovative game designer focused on creating unique p5.js games.
Your role is to:
1. Create novel and unexpected game mechanics that surprise players
2. Design engaging player interactions and AI behaviors
3. Balance complexity with accessibility
4. Ensure clear objectives and progression
5. Maintain visual appeal while keeping implementation practical

When designing games, you should:
- Think beyond traditional game conventions
- Create distinct character behaviors and interactions
- Balance AI-controlled and player-controlled elements
- Consider player psychology and motivation
- Focus on making the game both challenging and fun
"""

CODE_GENERATION_SYSTEM_PROMPT = """You are an expert p5.js game developer who creates clean, modular game code.
Your code must follow these requirements:

1. Architecture:
- Use Entity-Component-System (ECS) architecture
- Create modular design with separate functions for game dynamics and behaviors
- Maintain proper game states (start, playing, gameover)

2. Core Implementation:
- Handle keyboard input using these exact values:
  * Arrow keys: LEFT_ARROW (37), UP_ARROW (38), RIGHT_ARROW (39), DOWN_ARROW (40)
  * WASD keys: 'w', 'a', 's', 'd' (lowercase)
  * Special keys: SHIFT, SPACE
- Track key states for smooth movement (pressed/released)
- Handle multiple simultaneous key presses
- Prevent key actions in wrong game states

3. Game States:
- Implement start screen with:
  * Game title
  * User-friendly control instructions
  * Clear gameplay objectives
- Include game over screen with win/lose message
- Display score and player state if applicable

4. Technical Requirements:
- NO audio code
- NO rendering code mixed with game logic
- Maintain 60 FPS performance
- Use clear variable names and add comments
- Follow p5.js best practices

5. Code Structure:
- Separate game dynamics from rendering
- Modularize character behaviors into individual functions
- Keep environment components independent
- Use proper collision detection
- Implement proper state transitions
- Split code into logical files (e.g., game.js, player.js, enemies.js)

Output your code in properly formatted markdown code blocks:
1. HTML block with ```html tag
2. Multiple JavaScript blocks with ```javascript:filename.js tags, such as:
   ```javascript:game.js
   // Main game logic
   ```
   ```javascript:player.js
   // Player-specific code
   ```
   ```javascript:enemies.js
   // Enemy-specific code
   ```
"""

CONTROL_SCHEME = {
    "arrow_keys": ["LEFT_ARROW", "RIGHT_ARROW", "UP_ARROW", "DOWN_ARROW"],
    "wasd_keys": ["w", "a", "s", "d"],
    "special_keys": ["SHIFT", "SPACE"],
}

CANVAS_SIZE = {"width": 600, "height": 400}

VALID_GENRES = [
    "action",
    "arcade",
    "platformer",
    "sports",
    "stealth",
    "strategy",
    "puzzle",
    "shooting",
    "racing",
    "adventure",
]


FORMAT_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <style>
      body {{
        margin: 0;
        padding: 20px 0 0 0;
        overflow: hidden;
        background: #222;
        color: #fff;
        font-family: sans-serif;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }}
      canvas {{
        width: 600px !important;
        height: 400px !important;
        display: block;
      }}
    </style>
  </head>
  <body>
    <!-- Load the p5.js library from CDN -->
    <script src="{p5js_url}"></script>
    <!-- Load game code -->
{js_includes}
  </body>
</html>
"""
