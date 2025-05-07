from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class SimplePromptEXPGenerator(GameGenerator):
    """
    Simple prompt game generator that uses a single LLM call with concatenated system prompts
    to generate both the game design and code implementation.
    """

    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """
        prompt = f"""
You are a creative professional JavaScript game developer with expertise in implementing 2D video games with consistent gameplay and aesthetic design using p5.js. 

TASK: You will be given a game concept for a 2D video game from a video game enthusiast. You will implement an interesting and fun 2D video game that is consistent with the game concept.
The game concept will be a few sentences defining some elements of the game leaving room for your creativity and expertise in making the game more interesting. You should enrich the game adding elements and mechanics beyond the game concept with your creativity and expertise as a game designer. Along with the code, you will also write an AI testing code to test different aspects of the game.
You are encouraged to write as much code as you can to make the game more interesting and aesthetically pleasing. Your code must be error-free, fully functional, and allow the player to make progress towards the final goal in a beautifully designed game. 

Game Concept: {game_concept}

"""
        
        if self.use_ecs:
            instructions = self.get_ecs_instructions()
        else:
            instructions = self.get_non_ecs_instructions()
        
        prompt = prompt + instructions
        return prompt

    def generate_game(self, game_concept: str, concept_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a game from the given concept using the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            concept_path: Optional path to the original concept file
            
        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        try:
            # Generate user prompt
            user_prompt = self.generate_user_prompt(game_concept)
            
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                verbose=self.verbose,
            )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": ""},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            game_plan =  self.extract_game_plan(response)
            html_code = self.extract_code_block(response, "html") or ""
            
            # Get JavaScript files
            js_code_dict = self.extract_code_block(response, "javascript")
            js_files = []
            for filename, code in js_code_dict.items():
                js_files.append((filename, code))
            
            # Parse genre from concept file if available
            genre = None
            if concept_path:
                try:
                    with open(concept_path, 'r') as f:
                        concept_data = json.load(f)
                        genre = concept_data.get('genre', None)
                except Exception as e:
                    if self.verbose:
                        print(f"Failed to load genre from concept file: {e}")
            
            # Save the game files
            game_dir = self.save_games(
                title=title,
                html_code=html_code,
                js_files=js_files,
                game_description=game_description,
                game_controls=game_controls,
                game_concept=game_concept,
                game_plan=game_plan,
                concept_path=concept_path,
                genre=genre,
                intermediate_outputs={"full_response": response},
                conversation_log=conversation_log,
                use_ecs=self.use_ecs,
            )
            
            if self.verbose:
                print(f"Game generated successfully at: {game_dir}")
            
            return {
                "title": title,
                "html_code": html_code,
                "js_files": js_files,
                "game_description": game_description,
                "game_controls": game_controls,
                "game_dir": game_dir,
                "game_plan": game_plan,
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise 

    def get_ecs_instructions(self) -> str:
        """
        Get the instructions for the ECS architecture
        """
        instructions = """
# GAME GENERATION INSTRUCTIONS
## HARD CONSTRAINTS (CRITICAL)
- **Game Design** must comply with the user's game concept. Add more details to the game design to make it more interesting while balancing the game mechanics which can be implemented in the game.
- **Game Mechanics & Controls** must be implemented using keyboard keys only. NO MOUSE based controls. Use logic and physics which allows the player to make progress towards the final goal with interesting subgoals and challenges.
- **Physics** must be plausible and consistent to carry out the game mechanics. Do not have objects pass through each other or any other inconsistencies.
- **Graphics & Animations** must be implemented using p5.js primitives. NO external images, sprites, or fonts. No audio or sound effects.
- **AI Testing**: Implement AI control modes for testing different aspects of the game with the knowledge of the game code.

## GAME MECHANICS & CONTROLS (CRITICAL)
- **Canvas Setup**: 600×400px canvas, 60 FPS
- **Controls & Key Mapping**: Only keyboard keys as inputs. NO MOUSE based controls. Allowed keys: 
  - Arrow keys (37, 38, 39, 40)
  - SPACE (32), Z (90)
  - SHIFT (16)
  - ENTER (13): Start game (from START screen)
  - R (82): Restart game (from GAME_OVER screens)
  - ESC (27): Pause/Unpause game
