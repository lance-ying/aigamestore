{hard_constraints}

<instructions>
Write COMPREHENSIVE, DETAILED code for a fun, aesthetically pleasing, and responsive 2D physics-based gameplay experience using p5.js for rendering and Matter.js for realistic physics simulation.

**IMPORTANT: Generate EXTENSIVE, COMPLETE code. Include:**
- Multiple well-organized files with complete implementations
- Detailed entity classes with full functionality
- Comprehensive physics and collision systems
- Complete camera controls and smooth following (for scrolling games)
- Full UI rendering with all game screens
- Extensive game logic with proper state management
- Detailed comments explaining complex logic
- Error handling and edge cases
- Performance optimizations where appropriate

**Do not skimp on code - be thorough and comprehensive. Write as much code as needed to create a fully-featured, polished game.**

# Code Architecture
- Organize the code into multiple files with organized code as needed (game.js, globals.js, entities.js, physics.js, renderer.js, camera.js, etc.)
- Use proper ES6 Imports and Exports:
    - No Node.js style require() imports. No dynamic imports within functions.
    - Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of files where they are used. Example:
    ```javascript
    // Essential pattern (ALWAYS follow this)
    import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
    const { Engine, World, Bodies, Body, Events, Constraint, Composite, Query, Vector } = Matter;

    import { Player, Enemy, Collectible } from './entities.js';
    import { handleCollisions, setupCollisionEvents } from './physics.js';
    import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
    import { drawBody, renderUI } from './renderer.js';

    // Example function with proper dependencies
    function createPlayer(p, x, y) {
        const player = new Player(p, x, y);
        gameState.player = player;
        gameState.entities.push(player);
        return player;
    }
    ```

- File organization pattern:
  - `globals.js` - Constants, gameState, logs initialization
  - `entities.js` - Entity classes (Player, Enemy, Collectible, Projectile, Platform, etc.)
  - `physics.js` - Collision detection, physics setup, constraints, joints
  - `renderer.js` - p5.js rendering functions, UI rendering
  - `camera.js` - Camera/scrolling logic (for scrolling games)
  - `game.js` - Main game loop, input handling, game phase management
  - `index.html` - HTML file that loads game.js as module

# State Management
  - Use a `gameState` object to track the game's current data and status.
  - Initialize the `gameState` object at the initialization function and update it at every frame with the latest information. Example implementation:
    ```javascript
    export const gameState = {
      player: null,           // player entity to be initialized before the game starts
      entities: [],           // all game entities including player, npcs, objects, etc.
      score: 0,
      gamePhase: "START",     // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
      controlMode: "HUMAN",   // "HUMAN", "TEST_1", "TEST_2", etc.
      
      // Matter.js core objects
      engine: null,           // Matter.js Engine
      world: null,           // Matter.js World
      
      // Physics state
      gravity: { x: 0, y: 1 }, // Gravity vector
      collisionPairs: [],    // Active collision pairs for processing
      
      // Camera/Scrolling state (for scrolling games)
      cameraX: 0,            // Camera X position
      cameraY: 0,            // Camera Y position
      cameraTarget: null,    // Object to follow (usually player)
      cameraOffset: { x: 0, y: 0 }, // Camera offset from target
      
      // Performance tracking
      frameCount: 0,          // Current frame number
      lastFrameTime: 0,      // Last frame timestamp for delta time
      deltaTime: 0,          // Time since last frame
      
      // Game-specific state
      collectibles: [],       // Collectible items
      enemies: [],            // Enemy entities
      platforms: [],          // Platform/obstacle entities
      projectiles: [],       // Projectile entities
      constraints: [],       // Matter.js constraints/joints
      
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

## Basic Setup Pattern
Use p5.js in instance mode for rendering, logging, and game loop while Matter.js handles physics:

```javascript
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events, Constraint, Composite, Query, Vector } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupCollisionEvents } from './physics.js';
import { initializeGame } from './game.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    engine.world.gravity.y = 1; // Adjust gravity as needed
    engine.world.gravity.x = 0;
    engine.world.gravity.scale = 0.001; // Matter.js uses scaled gravity

    // Store in gameState
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
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Setup collision events
    setupCollisionEvents(engine, p);

    // Initialize game entities with Matter.js bodies
    initializeGame(p);
  };

  p.draw = function() {
    // Calculate delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    gameState.frameCount = p.frameCount;

    // Update Matter.js physics engine (fixed timestep)
    Engine.update(gameState.engine, 1000 / 60);

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
        renderGame(p);
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
        game_status: "PLAYING",
        data: {},
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
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" ||
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
      }
    }

    // Handle gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
      handleGameplayInput(p, true);
    }

    return false; // Prevent default
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Handle gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
      handleGameplayInput(p, false);
    }

    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;
