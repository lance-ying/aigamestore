// input.js - Input handling and automated testing controller
import { gameState } from './globals.js';

// Key Codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

export function handleInput(p) {
    // Update key states map handled in p.keyPressed/p.keyReleased in game.js
    
    // If we are in automated testing mode, override inputs
    if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Simulate key press for one frame
            // Note: This is a simplified simulation. For rigorous physics, 
            // we might need persistent key states, but for this architecture
            // we will inject the "isDown" status into gameState.keys directly
            
            // Clear keys first for frame-perfect input simulation
            // gameState.keys = {}; // Uncomment if we want exclusive control
            
            if (action.keyCode) {
                gameState.keys[action.keyCode] = true;
            }
            if (action.keyCodes) {
                action.keyCodes.forEach(k => gameState.keys[k] = true);
            }
        }
    }
}

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    if (gameState.controlMode === "TEST_1") {
        // Random fuzzing
        const keys = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.SPACE, KEYS.Z, KEYS.DOWN];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        // 5% chance to press start/pause to test phase transitions
        if (Math.random() < 0.001) return { keyCode: KEYS.ESC };
        return { keyCode: randomKey };
    }

    if (gameState.controlMode === "TEST_2") {
        // Heuristic Solver
        const player = gameState.player;
        const inputs = [KEYS.RIGHT]; // Always move right

        // Look ahead
        const lookAheadDist = 60;
        const nextTileX = player.x + lookAheadDist;
        const nextTileY = player.y;
        
        // Simple "sensor" checks using global tile data would be complex to query directly here
        // So we use rudimentary state checks
        
        // Jump if blocked or pit
        let shouldJump = false;
        
        // Check for enemies nearby
        const nearestEnemy = gameState.entities.find(e => 
            e.type === 'enemy' && 
            Math.abs(e.x - player.x) < 150 &&
            Math.abs(e.y - player.y) < 50
        );

        if (nearestEnemy) {
            // If enemy is in front, shoot or jump
            if (nearestEnemy.x > player.x) {
                inputs.push(KEYS.Z); // Attack
                if (Math.abs(player.x - nearestEnemy.x) < 60) {
                    shouldJump = true;
                }
            }
        }

        // Check for walls (simple heuristic: if velocity is 0 but we are trying to move right)
        if (player.vx < 0.5 && player.facing === 1) {
            shouldJump = true;
        }

        if (shouldJump && player.onGround) {
            inputs.push(KEYS.SPACE);
        }

        return { keyCodes: inputs };
    }

    return null;
}

// Global exposure for the HTML harness
window.get_automated_testing_action = get_automated_testing_action;

window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
};