// Input handling module
import { gameState } from './globals.js';
import { resetGame } from './game.js';

export function handleInput(p) {
    p.keyPressed = function() {
        // Prevent default browser scrolling for arrow keys
        if([37, 38, 39, 40, 32].indexOf(p.keyCode) > -1) {
            p.e.preventDefault();
        }

        gameState.keys[p.keyCode] = true;

        // Logging
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                input_type: 'keyPressed',
                data: { key: p.key, keyCode: p.keyCode },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }

        // Global Phase Controls
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
                resetGame(p);
            }
        }

        // Gameplay specific 'On Press' actions
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            if (p.keyCode === 32) { // SPACE
                // Jump handled in update loop for variable height usually, but initial impulse here
                if (gameState.player.onGround) {
                    gameState.player.vy = gameState.player.jumpForce;
                    gameState.player.onGround = false;
                }
            }
            if (p.keyCode === 90) { // Z
                gameState.player.shoot();
            }
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                input_type: 'keyReleased',
                data: { key: p.key, keyCode: p.keyCode },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
        
        // Variable Jump Height: Cut velocity if space released early
        if (p.keyCode === 32 && gameState.gamePhase === "PLAYING" && gameState.player) {
            if (gameState.player.vy < -5) {
                gameState.player.vy = -5;
            }
        }
    };
}