// testing.js
// Automated testing controller

import { gameState } from './globals.js';
import { Hex } from './hex_lib.js';
import { findPath, isValidMove, isValidAttack, getEntityAt } from './logic.js';

export function get_automated_testing_action() {
    // Only act during player input phase
    if (gameState.gamePhase !== "PLAYING" || gameState.turnState !== "PLAYER_INPUT") return null;
    
    // Wait for animations to settle
    if (gameState.animations.length > 0) return null;
    
    // 1. Check control mode
    if (gameState.controlMode === "TEST_1" || gameState.controlMode === "TEST_2") {
        return calculateBotMove();
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;

function calculateBotMove() {
    // Simple AI:
    // 1. If adjacent to enemy, attack?
    // 2. Else move towards exit.
    // 3. Avoid danger tiles if possible.
    
    if (!gameState.player || !gameState.exitPos) return null;
    
    const playerHex = new Hex(gameState.player.q, gameState.player.r);
    
    // Priority 1: Check neighbors for enemies to kill (if in aggressive mode or blocking)
    const neighbors = Hex.neighbors(playerHex);
    for (let n of neighbors) {
        if (isValidAttack(n)) {
            // Move cursor to enemy and space
            return simulateCursorInput(n);
        }
    }
    
    // Priority 2: Path to exit
    // Calculate path ignoring danger first
    const path = findPath(playerHex, new Hex(gameState.exitPos.q, gameState.exitPos.r));
    
    if (path.length > 0) {
        const nextStep = path[0];
        const nextKey = Hex.getKey(nextStep);
        
        // Check danger
        const isDangerous = gameState.dangerTiles.has(nextKey);
        
        if (!isDangerous || gameState.controlMode === "TEST_2") { // TEST_2 is brave
            return simulateCursorInput(nextStep);
        } else {
            // Danger! Try to find a safe neighbor to wait/move
            for (let n of neighbors) {
                if (isValidMove(n) && !gameState.dangerTiles.has(Hex.getKey(n))) {
                    return simulateCursorInput(n);
                }
            }
            // If all unsafe, just wait
            return { keyCode: 90 }; // Z
        }
    }
    
    // If no path, wait
    return { keyCode: 90 };
}

function simulateCursorInput(targetHex) {
    // If cursor is NOT at target, move cursor
    // If cursor IS at target, press space
    
    if (gameState.cursor.q === targetHex.q && gameState.cursor.r === targetHex.r) {
        return { keyCode: 32 }; // Space
    }
    
    // Move cursor logic is complex via arrow keys because of the mapping.
    // Hack: For automated testing, we might need to "teleport" cursor or press keys until matches.
    // Since the prompt asks for key inputs:
    // We need to guide the cursor.
    
    const cur = gameState.cursor;
    const tgt = targetHex;
    
    // Simple heuristic to move cursor closer
    const cPix = Hex.toPixel(cur);
    const tPix = Hex.toPixel(tgt);
    
    if (Math.abs(tPix.x - cPix.x) > 10) {
        if (tPix.x > cPix.x) return { keyCode: 39 }; // Right
        else return { keyCode: 37 }; // Left
    }
    
    if (Math.abs(tPix.y - cPix.y) > 10) {
        if (tPix.y > cPix.y) return { keyCode: 40 }; // Down
        else return { keyCode: 38 }; // Up
    }
    
    // If very close (rounding error?), snap logic in game handles it?
    // Let's assume one press moves one hex roughly.
    // Just try random direction if stuck?
    return { keyCode: 39 };
}