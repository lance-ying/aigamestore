import { gameState, logs } from './globals.js';

export function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function logInput(type, key, keyCode) {
    logs.inputs.push({
        type: type,
        key: key,
        keyCode: keyCode,
        frame: gameState.frameCount,
        time: Date.now()
    });
}

function handleKeyDown(event) {
    const code = event.code;
    const keyCode = event.keyCode;
    logInput('keydown', code, keyCode);
    
    // Map keys
    if (code === 'Space') gameState.keys.Space = true;
    if (code === 'ArrowUp') gameState.keys.ArrowUp = true;
    if (code === 'ArrowDown') gameState.keys.ArrowDown = true;
    if (code === 'ArrowLeft') gameState.keys.ArrowLeft = true;
    if (code === 'ArrowRight') gameState.keys.ArrowRight = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') gameState.keys.Shift = true;
    if (code === 'KeyW') gameState.keys.KeyW = true;
    if (code === 'KeyS') gameState.keys.KeyS = true;
    if (code === 'KeyA') gameState.keys.KeyA = true;
    if (code === 'KeyD') gameState.keys.KeyD = true;
    if (code === 'KeyZ') gameState.keys.KeyZ = true;

    // Game Phase Controls
    if (code === 'Enter') {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (code === 'Escape') {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (code === 'KeyR') {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Logic handled in game.js loop to trigger reset
             // Just setting flag here if needed, but easier to handle in main loop or trigger reset directly.
             // We'll expose a needReset flag or just reload functionality.
             // Better: trigger a custom event or check key in game loop.
             // We'll check keys in game loop.
        }
    }
    
    // Gameplay Actions
    if (gameState.gamePhase === "PLAYING") {
        if (code === 'Space' || code === 'ArrowUp') {
            if (gameState.player) gameState.player.jump();
        }
    }
}

function handleKeyUp(event) {
    const code = event.code;
    logInput('keyup', code, event.keyCode);
    
    if (code === 'Space') gameState.keys.Space = false;
    if (code === 'ArrowUp') gameState.keys.ArrowUp = false;
    if (code === 'ArrowDown') gameState.keys.ArrowDown = false;
    if (code === 'ArrowLeft') gameState.keys.ArrowLeft = false;
    if (code === 'ArrowRight') gameState.keys.ArrowRight = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') gameState.keys.Shift = false;
    if (code === 'KeyW') gameState.keys.KeyW = false;
    if (code === 'KeyS') gameState.keys.KeyS = false;
    if (code === 'KeyA') gameState.keys.KeyA = false;
    if (code === 'KeyD') gameState.keys.KeyD = false;
    if (code === 'KeyZ') gameState.keys.KeyZ = false;
}