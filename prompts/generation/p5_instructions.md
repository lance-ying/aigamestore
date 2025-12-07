{hard_constraints}

<instructions>
Write COMPREHENSIVE, DETAILED code for a fun, aesthetically pleasing, and responsive 2D gameplay experience using p5.js for rendering and 2D graphics.

**IMPORTANT: Generate EXTENSIVE, COMPLETE code. Include:**
- Multiple well-organized files with complete implementations
- Detailed entity classes with full functionality
- Comprehensive physics and collision systems
- Complete input handling and smooth controls
- Full UI rendering with all game screens
- Extensive game logic with proper state management
- Detailed comments explaining complex logic
- Error handling and edge cases
- Performance optimizations where appropriate

**Do not skimp on code - be thorough and comprehensive. Write as much code as needed to create a fully-featured, polished game.**

**TARGET CODE VOLUME:**
- Aim for 2000+ total lines of code across all JavaScript files
- Major files (game.js, entities.js) should be 400-800+ lines with extensive functionality
- Include multiple entity types, complex interactions, helper functions, and utility methods
- Add comprehensive error handling, edge cases, and defensive programming
- Implement rich game mechanics, multiple systems, and detailed implementations
- Use the full available token budget - do not stop early. Generate comprehensive, production-quality code.

# Code Architecture

- Organize the code into multiple files with organized code as needed (game.js, globals.js, entities.js, physics.js, input.js, ui.js, particles.js, etc.)
- Use proper ES6 Imports and Exports:
    - No Node.js style require() imports. No dynamic imports within functions.
    - Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of files where they are used. Example:
    ```javascript
    // Essential pattern (ALWAYS follow this)
    import { Player, Enemy, Collectible } from './entities.js';
    import { checkCollision, applyPhysics } from './physics.js';
    import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
    import { handleInput } from './input.js';
    import { renderUI } from './ui.js';

    // Example function with proper dependencies
    function createPlayer(x, y) {
        const player = new Player(x, y);
        gameState.player = player;
        gameState.entities.push(player);
        return player;
    }
    ```

- File organization pattern:
  - `globals.js` - Constants, gameState, logs initialization
  - `entities.js` - Entity classes (Player, Enemy, Collectible, Projectile, Platform, etc.)
  - `physics.js` - Collision detection, physics calculations, spatial partitioning
  - `input.js` - Input handling and keyboard state management
  - `ui.js` - UI rendering, game screens, HUD
  - `particles.js` - Particle system classes and effects
  - `game.js` - Main game loop, p5.js instance mode setup
  - `index.html` - HTML file that includes p5.js and loads game.js as module

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
      
      // Physics state
      gravity: 0.5,           // Gravity strength (positive = down)
      friction: 0.9,         // Friction coefficient
      airResistance: 0.98,    // Air resistance multiplier
      
      // Game-specific state
      collectibles: [],       // Collectible items
      enemies: [],            // Enemy entities
      platforms: [],          // Platform/obstacle entities
      projectiles: [],       // Projectile entities
      particles: [],          // Particle effects
      
      // Performance tracking
      frameCount: 0,          // Current frame number
      lastFrameTime: 0,       // Last frame timestamp for delta time
      deltaTime: 0,           // Time since last frame
      
      // Camera/viewport (for scrolling games)
      cameraX: 0,             // Camera X position
      cameraY: 0,             // Camera Y position
      cameraTarget: null,     // Entity to follow with camera
      
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

# p5.js Setup and Configuration

## Instance Mode Setup

**CRITICAL: Always use p5.js in instance mode, never global mode.**

```javascript
const p5 = window.p5; // Get p5 from window (loaded via script tag)

let gameInstance = new p5(p => {
    // Initialize variables
    let player;
    let enemies = [];
    
    // Initialize the logs. Important: Do not reset the logs at any point in the code! logs are considered write-only!
    p.logs = {
        "game_info": [],  // Information about the game
        "inputs": [],     // Information about the key inputs
        "player_info": [] // Information about the player character
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42); // Set seed ONCE in setup, never in draw()
        
        // Initialize game state
        gameState.gamePhase = "START";
        gameState.controlMode = "HUMAN";
        
        // Log initial state
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update frame count
        gameState.frameCount = p.frameCount;
        
        // Update delta time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // CRITICAL: Exactly one background() call at the top of draw()
        p.background(20, 20, 30);
        
        // Update and render based on game phase
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
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
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

// Expose the game instance globally
window.gameInstance = gameInstance;
```

## Canvas Configuration

```javascript
p.setup = function() {
    // Create canvas with specific dimensions
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Set frame rate (60 FPS is standard)
    p.frameRate(60);
    
    // Set pixel density for high-DPI displays
    p.pixelDensity(1); // Use 1 for performance, 2 for crisp rendering on retina
    
    // Set color mode (RGB is default, but can use HSB)
    p.colorMode(p.RGB, 255); // RGB mode, 0-255 range
    // p.colorMode(p.HSB, 360, 100, 100); // HSB mode for color manipulation
    
    // Set text properties
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
};
```