```

# Matter.js Engine Configuration

## Engine Setup
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

// Create engine
const engine = Engine.create();

// Configure engine timing
engine.timing.timeScale = 1.0; // Time scale (1.0 = normal, 0.5 = slow motion, 2.0 = fast)
engine.timing.timestamp = 0;

// Configure engine constraints
engine.positionIterations = 6;  // Position solver iterations (default: 6)
engine.velocityIterations = 4;  // Velocity solver iterations (default: 4)
engine.constraintIterations = 2; // Constraint solver iterations (default: 2)

// Configure world gravity
engine.world.gravity.x = 0;
engine.world.gravity.y = 1;
engine.world.gravity.scale = 0.001; // Matter.js uses scaled gravity

// Store in gameState
gameState.engine = engine;
gameState.world = engine.world;
```

## World Configuration
```javascript
// Set world bounds (optional - for boundary walls)
const worldBounds = {
  min: { x: 0, y: 0 },
  max: { x: CANVAS_WIDTH, y: CANVAS_HEIGHT }
};

// Create boundary walls
function createBoundaries() {
  const thickness = 50;
  const boundaries = [
    // Ground
    Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + thickness / 2, CANVAS_WIDTH, thickness, {
      isStatic: true,
      label: 'ground'
    }),
    // Left wall
    Bodies.rectangle(-thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT, {
      isStatic: true,
      label: 'wall'
    }),
    // Right wall
    Bodies.rectangle(CANVAS_WIDTH + thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT, {
      isStatic: true,
      label: 'wall'
    }),
    // Ceiling (optional)
    Bodies.rectangle(CANVAS_WIDTH / 2, -thickness / 2, CANVAS_WIDTH, thickness, {
      isStatic: true,
      label: 'ceiling'
    })
  ];
  
  World.add(gameState.world, boundaries);
  return boundaries;
}
```

# Matter.js Body Creation

## Basic Body Shapes

### Rectangle Body
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World } = Matter;

const rectangle = Bodies.rectangle(
  x,              // X position
  y,              // Y position
  width,          // Width
  height,         // Height
  {
    label: 'rectangle',
    friction: 0.8,        // Friction (0-1)
    frictionAir: 0.01,    // Air friction
    restitution: 0.3,     // Bounciness (0-1)
    density: 0.001,       // Density (affects mass)
    inertia: Infinity,    // Rotational inertia (Infinity = no rotation)
    isStatic: false,      // Static body (doesn't move)
    isSensor: false,      // Sensor (detects collisions but doesn't collide)
    chamfer: {            // Rounded corners
      radius: 5
    }
  }
);

World.add(gameState.world, rectangle);
```

### Circle Body
```javascript
const circle = Bodies.circle(
  x,              // X position
  y,              // Y position
  radius,         // Radius
  {
    label: 'circle',
    friction: 0.8,
    restitution: 0.5,
    density: 0.001,
    frictionAir: 0.01
  }
);

World.add(gameState.world, circle);
```

### Polygon Body
```javascript
const polygon = Bodies.polygon(
  x,              // X position
  y,              // Y position
  sides,          // Number of sides (3 = triangle, 4 = square, etc.)
  radius,         // Radius from center to vertices
  {
    label: 'polygon',
    friction: 0.8,
    restitution: 0.3,
    density: 0.001
  }
);

World.add(gameState.world, polygon);
```

### Trapezoid Body
```javascript
const trapezoid = Bodies.trapezoid(
  x,              // X position
  y,              // Y position
  width,          // Width
  height,         // Height
  slope,          // Slope (0-1, affects top width)
  {
    label: 'trapezoid',
    friction: 0.8,
    restitution: 0.3
  }
);

World.add(gameState.world, trapezoid);
```

## Custom Vertices Body
```javascript
// Create body from custom vertices
const vertices = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 50, y: 30 },
  { x: 25, y: 50 },
  { x: 0, y: 30 }
];

const customBody = Bodies.fromVertices(
  x,              // X position
  y,              // Y position
  vertices,       // Array of vertex positions
  {
    label: 'custom',
    friction: 0.8,
    restitution: 0.3
  }
);

World.add(gameState.world, customBody);
```

## Body Properties

### Physical Properties
```javascript
// Set body properties
Body.setMass(body, 10);                    // Set mass
Body.setDensity(body, 0.001);              // Set density (auto-calculates mass)
Body.setInertia(body, 1000);              // Set rotational inertia
Body.setFriction(body, 0.8);               // Set friction
Body.setFrictionAir(body, 0.01);           // Set air friction
Body.setRestitution(body, 0.5);           // Set bounciness
Body.setStatic(body, true);                // Make static (immovable)
Body.setSensor(body, true);                // Make sensor (no collision response)

// Get body properties
const mass = body.mass;
const density = body.density;
const friction = body.friction;
const restitution = body.restitution;
```

### Position and Rotation
```javascript
// Set position
Body.setPosition(body, { x: 100, y: 200 });

// Set angle (rotation)
Body.setAngle(body, Math.PI / 4); // 45 degrees

// Set velocity
Body.setVelocity(body, { x: 5, y: -10 });

// Set angular velocity (rotation speed)
Body.setAngularVelocity(body, 0.1);

// Get position and velocity
const position = body.position;
const velocity = body.velocity;
const angle = body.angle;
const angularVelocity = body.angularVelocity;
```

### Force and Impulse
```javascript
// Apply force at a point
Body.applyForce(body, body.position, { x: 0.01, y: -0.1 });

