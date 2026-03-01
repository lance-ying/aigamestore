import { gameState } from './globals.js';

export const inputs = {
    // Drive
    up: false,
    down: false,
    left: false,
    right: false,
    // Camera
    camUp: false,
    camDown: false,
    camLeft: false,
    camRight: false,
    // Action
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
    
    // Drive (Arrows)
    if (code === 38) inputs.up = isPressed; // Up
    if (code === 40) inputs.down = isPressed; // Down
    if (code === 37) inputs.left = isPressed; // Left
    if (code === 39) inputs.right = isPressed; // Right
    
    // Camera (WASD)
    if (key.toLowerCase() === 'w') inputs.camUp = isPressed;
    if (key.toLowerCase() === 's') inputs.camDown = isPressed;
    if (key.toLowerCase() === 'a') inputs.camLeft = isPressed;
    if (key.toLowerCase() === 'd') inputs.camRight = isPressed;

    // Actions
    if (code === 32) inputs.space = isPressed;
    if (code === 16) inputs.boost = isPressed;
}

function cycleCamera() {
    // Removed COCKPIT mode
    if (gameState.cameraMode === "FOLLOW") gameState.cameraMode = "TOP";
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