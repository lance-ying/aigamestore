/**
 * Input handling and processing.
 */
import { gameState } from './globals.js';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_SPACE = 32;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

const keys = {};

export function handleKeyPress(p) {
    keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Phase Transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        gameState.startTime = Date.now();
    }
    
    if (p.keyCode === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }

    if (p.keyCode === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Reset is handled in game.js via a check or function export.
            // Since we need to reset gameState, we can trigger a flag or method.
            // We'll expose a reset function in game.js, but for modularity, let's just set phase to START
            // and let the setup/draw loop re-init entities if needed.
            // A better way:
            window.resetGame();
        }
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;

    // Log input
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
    
    // Jump Release Logic
    if (p.keyCode === KEY_SPACE && gameState.player && gameState.gamePhase === "PLAYING") {
        if (gameState.player.isCharging && gameState.player.onGround) {
            performJump(gameState.player);
        }
        gameState.player.isCharging = false;
    }
}

function performJump(player) {
    const chargeRatio = Math.min(player.chargeDuration / player.maxChargeTime, 1.0);
    const jumpPower = player.jumpPowerMin + (player.jumpPowerMax - player.jumpPowerMin) * chargeRatio;
    
    player.vy = -jumpPower;
    
    // Horizontal momentum determination (during charge or before?)
    // In this implementation: direction held at moment of release determines jump X velocity
    player.vx = 0;
    if (keys[KEY_LEFT]) {
        player.vx = -player.moveSpeed;
        player.facing = -1;
    } else if (keys[KEY_RIGHT]) {
        player.vx = player.moveSpeed;
        player.facing = 1;
    }
    
    player.onGround = false;
}

export function updatePlayerInput(p) {
    const player = gameState.player;
    if (!player) return;

    if (gameState.gamePhase !== "PLAYING") return;

    // Movement (Only when on ground and NOT charging)
    if (player.onGround && !player.isCharging) {
        if (keys[KEY_LEFT]) {
            player.vx = -player.moveSpeed;
            player.facing = -1;
        } else if (keys[KEY_RIGHT]) {
            player.vx = player.moveSpeed;
            player.facing = 1;
        } else {
            // Friction handles stopping, but we can snap to 0 if no input
            // Handled in physics via friction
        }
    }

    // Start Charging
    if (keys[KEY_SPACE] && player.onGround && !player.isCharging) {
        player.isCharging = true;
        player.chargeStartTime = p.millis();
        player.vx = 0; // Stop moving when charging starts
    }
}