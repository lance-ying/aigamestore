import { gameState, PHASE_PLAYING, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, resetGame } from './globals.js';
import { setupLevel } from './level_gen.js';

export function handleInput(p) {
    // Phase control inputs
    if (p.keyIsDown(13) && !p.keyWasDown(13)) { // ENTER
        if (gameState.gamePhase === PHASE_START) {
            setupLevel(p);
            gameState.gamePhase = PHASE_PLAYING;
            logGameInfo(p, "Game Started");
        } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE || gameState.gamePhase === PHASE_GAME_OVER_WIN) {
            resetGame(p);
            setupLevel(p);
            gameState.gamePhase = PHASE_PLAYING;
            logGameInfo(p, "Game Restarted via Enter");
        }
    }

    if (p.keyIsDown(27) && !p.keyWasDown(27)) { // ESC
        if (gameState.gamePhase === PHASE_PLAYING) {
            gameState.gamePhase = PHASE_PAUSED;
            logGameInfo(p, "Game Paused");
        } else if (gameState.gamePhase === PHASE_PAUSED) {
            gameState.gamePhase = PHASE_PLAYING;
            logGameInfo(p, "Game Resumed");
        }
    }

    if (p.keyIsDown(82) && !p.keyWasDown(82)) { // R
        if (gameState.gamePhase === PHASE_GAME_OVER_LOSE || gameState.gamePhase === PHASE_GAME_OVER_WIN) {
            resetGame(p);
            logGameInfo(p, "Game Reset to Start");
        }
    }

    // Gameplay inputs (buffered)
    if (gameState.gamePhase === PHASE_PLAYING) {
        let action = null;
        
        // Automated Testing Override
        if (gameState.controlMode !== "HUMAN") {
            const botAction = window.get_automated_testing_action(gameState);
            if (botAction && botAction.keyCode) {
                // Simulate key press for bot
                processGameplayKey(botAction.keyCode, p);
            }
            return; // Skip human input in test mode
        }

        // Human Input
        const relevantKeys = [37, 38, 39, 40, 32]; // Left, Up, Right, Down, Space
        relevantKeys.forEach(code => {
            if (p.keyIsDown(code) && !p.keyWasDown(code)) {
                processGameplayKey(code, p);
            }
        });
    }
}

function processGameplayKey(keyCode, p) {
    // Only buffer up to 2 moves to prevent laggy feel
    if (gameState.inputQueue.length < 2) {
        if (keyCode === 37) gameState.inputQueue.push({ dx: -1, dy: 0, name: "LEFT" });
        if (keyCode === 38) gameState.inputQueue.push({ dx: 0, dy: -1, name: "UP" });
        if (keyCode === 39) gameState.inputQueue.push({ dx: 1, dy: 0, name: "RIGHT" });
        if (keyCode === 40) gameState.inputQueue.push({ dx: 0, dy: 1, name: "DOWN" });
        if (keyCode === 32) gameState.inputQueue.push({ dx: 0, dy: 0, name: "WAIT" });
        
        // Log input
        p.logs.inputs.push({
            input_type: 'gameplay_action',
            data: { keyCode: keyCode, queueLen: gameState.inputQueue.length },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

// Helper to track key states manually to support 'keyWasDown' logic
const keyState = {};
export function updateInputState(p) {
    // This function must be called at end of draw or begin of draw
    // We'll wrap p5's keyIsDown to implement a custom "keyWasDown"
}

// We will inject keyWasDown into the p5 instance in game.js
function logGameInfo(p, msg) {
    p.logs.game_info.push({
        event: msg,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}