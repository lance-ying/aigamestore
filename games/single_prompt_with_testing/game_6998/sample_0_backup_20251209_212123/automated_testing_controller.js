/**
 * automated_testing_controller.js
 * Controls the bot logic for automated testing scenarios.
 */
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function get_automated_testing_action() {
    if (!gameState.player) return;

    const p = gameState.player;
    const nearbyEnemies = gameState.enemies.filter(e => Math.abs(e.x - p.x) < 200 && Math.abs(e.y - p.y) < 100);
    const nearbyPlatforms = gameState.platforms.filter(plat => plat.x > p.x && plat.x < p.x + 200);

    // Default: Reset keys
    const keys = {};

    switch (gameState.controlMode) {
        case "TEST_1": // Basic Movement
            // Hold Right
            keys[39] = true; 
            // Jump periodically
            if (gameState.frameCount % 60 < 10) {
                keys[32] = true;
            }
            break;

        case "TEST_2": // Win Strategy
            // Move Right generally
            keys[39] = true;
            
            // Heuristic: Jump if gap ahead or wall ahead
            // Raycast-ish check (very simplified)
            let gapAhead = true;
            let wallAhead = false;
            
            const checkX = p.x + p.width + TILE_SIZE;
            const checkY = p.y + p.height + 5;
            
            // Check for ground ahead
            for (let plat of gameState.platforms) {
                // Is there a platform under the future position?
                if (plat.x < checkX && plat.x + plat.width > checkX && 
                    plat.y >= p.y + p.height - 10 && plat.y <= p.y + p.height + 50) {
                    gapAhead = false;
                }
                
                // Is there a wall directly in front?
                if (plat.x < checkX && plat.x + plat.width > p.x + p.width &&
                    plat.y < p.y + p.height && plat.y + plat.height > p.y) {
                    wallAhead = true;
                }
            }
            
            if (gapAhead || wallAhead) {
                keys[32] = true; // Jump
            }
            
            // Shoot if enemy nearby
            if (nearbyEnemies.length > 0) {
                keys[90] = true;
            }
            break;
            
        case "TEST_3": // Combat Test (Not strictly required by UI but good logic)
             // Wait for enemy
             if (nearbyEnemies.length > 0) {
                 // Face enemy
                 if (nearbyEnemies[0].x > p.x) keys[39] = true;
                 else keys[37] = true;
                 
                 keys[90] = true; // Shoot
             }
             break;
    }

    return keys;
}