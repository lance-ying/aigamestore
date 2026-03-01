/**
 * game.js
 * Main game entry point and p5.js instance setup.
 */

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, getGameState } from './globals.js';
import { initInput, handleInput } from './input.js';
import { renderUI, renderCursor, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { initGameLogic, updateGameLogic } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Expose get_automated_testing_action globally as required
window.get_automated_testing_action = get_automated_testing_action;

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Inputs
        initInput(p);
        
        // Initialize Game Logic Entities
        initGameLogic(p);
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Global Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Testing Hook
        handleAutomatedTesting(p);
        
        // Input Handling
        handleInput(p);

        // Rendering
        p.background(COLORS.BACKGROUND);
        
        switch (gameState.gamePhase) {
            case GAME_PHASES.START:
                renderStartScreen(p);
                break;
                
            case GAME_PHASES.PLAYING:
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                renderCursor(p);
                break;
                
            case GAME_PHASES.PAUSED:
                renderGameWorld(p);
                renderUI(p); // Render UI behind pause text
                renderPaused(p);
                break;
                
            case GAME_PHASES.GAME_OVER_WIN:
            case GAME_PHASES.GAME_OVER_LOSE:
                renderGameWorld(p);
                renderGameOver(p);
                break;
        }
    };
    
    // Helper to separate World rendering
    function renderGameWorld(p) {
        // Draw Lines
        gameState.lines.forEach(line => line.render(p));
        
        // Draw Trains (Under stations? Or Over? Usually Over lines, under stations)
        gameState.trains.forEach(train => train.render(p));
        
        // Draw Stations
        gameState.stations.forEach(station => station.render(p));
        
        // Draw Particles
        gameState.particles.forEach(part => part.render(p));
    }
    
    // Logic for Automated Testing Inputs
    function handleAutomatedTesting(p) {
        // Only run if control mode is NOT human
        if (gameState.controlMode === "HUMAN") return;
        
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Simulate Key Press
            p.keyCode = action.keyCode;
            p.keyPressed();
            
            // Release immediately for single trigger actions, or hold logic could be complex
            // For this simple game, we tap keys.
            setTimeout(() => {
                p.keyCode = action.keyCode;
                p.keyReleased();
            }, 50);
        }
    }
});

// Expose instance
window.gameInstance = gameInstance;