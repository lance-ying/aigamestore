import { gameState } from './globals.js';

export const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    boost: false,
    prevSpace: false // For simple debounce
};

export function setupInputs() {
    window.addEventListener('keydown', (e) => handleKey(e.key, e.keyCode, true));
    window.addEventListener('keyup', (e) => handleKey(e.key, e.keyCode, false));
}

function handleKey(key, code, isPressed) {
    // Phase controls
    if (isPressed) {
        if (code === 13) { // Enter
            if (gameState.gamePhase === "START") gameState.gamePhase = "PLAYING";
        }
        if (code === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        if (code === 82) { // R
            if (gameState.gamePhase.startsWith("GAME_OVER")) window.location.reload(); // Simple reload for restart logic safety
        }
        if (key.toLowerCase() === 'c') {
            cycleCamera();
        }
    }

    // Gameplay controls
    if (code === 38 || key.toLowerCase() === 'w') inputs.up = isPressed;
    if (code === 40 || key.toLowerCase() === 's') inputs.down = isPressed;
    if (code === 37 || key.toLowerCase() === 'a') inputs.left = isPressed;
    if (code === 39 || key.toLowerCase() === 'd') inputs.right = isPressed;
    if (code === 32) inputs.space = isPressed;
    if (code === 16) inputs.boost = isPressed;
}

function cycleCamera() {
    if (gameState.cameraMode === "FOLLOW") gameState.cameraMode = "COCKPIT";
    else if (gameState.cameraMode === "COCKPIT") gameState.cameraMode = "TOP";
    else gameState.cameraMode = "FOLLOW";
}

// Log inputs for reproducibility
export function logInputs() {
    if (inputs.up || inputs.down || inputs.left || inputs.right || inputs.space) {
        if (window.logs && window.logs.inputs) {
            window.logs.inputs.push({
                frame: gameState.frameCount,
                inputState: { ...inputs },
                timestamp: Date.now()
            });
        }
    }
}