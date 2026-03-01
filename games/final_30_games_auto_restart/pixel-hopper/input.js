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
    } 
    // Removed continuous R key check for GAME_OVER state to avoid multiple restarts
    // The single key press in registerKeyPress will handle it.
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
    if (gameState.gamePhase === "PLAYING" && gameState.player && !gameState.player.isMoving) {
        if (keyCode === p.UP_ARROW) gameState.player.queueMove(0, -1);
        else if (keyCode === p.DOWN_ARROW) gameState.player.queueMove(0, 1);
        else if (keyCode === p.LEFT_ARROW) gameState.player.queueMove(-1, 0);
        else if (keyCode === p.RIGHT_ARROW) gameState.player.queueMove(1, 0);
    }
    
    // Global phase keys
    if (keyCode === 13 && gameState.gamePhase === "START") startGame(p);
    if (keyCode === 27) togglePause(p);
    // Manual restart (R key) takes priority over auto-restart
    if (keyCode === 82 && (gameState.gamePhase.startsWith("GAME_OVER"))) restartFromGameOver(p);
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
    // Prevent multiple calls in the same frame
    if (gameState.gamePhase !== "START") {
        return;
    }
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

function restartFromGameOver(p) {
    // Clear any pending auto-restart timer
    if (gameState.autoRestartTimerId) {
        clearTimeout(gameState.autoRestartTimerId);
        gameState.autoRestartTimerId = null;
    }
    gameState.autoRestartScheduled = false; // Reset flag
    
    resetGame(p);
    gameState.gamePhase = "START";
    logGameInfo(p, "Restarting from Game Over");
}

export function restartGameAuto(p) {
    // Only restart if an auto-restart was actually scheduled and not cancelled
    if (gameState.autoRestartScheduled) {
        resetGame(p);
        gameState.gamePhase = "START";
        logGameInfo(p, "Auto-restarting game");
    }
    // Clear auto-restart state regardless
    gameState.autoRestartScheduled = false;
    gameState.autoRestartTimerId = null;
}

export function resetGame(p) {
    gameState.score = 0;
    gameState.cameraY = 0;
    gameState.particles = [];
    
    // Reset Lanes (initSafeZone is called in LaneManager constructor)
    gameState.laneManager = new LaneManager();
    gameState.lanes = gameState.laneManager.lanes;
    
    // Reset Player
    // Start player at center X, and a few lanes up from bottom
    gameState.player = new Player(7, 0); // Grid X, Grid Y (relative to start)
    
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