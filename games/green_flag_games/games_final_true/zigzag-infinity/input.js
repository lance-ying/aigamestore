/**
 * Input handling.
 */

import { gameState, getGameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    // Phase controls
    if (p.keyIsDown(13)) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Change: PLAYING");
        }
    }

    if (p.keyIsDown(27)) { // ESC
        // Debounce simple
        if (p.frameCount % 10 === 0) {
             if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
             else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyIsDown(82)) { // R
        if (gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart is handled in game.js via function call usually, or we flag it
            // For now, we'll let game.js check this or expose reset
            window.gameInstance.resetGame();
        }
    }
    
    // Automated Input injection
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
        const action = get_automated_testing_action(gameState);
        if (action && action.switch) {
            if (gameState.player) gameState.player.switchDirection();
        }
        return;
    }
}

export function keyPressed(p) {
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            type: 'keyPressed',
            key: p.key,
            keyCode: p.keyCode,
            frameCount: p.frameCount
        });
    }

    // Gameplay Controls
    // Space(32), Arrows(37-40), Z(90), Shift(16)
    const validKeys = [32, 37, 38, 39, 40, 90, 16];
    
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
        if (validKeys.includes(p.keyCode)) {
            if (gameState.player) {
                gameState.player.switchDirection();
            }
        }
    }
}

function logGameInfo(p, info) {
    if (p.logs) {
        p.logs.game_info.push({
            info: info,
            timestamp: Date.now(),
            frameCount: p.frameCount
        });
    }
}