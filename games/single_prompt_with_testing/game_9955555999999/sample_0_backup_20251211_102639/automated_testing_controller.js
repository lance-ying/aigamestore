/**
 * Automated Testing Controller
 * Generates inputs based on game state and selected test mode.
 */

import { gameState } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action(currentState) {
    if (!currentState.player) return null;
    
    const player = currentState.player;
    const enemy = currentState.enemies.length > 0 ? currentState.enemies[0] : null;

    if (currentState.controlMode === 'TEST_1') {
        // Random movement and actions to test physics stability
        const actions = [];
        const r = Math.random();
        
        if (r < 0.05) actions.push(KEYS.SPACE);
        if (r < 0.1) actions.push(KEYS.Z);
        if (r > 0.1 && r < 0.2) actions.push(KEYS.LEFT);
        if (r > 0.2 && r < 0.3) actions.push(KEYS.RIGHT);
        
        // Ensure some continuous movement
        if (Math.floor(Date.now() / 1000) % 2 === 0) actions.push(KEYS.RIGHT);
        else actions.push(KEYS.LEFT);

        return { keys: actions };
    }
    
    if (currentState.controlMode === 'TEST_2') {
        // Win strategy: Aggressively chase and attack
        const actions = [];
        
        if (enemy) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            
            // Move towards enemy
            if (dx > 30) actions.push(KEYS.RIGHT);
            else if (dx < -30) actions.push(KEYS.LEFT);
            else {
                // In range, Attack!
                actions.push(KEYS.Z);
            }
            
            // Jump if enemy is above
            if (dy < -50 && player.isGrounded) actions.push(KEYS.SPACE);
        }
        
        return { keys: actions };
    }
    
    return null;
}