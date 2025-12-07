import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, getGameState, resetGameState,
    LATERAL_SPEED, FORWARD_SPEED_BASE, FORWARD_SPEED_MAX,
    TILE_WIDTH_BASE, TILE_DEPTH, GAP_MIN, GAP_MAX, PATH_DEVIATION
} from './globals.js';
import { setupRenderer } from './renderer.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupInput } from './input.js';
import { setupUI, renderUI } from './ui.js';
import { Player, Tile, Collectible } from './entities.js';
import { updatePhysics } from './physics.js';
import { logGameEvent, clamp, randomRange } from './utils.js';

// Level Generation State
let lastTilePos = new THREE.Vector3(0, 0, 5); // Start slightly behind
let tilesGenerated = 0;
let nextDifficultyTier = 20; // Increase difficulty every 20 tiles

function init() {
    // Seed RNG
    Math.seedrandom('42');
    
    setupRenderer();
    setupCamera();
    setupLighting();
    setupUI();
    setupInput();
    
    // Initial Start
    gameState.gamePhase = "START";
    logGameEvent("INIT", { message: "Game Initialized" });
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function startGame() {
    resetGameState();
    
    // Reset Generator
    lastTilePos.set(0, 0, 0); // Start at 0
    tilesGenerated = 0;
    
    // Create Player
    const player = new Player(0, 5, 0); // Drop from sky
    gameState.player = player;
    
    // Create Initial Platform (safe zone)
    for (let i = 0; i < 5; i++) {
        createTile(0, 0, -i * TILE_DEPTH, TILE_WIDTH_BASE, TILE_DEPTH, "NORMAL");
        lastTilePos.set(0, 0, -i * TILE_DEPTH);
    }
    
    // Pre-generate some world
    for (let i = 0; i < 10; i++) {
        generateNextTile();
    }
}

function generateNextTile() {
    tilesGenerated++;
    
    // Difficulty Scaling
    const difficulty = Math.min(tilesGenerated / 100, 1.0); // 0 to 1
    
    // Determine Position
    const gap = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN) * (0.5 + difficulty * 0.5);
    const z = lastTilePos.z - TILE_DEPTH - gap;
    
    // X Deviation
    const maxDev = PATH_DEVIATION * (0.5 + difficulty * 0.5);
    let x = lastTilePos.x + (Math.random() - 0.5) * maxDev;
    x = clamp(x, -15, 15); // Hard clamp to world bounds
    
    const y = lastTilePos.y; // Flat world for now, could change elevation
    
    // Determine Width
    const w = Math.max(2.0, TILE_WIDTH_BASE - difficulty * 1.5);
    
    // Determine Type
    let type = "NORMAL";
    if (difficulty > 0.3 && Math.random() < 0.3) type = "MOVING";
    
    const tile = createTile(x, y, z, w, TILE_DEPTH, type);
    lastTilePos.set(x, y, z);
    
    // Chance for collectible
    if (Math.random() < 0.3) {
        new Collectible(x, y + 1.5, z);
    }
}

function createTile(x, y, z, w, d, type) {
    return new Tile(x, y, z, w, d, type);
}

function updateGame(dt) {
    gameState.time += dt;
    
    // State Management
    if (gameState.gamePhase === "START" && gameState.player === null) {
        // Prepare scene for start menu (optional spinning camera)
        gameState.camera.position.x = Math.sin(gameState.time * 0.5) * 10;
        gameState.camera.position.z = Math.cos(gameState.time * 0.5) * 10;
        gameState.camera.lookAt(0, 0, 0);
        return;
    }
    
    // Check for START -> PLAYING transition to initialize objects
    if (gameState.gamePhase === "PLAYING" && !gameState.player) {
        startGame();
    }
    
    if (gameState.gamePhase !== "PLAYING") return;
    
    const player = gameState.player;
    if (!player) return;

    // 1. Difficulty / Speed Ramp
    const forwardSpeed = Math.min(FORWARD_SPEED_BASE + tilesGenerated * 0.001, FORWARD_SPEED_MAX);
    
    // 2. Player Controls
    // Forward movement is constant
    player.velocity.z = -forwardSpeed;
    
    // Lateral Movement
    let dx = 0;
    if (gameState.controlMode === "HUMAN") {
        if (gameState.keys.left) dx -= 1;
        if (gameState.keys.right) dx += 1;
    } else {
        // AI Logic
        runAI(player, dx);
        dx = gameState.aiDx || 0;
    }
    
    // Smooth lateral velocity
    player.velocity.x = lerp(player.velocity.x, dx * LATERAL_SPEED * 60, 0.1); // Scale for dt
    
    // 3. Update Entities
    gameState.entities.forEach(e => {
        if (e.update) e.update(dt);
    });
    
    // 4. Update Physics
    updatePhysics();
    
    // 5. World Generation Loop
    // If last tile is close enough, generate new ones
    if (lastTilePos.z > player.mesh.position.z - 50) {
        generateNextTile();
    }
    
    // 6. Camera & Lights
    updateCamera();
    updateLighting();
    
    // 7. Log Player Info
    if (gameState.frameCount % 10 === 0) { // Log every 10 frames to save memory
        const screenPos = player.mesh.position.clone().project(gameState.camera);
        window.logs.player_info.push({
            screen_x: (screenPos.x + 1) * gameState.renderer.domElement.width / 2,
            screen_y: (1 - screenPos.y) * gameState.renderer.domElement.height / 2,
            game_x: player.mesh.position.x,
            game_y: player.mesh.position.y,
            game_z: player.mesh.position.z,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

function runAI(player, dx) {
    // Find next tile in front
    let targetTile = null;
    let minDist = 999;
    
    for (const tile of gameState.tiles) {
        // Only look at tiles in front (z < player.z)
        if (tile.mesh.position.z < player.mesh.position.z) {
            const dist = player.mesh.position.z - tile.mesh.position.z;
            if (dist < minDist) {
                minDist = dist;
                targetTile = tile;
            }
        }
    }
    
    gameState.aiDx = 0;
    if (targetTile) {
        const diffX = targetTile.mesh.position.x - player.mesh.position.x;
        if (Math.abs(diffX) > 0.2) {
            gameState.aiDx = Math.sign(diffX);
        }
    }
}

// Main Game Loop
let lastTime = performance.now();
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Cap delta for stability
    gameState.deltaTime = Math.min(delta, 0.1);
    gameState.frameCount++;
    
    if (gameState.gamePhase !== "PAUSED") {
        updateGame(gameState.deltaTime);
    }
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Handle R key reset from START phase if needed (though inputs are handled globally)
// Just exposing start
init();

// Export game instance for requirements
window.gameInstance = {
    gameState,
    init,
    startGame
};