/**
 * automated_testing_controller.js
 * Provides input actions for automated testing scenarios.
 */

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === 'TEST_1') {
        // TEST_1: Basic Movement Test
        // Move in a square pattern
        const time = gameState.frameCount % 240;
        
        // Dash occasionally
        if (gameState.frameCount % 180 === 0) return { keyCode: 16 }; // Shift
        
        if (time < 60) return { keyCode: 39 }; // Right
        if (time < 120) return { keyCode: 40 }; // Down
        if (time < 180) return { keyCode: 37 }; // Left
        return { keyCode: 38 }; // Up
    }

    if (gameState.controlMode === 'TEST_2') {
        // TEST_2: Win Strategy (Seek & Destroy)
        
        // 1. Find nearest enemy
        let nearest = null;
        let minRate = 999999;
        
        gameState.entities.forEach(e => {
            if (e.type === 'ENEMY' && !e.isDead) {
                const d = Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2);
                if (d < minRate) {
                    minRate = d;
                    nearest = e;
                }
            }
        });
        
        if (nearest) {
            const dx = nearest.x - player.x;
            const dy = nearest.y - player.y;
            const dist = Math.sqrt(minRate);
            
            // 2. Attack logic
            if (dist < 50) {
                // If in range, attack!
                // Use skill if available
                if (player.stats.mp >= 20 && player.attackCooldown === 0) {
                    return { keyCode: 90 }; // Z
                }
                return { keyCode: 32 }; // Space
            }
            
            // 3. Movement logic (move towards enemy)
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
            } else {
                return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
            }
        } else {
            // No enemies? Wait (or move to center to find spawns)
            return null; 
        }
    }

    return null;
}