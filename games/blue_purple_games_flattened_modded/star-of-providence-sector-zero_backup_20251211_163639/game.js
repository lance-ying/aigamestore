/**
 * game.js
 * Main entry point and game loop.
 */

import { gameState, initLogs, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE } from './globals.js';
import { handleInput, onKeyPressed, onKeyReleased, clearInputFrame } from './input.js';
import { renderUI, renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';
import { loadLevel } from './levelgen.js';
import { checkAABB } from './physics.js';

const p5 = window.p5;

let gameInstance = new p5(p => {

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initialize basic state
        gameState.gamePhase = "START";
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, message: "Game Initialized" },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // 1. Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // 2. Background with Screenshake
        p.push();
        if (gameState.cameraShake > 0) {
            const sx = p.random(-gameState.cameraShake, gameState.cameraShake);
            const sy = p.random(-gameState.cameraShake, gameState.cameraShake);
            p.translate(sx, sy);
            gameState.cameraShake *= 0.9;
            if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
        }
        
        p.background(COLOR_PALETTE.background);
        
        // 3. State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Draw game frozen in background
                renderPausedOverlay(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
                
            case "RESTART_PENDING":
                resetGame(p);
                break;
                
            case "NEXT_LEVEL_TRANSITION":
                handleLevelTransition(p);
                break;
        }
        
        p.pop(); // End Screenshake
        
        clearInputFrame();
    };
    
    p.keyPressed = function() {
        onKeyPressed(p);
    };
    
    p.keyReleased = function() {
        onKeyReleased(p);
    };
});

function updateGame(p) {
    // If just started playing and no level loaded
    if (!gameState.player && gameState.currentFloor === 1) {
        loadLevel(p, 1);
    }
    
    // Sort entities for Z-index if needed (walls first, then items, then units)
    // Here we can just render array specific or main list
    // Update Entities
    gameState.entities.forEach(e => e.update(p));
    gameState.projectiles.forEach(e => e.update(p));
    gameState.pickups.forEach(e => e.update(p));
    gameState.particles.forEach(e => e.update(p));
    if (gameState.door) gameState.door.update(p);
    
    // Cleanup Dead Entities
    gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
    gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
    gameState.projectiles = gameState.projectiles.filter(e => !e.markedForDeletion);
    gameState.pickups = gameState.pickups.filter(e => !e.markedForDeletion);
    gameState.particles = gameState.particles.filter(e => e.life > 0);
    
    // Check Win Condition (Boss dead)
    if (gameState.currentFloor === 5 && gameState.enemies.length === 0 && gameState.entities.some(e => e === gameState.player)) {
         // Delay slightly?
         if (!gameState.winTimer) gameState.winTimer = 0;
         gameState.winTimer++;
         if (gameState.winTimer > 120) {
             gameState.gamePhase = "GAME_OVER_WIN";
         }
    }
}

function renderGame(p) {
    // Walls
    gameState.walls.forEach(w => w.render(p));
    
    // Door
    if (gameState.door) gameState.door.render(p);
    
    // Pickups
    gameState.pickups.forEach(pu => pu.render(p));
    
    // Entities (Player & Enemies)
    gameState.entities.forEach(e => e.render(p));
    
    // Projectiles
    gameState.projectiles.forEach(prj => prj.render(p));
    
    // Particles (Top layer)
    gameState.particles.forEach(pt => pt.render(p));
}

function handleLevelTransition(p) {
    // Simple fade or direct
    gameState.currentFloor++;
    if (gameState.currentFloor > 5) {
        gameState.gamePhase = "GAME_OVER_WIN";
        return;
    }
    
    // Reset player position but keep stats?
    const hp = gameState.player.health;
    const wpn = gameState.player.weaponLevel;
    
    loadLevel(p, gameState.currentFloor);
    
    // Restore stats
    gameState.player.health = hp;
    gameState.player.weaponLevel = wpn;
    
    gameState.gamePhase = "PLAYING";
    
    p.logs.game_info.push({
        data: { message: `Level ${gameState.currentFloor} Started` },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

function resetGame(p) {
    resetGameState();
    p.randomSeed(42); // Ensure consistent start for reproduction
    loadLevel(p, 1);
    gameState.gamePhase = "START"; // Actually, let's go back to start screen to be safe, or direct play? Instructions say R -> Start Screen.
}

// Window Global helper for buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
    
    // Update buttons
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
    
    // If game is running, reset to apply mode cleanly or just continue?
    // Let's reset to ensure test starts fresh
    if (gameState.gamePhase !== "START") {
         resetGameState();
         gameState.gamePhase = "START";
    }
};

window.gameInstance = gameInstance;