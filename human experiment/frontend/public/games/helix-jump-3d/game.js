import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONSTANTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInput, handleInput } from './input.js';
import { setupCamera, updateCamera } from './camera.js';
import { updatePhysics } from './physics.js';
import { Ball, Tower } from './entities.js';
import { setupUI, renderUI } from './ui.js';

// Initialization
function init() {
    // 1. Setup Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // 2. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // 3. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONSTANTS.COLORS.BACKGROUND);
    scene.fog = new THREE.Fog(CONSTANTS.COLORS.BACKGROUND, 10, 30);
    gameState.scene = scene;

    // 4. Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);
    scene.add(dirLight.target);
    gameState.directionalLight = dirLight;

    // 5. Setup Camera
    setupCamera();

    // 6. Setup Game Entities
    gameState.tower = new Tower();
    gameState.ball = new Ball();
    gameState.entities.push(gameState.tower);
    gameState.entities.push(gameState.ball);

    // 7. Setup UI & Input
    setupUI();
    setupInput();

    // 8. Start Loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Log start
    logGameState();
}

function gameLoop(time) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((time - gameState.lastTime) / 1000, 0.1); // Cap dt
    gameState.deltaTime = dt;
    gameState.lastTime = time;
    gameState.frameCount++;

    // Logic
    if (gameState.gamePhase === 'PLAYING') {
        handleInput(dt);
        
        // Update Entities
        gameState.tower.update(dt);
        gameState.ball.update(dt);
        gameState.particles.forEach((p, i) => {
            p.update(dt);
            if (!p.active) gameState.particles.splice(i, 1);
        });

        // Physics
        updatePhysics(dt);
        
        // Camera
        updateCamera(dt);
    } else if (gameState.gamePhase === 'START') {
        // Just idle rotate
        gameState.tower.mesh.rotation.y += dt * 0.2;
    }

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
    
    // Periodic logging
    if (gameState.frameCount % 60 === 0) logGameState();
}

function logGameState() {
    if (window.logs) {
        window.logs.game_info.push({
            phase: gameState.gamePhase,
            score: gameState.score,
            level: Math.floor(Math.abs(gameState.cameraTargetY) / 4) + 1,
            frame: gameState.frameCount,
            time: Date.now()
        });
    }
}

// Restart game without reloading the page
function restartGame() {
    console.log('[HelixJump] Restarting game...');
    
    // Destroy existing entities
    if (gameState.ball) {
        gameState.ball.destroy();
    }
    if (gameState.tower) {
        // Destroy all platforms
        gameState.platforms.forEach(platform => {
            platform.destroy();
        });
        gameState.platforms = [];
        
        // Destroy tower mesh and container
        if (gameState.tower.mesh) {
            gameState.scene.remove(gameState.tower.mesh);
            if (gameState.tower.mesh.geometry) gameState.tower.mesh.geometry.dispose();
            if (gameState.tower.mesh.material) gameState.tower.mesh.material.dispose();
        }
        if (gameState.tower.container) {
            gameState.scene.remove(gameState.tower.container);
            // Dispose of all children in container
            gameState.tower.container.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
    
    // Clear particles
    gameState.particles.forEach(particle => particle.destroy());
    gameState.particles = [];
    
    // Clear entities array
    gameState.entities = [];
    
    // Reset game state
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.level = 1;
    gameState.towerRotation = 0;
    gameState.targetRotation = 0;
    gameState.cameraTargetY = 0;
    gameState.frameCount = 0;
    
    // Recreate entities
    gameState.tower = new Tower();
    gameState.ball = new Ball();
    gameState.entities.push(gameState.tower);
    gameState.entities.push(gameState.ball);
    
    // Reset camera
    setupCamera();
    
    console.log('[HelixJump] Game restarted successfully');
}

// Expose restart function globally
window.restartHelixJump = restartGame;

// Global control mode setter
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log(`Control mode set to: ${mode}`);
    if (mode.startsWith("TEST")) {
        gameState.gamePhase = "PLAYING";
    }
};

// Start
init();