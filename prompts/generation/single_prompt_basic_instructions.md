<hard_constraints>
- Plan the game design and code silently; do not display the plan
- Game must load and function without errors, start on pressing ENTER, and the gameplay must be responsive to player inputs, and restarts on pressing R
- Allowed libraries: p5.js, p5.collide2D
- Keyboard inputs only. No mouse control. Allowed keyboard keys:
  - Game controls: Arrow keys (37-40), SPACE (32), SHIFT (16), Z (90)
  - Game phase controls: ENTER (13) start the game, ESC (27) pause/unpause, R (82) to restart. Pressing R sets the gamePhase to "START" taking the player back to the start screen to play again with resetting the game state.
- Ensure game reproducibility using p.randomSeed(42) in the `setup` function
- No external images or fonts
- No audio or sound effects
- Write modular structured code with proper ES6 imports and exports resulting in an error-free game following the code architecture and state management instructions
- Maintain p.logs as write only (see p5_usage)
- Implement automated game testing functions to validate different aspects of the game (see automated_game_testing section)
</hard_constraints>

<game_design_process>
Before implementing the code for the game concept, plan the complete player-experience-centric game design in natural language. DO NOT output this game design plan.
- Core loop: Think about an engaging, learnable, and intuitive core gameplay loop of the game
- Entities: Define the entities including the player, characters, and interactive objects with their objectives, behaviors, and interactions with other entities
- Player abilities: Define the player actions and abilities and how they can be used to achieve the objectives
- Environment: Carefully choose the setting, viewpoint, and objects that have an intent and purpose in the game  
- Rules: simple small set of rules that can lead to emergent complexity
- Objectives:
  - Win condition: Explicit achievable goal for the player
  - Losing conditions: Choose the losing conditions that are fair and consistent
  - Rewards: Plan the rewards for all objectives
  - Subgoals: Add side goals if needed to motivate the player to achieve the final goal
- Progression: Plan a smooth progression ramp starting from easy to challenging yet achievable at the highest difficulty. Add interesting entities, mechanics, and challenges to keep the player engaged and motivated.
- Visual design: The visual appearance of the game environment and entities
</game_design_process>

<game_code_plan>
Based on the game design, think through the code implementation and organization structure for the game.
- Controls:
  - Intuitive keys-action mappings that are easy to understand and quickly learnable
  - Responsive input handling with minimal input-to-action latency
  - When automated testing mode is selected, the game must automatically play using the action outputs from the automated testing controller
- Game Objectives and Rewards:
  - Implement the simple rules that have scope for depth when the rules interact
  - Write functions to check if the player has achieved subgoals, win conditions, and losing conditions
- Progression
  - The initial phase giving rewards without immediate loss or difficult challenges, making it easy to progress. Then, make the game progressively challenging allowing the player to adapt and learn to win the game.
  - Conditions and logic must be achievable and fair. The player must always feel like they have agency but never mastery over the game.
  - Objectives and rewards should be achievable and varied to sustain motivation
- Gameplay Mechanics:
  - Simple mechanics resulting in interesting dynamics: Implement simple rules that have scope for depth when the rules interact
  - Use parameters and logic which can be intuitive and believable to avoid making the player bored or frustrated
  - Keep this in mind to help with the automated testing
- Physics:
  - Do not implement overcomplicated or unrealistic physics such as objects passing through each other, disappearance of objects, random interactions, etc.
  - Use only p5.collide2D; no manual collision math; avoid tunnelling artefacts