// Apply force at specific point
const forcePoint = { x: body.position.x + 10, y: body.position.y };
Body.applyForce(body, forcePoint, { x: 0.01, y: 0 });

// Apply impulse (instant velocity change)
Body.applyImpulse(body, body.position, { x: 0.1, y: -0.5 });

// Set velocity directly (for instant movement)
Body.setVelocity(body, { x: 5, y: 0 });
```

# Collision Detection and Handling

## Collision Events

### Collision Start (First Contact)
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Check specific collision types
    if (bodyA.label === 'player' && bodyB.label === 'enemy') {
      // Player hit enemy
      handlePlayerEnemyCollision(bodyA, bodyB);
    }
    
    if (bodyA.label === 'player' && bodyB.label === 'collectible') {
      // Player collected item
      handleCollectibleCollision(bodyA, bodyB);
    }
    
    if (bodyA.label === 'player' && bodyB.label === 'ground') {
      // Player landed on ground
      handleGroundCollision(bodyA);
    }
  });
});
```

### Collision Active (During Contact)
```javascript
Events.on(engine, 'collisionActive', (event) => {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Handle continuous collision (e.g., player standing on platform)
    if (bodyA.label === 'player' && bodyB.label === 'platform') {
      // Player is on platform
      gameState.player.onPlatform = true;
    }
  });
});
```

### Collision End (Contact Broken)
```javascript
Events.on(engine, 'collisionEnd', (event) => {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Handle collision end
    if (bodyA.label === 'player' && bodyB.label === 'platform') {
      // Player left platform
      gameState.player.onPlatform = false;
    }
  });
});
```

## Collision Response

### Damage Based on Velocity
```javascript
function handlePlayerEnemyCollision(playerBody, enemyBody) {
  // Calculate relative velocity
  const relativeVelocity = {
    x: playerBody.velocity.x - enemyBody.velocity.x,
    y: playerBody.velocity.y - enemyBody.velocity.y
  };
  
  const speed = Math.sqrt(
    relativeVelocity.x * relativeVelocity.x +
    relativeVelocity.y * relativeVelocity.y
  );
  
  // Calculate damage based on impact speed
  const damage = speed * 10;
  
  // Apply damage
  if (gameState.player) {
    gameState.player.takeDamage(damage);
  }
  
  // Apply knockback
  const knockback = {
    x: relativeVelocity.x * 0.1,
    y: relativeVelocity.y * 0.1
  };
  Body.applyImpulse(playerBody, playerBody.position, knockback);
}
```

### Collectible Collection
```javascript
function handleCollectibleCollision(playerBody, collectibleBody) {
  // Find collectible entity
  const collectible = gameState.collectibles.find(c => c.body === collectibleBody);
  
  if (collectible) {
    // Add score
    gameState.score += collectible.value;
    
    // Remove from world
    World.remove(gameState.world, collectibleBody);
    
    // Remove from entities
    const index = gameState.collectibles.indexOf(collectible);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
}
```

## Ground Detection
```javascript
function isOnGround(body) {
  // Cast ray downward to check for ground
  const rayStart = body.position;
  const rayEnd = {
    x: body.position.x,
    y: body.position.y + body.bounds.max.y - body.bounds.min.y + 5
  };
  
  const collisions = Query.ray(gameState.world.bodies, rayStart, rayEnd);
  
  return collisions.length > 0;
}

// Alternative: Check collision with ground label
function isOnGroundByCollision(body) {
  // Check if body is colliding with ground
  const collisions = Query.collides(body, gameState.world.bodies);
  
  return collisions.some(collision => 
    collision.bodyA.label === 'ground' || collision.bodyB.label === 'ground'
  );
}
```

# Constraints and Joints

## Distance Constraint (Rope/Chain)
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Constraint, World } = Matter;

// Create distance constraint between two bodies
const constraint = Constraint.create({
  bodyA: body1,
  bodyB: body2,
  length: 100,           // Distance between bodies
  stiffness: 0.9,        // Stiffness (0-1, 1 = rigid)
  damping: 0.1,          // Damping (reduces oscillation)
  render: {
    visible: true,       // Show constraint line
    lineWidth: 2,
    strokeStyle: '#ffffff'
  }
});

World.add(gameState.world, constraint);
gameState.constraints.push(constraint);
```

## Revolute Joint (Hinge)
```javascript
// Create revolute joint (allows rotation around a point)
const revolute = Constraint.create({
  bodyA: body1,
  bodyB: body2,
  pointA: { x: 0, y: 0 },  // Point on bodyA
  pointB: { x: 0, y: 0 },  // Point on bodyB
  length: 0,               // 0 = no distance constraint
  stiffness: 1.0
});

World.add(gameState.world, revolute);
```

## Slider Constraint
```javascript
// Create slider constraint (allows movement along an axis)
const slider = Constraint.create({
  bodyA: body1,
  bodyB: body2,
  pointA: { x: 0, y: 0 },
  pointB: { x: 0, y: 0 },
  length: 0,
  stiffness: 1.0,
  render: {
    type: 'line',
    anchors: true
  }
});

