// input.js
// Handles keyboard input

export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    Z: 90,
    ENTER: 13,
    ESC: 27,
    R: 82
};

const keyState = {};

export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'keydown',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'keyup',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

export function clearInputs() {
    for (const key in keyState) {
        keyState[key] = false;
    }
}