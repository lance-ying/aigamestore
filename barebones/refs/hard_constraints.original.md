<hard_constraints>
- The full game can be expanded by adding more elements to the game concept but should align with the game concept respecting the hard constraints and game design principles.
- Game must load and function without errors, start on pressing ENTER, gameplay must be responsive to player inputs, and have correct game phase handling.
- Game phases: START→PLAYING (ENTER), PLAYING→GAME_OVER (win/lose), GAME_OVER→START (R), PLAYING↔PAUSED (ESC). Expose this in a variable called `gameState.gamePhase` where `gameState` is a global object accessible via `window.getGameState()`.
- Start screen should have a title, short description of the game, instructions to play the game, and a "PRESS ENTER TO START" prompt.
- Allowed libraries: {libraries_allowed}
- Canvas: `{canvas_width} × {canvas_height} px`; target 60 FPS
- Keyboard inputs only. No mouse control.
{game_controls}
{game_phase_control}
- No external images, sprites, fonts, or other assets. Make visual assets and animations using code.
- No audio or sound effects.
- Use p5.js in instance mode and expose the game instance globally as window.gameInstance.
- Ensure game reproducibility using `p.randomSeed(42)` in the `setup` function. No other random seeding.
- Use ES6 syntax with proper imports and exports at the top of the file where they are used. No dynamic imports or require() imports.
- Maintain `p.logs` as write-only; log game_info, inputs, player_info with proper initialization and updates during the game loop.
</hard_constraints>
