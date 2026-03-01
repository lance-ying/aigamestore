/**
 * Automated Testing Controller
 * 
 * Provides inputs for automated test scenarios defined in the prompt.
 */

import { gameState, CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (gameState.controlMode === "HUMAN") return null;
    
    const time = gameState.frameCount;
    
    // TEST_1: Movement & Jump
    // Move Right 60 frames, Jump at 60
    if (gameState.controlMode === "TEST_1") {
        if (time < 60) return { keyCode: 39 }; // Right
        if (time === 60) return { keyCode: 32 }; // Jump
    }
    
    // TEST_2: Attack Hitbox
    // Press Z at frame 10
    if (gameState.controlMode === "TEST_2") {
        if (time === 10) return { keyCode: 90 }; // Z
    }
    
    // TEST_3: Win Condition (Aggressive AI)
    // Move towards enemy and attack
    if (gameState.controlMode === "TEST_3") {
        const enemy = gameState.enemies[0];
        if (enemy) {
            const dx = enemy.x - gameState.player.x;
            if (dx > 20) return { keyCode: 39 }; // Right
            if (dx < -20) return { keyCode: 37 }; // Left
            return { keyCode: 90 }; // Attack
        }
    }
    
    return null;
}