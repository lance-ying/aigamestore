import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TEAMS, logGameInfo, getGameState } from './globals.js';
import { Character, Bot, Projectile } from './entities.js';
import { updatePhysicsEntity } from './physics.js';
import { generateLevel } from './level.js';
import { setupLighting } from './lighting.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupUI, renderUI } from './ui.js';

// Input State
const keys = {};
let lastTime = 0;

// Initialization
function init() {
    // Container Setup
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
    gameState.scene = scene;

    setupCamera();
    setupLighting();
    setupUI();
    
    // Initial Setup
    generateLevel();
    
    // Event Listeners
    window.addEventListener('keydown', e => keys[e.keyCode] = true);
    window.addEventListener('keyup', e => keys[e.keyCode] = false);
    
    // Start Loop
    requestAnimationFrame(gameLoop);
    
    logGameInfo({ action: "init", status: "success" });
}

// Main Game Logic
function update(deltaTime) {
    // Phases
    if (gameState.gamePhase === "START") {
        handleMenuInput();
        return;
    }
    
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        if (keys[82]) { // R
            resetGame();
        }
        updateCamera(); // Orbit
        return;
    }
    
    if (gameState.gamePhase === "PAUSED") {
        if (keys[27]) { // ESC toggle handled in keydown event usually, but here polling
             // Basic debounce needed or separate handler
        }
        return;
    }

    if (gameState.gamePhase === "PLAYING") {
        gameState.matchTime -= deltaTime;
        if (gameState.matchTime <= 0) {
            // Overtime or End
            gameState.gamePhase = "GAME_OVER_LOSE"; // Time out usually means defense wins, assume player is attack
        }
        
        handleGameInput(deltaTime);
        updateEntities(deltaTime);
        updateGameLogic(deltaTime);
        updateCamera();
    }
}

function handleMenuInput() {
    // Class Select
    if (keys[37]) { // Left
        cycleClass(-1);
        keys[37] = false; // crude debounce
    }
    if (keys[39]) { // Right
        cycleClass(1);
        keys[39] = false;
    }
    
    if (keys[13]) { // Enter
        spawnPlayer();
        spawnBots();
        gameState.gamePhase = "PLAYING";
        keys[13] = false;
    }
}

function cycleClass(dir) {
    const classes = ['SCOUT', 'SOLDIER', 'HEAVY'];
    let idx = classes.indexOf(gameState.selectedClass);
    idx += dir;
    if (idx < 0) idx = classes.length - 1;
    if (idx >= classes.length) idx = 0;
    gameState.selectedClass = classes[idx];
}

function handleGameInput(dt) {
    const player = gameState.player;
    if (!player || player.health <= 0) return;

    // Rotation
    const rotateSpeed = 2.0 * dt;
    if (keys[37]) gameState.camera.rotation.y += rotateSpeed; // Left Arrow
    if (keys[39]) gameState.camera.rotation.y -= rotateSpeed; // Right Arrow
    
    // Pitch
    if (keys[38]) gameState.camera.rotation.x += rotateSpeed; // Up Arrow
    if (keys[40]) gameState.camera.rotation.x -= rotateSpeed; // Down Arrow
    // Clamp pitch
    gameState.camera.rotation.x = Math.max(-1.5, Math.min(1.5, gameState.camera.rotation.x));

    // Movement
    // Calculate forward/right vectors relative to Y-rotation only
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), gameState.camera.rotation.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), gameState.camera.rotation.y);
    
    const moveSpeed = player.speed * 20; // Scale up for physics
    const acc = new THREE.Vector3();
    
    if (keys[87]) acc.add(forward); // W
    if (keys[83]) acc.sub(forward); // S
    if (keys[65]) acc.sub(right);   // A
    if (keys[68]) acc.add(right);   // D
    
    if (acc.lengthSq() > 0) {
        acc.normalize().multiplyScalar(moveSpeed * dt);
        player.velocity.x += acc.x;
        player.velocity.z += acc.z;
    }
    
    // Jump
    if (keys[32] && player.onGround) { // Space
        player.velocity.y = 0.35; // Jump force
        // Double jump for scout
        if (player.classType === 'SCOUT') player.jumps = 1; 
    }
    
    // Shoot
    if (keys[90]) { // Z
        player.shoot();
        keys[90] = false; // Semi-auto feel or spam
    }
    
    // Test Automation Hooks
    if (gameState.controlMode === 'TEST_1') {
        player.velocity.z = -0.1; // Force move
    }
    if (gameState.controlMode === 'TEST_2') {
         if (gameState.projectiles.length === 0) player.shoot(); // Force shoot
    }
}

