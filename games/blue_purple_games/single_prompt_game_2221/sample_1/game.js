import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameInfo } from './globals.js';
import { input } from './input.js';
import { ui } from './ui.js';
import { cameraSystem } from './camera.js';
import { world } from './world.js';
import { Player, NPC } from './entities.js';

// Setup
function init() {
    // 1. Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // 2. Camera
    cameraSystem.setup();

    // 3. Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    
    // Setup Container
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;
    container.appendChild(gameState.renderer.domElement);
    
    // UI Init
    ui.init();

    // 4. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    gameState.scene.add(sun);

    // 5. World
    world.init();

    // 6. Entities
    gameState.player = new Player(0, 5, 5); // Start mid-air to test physics
    gameState.entities.push(gameState.player);
    
    // Add NPCs
    gameState.npcs.push(new NPC(5, 5, 0xff0000));
    gameState.npcs.push(new NPC(-5, 5, 0x0000ff));
    gameState.npcs.forEach(n => gameState.entities.push(n));
    
    // Start Log
    logGameInfo({ event: "INIT", message: "Game Initialized" });
    
    // Start Loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

let lastTime = 0;

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Cap delta time
    gameState.deltaTime = Math.min(dt, 0.1);
    gameState.frameCount++;
    
    update(gameState.deltaTime);
    render();
    
    // Update input state after logic to correctly detect justPressed events
    input.update();
}

function update(dt) {
    // Global Phase Control
    if (input.justPressed('ENTER') && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        logGameInfo({ event: "PHASE_CHANGE", to: "PLAYING" });
    }
    
    if (input.justPressed('ESC')) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (input.justPressed('RESTART') && gameState.gamePhase.startsWith("GAME_OVER")) {
        resetGame();
    }
    
    if (gameState.gamePhase !== "PLAYING") return;
    
    // Update Entities
    gameState.entities.forEach(e => {
        if (e.update) e.update(dt);
    });
    
    // Update Camera
    cameraSystem.update();
    
    // Test Automation Hooks
    handleAutomatedTests();
}

function render() {
    if (gameState.renderer && gameState.scene && gameState.camera) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
    ui.render();
}

function resetGame() {
    // Simple reload for now, or reset variables
    gameState.gamePhase = "START";
    gameState.inventory = [];
    gameState.money = 0;
    gameState.score = 0;
    gameState.player.mesh.position.set(0, 5, 5);
    gameState.player.physics.velocity.set(0, 0, 0);
    gameState.fishingSystem.state = 'IDLE';
    gameState.fishingSystem.cleanupBobber();
    logGameInfo({ event: "RESET" });
}

// Automated Testing Logic
function handleAutomatedTests() {
    const mode = window.gameState?.controlMode; // Access via window to be safe if injected
    
    if (mode === "TEST_1") {
        // Move Forward Test
        if (gameState.frameCount < 100) {
            input.keys['UP'] = true;
        } else {
            input.keys['UP'] = false;
        }
    }
    
    if (mode === "TEST_2") {
        // Win Game Test (Catch many fish)
        if (gameState.frameCount % 10 === 0 && gameState.inventory.length < 10) {
            gameState.inventory.push({name: "Cheat Fish", value: 100});
        }
        if (gameState.inventory.length >= 10 && gameState.gamePhase === "PLAYING") {
             gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
}

// Expose setControlMode
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset if switching to tests
    if (mode.startsWith("TEST")) {
        gameState.gamePhase = "PLAYING"; // Force start
        if(gameState.player) gameState.player.mesh.position.set(0,5,5);
    }
};

// Start
init();