## Coordinate System

- **Origin (0, 0)**: Top-left corner of canvas
- **X-axis**: Increases from left to right (0 to CANVAS_WIDTH)
- **Y-axis**: Increases from top to bottom (0 to CANVAS_HEIGHT)
- **Angles**: Measured in radians, 0 radians = pointing right, PI/2 = pointing down

# 2D Geometry and Shapes

## Basic Shapes

### Rectangle
```javascript
// Draw rectangle at position
p.rect(x, y, width, height);

// Rectangle with rounded corners
p.rect(x, y, width, height, cornerRadius);
p.rect(x, y, width, height, topLeft, topRight, bottomRight, bottomLeft);

// Rectangle from center
p.rectMode(p.CENTER);
p.rect(x, y, width, height);

// Rectangle from corner (default)
p.rectMode(p.CORNER);
p.rect(x, y, width, height);
```

### Circle/Ellipse
```javascript
// Circle
p.circle(x, y, diameter);

// Ellipse
p.ellipse(x, y, width, height);

// Ellipse mode
p.ellipseMode(p.CENTER); // Default - x, y is center
p.ellipseMode(p.CORNER); // x, y is top-left corner
p.ellipseMode(p.CORNERS); // x, y and width, height are opposite corners
```

### Line
```javascript
// Single line
p.line(x1, y1, x2, y2);

// Multiple lines
p.beginShape();
p.vertex(x1, y1);
p.vertex(x2, y2);
p.vertex(x3, y3);
p.endShape(p.CLOSE); // CLOSE connects last point to first
```

### Triangle
```javascript
p.triangle(x1, y1, x2, y2, x3, y3);
```

### Quad
```javascript
p.quad(x1, y1, x2, y2, x3, y3, x4, y4);
```

### Arc
```javascript
// Arc: x, y, width, height, start angle, stop angle
p.arc(x, y, width, height, startAngle, stopAngle);

// Arc modes
p.arcMode(p.PIE); // Default - closed pie slice
p.arcMode(p.OPEN); // Open arc
p.arcMode(p.CHORD); // Closed with chord
```

### Custom Shapes with beginShape
```javascript
// Custom polygon
p.beginShape();
p.vertex(x1, y1);
p.vertex(x2, y2);
p.vertex(x3, y3);
p.vertex(x4, y4);
p.endShape(p.CLOSE);

// Shape with curves
p.beginShape();
p.vertex(x1, y1);
p.quadraticVertex(cx, cy, x2, y2); // Quadratic bezier curve
p.bezierVertex(cx1, cy1, cx2, cy2, x3, y3); // Cubic bezier curve
p.endShape();
```

## Shape Properties

```javascript
// Fill color
p.fill(255);              // Grayscale
p.fill(255, 0, 0);        // RGB
p.fill(255, 0, 0, 128);   // RGBA with alpha
p.fill('#ff0000');        // Hex color
p.noFill();               // No fill

// Stroke color
p.stroke(0);              // Grayscale
p.stroke(255, 0, 0);      // RGB
p.stroke(255, 0, 0, 128); // RGBA
p.stroke('#0000ff');      // Hex color
p.noStroke();             // No stroke

// Stroke weight
p.strokeWeight(2);        // Line thickness in pixels

// Stroke join and cap
p.strokeJoin(p.MITER);    // MITER, BEVEL, ROUND
p.strokeCap(p.ROUND);     // ROUND, SQUARE, PROJECT
```

# Colors and Styling

## Color Functions

```javascript
// Create color objects
const red = p.color(255, 0, 0);
const green = p.color(0, 255, 0);
const blue = p.color(0, 0, 255);
const white = p.color(255);
const black = p.color(0);

// Color with alpha
const transparent = p.color(255, 0, 0, 128);

// Get color components
const r = p.red(red);
const g = p.green(green);
const b = p.blue(blue);
const a = p.alpha(transparent);

// Color manipulation
const darker = p.color(p.red(red) * 0.5, p.green(red) * 0.5, p.blue(red) * 0.5);
const brighter = p.color(p.min(255, p.red(red) * 1.5), p.min(255, p.green(red) * 1.5), p.min(255, p.blue(red) * 1.5));
```

## Gradients

