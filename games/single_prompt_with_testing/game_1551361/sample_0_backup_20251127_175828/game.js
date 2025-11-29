import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logs, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupEnvironment } from './environment.js';
import { Car } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { handleCollisions } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Initialization
function init() {
    // 1. Scene Setup
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);

    // 2. Container Setup
    const container = document.getElementById('game-container') || document.body; // Fallback
    if (!document.getElementById('game-container')) {
        // Create it if it doesn't exist (though HTML should have it)
        const div = document.createElement('div');
        div.id = 'game-container';
        div.style.width = `${CANVAS_WIDTH}px`;
        div.style.height = `${CANVAS_HEIGHT}px`;
        div.style.position = 'relative';
        div.style.overflow = 'hidden';
        document.body.appendChild(div);
        gameState.gameContainer = div;
    } else {
        gameState.gameContainer = container;
    }

    // 3. Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);
    
    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    gameState.scene.add(sun);
    
    // 5. Setup Game Components
    setupCamera();
    setupUI();
    
    // Seed and Setup World
    Math.seedrandom('42');
    resetGame();
    
    // Start Loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Clear dynamic entities
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
    gameState.props.forEach(p => gameState.scene.remove(p.mesh));
    if (gameState.terrain) gameState.scene.remove(gameState.terrain);
    
    gameState.collectibles = [];
    gameState.props = [];
    gameState.entities = [];
    
    // Rebuild World
    setupEnvironment();
    
    // Create Player
    gameState.player = new Car(0, 5, 0); // Start high to drop in
    
    // Reset Stats
    gameState.score = 0;
    gameState.tokensCollected = 0;
    gameState.timeLeft = 120;
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
}

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true;
    
    // Phase Transitions
    if (gameState.gamePhase === "START" && e.keyCode === 13) { // Enter
        gameState.gamePhase = "PLAYING";
    }
    
    if (e.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && e.keyCode === 82) { // R
        resetGame();
    }
    
    // Logging
    logs.inputs.push({
        type: 'keydown',
        key: e.key,
        code: e.keyCode,
        frame: gameState.frameCount
    });
});

window.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false;
});

function handleInput() {
    if (!gameState.player || gameState.gamePhase !== "PLAYING") return;
    
    const p = gameState.player;
    
    if (gameState.controlMode === "HUMAN") {
        p.inputs.forward = keys[38] || keys[87]; // Up / W
        p.inputs.backward = keys[40] || keys[83]; // Down / S
        p.inputs.left = keys[37] || keys[65]; // Left / A
        p.inputs.right = keys[39] || keys[68]; // Right / D
        p.inputs.brake = keys[32]; // Space
    } else {
        // Automated Test Inputs handled in test logic
    }
}

// Automated Testing Logic
function runAutomatedTests(dt) {
    if (gameState.controlMode === "HUMAN") return;
    
    // Force play state
    if (gameState.gamePhase === "START") gameState.gamePhase = "PLAYING";
    
    gameState.debug.testTimer += dt;
    const t = gameState.debug.testTimer;
    const p = gameState.player;

    if (gameState.controlMode === "TEST_1") {
        // Strategy: Accelerate 1s, Turn Right 1s
        if (t < 1.0) {
            p.inputs.forward = true;
            p.inputs.right = false;
        } else if (t < 2.0) {
            p.inputs.forward = true;
            p.inputs.right = true;
        } else {
            // Test End
            p.inputs.forward = false;
            p.inputs.right = false;
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // Strategy: Teleport to all collectibles then finish
        // We do this fast, one per few frames
        if (gameState.collectibles.length > 0) {
            const target = gameState.collectibles[0];
            p.mesh.position.copy(target.mesh.position);
            // Collect logic handles removal from array, so [0] is always next
        } else {
             // Wait for win state trigger
        }
    }
}

// Control Mode Exposed Function
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    gameState.debug.testTimer = 0;
    console.log("Control Mode set to:", mode);
    // Auto start if testing
    if (mode !== "HUMAN" && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
};

let lastTime = 0;

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap dt
    lastTime = currentTime;
    
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        // Timer
        gameState.timeLeft -= dt;
        if (gameState.timeLeft <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        
        handleInput();
        runAutomatedTests(dt);
        
        // Updates
        if (gameState.player) gameState.player.update(dt);
        gameState.collectibles.forEach(c => c.update(dt));
        
        handleCollisions();
        updateCamera(dt);
        
        // Log game info occasionally
        if (gameState.frameCount % 60 === 0) {
            logs.game_info.push({
                phase: gameState.gamePhase,
                score: gameState.score,
                time: gameState.timeLeft,
                fps: 1/dt
            });
        }
    }
    
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
init();