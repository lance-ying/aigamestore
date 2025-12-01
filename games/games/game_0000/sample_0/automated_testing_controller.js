import { gameState } from './globals.js';

export function get_automated_testing_action() {
    if (!gameState.player) return null;

    const mode = gameState.controlMode;
    
    // Helper to press keys
    const press = (code) => ({ keyCode: code });

    if (mode === "TEST_1") {
        // Simple Move Right
        return press(39); // Right Arrow
    }
    
    if (mode === "TEST_2") {
        // Move Right + Jump at gap
        // Heuristic: If x > 280 and x < 400 (gap in level 1), Jump
        if (gameState.currentLevelIndex === 0) {
            if (gameState.player.x > 280 && gameState.player.x < 350) {
                return press(32); // Jump/Inflate
            }
            return press(39); // Right
        }
        // Fallback
        return press(39);
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;