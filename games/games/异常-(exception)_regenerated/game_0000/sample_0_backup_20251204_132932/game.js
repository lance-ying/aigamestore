/**
 * Main Game Entry Point
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameInfo } from './globals.js';
import { handleKeyPress } from './input.js';
import { renderGame, renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';
import { updateSimulation } from './logic.js';

const p5 = window.p5;

new p5(p => {
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Log
        logGameInfo(p, { action: "INIT", phase: gameState.gamePhase });
        
        // Expose helper for testing
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode Set:", mode);
        };
    };

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Run Automated Test Hooks
        if (window.runAutomatedTest) window.runAutomatedTest();

        // Render based on Phase
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateSimulation(p);
                renderGame(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                updateSimulation(p); // finish animations
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        // Log Input
        if (p.logs.inputs) {
            p.logs.inputs.push({
                type: 'keyPressed',
                keyCode: p.keyCode,
                frame: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        handleKeyPress(p);
    };
});