/**
 * automated_testing_controller.js
 * Logic for automated testing modes.
 * Mimics human input based on testing strategies.
 */

import { gameState, CANVAS_WIDTH, PLAYER_JUMP_FORCE } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action(gameState) {
    const mode = gameState.controlMode;
    const player = gameState.player;
    
    // Default no-op
    if (!player || mode === "HUMAN") return null;

    // Output object mimicking key presses
    // We can return a single key code to "press" this frame
    // But since the game loop checks `isKeyDown`, we should manipulate gameState.keys directly
    // OR this function returns an action that input.js or game.js interprets.
    // The prompt implies this function is called. We'll return an object that can be logged or used.
    
    // Strategy for TEST_1: Stability Check
    if (mode === "TEST_1") {
        // Simply move back and forth and jump
        const frame = gameState.frameCount;
        
        // Reset keys first (virtual release)
        gameState.keys[KEYS.LEFT] = false;
        gameState.keys[KEYS.RIGHT] = false;
        gameState.keys[KEYS.SPACE] = false;
        
        if (Math.floor(frame / 60) % 2 === 0) {
            gameState.keys[KEYS.RIGHT] = true;
        } else {
            gameState.keys[KEYS.LEFT] = true;
        }
        
        if (frame % 40 === 0) {
            gameState.keys[KEYS.SPACE] = true;
        }
        
        return { mode: "TEST_1", action: "Patrol & Jump" };
    }
    
    // Strategy for TEST_2: Win Heuristic
    if (mode === "TEST_2") {
        gameState.keys[KEYS.RIGHT] = true; // Always move right
        gameState.keys[KEYS.LEFT] = false;
        gameState.keys[KEYS.SHIFT] = false; // Reset phase
        
        // Jump detection: Check for obstacles ahead
        // We look ahead in the platform list
        const lookAheadDist = 60;
        const playerRight = player.x + player.width;
        const playerBottom = player.y + player.height;
        
        // Check for gap
        let groundAhead = false;
        let wallAhead = false;
        
        // Check ground
        for (let plat of gameState.platforms) {
            // Check if this platform is under the lookahead point
            if (plat.x < playerRight + lookAheadDist && plat.x + plat.width > playerRight + 10 &&
                plat.y >= playerBottom - 10 && plat.y <= playerBottom + 10) {
                groundAhead = true;
            }
            
            // Check for wall
            if (plat.x > playerRight && plat.x < playerRight + lookAheadDist &&
                plat.y < playerBottom && plat.y + plat.height > player.y) {
                
                wallAhead = true;
                if (plat.type === "PHASABLE") {
                    gameState.keys[KEYS.SHIFT] = true; // Phase through
                    wallAhead = false; // Don't jump for phasable walls if phasing
                }
            }
        }
        
        if (!groundAhead || wallAhead) {
            // Only jump if on ground
            if (player.onGround) {
                gameState.keys[KEYS.SPACE] = true;
            } else {
                gameState.keys[KEYS.SPACE] = false; // Release to enable multi-jump logic if any
            }
        } else {
            gameState.keys[KEYS.SPACE] = false;
        }
        
        return { mode: "TEST_2", action: "Pathfinding" };
    }

    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;