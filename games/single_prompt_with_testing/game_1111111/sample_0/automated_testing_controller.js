import { gameState } from './globals.js';
import { KEYS } from './input.js';

// Controller to simulate inputs for testing modes
export function get_automated_testing_action(gameState) {
    // Only used if controlMode is TEST_X
    
    const mode = gameState.controlMode;
    const player = gameState.player;
    
    if (!player) return null;

    if (mode === 'TEST_1') {
        // Basic Movement Test: Just run right and jump occasionally
        const action = {};
        
        // Run right
        action.keyCode = KEYS.RIGHT;
        
        // Jump every 100 frames
        if (gameState.frameCount % 100 < 10) {
            action.keyCode = KEYS.Z;
        }
        
        return action;
    }
    
    if (mode === 'TEST_2') {
        // Win Test: Play perfectly (cheat: actually we just make the bot invulnerable and fast in the entity class if needed, but here we just give good inputs)
        // Simple heuristic: Always right. Jump if low speed.
        
        // To guarantee a win in a test, we might manipulate state elsewhere, but here we provide inputs.
        // Let's implement a smart runner.
        
        // If speed low, jump.
        if (player.vx < 2) return { keyCode: KEYS.Z };
        
        return { keyCode: KEYS.RIGHT };
    }
    
    return null;
}