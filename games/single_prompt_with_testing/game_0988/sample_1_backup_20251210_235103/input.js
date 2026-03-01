import { gameState } from './globals.js';

const keys = {};

export function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

export function isKeyPressed(keyCode) {
    return !!keys[keyCode];
}

function logInput(type, key, code) {
    window.logs.inputs.push({
        type: type,
        key: key,
        keyCode: code,
        frame: gameState.frameCount,
        time: Date.now()
    });
}

function handleKeyDown(event) {
    const code = event.keyCode;
    
    // Prevent default scrolling for game keys
    if([32, 37, 38, 39, 40].indexOf(code) > -1) {
        event.preventDefault();
    }
    
    if (!keys[code]) { // Only trigger once per press
        keys[code] = true;
        logInput('keydown', event.key, code);
        processInput(code);
    }
}

function handleKeyUp(event) {
    const code = event.keyCode;
    keys[code] = false;
    logInput('keyup', event.key, code);
}

function processInput(code) {
    // Global Phase Controls
    if (code === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            setGamePhase("PLAYING");
        }
    }
    
    if (code === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            setGamePhase("PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            setGamePhase("PLAYING");
        }
    }
    
    if (code === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame();
        }
    }
    
    // Gameplay Controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        switch(code) {
            case 32: // SPACE - Jump
                gameState.player.jump();
                break;
            case 37: // LEFT ARROW
            case 65: // A
                gameState.player.turn("LEFT");
                break;
            case 39: // RIGHT ARROW
            case 68: // D
                gameState.player.turn("RIGHT");
                break;
        }
    }
}

export function setGamePhase(phase) {
    gameState.gamePhase = phase;
    window.logs.game_info.push({
        event: "PHASE_CHANGE",
        newPhase: phase,
        frame: gameState.frameCount,
        time: Date.now()
    });
}

// Reset function needs to be imported dynamically or attached to window to avoid circular dependency
// We'll attach it in game.js, but input needs to call it.
function resetGame() {
    if (window.gameInstance && window.gameInstance.reset) {
        window.gameInstance.reset();
    }
}