import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logs, logGameInfo, logPlayerInfo } from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { Character } from './entities.js';
import { createLevel, spawnBots } from './level.js';
import { updatePhysics } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Input Handling
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    " ": false, Shift: false
};

// Initialize Game
function init() {
    // 1. Scene Setup
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // 2. Camera
    setupCamera();

    // 3. Renderer
    gameState.gameContainer = document.getElementById('game-container') || document.body; // Fallback
    
    // Ensure container styling
    if (gameState.gameContainer.id !== 'game-container') {
        const container = document.createElement('div');
        container.id = 'game-container';
        container.style.position = 'relative';
        container.style.width = `${CANVAS_WIDTH}px`;
        container.style.height = `${CANVAS_HEIGHT}px`;
        container.style.overflow = 'hidden';
        document.body.appendChild(container);
        gameState.gameContainer = container;
    }

    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);

    // 4. Lighting
    setupLighting();
    
    // 5. UI
    setupUI();

    // 6. Listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // 7. Seed
    if (window.seedrandom) {
        Math.seedrandom('42');
    }

    // Initial Logs
    logGameInfo({ action: "init", status: "success" });
    
    // Set initial level
    gameState.currentLevel = 1;
    
    // Start Loop
    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    gameState.scene.add(dirLight);
}

function startGame() {
    // Clear old
    while(gameState.scene.children.length > 0){ 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    gameState.entities = [];
    gameState.platforms = [];
    gameState.obstacles = [];
    gameState.enemies = [];
    gameState.checkpoints = [];
    
    setupLighting();
    
    // Reset Score if starting from Level 1
    if (gameState.currentLevel === 1) {
        gameState.totalScore = 0;
    }
    gameState.levelComplete = false;
    
    // Build Level
    const waypoints = createLevel();
    
    // Spawn Player
    gameState.player = new Character(0, 5, 0, 0xFFFFFF); // White player
    
    // Spawn Bots
    spawnBots(20, waypoints);
    
    // Reset Stats for this level
    gameState.score = 0;
    gameState.qualifiedCount = 0;
    gameState.elapsedTime = 0;
    gameState.frameCount = 0;
    
    gameState.gamePhase = "PLAYING";
    
    // Control Modes
    if (gameState.controlMode === 'TEST_1') {
        // Gravity test: Spawn high
        gameState.player.mesh.position.y = 20;
    } else if (gameState.controlMode === 'TEST_2') {
        // Win test: Spawn near finish
        // Approximate finish locations for testing
        if (gameState.currentLevel === 1) gameState.player.mesh.position.set(0, 6, -115);
        if (gameState.currentLevel === 2) gameState.player.mesh.position.set(0, 2, -135);
        if (gameState.currentLevel === 3) gameState.player.mesh.position.set(0, 18, -100);
    }
}

function updateInput() {
    if (!gameState.player) return;

    let dx = 0;
    let dz = 0;

    if (keys.w || keys.ArrowUp) dz -= 1;
    if (keys.s || keys.ArrowDown) dz += 1;
    if (keys.a || keys.ArrowLeft) dx -= 1;
    if (keys.d || keys.ArrowRight) dx += 1;
    
    // Normalize input vector relative to camera
    // In this game, Camera looks generally -Z. 
    // Right is +X, Forward is -Z.
    
    const inputVec = new THREE.Vector3(dx, 0, dz);
    if (inputVec.lengthSq() > 0) inputVec.normalize();
    
    // Convert to world space based on camera angle?
    // Camera is following, but usually fixed orientation or slightly orbiting.
    // Let's assume input matches world axes for simplicity or align with camera yaw.
    const camEuler = new THREE.Euler().setFromQuaternion(gameState.camera.quaternion, 'YXZ');
    const rot = new THREE.Matrix4().makeRotationY(camEuler.y);
    inputVec.applyMatrix4(rot);
    
    gameState.player.move(inputVec, gameState.deltaTime);
    
    if (keys[" "]) {
        gameState.player.jump();
    }
    
    if (keys.Shift) {
        gameState.player.dive();
    }
    
    // Save to state for replays
    gameState.inputState = { dx, dz, jump: keys[" "], dive: keys.Shift };
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((currentTime - gameState.lastFrameTime) / 1000, 0.1); // Cap dt
    gameState.deltaTime = dt;
    gameState.lastFrameTime = currentTime;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        gameState.elapsedTime += dt;
        
        // Check for Level Completion
        if (gameState.levelComplete) {
            gameState.levelComplete = false;
            
            // Calculate Score based on speed (Base 500 - 10 points per second)
            const timeScore = Math.max(0, 500 - Math.floor(gameState.elapsedTime * 10));
            gameState.totalScore += (100 + timeScore); // 100 base points for finishing
            
            if (gameState.currentLevel < gameState.maxLevels) {
                gameState.currentLevel++;
                startGame();
            } else {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
        
        updateInput();
        
        // Update all entities
        gameState.entities.forEach(ent => ent.update(dt));
        gameState.obstacles.forEach(obs => obs.update(dt));
        
        // Update Physics
        updatePhysics(dt);
        
        // Update Camera
        updateCamera(dt);
        
        // Lose Condition (Time limit or elimination? Just time for now)
        // Or if qualified count reached limit and player hasn't finished
        if (gameState.qualifiedCount >= gameState.qualificationLimit) {
            if (gameState.gamePhase !== "GAME_OVER_WIN") {
                gameState.gamePhase = "GAME_OVER_LOSE";
            }
        }
        
        // Logging
        if (gameState.frameCount % 5 === 0) { // Log every 5 frames
            logPlayerInfo();
            // Log inputs
            logs.inputs.push({
                ...gameState.inputState,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Input Event Handlers
function onKeyDown(e) {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    
    if (e.keyCode === 13) { // Enter
        if (gameState.gamePhase === "START") startGame();
    }
    if (e.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (e.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart full game
            gameState.currentLevel = 1;
            startGame();
        }
    }
}

function onKeyUp(e) {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
}

// Global control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If playing, restart to apply
    if (gameState.gamePhase === "PLAYING") startGame();
};

// Boot
init();