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
            } else if (gameState.controlMode === "TEST_1") {
                // Just run forward, no input
            } else if (gameState.controlMode === "TEST_2") {
                // Perfect AI: Check next obstacle
                // Find closest obstacle in front
                let closest = null;
                let minDist = 999;
                for (const obs of gameState.obstacles) {
                    const d = obs.z - gameState.player.mesh.position.z;
                    if (d > 0 && d < minDist) {
                        minDist = d;
                        closest = obs;
                    }
                }
                
                if (closest && minDist < 20) {
                    if (closest.type === "LOW_GATE" || closest.type === "TUNNEL") input = -1; // Go Short
                    else if (closest.type === "NARROW_GATE") input = 1; // Go Tall
                    else if (closest.type === "BOX_GATE") {
                        // AI logic for box gate would need to target specific ratio
                        // For now, just drift towards center
                        input = (0.5 - gameState.player.shiftFactor) * 10;
                    }
                }
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
    
    if (e.key.toLowerCase() === 'r' && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
        gameState.gamePhase = "START";
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
    // If switching to test mode, maybe auto-start?
    if (mode.startsWith("TEST") && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        resetGame();
    }
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