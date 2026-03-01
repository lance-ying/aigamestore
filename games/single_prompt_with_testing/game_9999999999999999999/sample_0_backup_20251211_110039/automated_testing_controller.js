/**
 * automated_testing_controller.js
 * Controls automated testing actions.
 */

import { gameState } from './globals.js';

export function get_automated_testing_action(gs) {
    if (gs.controlMode === 'HUMAN') return null;

    const action = {
        moveX: 0,
        moveY: 0,
        shoot: false,
        dash: false
    };
    
    if (!gs.player) return action;

    if (gs.controlMode === 'TEST_1') {
        // Random movement survival
        if (gs.frameCount % 60 < 20) action.moveX = 1;
        else if (gs.frameCount % 60 < 40) action.moveX = -1;
        
        if (Math.floor(gs.frameCount / 100) % 2 === 0) action.moveY = 1;
        else action.moveY = -1;
        
        // Random shooting
        action.shoot = gs.frameCount % 20 < 10;
        
        // Occasional dash
        action.dash = gs.frameCount % 120 === 0;
    }
    else if (gs.controlMode === 'TEST_2') {
        // God Mode Win
        gameState.godMode = true; // Enable god mode
        if (gs.player) gs.player.weaponLevel = 5; // Max power
        
        // 1. Find target (Enemy or Door)
        let target = null;
        
        if (gs.enemies.length > 0) {
            // Target nearest enemy
            let minDist = Infinity;
            for(let e of gs.enemies) {
                const d = Math.hypot(e.x - gs.player.x, e.y - gs.player.y);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            }
            action.shoot = true;
        } else if (gs.door) {
            target = gs.door;
            action.shoot = false;
        }
        
        // 2. Move to target
        if (target) {
            const dx = target.x - gs.player.x;
            const dy = target.y - gs.player.y;
            
            // Normalize
            const mag = Math.sqrt(dx*dx + dy*dy);
            if (mag > 0) {
                action.moveX = dx/mag;
                action.moveY = dy/mag;
            }
            
            // Dash if far
            if (mag > 100) action.dash = true;
        }
    }
    
    return action;
}

window.get_automated_testing_action = get_automated_testing_action;