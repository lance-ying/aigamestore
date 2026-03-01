import { gameState, logInput } from './globals.js';

export const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    " ": false,
    Shift: false,
    z: false
};

export function setupInputHandling() {
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        const code = e.keyCode;
        
        // Update key state map
        if (keys.hasOwnProperty(key)) keys[key] = true;
        if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
        
        // Map WASD to keys object if needed, or just rely on direct check
        if (code === 87) keys.w = true; // W
        if (code === 65) keys.a = true; // A
        if (code === 83) keys.s = true; // S
        if (code === 68) keys.d = true; // D
        if (code === 32) keys[" "] = true; // Space
        
        logInput('keydown', key, code);

        handlePhaseControls(code);
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key;
        const code = e.keyCode;
        
        if (keys.hasOwnProperty(key)) keys[key] = false;
        
        if (code === 87) keys.w = false;
        if (code === 65) keys.a = false;
        if (code === 83) keys.s = false;
        if (code === 68) keys.d = false;
        if (code === 32) keys[" "] = false;
        
        logInput('keyup', key, code);
    });
}

function handlePhaseControls(keyCode) {
    // ENTER (13) - Start Game
    if (keyCode === 13) {
        if (gameState.gamePhase === "START") {
            startGame();
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Optional: Enter could also restart
            resetGame();
            startGame();
        }
    }

    // R (82) - Restart Game
    if (keyCode === 82) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame();
            gameState.gamePhase = "START";
        }
    }

    // ESC (27) - Pause/Unpause
    if (keyCode === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
}

function startGame() {
    gameState.gamePhase = "PLAYING";
    // Reset timestamp for delta calculation to avoid jump
    gameState.time = performance.now();
}

function resetGame() {
    // Reset core variables
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.currentSpeed = 0.15; // Reset to base speed
    gameState.worldRotation = 0;
    
    // Reset Entities
    if (gameState.player) gameState.player.reset();
    if (gameState.platformManager) gameState.platformManager.reset();
    if (gameState.collectibleManager) gameState.collectibleManager.reset();
    if (gameState.particleSystem) gameState.particleSystem.reset();
}

export function isJumpPressed() {
    return keys.ArrowUp || keys.w || keys[" "];
}

export function getRotationInput() {
    let input = 0;
    if (keys.ArrowLeft || keys.a) input -= 1;
    if (keys.ArrowRight || keys.d) input += 1;
    return input;
}