World.add(gameState.world, slider);
```

## Spring Constraint
```javascript
// Create spring constraint (elastic connection)
const spring = Constraint.create({
  bodyA: body1,
  bodyB: body2,
  length: 50,           // Rest length
  stiffness: 0.1,       // Low stiffness = more elastic
  damping: 0.05
});

World.add(gameState.world, spring);
```

## Composite Bodies (Connected Bodies)
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Composite, Bodies, Constraint } = Matter;

// Create composite (group of connected bodies)
const composite = Composite.create();

// Add bodies to composite
const body1 = Bodies.rectangle(100, 100, 50, 50);
const body2 = Bodies.rectangle(150, 100, 50, 50);
const body3 = Bodies.rectangle(125, 150, 50, 50);

Composite.add(composite, [body1, body2, body3]);

// Connect bodies with constraints
const constraint1 = Constraint.create({
  bodyA: body1,
  bodyB: body2,
  length: 50,
  stiffness: 0.9
});

const constraint2 = Constraint.create({
  bodyA: body2,
  bodyB: body3,
  length: 50,
  stiffness: 0.9
});

Composite.add(composite, [constraint1, constraint2]);

// Add composite to world
World.add(gameState.world, composite);
```

# Rendering with p5.js

## Basic Body Rendering
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
    
    // Optional: Draw outline
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
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
    
    // Optional: Draw outline
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (let v of vertices) {
      const vx = v.x - body.position.x;
      const vy = v.y - body.position.y;
      p.vertex(vx, vy);
    }
    p.endShape(p.CLOSE);
  }

  p.pop();
}
```

## Advanced Body Rendering with Sprites
```javascript
function drawBodyWithSprite(p, body, sprite, color) {
  p.push();
  p.translate(body.position.x, body.position.y);
  p.rotate(body.angle);
  
  // Draw sprite/image
  if (sprite) {
    p.imageMode(p.CENTER);
    p.image(sprite, 0, 0, body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
  } else {
    // Fallback to shape
    drawBody(p, body, color);
  }
  
  p.pop();
}
```

## Rendering Constraints
```javascript
function drawConstraint(p, constraint) {
  if (!constraint.render || !constraint.render.visible) return;
  
  p.push();
  p.stroke(constraint.render.strokeStyle || '#ffffff');
  p.strokeWeight(constraint.render.lineWidth || 2);
  p.line(
    constraint.bodyA.position.x + constraint.pointA.x,
    constraint.bodyA.position.y + constraint.pointA.y,
    constraint.bodyB.position.x + constraint.pointB.x,
    constraint.bodyB.position.y + constraint.pointB.y
  );
  p.pop();
}
```

## Complete Render Function
```javascript
function renderGame(p) {
  // Clear background
  p.background(135, 206, 235); // Sky blue
  
  // Apply camera offset (for scrolling games)
  p.push();
  if (gameState.cameraTarget) {
    p.translate(-gameState.cameraX, -gameState.cameraY);
  }
  
  // Draw all Matter.js bodies using p5.js
  gameState.entities.forEach(entity => {
    if (entity.body && entity.body.render !== false) {
      entity.render(p);
    }
  });
  
  // Draw constraints
  gameState.constraints.forEach(constraint => {
    drawConstraint(p, constraint);
  });
  
  p.pop();
  
  // Draw UI (not affected by camera)
  renderUI(p);
}
```

# Entity Classes

## Comprehensive Player Class
```javascript
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState } from './globals.js';
import { drawBody } from './renderer.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;

    // Create Matter.js body
    this.body = Bodies.circle(x, y, 20, {
      label: 'player',
      friction: 0.8,
      frictionAir: 0.01,
      restitution: 0.3,
      density: 0.001
    });
    World.add(gameState.world, this.body);

    // Visual properties
    this.color = [0, 255, 0];
    this.size = 20;

    // Game properties
    this.health = 100;
    this.maxHealth = 100;
    this.score = 0;
    this.speed = 0.01;
    this.jumpPower = -10;
    
    // State
    this.onGround = false;
    this.onPlatform = false;
    this.isMoving = false;
    this.lastPosition = { x: x, y: y };
    this.lastLogTime = 0;
  }

  update() {
    // Check ground collision
    this.onGround = this.checkGroundCollision();
    
    // Apply air resistance when not on ground
    if (!this.onGround) {
      Body.setVelocity(this.body, {
        x: this.body.velocity.x * 0.98,
        y: this.body.velocity.y
      });
    }
    
    // Log player info periodically
    const currentTime = this.p.millis();
    if (currentTime - this.lastLogTime > 100) { // Log every 100ms
      this.logPosition();
      this.lastLogTime = currentTime;
    }
    
    // Update last position
    this.lastPosition = { x: this.body.position.x, y: this.body.position.y };
  }

  checkGroundCollision() {
    // Simple ground check (Y position)
    const groundY = CANVAS_HEIGHT - 50; // Assuming ground at bottom
    return this.body.position.y >= groundY - this.size;
  }

  render(p) {
    drawBody(p, this.body, this.color);
    
    // Optional: Draw health bar above player
    if (this.health < this.maxHealth) {
      const barWidth = 40;
      const barHeight = 4;
      const healthRatio = this.health / this.maxHealth;
      
      p.push();
      p.translate(this.body.position.x, this.body.position.y - 30);
      p.fill(255, 0, 0);
      p.rect(-barWidth / 2, 0, barWidth, barHeight);
      p.fill(0, 255, 0);
      p.rect(-barWidth / 2, 0, barWidth * healthRatio, barHeight);
      p.pop();
    }
  }

  moveLeft() {
    Body.applyForce(this.body, this.body.position, { x: -this.speed, y: 0 });
    this.isMoving = true;
  }

  moveRight() {
    Body.applyForce(this.body, this.body.position, { x: this.speed, y: 0 });
    this.isMoving = true;
  }

  jump() {
    if (this.onGround || this.onPlatform) {
      Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpPower
      });
      this.onGround = false;
      this.onPlatform = false;
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    this.p.logs.game_info.push({
      game_status: "GAME_OVER_LOSE",
      data: { score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  logPosition() {
    if (this.p.logs && this.p.logs.player_info) {
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
}
```

## Enemy Class with AI
```javascript
export class Enemy {
  constructor(p, x, y) {
    this.p = p;

    // Create Matter.js body
    this.body = Bodies.circle(x, y, 15, {
      label: 'enemy',
      friction: 0.8,
      restitution: 0.3,
      density: 0.001
    });
    World.add(gameState.world, this.body);

    this.color = [255, 0, 0];
    this.speed = 0.005;
    this.health = 50;
    this.damage = 10;
    this.attackRange = 50;
    this.detectionRange = 200;
    this.direction = 1; // 1 = right, -1 = left
  }

  update() {
    if (!gameState.player) return;

    const distanceToPlayer = Math.sqrt(
      Math.pow(this.body.position.x - gameState.player.body.position.x, 2) +
      Math.pow(this.body.position.y - gameState.player.body.position.y, 2)
    );

    // AI behavior
    if (distanceToPlayer < this.detectionRange) {
      // Move towards player
      const directionX = gameState.player.body.position.x - this.body.position.x;
      const directionY = gameState.player.body.position.y - this.body.position.y;
      const distance = Math.sqrt(directionX * directionX + directionY * directionY);
      
      if (distance > 0) {
        const normalizedX = directionX / distance;
        const normalizedY = directionY / distance;
        
        Body.applyForce(this.body, this.body.position, {
          x: normalizedX * this.speed,
          y: normalizedY * this.speed
        });
      }
    } else {
      // Patrol behavior
      Body.applyForce(this.body, this.body.position, {
        x: this.direction * this.speed * 0.5,
        y: 0
      });
      
      // Reverse direction at boundaries
      if (this.body.position.x < 50 || this.body.position.x > CANVAS_WIDTH - 50) {
        this.direction *= -1;
      }
    }
  }

  render(p) {
    drawBody(p, this.body, this.color);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    World.remove(gameState.world, this.body);
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
  }
}
```

## Collectible Class
```javascript
export class Collectible {
  constructor(p, x, y) {
    this.p = p;

    // Create Matter.js body (sensor - doesn't collide)
    this.body = Bodies.circle(x, y, 10, {
      label: 'collectible',
      isSensor: true, // Sensor - detects collision but doesn't respond
      isStatic: true  // Static - doesn't move
    });
    World.add(gameState.world, this.body);

    this.color = [255, 255, 0];
    this.value = 10;
    this.rotationSpeed = 0.02;
    this.bobAmount = 5;
    this.initialY = y;
    this.collected = false;
  }

  update() {
    if (this.collected) return;

    // Bob up and down
    const bobOffset = Math.sin(this.p.frameCount * 0.1) * this.bobAmount;
    Body.setPosition(this.body, {
      x: this.body.position.x,
      y: this.initialY + bobOffset
    });
  }

  render(p) {
    if (this.collected) return;

    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.p.frameCount * this.rotationSpeed);
    
    // Draw star shape
    p.fill(this.color);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * 10;
      const y = Math.sin(angle) * 10;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  collect() {
    if (this.collected) return;
    
    this.collected = true;
    gameState.score += this.value;
    
    World.remove(gameState.world, this.body);
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
}
```

## Projectile Class
```javascript
export class Projectile {
  constructor(p, x, y, directionX, directionY, speed = 10) {
    this.p = p;

    // Create small, fast-moving body
    this.body = Bodies.circle(x, y, 5, {
      label: 'projectile',
      friction: 0,
      frictionAir: 0,
      restitution: 0.5,
      density: 0.0001
    });
    
    // Set initial velocity
    Body.setVelocity(this.body, {
      x: directionX * speed,
      y: directionY * speed
    });
    
    World.add(gameState.world, this.body);

    this.color = [255, 255, 0];
    this.damage = 20;
    this.lifetime = 3000; // 3 seconds
    this.age = 0;
  }

  update() {
    this.age += this.p.deltaTime * 1000; // Convert to milliseconds

    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }

    // Remove if out of bounds
    if (this.body.position.x < -100 || this.body.position.x > CANVAS_WIDTH + 100 ||
        this.body.position.y < -100 || this.body.position.y > CANVAS_HEIGHT + 100) {
      this.destroy();
      return;
    }
  }

  render(p) {
    drawBody(p, this.body, this.color);
  }

  destroy() {
    World.remove(gameState.world, this.body);
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
  }
}
```

## Platform Class
```javascript
export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;

    // Create static platform
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: true,
      friction: 0.8,
      restitution: 0.1
    });
    World.add(gameState.world, this.body);

    this.color = [100, 100, 100];
    this.width = width;
    this.height = height;
  }

  update() {
    // Platforms are static, no update needed
  }

  render(p) {
    drawBody(p, this.body, this.color);
  }
}
```

# Camera and Scrolling

## Camera Following Player
```javascript
function updateCamera(p) {
  if (!gameState.player || !gameState.cameraTarget) return;

  // Smooth camera following
  const targetX = gameState.player.body.position.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.body.position.y - CANVAS_HEIGHT / 2;

  // Smooth interpolation
  gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
  gameState.cameraY += (targetY - gameState.cameraY) * 0.1;

  // Clamp camera to world bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.worldWidth - CANVAS_WIDTH, gameState.cameraX));
  gameState.cameraY = Math.max(0, Math.min(gameState.worldHeight - CANVAS_HEIGHT, gameState.cameraY));
}
```

## Camera with Offset
```javascript
function updateCameraWithOffset(p) {
  if (!gameState.player) return;

  const offsetX = gameState.cameraOffset.x || 0;
  const offsetY = gameState.cameraOffset.y || -100; // Look ahead

  const targetX = gameState.player.body.position.x - CANVAS_WIDTH / 2 + offsetX;
  const targetY = gameState.player.body.position.y - CANVAS_HEIGHT / 2 + offsetY;

  gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
  gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
}
```

# Game Screens and UI

## Start Screen
```javascript
function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Game Title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Instructions
  p.textSize(20);
  p.text('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Controls
  p.textSize(14);
  p.text('Arrow Keys: Move | Space: Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}
```

## Playing Screen with HUD
```javascript
function renderUI(p) {
  // HUD Background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 200, 80);
  
  // Score
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 20, 20);
  
  // Health
  if (gameState.player) {
    p.text(`Health: ${gameState.player.health}/${gameState.player.maxHealth}`, 20, 45);
    
    // Health bar
    const barWidth = 180;
    const barHeight = 10;
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    
    p.fill(100, 0, 0);
    p.rect(20, 65, barWidth, barHeight);
    p.fill(0, 255, 0);
    p.rect(20, 65, barWidth * healthRatio, barHeight);
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();
    p.rect(20, 65, barWidth, barHeight);
  }
}
```

## Pause Overlay
```javascript
function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}
```

## Game Over Screen
```javascript
function renderGameOver(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game Over text
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  p.fill(isWin ? 0 : 255, isWin ? 255 : 0, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Final score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Restart instruction
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}
```

# Game Types and Implementation Patterns

## 2D Platformer
```javascript
function setupPlatformer(p) {
  // Create ground
  const ground = new Platform(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 50);
  gameState.platforms.push(ground);
  
  // Create platforms at different heights
  const platforms = [
    new Platform(p, 150, CANVAS_HEIGHT - 100, 100, 20),
    new Platform(p, 350, CANVAS_HEIGHT - 150, 100, 20),
    new Platform(p, 550, CANVAS_HEIGHT - 200, 100, 20)
  ];
  gameState.platforms.push(...platforms);
  
  // Create collectibles
  for (let i = 0; i < 10; i++) {
    const x = p.random(50, CANVAS_WIDTH - 50);
    const y = p.random(50, CANVAS_HEIGHT - 100);
    gameState.collectibles.push(new Collectible(p, x, y));
  }
  
  // Create player
  gameState.player = new Player(p, 50, CANVAS_HEIGHT - 100);
}
```

## Physics Puzzle Game
```javascript
function setupPhysicsPuzzle(p) {
  // Create base platform
  const base = new Platform(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 100);
  gameState.platforms.push(base);
  
  // Create puzzle pieces (boxes that can be stacked)
  const pieces = [
    Bodies.rectangle(100, 100, 50, 50, { label: 'piece' }),
    Bodies.rectangle(200, 100, 50, 50, { label: 'piece' }),
    Bodies.rectangle(300, 100, 50, 50, { label: 'piece' })
  ];
  
  pieces.forEach(piece => {
    World.add(gameState.world, piece);
    gameState.entities.push({ body: piece, color: [100, 150, 200] });
  });
  
  // Goal: Stack pieces to reach target height
  gameState.goalHeight = 200;
}
```

## Angry Birds Style Game
```javascript
function setupAngryBirds(p) {
  // Create slingshot
  const slingshot = Bodies.rectangle(100, CANVAS_HEIGHT - 100, 20, 60, {
    isStatic: true,
    label: 'slingshot'
  });
  World.add(gameState.world, slingshot);
  
  // Create target structures
  const structures = [
    Bodies.rectangle(400, CANVAS_HEIGHT - 50, 30, 100, { label: 'structure' }),
    Bodies.rectangle(450, CANVAS_HEIGHT - 50, 30, 100, { label: 'structure' }),
    Bodies.rectangle(425, CANVAS_HEIGHT - 100, 80, 30, { label: 'structure' })
  ];
  structures.forEach(struct => World.add(gameState.world, struct));
  
  // Create player projectile (bird)
  gameState.player = new Player(p, 100, CANVAS_HEIGHT - 150);
}
```

## Racing Game
```javascript
function setupRacingGame(p) {
  // Create track boundaries
  const leftWall = Bodies.rectangle(50, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, {
    isStatic: true,
    label: 'wall'
  });
  const rightWall = Bodies.rectangle(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, {
    isStatic: true,
    label: 'wall'
  });
  World.add(gameState.world, [leftWall, rightWall]);
  
  // Create vehicle (player)
  const vehicle = Bodies.rectangle(100, CANVAS_HEIGHT - 100, 40, 20, {
    label: 'player',
    friction: 0.8,
    density: 0.001
  });
  World.add(gameState.world, vehicle);
  gameState.player = { body: vehicle, color: [255, 0, 0] };
  
  // Create obstacles
  for (let i = 0; i < 5; i++) {
    const obstacle = Bodies.rectangle(
      p.random(100, CANVAS_WIDTH - 100),
      p.random(100, CANVAS_HEIGHT - 100),
      30, 30,
      { label: 'obstacle' }
    );
    World.add(gameState.world, obstacle);
  }
}
```

# Performance Optimization

## Body Pooling
```javascript
class BodyPool {
  constructor(createFn, initialSize = 10) {
    this.createFn = createFn;
    this.pool = [];
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }
  
  release(body) {
    // Reset body state
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    Body.setPosition(body, { x: -1000, y: -1000 }); // Move off-screen
    this.pool.push(body);
  }
}

// Usage
const projectilePool = new BodyPool(() => {
  return Bodies.circle(0, 0, 5, { label: 'projectile' });
}, 20);
```

## Spatial Optimization
```javascript
// Use Matter.js Query for efficient collision detection
function getNearbyBodies(body, radius) {
  const center = body.position;
  const nearby = Query.region(gameState.world.bodies, {
    min: { x: center.x - radius, y: center.y - radius },
    max: { x: center.x + radius, y: center.y + radius }
  });
  return nearby;
}
```

## Render Optimization
```javascript
// Only render bodies that are visible
function renderGameOptimized(p) {
  p.background(135, 206, 235);
  
  // Get visible bodies (within camera view)
  const visibleBodies = Query.region(gameState.world.bodies, {
    min: { x: gameState.cameraX, y: gameState.cameraY },
    max: { x: gameState.cameraX + CANVAS_WIDTH, y: gameState.cameraY + CANVAS_HEIGHT }
  });
  
  // Render only visible bodies
  visibleBodies.forEach(body => {
    const entity = gameState.entities.find(e => e.body === body);
    if (entity) {
      entity.render(p);
    }
  });
}
```

# Common Patterns

## Input Handling
```javascript
const keys = {};

function handleGameplayInput(p, isPressed) {
  if (p.keyCode === 37 || p.keyCode === 65) { // Left Arrow or A
    keys.left = isPressed;
    if (isPressed && gameState.player) {
      gameState.player.moveLeft();
    }
  }
  
  if (p.keyCode === 39 || p.keyCode === 68) { // Right Arrow or D
    keys.right = isPressed;
    if (isPressed && gameState.player) {
      gameState.player.moveRight();
    }
  }
  
  if (p.keyCode === 38 || p.keyCode === 87) { // Up Arrow or W
    keys.up = isPressed;
  }
  
  if (p.keyCode === 40 || p.keyCode === 83) { // Down Arrow or S
    keys.down = isPressed;
  }
  
  if (p.keyCode === 32) { // Space
    if (isPressed && gameState.player) {
      gameState.player.jump();
    }
  }
}

// Continuous movement in update loop
function updateGame(p) {
  if (gameState.player) {
    if (keys.left) gameState.player.moveLeft();
    if (keys.right) gameState.player.moveRight();
    gameState.player.update();
  }
  
  gameState.enemies.forEach(enemy => enemy.update());
  gameState.collectibles.forEach(item => item.update());
  gameState.projectiles.forEach(projectile => projectile.update());
}
```

## Event System
```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Usage
const gameEvents = new EventEmitter();
gameEvents.on('playerDeath', () => {
  gameState.gamePhase = "GAME_OVER_LOSE";
});
gameEvents.emit('playerDeath');
```

## State Machine
```javascript
class StateMachine {
  constructor(initialState) {
    this.state = initialState;
    this.states = {};
  }
  
  addState(name, enterFn, updateFn, exitFn) {
    this.states[name] = { enter: enterFn, update: updateFn, exit: exitFn };
  }
  
  changeState(newState) {
    if (this.states[this.state] && this.states[this.state].exit) {
      this.states[this.state].exit();
    }
    this.state = newState;
    if (this.states[this.state] && this.states[this.state].enter) {
      this.states[this.state].enter();
    }
  }
  
  update() {
    if (this.states[this.state] && this.states[this.state].update) {
      this.states[this.state].update();
    }
  }
}
```

# Complete Game Loop Example

```javascript
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, Collectible, Platform } from './entities.js';
import { setupCollisionEvents } from './physics.js';
import { renderGame, renderStartScreen, renderPausedOverlay, renderGameOver, renderUI } from './renderer.js';

