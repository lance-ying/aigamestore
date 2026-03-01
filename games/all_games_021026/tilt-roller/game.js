import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, logs } from './globals.js';
import { setupInput, updateInput } from './input.js';
import { setupRenderer, setupLighting } from './renderer.js';
import { setupUI, renderUI } from './ui.js';
import { LevelGenerator } from './level_gen.js';
import { PhysicsSystem } from './physics.js';
import { CameraController } from './camera.js';
import { PlayerBall } from './entities.js';

// Systems
const levelGenerator = new LevelGenerator();
const physicsSystem = new PhysicsSystem();
const cameraController = new CameraController();

function init() {
    setupRenderer();
    setupLighting();
    setupUI();
    setupInput();
    
    cameraController.setup();
    
    // Create initial dummy level or wait for start?
    // Let's create level 1
    startLevel(1);
    
    // Start Loop
    requestAnimationFrame(gameLoop);
    
    logGameInfo("INIT_COMPLETE");
}

function startLevel(index) {
    gameState.levelIndex = index;
    gameState.currentTilt.set(0, 0);
    gameState.shouldReset = false;
    
    // Generate Geometry
    levelGenerator.generate(index);
    
    // Create Player
    if (gameState.player) {
        // Cleanup old player mesh if exists (should be handled by level clear technically, but player is separate)
        gameState.worldContainer.remove(gameState.player.mesh);
    }
    gameState.player = new PlayerBall(gameState.playerSpawn);
    gameState.worldContainer.add(gameState.player.mesh);
    
    // Camera Reset
    cameraController.setup();
}

function resetGame() {
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        let nextLevel = gameState.levelIndex + 1;
        // Cap at 4 levels, loop back to 1
        if (nextLevel > 4) {
            nextLevel = 1;
        }
        startLevel(nextLevel);
    } else {
        startLevel(gameState.levelIndex);
    }
    gameState.gamePhase = "PLAYING"; // Always auto-start after restart/next level
    gameState.shouldReset = false;
}

let lastTime = 0;

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap dt
    lastTime = timestamp;
    
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;
    
    // Logic
    if (gameState.shouldReset) {
        resetGame();
    }
    
    updateInput();
    
    if (gameState.gamePhase === "PLAYING") {
        physicsSystem.update(deltaTime);
        cameraController.update();
        
        if (gameState.goal) gameState.goal.update(timestamp / 1000);
        
        // Log player position periodically
        if (gameState.frameCount % 60 === 0 && gameState.player) {
            logs.player_info.push({
                x: gameState.player.position.x,
                y: gameState.player.position.y,
                z: gameState.player.position.z,
                tiltX: gameState.currentTilt.x,
                tiltZ: gameState.currentTilt.y,
                frame: gameState.frameCount
            });
        }
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
         // Freeze is fine.
    }
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
init();