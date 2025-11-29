// game.js - Main game loop and initialization
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupRenderer } from './renderer.js';
import { setupScene } from './scene.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { setupUI, renderUI } from './ui.js';
import { setupInput, processInput } from './input.js';
import { updatePhysics } from './physics.js';
import { Player } from './entities.js';
import { updateTestMode } from './testmode.js';

// Initialize game
function init() {
    // Seed random
    Math.seedrandom(42);
    
    // Setup Three.js
    setupScene();
    setupCamera();
    setupRenderer();
    setupLighting();
    
    // Setup UI
    setupUI();
    
    // Setup input
    setupInput();
    
    // Create player (but don't add to scene until game starts)
    gameState.player = new Player(0, 2, 0);
    
    // Initialize game phase
    gameState.gamePhase = "START";
    
    // Log initial state
    logGameInfo("START", { level: 1 });
}

// Update game logic
function updateGame(deltaTime) {
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;
    
    // Update test mode
    updateTestMode(deltaTime);
    
    // Process input
    if (gameState.controlMode === "HUMAN") {
        processInput();
    }
    
    // Update based on game phase
    switch (gameState.gamePhase) {
        case "START":
            // Waiting for player to start
            break;
        
        case "PLAYING":
            // Update physics and entities
            updatePhysics(deltaTime);
            
            // Update camera
            updateCamera();
            
            // Check win condition
            if (gameState.exitDoor && gameState.player) {
                if (gameState.exitDoor.checkPlayerCollision(gameState.player)) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                    logGameInfo("GAME_OVER_WIN", { 
                        score: gameState.score,
                        level: gameState.currentLevel 
                    });
                }
            }
            break;
        
        case "PAUSED":
            // Game paused - no updates
            break;
        
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            // Game over - waiting for restart
            break;
    }
}

// Render game
function render() {
    if (!gameState.renderer || !gameState.scene || !gameState.camera) return;
    
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Main game loop
let lastTime = performance.now();

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    updateGame(deltaTime);
    render();
}

// Control mode switching
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    gameState.testTimer = 0;
    gameState.testStep = 0;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${mode.toLowerCase()}ModeBtn`).classList.add('active');
    
    // Restart game for test modes
    if (mode !== "HUMAN") {
        gameState.gamePhase = "START";
        gameState.score = 0;
        gameState.currentLevel = 1;
    }
};

// Start game
init();
gameLoop(performance.now());

// Expose game instance
window.gameInstance = {
    gameState,
    init,
    updateGame,
    render
};