```javascript
// Linear gradient using lerpColor
function drawGradient(x, y, width, height, color1, color2) {
    for (let i = 0; i <= height; i++) {
        const inter = p.map(i, 0, height, 0, 1);
        const c = p.lerpColor(color1, color2, inter);
        p.stroke(c);
        p.line(x, y + i, x + width, y + i);
    }
}

// Radial gradient
function drawRadialGradient(x, y, radius, color1, color2) {
    for (let r = radius; r > 0; r--) {
        const inter = p.map(r, 0, radius, 0, 1);
        const c = p.lerpColor(color2, color1, inter);
        p.fill(c);
        p.noStroke();
        p.circle(x, y, r * 2);
    }
}
```

## Patterns and Textures

```javascript
// Checkerboard pattern
function drawCheckerboard(x, y, width, height, tileSize) {
    for (let i = 0; i < width; i += tileSize) {
        for (let j = 0; j < height; j += tileSize) {
            const isEven = ((i / tileSize) + (j / tileSize)) % 2 === 0;
            p.fill(isEven ? 255 : 0);
            p.rect(x + i, y + j, tileSize, tileSize);
        }
    }
}

// Noise-based texture
function drawNoiseTexture(x, y, width, height, scale) {
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const noiseValue = p.noise(i * scale, j * scale);
            const gray = p.map(noiseValue, 0, 1, 0, 255);
            p.stroke(gray);
            p.point(x + i, y + j);
        }
    }
}
```

# Transformations

## Basic Transformations

```javascript
// Push/pop matrix (CRITICAL for transformations)
p.push(); // Save current transformation matrix
// ... transformations and drawing ...
p.pop();  // Restore previous transformation matrix

// Translation (move origin)
p.translate(x, y);

// Rotation (around current origin)
p.rotate(angle); // Angle in radians
p.rotate(p.PI / 4); // 45 degrees

// Scale
p.scale(scaleX, scaleY); // Uniform scale
p.scale(2);             // Scale both axes by 2
p.scale(2, 1);         // Scale X by 2, Y by 1

// Shear
p.shearX(angle);
p.shearY(angle);
```

## Transformation Patterns

```javascript
// Rotate around a point
function drawRotatedShape(x, y, angle, shapeFunction) {
    p.push();
    p.translate(x, y);
    p.rotate(angle);
    p.translate(-x, -y); // Move origin back
    shapeFunction();
    p.pop();
}

// Scale from center
function drawScaledShape(x, y, scale, shapeFunction) {
    p.push();
    p.translate(x, y);
    p.scale(scale);
    p.translate(-x, -y);
    shapeFunction();
    p.pop();
}
```

# Animation

## Frame-Based Animation

```javascript
// Simple animation using frameCount
function animatePosition(baseX, baseY, amplitude, speed) {
    const x = baseX + p.sin(p.frameCount * speed) * amplitude;
    const y = baseY + p.cos(p.frameCount * speed) * amplitude;
    return { x, y };
}

// Pulsing effect
function animatePulse(baseSize, pulseAmount, speed) {
    const size = baseSize + p.sin(p.frameCount * speed) * pulseAmount;
    return size;
}

// Color animation
function animateColor(baseColor, colorShift, speed) {
    const hue = (p.hue(baseColor) + p.frameCount * speed) % 360;
    return p.color(hue, p.saturation(baseColor), p.brightness(baseColor));
}
```

## Easing and Interpolation

```javascript
// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Ease in (slow start)
function easeIn(t) {
    return t * t;
}

// Ease out (slow end)
function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
}

// Ease in-out (slow start and end)
function easeInOut(t) {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Usage in animation
class AnimatedValue {
    constructor(startValue) {
        this.current = startValue;
        this.target = startValue;
        this.speed = 0.1;
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    update() {
        this.current = lerp(this.current, this.target, this.speed);
    }
}
```

## Sprite Animation

```javascript
// Frame-based sprite animation
class AnimatedSprite {
    constructor(x, y, frames, frameRate = 10) {
        this.x = x;
        this.y = y;
        this.frames = frames; // Array of frame indices or images
        this.currentFrame = 0;
        this.frameRate = frameRate;
        this.frameCounter = 0;
    }
    
    update() {
        this.frameCounter++;
        if (this.frameCounter >= 60 / this.frameRate) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.frameCounter = 0;
        }
    }
    
    draw(p) {
        const frame = this.frames[this.currentFrame];
        // Draw frame at this.x, this.y
    }
}
```

# Physics and Collisions

## Basic Physics

### Velocity and Acceleration
```javascript
class PhysicsEntity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0; // Velocity X
        this.vy = 0; // Velocity Y
        this.ax = 0; // Acceleration X
        this.ay = 0; // Acceleration Y
        this.mass = 1.0;
    }
    
    update() {
        // Apply acceleration to velocity
        this.vx += this.ax;
        this.vy += this.ay;
        
        // Apply velocity to position
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply friction
        this.vx *= gameState.friction;
        this.vy *= gameState.friction;
        
        // Reset acceleration
        this.ax = 0;
        this.ay = 0;
    }
    
    applyForce(fx, fy) {
        this.ax += fx / this.mass;
        this.ay += fy / this.mass;
    }
}
```

