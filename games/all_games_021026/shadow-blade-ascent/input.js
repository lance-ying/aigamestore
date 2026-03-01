import { gameState, KEYS } from './globals.js';

export function handleInput(p) {
    const player = gameState.player;
    if (!player) return;

    // Movement
    let dx = 0;
    if (p.keyIsDown(KEYS.LEFT)) dx = -1;
    if (p.keyIsDown(KEYS.RIGHT)) dx = 1;

    if (dx !== 0 && !player.isAttacking) {
        player.vx += dx * 0.5; // Acceleration
        player.vx = Math.max(Math.min(player.vx, player.speed), -player.speed); // Cap
        player.facing = dx;
    }

    // Ladders
    if (player.canClimb) {
        if (p.keyIsDown(KEYS.UP)) {
            player.isClimbing = true;
            player.vy = -3;
        } else if (p.keyIsDown(KEYS.DOWN)) {
            player.isClimbing = true;
            player.vy = 3;
        } else if (player.isClimbing) {
            player.vy = 0;
        }
    }

    // Drop through
    if (p.keyIsDown(KEYS.DOWN) && p.keyIsDown(KEYS.SPACE) && player.onGround) {
        player.droppingThrough = true;
        player.onGround = false;
        player.y += 1; // Nudge down
        setTimeout(() => player.droppingThrough = false, 500);
    }

    // Logging
    if (p.keyIsDown(KEYS.Z)) {
        // Debounce handled in action function
    }
}

export function handleKeyPress(p, keyCode) {
    if (gameState.gamePhase === 'START') {
        if (keyCode === KEYS.ENTER) {
            startNewGame();
            gameState.gamePhase = 'PLAYING';
        }
        return;
    }

    if (keyCode === KEYS.ESC) {
        gameState.gamePhase = gameState.gamePhase === 'PLAYING' ? 'PAUSED' : 'PLAYING';
    }

    if (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') {
        if (keyCode === KEYS.R) {
            startNewGame();
            gameState.gamePhase = 'START';
        }
        return;
    }

    if (gameState.gamePhase !== 'PLAYING') return;

    const player = gameState.player;

    if (keyCode === KEYS.SPACE || keyCode === KEYS.UP) {
        if (!player.canClimb || (!p.keyIsDown(KEYS.UP) && keyCode === KEYS.SPACE)) { 
            // Prefer Jump over climb if Space is used or not on ladder
             player.jump();
        }
    }

    if (keyCode === KEYS.SHIFT) {
        player.dodge();
    }

    if (keyCode === KEYS.Z) {
        if (p.keyIsDown(KEYS.DOWN)) {
            player.attack('SKILL1');
        } else if (p.keyIsDown(KEYS.LEFT) || p.keyIsDown(KEYS.RIGHT)) {
            player.attack('SKILL2');
        } else {
            player.attack('NORMAL');
        }
    }
}

import { loadLevel } from './levels.js';
import { Player } from './entities.js';

export function startNewGame() {
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.gamePhase = 'PLAYING';
    loadLevel(1);
    gameState.player = new Player(50, 200);
    gameState.cameraX = 0;
}

export function nextLevel() {
    gameState.currentLevel++;
    if (gameState.currentLevel > gameState.maxLevels) {
        gameState.gamePhase = 'GAME_OVER_WIN';
    } else {
        loadLevel(gameState.currentLevel);
        gameState.player.x = 50;
        gameState.player.y = 200;
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.gamePhase = 'PLAYING';
    }
}