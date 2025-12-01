import { gameState } from './globals.js';

export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false, // One frame trigger
    shift: false,
    z: false
};

export function handleInput(p) {
    // Reset one-frame triggers
    keys.jumpPressed = false;
    
    // Actual key reading handled by p5 events, this is just state holder
}

export function keyPressed(p) {
    const k = p.keyCode;
    
    if (k === p.LEFT_ARROW) keys.left = true;
    if (k === p.RIGHT_ARROW) keys.right = true;
    if (k === p.UP_ARROW) keys.up = true;
    if (k === p.DOWN_ARROW) keys.down = true;
    if (k === 32) { // SPACE
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;
    }
    if (k === 16) keys.shift = true; // Shift
    if (k === 90) keys.z = true; // Z
    
    // Game Flow inputs
    if (k === 13) { // ENTER
        if (gameState.gamePhase === "START" || gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "PLAYING";
            // Reset logic handled in main loop or trigger here
        }
    }
    
    if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (k === 82) { // R
        // Trigger restart
    }
    
    // Logs
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: k },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

export function keyReleased(p) {
    const k = p.keyCode;
    
    if (k === p.LEFT_ARROW) keys.left = false;
    if (k === p.RIGHT_ARROW) keys.right = false;
    if (k === p.UP_ARROW) keys.up = false;
    if (k === p.DOWN_ARROW) keys.down = false;
    if (k === 32) keys.jump = false;
    if (k === 16) keys.shift = false;
    if (k === 90) keys.z = false;
    
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: k },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}