// automated_testing_controller.js
import { gameState, WORLD_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    // Helper: returns object { left: bool, right: bool, jump: bool, down: bool }
    
    if (!gameState.player) return null;
    
    const p = gameState.player;
    
    if (gameState.controlMode === 'TEST_1') {
        // TEST_1: Move right continuously
        return { right: true, jump: false, down: false, left: false };
    }
    
    if (gameState.controlMode === 'TEST_2') {
        // TEST_2: Move right and jump
        // Simple interval jump
        const shouldJump = (gameState.frameCount % 60 < 20); // Jump for 20 frames every second
        return { right: true, jump: shouldJump, down: false, left: false };
    }
    
    if (gameState.controlMode === 'TEST_3') {
        // TEST_3: AI Heuristic to collect coins
        // Find nearest uncollected coin
        let target = null;
        let minDist = Infinity;
        
        // Include exit if open
        if (gameState.exitDoor && !gameState.exitDoor.locked) {
            target = gameState.exitDoor;
        } else {
             gameState.collectibles.forEach(c => {
                if (!c.collected) {
                    const dist = Math.abs(c.x - p.x); // Mostly care about x distance for sorting
                    if (dist < minDist) {
                        minDist = dist;
                        target = c;
                    }
                }
            });
        }
        
        if (!target) {
            // No targets? Just run right to exit
            return { right: true, jump: false, down: false, left: false };
        }
        
        let action = { left: false, right: false, jump: false, down: false };
        
        // Horizontal
        if (target.x > p.x + 10) action.right = true;
        else if (target.x < p.x - 10) action.left = true;
        else {
            // X aligned, maybe stop or micro adjust
            if (p.vx > 0) action.left = true; // Brake
            else if (p.vx < 0) action.right = true;
        }
        
        // Vertical / Jump
        // If target is above, or there is an obstacle, jump
        if (target.y < p.y - 30) {
            action.jump = true;
        }
        
        // Obstacle avoidance (Simple)
        // If velocity is low despite pressing move, we are likely stuck -> Jump
        if ((action.right || action.left) && Math.abs(p.vx) < 0.5 && !p.onGround) {
             // Maybe wall stuck
        }
        
        if ((action.right || action.left) && Math.abs(p.vx) < 1.0 && p.onGround) {
             action.jump = true;
        }
        
        // Gap jumping logic: If just about to fall, jump?
        // Hard to detect without raycast.
        // Simple "Bunny hop" strategy if moving:
        if (p.onGround && gameState.frameCount % 40 === 0) {
            // random hop to clear potential hazards
        }
        
        return action;
    }
    
    return null;
}