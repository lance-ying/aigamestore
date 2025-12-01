/**
 * Automated Testing Bot Logic
 */
import { KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_UP } from './input.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player || gameState.gamePhase !== "PLAYING") return null;
    
    const player = gameState.player;
    const platforms = gameState.platforms;
    const enemies = gameState.enemies;
    
    // Common Logic: Find target platform
    // Filter platforms above player
    const validPlatforms = platforms.filter(p => p.y < player.y + 50 && !p.isBroken);
    
    // Sort by height (lowest Y first, closest to bottom/player)
    // Actually we want the nearest one above us, which has Y < player.Y.
    // The "closest" visually is the one with the largest Y that is still < player.y.
    validPlatforms.sort((a, b) => b.y - a.y);
    
    // Target is the first one
    let target = validPlatforms[0];
    
    // Strategy based on Test Mode
    const keys = [];
    let trigger = null;
    
    if (target) {
        // Basic movement to align X
        const tolerance = 10;
        if (player.x < target.x + target.width/2 - tolerance) {
            keys.push(KEY_RIGHT);
        } else if (player.x > target.x + target.width/2 + tolerance) {
            keys.push(KEY_LEFT);
        }
    }
    
    if (gameState.controlMode === "TEST_2") {
        // Check for enemies above
        const enemyAbove = enemies.find(e => 
            e.y < player.y && 
            e.y > player.y - 300 && 
            Math.abs(e.x - player.x) < 100
        );
        
        if (enemyAbove) {
            keys.push(KEY_SPACE);
            trigger = KEY_SPACE;
        }
    }
    
    return { keys, trigger };
}

window.get_automated_testing_action = get_automated_testing_action;