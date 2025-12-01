import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupCamera, updateCamera } from './camera.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { Player, Enemy, Collectible, Platform, updateParticles } from './entities.js';
import { setupUI, renderUI } from './ui.js';
import { randomRange } from './utils.js';

// Setup Renderer
function setupRenderer() {
    const container = document.getElementById('game-container') || document.body;
    
    // Create container if using fallback body
    if (container === document.body) {
        gameState.gameContainer = document.createElement('div');
        gameState.gameContainer.id = 'game-container';
        gameState.gameContainer.style.width = CANVAS_WIDTH + 'px';
        gameState.gameContainer.style.height = CANVAS_HEIGHT + 'px';
        gameState.gameContainer.style.position = 'relative';
        gameState.gameContainer.style.overflow = 'hidden';
        document.body.appendChild(gameState.gameContainer);
    } else {
        gameState.gameContainer = container;
    }

    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);

    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x050505);
    gameState.scene.fog = new THREE.Fog(0x050505, 10, 35);
}

// Level Generation
function generateLevel() {
    // Ground
    const groundGeo = new THREE.BoxGeometry(1000, 4, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(250, -4, 0); // Start at 0, go far right
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    
    // Create Platforms and Obstacles
    for (let x = 20; x < 500; x += 30) {
        if (Math.random() > 0.3) {
            const h = randomRange(1, 3);
            const w = randomRange(3, 8);
            const y = randomRange(0, 4);
            const p = new Platform(x, y, 0, w, 0.5, 3);
            gameState.platforms.push(p);
            
            // Chance for enemy on platform
            if (Math.random() > 0.5) {
                const enemy = new Enemy(x, y + 1.5, 0, Math.random() > 0.8 ? 'golem' : 'crawler');
                gameState.enemies.push(enemy);
            }
        } else {
            // Ground enemy
            const enemy = new Enemy(x, 0, 0, Math.random() > 0.7 ? 'golem' : 'crawler');
            gameState.enemies.push(enemy);
        }
    }
    
    // Distribute Stones
    const stoneInterval = 500 / 9;
    for (let i = 1; i <= 9; i++) {
        const x = i * stoneInterval - randomRange(0, 20);
        const y = randomRange(1, 4);
        const stone = new Collectible(x, y, 0);
        gameState.collectibles.push(stone);
    }
}

// Inputs
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false,
    " ": false, Shift: false
};

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        // Logging
        window.logs.inputs.push({
            input_type: 'keydown',
            data: { key: e.key, keyCode: e.keyCode },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });

        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
        
        // Phase Controls
        if (e.code === 'Enter') {
            if (gameState.gamePhase === "START") gameState.gamePhase = "PLAYING";
        }
        if (e.code === 'Escape') {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        if (e.code === 'KeyR') {
            if (gameState.gamePhase.includes("GAME_OVER")) restartGame();
        }
        if (e.code === 'KeyZ') {
            if (gameState.gamePhase === "PLAYING" && gameState.player) {
                gameState.player.swapWeapon();
            }
        }
        
        // Jump
        if (e.code === 'Space') {
            if (gameState.gamePhase === "PLAYING" && gameState.player) {
                gameState.player.jump();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });
}

function handleInput() {
    if (!gameState.player) return;

    let dx = 0;
    let dz = 0;

    if (keys.ArrowRight || keys.d) dx += 1;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    // z movement allowed slightly for depth but limited
    // if (keys.ArrowUp || keys.w) dz -= 1;
    // if (keys.ArrowDown || keys.s) dz += 1;

    // Sprint
    if (keys.Shift) dx *= 1.5;

    gameState.player.move(dx, dz);
    
    // Keep player in bounds z-wise
    if (gameState.player.mesh.position.z > 2) gameState.player.mesh.position.z = 2;
    if (gameState.player.mesh.position.z < -2) gameState.player.mesh.position.z = -2;
}

function restartGame() {
    // Clear Scene
    while(gameState.scene.children.length > 0){ 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    
    gameState.entities = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.platforms = [];
    gameState.score = 0;
    gameState.stonesCollected = 0;
    
    setupLighting();
    generateLevel();
    
    gameState.player = new Player(0, 0, 0);
    
    // Testing Hooks
    if (gameState.controlMode === 'TEST_1') {
        // Test 1: Movement check
        // Player already at 0,0,0
    }
    else if (gameState.controlMode === 'TEST_2') {
        // Test 2: Combat - spawn enemy close
        const dummy = new Enemy(3, 0, 0, 'crawler');
        dummy.health = 10; // 1 hit
        gameState.enemies.push(dummy);
    } else if (gameState.controlMode === 'TEST_4') {
        // Win condition test - spawn stone right here
        const stone = new Collectible(1, 0, 0);
        // Remove others
        gameState.collectibles = [stone];
        gameState.totalStones = 1;
    }
    
    gameState.gamePhase = "PLAYING";
}

function init() {
    // Seed
    Math.seedrandom(42);
    
    setupRenderer();
    setupCamera();
    setupUI();
    setupInputs();
    setupLighting(); // Initial lighting setup
    
    // Initial content
    generateLevel();
    gameState.player = new Player(0, 0, 0);
    
    requestAnimationFrame(gameLoop);
}

let lastTime = 0;
function gameLoop(time) {
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    gameState.frameCount++;
    gameState.deltaTime = deltaTime;
    
    // Logging
    if (gameState.frameCount % 60 === 0) {
        window.logs.game_info.push({
            game_status: gameState.gamePhase,
            score: gameState.score,
            player_pos: gameState.player ? gameState.player.mesh.position : null,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
        
        if (gameState.player) {
            window.logs.player_info.push({
                x: gameState.player.mesh.position.x,
                y: gameState.player.mesh.position.y,
                z: gameState.player.mesh.position.z,
                health: gameState.player.health,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }

    if (gameState.gamePhase === "PLAYING") {
        
        // TEST MODES INPUT INJECTION
        if (gameState.controlMode === 'TEST_1') {
            // Move right
            if (gameState.frameCount < 60) gameState.player.move(1, 0);
            if (gameState.frameCount === 60) gameState.player.jump();
        } else if (gameState.controlMode === 'TEST_3') {
             if (gameState.frameCount === 10) gameState.player.swapWeapon();
        }

        handleInput();
        
        // Updates
        if (gameState.player) gameState.player.update(deltaTime);
        gameState.enemies.forEach(e => e.update(deltaTime));
        gameState.collectibles.forEach(c => c.update(deltaTime));
        updateParticles();
        
        updatePhysics(deltaTime);
        handleCollisions();
        
        updateCamera();
        updateLighting();
    }
    
    renderUI();
    gameState.renderer.render(gameState.scene, gameState.camera);
    
    requestAnimationFrame(gameLoop);
}

// Global control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Auto restart on mode change for clean state
    if (gameState.scene) restartGame();
};

init();