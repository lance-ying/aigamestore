import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updatePhysics } from './physics.js';
import { Player } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { generateLevel } from './level_gen.js';
import { setupUI, renderUI } from './ui.js';

// Input State
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false,
    " ": false, z: false, Shift: false
};

function initGame() {
    // 1. Setup Container
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;

    // 2. Setup Three.js
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    container.appendChild(gameState.renderer.domElement);

    setupCamera();
    setupLighting();
    setupUI();
    initLogs();

    // 3. Initialize Random
    // Using hardcoded seed for reproducibility as requested
    Math.seedrandom('42');

    // 4. Initial Game State
    gameState.gamePhase = "START";
    gameState.gameInstance = { reset: resetGame }; // Expose instance
    window.gameInstance = gameState.gameInstance;

    // Start Loop
    requestAnimationFrame(gameLoop);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    gameState.scene.add(dirLight);
}

function startGame() {
    resetGame();
    gameState.gamePhase = "PLAYING";
}

function resetGame() {
    // Clear entities
    gameState.entities.forEach(e => {
        if (e.mesh) gameState.scene.remove(e.mesh);
    });
    gameState.entities = [];
    
    // Clear platforms and points
    gameState.platforms.forEach(p => gameState.scene.remove(p.mesh));
    gameState.grapplePoints.forEach(p => gameState.scene.remove(p.mesh));
    gameState.platforms = [];
    gameState.grapplePoints = [];

    // Generate Level
    generateLevel();

    // Create Player
    gameState.player = new Player(0, 3, 0);
    
    gameState.frameCount = 0;
}

// Input Handling
window.addEventListener('keydown', (e) => {
    // Map keys
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = true;
    }
    
    // Log input
    gameState.logs.inputs.push({
        type: 'keydown',
        key: e.key,
        frame: gameState.frameCount,
        time: Date.now()
    });

    // Phase transitions
    if (gameState.gamePhase === "START" && e.code === "Enter") {
        startGame();
    } else if (gameState.gamePhase === "PLAYING" && e.code === "Escape") {
        gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED" && e.code === "Escape") {
        gameState.gamePhase = "PLAYING";
    } else if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && (e.key === "r" || e.key === "R")) {
        gameState.gamePhase = "START"; // Go back to start screen
        resetGame(); // Reset positions but wait for Enter to play
    }
    
    // Mechanics triggers (Jump/Grapple)
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (e.key === " " && !e.repeat) {
            gameState.player.jump();
        }
        if ((e.key === "z" || e.key === "Z" || e.key === "Shift") && !e.repeat) {
            gameState.player.startGrapple();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = false;
    }
    
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (e.key === "z" || e.key === "Z" || e.key === "Shift") {
            gameState.player.stopGrapple();
        }
    }
});

function handlePlayerInput() {
    const p = gameState.player;
    if (!p) return;

    // Movement forces
    const moveForce = 0.02;
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    // Apply force relative to camera/world
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
        p.velocity.add(forward.clone().multiplyScalar(moveForce));
    }
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
        p.velocity.add(forward.clone().multiplyScalar(-moveForce));
    }
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        p.velocity.add(right.clone().multiplyScalar(-moveForce));
    }
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        p.velocity.add(right.clone().multiplyScalar(moveForce));
    }
    
    // Apply swing force if grappling
    if (p.isGrappling) {
        if (keys["ArrowUp"] || keys["w"]) p.velocity.add(forward.clone().multiplyScalar(moveForce * 1.5));
    }
}

// Automated Testing Logic
function runTests() {
    if (!gameState.player && gameState.gamePhase === "PLAYING") return;
    const p = gameState.player;

    switch (gameState.controlMode) {
        case "TEST_1": // Rolling test
            if (gameState.frameCount < 10) startGame();
            if (gameState.frameCount >= 10 && gameState.frameCount < 70) {
                p.velocity.add(new THREE.Vector3(0, 0, -0.05)); // Simulate holding W
            }
            if (gameState.frameCount === 70) {
                console.log("TEST_1 Z pos:", p.position.z);
            }
            break;
        case "TEST_2": // Jump test
            if (gameState.frameCount < 10) startGame();
            if (gameState.frameCount === 20) p.jump();
            break;
        case "TEST_3": // Crumble Test
            if (gameState.frameCount < 10) {
                startGame();
                // Move platform under player to be CRUMBLE type
                const plat = gameState.platforms.find(pl => pl.position.z === 0); // Start plat
                if (plat) plat.type = 'CRUMBLE';
            }
            break;
        case "TEST_5": // Death
            if (gameState.frameCount === 10) startGame();
            if (gameState.frameCount === 20) p.position.y = -60;
            break;
        case "TEST_6": // Win
            if (gameState.frameCount === 10) startGame();
            if (gameState.frameCount === 20) p.position.z = -gameState.levelLength - 10;
            break;
    }
}

let lastTime = 0;
let accumulator = 0;
const FIXED_STEP = 1/60;

function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap dt
    lastTime = currentTime;
    
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        accumulator += deltaTime;
        
        while (accumulator >= FIXED_STEP) {
            // Run logic at fixed time step (60Hz)
            if (gameState.controlMode === "HUMAN") {
                handlePlayerInput();
            } else {
                runTests();
            }

            // Sub-step physics for stability
            const steps = 4;
            const dt = FIXED_STEP / steps;
            for(let i=0; i<steps; i++) {
                updatePhysics(dt);
            }
            
            // Update entities visuals/logic
            gameState.entities.forEach(e => e.update(FIXED_STEP));
            gameState.grapplePoints.forEach(p => p.update(FIXED_STEP));
            
            accumulator -= FIXED_STEP;
        }
        
        updateCamera();
        
        // Log Player Info
        if (gameState.player) {
            gameState.logs.player_info.push({
                x: gameState.player.position.x,
                y: gameState.player.position.y,
                z: gameState.player.position.z,
                vx: gameState.player.velocity.x,
                vy: gameState.player.velocity.y,
                vz: gameState.player.velocity.z,
                state: gameState.player.onGround ? 'ground' : 'air',
                frame: gameState.frameCount
            });
        }
    }
    
    // Log Game Info
    gameState.logs.game_info.push({
        phase: gameState.gamePhase,
        frame: gameState.frameCount,
        fps: 1/deltaTime
    });

    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
    
    requestAnimationFrame(gameLoop);
}

// Global functions for test buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode Set:", mode);
    // Reset to ensure clean test state
    gameState.gamePhase = "START";
    resetGame();
};

// Start
initGame();