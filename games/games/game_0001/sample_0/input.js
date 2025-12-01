import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const keys = {};

export function handleInput(p) {
    // If we are in a testing mode, we might want to simulate keys based on the controller
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
        const action = get_automated_testing_action(gameState);
        // Reset simulation keys
        keys[p.LEFT_ARROW] = false;
        keys[p.RIGHT_ARROW] = false;
        keys[p.UP_ARROW] = false;
        keys[p.DOWN_ARROW] = false;
        
        if (action) {
            keys[action.keyCode] = true;
        }
    }
}

export function handleKeyPress(p) {
    keys[p.keyCode] = true;
    
    // Log input
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global phase controls
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase changed to PLAYING");
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Need to reset externally or handle here. 
            // Usually 'R' is restart, but Enter is intuitive for 'Play Again'
            resetGame(p);
        }
    }

    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === 82) { // R
        resetGame(p);
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(p, keyCode) {
    return keys[keyCode] === true;
}

function logGameInfo(p, message) {
    p.logs.game_info.push({
        data: { message: message, gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

// Helper to reset game from input (needs reference to game logic, better to use event or global reset)
// For simplicity, we'll attach a global reset function in game.js
function resetGame(p) {
    if (window.globalResetGame) {
        window.globalResetGame();
    }
}