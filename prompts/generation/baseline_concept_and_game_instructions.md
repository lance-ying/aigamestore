{hard_constraints}

<instructions>
<game_concept_instructions>
The proposed game concept should be novel and fun. Please consider the hard constraints for the game code when proposing the game concept. For each idea, adopt a unique style, tone, and vocabulary. Use terms that are relatable and known by everyone. A game requires defining the following elements [environment, entities, mechanics, graphics]. Focus on 1-2 elements with creative detail leaving room for adding more elements later. Here are the sub-elements for each for context with examples from existing games like Mario, Pacman, Snake, Breakout, etc. for inspiration:
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
- "Can we have a platformer game set in a space station with low gravity sections, asteroid fields, and airlock puzzles?"
</example_concepts>

Here are previously generated game concepts for your reference. Please propose new game concepts that are different from the previously generated game concepts in terms of ideas and writing style.
<previous_concepts>
{previous_concepts_text}
</previous_concepts>
</game_concept_instructions>

<code_instructions>
- Canvas: `{canvas_width} × {canvas_height} px`; target 60 FPS
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
</code_instructions>
</instructions>