### Gravity
```javascript
class GravityEntity extends PhysicsEntity {
    update() {
        // Apply gravity
        this.applyForce(0, gameState.gravity);
        
        // Call parent update
        super.update();
        
        // Ground collision
        const groundY = CANVAS_HEIGHT - 50;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }
}
```

## Collision Detection with p5.collide2D

### Rectangle-Rectangle Collision
```javascript
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

function checkRectRectCollision(rect1, rect2) {
    return collideRectRect(
        rect1.x, rect1.y, rect1.width, rect1.height,
        rect2.x, rect2.y, rect2.width, rect2.height
    );
}
```

### Circle-Circle Collision
```javascript
import { collideCircleCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

function checkCircleCircleCollision(circle1, circle2) {
    return collideCircleCircle(
        circle1.x, circle1.y, circle1.radius,
        circle2.x, circle2.y, circle2.radius
    );
}
```

### Rectangle-Circle Collision
```javascript
import { collideRectCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

function checkRectCircleCollision(rect, circle) {
    return collideRectCircle(
        rect.x, rect.y, rect.width, rect.height,
        circle.x, circle.y, circle.radius
    );
}
```

### Point Collision
```javascript
import { collidePointRect, collidePointCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

function checkPointRectCollision(point, rect) {
    return collidePointRect(point.x, point.y, rect.x, rect.y, rect.width, rect.height);
}

function checkPointCircleCollision(point, circle) {
    return collidePointCircle(point.x, point.y, circle.x, circle.y, circle.radius);
}
```

### Polygon Collision
```javascript
import { collidePolyPoly, collideCirclePoly, collideRectPoly } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

function checkPolyPolyCollision(poly1, poly2) {
    return collidePolyPoly(
        poly1.vertices, // Array of {x, y} points
        poly2.vertices,
        true // Optional: check for overlap
    );
}
```

## Manual Collision Detection

### AABB (Axis-Aligned Bounding Box)
```javascript
function checkAABBCollision(box1, box2) {
    return (
        box1.x < box2.x + box2.width &&
        box1.x + box1.width > box2.x &&
        box1.y < box2.y + box2.height &&
        box1.y + box1.height > box2.y
    );
}
```

### Circle Collision
```javascript
function checkCircleCollision(circle1, circle2) {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
}
```

### Collision Response
```javascript
function handleCollisionResponse(entity1, entity2) {
    // Calculate collision normal
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return; // Avoid division by zero
    
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    // Separate entities
    const overlap = (entity1.radius + entity2.radius) - distance;
    const separationX = normalX * overlap * 0.5;
    const separationY = normalY * overlap * 0.5;
    
    entity1.x -= separationX;
    entity1.y -= separationY;
    entity2.x += separationX;
    entity2.y += separationY;
    
    // Calculate relative velocity
    const relativeVx = entity2.vx - entity1.vx;
    const relativeVy = entity2.vy - entity1.vy;
    
    // Calculate velocity along normal
    const velocityAlongNormal = relativeVx * normalX + relativeVy * normalY;
    
    // Do not resolve if velocities are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate restitution (bounciness)
    const restitution = 0.8;
    const impulse = -(1 + restitution) * velocityAlongNormal;
    const impulseScalar = impulse / (entity1.mass + entity2.mass);
    
    // Apply impulse
    entity1.vx -= impulseScalar * normalX * entity2.mass;
    entity1.vy -= impulseScalar * normalY * entity2.mass;
    entity2.vx += impulseScalar * normalX * entity1.mass;
    entity2.vy += impulseScalar * normalY * entity1.mass;
}
```

## Spatial Partitioning (Performance)

### Grid-Based Spatial Hashing
```javascript
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    insert(entity) {
        const key = this.getCellKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }
    
    getNearbyEntities(entity) {
        const nearby = [];
        const radius = 2; // Check neighboring cells
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = this.getCellKey(
                    entity.x + dx * this.cellSize,
                    entity.y + dy * this.cellSize
                );
                
                if (this.grid.has(key)) {
                    nearby.push(...this.grid.get(key));
                }
            }
        }
        
        return nearby;
    }
    
    clear() {
        this.grid.clear();
    }
}
```

# Input Handling

## Keyboard Input

```javascript
// Key state tracking
const keys = {};

p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
    
    // Handle phase controls
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({
                data: { gamePhase: "PLAYING" },
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === 82) { // R - Restart
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame();
            gameState.gamePhase = "START";
        }
    }
};

p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    // Log input
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
};

// Check if key is currently pressed
function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

// Key constants
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
```

## Mouse Input

