import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONSTANTS } from './globals.js';
import { Player } from './entities.js';
import { generateLevel, spawnWave } from './level.js';
import { initUI, renderUI } from './ui.js';

// Setup Three.js
function setup() {
    // Container Setup
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x101010);
    gameState.scene.fog = new THREE.FogExp2(0x101010, 0.02);

    // Camera
    gameState.camera = new THREE.PerspectiveCamera(75, CONSTANTS.CANVAS_WIDTH / CONSTANTS.CANVAS_HEIGHT, 0.1, 1000);
    
    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    container.appendChild(gameState.renderer.domElement);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x404040); // Soft white light
    gameState.scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    gameState.scene.add(dirLight);

    // Init UI Overlay
    initUI();
    
    // Input Listeners
    setupInputs();
    
    // Initial Level Geometry
    generateLevel();
    
    // Seed Random
    Math.seedrandom('42');
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.keyCode] = true;
        logInput(e.key, e.keyCode, 'down');
        
        // State Transitions
        if (e.keyCode === 13) { // Enter
            if (gameState.gamePhase === "START") startGame();
        }
        if (e.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        if (e.keyCode === 82) { // R
            if (gameState.gamePhase.includes("GAME_OVER")) resetGame();
        }
        
        // Test Mode Toggles (Hidden)
        if (e.key === '1') window.setControlMode('TEST_1');
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.keyCode] = false;
        logInput(e.key, e.keyCode, 'up');
    });
}

function logInput(key, code, type) {
    if (window.logs) {
        window.logs.inputs.push({
            type, key, code, 
            frame: gameState.frameCount,
            time: Date.now()
        });
    }
}

function startGame() {
    gameState.gamePhase = "PLAYING";
    resetGame();
}

function resetGame() {
    // Remove dynamic entities
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    gameState.enemies.forEach(e => gameState.scene.remove(e.mesh));
    gameState.projectiles.forEach(p => gameState.scene.remove(p.mesh));
    gameState.particles.forEach(p => gameState.scene.remove(p.mesh));
    
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Create Player
    gameState.player = new Player(0, 2, 0);
    
    // Reset Stats
    gameState.score = 0;
    gameState.styleRank = 0;
    gameState.wave = 1;
    
    if (gameState.gamePhase.includes("GAME_OVER")) gameState.gamePhase = "PLAYING";
    
    // Spawn Wave 1
    spawnWave(1);
}

// Main Loop
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - gameState.lastFrameTime) / 1000, 0.1); // Cap dt
    gameState.deltaTime = dt;
    gameState.lastFrameTime = time;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        updateGame(dt);
    }
    
    // Always render (so pause menu works visually)
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
    
    // Log Game Info (throttled)
    if (gameState.frameCount % 60 === 0) {
        window.logs.game_info.push({
            phase: gameState.gamePhase,
            playerPos: gameState.player ? gameState.player.mesh.position : null,
            score: gameState.score,
            fps: 1/dt
        });
        if (gameState.player) {
            window.logs.player_info.push({
                hp: gameState.player.health,
                pos: gameState.player.mesh.position.clone()
            });
        }
    }
}

function updateGame(dt) {
    // Update Entities
    if (gameState.player) gameState.player.update(dt);
    
    gameState.enemies.forEach(e => e.update(dt));
    gameState.projectiles.forEach(p => p.update(dt));
    gameState.particles.forEach(p => p.update(dt));
    
    // Wave Management
    if (gameState.enemies.length === 0) {
        // Simple delay before next wave could be implemented here
        gameState.wave++;
        spawnWave(gameState.wave);
    }
}

// Test Hook
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode:", mode);
    
    // Auto-setup for tests
    if (mode === "TEST_1") {
        if (gameState.gamePhase === "START") startGame();
        // Teleport player
        if (gameState.player) gameState.player.mesh.position.set(0, 5, 0);
    }
};

// Start
setup();