import { gameState, GRID_COLS, GRID_ROWS } from './globals.js';
import { swapTiles, initGrid } from './match3.js';
import { createPlayer, createEnemy } from './entities.js';

// handleInput function (for automated testing) removed

export function handleKeyPress(p) {
    // Human input - controlMode check removed as it's the only mode
    handleKeyCode(p, p.keyCode);
}

function handleKeyCode(p, keyCode) {
    // Global controls
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            restartGame(p);
        }
        return;
    }

    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
        return;
    }

    if (gameState.gamePhase === "START") {
        if (keyCode === 13) { // ENTER
            startGame(p);
        }
        return;
    }

    if (gameState.gamePhase === "PLAYING") {
        handleGameInput(p, keyCode);
    }
}

function startGame(p) {
    gameState.gamePhase = "PLAYING";
    restartGame(p);
}

export function restartGame(p) {
    // Clear any pending auto-restart timeout if a manual restart occurs
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false; // Reset the flag

    createPlayer();
    gameState.stage = 1;
    createEnemy(gameState.stage);
    initGrid();
    gameState.gamePhase = "PLAYING";
    
    // Log start
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            event: "GAME_START",
            timestamp: Date.now()
        });
    }
}

function handleGameInput(p, keyCode) {
    if (gameState.turnState !== "PLAYER_INPUT") return;

    // Movement
    if (keyCode === 37) { // LEFT
        gameState.cursor.c = Math.max(0, gameState.cursor.c - 1);
    } else if (keyCode === 39) { // RIGHT
        gameState.cursor.c = Math.min(GRID_COLS - 1, gameState.cursor.c + 1);
    } else if (keyCode === 38) { // UP
        gameState.cursor.r = Math.max(0, gameState.cursor.r - 1);
    } else if (keyCode === 40) { // DOWN
        gameState.cursor.r = Math.min(GRID_ROWS - 1, gameState.cursor.r + 1);
    }

    // Action Z
    else if (keyCode === 90) { // Z
        const cc = gameState.cursor.c;
        const cr = gameState.cursor.r;
        
        if (!gameState.selectedTile) {
            // Select
            gameState.selectedTile = { c: cc, r: cr };
        } else {
            // Swap check
            const sc = gameState.selectedTile.c;
            const sr = gameState.selectedTile.r;
            
            // Check adjacency
            const dist = Math.abs(cc - sc) + Math.abs(cr - sr);
            if (dist === 1) {
                // Execute swap
                swapTiles(sc, sr, cc, cr);
                gameState.selectedTile = null;
                
                // Log move
                if (p.logs) {
                    p.logs.inputs.push({
                        action: "SWAP",
                        from: {c: sc, r: sr},
                        to: {c: cc, r: cr},
                        frame: p.frameCount
                    });
                }
            } else {
                // Deselect or select new
                if (cc === sc && cr === sr) {
                    gameState.selectedTile = null; // Deselect
                } else {
                    gameState.selectedTile = { c: cc, r: cr }; // Select new
                }
            }
        }
    }

    // Ultimate Space
    else if (keyCode === 32) { // SPACE
        if (gameState.player.castUltimate()) {
            if (p.logs) {
                p.logs.inputs.push({ action: "ULTIMATE", frame: p.frameCount });
            }
        }
    }
}