function updateEntities(dt) {
    const all = [gameState.player, ...gameState.entities, ...gameState.projectiles, ...gameState.particles];
    
    // Physics & Logic
    gameState.entities.forEach(ent => {
        if (ent.update) ent.update(dt);
        if (!ent.isStatic && !ent.isRocket) updatePhysicsEntity(ent, dt, gameState.walls);
    });
    
    if (gameState.player) {
        gameState.player.update(dt);
        updatePhysicsEntity(gameState.player, dt, gameState.walls);
    }
    
    gameState.projectiles.forEach(p => p.update(dt));
    gameState.particles.forEach(p => p.update(dt));
    
    // Cleanup
    gameState.entities = gameState.entities.filter(e => !e.toBeRemoved);
    gameState.projectiles = gameState.projectiles.filter(p => !p.toBeRemoved);
    gameState.particles = gameState.particles.filter(p => !p.toBeRemoved);
    
    if (gameState.player && gameState.player.toBeRemoved) {
        gameState.gamePhase = "GAME_OVER_LOSE"; // Died
    }
}

function updateGameLogic(dt) {
    // Control Point Logic
    const cp = gameState.controlPoint;
    const captureRadius = cp.radius;
    
    let redCount = 0;
    let blueCount = 0;
    
    // Check player
    if (gameState.player && gameState.player.mesh.position.distanceTo(cp.mesh.position) < captureRadius) {
        redCount++;
    }
    
    // Check entities (bots)
    gameState.entities.forEach(e => {
        if (e instanceof Bot && !e.toBeRemoved) {
            if (e.mesh.position.distanceTo(cp.mesh.position) < captureRadius) {
                if (e.team === TEAMS.RED) redCount++;
                if (e.team === TEAMS.BLUE) blueCount++;
            }
        }
    });
    
    // Update progress
    if (redCount > 0 && blueCount === 0) {
        gameState.captureProgress += gameState.captureRate;
    } else if (blueCount > 0 && redCount === 0) {
        gameState.captureProgress -= gameState.captureRate;
    } else if (redCount === 0 && blueCount === 0) {
        // Decay
        if (gameState.captureProgress > 0) gameState.captureProgress -= 0.05;
        if (gameState.captureProgress < 0) gameState.captureProgress += 0.05;
    }
    
    gameState.captureProgress = Math.min(100, Math.max(-100, gameState.captureProgress));
    
    // Win Condition
    if (gameState.captureProgress >= 100) {
        gameState.gamePhase = "GAME_OVER_WIN";
    }
    if (gameState.captureProgress <= -100) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

function spawnPlayer() {
    const start = gameState.spawnPoints[TEAMS.RED];
    gameState.player = new Character(start.x, start.y, start.z, TEAMS.RED, gameState.selectedClass);
    // Explicit add to scene handled in constructor, but reference needed
}

function spawnBots() {
    // Spawn 3 Enemies
    for (let i = 0; i < 3; i++) {
        const start = gameState.spawnPoints[TEAMS.BLUE];
        const x = start.x + (i - 1) * 5;
        const type = i % 2 === 0 ? 'SOLDIER' : 'HEAVY';
        const bot = new Bot(x, start.y, start.z, TEAMS.BLUE, type);
        gameState.entities.push(bot);
    }
}

function resetGame() {
    // Clear everything
    gameState.entities.forEach(e => gameState.scene.remove(e.mesh));
    gameState.projectiles.forEach(p => gameState.scene.remove(p.mesh));
    gameState.particles.forEach(p => gameState.scene.remove(p.mesh));
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.captureProgress = 0;
    gameState.matchTime = 180;
    
    generateLevel(); // Respawn pickups
    gameState.gamePhase = "START";
}

// Game Loop
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    update(dt);
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Global hook for controls
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};

// Start
init();