- **Game Phases**:
  - START → PLAYING: ENTER, PLAYING → GAME_OVER: win/lose, GAME_OVER → START: R, PLAYING ↔ PAUSED: ESC

## CODE ARCHITECTURE REQUIREMENTS
Use Entity-Component-System (ECS) architecture with ES6 modules:
- **Single Source of Truth**: Store all entities in ONE global array
- **Components**: Pure data structures
- **Systems**: Logic that operates on entities with specific components
- **Proper Imports**: Every file MUST import ALL variables, functions, and classes it uses
  ```javascript
  // Essential pattern (ALWAYS follow this)
  import { PositionComponent, VelocityComponent } from './components.js';
  import { entities, gameState } from './globals.js';
  import { get_ai_action } from './ai_controller.js';

  // Verify EVERY function has access to ALL components it needs
  function createEntity(x, y) {
    const entity = {
      components: {
        position: new PositionComponent(x, y) // Must import PositionComponent!
      }
    };
    entities.push(entity);
    return entity;
  }
  ```
- **State Management**: Use a single `gameState` object to track the game's current data and status. Implement `function getGameState()`; attach it to `window`. It **must** return the `gameState` object.
  ```javascript
  export const entities = []; // canonical array including player
  export const gameState = {
    player: null,
    score: 0,
    entities, // alias to canonical array
    gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN/LOSE", "PAUSED"
    controlMode: "HUMAN", // "HUMAN", "AI_WIN", "AI_TEST_A", "AI_TEST_B", etc.
  };
  ```

## P5.JS IMPLEMENTATION DETAILS
- Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Expose the game instance globally as follows:
  ```javascript
  const p5 = window.p5
  let gameInstance = new p5(p => {
      ...
  });
  // Expose the game instance globally
  window.gameInstance = gameInstance;
  ```
- **Useful Functions**:
  - p5: `keyIsDown(key_code)`, `noLoop()/loop()`, `tint()`, `push()/pop()`, `textAlign()`, `textSize()`, `text()`
  - p5.collide2d for collision detection
    - Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
    - Available functions: `collidePointPoint`, `collidePointCircle`, `collidePointEllipse`, `collidePointRect`, `collidePointLine`, `collidePointArc`, `collideRectRect`, `collideCircleCircle`, `collideRectCircle`, `collideLineLine`, `collideLineCircle`, `collideLineRect`, `collidePointPoly`, `collideCirclePoly`, `collideRectPoly`, `collideLinePoly`, `collidePolyPoly`, `collidePointTriangle`.
- **Rendering**:
  - Implement smooth and polished animations with beautiful design to express the game environment, objects, and their interactions.
  - Do not draw elements that are randomly sampled at every frame as this causes flickering
  - Ensure that all objects are rendered in the correct order and there is no random disappearance of objects
  - Use ternary operator to set colors for conditional rendering: Example: `p.fill(...(CONDITION ? [255, 220, 150] : [40, 30, 20]));`
  - **Control Mode Display**: Never render or display the current controlMode (HUMAN/AI) on the game canvas. This should only be visible through the UI buttons.
- **Required Game Screens**:
  - **Start**: Game title, instructions, "PRESS ENTER TO START" prompt
  - **Playing**: Game environment, score HUD, and active gameplay
  - **Pause**: Minimal "PAUSED" indicator in top right when ESC pressed, resume with ESC
  - **Game Over**: Win/lose message, final score, "PRESS R TO RESTART" prompt

## AI TESTING IMPLEMENTATION
Given you are an expert game developer who is developing this game, implement AI control modes for testing different aspects of the game. 
- **AI Behavior Design**:
  - **AI to explore and win the game [AI_WIN]**: Implement a function that plays the game like a professional player to **win the game** using the game code you have implemented.
  - **Other AI Modes [Maximum 4]**: Design specific AI modes to test different game aspects
  - Choose actions based on the current `gameState` and other game data guided by AI specific goals and the game code.