const keys = {};

function initializeGame(p) {
  // Create ground
  const ground = new Platform(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 50);
  gameState.platforms.push(ground);
  
  // Create player
  gameState.player = new Player(p, 100, CANVAS_HEIGHT - 100);
  
  // Create enemies
  for (let i = 0; i < 3; i++) {
    const enemy = new Enemy(p, 300 + i * 150, CANVAS_HEIGHT - 100);
    gameState.enemies.push(enemy);
  }
  
  // Create collectibles
  for (let i = 0; i < 10; i++) {
    const collectible = new Collectible(p, 
      p.random(50, CANVAS_WIDTH - 50),
      p.random(50, CANVAS_HEIGHT - 150)
    );
    gameState.collectibles.push(collectible);
  }
}

function updateGame(p) {
  // Update entities
  if (gameState.player) {
    // Handle continuous input
    if (keys.left) gameState.player.moveLeft();
    if (keys.right) gameState.player.moveRight();
    
    gameState.player.update();
  }
  
  gameState.enemies.forEach(enemy => enemy.update());
  gameState.collectibles.forEach(item => item.update());
  gameState.projectiles.forEach(projectile => projectile.update());
  
  // Check win/lose conditions
  checkGameConditions(p);
}

function checkGameConditions(p) {
  // Win condition: Collect all collectibles
  if (gameState.collectibles.length === 0) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      game_status: "GAME_OVER_WIN",
      data: { score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Lose condition: Player health <= 0
  if (gameState.player && gameState.player.health <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      game_status: "GAME_OVER_LOSE",
      data: { score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  // Clear all bodies from world
  World.clear(gameState.world, false);
  
  // Clear entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.collectibles = [];
  gameState.projectiles = [];
  gameState.platforms = [];
  
  // Reset score
  gameState.score = 0;
  
  // Reinitialize game
  initializeGame(p);
}

function handleGameplayInput(p, isPressed) {
  if (p.keyCode === 37 || p.keyCode === 65) { // Left Arrow or A
    keys.left = isPressed;
  }
  if (p.keyCode === 39 || p.keyCode === 68) { // Right Arrow or D
    keys.right = isPressed;
  }
  if (p.keyCode === 32) { // Space
    if (isPressed && gameState.player) {
      gameState.player.jump();
    }
  }
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    world.gravity.scale = 0.001;

    gameState.engine = engine;
    gameState.world = world;

    // Initialize logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Setup collision events
    setupCollisionEvents(engine, p);

    // Initialize game
    initializeGame(p);
  };

  p.draw = function() {
    // Update physics
    Engine.update(gameState.engine, 1000 / 60);

    // Update game state
    gameState.frameCount = p.frameCount;
    gameState.deltaTime = 1 / 60;

    // Render based on phase
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
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        game_status: "PLAYING",
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 82) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === "PLAYING") {
      handleGameplayInput(p, true);
    }

    return false;
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (gameState.gamePhase === "PLAYING") {
      handleGameplayInput(p, false);
    }

    return false;
  };
});

