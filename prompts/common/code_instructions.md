<code_instructions>
- Organize code into modules with ES6 imports/exports; no dynamic imports.
- Expose `window.getGameState = () => gameState`.
- Implement `gameState` with keys: player, entities, score, gamePhase, controlMode, ...
- Use p5 instance mode, expose `window.gameInstance`.
- If `p5play` enabled: you may use p5.play v3 APIs for sprites and collisions.
- If `planck` enabled: you may use Planck.js for physics bodies and contacts.
</code_instructions>

