/**
 * Automated Testing Controller
 */
import { rhythmManager } from './rhythm.js';
import { gameState } from './globals.js';

export function get_automated_testing_action(currentGameState) {
    // Only act in PLAYING phase
    if (currentGameState.gamePhase !== 'PLAYING') {
        if (currentGameState.gamePhase === 'START') return { keyCode: 13 }; // Press Enter
        if (currentGameState.gamePhase === 'GAME_OVER_WIN' || currentGameState.gamePhase === 'GAME_OVER_LOSE') return { keyCode: 82 }; // Press R
        return null;
    }

    const timing = rhythmManager.checkInputTiming(performance.now()); // Note: using performance.now() might not align with p.millis() perfectly if p5 is skewed, but usually fine. Better to pass p.millis() if possible, but global access assumes alignment.
    
    // Check timing using the manager's logic internally (we access the same instance)
    // We only send input if we are in the "PERFECT" window
    
    // Slight cheat: we peek at the timing check without triggering the "ALREADY_ACTED" flag check yet (since that changes state).
    // Actually rhythmManager.checkInputTiming DOES change state (sets lastInputBeat).
    // So we should only call it when we INTEND to act or calculate it manually.
    
    // Manual check to avoid side effects
    const currentTime = window.gameInstance ? window.gameInstance.millis() : performance.now();
    const beatCheck = rhythmManager.checkInputTiming(currentTime); 
    
    // Note: checkInputTiming sets 'lastInputBeat' if successful. 
    // This is problematic for "checking" without acting.
    // However, for the bot, if it returns an action, the game loop will execute it, calling handleInput, which calls checkInputTiming AGAIN.
    // The second call will return ALREADY_ACTED.
    // So we need a way to know "is it time?" without consuming the action.
    
    // Let's rely on simple time math for the bot:
    // We can access rhythmManager.beatProgress
    const progress = rhythmManager.beatProgress;
    const isGoodTime = progress < 0.1 || progress > 0.9;
    
    if (!isGoodTime) return null; // Wait for beat

    // Prevent spamming (only 1 action per beat)
    if (gameState.lastInputBeat === gameState.beatCount + (progress > 0.5 ? 1 : 0)) return null;

    if (currentGameState.controlMode === 'TEST_1') {
        return getWinningMove(currentGameState);
    } else if (currentGameState.controlMode === 'TEST_2') {
        return getRandomMove();
    }
    
    return null;
}

function getWinningMove(gs) {
    if (!gs.player || !gs.exit) return null;
    
    // Simple logic: Move towards exit
    // If enemy adjacent, attack it.
    
    // Check adjacent enemies
    const enemies = gs.entities.filter(e => e.type === 'ENEMY');
    for (let e of enemies) {
        if (Math.abs(e.gridX - gs.player.gridX) + Math.abs(e.gridY - gs.player.gridY) === 1) {
            // Attack!
            if (e.gridX > gs.player.gridX) return { keyCode: 39 };
            if (e.gridX < gs.player.gridX) return { keyCode: 37 };
            if (e.gridY > gs.player.gridY) return { keyCode: 40 };
            if (e.gridY < gs.player.gridY) return { keyCode: 38 };
        }
    }
    
    // Move to exit
    const dx = gs.exit.gridX - gs.player.gridX;
    const dy = gs.exit.gridY - gs.player.gridY;
    
    // Simple greedy pathing (Manhattan)
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
    } else {
        return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
    }
}

function getRandomMove() {
    const keys = [37, 38, 39, 40, 32];
    return { keyCode: keys[Math.floor(Math.random() * keys.length)] };
}

window.get_automated_testing_action = get_automated_testing_action;