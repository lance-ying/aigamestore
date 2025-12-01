// game.js
// Main entry point

import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, gameState, logGameEvent } from './globals.js';
import { handleInput } from './input.js';
import { renderGame, renderUI, renderStartScreen, renderGameOver, renderPaused } from './renderer.js';
import { get_automated_testing_action } from './testing.js';
import { Hex } from './hex_lib.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(TARGET_FPS);
        p.randomSeed(42);
        
        // Initial Log
        logGameEvent('init', { version: '1.0.0' });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        if (gameState.lastFrameTime === 0) gameState.lastFrameTime = currentTime;
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Automated Test Input Injection
        const autoAction = get_automated_testing_action();
        if (autoAction) {
            p.keyCode = autoAction.keyCode;
            p.keyPressed();
            p.keyCode = 0; // Reset
        }
        
        // Update Animations
        updateAnimations(gameState.deltaTime);
        
        // Entities Update (visual interpolation)
        gameState.entities.forEach(e => e.update(gameState.deltaTime));
        
        // Render
        p.background(20, 20, 30); // Fallback color
        
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
            case "LEVEL_TRANSITION":
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPaused(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        // Logging Player Info
        if (gameState.gamePhase === "PLAYING" && gameState.player && gameState.frameCount % 60 === 0) {
            p.logs.player_info.push({
                q: gameState.player.q,
                r: gameState.player.r,
                hp: gameState.player.hp,
                score: gameState.score,
                frame: gameState.frameCount
            });
        }
    };

    p.keyPressed = function() {
        handleInput(p);
    };
});

// Animation Manager
function updateAnimations(dt) {
    if (gameState.animations.length > 0) {
        // Process parallel animations? Or sequential?
        // Let's do sequential for simplicity in turn-based logic
        const anim = gameState.animations[0];
        anim.update(dt);
        
        if (anim.isFinished()) {
            if (anim.onComplete) anim.onComplete();
            gameState.animations.shift();
        }
    }
}

window.gameInstance = gameInstance;
// Expose control mode setter for buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If starting fresh
    if (gameState.gamePhase === "START" && mode !== "HUMAN") {
        // Simulate enter press
        gameInstance.keyCode = 13;
        gameInstance.keyPressed();
    }
};