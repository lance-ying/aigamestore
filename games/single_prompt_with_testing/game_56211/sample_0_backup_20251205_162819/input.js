import { gameState } from './globals.js';
import { resetGameState } from './globals.js';

export function handleInput(p, type, keyCode) {
    if (type === 'pressed') {
        if (keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                // Start log
                p.logs.game_info.push({ event: "GAME_START", timestamp: Date.now() });
            }
        }
        
        if (keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_LOSE") {
                resetGame(p);
            }
        }
    }
}

export function checkPlayerControls(p) {
    if (gameState.gamePhase !== 'PLAYING') return;
    if (!gameState.player) return;
    
    // Controls: Space (32) or Up Arrow (38)
    // Handle automated inputs or human inputs
    let isThrusting = false;
    
    if (gameState.controlMode === 'HUMAN') {
        if (p.keyIsDown(32) || p.keyIsDown(38)) {
            isThrusting = true;
        }
    } else {
        // Automated control handled in main loop via automated_testing_controller
        const action = window.get_automated_testing_action(gameState);
        if (action && (action.keyCode === 32 || action.keyCode === 38)) {
            isThrusting = true;
        }
    }
    
    gameState.player.isThrusting = isThrusting;
}

function resetGame(p) {
    resetGameState();
    // Recreate player in game.js setup or here?
    // We'll let the main loop handle re-initialization if needed, 
    // but usually we need to reset the player object.
    // NOTE: gameState.player needs to be reset in game.js or we import Player class here.
    // To avoid circular imports, we might signal a reset flag or handle it in game.js
    // Actually, simple solution: 
    window.gameInstance.resetGameInternal();
}