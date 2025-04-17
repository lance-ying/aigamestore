from typing import Tuple, List, Dict, Any, Union
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import (
    CODE_GENERATION_SYSTEM_PROMPT,
    FORMAT_HTML_TEMPLATE,
    CANVAS_SIZE,
)


class CharacterDrivenP5JSGenerator:
    """Generate p5.js code for a game"""

    def __init__(
        self,
        model_name: str = "openai:gpt-4o",
        system_prompt: str = CODE_GENERATION_SYSTEM_PROMPT,
        verbose: bool = False,
    ):
        self.model_api = ModelAPI(model_name)
        self.system_prompt = system_prompt
        self.p5js_url = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"
        self.verbose = verbose
        # Add tracking for JS files
        self.js_files = {}  # Dictionary to store all JS files: {filename: content}

    def _create_user_prompt(self, game_concept: str) -> str:
        """Create the user prompt for code generation"""
        return f"""Create a complete p5.js game based on this concept:
{game_concept}
-------------------------------------
The game must use the Entity Component System (ECS) pattern conceptually in a SINGLE game.js file:

1. Architecture Requirements:
```architecture
- Follow Entity Component System (ECS) pattern principles
- Entities: Game objects (Player, Enemy, Obstacle, etc.) using xxxEntity naming
- Components: Data containers for entities using xxxComponent naming
- Systems: Logic that operates on components using xxxSystem naming
- DO NOT use or reference external ECS frameworks or create an ECS class
```

2. Code Structure and Organization:
```structure
- Create a SINGLE game.js file containing all code (no separate files)
- Organize the code in logical sections with clear comments:
  * Components section (define all xxxComponent classes first)
  * Entities section (define all xxxEntity classes that use components)
  * Systems section (define all xxxSystem classes that operate on entities)
  * Game initialization (setup function and global variables)
  * Game loop (draw function and main update logic)
```

3. Implementation Approach:
```implementation
- Each entity should directly contain its components as properties
- Systems should be standalone objects with update() methods
- Systems should process entities by iterating through them directly
- Store all entities in a single global array called 'entities'
- Store all systems in a single global array called 'systems'
```

4. Visual Style and Effects:
```visuals
- Theme: Create a cohesive visual style with a clear color palette
- Particles: Add particle systems for impacts, movement trails, explosions
- Animations: Smooth transitions, scaling, rotation effects
- Polish: Add screen shake, flash effects, and visual juice
- Atmosphere: Use gradients, patterns, or parallax backgrounds
```

5. Canvas and Layers:
```canvas
- Size: {CANVAS_SIZE['width']}x{CANVAS_SIZE['height']} pixels
- Background Layer: Dynamic, animated game world
- Entity Layer: Characters, objects, interactions
- Particle Layer: Effects and feedback
- UI Layer: Clean, responsive interface elements
```

6. Core Systems:
```systems
- RenderSystem: Draw all entities with render properties
- PhysicsSystem: Handle movement and collisions
- InputSystem: Process user input
- AISystem: Control non-player entities
- ParticleSystem: Manage particle effects
- GameStateSystem: Track game progression
```

7. Code Quality Requirements:
```quality
- Correctness: Code must be syntactically valid and error-free
- Structure: Follow ECS pattern concepts without requiring an ECS framework
- Naming: Use xxxEntity, xxxComponent, xxxSystem naming convention consistently
- Completeness: Include all required p5.js functions (setup, draw)
- Initialization: All entities and systems initialized in setup()
```

IMPORTANT: 
- Create a SINGLE game.js file with all code (no separate files)
- DO NOT reference ECS, Entity, Component, or System classes from external frameworks
- Define all components, entities, and systems within the game.js file
- Make sure setup() function initializes all game elements
- Make sure draw() function calls system updates in the correct order

Return ONLY the complete game.js file in this format:

```javascript:game.js
// Complete game implementation - Include ALL code in this single file

// === COMPONENTS ===
// Define all component classes first

// === ENTITIES ===
// Define all entity classes that use components

// === SYSTEMS ===
// Define all system classes that operate on entities

// === INITIALIZATION ===
// Global variables and setup function

// === GAME LOOP ===
// Draw function and main update logic

[Your complete game code here]
```
"""

    def _extract_code_block(
        self, text: str, language: str
    ) -> Union[str, Dict[str, str]]:
        """Extract code blocks from text"""
        if language == "javascript":
            # First try to find named JavaScript files
            js_files = {}
            pattern = rf"```javascript:([\w.]+)\s*(.*?)```"
            matches = re.finditer(pattern, text, re.DOTALL)

            for match in matches:
                filename = match.group(1)
                code = match.group(2).strip()
                # Remove filename if it appears at the start of the code
                if code.startswith(f":{filename}"):
                    code = code[len(filename) + 1 :].strip()
                js_files[filename] = code

            if js_files:
                return js_files

            # If no named files found, look for generic javascript block
            pattern = rf"```javascript\s*(.*?)```"
            match = re.search(pattern, text, re.DOTALL)
            if match:
                code = match.group(1).strip()
                # If code starts with ":game.js" or similar, remove it
                if code.startswith(":"):
                    code = code.split("\n", 1)[1].strip()
                return code

            return ""

        else:
            # For HTML, just extract the content
            pattern = rf"```{language}\s*(.*?)```"
            match = re.search(pattern, text, re.DOTALL)
            return match.group(1).strip() if match else ""

    def generate_code(
        self, design: Dict[str, Any]
    ) -> Tuple[str, List[Tuple[str, str]]]:
        try:
            if self.verbose:
                print(f"\n{BLUE}Starting code generation...{RESET}")

            mode = design.get("mode", "initial_generation")
            if mode == "character_feedback":
                return self._generate_character_improved_code(design)
            elif mode == "rendering":
                return self._generate_rendering_code(design)
            else:
                return self._generate_initial_code(design)

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in code generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
            raise

    def _generate_character_improved_code(
        self, design: Dict[str, Any]
    ) -> Tuple[str, List[Tuple[str, str]]]:
        """Generate improved code through character feedback rounds"""
        current_js = design["current_code"]
        game_design = design["game_design_text"]

        for round in range(1, 4):  # 3 rounds of improvements
            if self.verbose:
                print(f"\n{GREEN}Character Review Round {round}:{RESET}")

            # Get environment feedback
            env_feedback = self._get_environment_feedback(current_js, game_design)

            # Get character feedback
            char_feedback = self._get_character_feedback(current_js, game_design)

            # Apply improvements
            current_js = self._apply_character_improvements(
                current_js, env_feedback, char_feedback, game_design
            )

        return self._create_html_code(), [("game.js", current_js)]

    def _get_environment_feedback(self, current_js: str, game_design: str) -> str:
        prompt = f"""As the Environment System, review the current implementation:
{current_js}

Based on the original design:
{game_design}

Provide specific feedback on:
1. How well the environment components are implemented
2. Whether they maintain independence from character states
3. If the world feels appropriately dynamic
4. Suggestions for improving environment mechanics

Focus on concrete code improvements."""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=10000,
            verbose=self.verbose,
        )

    def _get_character_feedback(self, current_js: str, game_design: str) -> str:
        prompt = f"""As the implemented characters, review your code:
{current_js}

Based on your original design:
{game_design}

Provide specific feedback on:
1. How well your behaviors match your design
2. Whether your actions feel appropriate
3. If your interactions work as intended
4. Concrete code improvements needed"""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=10000,
            verbose=self.verbose,
        )

    def _get_character_specific_feedback(
        self, character_index: int, current_js: str, character_definitions: str
    ) -> str:
        """Get feedback from a specific character on their implementation"""
        # Extract this character's info
        char_info = ""
        match = re.search(
            rf"Character {character_index}:.*?(?=Character|\n\n|$)",
            character_definitions,
            re.DOTALL,
        )
        if match:
            char_info = match.group(0)

        prompt = f"""As Character {character_index}, review your role in the game:

{char_info}

Review the current implementation:
{current_js}

Provide specific feedback on:
1. How well your character is implemented
2. What features would make your character more interesting to play or interact with
3. What interactions with other characters or environment elements would enhance gameplay
4. Any bugs or issues in your character's implementation

Express your feedback in natural language as if you were the character. Focus on what would make the game more engaging from your perspective.
"""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=10000,
            verbose=self.verbose,
        )

    def apply_character_improvements(
        self,
        current_js: str,
        env_feedback: str,
        char_feedback: Dict[int, str],
        game_design: str,
    ) -> List[Tuple[str, str]]:
        """
        Apply character-specific improvements to the code.

        Args:
            current_js: The current game.js code
            env_feedback: Environment feedback
            char_feedback: Character feedback by index
            game_design: Original game design

        Returns:
            List containing a single tuple with improved game.js
        """
        char_feedback_text = "\n\n".join(
            [
                f"Character {idx} Feedback:\n{feedback}"
                for idx, feedback in char_feedback.items()
            ]
        )

        # Update our tracking dictionary with the current game.js
        self.js_files["game.js"] = current_js

        prompt = f"""Apply these improvement suggestions to the game.js code:

```javascript:game.js
{current_js}
```

Environment Feedback:
{env_feedback}

Character Feedback:
{char_feedback_text}

Original Design:
{game_design}

Update the code to:
1. Implement suggested improvements from all characters and the environment
2. Maintain the ECS pattern with xxxEntity, xxxComponent, and xxxSystem naming
3. Keep all code in a single game.js file with clear section organization
4. Keep character behaviors distinct and environment elements independent
5. Make sure all required p5.js functions (setup, draw) are present

CRITICAL: Ensure the code is syntactically correct and will run without errors.
- Check all variable declarations and references
- Verify all functions are properly defined and called
- Ensure the code is complete and self-contained in a single file
- Maintain clear sections for Components, Entities, Systems, and game logic

Return ONLY the improved game.js file in a ```javascript:game.js block.
"""

        response = self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=16000,
            verbose=self.verbose,
        )

        # Extract code from response
        js_code = self._extract_code_block(response, "javascript")

        # Update our tracking dictionary
        if isinstance(js_code, dict) and "game.js" in js_code:
            self.js_files["game.js"] = js_code["game.js"]
        elif isinstance(js_code, str):
            self.js_files["game.js"] = js_code

        # Add a code validation step
        self._validate_code_integrity()

        # Return the game.js file
        return [("game.js", self.js_files["game.js"])]

    def _validate_code_integrity(self):
        """
        Perform a final validation check using the LLM to ensure the JavaScript code is correct.
        """
        if self.verbose:
            print(f"\n{BLUE}Performing final code validation through LLM...{RESET}")

        if "game.js" not in self.js_files or not self.js_files["game.js"].strip():
            if self.verbose:
                print(f"{RED}Critical: game.js is missing or empty{RESET}")

            # Create a minimal functioning game.js
            self.js_files[
                "game.js"
            ] = """// Minimal p5.js game scaffold
function setup() {
  createCanvas(600, 400);
}

function draw() {
  background(220);
  text('Game is loading...', width/2, height/2);
}
"""

        # Get the game.js content
        game_js = self.js_files["game.js"]

        # Create a prompt that asks the LLM to validate and fix the code
        prompt = f"""Please validate this game.js file for a p5.js game. The code should follow Entity-Component-System principles.

```javascript:game.js
{game_js}
```

Check for the following issues:
1. Missing p5.js required functions (setup and draw)
2. References to undefined variables or functions
3. Syntax errors or bugs that would prevent the code from running
4. Incomplete event handling or initialization
5. Any other issues that would cause runtime errors

If you find any problems, fix them and return the corrected game.js file.
If the code is already correct, just say "Code is valid".

For any fixes, return the complete file in a ```javascript:game.js block.
"""

        response = self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=16000,
            verbose=self.verbose,
        )

        # Check if the response indicates the code is already valid
        if "code is valid" in response.lower():
            if self.verbose:
                print(f"{GREEN}LLM validated code as correct{RESET}")
            return

        # Otherwise, extract the fixed code
        fixed_code = self._extract_code_block(response, "javascript")

        if isinstance(fixed_code, dict) and "game.js" in fixed_code:
            if self.verbose:
                print(f"{GREEN}LLM provided code fixes for game.js{RESET}")
            self.js_files["game.js"] = fixed_code["game.js"]
        elif isinstance(fixed_code, str):
            if self.verbose:
                print(f"{GREEN}LLM provided code fixes for game.js{RESET}")
            self.js_files["game.js"] = fixed_code

        # One final check to ensure setup() and draw() are present
        game_js = self.js_files["game.js"]
        if "function setup" not in game_js or "function draw" not in game_js:
            if self.verbose:
                print(
                    f"{RED}Critical: game.js still missing setup/draw functions after validation{RESET}"
                )

            fix_prompt = f"""The game.js file is STILL missing the essential p5.js functions (setup and/or draw).
            
Here is the current game.js code:
```javascript
{game_js}
```

Please add proper setup() and draw() functions that will work with the existing code.
Return the COMPLETE fixed game.js file."""

            fixed_game = self.model_api.call(
                user_prompt=fix_prompt,
                system_prompt=self.system_prompt,
                max_tokens=10000,
                verbose=self.verbose,
            )
            fixed_js = self._extract_code_block(fixed_game, "javascript")

            if (
                isinstance(fixed_js, str)
                and "function setup" in fixed_js
                and "function draw" in fixed_js
            ):
                self.js_files["game.js"] = fixed_js
                if self.verbose:
                    print(
                        f"{GREEN}Successfully added missing setup/draw functions{RESET}"
                    )
            elif isinstance(fixed_js, dict) and "game.js" in fixed_js:
                self.js_files["game.js"] = fixed_js["game.js"]
                if self.verbose:
                    print(
                        f"{GREEN}Successfully added missing setup/draw functions{RESET}"
                    )

        if self.verbose:
            print(f"{GREEN}Code validation complete{RESET}")

    def _generate_rendering_code(
        self, design: Dict[str, Any]
    ) -> Tuple[str, List[Tuple[str, str]]]:
        """Generate final code with rendering"""
        prompt = f"""Add rendering code to this game implementation:

Game Design:
{design["game_design_text"]}

Current Code:
{design["improved_code"]}

Add rendering code that:
1. Creates smooth animations and visual effects
2. Shows clear feedback for all actions
3. Makes environment components visually distinct
4. Maintains the independence of components

Return the complete code in a ```javascript block."""

        response = self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            max_tokens=10000,
            verbose=self.verbose,
        )
        js_code = self._extract_code_block(response, "javascript")
        return self._create_html_code(), [("game.js", js_code)]

    def _generate_initial_code(
        self, design: Dict[str, Any]
    ) -> Tuple[str, List[Tuple[str, str]]]:
        """Generate initial game code from design"""
        # Extract game concept from design
        game_concept = design.get("game_design_text")
        if not game_concept:
            raise ValueError("Design must include 'game_design_text'")

        # Generate game code
        user_prompt = self._create_user_prompt(game_concept)
        response = self.model_api.call(
            user_prompt=user_prompt,
            system_prompt=self.system_prompt,
            verbose=self.verbose,
        )

        # Extract code blocks
        js_code = self._extract_code_block(response, "javascript")

        # Handle different response formats and ensure we have a single game.js
        if isinstance(js_code, dict):
            if "game.js" in js_code:
                # If we got a game.js file, use it
                game_js_content = js_code["game.js"]
            else:
                # Consolidate multiple files into a single game.js
                if self.verbose:
                    print(
                        f"{YELLOW}Consolidating multiple JS files into a single game.js{RESET}"
                    )

                game_js_content = "// Consolidated game.js file\n\n"

                # Organize files in a logical order
                sections = [
                    ("components", "// === COMPONENTS ===\n"),
                    ("entities", "// === ENTITIES ===\n"),
                    ("systems", "// === SYSTEMS ===\n"),
                    ("game", "// === GAME INITIALIZATION AND LOOP ===\n"),
                ]

                for section_key, section_header in sections:
                    game_js_content += "\n" + section_header + "\n"
                    # Add content from any files that match this section
                    for filename, content in js_code.items():
                        if section_key in filename.lower():
                            game_js_content += f"// From {filename}\n{content}\n\n"

                # Add any remaining files that weren't categorized
                for filename, content in js_code.items():
                    if not any(
                        section_key in filename.lower() for section_key, _ in sections
                    ):
                        game_js_content += f"// From {filename}\n{content}\n\n"

                # Ensure setup and draw functions are present
                if "function setup" not in game_js_content:
                    game_js_content += "\n// === MAIN FUNCTIONS ===\n"
                    game_js_content += """
function setup() {
  createCanvas(600, 400);
  // Initialize game elements
  entities = [];
  systems = [];
  
  // Add your initialization code here
}

function draw() {
  background(20);
  
  // Update all systems
  for (let system of systems) {
    system.update();
  }
}
"""
        elif isinstance(js_code, str):
            # If we got a single JS block, use it as game.js
            game_js_content = js_code
        else:
            # Create a minimal game.js
            game_js_content = """// Basic p5.js game with ECS pattern

// === COMPONENTS ===
class PositionComponent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class RenderComponent {
  constructor(color, size) {
    this.color = color;
    this.size = size;
  }
}

// === ENTITIES ===
class PlayerEntity {
  constructor(x, y) {
    this.position = new PositionComponent(x, y);
    this.render = new RenderComponent('blue', 20);
  }
}

// === SYSTEMS ===
class RenderSystem {
  update() {
    for (let entity of entities) {
      if (entity.position && entity.render) {
        fill(entity.render.color);
        ellipse(entity.position.x, entity.position.y, entity.render.size);
      }
    }
  }
}

// === INITIALIZATION ===
let entities = [];
let systems = [];

function setup() {
  createCanvas(600, 400);
  
  // Create player entity
  entities.push(new PlayerEntity(width/2, height/2));
  
  // Add systems
  systems.push(new RenderSystem());
}

// === GAME LOOP ===
function draw() {
  background(220);
  
  // Update all systems
  for (let system of systems) {
    system.update();
  }
}
"""

        # Store the game.js content and clear any other files
        self.js_files = {"game.js": game_js_content}

        # Create HTML code
        html_code = FORMAT_HTML_TEMPLATE.format(
            title=design.get("title", "Game"),
            p5js_url=self.p5js_url,
            js_includes='<script src="game.js"></script>',
        )

        if self.verbose:
            print(f"\n{BLUE}Generated JavaScript code:{RESET}")
            print(f"\n{YELLOW}game.js:{RESET}\n{self.js_files['game.js']}")
            print(f"\n{BLUE}Generated HTML code:{RESET}\n{html_code}")

        # Return HTML and the game.js file
        return html_code, [("game.js", game_js_content)]

    def _extract_title(self, text: str) -> str:
        """
        Extract game title from text

        Args:
            text: Text to search for title

        Returns:
            str: Extracted title or 'Game' if not found
        """
        if self.verbose:
            print(f"\n{BLUE}Extracting title{RESET}")

        patterns = [
            r"```game_title\s*(.*?)```",
            r"GAME TITLE:\s*(.*?)(?:\n|$)",
            r"title:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if self.verbose:
                    print(f"{GREEN}Found title: {title}{RESET}")
                return title

        if self.verbose:
            print(f"{YELLOW}No title found, using default{RESET}")
        return "Game"

    def _generate_title(self, game_concept: str) -> str:
        """Generate a title from the game concept if none is provided"""
        try:
            # Ask the model to generate a title
            prompt = f"Generate a short, catchy title (3-4 words max) for this game concept:\n{game_concept}"
            response = self.model_api.call(
                user_prompt=prompt,
                system_prompt=self.system_prompt,
                max_tokens=10000,
                verbose=self.verbose,
            )

            # Clean up the response
            title = response.strip().strip('"').strip("'")

            # Limit length and remove newlines
            title = " ".join(title.split()[:4])

            if self.verbose:
                print(f"{GREEN}Generated title: {title}{RESET}")

            return title
        except Exception as e:
            if self.verbose:
                print(f"{YELLOW}Error generating title, using default{RESET}")
            return "My P5.js Game"

    def _validate_js_code(self, js_files: Dict[str, str]) -> Dict[str, str]:
        """Validate JavaScript code files"""
        if self.verbose:
            print(f"\n{BLUE}Validating JavaScript code...{RESET}")

        try:
            validated_files = {}

            for filename, code in js_files.items():
                if self.verbose:
                    print(f"\n{BLUE}Validating {filename}:{RESET}")

                # Basic validation - ensure code is not empty
                if not code.strip():
                    if self.verbose:
                        print(f"{YELLOW}Empty code in {filename}, skipping{RESET}")
                    continue

                # Check for required functions in game.js only
                if filename == "game.js":
                    required_functions = ["setup", "draw"]
                    missing = [
                        func
                        for func in required_functions
                        if f"function {func}" not in code
                    ]

                    if missing and self.verbose:
                        print(
                            f"{YELLOW}Warning: Missing required functions in game.js: {', '.join(missing)}{RESET}"
                        )

                validated_files[filename] = code

            if self.verbose:
                print(f"{GREEN}JavaScript validation complete{RESET}")

            return validated_files

        except Exception as e:
            if self.verbose:
                print(f"{RED}Error in JavaScript validation: {str(e)}{RESET}")
            raise

    def _validate_html_code(self, code: str, title: str) -> str:
        """Validate and clean up HTML code"""
        if self.verbose:
            print(f"\n{BLUE}HTML validation:{RESET}")
            print(f"Input code length: {len(code)}")

        try:
            # If code doesn't match our template structure, use template
            if not ("<html" in code and "<canvas" in code):
                if self.verbose:
                    print(f"{YELLOW}Invalid HTML structure, using template{RESET}")

                # Create script tags for all JS files
                js_includes = "\n".join(
                    [
                        f'    <script src="{js_file}"></script>'
                        for js_file in ["game.js", "player.js", "enemies.js"]
                        if js_file in code
                    ]
                )

                # If no JS files found, include at least game.js
                if not js_includes:
                    js_includes = '    <script src="game.js"></script>'

                return FORMAT_HTML_TEMPLATE.format(
                    title=title, p5js_url=self.p5js_url, js_includes=js_includes
                )

            # Ensure canvas size is correct
            code = re.sub(
                r"createCanvas\(\d+,\s*\d+\)",
                f"createCanvas({CANVAS_SIZE['width']}, {CANVAS_SIZE['height']})",
                code,
            )

            # Ensure p5.js is included
            if self.p5js_url not in code:
                insert_point = code.find("</head>")
                if insert_point != -1:
                    code = (
                        code[:insert_point]
                        + f'\n<script src="{self.p5js_url}"></script>\n'
                        + code[insert_point:]
                    )

            # Ensure game.js is included
            if "game.js" not in code:
                insert_point = code.find("</body>")
                if insert_point != -1:
                    code = (
                        code[:insert_point]
                        + '\n<script src="game.js"></script>\n'
                        + code[insert_point:]
                    )

            if self.verbose:
                print(f"{GREEN}HTML validation complete{RESET}")

            return code

        except Exception as e:
            if self.verbose:
                print(f"{RED}Error in HTML validation: {str(e)}{RESET}")
                print("HTML code that caused error:")
                print(code)
            raise

    def _create_html_code(self, title: str = "Game") -> str:
        """Create HTML code from template with only game.js"""
        return FORMAT_HTML_TEMPLATE.format(
            title=title,
            p5js_url=self.p5js_url,
            js_includes='<script src="game.js"></script>',
        )

    def create_html_code(self, title: str = "Game") -> str:
        """Public method to create HTML code from template"""
        return self._create_html_code(title)
