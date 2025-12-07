import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    // Automated testing input injection
    const autoAction = get_automated_testing_action(gameState);
    if (autoAction) {
        processKey(p, autoAction.keyCode);
    }
}

export function handleKeyPress(p) {
    // Log physical input
    p.logs.inputs.push({
        type: 'pressed',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount
    });
    
    processKey(p, p.keyCode);
}

function processKey(p, keyCode) {
    const { player, gamePhase } = gameState;
    
    // Global State Controls
    if (keyCode === 13) { // ENTER
        if (gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    else if (keyCode === 27) { // ESC
        if (gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    else if (keyCode === 82) { // R
        if (gamePhase === "GAME_OVER_LOSE" || gamePhase === "GAME_OVER_WIN") {
            window.resetGame();
        }
    }
    
    // Gameplay Controls
    if (gamePhase === "PLAYING" && player) {
        switch(keyCode) {
            case 37: // LEFT
                player.move(-1, 0);
                break;
            case 38: // UP
                player.move(0, -1);
                break;
            case 39: // RIGHT
                player.move(1, 0);
                break;
            case 40: // DOWN
                player.move(0, 1);
                break;
            case 32: // SPACE
            case 90: // Z
            case 16: // SHIFT
                player.activateShield();
                break;
        }
    }
}