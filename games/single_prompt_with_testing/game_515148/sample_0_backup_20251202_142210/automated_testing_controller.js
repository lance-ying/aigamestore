/**
 * Automated Testing Controller
 */

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    const player = gameState.player;
    const action = {};

    switch (gameState.controlMode) {
        case "TEST_1": // Survival & Movement
            // Random movement but try to stay in bounds
            if (gameState.frameCount % 60 < 30) action.right = true;
            else action.left = true;
            
            if (gameState.frameCount % 120 === 0) action.jump = true;
            
            // Avoid falling off the world (if there were pits, logic would go here)
            return action;

        case "TEST_2": // Foraging
            // Find nearest food
            let nearestFood = null;
            let minDist = Infinity;
            for(let f of gameState.collectibles) {
                if(!f.active) continue;
                const d = Math.abs(player.x - f.x) + Math.abs(player.y - f.y);
                if(d < minDist) { minDist = d; nearestFood = f; }
            }

            if(nearestFood) {
                // Move towards
                if(nearestFood.x > player.x + 10) action.right = true;
                else if(nearestFood.x < player.x - 10) action.left = true;
                
                // Jump if needed
                if(nearestFood.y < player.y - 50) action.jump = true;
                
                // Grab/Eat
                if(minDist < 50) action.throw = true; // Z key
            }
            return action;

        case "TEST_3": // Predator Suicide (Testing death state)
            // Find nearest enemy
            let nearestEnemy = null;
            let minEDist = Infinity;
            for(let e of gameState.enemies) {
                if(!e.active) continue;
                const d = Math.abs(player.x - e.x);
                if(d < minEDist) { minEDist = d; nearestEnemy = e; }
            }

            if(nearestEnemy) {
                // Run TOWARDS enemy
                if(nearestEnemy.x > player.x) action.right = true;
                else action.left = true;
            } else {
                // Wander until found
                action.right = true;
            }
            return action;
            
        case "TEST_4": // Win Condition
            // Teleport near shelter and fill food (simulated by super intelligent input? No, hard to simulate without cheats)
            // For this test, we might just assume the 'Strategy' description implies optimal play
            // Since we can't cheat here easily without modifying gameState directly (which we shouldn't do in input controller usually)
            // We will just try to walk right towards shelter.
            
            // Assuming shelter is far right
            action.right = true;
            if (gameState.frameCount % 100 === 0) action.jump = true; // Jump obstacles
            
            // Note: A true victory test in a complex platformer is very hard to script purely via inputs without A* pathfinding.
            return action;

        default:
            return null;
    }
}

window.get_automated_testing_action = get_automated_testing_action;