```javascript
p.mousePressed = function() {
    // Handle mouse click
    if (gameState.gamePhase === "PLAYING") {
        // Create projectile at mouse position
        const projectile = new Projectile(
            gameState.player.x,
            gameState.player.y,
            p.mouseX,
            p.mouseY
        );
        gameState.projectiles.push(projectile);
    }
};

p.mouseMoved = function() {
    // Track mouse position
    gameState.mouseX = p.mouseX;
    gameState.mouseY = p.mouseY;
};

// Check mouse position
function isMouseOver(x, y, width, height) {
    return (
        p.mouseX >= x &&
        p.mouseX <= x + width &&
        p.mouseY >= y &&
        p.mouseY <= y + height
    );
}
```

# Rendering Patterns

## Render Order

```javascript
p.draw = function() {
    p.background(20, 20, 30);
    
    // Render in correct order (back to front)
    // 1. Background elements
    renderBackground(p);
    
    // 2. Platforms/obstacles
    gameState.platforms.forEach(platform => platform.render(p));
    
    // 3. Collectibles
    gameState.collectibles.forEach(item => item.render(p));
    
    // 4. Enemies
    gameState.enemies.forEach(enemy => enemy.render(p));
    
    // 5. Player (on top)
    if (gameState.player) {
        gameState.player.render(p);
    }
    
    // 6. Projectiles
    gameState.projectiles.forEach(projectile => projectile.render(p));
    
    // 7. Particles (effects on top)
    gameState.particles.forEach(particle => particle.render(p));
    
    // 8. UI (always on top)
    renderUI(p);
};
```

## Camera/Viewport (Scrolling)

```javascript
// Camera following player
function updateCamera() {
    if (gameState.player && gameState.cameraTarget === null) {
        gameState.cameraTarget = gameState.player;
    }
    
    if (gameState.cameraTarget) {
        // Smooth camera following
        const targetX = gameState.cameraTarget.x - CANVAS_WIDTH / 2;
        const targetY = gameState.cameraTarget.y - CANVAS_HEIGHT / 2;
        
        gameState.cameraX = p.lerp(gameState.cameraX, targetX, 0.1);
        gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
        
        // Clamp camera to world bounds
        gameState.cameraX = p.constrain(gameState.cameraX, 0, worldWidth - CANVAS_WIDTH);
        gameState.cameraY = p.constrain(gameState.cameraY, 0, worldHeight - CANVAS_HEIGHT);
    }
}

// Render with camera offset
function renderWithCamera(entity) {
    const screenX = entity.x - gameState.cameraX;
    const screenY = entity.y - gameState.cameraY;
    
    // Only render if on screen
    if (screenX > -entity.width && screenX < CANVAS_WIDTH + entity.width &&
        screenY > -entity.height && screenY < CANVAS_HEIGHT + entity.height) {
        entity.renderAt(p, screenX, screenY);
    }
}
```

## Avoiding Flickering

```javascript
// CRITICAL: Never do these in draw()
p.draw = function() {
    // ❌ WRONG: Don't call randomSeed in draw()
    // p.randomSeed(42);
    
    // ❌ WRONG: Don't sample random values every frame
    // p.fill(p.random(255), p.random(255), p.random(255));
    
    // ✅ CORRECT: Use conditional rendering with ternary
    p.fill(...(condition ? [255, 220, 150] : [40, 30, 20]));
    
    // ✅ CORRECT: Exactly one background() call at top
    p.background(20, 20, 30);
    
    // ✅ CORRECT: Use frameCount for animation
    const offset = p.sin(p.frameCount * 0.1) * 10;
};
```

# Entity Classes

## Comprehensive Player Class

```javascript
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = -12;
        this.onGround = false;
        
        // Game properties
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        
        // State
        this.facing = 1; // 1 = right, -1 = left
        this.isMoving = false;
        this.lastPosition = { x: x, y: y };
        
        // Add to entities
        gameState.player = this;
        gameState.entities.push(this);
    }
    
    update(p) {
        // Apply gravity
        if (!this.onGround) {
            this.vy += gameState.gravity;
        }
        
        // Apply friction when on ground
        if (this.onGround) {
            this.vx *= 0.8;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Check ground collision
        this.checkGroundCollision();
        
        // Check wall collision
        this.checkWallCollision();
        
        // Log position changes
        if (Math.abs(this.x - this.lastPosition.x) > 1 || 
            Math.abs(this.y - this.lastPosition.y) > 1) {
            this.logPosition(p);
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
        }
    }
    
    checkGroundCollision() {
        const groundY = CANVAS_HEIGHT - 50;
        if (this.y + this.height / 2 >= groundY) {
            this.y = groundY - this.height / 2;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }
    
    checkWallCollision() {
        // Left wall
        if (this.x - this.width / 2 < 0) {
            this.x = this.width / 2;
            this.vx = 0;
        }
        // Right wall
        if (this.x + this.width / 2 > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width / 2;
            this.vx = 0;
        }
    }
    
    moveLeft() {
        this.vx = -this.speed;
        this.facing = -1;
        this.isMoving = true;
    }
    
    moveRight() {
        this.vx = this.speed;
        this.facing = 1;
        this.isMoving = true;
    }
    
    jump() {
        if (this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
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
    }
    
    logPosition(p) {
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                screen_x: this.x,
                screen_y: this.y,
                game_x: this.x,
                game_y: this.y,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Flip sprite if facing left
        if (this.facing < 0) {
            p.scale(-1, 1);
        }
        
        // Draw player
        p.fill(0, 255, 0);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        
        // Draw eyes
        p.fill(255);
        p.circle(-8, -5, 5);
        p.circle(8, -5, 5);
        p.fill(0);
        p.circle(-8, -5, 2);
        p.circle(8, -5, 2);
        
        p.pop();
    }
}
```

