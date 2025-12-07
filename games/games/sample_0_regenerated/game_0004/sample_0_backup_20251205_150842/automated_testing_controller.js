/**
 * Automated testing controller.
 * Simulates input for testing modes.
 */

import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return { keys: [] };
    
    const action = { keys: [] };
    const player = gameState.player;
    
    // Heuristics
    const nearbyEnemies = gameState.enemies.filter(e => {
        const d = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
        return d < 200;
    });
    
    const enemyBelow = nearbyEnemies.some(e => e.y > player.y && Math.abs(e.x - player.x) < 40);
    
    if (gameState.controlMode === "TEST_1") {
        // Basic randomness to prove movement works
        if (Math.random() < 0.05) {
            action.keys.push(32); // Random Shoot/Jump
        }
        
        // Keep in bounds
        if (player.x < CANVAS_WIDTH * 0.2) action.keys.push(39); // Right
        else if (player.x > CANVAS_WIDTH * 0.8) action.keys.push(37); // Left
        else {
             if (Math.random() < 0.1) action.keys.push(37);
             if (Math.random() < 0.1) action.keys.push(39);
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // Smart Bot for Winning
        
        // 1. Shoot if enemy is directly below (priority)
        if (enemyBelow && !player.onGround && player.ammo > 0) {
            action.keys.push(32); // Space
        }
        
        // 2. Seek nearest platform if needs ammo or just to descend safely
        // Simplified: wiggle down center
        const centerX = CANVAS_WIDTH / 2;
        if (player.x < centerX - 20) action.keys.push(39);
        else if (player.x > centerX + 20) action.keys.push(37);
        
        // 3. Occasionally shoot to slow down fall if falling too fast
        if (player.vy > 8 && player.ammo > 2) {
            action.keys.push(32);
        }
    }
    
    return action;
}