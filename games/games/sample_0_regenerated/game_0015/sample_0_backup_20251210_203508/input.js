/**
 * Input handling and Automated Test Controller.
 */

import { gameState } from './globals.js';
import { getDistance } from './physics.js';

export function handleInput(p) {
    // Phase control keys
    if (p.keyIsDown(13)) { // Enter
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            // Initialize game world handled in game.js setup logic or immediate transition
        }
    }
    
    if (p.keyIsDown(27)) { // ESC
        // Debounce simple
        if (p.frameCount % 10 === 0) { // Simple debounce hack or use keyPressed
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyIsDown(82)) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
            // Restart logic handled in main loop or externally
            // For now, signal main loop
            window.location.reload(); // Hard reset for simplicity or call resetGameState
        }
    }

    // Reset inputs
    gameState.inputs = {
        up: false, down: false, left: false, right: false,
        attack: false, skill: false, dash: false
    };

    if (gameState.gamePhase === "PLAYING") {
        if (gameState.controlMode === "HUMAN") {
            handleHumanInput(p);
        } else {
            handleAutomatedInput(p);
        }
    }
}

function handleHumanInput(p) {
    if (p.keyIsDown(p.LEFT_ARROW)) gameState.inputs.left = true;
    if (p.keyIsDown(p.RIGHT_ARROW)) gameState.inputs.right = true;
    if (p.keyIsDown(p.UP_ARROW)) gameState.inputs.up = true;
    if (p.keyIsDown(p.DOWN_ARROW)) gameState.inputs.down = true;
    
    if (p.keyIsDown(32)) gameState.inputs.attack = true; // Space
    if (p.keyIsDown(90)) gameState.inputs.skill = true; // Z
    if (p.keyIsDown(16)) gameState.inputs.dash = true; // Shift
}

// --- Automated Testing Controller ---

function handleAutomatedInput(p) {
    const mode = gameState.controlMode;
    const player = gameState.player;
    if (!player) return;

    if (mode === "TEST_1") {
        // Movement square
        const t = Math.floor(gameState.frameCount / 60) % 4;
        if (t === 0) gameState.inputs.right = true;
        else if (t === 1) gameState.inputs.down = true;
        else if (t === 2) gameState.inputs.left = true;
        else if (t === 3) gameState.inputs.up = true;
        
    } else if (mode === "TEST_2" || mode === "TEST_3") {
        // Seek and destroy
        // Find nearest enemy
        let target = null;
        let minDist = 10000;
        
        gameState.enemies.forEach(e => {
            const d = getDistance(player.x, player.y, e.x, e.y);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        });
        
        if (target) {
            // Move towards
            if (target.x > player.x + 10) gameState.inputs.right = true;
            if (target.x < player.x - 10) gameState.inputs.left = true;
            if (target.y > player.y + 10) gameState.inputs.down = true;
            if (target.y < player.y - 10) gameState.inputs.up = true;
            
            // Attack if close
            if (minDist < 60) {
                gameState.inputs.attack = true;
                if (Math.random() < 0.05) gameState.inputs.skill = true;
            }
            
            // Dash to close gap
            if (minDist > 100 && Math.random() < 0.02) gameState.inputs.dash = true;
            
        } else {
            // Idle or wander
            gameState.inputs.right = true;
            if (Math.random() < 0.1) gameState.inputs.dash = true;
        }
    }
}