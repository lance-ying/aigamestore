import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInput, updateInput } from './input.js';
import { setupCamera, updateCamera } from './camera.js';
import { Player } from './entities.js';
import { buildLevel } from './level.js';
import { updatePhysics } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Initialization
function init() {
    // 1. Setup Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // 2. Setup Container
    gameState.gameContainer = document.getElementById('game-container');
    if (!gameState.gameContainer) {
        gameState.gameContainer = document.createElement('div');
        gameState.gameContainer.id = 'game-container';
        gameState.gameContainer.style.width = `${CANVAS_WIDTH}px`;
        gameState.gameContainer.style.height = `${CANVAS_HEIGHT}px`;
        gameState.gameContainer.style.position = 'relative';
        gameState.gameContainer.style.overflow = 'hidden';
        document.body.appendChild(gameState.gameContainer);
    }

    // 3. Setup Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);

    // 4. Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    gameState.scene.add(dirLight);

    setupCamera();
    setupInput();
    setupUI();
    
    // Seed Random
    if (window.Math.seedrandom) Math.seedrandom('42');
    
    // Start Loop
    requestAnimationFrame(gameLoop);
    
    // Initial Logs
    if (window.logs) {
        window.logs.game_info.push({ event: "init", timestamp: Date.now() });
    }
}

function startGame() {
    // Clear old entities
    gameState.entities.forEach(e => {
        if(e.mesh) gameState.scene.remove(e.mesh);
    });
    gameState.colliders.forEach(c => {
        // if(c.mesh) gameState.scene.remove(c.mesh); // We don't remove static level geometry usually, but for reset we should
    });
    
    // Full Reset Logic
    gameState.scene.children = gameState.scene.children.filter(c => c.isLight || c.isCamera); // Keep lights
    gameState.entities = [];
    gameState.colliders = [];
    gameState.checkpoints = [];
    
    // Rebuild
    buildLevel();
    
    gameState.player = new Player(new THREE.Vector3(0, 2, 0));
    gameState.entities.push(gameState.player);
    
    gameState.score = 0;
    gameState.startTime = Date.now();
    gameState.gamePhase = "PLAYING";
    
    // Test logic overrides
    handleTestSetup();
}

function handleTestSetup() {
    if (gameState.controlMode === 'TEST_1') {
        // Basic movement test setup if needed
    }
    // ...
}

function updateGame(deltaTime) {
    // Input Handling
    updateInput();
    
    // Phase Management
    const keyState = gameState.input; // Note: We use raw keys in input.js, mapped here
    // But input.js runs event listeners. updateInput maps them to gameState.input flags.
    
    // Global Key Handlers
    // We check keydown events via input buffer or state map.
    // For simplicity in this structure, we check mapped states, but we need 'justPressed' for toggles.
    // Let's implement a simple toggle check here.
    
    if (gameState.input.restart) { // Restart not mapped in input.js properly yet?
         // We'll rely on global key listener in input.js pushing events or checking raw code
    }

    // Since input.js logic was simple, let's just use raw key checks for Game Flow for simplicity
    
    // ENTER to Start
    if (gameState.gamePhase === "START" && (gameState.input.start || keysPressed[13])) {
        startGame();
    }
    
    // R to Restart
    if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && keysPressed[82]) {
        startGame();
    }
    
    // ESC to Pause
    if (keysPressed[27] && !prevKeysPressed[27]) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }

    // Logic
    if (gameState.gamePhase === "PLAYING") {
        // Test Automation Overrides
        applyTestControls();
        
        // Entity Updates
        if (gameState.player) gameState.player.update(deltaTime, gameState.input);
        
        gameState.entities.forEach(e => {
            if (e !== gameState.player && e.update) e.update(deltaTime);
        });
        
        // Physics
        updatePhysics(deltaTime);
        
        // Camera
        updateCamera();
    }
    
    // Update Previous Key State for toggle detection
    updatePrevKeys();
}

// Helpers for input management in main loop
const keysPressed = {};
const prevKeysPressed = {};
window.addEventListener('keydown', e => keysPressed[e.keyCode] = true);
window.addEventListener('keyup', e => keysPressed[e.keyCode] = false);

function updatePrevKeys() {
    for (let k in keysPressed) prevKeysPressed[k] = keysPressed[k];
}

function applyTestControls() {
    if (gameState.controlMode === 'HUMAN') return;
    
    // Reset inputs
    gameState.input.up = false;
    gameState.input.down = false;
    gameState.input.left = false;
    gameState.input.right = false;
    gameState.input.jump = false;
    gameState.input.dive = false;
    
    const t = (Date.now() - gameState.startTime) / 1000;
    
    if (gameState.controlMode === 'TEST_1') {
        // Run forward
        if (t < 2.0) gameState.input.up = true;
    }
    else if (gameState.controlMode === 'TEST_2') {
        // Jump
        if (t > 0.5 && t < 0.6) gameState.input.jump = true;
    }
    else if (gameState.controlMode === 'TEST_3') {
        // Dive
        gameState.input.up = true;
        if (t > 0.5 && t < 0.6) gameState.input.dive = true;
    }
    else if (gameState.controlMode === 'TEST_7') {
        // AI Navigation
        if (!gameState.player) return;
        
        // Simple heuristic: Move towards next checkpoint or goal
        // In this linear level, just Move Forward (negative Z)
        gameState.input.up = true;
        
        // Raycast ahead for gaps? 
        // Simple logic: If Z is near specific gap coordinates, Jump.
        const z = gameState.player.mesh.position.z;
        
        // Hardcoded knowledge of level
        // Gap 1: -10 to -12
        if (z < -8 && z > -12) gameState.input.jump = true;
        // Gap 2: -20 to -22
        if (z < -18 && z > -22) gameState.input.jump = true;
        
        // Spinner dodge? Assume simple brute force with jump/dive
        if (z < -30 && z > -50) gameState.input.dive = true; // Speed through
    }
}

// Main Loop
let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    
    gameState.frameCount++;
    
    updateGame(deltaTime);
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Expose control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart to apply clean state
    if (gameState.gamePhase !== "START") {
        startGame();
    }
};

// Start
init();