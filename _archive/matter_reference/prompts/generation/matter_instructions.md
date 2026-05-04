{hard_constraints}

<instructions>
Write as much code as needed for a fun, aesthetically pleasing, and responsive 2D physics-based gameplay experience using p5.js for rendering and Matter.js for realistic physics simulation.

# Code Architecture
- Organize the code into multiple files with organized code as needed (game.js, globals.js, entities.js, physics.js, etc.)
- Use proper ES6 Imports and Exports:
    - No Node.js style require() imports. No dynamic imports within functions.
    - Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of files where they are used. Example:
    ```javascript
    // Essential pattern (ALWAYS follow this)
    import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
    const { Engine, World, Bodies, Body, Events } = Matter;

    import { Player, Enemy } from './entities.js';
    import { handleCollisions } from './physics.js';
    import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

    // Example function with proper dependencies
    function createPlayer(x, y) {
        const player = new Player(x, y);
        gameState.player = player;
        gameState.entities.push(player);
        return player;
    }
    ```

# State Management
  - Use a `gameState` object to track the game's current data and status.
  - Initialize the `gameState` object at the initialization function and update it at every frame with the latest information. Example implementation:
    ```javascript
    export const gameState = {
      player: null,       // player entity to be initialized before the game starts
      entities: [],       // all game entities including player, npcs, objects, etc.
      score: 0,
      gamePhase: "START",   // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
      controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
      engine: null,         // Matter.js engine
      world: null,          // Matter.js world
      ... // other game state variables
    };
    ```
  - Implement `function getGameState()` and attach it to `window`. It must return the `gameState` object. Example implementation:
    ```javascript
    export function getGameState() {
      return gameState;
    }
    // Expose the getGameState function globally
    window.getGameState = getGameState;
    ```

# p5.js + Matter.js Hybrid Setup

Use p5.js in instance mode for rendering, logging, and game loop while Matter.js handles physics:

```javascript
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

let gameInstance = new p5(p => {
  let engine, world;

  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 1; // Adjust gravity as needed

    gameState.engine = engine;
    gameState.world = world;

    // Initialize p5.logs (write-only, never reset!)
    p.logs = {
      game_info: [],   // Information about the game
      player_info: [], // Information about the player character
      inputs: []       // Information about the key inputs
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize game entities with Matter.js bodies
    initializeGame(p);
  };

  p.draw = function() {
    // Update Matter.js physics engine
    Engine.update(engine, 1000 / 60);

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" ||
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
      }
    }

    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;
```

# p5.logs Requirements
- p.logs is write-only. Don't reset it. We want to keep track of all the logs since the start of the game.
- Variables to store in p.logs during gameplay:
  - In "game_info": Information about the game when there are changes in the gamePhase, etc.
    - "data": Game phase or other game state information
    - "framecount": The current frame count accessed via `p.frameCount`
    - "timestamp": The timestamp of the event accessed using `Date.now()`
  - In "inputs": Store the control inputs when they are triggered by the player (keyPressed, keyReleased, etc.)
    - "input_type": The input event type (keyPressed, keyReleased, etc.)
    - "data": Additional data specific to the input type. Store `key` and `keyCode`
    - "framecount": The current frame count
    - "timestamp": The timestamp of the event
  - In "player_info": Information about the player character when there are changes in the player's state
    - "screen_x": The x position of the player on screen (Matter body x position)
    - "screen_y": The y position of the player on screen (Matter body y position)
    - "game_x": The x position of the player in the game world (same as screen_x for non-scrolling games)
    - "game_y": The y position of the player in the game world (same as screen_y for non-scrolling games)
    - "framecount": The current frame count
    - "timestamp": The timestamp of the event

# Matter.js Physics Integration

- Create Matter.js bodies for all game entities:
  ```javascript
  const playerBody = Bodies.circle(x, y, radius, {
    label: 'player',
    friction: 0.8,
    restitution: 0.3,
    density: 0.01
  });
  World.add(world, playerBody);
  ```

- Handle collisions using Matter.js Events:
  ```javascript
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    pairs.forEach(pair => {
      if (pair.bodyA.label === 'player' && pair.bodyB.label === 'enemy') {
        // Handle collision
        const velocity = Math.sqrt(
          Math.pow(pair.bodyA.velocity.x - pair.bodyB.velocity.x, 2) +
          Math.pow(pair.bodyA.velocity.y - pair.bodyB.velocity.y, 2)
        );
        const damage = velocity * 5;
        // Apply game logic based on collision
      }
    });
  });
  ```

