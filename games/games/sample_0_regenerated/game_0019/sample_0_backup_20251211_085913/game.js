import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONSTANTS, initLogs, logGameInfo, logPlayerInfo, logInput, COLORS } from './globals.js';
import { seedRandom } from './utils.js';
import { Player } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { updatePhysics } from './physics.js';
import { setupUI, renderUI } from './ui.js';
import { initLevel, updateLevelGeneration } from './level_generator.js';

// Setup Main Function
function init() {
    // 1. Setup Logging
    initLogs();
    
    // 2. Setup Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = '600px';
    container.style.height = '400px';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;
    
    // 3. Setup Three.js Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(COLORS.BACKGROUND);
    gameState.scene.fog = new THREE.Fog(COLORS.BACKGROUND, 30, 90);
    
    // 4. Setup Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(600, 400);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(gameState.renderer.domElement);
    
    // 5. Setup Camera
    setupCamera();
    
    // 6. Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    gameState.scene.add(dirLight);
    
    // 7. Setup UI
    setupUI();
    
    // 8. Initialize Random
    seedRandom('42');
    
    // 9. Input Listeners
    setupInputs();
    
    // 10. Start Loop
    gameState.lastTime = performance.now();
    gameState.gamePhase = "START";
    
    // Init empty world for background
    initLevel();
    
    requestAnimationFrame(gameLoop);
    
    logGameInfo("GAME_INIT");
}

function startGame() {
    resetGame();
    gameState.gamePhase = "PLAYING";
    logGameInfo("GAME_START");
}

function resetGame() {
    // Clear entities
    if(gameState.player) {
        gameState.player.dispose();
        gameState.player = null;
    }
    gameState.obstacles.forEach(e => e.dispose());
    gameState.obstacles = [];
    gameState.ramps.forEach(e => e.dispose());
    gameState.ramps = [];
    gameState.particles.forEach(e => e.dispose());
    gameState.particles = [];
    
    // Reset World
    gameState.roadSegments.forEach(e => e.dispose());
    initLevel();
    
    // Reset Stats
    gameState.score = 0;
    gameState.speed = gameState.baseSpeed;
    gameState.frameCount = 0;
    
    // Create Player
    gameState.player = new Player();
    
    // Reset Camera
    updateCamera(0);
}

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        logInput('keydown', e.key, e.keyCode);
        
        if (e.code === 'Enter') {
            if (gameState.gamePhase === "START") startGame();
        }
        else if (e.code === 'Escape') {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        else if (e.code === 'KeyR') {
            if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
                gameState.gamePhase = "START";
            }
        }
        
        // Gameplay Inputs
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            handleGameInput(e.code, true);
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            handleGameInput(e.code, false);
        }
    });
    
    // Handle Window Control Modes (for test harness)
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
        // Reset state for tests
        if (mode.startsWith("TEST")) {
             gameState.gamePhase = "START";
             startGame(); // Auto start for tests
             gameState.testState.timer = 0;
             gameState.testState.stage = 0;
        }
    };
}

function handleGameInput(code, isPressed) {
    if (!gameState.player) return;
    
    const laneWidth = GAME_CONSTANTS.LANE_WIDTH;
    
    if (isPressed) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
            // Move left lane if possible
            if (gameState.player.targetX > -laneWidth + 0.1) {
                gameState.player.targetX -= laneWidth;
            }
        }
        if (code === 'ArrowRight' || code === 'KeyD') {
            if (gameState.player.targetX < laneWidth - 0.1) {
                gameState.player.targetX += laneWidth;
            }
        }
        if (code === 'ArrowUp' || code === 'KeyW') {
            gameState.speedMultiplier = 1.5;
        }
        if (code === 'ArrowDown' || code === 'KeyS') {
            gameState.speedMultiplier = 0.5;
        }
    } else {
        if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
            gameState.speedMultiplier = 1.0;
        }
    }
    
    // Clamp target
    gameState.player.targetX = Math.round(gameState.player.targetX / laneWidth) * laneWidth;
}

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - gameState.lastTime) / 1000, 0.1); // Cap dt
    gameState.lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        updateGame(dt);
        // Apply automated test logic
        if (gameState.controlMode !== "HUMAN") {
            runAutomatedTests(dt);
        }
    }
    
    if (gameState.player) {
        logPlayerInfo();
    }
    
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

function updateGame(dt) {
    // Level Gen
    updateLevelGeneration();
    
    // Entities
    if (gameState.player) gameState.player.update(dt);
    
    gameState.obstacles.forEach(e => e.update(dt));
    gameState.particles.forEach(e => e.update(dt));
    
    // Physics
    updatePhysics(dt);
    
    // Camera
    updateCamera(dt);
}

// Automated Test Logic
function runAutomatedTests(dt) {
    gameState.testState.timer += dt;
    const t = gameState.testState.timer;
    
    if (gameState.controlMode === "TEST_1") {
        // Test basic movement
        if (t > 0.5 && gameState.testState.stage === 0) {
            handleGameInput('ArrowLeft', true);
            gameState.testState.stage++;
        }
        if (t > 1.0 && gameState.testState.stage === 1) {
            handleGameInput('ArrowRight', true);
            handleGameInput('ArrowRight', true); // Go to right lane
            gameState.testState.stage++;
        }
    }
    else if (gameState.controlMode === "TEST_2") {
        // Test winning/collecting
        // Force spawn a matching ball directly in front
        if (gameState.testState.stage === 0) {
            const z = gameState.player.mesh.position.z - 20;
            const ball = new import('./entities.js').BallObstacle(0, z, gameState.player.colorName);
            gameState.obstacles.push(ball);
            gameState.testState.initialScore = gameState.score;
            gameState.testState.stage++;
        }
        // Verify score increase handled in physics logic implicitly
    }
}

// Start
init();