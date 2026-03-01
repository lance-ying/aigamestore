/**
 * input.js
 * Handles keyboard input and input logging.
 */

import { gameState } from './globals.js';
import { getIsoDirectionFromInput } from './iso.js';

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    if (!gameState.player) return;
    
    // Movement
    let dx = 0;
    let dy = 0;
    
    if (p.keyIsDown(p.LEFT_ARROW)) dx = -1;
    if (p.keyIsDown(p.RIGHT_ARROW)) dx = 1;
    if (p.keyIsDown(p.UP_ARROW)) dy = -1;
    if (p.keyIsDown(p.DOWN_ARROW)) dy = 1;
    
    if (dx !== 0 || dy !== 0) {
        // If shift held, move faster? (Just animation speed in entities)
        gameState.player.tryMove(dx, dy);
    }
}

export function handleKeyPress(p) {
    // Phase control
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            initLevel(0);
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Wait for R usually, but Enter works too
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase !== "START") {
             // Restart level
             initLevel(gameState.currentLevelIndex);
             gameState.gamePhase = "PLAYING";
        }
    }
    
    // Gameplay Interactions
    if (gameState.gamePhase === "PLAYING") {
        if (p.key === 'z' || p.key === 'Z') {
            // Rotate mechanic
            // Find active rotator (simple: rotate all, or nearest?)
            // For now, rotate all rotators in the level
            if (gameState.level && gameState.level.rotators) {
                gameState.level.rotators.forEach(r => r.rotate());
            }
        }
    }
    
    // Logging
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'keydown',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

// Circular dependency work-around: Import initLevel dynamically or expose it?
// We will assign initLevel to window or import from game.js if we structure right.
// Better: keep initLevel in game.js and export it, but game.js imports input.js.
// Pattern: Pass init function or use global event.
// We will simply attach initLevel to window for now or export a callback setter.

let _initLevelCallback = null;
export function setInitLevelCallback(fn) {
    _initLevelCallback = fn;
}

function initLevel(idx) {
    if (_initLevelCallback) _initLevelCallback(idx);
}