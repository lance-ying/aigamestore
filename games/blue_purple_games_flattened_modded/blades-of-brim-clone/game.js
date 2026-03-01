import * * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState, GAME_SPEED_MAX } from './globals.js';
import { setupInput, processInput } from './input.js';
import { Player, Collectible, Enemy, Obstacle } from './entities.js';
import { updateWorld } from './world.js';
import { setupUI, renderUI } from './ui.js';
import { checkAABB } from './utils.js';

// Setup Three.js
function init() {
    // Container
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;
    if (!document.getElementById('game-container')) {
        // Create if missing (fallback)
        const div = document.createElement('div');
        div.id = 'game-container';
        div.style.width = `${CANVAS_WIDTH}px`;
        div.style.height = `${CANVAS_HEIGHT}px`;
        div.style.position = 'relative';
        div.style.overflow = 'hidden';
        document.body.appendChild(div);
        gameState.gameContainer = div;
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.gameContainer.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
    gameState.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, -5);
    gameState.camera = camera;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    scene.add(dirLight);

    // Setup Systems
    setupInput();
    setupUI();
    
    // Seed RNG
    Math.seedrandom('42');

    // Start Loop
    requestAnimationFrame(gameLoop);
}

// Main Loop
function gameLoop(time) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((time - gameState.lastFrameTime) / 1000, 0.1); // Cap dt
    gameState.lastFrameTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;

    processInput();

    if (gameState.gamePhase === 'PLAYING') {
        updateGame(dt);
    }
    
    // Camera follow
    if (gameState.player && gameState.player.mesh) {
        const pPos = gameState.player.mesh.position;
        // Smooth follow X
        gameState.camera.position.x += (pPos.x * 0.5 - gameState.camera.position.x) * 5 * dt;
        gameState.camera.position.z = pPos.z + 8;
        gameState.camera.lookAt(pPos.x * 0.2, pPos.y + 1, pPos.z - 5);
    }

    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

function updateGame(dt) {
    // Initialize Player if needed
    if (!gameState.player) {
        resetGameState();
        gameState.player = new Player();
    }

    // Move Player Forward (World Space)
    gameState.player.mesh.position.z -= gameState.gameSpeed * 10 * dt;
    gameState.distance = -gameState.player.mesh.position.z;
    
    // Increase speed over time
    if (gameState.gameSpeed < GAME_SPEED_MAX) {
        gameState.gameSpeed += 0.005 * dt;
    }

    // World Generation
    updateWorld(gameState.player.mesh.position.z);

    // Update Entities
    gameState.player.update(dt);
    
    // Filter dead entities
    gameState.entities = gameState.entities.filter(e => e.active);

    gameState.entities.forEach(entity => {
        entity.update(dt);
        
        // Check collision with player
        if (entity.active && checkAABB(gameState.player.bbox, entity.bbox)) {
            if (entity instanceof Collectible) {
                entity.collect();
            } else if (entity instanceof Obstacle) {
                // Check for landing on top
                const pMinY = gameState.player.bbox.min.y;
                const eMaxY = entity.bbox.max.y;
                const isFalling = gameState.player.velocity.y <= 0;
                
                // If player is falling and their feet are near the top of the obstacle
                if (isFalling && pMinY > eMaxY - 0.5) {
                    // Safe landing
                    gameState.player.mesh.position.y = eMaxY;
                    gameState.player.velocity.y = 0;
                    gameState.player.isJumping = false;
                } else {
                    gameState.player.takeDamage(100); // Instant kill for walls if hit side/bottom
                }
            } else if (entity instanceof Enemy) {
                if (!gameState.player.isAttacking) {
                    gameState.player.takeDamage(30);
                    entity.die(); // Enemy dies on impact but hurts player
                }
            }
        }
    });
}

// Start
init();

// Global hooks for buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode; // This will now always be 'HUMAN'
    console.log(`Control Mode set to: ${mode}`);
    // Restart game to apply clean state
    gameState.gamePhase = 'START';
    resetGameState();
    if (gameState.player) {
        gameState.scene.remove(gameState.player.mesh);
        gameState.player = null;
    }
    // Remove all entities
    gameState.entities.forEach(e => e.destroy());
    gameState.entities = [];
    gameState.worldChunks.forEach(c => c.destroy());
    gameState.worldChunks = [];
};