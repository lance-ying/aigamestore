import { gameState } from './globals.js';
import { KEYS } from './input.js';

// Controller to simulate inputs based on controlMode
export function get_automated_testing_action(currentGameState) {
    if (!currentGameState.player) return null;

    const p = currentGameState.player;

    if (currentGameState.controlMode === "TEST_1") {
        // Test 1: Basic Gravity and Platforming
        // Move right, jump periodically
        if (currentGameState.frameCount % 120 < 60) {
            return { keyCode: KEYS.RIGHT };
        } else {
            return { keyCode: KEYS.SPACE };
        }
    }
    
    if (currentGameState.controlMode === "TEST_2") {
        // Test 2: Shoot mechanics
        // Jump, then spam shoot
        if (p.onGround) return { keyCode: KEYS.SPACE };
        
        // In air, spam space
        if (currentGameState.frameCount % 10 === 0) return { keyCode: KEYS.SPACE };
        
        return null;
    }

    if (currentGameState.controlMode === "TEST_WIN") {
        // Win strat: Just fall down, avoid walls, shoot if necessary (simplified)
        // Just move towards center
        const centerX = 300;
        if (p.x < centerX - 20) return { keyCode: KEYS.RIGHT };
        if (p.x > centerX + 20) return { keyCode: KEYS.LEFT };
        
        // If falling fast, shoot to slow down? Or just shoot to clear path
        if (!p.onGround && Math.random() > 0.9) return { keyCode: KEYS.SPACE };
        
        return null;
    }

    return null;
}

window.get_automated_testing_action = get_automated_testing_action;