## Enemy Class with AI

```javascript
export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.radius = 12.5;
        
        this.vx = 0;
        this.vy = 0;
        this.speed = 2;
        this.health = 50;
        this.damage = 10;
        this.attackRange = 50;
        this.detectionRange = 200;
        
        gameState.enemies.push(this);
        gameState.entities.push(this);
    }
    
    update(p) {
        if (!gameState.player) return;
        
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // AI behavior
        if (distance < this.detectionRange) {
            // Move towards player
            const angle = Math.atan2(dy, dx);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Attack if in range
            if (distance < this.attackRange) {
                this.attack();
            }
        }
        
        // Apply gravity
        this.vy += gameState.gravity;
        
        // Ground collision
        const groundY = CANVAS_HEIGHT - 50;
        if (this.y + this.radius >= groundY) {
            this.y = groundY - this.radius;
            this.vy = 0;
        }
    }
    
    attack() {
        if (gameState.player) {
            gameState.player.takeDamage(this.damage);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        const index = gameState.enemies.indexOf(this);
        if (index > -1) {
            gameState.enemies.splice(index, 1);
        }
        const entityIndex = gameState.entities.indexOf(this);
        if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
        }
    }
    
    render(p) {
        p.fill(255, 0, 0);
        p.circle(this.x, this.y, this.radius * 2);
    }
}
```

## Collectible Class

```javascript
export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.value = 10;
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
        this.initialY = y;
        
        gameState.collectibles.push(this);
        gameState.entities.push(this);
    }
    
    update(p) {
        // Rotate
        this.rotation += this.rotationSpeed;
        
        // Bob up and down
        this.bobOffset = p.sin(p.frameCount * this.bobSpeed) * 5;
        this.y = this.initialY + this.bobOffset;
        
        // Check collision with player
        if (gameState.player) {
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.radius + gameState.player.width / 2) {
                this.collect();
            }
        }
    }
    
    collect() {
        if (gameState.player) {
            gameState.player.score += this.value;
            gameState.score += this.value;
        }
        
        const index = gameState.collectibles.indexOf(this);
        if (index > -1) {
            gameState.collectibles.splice(index, 1);
        }
        const entityIndex = gameState.entities.indexOf(this);
        if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        p.fill(255, 255, 0);
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.star(0, 0, this.radius, this.radius * 0.5, 5);
        
        p.pop();
    }
}
```

## Projectile Class

```javascript
export class Projectile {
    constructor(x, y, targetX, targetY, speed = 10) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * speed;
        this.vy = (dy / distance) * speed;
        
        this.lifetime = 60; // Frames
        this.age = 0;
        this.damage = 20;
        
        gameState.projectiles.push(this);
        gameState.entities.push(this);
    }
    
    update(p) {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Update age
        this.age++;
        
        // Remove if expired
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Check bounds
        if (this.x < 0 || this.x > CANVAS_WIDTH ||
            this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.destroy();
            return;
        }
        
        // Check collision with enemies
        for (const enemy of gameState.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.radius + enemy.radius) {
                enemy.takeDamage(this.damage);
                this.destroy();
                return;
            }
        }
    }
    
    destroy() {
        const index = gameState.projectiles.indexOf(this);
        if (index > -1) {
            gameState.projectiles.splice(index, 1);
        }
        const entityIndex = gameState.entities.indexOf(this);
        if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
        }
    }
    
    render(p) {
        p.fill(255, 255, 0);
        p.circle(this.x, this.y, this.radius * 2);
    }
}
```

## Platform Class

```javascript
export class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        gameState.platforms.push(this);
    }
    
    checkCollision(entity) {
        return (
            entity.x < this.x + this.width &&
            entity.x + entity.width > this.x &&
            entity.y < this.y + this.height &&
            entity.y + entity.height > this.y
        );
    }
    
    render(p) {
        p.fill(100);
        p.rect(this.x, this.y, this.width, this.height);
    }
}
```

