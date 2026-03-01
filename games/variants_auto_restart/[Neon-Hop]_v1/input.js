/**
 * Input handling system
 */
import { gameState, logs } from './globals.js';

export function setupInput() {
    const handleKey = (e, isDown) => {
        const code = e.code;
        const key = e.key;
        
        // Log raw input
        if (isDown) { // Only log keydown to save space/spam
            logs.inputs.push({
                type: 'keydown',
                key: key,
                code: code,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }

        // Map keys to state
        if (code === 'ArrowLeft') gameState.keys.ArrowLeft = isDown;
        if (code === 'ArrowRight') gameState.keys.ArrowRight = isDown;
        if (code === 'ArrowUp') gameState.keys.ArrowUp = isDown;
        if (code === 'ArrowDown') gameState.keys.ArrowDown = isDown;
        if (code === 'KeyA') gameState.keys.KeyA = isDown;
        if (code === 'KeyD') gameState.keys.KeyD = isDown;
        if (code === 'KeyW') gameState.keys.KeyW = isDown;
        if (code === 'KeyS') gameState.keys.KeyS = isDown;
        if (code === 'Space') gameState.keys.Space = isDown;
        if (code === 'ShiftLeft' || code === 'ShiftRight') gameState.keys.Shift = isDown;
        if (code === 'KeyZ') gameState.keys.KeyZ = isDown;

        // Game Flow Control Keys (Key Down Events only)
        if (isDown) {
            handleGameFlowKeys(e);
        }
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
}

function handleGameFlowKeys(e) {
    const code = e.keyCode;

    // ENTER to Start
    if (code === 13) { // Enter
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.startTime = Date.now();
            console.log("Game Started");
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Optional: Enter restarts too, but R is explicit
             restartGame();
        }
    }

    // ESC to Pause
    if (code === 27) { // Escape
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    // R to Restart
    if (code === 82) { // R
        restartGame();
    }
}

export function restartGame() {
    console.log("Restarting Game...");
    
    // Clear any pending auto-restart if a manual restart is triggered
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
        gameState.autoRestartScheduled = false; // Reset the flag
        console.log("Auto-restart cancelled by manual restart.");
    }

    // Reset phase
    gameState.gamePhase = "START";
    
    // Reset Player
    if (gameState.player) {
        gameState.player.reset();
    }
    
    // Reset Score
    gameState.score = 0;
    gameState.distance = 0;
    gameState.combo = 0;
    
    // Reset Level (handled in game loop via reset flag usually, or direct manipulation)
    // We will signal the level manager to reset in the update loop or do it here if possible.
    // Let's rely on game.js monitoring the phase transition to rebuild the world.
    
    // Clean up entities
    gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
    gameState.tiles.forEach(t => gameState.scene.remove(t.mesh));
    gameState.particles.forEach(p => gameState.scene.remove(p.mesh));
    
    gameState.collectibles = [];
    gameState.tiles = [];
    gameState.particles = [];
    gameState.entities = [];
    
    // Re-add player to entities
    if (gameState.player) {
        gameState.entities.push(gameState.player);
    }
    
    // Reset auto-restart flags after a full game reset, in case this was the auto-restart call itself.
    // This ensures the flags are clean for the next game over.
    gameState.autoRestartScheduled = false;
    gameState.autoRestartTimeoutId = null; 

    // Trigger initialization of initial tiles
    window.dispatchEvent(new CustomEvent("game-restart"));
}