import { gameState, KEYS } from './globals.js';
import { startNewGame } from './input.js';

export function get_automated_testing_action(gameState) {
    if (gameState.controlMode === 'HUMAN') return null;
    
    // Simple state machine for testing
    // Start game if not started
    if (gameState.gamePhase === 'START' || gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
        return { keyCode: KEYS.ENTER }; // Or logic to trigger start
    }

    if (gameState.controlMode === 'TEST_1') {
        // Basic Move & Jump test
        if (gameState.frameCount % 120 < 60) return { keyCode: KEYS.RIGHT, type: 'hold' };
        if (gameState.frameCount % 120 === 60) return { keyCode: KEYS.SPACE, type: 'press' };
    }

    if (gameState.controlMode === 'TEST_2') {
        // Auto-win / Combat bot
        const player = gameState.player;
        if (!player) return;

        // Find nearest enemy
        let target = null;
        let minDist = 9999;
        gameState.enemies.forEach(e => {
            const d = Math.abs(e.x - player.x);
            if (d < minDist) { minDist = d; target = e; }
        });

        if (target) {
            if (minDist > 80) {
                // Move towards
                return { keyCode: target.x > player.x ? KEYS.RIGHT : KEYS.LEFT, type: 'hold' };
            } else {
                // Attack
                return { keyCode: KEYS.Z, type: 'press' };
            }
        } else {
            // Run to right
             return { keyCode: KEYS.RIGHT, type: 'hold' };
        }
    }
    
    return null;
}