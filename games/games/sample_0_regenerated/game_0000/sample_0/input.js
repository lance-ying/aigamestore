import { gameState } from './globals.js';

export function handleInput(p, type, key, keyCode) {
    if (type === 'pressed') {
        gameState.keys[keyCode] = true;
        
        // Log input
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        // Game Phase Control
        if (keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                 // Trigger reset via game.js logic or signal here
                 // Since we don't have direct access to reset function without cyclic deps easily, 
                 // we handle phase change and let game loop detect needsReset or similar.
                 // Actually, we can export a reset flag or handle it in game.js keyPressed.
                 // Better: game.js calls handleInput and checks returns or state.
                 gameState.gamePhase = "START"; 
            }
        }
        
        // Gameplay Controls
        if (gameState.gamePhase === "PLAYING") {
            if (keyCode === 32) { // Space
                if (gameState.player) gameState.player.jump();
            }
        }
        
    } else if (type === 'released') {
        gameState.keys[keyCode] = false;
        
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        if (keyCode === 32) {
             if (gameState.player) gameState.player.stopJump();
        }
    }
}