- **AI Controller Structure**: The function `get_ai_action(gameState)` must be implemented to **output an action** based on the current `gameState` and the game code.
  ```javascript
  export function get_ai_action(gameState) {{
    // Different strategies based on AI mode
    switch(gameState.controlMode) {
      case "AI_WIN":
        return getWinningAIAction(gameState); // AI to win the game
        // TODO: Add more cases with appropriate names and functions
      default:
        return getRandomAction(gameState); // Random action
    }
  }
  ```
- **AI Mode Buttons**: 
  - Add mode selection buttons to HTML UI that switch between human and AI control
  - Button clicks should:
    - Set gameState.controlMode to selected mode
    - Update button active states
    - Enable AI control via get_ai_action() when in AI modes
  - Button IDs must follow pattern: `id="${mode.toLowerCase()}ModeBtn"` (e.g. "ai_winModeBtn", "humanModeBtn")

## PRE-SUBMISSION CHECKLIST (CRITICAL)
- Game implementation:
  - **Game Phase Verification**: 
    - Ensure game loads on web page with no errors
    - Game starts with ENTER
    - Game transitions between phases (START, PLAYING, GAME_OVER, PAUSED) correctly
  - **Game Mechanics**: 
    - Does the game implement the game mechanics, game phases, and controls properly?
    - Does the game have a proper win/lose condition?
  - **Rendering**: Does the game render correctly in the canvas with beautiful design and smooth animations with no flickering?
- AI Testing:
  - **AI Mode Selection**: Do all AI mode selection and their functions work correctly to appropriately test different aspects?
  - **AI Mode Behavior**: Does each AI mode demonstrate distinct and purposeful behavior? 
  - **AI Mode Buttons**: Are AI mode buttons properly labeled and functioning to change the control mode?
  - **AI Mode Progress**: Do the AI modes avoid getting stuck in repeated patterns and continue to make progress?

