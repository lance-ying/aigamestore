{hard_constraints}

<instructions>
<game_concept_instructions>
The proposed game concept should be novel, fun, and open-ended to allow for further expansion. Please consider the hard constraints for the game code when proposing the game concept. 
There are many game elements required to be defined to make a game. Creatively curate the game concept defining a few elements (1 to 2). Here are some examples of game elements for inspiration:
- environment: game setting, genre, viewpoint
- entities: characters, opponents, collaborators, NPCs, objects in the game, power-ups, destructible objects, obstacles
- mechanics: rules of the games, final win conditions, game over conditions, subgoals, rewards, player actions and abilities, interaction between entities
- graphics: visual appearance and animations of the game entities and the environment

Below are some example game concepts. Avoid naming the game in the game concept and do not repeat any of these ideas.
<example_concepts>
- "I want to play a game driving a car on the wrong side of the road."
- "It would be interesting to play as a monkey leaping through a forest. The monkey has to collect bananas."
- "How about a game in space with amazing graphics showing planets, stars, and a spaceship?"
- "A frog jumps on lily pads and wooden logs, collecting all the flowers before reaching the end of the pond."  
- "A top-down view game where the player is a cat and has to catch the mice while avoiding the dogs."
- "Tanks are everywhere hiding in the bushes. The player controls a tank and has to shoot the other tanks while avoiding their fire."
- "There are lasers in the room but you can spray fog to see them locally. The player has to navigate through to find the exit without getting caught by the lasers."
- "What if there was a game where you shoot balloons moving up but you need to be careful not to shoot balloons which have a stone in it?"
- "Can you make a platformer game set in a space station with low gravity sections, asteroid fields, and airlock puzzles?"
</example_concepts>

Here are previously generated game concepts for your reference.
<previous_concepts>
{previous_concepts_text}
</previous_concepts>

Please propose new game concepts that are different from the previously generated game concepts in terms of ideas and writing style. 
Adopt a unique style, tone, and vocabulary. Use terms that are relatable and known by everyone. 
</game_concept_instructions>

<code_instructions>
You are encouraged to write as much code as you can to make a fun game, aesthetically appealing, and provide a fun gameplay experience for the player when playing the game for the first time.
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
    - Note that the specific order of the shapes in the function name matters.
    - Available functions: `collidePointPoint`, `collidePointCircle`, `collidePointEllipse`, `collidePointRect`, `collidePointLine`, `collidePointArc`, `collideRectRect`, `collideCircleCircle`, `collideRectCircle`, `collideLineLine`, `collideLineCircle`, `collideLineRect`, `collidePointPoly`, `collideCirclePoly`, `collideRectPoly`, `collideLinePoly`, `collidePolyPoly`, `collidePointTriangle`
</p5_instructions>
</code_instructions>
</instructions>