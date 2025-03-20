# Game generation prompts
GAME_PROMPT_NO_ECS = """Generate an interesting and fun {genre} game with {num_players} characters. 
One character will be controlled by a human player and the rest will be controlled by AI.

First, write the description of the game that is fun and engaging. You should label the description with ```description and ```.

Requirements:
- The game must be playable in a web browser using JavaScript key codes for controls: 
  * Arrow keys (use keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN respectively) 
  * Space bar (use key === ' ') 
  * Shift key (use keyCode === SHIFT or keyCode === 16) 
  * WASD keys (use key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D' respectively) 
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
  * Arrow keys (use keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN respectively) 
  * Space bar (use key === ' ') 
  * Shift key (use keyCode === SHIFT or keyCode === 16) 
  * WASD keys (use key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D' respectively) 
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


GAME_DESCRIPTION_PROMPT = """Generate a description for a {genre} game with {num_players} characters.

Requirements:
- The description should be fun and engaging.
- The description should be labeled with ```description and ```.
- Please provide a creative title for your game at the beginning, prefixed with 'GAME TITLE: '.
"""


GAME_CODE_PROMPT_NO_ECS = """Generate the game code for the following description:

It is a {genre} game with {num_players} characters.

The game title is: {title}

The description is:
{description}


One character will be controlled by a human player and the rest will be controlled by AI.

Requirements:
- The game must be playable in a web browser using JavaScript key codes for controls: 
  * Arrow keys (use keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN respectively) 
  * Space bar (use key === ' ') 
  * Shift key (use keyCode === SHIFT or keyCode === 16) 
  * WASD keys (use key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D' respectively) 
- No audio should be used in the game.
- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.
- Ensure that the game code has correctly implemented game mechanics to the game description.
- There should be a start screen with instructions and a game over screen with the score.
- Ensure proper key event handling with correct JavaScript key codes.

Then, generate the game code as two markdown blocks:
1. ```html for the HTML code
2. ```javascript for the JavaScript code
"""


GAME_CODE_PROMPT_ECS = """Generate the game code for the following description:

It is a {genre} game with {num_players} characters.

The game title is: {title}

The description is:
{description}


One character will be controlled by a human player and the rest will be controlled by AI.

Requirements:
- The game must be playable in a web browser using JavaScript key codes for controls: 
  * Arrow keys (use keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN respectively) 
  * Space bar (use key === ' ') 
  * Shift key (use keyCode === SHIFT or keyCode === 16) 
  * WASD keys (use key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D' respectively) 
- No audio should be used in the game.
- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.
- Ensure that the game code has correctly implemented game mechanics to the game description.
- There should be a start screen with instructions and a game over screen with the score.
- Ensure proper key event handling with correct JavaScript key codes.

Then, generate the game code as two markdown blocks:
1. ```html for the HTML code
2. ```javascript for the JavaScript code

**You should use the Entity-Component-System (ECS) architecture for the game.**
"""





GAME_REVIEW_PROMPT = """Review the following game code and provide feedback on:
1. Code quality
2. Game mechanics
3. User experience
4. Potential improvements

Game code:
{code}
"""