## HTML REFERENCE TEMPLATE
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { height: 100%; overflow: hidden; background: #222; }
      body { display: flex; flex-direction: column; justify-content: center; align-items: center; }
      canvas { border: 1px solid #333; width: 600px !important; height: 400px !important; }
      .control-buttons { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; justify-content: center; }
      .control-button { padding: 8px 16px; cursor: pointer; background: #444; color: #fff; border: none; border-radius: 4px; }
      .control-button.active { background: #007bff; } /* active button for current control mode */
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 id="gameTitle" style="color: #fff; font-family: Arial, sans-serif; margin-bottom: 10px;">{game_title}</h1>
      <div class="control-buttons">
        <button id="humanModeBtn" class="control-button active" onclick="window.setControlMode('HUMAN')">Human Mode</button>
        <button id="ai_winModeBtn" class="control-button" onclick="window.setControlMode('AI_WIN')">AI (Win)</button>
        <!-- Add more AI mode buttons with correct ID convention -->
      </div>
      <p id="gameDescription" style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;">{game_description}</p>
      <p id="gameControls" style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;">{game_controls}</p>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js"></script>
    <script type="module" src="game.js"></script>
  </body>
</html>
```

## OUTPUT INSTRUCTIONS
Output the game files in this format with NO OTHER TEXT to output a playable and interesting game:

<game_description>
... (game description in maximum 5 sentences)
</game_description>

<game_controls>
... (game controls in maximum 5 sentences)
</game_controls>

<game_plan>
... (code plan in maximum 5 sentences)
</game_plan>

For the javascript files:
<code filename="{name}.{extension}">
... (code)
</code>

For the html file:
<code filename="index.html">
... (html code)
</code>
"""
        return instructions

    def get_non_ecs_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = """
# INSTRUCTIONS
## HARD CONSTRAINTS (CRITICAL)
- **Game Design** must comply with the user's game concept. Add more details to the game design to make it more interesting while balancing the game mechanics which can be implemented in the game.
- **Game Mechanics & Controls** must be implemented using keyboard keys only. NO MOUSE based controls. Use logic and physics which allows the player to make progress towards the final goal with interesting subgoals and challenges.
- **Physics** must be plausible and consistent to carry out the game mechanics. Do not have objects pass through each other or any other inconsistencies.
- **Graphics & Animations** must be implemented using p5.js primitives. NO external images, sprites, or fonts. No audio or sound effects.
- **AI Testing**: Implement AI control modes for testing different aspects of the game with the knowledge of the game code.

## GAME MECHANICS & CONTROLS (CRITICAL)
- **Canvas Setup**: 600×400px canvas, 60 FPS
- **Controls & Key Mapping**: Only keyboard keys as inputs. NO MOUSE based controls. Allowed keys: 
  - Arrow keys (37, 38, 39, 40)
  - SPACE (32), Z (90)
  - SHIFT (16)
  - ENTER (13): Start game (from START screen)
  - R (82): Restart game (from GAME_OVER screens)
  - ESC (27): Pause/Unpause game
- **Game Phases**:
  - START → PLAYING: ENTER, PLAYING → GAME_OVER: win/lose, GAME_OVER → START: R, PLAYING ↔ PAUSED: ESC

## CODE ARCHITECTURE REQUIREMENTS
Use object-oriented programming with ES6 modules:
- **Game Objects**: Create classes for game objects (Player, Enemy, Item, etc.) with their properties and methods
- **Game State**: Use a single `gameState` object to track the game's current data and status
- **Proper Imports**: Every file MUST import ALL variables, functions, and classes it uses
  ```javascript
  // Essential pattern (ALWAYS follow this)
  import { gameState } from './globals.js';

  ```
- **State Management**: Use a single `gameState` object to track the game's current data and status. Implement `function getGameState()`; attach it to `window`. It **must** return the `gameState` object.
  ```javascript
  export const gameState = {
    player: null,
    score: 0,
    gameObjects: [], // Array of all game objects
    gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN/LOSE", "PAUSED"
    controlMode: "HUMAN", // "HUMAN", "AI_WIN", "AI_TEST_A", "AI_TEST_B", etc.
  };
  ```

## P5.JS IMPLEMENTATION DETAILS
- Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Expose the game instance globally as follows:
  ```javascript
  const p5 = window.p5
  let gameInstance = new p5(p => {
      ...
  });
  // Expose the game instance globally
  window.gameInstance = gameInstance;
  ```
- **Useful Functions**:
  - p5: `keyIsDown(key_code)`, `noLoop()/loop()`, `tint()`, `push()/pop()`, `textAlign()`, `textSize()`, `text()`
  - p5.collide2d for collision detection
    - Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
    - Available functions: `collidePointPoint`, `collidePointCircle`, `collidePointEllipse`, `collidePointRect`, `collidePointLine`, `collidePointArc`, `collideRectRect`, `collideCircleCircle`, `collideRectCircle`, `collideLineLine`, `collideLineCircle`, `collideLineRect`, `collidePointPoly`, `collideCirclePoly`, `collideRectPoly`, `collideLinePoly`, `collidePolyPoly`, `collidePointTriangle`.    
- **Rendering**:
  - Implement smooth and polished animations with beautiful design to express the game environment, objects, and their interactions.
  - Do not draw elements that are randomly sampled at every frame as this causes flickering
  - Ensure that all objects are rendered in the correct order and there is no random disappearance of objects
  - Use ternary operator to set colors for conditional rendering: Example: `p.fill(...(CONDITION ? [255, 220, 150] : [40, 30, 20]));`
  - **Control Mode Display**: Never render or display the current controlMode (HUMAN/AI) on the game canvas. This should only be visible through the UI buttons.
- **Required Game Screens**:
  - **Start**: Game title, instructions, "PRESS ENTER TO START" prompt
  - **Playing**: Game environment, score HUD, and active gameplay
  - **Pause**: Minimal "PAUSED" indicator in top right when ESC pressed, resume with ESC
  - **Game Over**: Win/lose message, final score, "PRESS R TO RESTART" prompt

## AI TESTING IMPLEMENTATION
Given you are an expert game developer who is developing this game, implement AI control modes for testing different aspects of the game. 
- **AI Behavior Design**:
  - **AI to explore and win the game [AI_WIN]**: Implement a function that plays the game like a professional player to **win the game** using the game code you have implemented.
  - **Other AI Modes [Maximum 4]**: Design specific AI modes to test different game aspects
  - Choose actions based on the current `gameState` and other game data guided by AI specific goals and the game code.
- **AI Controller Structure**: The function `get_ai_action(gameState)` must be implemented to **output an action** based on the current `gameState` and the game code.
  ```javascript
  export function get_ai_action(gameState) {{
    // Different strategies based on AI mode
    switch(gameState.controlMode) {
      case "AI_WIN":
        return getWinningAIAction(gameState); // AI to win the game
        // Add more cases with appropriate names and functions
      default:
        return getRandomAction(gameState); // Random action
    }
  }
  ```
- **AI Mode Buttons**: 
  - Add mode selection buttons to HTML UI that switch between human and AI control
  - Button clicks should:
    - Set gameState.controlMode to selected mode
    - Update button active states
    - Enable AI control via get_ai_action() when in AI modes
  - Button IDs must follow pattern: `id="${mode.toLowerCase()}ModeBtn"` (e.g. "ai_winModeBtn", "humanModeBtn")

## PRE-SUBMISSION CHECKLIST (CRITICAL)
- Game implementation:
  - **Game Phase Verification**: 
    - Ensure game loads on web page with no errors
    - Game starts with ENTER
    - Game transitions between phases (START, PLAYING, GAME_OVER, PAUSED) correctly
  - **Game Mechanics**: 
    - Does the game implement the game mechanics, game phases, and controls properly?
    - Does the game have a proper win/lose condition?
  - **Rendering**: Does the game render correctly in the canvas with beautiful design and smooth animations with no flickering?
- AI Testing:
  - **AI Mode Selection**: Do all AI mode selection and their functions work correctly to appropriately test different aspects?
  - **AI Mode Behavior**: Does each AI mode demonstrate distinct and purposeful behavior? 
  - **AI Mode Buttons**: Are AI mode buttons properly labeled and functioning to change the control mode?
  - **AI Mode Progress**: Do the AI modes avoid getting stuck in repeated patterns and continue to make progress?

## HTML REFERENCE TEMPLATE
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { height: 100%; overflow: hidden; background: #222; }
      body { display: flex; flex-direction: column; justify-content: center; align-items: center; }
      canvas { border: 1px solid #333; width: 600px !important; height: 400px !important; }
      .control-buttons { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; justify-content: center; }
      .control-button { padding: 8px 16px; cursor: pointer; background: #444; color: #fff; border: none; border-radius: 4px; }
      .control-button.active { background: #007bff; } /* active button for current control mode */
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-bottom: 20px;">
      <div class="control-buttons">
        <button id="humanModeBtn" class="control-button active" onclick="window.setControlMode('HUMAN')">Human Mode</button>
        <button id="ai_winModeBtn" class="control-button" onclick="window.setControlMode('AI_WIN')">AI (Win)</button>
        <!-- Add more AI mode buttons with correct ID convention -->
      </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js"></script>
    <script type="module" src="game.js"></script>
  </body>
</html>
```

## OUTPUT INSTRUCTIONS
Output the game files in this format with NO OTHER TEXT to output a playable and interesting game:

<game_description>
... (game description in maximum 5 sentences)
</game_description>

<game_controls>
... (game controls in maximum 5 sentences)
</game_controls>

<game_plan>
... (code plan in maximum 5 sentences)
</game_plan>

For the javascript files:
<code filename="{name}.{extension}">
... (code)
</code>

For the html file:
<code filename="index.html">
... (html code)
</code>
"""
        return instructions