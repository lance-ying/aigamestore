// input.js
import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing.js';

export function handleInput(p) {
    // Basic key state tracking provided by p5 keyIsDown, but we need discrete key presses for logs and testing
    // We maintain a custom input object for the update loop to consume
    
    const input = {
        keys: {}
    };

    if (gameState.controlMode === 'HUMAN') {
        input.keys[p.LEFT_ARROW] = p.keyIsDown(p.LEFT_ARROW);
        input.keys[p.RIGHT_ARROW] = p.keyIsDown(p.RIGHT_ARROW);
        input.keys[p.UP_ARROW] = p.keyIsDown(p.UP_ARROW);
        input.keys[p.DOWN_ARROW] = p.keyIsDown(p.DOWN_ARROW);
        input.keys[32] = p.keyIsDown(32); // Space
        input.keys[90] = p.keyIsDown(90); // Z
        input.keys[16] = p.keyIsDown(16); // Shift
    } else {
        // Automated Testing Injection
        const action = get_automated_testing_action(p, gameState);
        if (action) {
            // Reset keys
            input.keys = {}; 
            // Apply automated action
            if (action.keys) {
                action.keys.forEach(k => input.keys[k] = true);
            }
        }
    }
    
    // Log input snapshot
    if (p.logs) {
        const activeKeys = Object.keys(input.keys).filter(k => input.keys[k]);
        if (activeKeys.length > 0) {
            p.logs.inputs.push({
                framecount: p.frameCount,
                keys: activeKeys
            });
        }
    }

    return input;
}

export function handlePhaseInput(p, keyCode) {
    if (keyCode === 13) { // Enter
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Need to reset game, called from game.js usually, but we'll signal it
            window.resetGameInstance();
        }
    }
    
    // Heal input 'Shift' handling for one-off events logic is done in entity update usually for hold,
    // but if we wanted strictly one heal per press, we'd do it here. 
    // For this game, Shift hold to heal is fine (in entities.js).
    if (keyCode === 16 && gameState.gamePhase === "PLAYING") {
        if (gameState.player) gameState.player.heal();
    }
}