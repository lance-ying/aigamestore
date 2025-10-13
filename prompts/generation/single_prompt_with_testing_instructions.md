{hard_constraints}


<instructions>
<process_game_concept_to_game_design>

Build upon the game concept with added entities, mechanics, and rewards with a well-planned progression and learning curve that enables the player to learn about the game elements and mechanics which eventually allows the player.

Come up with the game design with your additions beyond the game concept that is feasible to implement in code following the hard constraints. You can add the following elements to the game design as long as the final game satisfies the requirements of the game concept:
- environment:
    - setting: the setting of the game (such as forest, space, underwater, etc.)
    - genre: a game can belong to one or more genres (such as a arcade, shooter, endless-runner, platformer, etc.) No puzzle games, board-games, turn-based games, or other non-2D games.
    - viewpoint: the perspective from which the game is viewed on screen (can be one of the following: top-down, side-scrolling, vertical-scrolling, )
- entities:
    - characters: Use well-described nouns for the player character and NPCs which are easy to render and have behaviors implementable by the game developer using p5.js primitives.
        - player: the character controlled by the player (such as Mario, Pacman, snake, paddle, etc.). 
        - NPCs: the non-player characters in the game (such as Turtle, Goomba, Ghost, etc.).
    - objects in the game:
        - collectible objects: items that can be picked up by the player to impact the score (such as coins, food, etc.)
        - interactive objects: objects that respond to player actions (such as platforms, switches, levers, movable blocks, portals)
        - power-ups: items that give temporary or permanent abilities (such as mushrooms, speed boost, etc.)
        - destructible objects: objects that can be broken or destroyed (such as bricks, plants, blocks, etc.)
        - obstacles: objects that impede player progress (such as spikes, lava pits, moving platforms, laser beams, etc.)
- mechanics:
    - player abilities:
        - what the player character or other entities can do (such as move, jump, dash, shoot, kill, sword attack, climb, bounce, etc.)
        - Some abilities can be unlocked after a certain condition (such as collecting a certain object or defeating one of the enemies)
    - object interactions: what happens when the player interacts with another entity or object (Mario loses a life when hit by an enemy, Pacman eats dots to score points and dies when touching a ghost, etc.)
    - rewards: what the player gets when they achieve a certain subgoal (such as points, lives, etc.)
    - subgoals: the smaller goals in the game which when achieved contribute to the final goal or are just interesting side-quests on the journey to the final goal (such as collecting coins and mushrooms in Mario, collecting all the stars in Pacman, etc.)
    - final goal: the main goal of the game which when achieved ends the game (such as rescuing a princess in Mario, collecting all the coins without getting caught by the ghosts in Pacman, etc.)
- graphics:
    - visual appearance: the visual appearance of the game environment and game entities defined by adjectives (such as neon-lit platforms, bioluminescent creatures, etc.). Keep the visual appearance that can be implemented using p5.js primitives.
    - animations: the animations of the game entities defined by adjectives (such as a walking turtle, a jumping frog, etc.). Keep the animations that can be implemented using p5.js primitives.
Include all the elements required by the game concept but feel free to add more elements to make a compelling game. You can add reasonable strategies that the player might use to make progress and win the game.
</process_game_concept_to_game_design>

<code_instructions>
You are encouraged to write as much code as you can to make the game interesting, aesthetically pleasing, and provide a fun gameplay experience for the player when playing the game for the first time.
<code_architecture>
- Modular code organization with proper ES6 imports:
  - Organize the code into multiple files as needed (game.js, globals.js, etc.)
  - Create clear separation between game elements, logic, and rendering
  - Group related functionality together in meaningful modules
  - Proper Imports:
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
</code_architecture>

<p5_instructions>
- Use p5.js in instance mode
- Store p5 instance in a variable called `gameInstance`. 
- Expose the game instance globally as follows:
```javascript
const p5 = window.p5
let gameInstance = new p5(p => {
  p.randomSeed(42); // ensures reproducibility.
  ...
});
// Expose the game instance globally
window.gameInstance = gameInstance;
```

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
  - Allowed keys: Arrow keys (37-40), SPACE (32), Z (90), SHIFT (16), ENTER (13), R (82), ESC (27)
  - Phase transitions: START→PLAYING (ENTER), PLAYING→GAME_OVER (win/lose), GAME_OVER→START (R), PLAYING↔PAUSED (ESC)
  - Input handling: Use keyboard for HUMAN mode, automated testing action outputs for automated testing modes
  - Player controls must be intuitive and mapped correctly to appropriate changes in game state
  - When automated testing mode is selected, the game must automatically play using the action outputs from the automated testing controller
- Non-player characters and objects:
  - NPCs and objects must be spawned and behave respecting the progression of the game
  - Implement intelligent, intuitive, and challenging behavior for all game entities to keep the player engaged
  - Ensure proper entity interactions and responsive behavior consistent with their roles and objectives to give player feedback responsive to their actions
  - Entity properties and behavior must be such that the player can make progress in the game
- Physical Interactions:
  - Base interactions on plausible physics with parameters and logic to give it a believable realistic feel
  - Prevent objects from passing through each other or behaving inconsistently to prevent shocking the player
- GAME_OVER Conditions:
  - Implement mechanics that can lead to win or lose conditions achievable by the player
  - GAME_OVER must be a final state followed by game over screen
- Rewards:
  - Define meaningful and reasonable conditions for rewards to keep the player motivated to reach the final goal
  - Do not excessively repeat the same reward - avoid boring
</game_mechanics_instructions>

<rendering_instructions>
- Canvas Setup: 600×400px canvas, 60 FPS
- Ensure the correct render order of the game objects to ensure player is visible on the screen
- Implement aesthetic objects, smooth animations, and dynamic effects for the game environment, entities, and their interactions
- Provide useful visual feedback:
  - Player character must be distinctly identifiable
  - Provide visual feedback for interactions and response to their actions
  - UI: Add well-positioned text and graphics to inform the player about information like score, health, etc.
  - Never display current controlMode (HUMAN/TESTING) on the game canvas.
- Avoid distractions and overburdening the player with too many entities on the screen
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
