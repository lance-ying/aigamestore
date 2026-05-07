/**
 * Automated testing logic.
 * Decides player actions based on test scenarios.
 */

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT, ROOF_HEIGHT } from './globals.js';

export function get_automated_testing_action(currentGameState) {
    if (!currentGameState.player) return false;

    if (currentGameState.controlMode === 'TEST_1') {
        return runSurvivalBot(currentGameState);
    } else if (currentGameState.controlMode === 'TEST_2') {
        return runCoinCollectorBot(currentGameState);
    }
    return false;
}

function runSurvivalBot(state) {
    const player = state.player;
    // Look ahead for obstacles
    // Find nearest obstacle with x > player.x
    
    let nearestObstacle = null;
    let minDist = Infinity;
    
    // Combine zappers and missiles
    const dangers = [...state.obstacles];
    
    for (const obs of dangers) {
        if (!obs.active) continue;
        if (obs.x > player.x && obs.x < player.x + 400) { // Look ahead 400px
            const dist = obs.x - player.x;
            if (dist < minDist) {
                minDist = dist;
                nearestObstacle = obs;
            }
        }
    }
    
    if (nearestObstacle) {
        // Simple logic: If obstacle center is above player, go down (release).
        // If below player, go up (press).
        // Be careful with height.
        
        let obsCenterY = nearestObstacle.y;
        // Adjust for obstacle type
        if (nearestObstacle.constructor.name === 'Zapper') {
             // Zapper Y is center
        } else if (nearestObstacle.constructor.name === 'Missile') {
             // Missile Y is center
        }

        // Target Y: go to opposite side of screen relative to obstacle
        const targetY = (obsCenterY > CANVAS_HEIGHT / 2) ? 100 : CANVAS_HEIGHT - 100;
        
        // PID-like control
        if (player.y > targetY) {
            return true; // Fly up
        } else {
            return false; // Fall
        }
    }
    
    // Default: Stay in middle
    const defaultTarget = CANVAS_HEIGHT / 2;
    return player.y > defaultTarget;
}

function runCoinCollectorBot(state) {
    const player = state.player;
    
    // Find nearest coin
    let nearestCoin = null;
    let minDist = Infinity;
    
    for (const coin of state.collectibles) {
        if (!coin.active) continue;
        if (coin.x > player.x) {
            const dist = coin.x - player.x;
            if (dist < minDist) {
                minDist = dist;
                nearestCoin = coin;
            }
        }
    }
    
    if (nearestCoin) {
        // Try to match Y
        if (player.y > nearestCoin.y) {
            return true; // Fly up
        } else {
            return false; // Fall
        }
    }
    
    // Fallback to survival if no coins
    return runSurvivalBot(state);
}

// Attach to window for game loop access
if (typeof window !== 'undefined') {
    window.get_automated_testing_action = get_automated_testing_action;
}