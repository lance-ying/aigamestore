import { gameState } from './globals.js';
import { logGameEvent } from './utils.js';

/**
 * Sets up keyboard event listeners
 */
export function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

/**
 * Removes event listeners (cleanup)
 */
export function cleanupInput() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}

/**
 * Log input event
 */
function logInput(type, key, code) {
    if (window.logs && window.logs.inputs) {
        window.logs.inputs.push({
            input_type: type,
            data: { key, keyCode: code },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

function handleKeyDown(event) {
    logInput('keydown', event.key, event.keyCode);
    
    const code = event.keyCode;
    
    // Game Phase Controls
    if (code === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameEvent("PLAYING", { message: "Game Started" });
        }
    }
    
    if (code === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameEvent("PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameEvent("PLAYING", { message: "Resumed" });
        }
    }
    
    if (code === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart is handled in game.js main loop checking this flag or state transition
            // Here we just set a flag or let the main loop know.
            // For simplicity, let's trigger a restart event or rely on game loop polling.
            // We'll signal game.js via a temporary state if needed, or better:
            // directly call a restart requested flag.
            // Actually, best pattern is to let game.js check inputs or set phase to START.
            gameState.gamePhase = "START";
            logGameEvent("START", { message: "Restarted to Menu" });
            // Note: Full reset happens when entering START or transitioning from START->PLAYING usually,
            // but we'll handle the data reset in game.js
        }
    }
    
    // Gameplay Controls
    // Arrow Left (37), A (65)
    if (code === 37 || code === 65) {
        gameState.keys.left = true;
    }
    
    // Arrow Right (39), D (68)
    if (code === 39 || code === 68) {
        gameState.keys.right = true;
    }
    
    // Arrow Up (38), W (87)
    if (code === 38 || code === 87) {
        gameState.keys.up = true;
    }
    
    // Arrow Down (40), S (83)
    if (code === 40 || code === 83) {
        gameState.keys.down = true;
    }
    
    // Space (32)
    if (code === 32) {
        gameState.keys.jump = true;
    }
    
    // Debug / Test Modes
    if (code === 49) { // 1
        // window.setControlMode('TEST_1'); // Usually UI driven, but key shortcut nice too
    }
}

function handleKeyUp(event) {
    logInput('keyup', event.key, event.keyCode);
    
    const code = event.keyCode;
    
    if (code === 37 || code === 65) gameState.keys.left = false;
    if (code === 39 || code === 68) gameState.keys.right = false;
    if (code === 38 || code === 87) gameState.keys.up = false;
    if (code === 40 || code === 83) gameState.keys.down = false;
    if (code === 32) gameState.keys.jump = false;
}

// Global control mode setter for UI buttons
window.setControlMode = function(mode) {
    if (["HUMAN", "TEST_1", "TEST_2"].includes(mode)) {
        gameState.controlMode = mode;
        console.log(`Control Mode set to: ${mode}`);
        logGameEvent("CONTROL_CHANGE", { mode });
    }
};