# Particle Systems

## Basic Particle Class

```javascript
export class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.lifetime = 30;
        this.age = 0;
        this.size = Math.random() * 5 + 2;
        this.color = [255, 200, 0];
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.age++;
        
        // Fade out
        const alpha = 1 - (this.age / this.lifetime);
        this.alpha = alpha;
    }
    
    isDead() {
        return this.age >= this.lifetime;
    }
    
    render(p) {
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha * 255);
        p.noStroke();
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}
```

## Particle System

```javascript
export class ParticleSystem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.emissionRate = 5; // Particles per frame
        this.emissionCounter = 0;
    }
    
    update() {
        // Emit new particles
        this.emissionCounter++;
        if (this.emissionCounter >= 60 / this.emissionRate) {
            for (let i = 0; i < 3; i++) {
                this.particles.push(new Particle(this.x, this.y));
            }
            this.emissionCounter = 0;
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(p) {
        this.particles.forEach(particle => particle.render(p));
    }
}
```

# Game Screens and UI

## Start Screen

```javascript
function renderStartScreen(p) {
    // Background
    p.background(20, 20, 30);
    
    // Title
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('Game Title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    // Instructions
    p.textSize(20);
    p.text('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Controls
    p.textSize(14);
    p.text('Arrow Keys: Move | Space: Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.text('ESC: Pause | R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}
```

## Playing Screen (HUD)

```javascript
function renderUI(p) {
    // Score
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Health bar
    if (gameState.player) {
        const barWidth = 200;
        const barHeight = 20;
        const barX = 10;
        const barY = 40;
        const healthRatio = gameState.player.health / gameState.player.maxHealth;
        
        // Background
        p.fill(100, 0, 0);
        p.rect(barX, barY, barWidth, barHeight);
        
        // Health fill
        p.fill(0, 255, 0);
        p.rect(barX, barY, barWidth * healthRatio, barHeight);
        
        // Border
        p.noFill();
        p.stroke(255);
        p.strokeWeight(2);
        p.rect(barX, barY, barWidth, barHeight);
        
        // Health text
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(
            `${gameState.player.health}/${gameState.player.maxHealth}`,
            barX + barWidth / 2,
            barY + barHeight / 2
        );
    }
    
    // Never display controlMode
    // ❌ p.text(`Mode: ${gameState.controlMode}`, 10, 70);
}
```

## Paused Overlay

```javascript
function renderPausedOverlay(p) {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Paused text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(20);
    p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}
```

## Game Over Screen

```javascript
function renderGameOver(p) {
    // Background overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Game over text
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(isWin ? 0 : 255, isWin ? 255 : 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    // Final score
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Restart instruction
    p.textSize(20);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}
```

# Game Types and Implementation Patterns

## Platformer

```javascript
function setupPlatformer() {
    // Create platforms
    gameState.platforms = [
        new Platform(100, 300, 150, 20),
        new Platform(300, 250, 150, 20),
        new Platform(500, 200, 150, 20),
        new Platform(700, 150, 150, 20) // Goal platform
    ];
    
    // Create collectibles
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 300;
        gameState.collectibles.push(new Collectible(x, y));
    }
    
    // Create player
    gameState.player = new Player(50, 350);
}
```

## Top-Down Shooter

```javascript
function setupTopDownShooter() {
    // Create player at center
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Spawn enemies
    function spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * CANVAS_WIDTH;
                y = -20;
                break;
            case 1: // Right
                x = CANVAS_WIDTH + 20;
                y = Math.random() * CANVAS_HEIGHT;
                break;
            case 2: // Bottom
                x = Math.random() * CANVAS_WIDTH;
                y = CANVAS_HEIGHT + 20;
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * CANVAS_HEIGHT;
                break;
        }
        
        gameState.enemies.push(new Enemy(x, y));
    }
    
    // Spawn enemies periodically
    setInterval(spawnEnemy, 2000);
}
```

## Side-Scrolling Runner

```javascript
function setupSideScroller() {
    // Create player
    gameState.player = new Player(100, CANVAS_HEIGHT / 2);
    
    // Generate obstacles
    function generateObstacle() {
        const x = CANVAS_WIDTH + 50;
        const y = CANVAS_HEIGHT - 50 - Math.random() * 100;
        gameState.platforms.push(new Platform(x, y, 30, 50));
    }
    
    // Generate obstacles periodically
    setInterval(generateObstacle, 1500);
    
    // Scroll camera
    function updateCamera() {
        if (gameState.player) {
            gameState.cameraX = gameState.player.x - 100;
        }
    }
}
```

## Puzzle Game

