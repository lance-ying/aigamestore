// input.js - Input handling
import { gameState, AVAILABLE_COMMANDS, COMMANDS } from './globals.js';

export function handleInput(p) {
    const keyCode = p.keyCode;
    
    // Global controls
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
        return;
    }

    // Start Screen
    if (gameState.gamePhase === "START" && keyCode === 13) {
        gameState.gamePhase = "PLAYING";
        return;
    }
    
    // Game Over Screens
    if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && keyCode === 82) { // R
        // Full restart
        window.dispatchEvent(new CustomEvent("GAME_RESTART"));
        return;
    }

    // Playing Phase
    if (gameState.gamePhase === "PLAYING") {
        
        // Reset Level
        if (keyCode === 82) { // R
            window.dispatchEvent(new CustomEvent("LEVEL_RESET"));
            return;
        }

        // Programming Mode Controls
        if (gameState.subPhase === "PROGRAMMING") {
            if (keyCode === p.UP_ARROW) {
                gameState.selectedCommandIdx = (gameState.selectedCommandIdx - 1 + AVAILABLE_COMMANDS.length) % AVAILABLE_COMMANDS.length;
            } else if (keyCode === p.DOWN_ARROW) {
                gameState.selectedCommandIdx = (gameState.selectedCommandIdx + 1) % AVAILABLE_COMMANDS.length;
            } else if (keyCode === 32) { // SPACE - Add command
                if (gameState.programQueue.length < gameState.maxCommands) {
                    const cmd = AVAILABLE_COMMANDS[gameState.selectedCommandIdx].type;
                    gameState.programQueue.push(cmd);
                }
            } else if (keyCode === 90) { // Z - Undo
                if (gameState.programQueue.length > 0) {
                    gameState.programQueue.pop();
                }
            } else if (keyCode === 13) { // ENTER - Run
                if (gameState.programQueue.length > 0) {
                    gameState.subPhase = "EXECUTING";
                    gameState.executionStep = 0;
                    gameState.executionTimer = 0;
                }
            }
            
            // Testing shortcuts logic handled in automated testing controller
        }
        
        // Execution Mode Controls
        if (gameState.subPhase === "EXECUTING") {
            if (keyCode === 16) { // SHIFT - Fast Forward
                gameState.stepDuration = 5;
            }
        }
    }
    
    // Log input
    p.logs.inputs.push({
        key: p.key,
        keyCode: keyCode,
        gamePhase: gameState.gamePhase,
        subPhase: gameState.subPhase,
        frame: p.frameCount
    });
}

export function handleKeyRelease(p) {
    if (p.keyCode === 16) { // Shift released
        gameState.stepDuration = 30; // Reset speed
    }
}