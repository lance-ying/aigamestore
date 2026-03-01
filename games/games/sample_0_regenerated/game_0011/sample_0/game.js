import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, getGameState, logGameInfo, CANVAS_WIDTH, CANVAS_HEIGHT, 
    SPEED_INCREMENT, MAX_SPEED, BASE_SPEED 
} from './globals.js';
import { setupInputs, keys, clearInputQueue } from './input.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { Player, Demon } from './entities.js';
import { initWorld, updateWorld } from './world.js';
import { handleCollisions } from './physics.js';
import { initUI, renderUI } from './ui.js';
import { resetRNG } from './utils.js';
import { updateAI } from './ai.js';

// Setup Container
const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
gameContainer.style.width = `${CANVAS_WIDTH}px`;
gameContainer.style.height = `${CANVAS_HEIGHT}px`;
gameContainer.style.position = 'relative';
gameContainer.style.overflow = 'hidden';
document.body.appendChild(gameContainer);
gameState.gameContainer = gameContainer;

// Setup Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gameContainer.appendChild(renderer.domElement);
gameState.renderer = renderer;

// Setup Scene
const scene = new THREE.Scene();
gameState.scene = scene;

// Initial Setup
setupCamera();
setupLighting();
setupInputs();
initUI();

// Expose control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    // Reset focus to body so keyboard works immediately
    window.focus();
};

function resetGame() {
    // Clear old entities
    if (gameState.player) scene.remove(gameState.player.mesh);
    if (gameState.demon) scene.remove(gameState.demon.mesh);
    
    gameState.segments.forEach(s => scene.remove(s.mesh));
    gameState.obstacles.forEach(o => scene.remove(o.mesh));
    gameState.coins.forEach(c => scene.remove(c.mesh));
    
    gameState.segments = [];
    gameState.obstacles = [];
    gameState.coins = [];
    
    // Reset state
    resetRNG();
    gameState.score = 0;
    gameState.coinsCollected = 0;
    gameState.distanceTraveled = 0;
    gameState.runSpeed = BASE_SPEED;
    gameState.frameCount = 0;
    gameState.time = 0;
    clearInputQueue();
    
    // Init World
    initWorld();
    
    // create entities
    gameState.player = new Player();
    gameState.demon = new Demon();
}

// Game Loop
let lastTime = performance.now();

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const dtMs = currentTime - lastTime;
    const dt = Math.min(dtMs / 1000, 0.1); // cap dt
    lastTime = currentTime;
    
    gameState.deltaTime = dt;
    
    if (gameState.gamePhase === 'PLAYING') {
        gameState.frameCount++;
        gameState.time += dt;
        gameState.score += gameState.runSpeed * 10; // Score based on distance
        
        // Increase speed
        if (gameState.runSpeed < MAX_SPEED) {
            gameState.runSpeed += SPEED_INCREMENT;
        }

        // Updates
        updateAI(dt);
        if (gameState.player) gameState.player.update(dt);
        if (gameState.demon) gameState.demon.update(dt);
        
        updateWorld();
        handleCollisions();
        updateCamera();
        updateLighting();

    } else if (gameState.gamePhase === 'START') {
        // Spin camera around logic could go here
    }

    // Render
    renderer.render(scene, gameState.camera);
    renderUI();
}

// Start loop
resetGame(); // Init basic world state for title screen background
gameLoop(performance.now());