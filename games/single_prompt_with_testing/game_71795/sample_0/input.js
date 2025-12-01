import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_test.js';

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

export function handleKeyDown(p) {
    keyState[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
        type: 'DOWN',
        key: p.key,
        code: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });

    // Phase transitions
    if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
    if (p.keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (p.keyCode === KEYS.R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
        // Soft reset is handled in game loop logic
        window.location.reload(); // Simplest full reset for R
    }
}

export function handleKeyUp(p) {
    keyState[p.keyCode] = false;
}

export function getInput() {
    // Basic human input
    const input = {
        x: 0,
        y: 0,
        dash: keyState[KEYS.SPACE],
        ult: keyState[KEYS.Z],
        shift: keyState[KEYS.SHIFT]
    };

    if (keyState[KEYS.LEFT]) input.x -= 1;
    if (keyState[KEYS.RIGHT]) input.x += 1;
    if (keyState[KEYS.UP]) input.y -= 1;
    if (keyState[KEYS.DOWN]) input.y += 1;

    // Automated Overrides
    if (gameState.controlMode !== "HUMAN") {
        const auto = get_automated_testing_action(gameState);
        if (auto) {
            if (auto.left) input.x = -1;
            if (auto.right) input.x = 1;
            if (auto.up) input.y = -1;
            if (auto.down) input.y = 1;
            input.dash = auto.dash;
            input.ult = auto.ult;
            // Handle phase inputs via simulation
            if (auto.restart && (gameState.gamePhase.includes("GAME_OVER"))) {
                window.location.reload();
            }
        }
    }

    // Normalize
    if (input.x !== 0 || input.y !== 0) {
        const len = Math.sqrt(input.x*input.x + input.y*input.y);
        input.x /= len;
        input.y /= len;
    }

    return input;
}