- Use Matter.js for movement:
  ```javascript
  // Apply force
  Body.applyForce(playerBody, playerBody.position, { x: 0, y: -0.1 });

  // Set velocity directly
  Body.setVelocity(playerBody, { x: 5, y: 0 });

  // Set position (for teleporting)
  Body.setPosition(playerBody, { x: 100, y: 200 });
  ```

- Do NOT create/destroy bodies every frame (causes performance issues):
  ```javascript
  // BAD - creates new body every frame
  p.draw = function() {
    const box = Bodies.rectangle(x, y, 50, 50);
    World.add(world, box);
  };

  // GOOD - reuse existing bodies
  p.setup = function() {
    const box = Bodies.rectangle(x, y, 50, 50);
    World.add(world, box);
    gameState.box = box;
  };
  ```

# Rendering with p5.js

- Use p5.js to render Matter.js bodies:
  ```javascript
  function drawBody(p, body, color) {
    p.push();
    p.translate(body.position.x, body.position.y);
    p.rotate(body.angle);

    if (body.circleRadius) {
      // Draw circle
      p.fill(color);
      p.noStroke();
      p.circle(0, 0, body.circleRadius * 2);
    } else {
      // Draw polygon/rectangle
      p.fill(color);
      p.noStroke();
      p.beginShape();
      const vertices = body.vertices;
      for (let v of vertices) {
        const vx = v.x - body.position.x;
        const vy = v.y - body.position.y;
        p.vertex(vx, vy);
      }
      p.endShape(p.CLOSE);
    }

    p.pop();
  }

  function renderGame(p) {
    p.background(135, 206, 235); // Sky blue

    // Draw all Matter.js bodies using p5.js
    gameState.entities.forEach(entity => {
      if (entity.body) {
        drawBody(p, entity.body, entity.color || [100, 100, 100]);
      }
    });

    // Draw UI
    p.fill(255);
    p.textSize(16);
    p.text(`Score: ${gameState.score}`, 10, 20);
  }
  ```

- Game Screens:
  - Start ("START"): Use p5.js to display title, instructions, controls, "PRESS ENTER TO START"
  - Playing ("PLAYING"): Active gameplay with Matter.js physics and p5.js rendering
  - Pause ("PAUSED"): Display "PAUSED" text overlay using p5.js
  - Game Over ("GAME_OVER_WIN"/"GAME_OVER_LOSE"): Display Win/Lose message, score, "PRESS R TO RESTART"

# Entity Class Pattern

Create entity classes that wrap Matter.js bodies:

```javascript
export class Player {
  constructor(p, x, y) {
    this.p = p;

    // Create Matter.js body
    this.body = Bodies.circle(x, y, 20, {
      label: 'player',
      friction: 0.8,
      restitution: 0.3
    });
    World.add(gameState.world, this.body);

    this.color = [0, 255, 0];
    this.health = 100;
  }

  update() {
    // Update based on Matter.js body position
    // Log player info if position changed significantly
    if (this.shouldLogPosition()) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  render() {
    drawBody(this.p, this.body, this.color);
  }

  moveLeft() {
    Body.applyForce(this.body, this.body.position, { x: -0.01, y: 0 });
  }

  moveRight() {
    Body.applyForce(this.body, this.body.position, { x: 0.01, y: 0 });
  }

  jump() {
    if (this.isOnGround()) {
      Body.setVelocity(this.body, { x: this.body.velocity.x, y: -10 });
    }
  }
}
```

# Implementation Pattern
Implement as separate ES6 module files:
  1. globals.js - Contains all global constants and gameState object
  2. entities.js - Contains entity classes (Player, Enemy, etc.) that wrap Matter.js bodies
  3. physics.js - Contains Matter.js collision handling using Events
  4. game.js - Main game logic with p5.js instance mode and Matter.js integration
  5. index.html - HTML file that includes p5.js, Matter.js ESM, and loads game.js as module

All files must use proper ES6 module syntax with imports at the top.

# Key Points

✅ **Use p5.js for:** Rendering, logging (p.logs), input handling, game loop, UI
✅ **Use Matter.js for:** Physics simulation, collision detection, realistic movement
✅ **Render Matter bodies with p5.js:** Read body.position and body.angle, draw with p5 functions
✅ **Keep p.logs compatible:** Same logging structure as pure p5.js games
✅ **Don't reset p.logs:** Write-only, tracks entire game session
</instructions>
