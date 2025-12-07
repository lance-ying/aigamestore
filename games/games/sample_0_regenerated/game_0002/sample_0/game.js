import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RUN_SPEED_START } from './globals.js';
import { resetRNG } from './utils.js';
import { Player } from './entities.js';
import { initWorld, updateWorld } from './world.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupUI, renderUI } from './ui.js';

// Initialization
function init() {
    // Setup container
    gameState.gameContainer = document.getElementById('game-container');
    if (!gameState.gameContainer) {
        console.error("Game container not found!");
        return;
    }

    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);

    // Scene
    gameState.scene = new THREE.Scene();

    // Components
    setupCamera();
    setupLighting();
    setupUI();
    
    // Initial State
    resetGame();
    gameState.gamePhase = "START";
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Clear Scene Objects
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    gameState.pathSegments.forEach(s => {
        gameState.scene.remove(s.mesh);
        if(s.mesh.geometry) s.mesh.geometry.dispose();
    });
    gameState.obstacles.forEach(o => gameState.scene.remove(o.mesh));
    gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
    
    gameState.pathSegments = [];
    gameState.obstacles = [];
    gameState.collectibles = [];
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.runSpeed = RUN_SPEED_START;
    
    resetRNG();
    
    // Re-init World and Player
    initWorld();
    gameState.player = new Player();
    
    // Initial World Gen
    updateWorld(0);
}

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true;
    logInput('keydown', e.key, e.keyCode);

    if (gameState.gamePhase === "START" && e.keyCode === 13) {
        gameState.gamePhase = "PLAYING";
    }
    else if (gameState.gamePhase === "PLAYING") {
        if (e.keyCode === 27) gameState.gamePhase = "PAUSED";
        
        // Gameplay
        if (gameState.player) {
            if (e.keyCode === 37 || e.keyCode === 65) gameState.player.moveLane(1); // Left (run is negative Z, so +X is Left from camera view behind? Wait. Camera looks -Z. Left is -X, Right is +X. Let's check Lane Logic.)
            // Logic: Lane 0 is center. Lane -1 is Left? If Camera looks at 0,0,-10 from 0,5,8. +X is to the right of the screen.
            // So Key Left should decrease X. Key Right should increase X.
            // Let's correct the moveLane call in player class.
            
            if (e.keyCode === 37 || e.keyCode === 65) gameState.player.moveLane(-1); // Left Arrow -> -X
            if (e.keyCode === 39 || e.keyCode === 68) gameState.player.moveLane(1);  // Right Arrow -> +X
            if (e.keyCode === 38 || e.keyCode === 87 || e.keyCode === 32) gameState.player.jump();
            if (e.keyCode === 40 || e.keyCode === 83) gameState.player.slide();
        }
    }
    else if (gameState.gamePhase === "PAUSED" && e.keyCode === 27) {
        gameState.gamePhase = "PLAYING";
    }
    else if ((gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") && e.keyCode === 82) {
        resetGame();
        gameState.gamePhase = "START"; // Or straight to playing? Standard is to Start.
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false;
});

function logInput(type, key, code) {
    if (window.logs) {
        window.logs.inputs.push({
            type, key, code, 
            frame: gameState.frameCount, 
            time: Date.now()
        });
    }
}

// Global hook for control mode
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    if (mode !== "HUMAN") {
        resetGame();
        gameState.gamePhase = "PLAYING";
    }
};

// Main Loop
let lastTime = performance.now();

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        // Logic
        gameState.player.update(deltaTime);
        updatePhysics(deltaTime);
        updateWorld(gameState.player.mesh.position.z);
        handleCollisions();
        updateCamera();
        updateLighting();

        // Testing Automations
        handleAutomatedTesting();
    }

    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

function handleAutomatedTesting() {
    // Simple autoplay for testing
    if (gameState.controlMode === 'TEST_2') {
        gameState.autoPlayTimer += gameState.deltaTime;
        
        // Randomly jump or switch lanes to simulate activity
        if (gameState.autoPlayTimer > 1.0) {
            const r = Math.random();
            if (r < 0.3) gameState.player.jump();
            else if (r < 0.6) gameState.player.moveLane(Math.random() > 0.5 ? 1 : -1);
            gameState.autoPlayTimer = 0;
        }
    }
    
    // Logging player info
    if (window.logs && gameState.player) {
        window.logs.player_info.push({
            x: gameState.player.mesh.position.x,
            y: gameState.player.mesh.position.y,
            z: gameState.player.mesh.position.z,
            state: gameState.player.onGround ? "ground" : "air",
            frame: gameState.frameCount
        });
    }
}

// Start
init();