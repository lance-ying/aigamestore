{hard_constraints}

<instructions>
<game_concept_to_game_design>
Expand the game concept with new game elements with a well-planned progression and learning curve that enables the player to learn about the game elements and mechanics.
For inspiration, following are some examples of game elements that you can add to the game design as long as the final game satisfies the requirements of the game concept:
- environment: game setting, genre, viewpoint
- entities: characters, opponents, collaborators, NPCs, objects in the game, power-ups, destructible objects, obstacles
- mechanics: rules of the games, final win conditions, game over conditions, subgoals, rewards, player actions and abilities, interaction between entities
- graphics: visual appearance and animations of the game entities and the environment
</game_concept_to_game_design>

<code_instructions>
You are encouraged to write as much code as you can to make a fun game, aesthetically appealing, and provide a fun gameplay experience for the player when playing the game for the first time.

<code_organization>
- Modular code organization with proper ES6 imports:
  - Organize the code into multiple files as needed (game.js, globals.js, etc.)
  - Group related functionality together in meaningful modules
  - Proper imports:
    - Use ES6 for imports and exports
    - Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of every file. No Node.js style require imports. No dynamic imports within functions
```javascript
// Essential pattern (ALWAYS follow this)
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

- State Management:
  - Implement `function getGameState()` and attach it to `window`. It must return the `gameState` object.
  - Use a single `gameState` object to track the game's current data and status. Store all game data in the `gameState` object to be used by automated testing code to play-test the game.    
```javascript
export const gameState = {
  player: null,       // player entity to be initialized in the setup function and initialized before the game starts
  entities: [],       // all game entities including player
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN/LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", etc.
  ... // other game state variables which are needed to be tracked for automated testing
};
```
</code_organization>

<p5_instructions>
- Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Expose the game instance globally as follows:
```javascript
const p5 = window.p5
let gameInstance = new p5(p => {
    // Initialize variables
    ...
    // Initialize the logs. Important: Do not reset the logs at any point in the code! logs are considered write-only!
    p.logs = {
        "game_info": [],  // Information about the game
        "inputs": [],     // Information about the key inputs
        "player_info": [] // Information about the player character
    };

    // Functions
    ...
});
// Expose the game instance globally
window.gameInstance = gameInstance;
```
- p.logs is write-only. Do not reset it. We want to keep track of all the logs since the start of the p5.js game instance.
- Variables to store in the p.logs during gameplay:
  - In "game_info": Information about the game when there are changes in the game phases
    - "data": Any data like game phase or anything else you want to log
    - "framecount" and "timestamp": The framecount and timestamp of the event accessed using `p.frameCount` and `Date.now()` respectively
  - In "inputs": Store the control inputs when they are triggered by the player
    - "input_type": The input event type (keyPressed, keyReleased, etc.)
    - "data": Additional data specific to the input type. Store `key` and `keyCode` if the input is a key.
    - "framecount" and "timestamp": The framecount and timestamp of the event
  - In "player_info": Information about the player character when there are changes in the player's state (accessed via `gameState.player` where `gameState` is accessible via `window.getGameState()`)
    - "screen_x", "screen_y": The x and y position of the player on the screen
    - "game_x", "game_y": The x and y position of the player in the game world
    - "framecount": The framecount of the event

- Useful Functions:
  - Use p. to call p5 functions.
  - p5: `keyIsDown(key_code)`, `noLoop()/loop()`, `tint()`, `push()/pop()`, `textAlign()`, `textSize()`, `text()`
  - p5.collide2d for collision detection
    - Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available but 'collideRectCircle' is available.
    - Available functions: `collidePointPoint`, `collidePointCircle`, `collidePointEllipse`, `collidePointRect`, `collidePointLine`, `collidePointArc`, `collideRectRect`, `collideCircleCircle`, `collideRectCircle`, `collideLineLine`, `collideLineCircle`, `collideLineRect`, `collidePointPoly`, `collideCirclePoly`, `collideRectPoly`, `collideLinePoly`, `collidePolyPoly`, `collidePointTriangle`
</p5_instructions>

<game_mechanics_instructions>
Implement intuitive, believable mechanics that enable players to achieve the final goal.
Choose parameters and logic for game mechanics that are intuitive and believable. These can change as the game progresses. 
Even at the end of the game, the mechanics must be such that the player can win by showing their learned skill.
- Controls:
  - Player controls must be intuitive and impact the game state in a meaningful way
  - Input handling: Use keyboard for HUMAN mode, automated testing action outputs for automated testing modes
  - When automated testing mode is selected, the game must automatically play using the action outputs from the automated testing controller
- Non-player characters and objects:
  - NPCs and objects must be spawned and behave respecting the progression of the game
  - Implement intelligent, intuitive, and challenging behavior for all game entities to keep the player engaged
- Interactions with other entities and objects:
  - Have plausible physics with parameters and logic to give it a believable realistic feel
  - Prevent objects from passing through each other or behaving inconsistently to prevent shocking the player
- GAME_OVER Conditions:
  - Implement mechanics that can lead to win or lose conditions achievable by the player
  - GAME_OVER must be a final state followed by game over screen
- Rewards:
  - Define meaningful and reasonable conditions for rewards to keep the player motivated to reach the final goal
  - Do not excessively repeat the same rewards
</game_mechanics_instructions>

<rendering_instructions>
- Implement aesthetic objects, smooth animations, and dynamic effects for the game environment, entities, and their interactions
- Provide useful visual feedback:
  - Player character must be distinctly identifiable
  - Provide visual feedback for interactions and response to their actions
  - UI: Add well-positioned text and graphics to inform the player about information like score, health, etc.
  - Never display current controlMode (HUMAN/TESTING) on the game canvas.
- Ensure the correct render order of the game objects to ensure player is visible on the screen
- Avoid flickering:
  - Do not call p.randomSeed() inside draw()
  - Have exactly one call to p.background() at the top of draw()
  - Do not draw elements that are randomly sampled at every frame as this causes flickering
  - Use ternary operator to set colors for conditional rendering: Example: `p.fill(...(CONDITION ? [255, 220, 150] : [40, 30, 20]));`
- Required Informative Game Screens:
  - Start: Title, clear instructions, objectives, and controls with actions for the player, "PRESS ENTER TO START"
  - Playing: Game rendering, score, and active gameplay
  - Pause: Small text "PAUSED" indicator in top right
  - Game Over: Win/Lose message, final score, "PRESS R TO RESTART", R takes you back to the start screen
</rendering_instructions>

<automated_testing_instructions>
- Implement automated game testing functions to validate and test the game functionality and playability:
  - TEST_1 - How to win the game? This function must implement one of the best possible strategies to win the game.
    - Implement optimal strategy to win the game. Take into account the game state, environment layout, and the game mechanics to choose actions.
    - Validate win condition is achieved (GAME_OVER_WIN)
  - Additional Test Modes (Maximum 5): 
    - Test movement mechanics (validate position changes)
    - Test entity interactions (validate inventory/score updates)
    - Add custom modes for game-specific features
- Automated Testing Implementation:
  - Analyze game state and knowledge of the game code to write function that outputs optimal actions
  - Track position history to prevent stalling
  - Return keyboard inputs to control player
- Automated Testing Structure:
  - Implement in automated_testing_controller.js
  - Expose globally as window.get_automated_testing_action
  - Takes gameState input, returns action
  - ENTER, R, ESC are not allowed to be used as inputs and are reserved for game state transitions by human controller
```javascript
// automated_testing_controller.js
function getTestWinAction(gameState) { /* ... // code to win the game */ }
function getRandomAction(gameState)   { /* ... // random actions */ }

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":  
      return getTestWinAction(gameState);
    // Add other automated test cases here
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;   // global hook
export default get_automated_testing_action;           // optional but convenient when used in other files
```
- UI Controls:
  - Add human/automated testing mode selection buttons
  - Button IDs: "test_1_ModeBtn", "test_2_ModeBtn", etc.
  - Update controlMode and button states on click
</automated_testing_instructions>
</code_instructions>
</instructions>
