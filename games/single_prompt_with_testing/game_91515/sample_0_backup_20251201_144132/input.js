import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes
const K_LEFT = 37;
const K_UP = 38;
const K_RIGHT = 39;
const K_DOWN = 40;
const K_SPACE = 32;
const K_SHIFT = 16;
const K_Z = 90;
const K_ENTER = 13;
const K_ESC = 27;
const K_R = 82;

export function initInput(p) {
    p.keyPressed = function() {
        gameState.keys[p.keyCode] = true;
        
        // Log input
        p.logs.inputs.push({
            type: 'press',
            keyCode: p.keyCode,
            frame: p.frameCount
        });

        handlePhaseInput(p.keyCode, p);
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'release',
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    };
}

function handlePhaseInput(code, p) {
    // Handle Global Phase transitions
    if (code === K_ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            initGame(p);
        }
    }
    
    if (code === K_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (code === K_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
        }
    }
}

// Function to reset/init game (hoisted/imported logic wrapper)
let initGameCallback = null;
export function setInitGameCallback(cb) {
    initGameCallback = cb;
}

function initGame(p) {
    if (initGameCallback) initGameCallback(p);
}

export function handleInput(p) {
    // Determine active input source
    let inputs = {};
    
    if (gameState.controlMode === "HUMAN") {
        inputs = {
            left: gameState.keys[K_LEFT],
            right: gameState.keys[K_RIGHT],
            up: gameState.keys[K_UP],
            down: gameState.keys[K_DOWN],
            jump: gameState.keys[K_SPACE],
            fire: gameState.keys[K_Z],
            action: gameState.keys[K_SHIFT] // Eject or Enter
        };
    } else {
        // Automated Test Inputs
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Map action keyCode to logical input
            inputs = {
                left: action.keyCode === K_LEFT,
                right: action.keyCode === K_RIGHT,
                up: action.keyCode === K_UP,
                down: action.keyCode === K_DOWN,
                jump: action.keyCode === K_SPACE,
                fire: action.keyCode === K_Z,
                action: action.keyCode === K_SHIFT
            };
        }
    }
    
    // Pass inputs to player
    if (gameState.player && gameState.gamePhase === "PLAYING") {
        gameState.player.handleInput(inputs);
    }
}