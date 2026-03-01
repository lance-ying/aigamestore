/**
 * game.js
 * Main Entry Point.
 * Initializes p5.js instance, runs the game loop, and coordinates all modules.
 */

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BG, GROUND_Y, COLOR_GROUND 
} from './globals.js';
import { Player } from './entities.js';
import { updateCombat, initCombat } from './combat_manager.js';
import { handleKeyPress, startGame, resetGame } from './input.js';
import { renderUI, renderStartScreen, renderPauseScreen, renderGameOverScreen } from './ui.js';
import { updateAutomatedTest } from './automated_testing_controller.js';
import { createSpeedLines } from './particle_system.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Write-Only Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Game State logic
        resetGame(); // Sets up player, etc.
        gameState.gamePhase = "START"; // Override to START
        
        // Expose control mode setter for HTML buttons
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // Reset focus to canvas to ensure keys work
            p.canvas.focus();
        };

        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, action: "SETUP" },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Automated Inputs
        if (gameState.gamePhase === 'PLAYING') {
            updateAutomatedTest();
        }

        // ============================
        // UPDATE LOGIC
        // ============================
        
        // Screen Shake Decay
        let shakeX = 0;
        let shakeY = 0;
        if (gameState.shakeIntensity > 0) {
            shakeX = p.random(-1, 1) * gameState.shakeIntensity;
            shakeY = p.random(-1, 1) * gameState.shakeIntensity;
            gameState.shakeIntensity *= gameState.shakeDecay;
            if (gameState.shakeIntensity < 0.5) gameState.shakeIntensity = 0;
        }

        // ============================
        // RENDER LOGIC
        // ============================
        
        p.push();
        p.translate(shakeX, shakeY);
        
        // Background
        p.background(COLOR_BG);
        
        // Dynamic Background (Speed Lines)
        if (gameState.combo > 10 || gameState.furyMeter >= 100) {
             if (p.frameCount % 10 === 0) createSpeedLines(p, 2);
        }
        
        gameState.backgroundEffects.forEach((eff, i) => {
            eff.update();
            eff.render(p);
            if (eff.life <= 0) gameState.backgroundEffects.splice(i, 1);
        });

        // Ground
        p.noStroke();
        p.fill(COLOR_GROUND);
        p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED' || gameState.gamePhase.startsWith('GAME_OVER')) {
            
            if (gameState.gamePhase === 'PLAYING') {
                updateCombat(p);
                
                // Update Player
                if (gameState.player) gameState.player.update();
                
                // Update Particles
                for (let i = gameState.particles.length - 1; i >= 0; i--) {
                    const part = gameState.particles[i];
                    part.update();
                    if (part.life <= 0) gameState.particles.splice(i, 1);
                }
                
                // Update Floating Text
                for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
                    const txt = gameState.floatingTexts[i];
                    txt.update();
                    if (txt.life <= 0) gameState.floatingTexts.splice(i, 1);
                }
                
                // Log Player Info occasionally
                if (p.frameCount % 30 === 0 && gameState.player) {
                    p.logs.player_info.push({
                        screen_x: gameState.player.x,
                        screen_y: gameState.player.y,
                        game_x: gameState.player.x,
                        game_y: gameState.player.y,
                        health: gameState.player.health,
                        combo: gameState.combo,
                        framecount: p.frameCount,
                        timestamp: Date.now()
                    });
                }
            }

            // Render Entities (Back to Front)
            // Enemies
            gameState.enemies.forEach(e => e.render(p));
            
            // Player
            if (gameState.player) gameState.player.render(p);
            
            // Particles
            gameState.particles.forEach(part => part.render(p));
            gameState.floatingTexts.forEach(txt => txt.render(p));
            
            // UI Overlay
            renderUI(p);
        }

        p.pop(); // End Shake

        // Overlays
        if (gameState.gamePhase === 'START') {
            renderStartScreen(p);
        } else if (gameState.gamePhase === 'PAUSED') {
            renderPauseScreen(p);
        } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
            renderGameOverScreen(p);
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
});

window.gameInstance = gameInstance;