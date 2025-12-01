// input handling logic
import { gameState, resetGame } from './globals.js';
import { handleBlockPlacement } from './game.js';

export function handleKeyPress(p) {
    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    const keyCode = p.keyCode;

    // Phase independent controls
    if (keyCode === 82) { // R - Restart
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame();
            gameState.gamePhase = "START";
            return;
        }
    }

    // Phase handling
    switch (gameState.gamePhase) {
        case "START":
            if (keyCode === 13) { // ENTER
                gameState.gamePhase = "PLAYING";
                // Initial setup called in game update loop implicitly if stack is empty
            }
            break;
            
        case "PLAYING":
            if (keyCode === 27) { // ESC
                gameState.gamePhase = "PAUSED";
            } else if (keyCode === 32) { // SPACE
                // Attempt to place block
                handleBlockPlacement(p);
            }
            break;
            
        case "PAUSED":
            if (keyCode === 27) { // ESC
                gameState.gamePhase = "PLAYING";
            }
            break;
    }
}

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") return null;
    if (!gameState.activeBlock) return null;

    // TEST 1: Precision Bot
    if (gameState.controlMode === "TEST_1") {
        if (gameState.stack.length === 0) return null;
        
        const targetBlock = gameState.stack[gameState.stack.length - 1];
        const activeBlock = gameState.activeBlock;
        
        const diff = activeBlock.x - targetBlock.x;
        const tolerance = Math.abs(activeBlock.speed) + 2; // Press within one frame's movement + buffer
        
        if (Math.abs(diff) < tolerance) {
            return { keyCode: 32 }; // SPACE
        }
    }
    
    // TEST 2: Random Bot
    else if (gameState.controlMode === "TEST_2") {
        if (Math.random() < 0.05) { // 5% chance per frame to press space
            return { keyCode: 32 };
        }
    }
    
    return null;
}

// Expose automated testing function
window.get_automated_testing_action = get_automated_testing_action;