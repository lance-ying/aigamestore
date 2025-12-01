/**
 * Input handling module
 */
import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_test.js';

const keys = {};

export function handleInput(p) {
    // If we are in a testing mode, override inputs
    if (gameState.controlMode !== 'HUMAN') {
        const action = get_automated_testing_action(gameState);
        // Reset keys for simulation
        keys[p.LEFT_ARROW] = false;
        keys[p.RIGHT_ARROW] = false;
        keys[32] = false; // SPACE
        keys[16] = false; // SHIFT
        
        if (action) {
            if (action.left) keys[p.LEFT_ARROW] = true;
            if (action.right) keys[p.RIGHT_ARROW] = true;
            if (action.jump) keys[32] = true;
            if (action.brake) keys[16] = true;
            if (action.restart) keyPressed(p, 82); // 'R'
        }
        return;
    }
    // Human input is handled via event listeners updating the 'keys' object
}

export function keyPressed(p, keyCode) {
    keys[keyCode] = true;
    
    // Log input
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { keyCode: keyCode, key: String.fromCharCode(keyCode) },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Controls
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            // Log phase change
            p.logs.game_info.push({
                data: { gamePhase: "PLAYING" },
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Trigger restart logic in game loop via flag or direct call if possible.
            // For simplicity, we set a flag or rely on game.js to check this, 
            // but since we need to call setupLevel(), we'll signal it via state if not direct.
            // Actually, we can just reset phase to START or re-init here if imports allow.
            // To avoid circular dependency issues, we'll mark a flag or let game.js handle key checks.
            // However, the prompt requires "R - restart; returns to the start screen".
            gameState.gamePhase = "START";
        }
    }
}

export function keyReleased(p, keyCode) {
    keys[keyCode] = false;
    
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(p, keyCode) {
    return !!keys[keyCode];
}