- Rendering:
  - canvas size: 600x400; target 60 fps
  - Professional look and feel using vivid colors, polished representation of game entities with action and interaction animations
  - Animations must be smooth, visually appealing, and representative of the game entities and their interactions
  - Avoid flickering and abrupt changes on the screen to avoid overburdening the player
  - Visual Feedback:
    - Player character must be distinctly identifiable and visible appropriately on the screen
    - Use animations and effects for interactions and responses to player actions
    - Add well-positioned polished graphics and text to inform the player about information like score, health, etc. 
    - Never display current controlMode (HUMAN/TESTING) on the game canvas
  - Game Phase Transitions Screens:
    - START: Title, clear instructions, objectives, and key-action control mappings for the player, "PRESS ENTER TO START"
    - PLAYING: Active gameplay
    - PAUSED: Small text "PAUSED" indicator on the top right of the screen
    - GAME_OVER_WIN/GAME_OVER_LOSE: Win/Lose message, final score, "PRESS R TO RESTART"
    - [OPTIONAL, only if needed by the game design] Levels: There can be transition screens between levels to inform the player about the level, its objectives, and current game information, as needed. ENTER key to start the level.
</game_code_plan>

<game_code_instructions>
Write as much code as needed to implement the game with no-errors resulting in a fun, aesthetically pleasing, and responsive gameplay experience.
<code_architecture>
- Organize the code into multiple files (and folders/files, if needed) with proper ES6 imports and exports
- Create clear separation between game elements, logic, and rendering
- Write helper functions and classes to reduce code duplication and reduce errors
- Group related functionality together in meaningful modules
- Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of files where they are used from correct files. Example:
```javascript
// Each file imports all used symbols at top; no require() or dynamic import.
import { Player, Enemy } from './entities.js';
import { checkCollision, applyPhysics } from './physics.js';
import { gameState, CANVAS_WIDTH } from './globals.js';

// Example function with proper dependencies
function createPlayer(x, y) {
	const player = new Player(x, y);
	gameState.player = player;
	gameState.entities.push(player);
	return player;
}
```
</code_architecture>

<state_management>
- `gameState` object: Holds all runtime data; Input to automated testing code to play-test the game
  - Initialize in setup() and update with latest information at every frame. Example structure:
  ```javascript
      export const gameState = {
      player: null,
      entities: [],
      score: 0,
      gamePhase: "START",
      controlMode: "HUMAN",
      ...
  };
  ```
  - Return the gameState object via window.getGameState(). Example:
  ```javascript
  export function getGameState() {
      return gameState;
  }
  // Expose globally
  window.getGameState = getGameState;
  ```
</state_management>

<p5_usage>
- Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Example:
```javascript
	const p5 = window.p5
let gameInstance = new p5(p => {
	// Initialize the logs. Important: Do not reset the logs at any point in the code! logs are considered write-only and never re-assigned!
	p.logs = {game_info:[], inputs:[], player_info:[]}

	...
});
// Expose globally
window.gameInstance = gameInstance;
```
- p.logs is write-only. Don't reset it. Keep track of all the logs since the start of the p5.js game instance. This information is logged for both HUMAN and TEST modes.
- Variables to store in the p.logs during gameplay:
  - In "game_info": Information about the game when there are changes in the gamePhase, controlMode, etc.
    - "game_status": The game phase status of the game accessible via `gameState.gamePhase` where `gameState` is accessible via `window.getGameState()`
    - "data": Additional data specific to the game state.
    - "framecount" and "timestamp"
  - In "inputs": Store the control inputs when they are triggered by the player.
    - "input_type"
    - "data"
    - "framecount" and "timestamp"
  - In "player_info": Information about the player character when there are changes in the player's state
    - "screen_x", "screen_y"
    - "game_x", "game_y"
    - "framecount" and "timestamp"
</p5_usage>

<automated_game_testing>
- Implement 2-7 automated testing functions. At minimum:
  - TEST_1: getStickyKeysAction(gameState)
  - TEST_2: getTestWinAction(gameState)
- Provide for each test: test description, strategy, expected outcome.
- Responsibilities when controlMode is not HUMAN:
  - Evaluator: presses ENTER to start selected test; restarts with R and ENTER when on GAME_OVER_*.
  - Test function: returns control key codes while PLAYING. Do not alter game phase.
- Structure:
  - Expose globally as window.game_testing_controller
  - Buttons with ids "test_{i}_ModeBtn" toggle controlMode and button state.
</automated_game_testing>