window.gameInstance = gameInstance;
```

# index.html Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Game Title</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 600px;
            height: 400px;
            overflow: hidden;
            margin: 0;
            padding: 0;
            background: #000;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <script>
        // Expose p5 globally for ES6 modules
        window.p5 = p5;
    </script>
</head>
<body>
    <script type="module" src="game.js"></script>
</body>
</html>
```

# Key Points

✅ **Use p5.js for:** Rendering, logging (p.logs), input handling, game loop, UI
✅ **Use Matter.js for:** Physics simulation, collision detection, realistic movement, constraints, joints
✅ **Render Matter bodies with p5.js:** Read body.position and body.angle, draw with p5 functions
✅ **Keep p.logs compatible:** Same logging structure as pure p5.js games
✅ **Don't reset p.logs:** Write-only, tracks entire game session
✅ **Game phases:** START → PLAYING → PAUSED → GAME_OVER_WIN/GAME_OVER_LOSE
✅ **Keyboard-only controls:** Arrow keys, WASD, Space, Shift, Z for gameplay
✅ **Phase controls:** ENTER to start, ESC to pause, R to restart
✅ **Procedural generation:** All geometry and bodies created in code
✅ **Performance:** Use body pooling, spatial queries, render optimization
✅ **Proper ES6 modules:** Import/export at top of files, no dynamic imports
✅ **Matter.js best practices:** Don't create/destroy bodies every frame, use events for collisions, leverage constraints for complex interactions
</instructions>
