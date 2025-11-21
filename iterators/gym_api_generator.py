from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from llm_interface.model_api import ModelAPI


def _read_game_files(game_dir: str) -> Dict[str, str]:
    """
    Read index.html and all .js files (recursively) from the game directory.

    Returns a mapping of relative file paths (posix style) to content.
    """
    files: Dict[str, str] = {}
    game_path = Path(game_dir)

    # HTML
    html_path = game_path / "index.html"
    if html_path.exists():
        files["index.html"] = html_path.read_text(encoding="utf-8")

    # JS files
    for js_path in game_path.rglob("*.js"):
        rel = js_path.relative_to(game_path).as_posix()
        files[rel] = js_path.read_text(encoding="utf-8")

    return files


def _write_file(game_dir: str, filename: str, content: str) -> None:
    """Write a file to the game directory."""
    out_path = Path(game_dir) / filename
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content, encoding="utf-8")


class GymAPIIterator:
    """
    Iterator that generates a gym_api.js file for RL training using a 3-phase approach:
    
    Phase 1: Analyze game and generate gym_config.json
    Phase 2: Fill template with game-specific implementations
    Phase 3: Modify game.js to add RL control hooks
    
    The generated API provides:
    - reset(): Reset game to initial state
    - step(action): Execute action and return result
    - getState(): Get structured state for RL agent
    - getInfo(): Get additional debug information
    """

    def __init__(
        self,
        model: str = "anthropic:claude-4.5-sonnet",
        temperature: float = 0.7,
        thinking: bool = True,
        thinking_budget: Optional[int] = 10000,
        use_template: bool = True,
    ) -> None:
        self.api = ModelAPI(model)
        self.model = model
        self.temperature = temperature
        self.thinking = thinking
        self.thinking_budget = thinking_budget
        self.use_template = use_template

    def _build_user_prompt(
        self,
        files: Dict[str, str],
        observation_type: str = "state",
    ) -> str:
        """
        Build a prompt that analyzes the game and generates gym_api.js.

        Args:
            files: Dictionary of filename -> content
            observation_type: "state" (structured) or "pixels" (screenshot-based)
        """
        files_blob_parts: List[str] = []
        for rel_path, content in files.items():
            files_blob_parts.append(
                f"<file name=\"{rel_path}\">\n{content}\n</file>"
            )
        files_blob = "\n\n".join(files_blob_parts)

        task = f"""
<task>
You are creating a Gym API wrapper for a p5.js browser-based game to enable reinforcement learning training.

Your goal is to analyze the game code and generate a **gym_api.js** file that exposes a clean RL interface.

<game_code>
{files_blob}
</game_code>

<requirements>
The gym_api.js file must expose a window.gymAPI object with these methods:

1. **reset()**: Reset the game to initial state and return initial observation
   - Should set the game to PLAYING phase
   - Initialize level 1
   - Clear any existing entities
   - Return: {{done: false, reward: 0}}

2. **step(action)**: Execute one action and return the result
   - action format: {{left: bool, right: bool, boost: bool}}
   - Apply the action to the player
   - Let the game update for one frame
   - Calculate reward based on:
     * Score delta (primary)
     * Length increase (secondary)
     * Survival bonus (tertiary)
     * Death penalty (-100 if player dies)
   - Return: {{
       reward: number,
       done: boolean,  // true if game over (win or lose)
       info: {{score, level, length, phase}}
     }}

3. **getState()**: Return structured state for RL observation (only if observation_type is "state")
   - Return an object with:
     * player: {{x, y, angle, length, speed, isBoosting}}
     * nearestPellet: {{x, y, distance}} (or null if none)
     * nearestEnemy: {{x, y, distance}} (or null if none)
     * nearestObstacle: {{x, y, distance}} (or null if none)
     * level: number
     * score: number
     * targetLength: number
   - All coordinates should be normalized to [0, 1] range
   - Angles should be in radians

4. **getInfo()**: Return debug information
   - Return: {{
       phase: string,
       level: number,
       score: number,
       playerLength: number,
       targetLength: number,
       aiSnakeCount: number,
       pelletCount: number
     }}

<implementation_guidelines>
- Import from globals.js and game.js as needed
- Hook into the existing game loop - don't create a new one
- The gym_api.js should be a NEW FILE that imports and wraps existing game logic
- Use the existing gameState object from globals.js
- For step(), you should:
  1. Store the action in a variable that the game loop can read
  2. Let the existing game update once
  3. Calculate reward based on state changes
  4. Return the result
- For reset(), trigger the existing game initialization
- Preserve all existing game functionality
- The API should work alongside existing test modes (TEST_1, TEST_2)

<observation_type>
{observation_type}
</observation_type>
</requirements>
</task>
"""

        output_format = """
<output_instructions>
Your response must have TWO sections:

1. First, output your analysis in <analysis> tags:
<analysis>
- Game structure: [description of how the game is organized]
- Key state variables: [list the important variables for RL]
- Action mapping: [how RL actions map to game inputs]
- Reward function: [strategy for calculating rewards]
- Integration points: [where gym_api.js hooks into existing code]
</analysis>

2. Then, output the complete gym_api.js file:
<code filename="gym_api.js">
// Complete implementation of gym_api.js
// Include all necessary imports and the window.gymAPI object
</code>

Important:
- The gym_api.js file should be COMPLETE and ready to use
- Include proper error handling
- Add comments explaining the reward function
- Make sure the API is synchronous (no async/await)
- The file should be added to index.html via <script type="module" src="gym_api.js"></script>
</output_instructions>
"""

        instructions = (
            "You are an expert in reinforcement learning and game development. "
            "Create a clean, efficient Gym API that enables RL agents to learn the game. "
            "Focus on providing informative state representations and well-shaped rewards. "
            "The API should be minimal, efficient, and preserve all existing game functionality."
        )

        return instructions + "\n" + task + output_format

    def generate_config(
        self,
        game_dir: str,
        files: Dict[str, str],
        observation_type: str = "state",
    ) -> Dict[str, Any]:
        """
        Phase 1: Analyze game and generate gym_config.json
        
        Returns dict with 'config' key containing the parsed config
        """
        files_blob_parts: List[str] = []
        for rel_path, content in files.items():
            files_blob_parts.append(
                f"<file name=\"{rel_path}\">\n{content}\n</file>"
            )
        files_blob = "\n\n".join(files_blob_parts)
        
        # Load the config schema
        schema_path = Path(__file__).parent.parent / "gym_config_schema.json"
        if schema_path.exists():
            schema_content = schema_path.read_text()
        else:
            schema_content = "See gym_config_schema.json"
        
        # Load snake-io config as reference
        snake_io_config_path = Path(__file__).parent.parent / "public" / "games" / "snake-io" / "gym_config.json"
        if snake_io_config_path.exists():
            snake_io_config = snake_io_config_path.read_text()
        else:
            snake_io_config = "{}"
        
        user_prompt = f"""
You are analyzing a p5.js browser-based game to create a gym_config.json file for reinforcement learning.

<game_code>
{files_blob}
</game_code>

<reference_implementation>
Here is a working example from snake-io that you should use as a reference:
{snake_io_config}
</reference_implementation>

<config_schema>
{schema_content}
</config_schema>

<task>
Analyze the game code and create a gym_config.json file that:
1. Defines the action space (what actions can the agent take?)
2. Defines the observation space (what does the agent observe?)
3. Lists the observation fields in order
4. Maps controls to actions
5. Identifies entity types (player, collectibles, enemies, obstacles)
6. Documents reward components (optional but helpful)

The observation shape must be EXACT - count every single value that will be in the flattened state array.

Follow the snake-io reference structure but adapt it to this specific game.
</task>

<output_format>
Output ONLY valid JSON for the gym_config.json file, wrapped in <config> tags:

<config>
{{
  "game_name": "...",
  "action_space": {{ ... }},
  "observation_space": {{ ... }},
  ...
}}
</config>

Do NOT include any explanation outside the tags. The JSON must be valid and complete.
</output_format>
"""
        
        system_prompt = (
            "You are an expert RL engineer analyzing games to create Gym API configurations. "
            "You understand game mechanics, state representations, and action spaces. "
            "Be precise about observation shapes - count every value carefully."
        )
        
        response = self.api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for more consistent output
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )
        
        # Extract response text
        if isinstance(response, dict):
            response_text = response.get("response", "")
        else:
            response_text = response
        
        # Extract config JSON
        config_match = re.search(r'<config>(.*?)</config>', response_text, re.DOTALL)
        if not config_match:
            raise ValueError("Could not find <config> tags in response")
        
        config_json = config_match.group(1).strip()
        
        try:
            import json as json_module
            config = json_module.loads(config_json)
        except json_module.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in generated config: {e}\n{config_json}")
        
        return {
            "config": config,
            "config_json": config_json,
            "response": response_text,
        }
    
    def generate_api_from_template(
        self,
        game_dir: str,
        files: Dict[str, str],
        config: dict,
    ) -> Dict[str, Any]:
        """
        Phase 2: Fill gym_api_template.js with game-specific implementations
        
        Returns dict with 'gym_api_code' key containing the filled template
        """
        # Load template
        template_path = Path(__file__).parent.parent / "templates" / "gym_api_template.js"
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        
        template_content = template_path.read_text()
        
        # Load snake-io gym_api.js as reference
        snake_io_api_path = Path(__file__).parent.parent / "public" / "games" / "snake-io" / "gym_api.js"
        if snake_io_api_path.exists():
            snake_io_api = snake_io_api_path.read_text()
        else:
            snake_io_api = "// Not available"
        
        files_blob_parts: List[str] = []
        for rel_path, content in files.items():
            files_blob_parts.append(
                f"<file name=\"{rel_path}\">\n{content}\n</file>"
            )
        files_blob = "\n\n".join(files_blob_parts)
        
        import json as json_module
        config_str = json_module.dumps(config, indent=2)
        
        user_prompt = f"""
You are implementing a Gym API for a p5.js game by filling in a template.

<game_code>
{files_blob}
</game_code>

<gym_config>
{config_str}
</gym_config>

<template>
{template_content}
</template>

<reference_implementation>
Here is the working snake-io implementation to use as a reference for patterns:
{snake_io_api}

KEY PATTERNS TO PRESERVE:
1. getPlayerState() ALWAYS returns an object, never null (default values when dead)
2. findNearest() ALWAYS returns {{x, y, distance}}, never null (default values when not found)
3. validateState() ensures consistent shape every time
4. All coordinates normalized to [0, 1]
5. Defensive checks everywhere (|| [], filter, try-catch)
</reference_implementation>

<task>
Fill in ALL the {{{{PLACEHOLDER}}}} sections in the template with game-specific code:

1. {{{{GAME_IMPORTS}}}} - Import necessary items from game files
2. {{{{DEFAULT_ACTION}}}} - Default action object based on config
3. {{{{INITIAL_PREVIOUS_STATE}}}} - Initial state for reward tracking
4. {{{{ACTION_APPLICATION}}}} - How to apply actions to the player
5. {{{{REWARD_CALCULATION}}}} - Calculate reward (can be simple: just survival + score delta)
6. {{{{GET_PLAYER_STATE}}}} - Extract player state with defaults
7. {{{{FIND_NEAREST_PLAYER_CHECK}}}} - Check if player exists
8. {{{{DISTANCE_CALCULATION}}}} - Calculate distance to entity
9. {{{{NORMALIZE_ENTITY_POSITION}}}} - Normalize entity coordinates
10. {{{{VALIDATE_STATE_IMPLEMENTATION}}}} - Validate state matches config
11. {{{{RESET_IMPLEMENTATION}}}} - Reset game to initial state
12. {{{{STEP_VALIDATE_ACTION}}}} - Validate action input (action is an integer 0 to n-1)
13. {{{{STEP_CHECK_GAME_STATE}}}} - Check if game is playable
14. {{{{STEP_CHECK_DONE}}}} - Check if episode is done
15. {{{{GET_STATE_IMPLEMENTATION}}}} - Get full state observation
16. {{{{GET_INFO_IMPLEMENTATION}}}} - Get debug info
17. {{{{IS_RL_MODE_CHECK}}}} - Check if in RL mode

CRITICAL: Use the defensive patterns from snake-io. Never return null, always return consistent shapes.
</task>

<output_format>
Output the complete filled template wrapped in <code> tags:

<code filename="gym_api.js">
// Complete gym_api.js code here
</code>
</output_format>
"""
        
        system_prompt = (
            "You are an expert at implementing Gym APIs for browser games. "
            "You follow established patterns carefully and ensure consistent state shapes. "
            "You write defensive code that handles edge cases gracefully."
        )
        
        response = self.api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.5,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )
        
        # Extract response text
        if isinstance(response, dict):
            response_text = response.get("response", "")
        else:
            response_text = response
        
        # Extract gym_api.js code
        code_match = re.search(
            r'<code\s+filename=["\']gym_api\.js["\']\s*>(.*?)</code>',
            response_text,
            re.DOTALL | re.IGNORECASE
        )
        
        if not code_match:
            raise ValueError("Could not find <code filename=\"gym_api.js\"> tags in response")
        
        gym_api_code = code_match.group(1).strip()
        
        return {
            "gym_api_code": gym_api_code,
            "response": response_text,
        }
    
    def modify_game_for_rl(
        self,
        game_dir: str,
        files: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Phase 3: Modify game.js to add RL control hooks
        
        Returns dict with 'modified_game_js' key containing updated game.js
        """
        # Find game.js file
        game_js_content = files.get("game.js")
        if not game_js_content:
            # Try to find it
            for filename in files:
                if "game" in filename.lower() and filename.endswith(".js"):
                    game_js_content = files[filename]
                    break
        
        if not game_js_content:
            raise FileNotFoundError("Could not find game.js file")
        
        user_prompt = f"""
You are modifying a game.js file to support RL control mode WITHOUT breaking existing functionality.

<current_game_js>
{game_js_content}
</current_game_js>

<task>
Add RL control mode support by:

1. Check if window.gymAPI exists and isRLMode() returns true
2. If in RL mode, read actions from window.gymAPI.getRLAction()
3. Apply these actions instead of (or in addition to) human keyboard input
4. DO NOT modify existing human control code - add RL as an alternative input source
5. Preserve all existing game functionality

CRITICAL RULES:
- DO NOT remove or break existing keyboard controls
- DO NOT change game logic or physics
- ONLY add conditional checks for RL mode
- The game must still work perfectly for human players
- Use defensive checks (if (window.gymAPI && window.gymAPI.isRLMode()))

Example pattern:
```javascript
// In handlePlayerInput or similar function:
function handlePlayerInput() {{
  let left = false, right = false, boost = false;
  
  // RL mode takes precedence
  if (window.gymAPI && window.gymAPI.isRLMode()) {{
    const action = window.gymAPI.getRLAction();
    left = action.left;
    right = action.right;
    boost = action.boost;
  }} else {{
    // Original keyboard controls
    left = keyIsDown(LEFT_ARROW) || keyIsDown(65);
    right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);
    boost = keyIsDown(UP_ARROW) || keyIsDown(32);
  }}
  
  // Apply actions (existing code)
  if (left) player.turnLeft();
  if (right) player.turnRight();
  ...
}}
```
</task>

<output_format>
Output the complete modified game.js wrapped in <code> tags:

<code filename="game.js">
// Complete modified game.js code here
</code>
</output_format>
"""
        
        system_prompt = (
            "You are an expert at modifying game code to add RL support. "
            "You make minimal, surgical changes that preserve all existing functionality. "
            "You never break working code."
        )
        
        response = self.api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Low temperature to minimize risky changes
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )
        
        # Extract response text
        if isinstance(response, dict):
            response_text = response.get("response", "")
        else:
            response_text = response
        
        # Extract modified game.js
        code_match = re.search(
            r'<code\s+filename=["\']game\.js["\']\s*>(.*?)</code>',
            response_text,
            re.DOTALL | re.IGNORECASE
        )
        
        if not code_match:
            raise ValueError("Could not find <code filename=\"game.js\"> tags in response")
        
        modified_game_js = code_match.group(1).strip()
        
        return {
            "modified_game_js": modified_game_js,
            "response": response_text,
        }

    def iterate(
        self,
        game_dir: str,
        *,
        observation_type: str = "state",
        debug_prompts: bool = False,
        update_html: bool = True,
        modify_game_js: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate gym_api.js for a game using 3-phase approach.
        
        Phase 1: Analyze game and create gym_config.json
        Phase 2: Fill gym_api_template.js with game-specific code
        Phase 3: Modify game.js to add RL control hooks

        Args:
            game_dir: Path to game directory containing index.html and .js files
            observation_type: "state" for structured observations, "pixels" for screenshots
            debug_prompts: If True, save prompts to evaluation/prompts/
            update_html: If True, automatically add gym_api.js to index.html
            modify_game_js: If True, modify game.js to add RL hooks

        Returns:
            Dictionary with:
                - config: Generated gym_config.json
                - gym_api_code: The generated gym_api.js code
                - modified_game_js: Modified game.js (if modify_game_js=True)
                - files_created: List of files created
        """
        game_path = Path(game_dir)
        if not game_path.exists():
            raise FileNotFoundError(f"Game directory not found: {game_dir}")

        if not (game_path / "index.html").exists():
            raise FileNotFoundError(f"index.html not found in {game_dir}")

        # Read current game files
        files = _read_game_files(game_dir)

        print(f"📋 Phase 1: Analyzing game and generating config...")
        
        # Phase 1: Generate config
        config_result = self.generate_config(game_dir, files, observation_type)
        config = config_result["config"]
        config_json = config_result["config_json"]
        
        print(f"✓ Config generated: {config['observation_space']['shape'][0]} observations, {config['action_space']['n']} actions")
        
        # Save config
        _write_file(game_dir, "gym_config.json", config_json)
        files_created = ["gym_config.json"]
        
        if self.use_template:
            print(f"\n📋 Phase 2: Filling template with game-specific code...")
            
            # Phase 2: Generate API from template
            api_result = self.generate_api_from_template(game_dir, files, config)
            gym_api_code = api_result["gym_api_code"]
            
            print(f"✓ gym_api.js generated from template")
        else:
            # Fallback to old approach (for backwards compatibility)
            print(f"\n📋 Generating gym_api.js (legacy mode)...")
            gym_api_code = self._generate_gym_api_legacy(files, observation_type)
            print(f"✓ gym_api.js generated")
        
        # Save gym_api.js
        _write_file(game_dir, "gym_api.js", gym_api_code)
        files_created.append("gym_api.js")
        
        modified_game_js = None
        if modify_game_js:
            print(f"\n📋 Phase 3: Adding RL hooks to game.js...")
            
            try:
                # Phase 3: Modify game.js
                game_result = self.modify_game_for_rl(game_dir, files)
                modified_game_js = game_result["modified_game_js"]
                
                # Save modified game.js
                _write_file(game_dir, "game.js", modified_game_js)
                files_created.append("game.js (modified)")
                
                print(f"✓ game.js modified with RL control hooks")
            except Exception as e:
                print(f"⚠️  Warning: Could not modify game.js: {e}")
                print(f"   Game may require manual RL integration")
        
        # Update index.html to include gym_api.js
        if update_html:
            html_path = game_path / "index.html"
            html_content = html_path.read_text(encoding="utf-8")

            # Check if gym_api.js is already included
            if "gym_api.js" not in html_content:
                # Add before the closing </body> tag
                if "</body>" in html_content:
                    gym_api_script = '    <script type="module" src="gym_api.js"></script>'
                    html_content = html_content.replace("</body>", f"{gym_api_script}\n  </body>")
                    _write_file(game_dir, "index.html", html_content)
                    files_created.append("index.html (updated)")
        
        return {
            "config": config,
            "config_json": config_json,
            "gym_api_code": gym_api_code,
            "modified_game_js": modified_game_js,
            "files_created": files_created,
            "observation_type": observation_type,
        }
    
    def _generate_gym_api_legacy(self, files: Dict[str, str], observation_type: str) -> str:
        """Legacy method for generating gym_api.js without template (backwards compatibility)."""
        # Build prompt using old method
        user_prompt = self._build_user_prompt(files, observation_type=observation_type)

        system_prompt = (
            "You are an expert RL engineer creating Gym APIs for browser-based games. "
            "You understand game mechanics, state representations, reward shaping, and JavaScript/p5.js. "
            "Your APIs are clean, efficient, and enable effective RL training. "
            "Always:\n"
            "1. Analyze the game structure carefully\n"
            "2. Design informative state representations\n"
            "3. Create well-shaped reward functions\n"
            "4. Implement robust reset and step functions\n"
            "5. Preserve existing game functionality"
        )

        # Call LLM
        response = self.api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=self.temperature,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )

        # Handle dict response (when thinking=True) or string response
        if isinstance(response, dict):
            response_text = response.get("response", "")
        else:
            response_text = response

        # Extract gym_api.js
        code_match = re.search(
            r'<code\s+filename=["\']gym_api\.js["\']\s*>(.*?)</code>',
            response_text,
            re.DOTALL | re.IGNORECASE
        )
        
        if code_match:
            return code_match.group(1).strip()
        else:
            raise ValueError("Could not extract gym_api.js from LLM response")


def generate_gym_api(
    game_dir: str,
    *,
    observation_type: str = "state",
    model: str = "anthropic:claude-4.5-sonnet",
    debug_prompts: bool = False,
) -> Dict[str, Any]:
    """
    Convenience function to generate gym_api.js for a game.

    Args:
        game_dir: Path to game directory
        observation_type: "state" or "pixels"
        model: Model name to use
        debug_prompts: Whether to save prompts

    Returns:
        Result dictionary from iterate()
    """
    iterator = GymAPIIterator(model=model)
    return iterator.iterate(
        game_dir,
        observation_type=observation_type,
        debug_prompts=debug_prompts,
        update_html=True,
    )
