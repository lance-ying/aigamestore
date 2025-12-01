import { gameState, TOOL } from './globals.js';

export function handleInput(p) {
    if (!gameState.player) return;
    const player = gameState.player;

    // Movement
    if (p.keyIsDown(37)) { // LEFT
        player.vx -= 1;
        if (player.vx < -player.speed) player.vx = -player.speed;
    } else if (p.keyIsDown(39)) { // RIGHT
        player.vx += 1;
        if (player.vx > player.speed) player.vx = player.speed;
    }

    // Jump
    if (p.keyIsDown(32) && player.onGround) { // SPACE
        player.vy = player.jumpPower;
        player.onGround = false;
    }
    
    // Direction Vector for tools
    const dir = { x: 0, y: 0 };
    if (p.keyIsDown(38)) dir.y = -1; // UP
    if (p.keyIsDown(40)) dir.y = 1; // DOWN
    
    // Action (Z)
    if (p.keyIsDown(90)) { // Z
        if (p.frameCount % 10 === 0) { // Cooldown
            player.useTool(dir);
        }
    }
}

export function handleKeyPress(p) {
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START" || gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Handled in main loop transition, but we can signal here
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
            // Restart handled in game.js
        }
    }
    
    if (gameState.player && p.keyCode === 16) { // SHIFT
        gameState.player.currentTool = gameState.player.currentTool === TOOL.PICKAXE ? TOOL.SWORD : TOOL.PICKAXE;
    }
    
    // Log input
    p.logs.inputs.push({
        key: p.key,
        keyCode: p.keyCode,
        type: "PRESS",
        frameCount: p.frameCount
    });
}