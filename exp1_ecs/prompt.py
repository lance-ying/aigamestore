# Game generation prompts
GAME_PROMPT_NO_ECS = """Generate an interesting and fun {genre} game with {num_players} characters. 
One character will be controlled by a human player and the rest will be controlled by AI.

First, write the description of the game that is fun and engaging. You should label the description with ```description and ```.

Requirements:
- The game must be playable in a web browser using JavaScript key codes for controls: 
  * Arrow keys (keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN) 
  * Space bar (key === ' ') 
  * Shift key (keyCode === SHIFT or keyCode === 16) 
  * WASD keys (key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D') 
- No audio should be used in the game.
- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.
- Ensure that the game code has correctly implemented game mechanics to the game description.
- There should be a start screen with instructions and a game over screen with the score.
- Please provide a creative title for your game at the beginning, prefixed with 'GAME TITLE: '.
- Ensure proper key event handling with correct JavaScript key codes.

Then, generate the game code as two markdown blocks:
1. ```html for the HTML code
2. ```javascript for the JavaScript code
"""



GAME_PROMPT_ECS = """Generate an interesting and fun {genre} game with {num_players} characters. **You should use ECS (Entity-Component-System) architecture for the game.**

One character will be controlled by a human player and the rest will be controlled by AI.

First, write the description of the game that is fun and engaging. You should label the description with ```description and ```.

Requirements:
- The game must be playable in a web browser using JavaScript key codes for controls: 
  * Arrow keys (keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN) 
  * Space bar (key === ' ') 
  * Shift key (keyCode === SHIFT or keyCode === 16) 
  * WASD keys (key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D') 
- No audio should be used in the game.
- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.
- Ensure that the game code has correctly implemented game mechanics to the game description.
- There should be a start screen with instructions and a game over screen with the score.
- Please provide a creative title for your game at the beginning, prefixed with 'GAME TITLE: '.
- Ensure proper key event handling with correct JavaScript key codes.

Then, generate the game code as two markdown blocks:
1. ```html for the HTML code
2. ```javascript for the JavaScript code
"""





GAME_REVIEW_PROMPT = """Review the following game code and provide feedback on:
1. Code quality
2. Game mechanics
3. User experience
4. Potential improvements

Game code:
{code}
"""

