<code_instructions>
- Organize code into modules with ES6 imports/exports; no dynamic imports.
- Expose `window.getGameState = () => gameState`.
- Implement `gameState` with keys: player, entities, score, gamePhase, controlMode, ...
- Use p5 instance mode, expose `window.gameInstance`.
- If `p5play` enabled: you may use p5.play v3 APIs for sprites and collisions.
- If `planck` enabled: you may use Planck.js for physics bodies and contacts.
- If `matter.js` enabled: you may use Matter.js v0.17.1 for 2D rigid body physics simulation.
  - Use Matter.Engine.create() to create a physics engine
  - Use Matter.World to manage physics bodies
  - Use Matter.Bodies for creating physics objects (rectangle, circle, polygon, etc.)
  - Use Matter.Body for manipulating bodies (position, velocity, force, etc.)
  - Run Matter.Engine.update(engine) in your game loop to step physics simulation
  - Render physics bodies using p5.js drawing functions by reading body.position and body.angle
  - Use Matter.Events.on() for collision detection callbacks
  - Common pattern: create physics in setup(), update in fixedUpdate(), render in draw()
</code_instructions>

