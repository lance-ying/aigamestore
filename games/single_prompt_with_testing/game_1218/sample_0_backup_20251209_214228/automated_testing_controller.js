/**
 * automated_testing_controller.js
 * AI logic for automated testing modes.
 */

import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === "TEST_1") {
        // Random walking and jumping
        const rand = Math.random();
        return {
            left: rand < 0.3,
            right: rand > 0.3 && rand < 0.6,
            jump: Math.random() < 0.1,
            jumpPressed: Math.random() < 0.05,
            shoot: Math.random() < 0.2,
            shootPressed: Math.random() < 0.1
        };
    } 
    
    if (gameState.controlMode === "TEST_2") {
        // Ascend Logic
        // 1. Find nearest platform above player
        let targetPlat = null;
        let minDist = 9999;
        
        for (let plat of gameState.platforms) {
            if (plat.y < player.y - 10 && plat.y > player.y - 200) { // Look above
                 const dist = Math.abs(plat.x - player.x) + (player.y - plat.y);
                 if (dist < minDist) {
                     minDist = dist;
                     targetPlat = plat;
                 }
            }
        }
        
        if (targetPlat) {
            const dx = targetPlat.x - player.x;
            return {
                left: dx < -10,
                right: dx > 10,
                jump: true, // Hold jump for max height
                jumpPressed: player.onGround || Math.random() < 0.05, // Spam jump
                up: true // Look up
            };
        } else {
             // Wander if no platform found (top of map or stuck)
             return {
                 right: true,
                 jump: Math.random() < 0.1
             };
        }
    }
    
    if (gameState.controlMode === "TEST_3") {
        // Combat logic
        // Find nearest enemy
        let nearestEnemy = null;
        let minDist = 9999;
        
        for (let e of gameState.enemies) {
            if (!e.active) continue;
            const dist = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = e;
            }
        }
        
        const action = {
            shoot: true,
            shootPressed: Math.random() < 0.5
        };
        
        if (nearestEnemy) {
            if (nearestEnemy.x < player.x) action.left = true; // Face left
            else action.right = true; // Face right
            
            if (nearestEnemy.y < player.y - 50) action.up = true; // Aim up
        }
        
        return action;
    }

    return null;
}