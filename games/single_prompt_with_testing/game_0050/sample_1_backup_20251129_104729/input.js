import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;

    let turnDir = 0;
    let boosting = false;

    // Handle Human Input
    if (gameState.controlMode === "HUMAN") {
        if (p.keyIsDown(p.LEFT_ARROW)) {
            turnDir = -1;
        } else if (p.keyIsDown(p.RIGHT_ARROW)) {
            turnDir = 1;
        }
        
        // Up/Down arrows could adjust speed or tight turns?
        // Instructions: "Down Arrow: Slow Down / Tight Turn"
        if (p.keyIsDown(p.DOWN_ARROW)) {
            // Reduce speed, increase turn rate
            gameState.player.turnSpeed = 0.12; 
            gameState.player.speed = 1.5;
        } else {
            gameState.player.turnSpeed = 0.08;
            gameState.player.speed = 2.0;
        }

        if (p.keyIsDown(32)) { // Space
            boosting = true;
        }
    } 
    // Handle Automated Test Input
    else {
        const action = get_automated_testing_action(gameState);
        if (action) {
            if (action.keyIsDown === "LEFT") turnDir = -1;
            if (action.keyIsDown === "RIGHT") turnDir = 1;
            if (action.keyIsDown === "SPACE") boosting = true;
        }
    }

    // Apply rotation
    if (turnDir !== 0) {
        gameState.player.heading += turnDir * gameState.player.turnSpeed;
    }
    
    // Apply boost
    gameState.player.isBoosting = boosting;
}

export function handleKeyPress(p) {
    const k = p.keyCode;
    
    // Log
    p.logs.inputs.push({
        type: "PRESS",
        key: p.key,
        keyCode: k,
        frame: p.frameCount,
        time: Date.now()
    });

    if (k === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    else if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    else if (k === 82) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
            // Signal restart logic in game loop
            gameState.gamePhase = "START";
            window.resetGame(p); // Call exposed reset function
        }
    }
}