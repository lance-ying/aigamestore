import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupRenderer, renderUI } from './renderer.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { Player, LevelManager, Collectible, DustSystem } from './entities.js';

// Input State
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false,
    W: false,
    S: false
};

const levelManager = new LevelManager();
let dustSystem = null;

function init() {
    // Basic Three.js setup
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Skyblue bg
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 80); // Skyblue fog
    
    setupRenderer();
    setupCamera();
    setupLighting();
    
    // Create infinite ground
    const planeGeo = new THREE.PlaneGeometry(100, 1000);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    gameState.ground = new THREE.Mesh(planeGeo, planeMat);
    gameState.ground.rotation.x = -Math.PI / 2;
    gameState.ground.position.z = 400; // Start ahead
    gameState.ground.receiveShadow = true;
    gameState.scene.add(gameState.ground);
    
    // Dust System for speed visualization
    dustSystem = new DustSystem();
    
    // Initial State Log
    logGameState();
}

function resetGame() {
    // Clear dynamic entities
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    gameState.obstacles.forEach(o => o.destroy()); // Helper to remove meshes
    gameState.obstacles = [];
    gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
    gameState.collectibles = [];
    
    // Clear particles
    gameState.particles.forEach(p => gameState.scene.remove(p.mesh));
    gameState.particles = [];
    
    // Reset State
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.speed = gameState.baseSpeed; // Reset speed
    levelManager.reset();
    if (dustSystem) dustSystem.reset();
    
    // Create Player
    gameState.player = new Player();
    
    // Log
    logGameState();
}

/**
 * Handles the auto-restart sequence after game over.
 * Sets game phase to PLAYING and resets game state.
 */
function performAutoRestart() {
    console.log("Auto-restarting game...");
    // Clear any pending auto-restart (should already be cleared by timeout, but good for safety)
    if (gameState.autoRestartTimerId) {
        clearTimeout(gameState.autoRestartTimerId);
        gameState.autoRestartTimerId = null;
    }
    gameState.autoRestartScheduled = false;

    gameState.gamePhase = "PLAYING"; // Auto-restart goes directly to PLAYING
    resetGame(); // Call the existing reset function
}

function update(deltaTime) {
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        // Player Logic
        if (gameState.player) {
            let input = 0;
            
            // Human Controls
            if (gameState.controlMode === "HUMAN") {
                if (keys.ArrowUp || keys.w || keys.W) input = 1;
                if (keys.ArrowDown || keys.s || keys.S) input = -1;
            }
            
            gameState.player.setInput(input);
            gameState.player.update(deltaTime);
        }
        
        // Level Generation
        levelManager.update();
        
        // Entity Updates
        [...gameState.obstacles, ...gameState.collectibles].forEach(e => e.update(deltaTime));
        
        // Particle Updates
        gameState.particles.forEach(p => p.update(deltaTime));
        gameState.particles = gameState.particles.filter(p => p.active !== false);
        
        if (dustSystem) dustSystem.update();
        
        // Ground follow
        if (gameState.player) {
            gameState.ground.position.z = gameState.player.mesh.position.z + 400;
        }
    }
    
    // Auto-restart logic: Trigger after 1 second in GAME_OVER_LOSE phase
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            gameState.autoRestartTimerId = setTimeout(() => {
                // Only auto-restart if still in GAME_OVER_LOSE phase
                // This prevents restarting if user pressed 'R' during the countdown
                if (gameState.gamePhase === "GAME_OVER_LOSE") {
                    performAutoRestart();
                }
                // Reset scheduled flag and timer ID regardless, as the timeout has fired
                gameState.autoRestartScheduled = false;
                gameState.autoRestartTimerId = null;
            }, 1000); // 1 second delay
        }
    }

    // Visuals
    updateCamera(deltaTime);
    updateLighting();
    
    renderUI();
    gameState.renderer.render(gameState.scene, gameState.camera);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    logInput('keydown', e.key, e.keyCode);
    
    if (e.code === 'Enter' && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        resetGame();
    }
    
    if (e.code === 'Escape') {
        gameState.gamePhase = gameState.gamePhase === "PAUSED" ? "PLAYING" : "PAUSED";
    }
    
    // Manual restart (R key) functionality
    if (e.key.toLowerCase() === 'r' && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
        // Clear any pending auto-restart
        if (gameState.autoRestartTimerId) {
            clearTimeout(gameState.autoRestartTimerId);
            gameState.autoRestartTimerId = null;
            gameState.autoRestartScheduled = false; // Ensure flag is reset
        }
        gameState.gamePhase = "START"; // Manual restart goes to START screen
        resetGame(); // Reset game state
        console.log("Manual restart initiated.");
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    logInput('keyup', e.key, e.keyCode);
});

// Logging Helpers
function logInput(type, key, code) {
    window.logs.inputs.push({
        input_type: type,
        data: { key: key, keyCode: code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

function logGameState() {
    window.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: { score: gameState.score },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

// Expose control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

// Main Loop
let lastTime = 0;
function loop(timestamp) {
    requestAnimationFrame(loop);
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    update(dt);
}

// Boot
init();
loop(0);