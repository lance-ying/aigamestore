import { gameState } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player || gameState.player.isDead) return null;
    
    const player = gameState.player;
    const enemies = gameState.enemies;
    const gems = gameState.gems;
    
    // Helper to find nearest entity
    const findNearest = (entities) => {
        if (!entities.length) return null;
        let nearest = null;
        let minDst = Infinity;
        entities.forEach(e => {
            const d = Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2);
            if (d < minDst) {
                minDst = d;
                nearest = e;
            }
        });
        return { entity: nearest, distSq: minDst };
    };
    
    const nearestEnemyData = findNearest(enemies);
    const nearestGemData = findNearest(gems);
    
    let action = null;
    
    // TEST 1: Survival - Run away from enemies
    // TEST 2: Win - Collect gems
    // TEST 3: Combat - Aggressive
    
    if (gameState.controlMode === "TEST_1") {
        // Run away if enemy close
        if (nearestEnemyData && nearestEnemyData.distSq < 40000) { // < 200px
            const e = nearestEnemyData.entity;
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            // Move away
            if (Math.abs(dx) > Math.abs(dy)) {
                action = dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
            } else {
                action = dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
            }
            // Shoot randomly to clear path
            if (Math.random() < 0.1) return { keyCode: 32 };
        } else {
            // Random movement if safe
            const r = Math.random();
            if (r < 0.05) action = { keyCode: 37 };
            else if (r < 0.1) action = { keyCode: 39 };
            else if (r < 0.15) action = { keyCode: 38 };
            else if (r < 0.2) action = { keyCode: 40 };
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // Prioritize Gems
        if (nearestGemData && player.gems < 10) {
            const g = nearestGemData.entity;
            const dx = g.x - player.x;
            const dy = g.y - player.y;
             if (Math.abs(dx) > Math.abs(dy)) {
                action = dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
            } else {
                action = dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
            }
        } else if (player.gems >= 10) {
            // Run away / Hide
             if (nearestEnemyData) {
                const e = nearestEnemyData.entity;
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    action = dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
                } else {
                    action = dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
                }
             }
        } else {
             // Hunt nearest enemy if no gems
             if (nearestEnemyData) {
                const e = nearestEnemyData.entity;
                const dx = e.x - player.x;
                const dy = e.y - player.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    action = dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
                } else {
                    action = dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
                }
                // Shoot
                if (nearestEnemyData.distSq < 20000 && Math.random() < 0.2) {
                     return { keyCode: 32 };
                }
             }
        }
    }
    
    // If we have an action object, return it.
    // The main loop calls this once per frame, but keycodes imply presses.
    // We can just return one key per frame to simulate input.
    return action;
}

window.get_automated_testing_action = get_automated_testing_action;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};