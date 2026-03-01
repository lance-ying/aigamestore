/**
 * Controller for automated testing bots.
 * Analyzes game state and determines the next best input.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Spike } from './entities.js';

/**
 * Returns an input object {left, right, jump, boost, brake}
 */
export function get_automated_testing_action(gameState) {
    const action = {
        left: false,
        right: false,
        jump: false,
        boost: false,
        brake: false
    };
    
    if (!gameState.player || gameState.gamePhase !== "PLAYING") {
        return null;
    }
    
    const player = gameState.player;
    
    // --- TEST 1: Simple Physics Check (Hold Right and periodic Jump) ---
    if (gameState.controlMode === "TEST_1") {
        action.right = true;
        if (gameState.frameCount % 120 < 10) { // Jump every 2 seconds roughly
            action.jump = true;
        }
        return action;
    }

    // --- TEST 2: Smart Runner (Look-ahead) ---
    if (gameState.controlMode === "TEST_2") {
        action.right = true;
        
        // Scan ahead
        // Look for gaps (no platform below ahead) or Spikes
        const lookAheadDist = 100;
        const checkX = player.x + lookAheadDist;
        const checkY = player.y + 50; // slightly below player
        
        let groundDetected = false;
        let spikeDetected = false;
        
        // Check for ground
        for(let plat of gameState.platforms) {
            // Is this platform under our lookahead point?
            if (checkX >= plat.x && checkX <= plat.x + plat.width && 
                checkY >= plat.y && checkY <= plat.y + 100) {
                groundDetected = true;
                break;
            }
        }
        
        // Check for spikes immediately in front
        for(let obs of gameState.obstacles) {
            if (obs instanceof Spike) {
                if (obs.x > player.x && obs.x < player.x + 80 &&
                    Math.abs(obs.y - player.y) < 60) {
                    spikeDetected = true;
                }
            }
        }
        
        // Logic
        if (!groundDetected || spikeDetected) {
            action.jump = true;
            // Use double jump if falling
            if (player.vy > 0 && player.canDoubleJump) {
                action.jump = true;
            }
        }
        
        // Speed control
        if (player.vx < 3) action.boost = true;
        
        return action;
    }
    
    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;