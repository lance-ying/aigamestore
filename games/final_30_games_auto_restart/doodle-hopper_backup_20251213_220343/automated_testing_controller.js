/**
 * Automated testing AI controller
 */
import { gameState, CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    switch(gameState.controlMode) {
        case "TEST_1": // Win / Survival Strategy
            return runSurvivalStrategy(gameState);
        case "TEST_2": // Random / Stress Test
            return runRandomStrategy();
        case "TEST_3": // Physics Check (Vertical only)
            return { keyCode: 0 }; // No input, just jump naturally
        default:
            return null;
    }
}

function runSurvivalStrategy(gameState) {
    const player = gameState.player;
    const targets = gameState.platforms.filter(p => p.y < player.y && p.active);
    
    // 1. Find nearest platform above
    let bestTarget = null;
    let minDist = 10000;
    
    for (const plat of targets) {
        // Priority to platforms directly above within jump range
        const dy = player.y - plat.y;
        if (dy > 0 && dy < 300) { // Only look at reachable ones
            if (dy < minDist) {
                minDist = dy;
                bestTarget = plat;
            }
        }
    }
    
    // 2. Check for enemies above to shoot
    const enemiesAbove = gameState.enemies.filter(e => 
        e.y < player.y && e.y > player.y - 300 && 
        Math.abs(e.x - player.x) < 50
    );
    
    if (enemiesAbove.length > 0) {
        return { keyCode: 32 }; // Space to shoot
    }
    
    // 3. Move towards target
    if (bestTarget) {
        const targetX = bestTarget.x + bestTarget.width / 2;
        const diffX = targetX - player.x;
        
        if (diffX > 10) return { keyCode: 39 }; // Right
        if (diffX < -10) return { keyCode: 37 }; // Left
    } else {
        // Fallback: Move towards center if lost
        if (player.x < CANVAS_WIDTH/2) return { keyCode: 39 };
        else return { keyCode: 37 };
    }
    
    return null;
}

function runRandomStrategy() {
    const r = Math.random();
    if (r < 0.3) return { keyCode: 37 }; // Left
    if (r < 0.6) return { keyCode: 39 }; // Right
    if (r < 0.8) return { keyCode: 32 }; // Shoot
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;