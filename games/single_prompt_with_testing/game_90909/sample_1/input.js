import { gameState } from './globals.js';

export function handleInput(p) {
    // Only processed during updates, key state is maintained automatically
}

export function handleKeyPressed(p) {
    gameState.keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
        type: 'press',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });
    
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart is handled in main loop by checking flag or direct reset
            // We'll set a flag or call a reset function if imported (better to use gameState flag or let main loop handle it)
            // Ideally, resetGame() should be called. 
            // We can just set phase to START which triggers reset in game.js logic if properly structured
            // But game.js needs to know to rebuild the level.
            // Let's assume game.js checks for this transition or we expose a reset callback.
            // Since we can't import game.js here (circular), we'll handle R in game.js keyPressed or use a signal.
            // We'll stick to updating keys here and handling logic in game.js for restart to keep it clean.
        }
    }
    
    // Jump logic is impulse based, handle here for better responsiveness?
    // Or in update loop. Update loop is better for physics consistency, but "keydown" event is good for single triggers.
    if (p.keyCode === 32 && gameState.gamePhase === "PLAYING" && gameState.player) {
       if(gameState.player.jump()) {
           // Jump sound (visual)
       }
    }
    
    // Shoot
    if (p.keyCode === 90 && gameState.gamePhase === "PLAYING" && gameState.player) { // Z
        gameState.player.shoot();
    }
}

export function handleKeyReleased(p) {
    gameState.keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        type: 'release',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });
}