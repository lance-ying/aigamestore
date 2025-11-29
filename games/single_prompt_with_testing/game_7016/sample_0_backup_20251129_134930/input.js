import { gameState } from './globals.js';
import { Player } from './entities.js';
import { LaneManager } from './lanes.js';

export function handleInput(p) {
    // Phase transitions
    if (gameState.gamePhase === "START") {
        if (isKeyPressed(13)) { // ENTER
            startGame(p);
        }
    } else if (gameState.gamePhase === "PLAYING") {
        if (isKeyPressed(27)) { // ESC
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Phase Changed to PAUSED");
        }
    } else if (gameState.gamePhase === "PAUSED") {
        if (isKeyPressed(27)) { // ESC
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Changed to PLAYING");
        }
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        if (isKeyPressed(82)) { // R
            resetGame(p);
        }
    }
}

// Helper to check key press only once per frame if needed, 
// but for p5 keyPressed handles singular events. 
// This is for continuous checks or specific logic.
const keys = {};

export function registerKeyPress(p, keyCode) {
    keys[keyCode] = true;
    
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Direct gameplay input handling
    if (gameState.gamePhase === "PLAYING" && gameState.player && !gameState.player.isMoving && gameState.controlMode === "HUMAN") {
        if (keyCode === p.UP_ARROW) gameState.player.queueMove(0, -1);
        else if (keyCode === p.DOWN_ARROW) gameState.player.queueMove(0, 1);
        else if (keyCode === p.LEFT_ARROW) gameState.player.queueMove(-1, 0);
        else if (keyCode === p.RIGHT_ARROW) gameState.player.queueMove(1, 0);
    }
    
    // Global phase keys
    if (keyCode === 13 && gameState.gamePhase === "START") startGame(p);
    if (keyCode === 27) togglePause(p);
    if (keyCode === 82 && (gameState.gamePhase.startsWith("GAME_OVER"))) resetGame(p);
}

export function registerKeyRelease(p, keyCode) {
    keys[keyCode] = false;
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

function startGame(p) {
    resetGame(p);
    gameState.gamePhase = "PLAYING";
    logGameInfo(p, "Game Started");
}

function togglePause(p) {
    if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
    }
}

export function resetGame(p) {
    gameState.score = 0;
    gameState.cameraY = 0;
    gameState.particles = [];
    
    // Reset Lanes
    gameState.laneManager = new LaneManager();
    gameState.lanes = gameState.laneManager.lanes;
    
    // Reset Player
    // Start player at center X, and a few lanes up from bottom
    gameState.player = new Player(7, 0); // Grid X, Grid Y (relative to start)
    
    // Ensure initial area is safe
    gameState.laneManager.initSafeZone();
    
    gameState.gamePhase = "START";
    logGameInfo(p, "Game Reset");
}

function logGameInfo(p, info) {
    if (p.logs) {
        p.logs.game_info.push({
            data: { info: info, phase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}