import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { setupInputs } from './input.js';
import { setupCamera, updateCamera } from './camera.js';
import { updatePhysics } from './physics.js';
import { setupUI, renderUI } from './ui.js';
import { updateParticles } from './particles.js';

// Initialization
function init() {
    // 1. Container
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;
    
    // 2. Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(COLORS.SKY);
    gameState.scene.fog = new THREE.Fog(COLORS.SKY, 20, 60);
    
    // 3. Camera
    setupCamera();
    
    // 4. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;
    
    // 5. Lighting
    setupLighting();
    
    // 6. Systems
    setupInputs();
    setupUI();
    
    // 7. Loop
    requestAnimationFrame(gameLoop);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    
    // Optimize shadow camera box
    const d = 20;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    
    gameState.scene.add(dirLight);
    
    // Make light follow camera X roughly for endless shadows
    gameState.directionalLight = dirLight;
}

let lastTime = 0;

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;
    
    update(deltaTime);
    render();
}

function update(deltaTime) {
    if (gameState.gamePhase === "PLAYING") {
        // Update Player
        if (gameState.player) {
            gameState.player.update(deltaTime);
        }
        
        // Update Entities (Collectibles, Platforms if dynamic, etc.)
        gameState.platforms.forEach(p => p.update(deltaTime));
        gameState.collectibles.forEach(c => c.update(deltaTime));
        
        // Update Particles
        updateParticles(deltaTime);
        
        // Camera Follow
        updateCamera(deltaTime);
        
        // Move Light
        if (gameState.directionalLight && gameState.camera) {
            gameState.directionalLight.position.x = gameState.camera.position.x + 10;
            gameState.directionalLight.target.position.x = gameState.camera.position.x;
            gameState.directionalLight.target.updateMatrixWorld();
        }
    }
    
    // Render UI
    renderUI();
}

function render() {
    if (gameState.renderer && gameState.scene && gameState.camera) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
}

// Start
init();