```javascript
function setupPuzzleGame() {
    // Create puzzle pieces
    const pieces = [];
    for (let i = 0; i < 9; i++) {
        const x = (i % 3) * 100 + 50;
        const y = Math.floor(i / 3) * 100 + 50;
        pieces.push(new PuzzlePiece(x, y, i));
    }
    
    // Shuffle pieces
    shuffleArray(pieces);
    
    gameState.puzzlePieces = pieces;
    gameState.goalState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
}
```

# Performance Optimization

## Object Pooling

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
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
    
    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
}

// Usage
const projectilePool = new ObjectPool(
    () => new Projectile(0, 0, 0, 0),
    (proj) => { proj.age = 0; proj.x = 0; proj.y = 0; },
    20
);

const projectile = projectilePool.acquire();
// ... use projectile
projectilePool.release(projectile);
```

## Efficient Collision Detection

```javascript
// Use spatial grid (see Spatial Partitioning section)
const spatialGrid = new SpatialGrid(100);

function updateCollisions() {
    spatialGrid.clear();
    
    // Insert all entities
    gameState.entities.forEach(entity => {
        spatialGrid.insert(entity);
    });
    
    // Check collisions only for nearby entities
    gameState.entities.forEach(entity => {
        const nearby = spatialGrid.getNearbyEntities(entity);
        nearby.forEach(other => {
            if (entity !== other && checkCollision(entity, other)) {
                handleCollision(entity, other);
            }
        });
    });
}
```

## Render Optimization

```javascript
// Only render entities on screen
function renderEntity(entity) {
    const screenX = entity.x - gameState.cameraX;
    const screenY = entity.y - gameState.cameraY;
    
    // Cull off-screen entities
    if (screenX + entity.width < 0 || screenX > CANVAS_WIDTH ||
        screenY + entity.height < 0 || screenY > CANVAS_HEIGHT) {
        return; // Don't render
    }
    
    entity.renderAt(p, screenX, screenY);
}
```

# Common Patterns

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

// Usage
const playerState = new StateMachine('idle');
playerState.addState('idle', () => {}, () => {}, () => {});
playerState.addState('running', () => {}, () => {}, () => {});
playerState.changeState('running');
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

# Automated Testing

## Automated Testing Controller

```javascript
// automated_testing_controller.js
function getTestWinAction(gameState) {
    // Implement optimal strategy to win
    if (!gameState.player) return null;
    
    // Example: Move towards nearest collectible
    if (gameState.collectibles.length > 0) {
        const nearest = gameState.collectibles.reduce((closest, item) => {
            const dist1 = Math.sqrt(
                Math.pow(gameState.player.x - closest.x, 2) +
                Math.pow(gameState.player.y - closest.y, 2)
            );
            const dist2 = Math.sqrt(
                Math.pow(gameState.player.x - item.x, 2) +
                Math.pow(gameState.player.y - item.y, 2)
            );
            return dist1 < dist2 ? closest : item;
        });
        
        const dx = nearest.x - gameState.player.x;
        const dy = nearest.y - gameState.player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Right or Left
        } else {
            return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // Down or Up
        }
    }
    
    return null;
}

function getRandomAction(gameState) {
    const actions = [37, 38, 39, 40, 32]; // Arrow keys + Space
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
    switch (gameState.controlMode) {
        case "TEST_1":
            return getTestWinAction(gameState);
        case "TEST_2":
            return getRandomAction(gameState);
        default:
            return null;
    }
}

window.get_automated_testing_action = get_automated_testing_action;
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
        
        canvas {
            display: block;
            margin: 0;
            padding: 0;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/seedrandom@3.0.5/seedrandom.min.js"></script>
</head>
<body>
    <script type="module" src="game.js"></script>
</body>
</html>
```

# Key Points

✅ **Use p5.js in instance mode:** Always use `new p5(p => { ... })` and expose as `window.gameInstance`
✅ **Implement physics manually:** Gravity, velocity, acceleration, collision detection
✅ **Use proper ES6 modules:** Import/export at top of files, no dynamic imports
✅ **Maintain logs structure:** game_info, player_info, inputs with framecount and timestamp
✅ **Don't reset logs:** Write-only, tracks entire game session
✅ **Game phases:** START → PLAYING → PAUSED → GAME_OVER_WIN/GAME_OVER_LOSE
✅ **Keyboard-only controls:** Arrow keys, Space, Shift, Z for gameplay
✅ **Phase controls:** ENTER to start, ESC to pause, R to restart
✅ **Avoid flickering:** Exactly one background() call at top of draw(), use ternary for conditional colors, never call randomSeed() in draw()
✅ **Procedural generation:** All shapes, colors, and effects created in code
✅ **Performance:** Use object pooling, spatial partitioning, culling for optimization
✅ **Render order:** Background → Platforms → Collectibles → Enemies → Player → Projectiles → Particles → UI
✅ **Never display controlMode:** Do not show HUMAN/TESTING mode on canvas
</instructions>
