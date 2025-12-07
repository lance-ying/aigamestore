import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, getGameState, logGameEvent, PLAYER_SPEED_INITIAL } from './globals.js';
import { setupRenderer, setupLighting, renderUI } from './renderer.js';
import { setupCamera, updateCamera } from './camera.js';
import { Player, Coin, Obstacle } from './entities.js';
import { PathManager } from './world.js';
import { updatePhysics } from './physics.js';

// Expose classes for instance checks
gameState.CoinClass = Coin;
gameState.ObstacleClass = Obstacle;

// Input State
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false
};

function init() {
    // 1. Setup Three.js
    gameState.scene = new THREE.Scene();
    setupRenderer();
    setupCamera();
    setupLighting();
    
    // Seed RNG
    Math.seedrandom('temple_run_seed');
    
    // Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Loop
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset State
    gameState.score = 0;
    gameState.coins = 0;
    gameState.speed = PLAYER_SPEED_INITIAL;
    gameState.entities = [];
    
    // Clear Scene (keep lights/camera)
    gameState.scene.children = gameState.scene.children.filter(c => c.isLight || c.isCamera);
    
    // Create World
    gameState.pathManager = new PathManager();
    gameState.player = new Player();
    
    gameState.gamePhase = "PLAYING";
    logGameEvent('game_info', { action: 'start_game' });
}

function handleKeyDown(e) {
    // Phase Controls
    if (e.code === 'Enter' && gameState.gamePhase === "START") startGame();
    if (e.code === 'KeyR' && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
        gameState.gamePhase = "START";
    }
    if (e.code === 'Escape') {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    // Game Controls
    if (gameState.gamePhase === "PLAYING") {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            gameState.player.jump();
            logGameEvent('inputs', { key: 'jump' });
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            gameState.player.slide();
            logGameEvent('inputs', { key: 'slide' });
        }
        
        // Turning vs Lane Change
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            handleHorizontalInput(1); // Left logic
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            handleHorizontalInput(-1); // Right logic
        }
    }
}

function handleHorizontalInput(dir) { // 1 = Left, -1 = Right
    // Check if in turn zone
    if (gameState.inTurnZone) {
        // Check if input matches required turn
        if (dir === gameState.requiredTurnDir) {
            // EXECUTE TURN
            gameState.player.turn(dir);
            // Snap position to pivot to avoid running into wall during turn
            gameState.player.mesh.position.x = gameState.turnPivot.x;
            gameState.player.mesh.position.z = gameState.turnPivot.z;
            
            gameState.inTurnZone = false; // Turn consumed
            logGameEvent('inputs', { key: 'turn', dir: dir });
        } else {
             // Wrong turn direction - probably death soon
        }
    } else {
        // Lane Change
        // Inverted for visual logic?
        // If dir=1 (Left Key), we want to go Left relative to player.
        // Player.moveLane(-1) moves Left.
        // Wait, standardized: moveLane(-1) is Left.
        // dir is 1 for Left Key. So moveLane(1) ??
        // Let's fix semantics:
        // Left Key -> moveLane(1) (Positive Local X is Left)
        gameState.player.moveLane(dir);
        logGameEvent('inputs', { key: 'lane_change', dir: dir });
    }
}

function handleKeyUp(e) {
    // Reset flags if needed
}

// Global hook for test buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Mode set to " + mode);
    // Auto-restart for clean test state
    gameState.gamePhase = "START"; 
};

function runAutoTests() {
    if (!gameState.player || gameState.gamePhase !== "PLAYING") return;
    
    const pPos = gameState.player.mesh.position;
    const pDir = gameState.player.direction;
    
    // Simple AI: Raycast or Check Entities ahead
    // Find closest entity in front
    let nearestDist = 999;
    let nearestEnt = null;
    
    // Look for obstacles
    gameState.entities.forEach(ent => {
        if (!ent.active || !(ent instanceof Obstacle)) return;
        
        const vecToEnt = new THREE.Vector3().subVectors(ent.mesh.position, pPos);
        const dist = vecToEnt.length();
        
        // Dot product to check if in front
        if (vecToEnt.normalize().dot(pDir) > 0.8 && dist < nearestDist) {
            nearestDist = dist;
            nearestEnt = ent;
        }
    });
    
    // Check for Turns
    // We can use the inTurnZone flag or distance to end of current segment
    // But pathManager automatically sets inTurnZone
    
    if (gameState.controlMode === "TEST_1" || gameState.controlMode === "TEST_2" || gameState.controlMode === "TEST_3") {
        
        // Obstacle Avoidance
        if (nearestEnt && nearestDist < 8) {
            if (nearestEnt.type === "LOG" && !gameState.player.isJumping) {
                gameState.player.jump();
            } else if (nearestEnt.type === "BEAM" && !gameState.player.isSliding) {
                gameState.player.slide();
            }
        }
        
        // Turning
        if (gameState.inTurnZone) {
            // Execute correct turn
            // Note: in TEST_4 we might skip this to fail
            if (gameState.controlMode !== "TEST_4") {
                 handleHorizontalInput(gameState.requiredTurnDir);
            }
        }
        
        // Center Lane logic
        // If not turning or dodging, try to stay in center
        // (Optional for stability)
    }
    
    if (gameState.controlMode === "TEST_4") {
        // Suicide mode: Don't turn
        // Do nothing
    }
}

let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        // Logic
        gameState.score += 10 * dt; // Distance score
        gameState.speed += 0.1 * dt; // Acceleration
        
        if (gameState.controlMode !== "HUMAN") {
            runAutoTests();
        }
        
        gameState.player.update(dt);
        gameState.pathManager.update();
        gameState.entities.forEach(e => {
            if (e.update) e.update(dt);
        });
        
        updatePhysics(dt);
        updateCamera(dt);
    }
    
    // Render
    if (gameState.renderer && gameState.scene && gameState.camera) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
    
    renderUI();
}

init();