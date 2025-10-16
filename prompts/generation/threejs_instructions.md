<hard_constraints>
- Game must load without errors, start on pressing ENTER, gameplay must be responsive to player input, and should restart on pressing R.
- Game phases: "START" → "PLAYING" → "PAUSED" → "GAME_OVER_WIN" or "GAME_OVER_LOSE". Pressing R on the end screen takes you back to restart the game.
- Keyboard inputs only. No mouse control. Allowed keyboard keys:
  - Allowed gameplay control keys: Arrow keys (37-40), SPACE (32), SHIFT (16), Z (90), W (87), A (65), S (83), D (68)
  - Game phase specific controls:
    - ENTER (13) to start the game at the start screen
    - ESC (27) to pause the game
    - R (82) to restart the game. Pressing R takes you back to the start screen when the game is over so that the game can be played again.
- Allowed libraries: three.js (via ESM CDN: https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js)
- Ensure game reproducibility using Math.seedrandom (include via CDN) and call Math.seedrandom(42) at initialization. No other random seeding.
- Graphics and animations using three.js WebGL renderer only. No external models, textures, or assets. Create all 3D geometry procedurally.
- No audio or sound effects.
- Write modular ES6 code with proper imports and exports at the top of the file where they are used. No dynamic imports or require() imports.
- Maintain the logs object as write-only with proper initialization and updates during game loop.
- Expose globally the getGameState() function that returns the gameState object for game state inspection.
</hard_constraints>

<instructions>
Write as much code as needed for a fun, aesthetically pleasing, and responsive 3D gameplay experience.

# Code Architecture
- Organize the code into multiple files with organized code as needed (game.js, globals.js, entities.js, etc.)
- Use proper ES6 Imports and Exports:
    - No Node.js style require() imports. No dynamic imports within functions.
    - Every file MUST import ALL constants, variables, functions, classes, and external symbols at the top of files where they are used. Example:
    ```javascript
    // Essential pattern (ALWAYS follow this)
    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

    import { Player, Enemy } from './entities.js';
    import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

    // Example function with proper dependencies
    function createPlayer(x, y, z) {
        const player = new Player(x, y, z);
        gameState.player = player;
        gameState.entities.push(player);
        gameState.scene.add(player.mesh);
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
      scene: null,          // three.js scene
      camera: null,         // three.js camera
      renderer: null,       // three.js renderer
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

# three.js Usage
- Set up three.js with scene, camera, and renderer:
```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

// Create camera
const camera = new THREE.PerspectiveCamera(
    75,                                    // FOV
    600 / 400,                            // Aspect ratio
    0.1,                                  // Near plane
    1000                                  // Far plane
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(600, 400);
document.body.appendChild(renderer.domElement);

// Initialize logs (write-only, never reset!)
const logs = {
    "game_info": [],   // Information about the game
    "player_info": [], // Information about the player character
    "inputs": []       // Information about the key inputs
};
window.logs = logs;

// Game loop
let frameCount = 0;
function gameLoop() {
    requestAnimationFrame(gameLoop);
    frameCount++;

    // Update game logic
    updateGame();

    // Render 3D scene
    renderer.render(scene, camera);
}
gameLoop();
```

- logs is write-only. Don't reset it. We want to keep track of all the logs since the start of the game.
- Variables to store in the logs during gameplay:
  - In "game_info": Information about the game when there are changes in the gamePhase, etc.
    - "game_status": The game phase status of the game accessible via `gameState.gamePhase`
    - "data": Additional data specific to the game state. For example, the player's score when game is over. Leave empty if not applicable.
    - "framecount": The current frame count
    - "timestamp": The timestamp of the event accessed using `Date.now()`
  - In "inputs": Store the control inputs when they are triggered by the player (keydown, keyup, etc.). Store only the allowed inputs used in the game. Use the following format:
    - "input_type": The type input event (e.g. keydown, keyup, etc.)
    - "data": Additional data specific to the input type. Store `key` and `keyCode` if the input is a key.
    - "framecount": The current frame count
    - "timestamp": The timestamp of the event
  - In "player_info": Information about the player character when there are changes in the player's state (accessed via gameState.player)
    - "screen_x": The x position of the player projected to 2D screen coordinates
    - "screen_y": The y position of the player projected to 2D screen coordinates
    - "game_x": The x position of the player in the 3D game world
    - "game_y": The y position of the player in the 3D game world
    - "game_z": The z position of the player in the 3D game world
    - "framecount": The current frame count
    - "timestamp": The timestamp of the event

- Graphics and Animations:
  - Create 3D geometries procedurally: BoxGeometry, SphereGeometry, CylinderGeometry, etc.
  - Use materials: MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial
  - Add lighting: AmbientLight, DirectionalLight, PointLight
  - Animate objects by updating mesh.position, mesh.rotation each frame
  - Use THREE.Vector3 for 3D positions and movements

- Physics and Collisions (Simple):
  - Implement basic 3D physics manually: gravity, velocity, acceleration
  - Use bounding box or sphere collision detection
  - Example simple collision:
    ```javascript
    // Check if two spheres collide
    const dist = player.position.distanceTo(enemy.position);
    if (dist < player.radius + enemy.radius) {
        // Handle collision
    }
    ```

- Game Screens for different game phases:
  - Start ("START"): Display 2D overlay with title, instructions, objectives, key controls, "PRESS ENTER TO START"
  - Playing ("PLAYING"): Active 3D gameplay with camera following player
  - Pause ("PAUSED"): Display "PAUSED" 2D overlay
  - Game Over ("GAME_OVER_WIN"/"GAME_OVER_LOSE"): Display Win/Lose message, final score, "PRESS R TO RESTART"

- UI Rendering (2D overlay on 3D):
  - Create HTML div overlays for UI text
  - Or use THREE.CSS2DRenderer for labels
  - Or draw text on canvas and use as texture
  - Display score, health, instructions as 2D overlays

- Camera Control:
  - Third-person camera: Follow player from behind/above
  - First-person camera: Camera at player position
  - Update camera position each frame to follow player smoothly

# Implementation Pattern
Implement as separate ES6 module files:
  1. globals.js - Contains all global constants, gameState object, and logs
  2. entities.js - Contains entity classes (Player, Enemy, etc.) with three.js mesh creation
  3. game.js - Main game logic, three.js setup, game loop, input handling, and rendering
  4. index.html - HTML file that loads game.js as module

All files must use proper ES6 module syntax with imports at the top.

# Example Entity Class Structure
```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Player {
    constructor(x, y, z) {
        // Create 3D mesh
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);

        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.2;
        this.jumpPower = 0.5;
        this.onGround = false;
    }

    update() {
        // Apply gravity
        if (!this.onGround) {
            this.velocity.y -= 0.02;
        }

        // Update position
        this.mesh.position.add(this.velocity);

        // Ground collision
        if (this.mesh.position.y <= 1) {
            this.mesh.position.y = 1;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }

    moveForward() {
        this.velocity.z -= this.speed;
    }

    moveBackward() {
        this.velocity.z += this.speed;
    }

    strafeLeft() {
        this.velocity.x -= this.speed;
    }

    strafeRight() {
        this.velocity.x += this.speed;
    }

    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }
    }
}
```

# Game Types Well-Suited for 3D
- 3D platformer (collect items, avoid obstacles, reach goal)
- Racing game (navigate track, avoid crashes)
- First-person maze/puzzle
- 3D space shooter
- Simple 3D physics puzzle

Focus on simple, fun 3D gameplay that showcases three.js capabilities while remaining playable with keyboard-only controls.
</instructions>
