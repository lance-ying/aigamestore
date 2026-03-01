import { gameState } from './globals.js';

// Key mappings
const KEYS = {
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    ARROW_LEFT: 37,
    ARROW_RIGHT: 39,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    SPACE: 32,
    SHIFT: 16,
    ENTER: 13,
    ESC: 27,
    R: 82,
    Z: 90
};

// Raw key state
const keyState = {};

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        keyState[e.keyCode] = true;
        
        // Log input for reproducibility/debugging
        if (window.logs) {
            window.logs.inputs.push({
                type: 'keydown',
                key: e.key,
                keyCode: e.keyCode,
                frame: gameState.frameCount,
                time: Date.now()
            });
        }

        // Prevent default scrolling for game keys
        if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keyState[e.keyCode] = false;
        
        if (window.logs) {
            window.logs.inputs.push({
                type: 'keyup',
                key: e.key,
                keyCode: e.keyCode,
                frame: gameState.frameCount,
                time: Date.now()
            });
        }
    });
}

export function updateInput() {
    // Reset frame-specific triggers
    gameState.input.jump = false;
    gameState.input.dive = false;
    gameState.input.start = false;
    gameState.input.restart = false;
    gameState.input.pause = false;

    // Map raw keys to logical inputs
    gameState.input.up = keyState[KEYS.ARROW_UP] || keyState[KEYS.W];
    gameState.input.down = keyState[KEYS.ARROW_DOWN] || keyState[KEYS.S];
    gameState.input.left = keyState[KEYS.ARROW_LEFT] || keyState[KEYS.A];
    gameState.input.right = keyState[KEYS.ARROW_RIGHT] || keyState[KEYS.D];
    
    // Handle single-press actions (simple implementation)
    // For a more robust system, we'd track 'prevKeyState'
    
    // We check trigger logic in game.js usually, but here we just pass the state
    // For "just pressed" logic, we might need a separate "pressedThisFrame" tracker
    // But for this simple game, we can handle state changes in the main loop or here.
}

// Helper to check if a key was just pressed (needs history, implementing simplified version)
// For this architecture, we will rely on the game loop to check input state 
// and handle transitions (like Pause toggles) using flags to prevent rapid toggling.