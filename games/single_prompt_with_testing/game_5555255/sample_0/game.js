import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logs, getGameState } from './globals.js';
import { logGameInfo, logPlayerInfo, logInput } from './utils.js';
import { updatePhysics, checkGoalCollision, checkCollectibleCollisions } from './physics.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { setupUI, renderUI } from './ui.js';

// Setup Window Global for Tests
window.gameInstance = {
    getGameState: getGameState
};

// Input State
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    brake: false
};

// Internal Testing Flags
let testTimer = 0;

function init() {
    // Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.position = 'relative';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(gameState.renderer.domElement);
    
    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x1a1a2e);
    gameState.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.035);
    
    // Camera
    gameState.camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    gameState.scene.add(dirLight);
    
    // UI
    setupUI();
    
    // Event Listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // Testing Hook
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
        resetGame();
        gameState.gamePhase = "PLAYING"; // Auto start for tests
        
        // Specific Test Setups
        if (mode === 'TEST_4') { // Fall death
             gameState.player.mesh.position.y = -25;
        }
        if (mode === 'TEST_5') { // Win
            // Move player near goal
            if (gameState.goal) {
                gameState.player.mesh.position.copy(gameState.goal.mesh.position);
            }
        }
    };

    // Initial log
    logGameInfo("START");
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Cleanup old scene objects
    if (gameState.player) {
        gameState.scene.remove(gameState.player.mesh);
        gameState.player = null;
    }
    
    gameState.platforms.forEach(p => gameState.scene.remove(p.mesh));
    gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
    if (gameState.goal) gameState.scene.remove(gameState.goal.mesh);
    
    gameState.score = 0;
    
    // Seed Random
    Math.seedrandom('42');
    
    // Gen Level
    generateLevel();
    
    // Create Player
    gameState.player = new Player(0, 2, 0);
    
    gameState.camera.position.set(0, 5, 10);
}

function onKeyDown(e) {
    const k = e.keyCode;
    logInput('keydown', e.key, k);
    
    // Game Flow Keys
    if (k === 13) { // Enter
        if (gameState.gamePhase === "START") {
            resetGame();
            gameState.gamePhase = "PLAYING";
            logGameInfo("PLAYING");
        }
    }
    if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo("PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo("PLAYING");
        }
    }
    if (k === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PLAYING") {
            resetGame();
            gameState.gamePhase = "START";
            logGameInfo("START");
        }
    }
    
    // Controls
    if (gameState.controlMode === 'HUMAN') {
        if (k === 38 || k === 87) keys.up = true;
        if (k === 40 || k === 83) keys.down = true;
        if (k === 37 || k === 65) keys.left = true;
        if (k === 39 || k === 68) keys.right = true;
        if (k === 32) keys.jump = true;
        if (k === 16) keys.brake = true;
    }
}

function onKeyUp(e) {
    const k = e.keyCode;
    logInput('keyup', e.key, k);
    
    if (gameState.controlMode === 'HUMAN') {
        if (k === 38 || k === 87) keys.up = false;
        if (k === 40 || k === 83) keys.down = false;
        if (k === 37 || k === 65) keys.left = false;
        if (k === 39 || k === 68) keys.right = false;
        if (k === 32) keys.jump = false;
        if (k === 16) keys.brake = false;
    }
}

function updateTests() {
    testTimer++;
    
    // TEST_1: Acceleration
    if (gameState.controlMode === 'TEST_1') {
        keys.up = true; // Hold forward
        if (testTimer === 60) {
            console.log("TEST_1 Status: PosZ", gameState.player.mesh.position.z, "VelZ", gameState.player.velocity.z);
        }
    }
    
    // TEST_2: Jump
    if (gameState.controlMode === 'TEST_2') {
        if (testTimer === 30) {
            keys.jump = true; // Jump
        } else {
            keys.jump = false;
        }
    }
    
    // TEST_3: Gravity (handled by physics default, just monitor)
    
    // TEST_6: Collectible
    if (gameState.controlMode === 'TEST_6') {
        if (testTimer === 10 && gameState.collectibles.length > 0) {
            // Teleport to first collectible
            gameState.player.mesh.position.copy(gameState.collectibles[0].mesh.position);
        }
    }
    
    // TEST_7: Pause
    if (gameState.controlMode === 'TEST_7') {
        if (testTimer === 30) {
            gameState.gamePhase = "PAUSED";
        }
    }
}

function updateCamera() {
    if (!gameState.player) return;
    
    // Target position (behind player)
    const target = gameState.player.mesh.position.clone().add(gameState.cameraOffset);
    
    // Lerp camera
    gameState.camera.position.lerp(target, 0.1);
    gameState.camera.lookAt(gameState.player.mesh.position);
}

let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        
        if (gameState.controlMode !== 'HUMAN') {
            updateTests();
        }
        
        if (gameState.player) {
            gameState.player.update(keys);
        }
        
        updatePhysics(dt);
        
        if (gameState.goal) gameState.goal.update(dt);
        gameState.collectibles.forEach(c => c.update(dt));
        
        // Checks
        checkCollectibleCollisions();
        if (checkGoalCollision()) {
            gameState.gamePhase = "GAME_OVER_WIN";
            logGameInfo("GAME_OVER_WIN", { score: gameState.score });
        }
        
        updateCamera();
        
        // Log player occasionally
        if (gameState.frameCount % 10 === 0) logPlayerInfo();
    }
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
init();