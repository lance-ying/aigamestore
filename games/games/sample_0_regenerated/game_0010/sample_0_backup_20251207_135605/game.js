import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logs, resetGameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupLighting } from './lighting.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupInputs, clearInputBuffer } from './inputs.js';
import { handleCollisions } from './physics.js';
import { Player, Monster, Tree, updateParticles } from './entities.js';
import { setupUI, renderUI } from './ui.js';

// Init
function init() {
    // Container Setup
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    container.appendChild(gameState.renderer.domElement);

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(COLORS.SKY);
    
    // Fog
    gameState.scene.fog = new THREE.Fog(COLORS.SKY, 20, 80);

    setupCamera();
    setupLighting();
    setupInputs();
    setupUI();
    
    // Setup RNG
    gameState.rng = new Math.seedrandom('monsterhunter'); // Ensure deterministic capability

    // Start Loop
    requestAnimationFrame(gameLoop);
}

function createLevel() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: COLORS.GROUND, roughness: 1.0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    
    // Arena Walls (Invisible physics constraint handled in PhysicsBody, visible simple rocks)
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const r = 38;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        
        // Rock
        const rockGeo = new THREE.DodecahedronGeometry(randomInt(2, 4));
        const rockMat = new THREE.MeshStandardMaterial({ color: COLORS.ROCK });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, 1, z);
        gameState.scene.add(rock);
    }
    
    // Trees
    for (let i = 0; i < 10; i++) {
        const x = randomRange(-30, 30);
        const z = randomRange(-30, 30);
        if (x*x + z*z > 100) { // Keep center clear
            new Tree(x, z);
        }
    }

    // Entities
    gameState.player = new Player(0, 2, 10);
    gameState.monster = new Monster(0, 2, -10);
    
    // Expose for debugging
    gameState.entities.push(gameState.player, gameState.monster);
    
    logs.game_info.push({ event: "LEVEL_CREATED", time: Date.now() });
}

// Helpers from utils were not imported because they are used inside other imported modules or defined there. 
// Adding necessary simple utils here to avoid circular dep if needed or just use logic.
function randomRange(min, max) { return min + Math.random() * (max - min); }
function randomInt(min, max) { return Math.floor(randomRange(min, max + 1)); }


let lastTime = 0;
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    // Handle Reset
    if (gameState.shouldRestart) {
        resetGame();
        gameState.shouldRestart = false;
        gameState.gamePhase = "START";
    }

    if (gameState.gamePhase === "PLAYING") {
        // Init level if not exists
        if (!gameState.player) {
            createLevel();
        }
        
        // Update Entities
        gameState.entities.forEach(e => e.update(dt));
        
        // Physics
        handleCollisions();
        
        // Particles
        updateParticles(dt);
        
        // Camera
        updateCamera(dt);
    }

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();

    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Clean scene
    while(gameState.scene.children.length > 0){ 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    
    resetGameState();
    
    // Re-setup basics
    gameState.scene.background = new THREE.Color(COLORS.SKY);
    gameState.scene.fog = new THREE.Fog(COLORS.SKY, 20, 80);
    setupLighting();
    
    // Reset inputs
    clearInputBuffer();
}

// Start
init();