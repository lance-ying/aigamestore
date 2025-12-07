import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const keys = {};

export function handleKeyDown(p) {
    keys[p.keyCode] = true;
    
    p.logs.inputs.push({
        type: 'KEYDOWN',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount
    });

    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ phase: "PLAYING", time: Date.now() });
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Need a reset function from game.js, but circular dependency.
            // Will handle restart in update loop of game.js checking a flag or directly here if I expose reset.
            // Better: Set a flag in gameState.
            gameState.shouldRestart = true;
        }
    }
}

export function handleKeyUp(p) {
    keys[p.keyCode] = false;
}

export function processInputs(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    if (!gameState.player) return;

    const player = gameState.player;
    let inputSource = keys;
    
    // Automated Testing Override
    if (gameState.controlMode.startsWith("TEST")) {
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Reset keys effectively for the frame
            // We'll just modify specific keys the bot wants to press
            // This is a simple way:
            if (action.moveRight) player.vx += 0.5; // Simulate hold
            if (action.moveLeft) player.vx -= 0.5;
            if (action.jump && player.onGround) player.jump();
            if (action.shoot) player.shoot();
            
            // Limit speed
            const maxSpeed = action.sprint ? 7 : 4;
            if (player.vx > maxSpeed) player.vx = maxSpeed;
            if (player.vx < -maxSpeed) player.vx = -maxSpeed;
            return;
        }
    }

    // Human Input
    const speed = keys[16] ? 0.8 : 0.5; // Shift to sprint
    const maxSpeed = keys[16] ? 7 : 4;

    if (keys[37]) { // LEFT
        player.vx -= speed;
        player.facing = -1;
        player.isMoving = true;
    }
    if (keys[39]) { // RIGHT
        player.vx += speed;
        player.facing = 1;
        player.isMoving = true;
    }
    
    if (Math.abs(player.vx) > maxSpeed) player.vx = Math.sign(player.vx) * maxSpeed;

    if (keys[32] || keys[38]) { // SPACE or UP
        player.jump();
    }
    
    if (keys[90]) { // Z
        player.shoot();
    }
}