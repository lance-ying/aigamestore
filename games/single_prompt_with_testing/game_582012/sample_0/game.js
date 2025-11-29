import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, logPlayerInfo, logInput } from './globals.js';
import { setupRenderer } from './renderer.js';
import { setupCamera, updateCamera, applyCameraShake } from './camera.js';
import { setupLighting } from './lighting.js';
import { Player, Monster, Environment } from './entities.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Init
function init() {
    Math.seedrandom('42');
    
    setupRenderer();
    setupCamera();
    setupLighting();
    setupUI();
    
    // Environment is static, add once
    new Environment();
    
    gameState.gamePhase = 'START';
    
    // Global Event Listener for Controls
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // Expose control mode setter
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to: " + mode);
        // If testing, restart to ensure clean state
        if (mode.startsWith("TEST")) {
            resetGame();
            gameState.gamePhase = 'PLAYING';
        }
    };
    
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Clear dynamic entities
    if (gameState.player) gameState.scene.remove(gameState.player.mesh);
    if (gameState.monster) gameState.scene.remove(gameState.monster.mesh);
    gameState.entities.forEach(e => gameState.scene.remove(e.mesh));
    gameState.entities = [];
    
    // Recreate
    gameState.player = new Player(0, 0, 10);
    gameState.monster = new Monster(0, 0, -10);
    
    gameState.score = 0;
    gameState.frameCount = 0;
}

function onKeyDown(e) {
    gameState.keys[e.keyCode] = true;
    logInput('keydown', e.key, e.keyCode);
    
    if (e.keyCode === 13) { // ENTER
        if (gameState.gamePhase === 'START') {
            resetGame();
            gameState.gamePhase = 'PLAYING';
            logGameInfo({ action: "GAME_START" });
        }
    }
    
    if (e.keyCode === 27) { // ESC
        if (gameState.gamePhase === 'PLAYING') gameState.gamePhase = 'PAUSED';
        else if (gameState.gamePhase === 'PAUSED') gameState.gamePhase = 'PLAYING';
    }
    
    if (e.keyCode === 82) { // R
        if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
            gameState.gamePhase = 'START';
        }
    }
}

function onKeyUp(e) {
    gameState.keys[e.keyCode] = false;
    logInput('keyup', e.key, e.keyCode);
}

// Automated Testing Logic
function runTests(deltaTime) {
    if (gameState.controlMode === 'TEST_1') { // Movement Test
        gameState.keys[87] = true; // Hold W
        if (gameState.frameCount > 60) {
            console.log("TEST_1 Complete. Z pos: " + gameState.player.mesh.position.z);
            gameState.controlMode = 'HUMAN';
            gameState.keys[87] = false;
        }
    }
    else if (gameState.controlMode === 'TEST_2') { // Attack Test
        gameState.keys[32] = true; // Press Space
        if (gameState.player.state === 'ATTACK') {
             console.log("TEST_2 Success: Player Attacking");
             gameState.controlMode = 'HUMAN';
             gameState.keys[32] = false;
        }
    }
    else if (gameState.controlMode === 'TEST_3') { // Win Test
        if (gameState.monster) gameState.monster.health = 1;
        gameState.player.mesh.position.copy(gameState.monster.mesh.position).add(new THREE.Vector3(0,0,2));
        gameState.player.mesh.lookAt(gameState.monster.mesh.position);
        gameState.keys[32] = true; // Attack
    }
}

// Loop
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - gameState.lastTime) / 1000, 0.1);
    gameState.lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === 'PLAYING') {
        runTests(dt);
    }
    
    if (gameState.gamePhase === 'PLAYING') {
        // Update Entities
        if (gameState.player) gameState.player.update(dt);
        if (gameState.monster) gameState.monster.update(dt);
        
        // Update Particles/Temp entities
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            if (ent.update(dt)) {
                gameState.entities.splice(i, 1);
            }
        }
        
        updatePhysics(dt);
        handleCollisions();
        updateCamera(dt);
        
        // Log periodically
        if (gameState.frameCount % 60 === 0) {
            logGameInfo({ fps: Math.round(1/dt) });
        }
        logPlayerInfo();
    }
    
    if (gameState.renderer) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
    
    renderUI();
}

// Start
init();