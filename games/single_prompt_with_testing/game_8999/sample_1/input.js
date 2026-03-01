import { gameState } from './globals.js';

const keys = {};

export function initInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.keyCode] = true;
        
        // Logs
        window.logs.inputs.push({
            type: 'keydown',
            key: e.key,
            code: e.keyCode,
            frame: gameState.frameCount,
            time: Date.now()
        });
        
        handleKeyPulse(e.keyCode);
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.keyCode] = false;
        
        window.logs.inputs.push({
            type: 'keyup',
            key: e.key,
            code: e.keyCode,
            frame: gameState.frameCount,
            time: Date.now()
        });
    });
}

function handleKeyPulse(code) {
    if (gameState.gamePhase === "START") {
        if (code === 13) { // Enter
            gameState.gamePhase = "PLAYING";
        }
    } else if (gameState.gamePhase === "PLAYING") {
        if (code === 27) { // ESC
            gameState.gamePhase = "PAUSED";
        }
        if (code === 90) { // Z
            if (gameState.player) gameState.player.action();
        }
        if (code === 16) { // Shift
            if (gameState.player) gameState.player.cycleSlot();
        }
    } else if (gameState.gamePhase === "PAUSED") {
        if (code === 27) { // ESC
            gameState.gamePhase = "PLAYING";
        }
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        if (code === 82) { // R
            window.location.reload(); // Simplest reset
        }
    }
}

export function getInputState() {
    return {
        forward: (keys[87] ? 1 : 0) - (keys[83] ? 1 : 0), // W - S
        right: (keys[68] ? 1 : 0) - (keys[65] ? 1 : 0),   // D - A
        rotY: (keys[37] ? 1 : 0) - (keys[39] ? 1 : 0),    // Left - Right
        rotX: (keys[38] ? 1 : 0) - (keys[40] ? 1 : 0),    // Up - Down
        jump: keys[32], // Space
    };
}