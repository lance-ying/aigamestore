import { gameState, logs } from './globals.js';

export const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    " ": false, // Space
    Shift: false,
    z: false, // Attack
    h: false, // Heal
    Enter: false,
    Escape: false,
    r: false
};

// Input buffering for smoother combos
export const inputBuffer = {
    attack: false,
    dodge: false,
    bufferTime: 0,
    MAX_BUFFER: 0.2 // seconds
};

export function setupInputs() {
    window.addEventListener('keydown', (e) => {
        // Prevent default scrolling for game keys
        if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        
        // Map specific keys
        if (key === 'ArrowUp') keys.ArrowUp = true;
        if (key === 'ArrowDown') keys.ArrowDown = true;
        if (key === 'ArrowLeft') keys.ArrowLeft = true;
        if (key === 'ArrowRight') keys.ArrowRight = true;
        if (key === 'w') keys.w = true;
        if (key === 'a') keys.a = true;
        if (key === 's') keys.s = true;
        if (key === 'd') keys.d = true;
        if (key === ' ') {
            keys[" "] = true;
            inputBuffer.dodge = true;
            inputBuffer.bufferTime = gameState.deltaTime;
        }
        if (key === 'z') {
            keys.z = true;
            inputBuffer.attack = true;
            inputBuffer.bufferTime = gameState.deltaTime;
        }
        if (key === 'h') keys.h = true;
        if (key === 'shift') keys.Shift = true;
        if (key === 'enter') keys.Enter = true;
        if (key === 'escape') keys.Escape = true;
        if (key === 'r') keys.r = true;

        logInput('keydown', key, e.keyCode);
        handlePhaseInputs(key);
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        
        if (key === 'ArrowUp') keys.ArrowUp = false;
        if (key === 'ArrowDown') keys.ArrowDown = false;
        if (key === 'ArrowLeft') keys.ArrowLeft = false;
        if (key === 'ArrowRight') keys.ArrowRight = false;
        if (key === 'w') keys.w = false;
        if (key === 'a') keys.a = false;
        if (key === 's') keys.s = false;
        if (key === 'd') keys.d = false;
        if (key === ' ') keys[" "] = false;
        if (key === 'z') keys.z = false;
        if (key === 'h') keys.h = false;
        if (key === 'shift') keys.Shift = false;
        if (key === 'enter') keys.Enter = false;
        if (key === 'escape') keys.Escape = false;
        if (key === 'r') keys.r = false;

        logInput('keyup', key, e.keyCode);
    });
}

function handlePhaseInputs(key) {
    if (key === 'enter' && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        logs.game_info.push({ status: "PLAYING", time: Date.now() });
    }
    else if (key === 'escape') {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    else if (key === 'r' && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
        // Reload page to restart cleanly or call a restart function
        // We will call a reset function in game.js, checked via update loop
        gameState.shouldRestart = true;
    }
}

function logInput(type, key, code) {
    if (logs.inputs.length < 1000) { // Limit log size
        logs.inputs.push({
            type, key, code,
            frame: gameState.frameCount,
            time: Date.now()
        });
    }
}

export function clearInputBuffer() {
    inputBuffer.attack = false;
    inputBuffer.dodge = false;
}