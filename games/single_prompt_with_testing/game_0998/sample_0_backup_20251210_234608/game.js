import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, getGameState, resetGameState, logs, 
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG 
} from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupInput } from './input.js';
import { setupUI, renderUI } from './ui.js';
import { Jelly, PlatformPair, Liquid, Collectible, updateParticles } from './entities.js';
import { updatePhysics } from './physics.js';
import { randomRange } from './utils.js';

// Initialization
function init() {
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    gameContainer.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White bg
    scene.fog = new THREE.Fog(0xffffff, 10, 60);
    gameState.scene = scene;

    // Setup Systems
    setupCamera();
    setupLighting();
    setupInput();
    setupUI();

    // Initial Entity Setup
    resetGame();
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    resetGameState();
    
    // Clear Scene
    while(gameState.scene.children.length > 0){ 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    
    // Re-add lights
    gameState.lights = []; // Clear ref
    setupLighting();

    // Create Initial Entities
    gameState.player = new Jelly(0, 2, 0);
    gameState.liquid = new Liquid();
    
    // Initial Base Platform
    const base = new PlatformPair(1, false);
    base.state = 'CLOSED';
    base.leftBlock.position.x = -5;
    base.rightBlock.position.x = 5;
    
    // Set seed
    Math.seedrandom('42');
    
    gameState.lastPlatformHeight = 1;
}

function spawnPlatform() {
    const heightIncrement = 3; // Jumpable height
    const y = gameState.lastPlatformHeight + heightIncrement;
    const isRotated = gameState.level % 2 !== 0; // Alternate axis
    
    const platform = new PlatformPair(y, isRotated);
    
    // Sometimes add collectible
    if (Math.random() > 0.5) {
        new Collectible(
            randomRange(-2, 2),
            y + 1.5,
            randomRange(-2, 2)
        );
    }
    
    gameState.lastPlatformHeight = y;
    gameState.level++;
    
    // Auto-close after delay? Or trigger based on player?
    // In this style, we trigger close immediately for challenge
    setTimeout(() => {
        if (gameState.gamePhase === "PLAYING") {
            platform.close();
        }
    }, 100); // Reduced wait from 500ms to 100ms so platforms are ready faster
}

function handleGameLogic(timeScale) {
    // Spawner - scale timer by timeScale
    gameState.timeSinceLastSpawn += timeScale;
    const interval = Math.max(60, GAME_CONFIG.PLATFORM_SPAWN_INTERVAL - (gameState.level * 2));
    
    // Spawn condition: If top platform is closed or enough time passed
    if (gameState.timeSinceLastSpawn > interval) {
        // Only spawn if player is high enough (don't overwhelm)
        if (gameState.player.mesh.position.y > gameState.lastPlatformHeight - 10) {
            spawnPlatform();
            gameState.timeSinceLastSpawn = 0;
            gameState.score += 10; // Score for surviving/progressing
        }
    }
    
    // Automated Testing Logic
    if (gameState.controlMode.startsWith("TEST")) {
        runAutomatedTests();
    }
}

function runAutomatedTests() {
    const player = gameState.player;
    if (!player) return;

    if (gameState.controlMode === "TEST_1") {
        // Simple Jump test
        if (gameState.frameCount === 60) player.jump();
    } 
    else if (gameState.controlMode === "TEST_2") {
        // Perfect play
        // Jump when platform spawns above
        if (gameState.platforms.length > 0) {
            const target = gameState.platforms[gameState.platforms.length - 1];
            // Simple heuristic: jump periodically
            if (player.onGround && gameState.frameCount % 100 === 0) {
                player.jump();
            }
        }
    }
}

let lastTime = performance.now();

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    // Calculate deltaTime in seconds
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    gameState.deltaTime = deltaTime; 
    
    // Calculate timeScale relative to 60FPS target
    // 60FPS -> ~0.016s -> timeScale 1.0
    // 120FPS -> ~0.008s -> timeScale 0.5
    const timeScale = deltaTime * 60;
    
    if (gameState.gamePhase === "PLAYING") {
        gameState.frameCount++;
        
        // Update Entities with timeScale
        if (gameState.player) gameState.player.update(timeScale);
        if (gameState.liquid) gameState.liquid.update(timeScale);
        
        gameState.platforms.forEach(p => p.update(timeScale));
        gameState.collectibles.forEach(c => c.update(timeScale));
        updateParticles(timeScale);
        
        // Update Physics with timeScale
        updatePhysics(timeScale);
        
        // Game Logic (Spawning)
        handleGameLogic(timeScale);
        
        // Update Systems
        updateCamera();
        updateLighting();
    }
    
    // Restart Handler
    if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && gameState.keys.KeyR) {
        resetGame();
        gameState.gamePhase = "START";
    }

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Window Globals
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

// Start
init();