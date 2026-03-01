/**
 * Input handling and control logic
 */
import { gameState, logInput } from './globals.js';

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    // Z key for fast forward
    if (p.keyIsDown(KEY_Z)) {
        gameState.timeScale = 2.0;
    } else {
        gameState.timeScale = 1.0;
    }

    if (gameState.turnPhase === "AIMING") {
        const rotationSpeed = 0.03;
        const fineSpeed = 0.005;

        if (p.keyIsDown(KEY_LEFT)) {
            gameState.player.angle -= rotationSpeed;
        }
        if (p.keyIsDown(KEY_RIGHT)) {
            gameState.player.angle += rotationSpeed;
        }
        // Fine tuning
        if (p.keyIsDown(KEY_UP)) {
            // Move angle closer to -PI/2 (center)
        }
        if (p.keyIsDown(KEY_DOWN)) {
            gameState.player.angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, gameState.player.angle)); // Clamp
        }

        // Clamp angle to prevent shooting into floor
        // Allowed range: -170 deg to -10 deg approx
        const minAngle = -Math.PI + 0.1;
        const maxAngle = -0.1;
        gameState.player.angle = Math.max(minAngle, Math.min(maxAngle, gameState.player.angle));
    }
}

export function handleKeyPress(p) {
    const k = p.keyCode;
    logInput(p, 'keyPressed', { keyCode: k, key: p.key });

    // Global Phase Controls
    if (k === KEY_ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            initGame(p);
        }
    } else if (k === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE" || 
            gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "START";
        }
    } else if (k === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    // Gameplay Controls
    if (gameState.gamePhase === "PLAYING" && gameState.turnPhase === "AIMING") {
        if (k === KEY_SPACE) {
            startFiring(p);
        }
    }
}

export function handleKeyRelease(p) {
    logInput(p, 'keyReleased', { keyCode: p.keyCode });
}

import { Ball, Brick, Item, Launcher } from './entities.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CONFIG } from './globals.js';

function initGame(p) {
    gameState.score = 0;
    gameState.level = 1;
    gameState.ballCount = 1;
    gameState.player = new Launcher(CANVAS_WIDTH / 2, CANVAS_HEIGHT - CONFIG.BOTTOM_OFFSET);
    gameState.balls = [];
    gameState.bricks = [];
    gameState.items = [];
    gameState.particles = [];
    gameState.turnPhase = "AIMING";
    gameState.ballsActive = 0;
    
    // Spawn first row
    spawnRow();
}

export function spawnRow() {
    // Move existing down
    for (let brick of gameState.bricks) {
        if (brick.moveDown()) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    for (let item of gameState.items) {
        item.moveDown();
    }
    
    // Add new row
    // Strategy: Randomly place bricks, ensure at least one space usually?
    // Ballz style: mostly full row with some gaps
    
    for (let c = 0; c < CONFIG.COLUMNS; c++) {
        // 50% chance for brick, or Item
        const rand = Math.random();
        
        if (rand < 0.1) {
            // Item (+1 Ball)
            gameState.items.push(new Item(c, 0)); // Row 0 is the new top
        } else if (rand < 0.7) {
            // Brick
            // HP increases with level
            const hp = gameState.level; 
            gameState.bricks.push(new Brick(c, 0, hp));
        }
    }
    gameState.level++;
}

function startFiring(p) {
    gameState.turnPhase = "FIRING";
    gameState.ballsReady = gameState.ballCount;
    gameState.launchTimer = 0;
    gameState.ballsActive = 0;
    gameState.firstBallLanded = false;
    
    // Clear old balls array and replenish
    gameState.balls = [];
    for(let i=0; i<gameState.ballCount; i++) {
        gameState.balls.push(new Ball(-100, -100)); // Offscreen init
    }
}