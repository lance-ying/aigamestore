import { gameState, logInput } from './globals.js';

export const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false,
    ShiftLeft: false,
    ShiftRight: false,
    KeyZ: false,
    Enter: false,
    Escape: false,
    KeyR: false
};

// Queue for lane changes to prevent skipping lanes too fast
export const inputQueue = [];

export function setupInputs() {
    document.addEventListener('keydown', (e) => {
        // Prevent default scrolling for game keys
        if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
            // Map event.code to our keys object
            if (e.code === 'Space') keys.Space = true;
            else if (e.code === 'ArrowUp') keys.ArrowUp = true;
            else if (e.code === 'ArrowDown') keys.ArrowDown = true;
            else if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
            else if (e.code === 'ArrowRight') keys.ArrowRight = true;
            else if (e.code === 'KeyW') keys.KeyW = true;
            else if (e.code === 'KeyS') keys.KeyS = true;
            else if (e.code === 'KeyA') keys.KeyA = true;
            else if (e.code === 'KeyD') keys.KeyD = true;
            else if (e.code === 'ShiftLeft') keys.ShiftLeft = true;
            else if (e.code === 'ShiftRight') keys.ShiftRight = true;
            else if (e.code === 'Enter') keys.Enter = true;
            else if (e.code === 'Escape') keys.Escape = true;
            else if (e.code === 'KeyR') keys.KeyR = true;
            else if (e.code === 'KeyZ') keys.KeyZ = true;

            logInput('keydown', e.key, e.keyCode);
            
            handlePhaseInputs(e.code);
            handleGameplayInputs(e.code);
        }
    });

    document.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
            if (e.code === 'Space') keys.Space = false;
            else if (e.code === 'ArrowUp') keys.ArrowUp = false;
            else if (e.code === 'ArrowDown') keys.ArrowDown = false;
            else if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
            else if (e.code === 'ArrowRight') keys.ArrowRight = false;
            else if (e.code === 'KeyW') keys.KeyW = false;
            else if (e.code === 'KeyS') keys.KeyS = false;
            else if (e.code === 'KeyA') keys.KeyA = false;
            else if (e.code === 'KeyD') keys.KeyD = false;
            else if (e.code === 'ShiftLeft') keys.ShiftLeft = false;
            else if (e.code === 'ShiftRight') keys.ShiftRight = false;
            else if (e.code === 'Enter') keys.Enter = false;
            else if (e.code === 'Escape') keys.Escape = false;
            else if (e.code === 'KeyR') keys.KeyR = false;
            else if (e.code === 'KeyZ') keys.KeyZ = false;
            
            logInput('keyup', e.key, e.keyCode);
        }
    });
}

function handlePhaseInputs(code) {
    if (code === 'Enter' && gameState.gamePhase === 'START') {
        gameState.gamePhase = 'PLAYING';
    } else if (code === 'Escape') {
        if (gameState.gamePhase === 'PLAYING') gameState.gamePhase = 'PAUSED';
        else if (gameState.gamePhase === 'PAUSED') gameState.gamePhase = 'PLAYING';
    } else if (code === 'KeyR' && (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE')) {
        gameState.gamePhase = 'START';
        // Reset logic handled in game loop
    }
}

function handleGameplayInputs(code) {
    if (gameState.gamePhase !== 'PLAYING' || !gameState.player) return;
    if (gameState.controlMode !== 'HUMAN') return;

    if (code === 'ArrowLeft' || code === 'KeyA') {
        inputQueue.push('LEFT');
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
        inputQueue.push('RIGHT');
    }
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
        inputQueue.push('JUMP');
    }
    if (code === 'ArrowDown' || code === 'KeyS' || code === 'ShiftLeft' || code === 'ShiftRight') {
        inputQueue.push('SLIDE');
    }
}

export function clearInputQueue() {
    inputQueue.length = 0;
}