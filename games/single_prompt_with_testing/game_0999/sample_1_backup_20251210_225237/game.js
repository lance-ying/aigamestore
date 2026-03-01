/**
 * Main Game Entry Point.
 * Sets up p5.js instance, game loop, and initialization.
 */

import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';
import { handleKeyPressed, handleKeyReleased, clearInputBuffer, KEYS } from './input.js';
import { Player, Enemy } from './entities.js';
import { Level } from './map.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import './automated_testing_controller.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        p.noSmooth(); // Retro pixel feel
        
        initializeGame();
        
        p.logs.game_info.push({
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    function initializeGame() {
        resetGameState();
        // Create Level (Width = 4 screens)
        gameState.currentLevel = new Level(CANVAS_WIDTH * 4, CANVAS_HEIGHT);
        
        // Create Player
        gameState.player = new Player(100, 200);
        gameState.entities.push(gameState.player);
        
        // Add enemies from map generation are already in gameState.enemies, 
        // need to add to entities list for updates
        gameState.enemies.forEach(e => gameState.entities.push(e));
    }

    p.draw = function() {
        // Update Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Render Background
        p.background(PALETTE.bg);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p, gameState);
                break;
                
            case "PAUSED":
                renderGame(p);
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
        
        clearInputBuffer();
    };

    function updateGame(p) {
        // Update Camera
        if (gameState.player) {
            const targetX = gameState.player.x - CANVAS_WIDTH / 2;
            // Lerp camera
            gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
            
            // Clamp Camera
            gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.currentLevel.width - CANVAS_WIDTH));
        }

        // Update Entities
        gameState.entities.forEach(entity => entity.update(p));
        
        // Clean up inactive entities
        gameState.entities = gameState.entities.filter(e => e.active);
        gameState.projectiles = gameState.projectiles.filter(p => p.active);
        gameState.particles.forEach((part, i) => {
            part.update();
            if (part.life <= 0) gameState.particles.splice(i, 1);
        });

        // Check Win Condition (Boss death logic handles phase change)
    }

    function renderGame(p) {
        p.push();
        p.translate(-Math.floor(gameState.camera.x), 0); // Pixel perfect cam
        
        // Render Level
        if (gameState.currentLevel) {
            gameState.currentLevel.render(p, gameState.camera);
        }
        
        // Render Entities
        // Sort by Y to fake depth? Not needed for 2D side scroller usually, but helps.
        gameState.entities.forEach(entity => entity.render(p));
        
        // Render Projectiles
        gameState.projectiles.forEach(proj => proj.render(p));
        
        // Render Particles
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }

    p.keyPressed = function() {
        handleKeyPressed(p);
        
        // Handle Restart globally if needed
        if (p.keyCode === KEYS.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                initializeGame();
                gameState.gamePhase = "START";
            }
        }
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

window.gameInstance = gameInstance;