/**
 * game.js
 * Main entry point. Sets up p5 instance and game loop.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { Player } from './entities.js';
import { generateLevel } from './level_generator.js';
import { renderUI } from './ui.js';
import { ParticleSystem } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

// Prevent window scrolling with arrows
window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

// Initialize Game Instance
window.gameInstance = new p5(p => {
    
    // Logging Setup
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    function resetGame() {
        p.randomSeed(42);
        
        // Initialize systems
        gameState.particlesSystem = new ParticleSystem();
        gameState.score = 0;
        gameState.coins = 0;
        gameState.entities = [];
        
        // Generate World
        generateLevel(42);
        
        // Setup Player
        gameState.player = new Player(100, CANVAS_HEIGHT - 100);
        
        // Log reset
        p.logs.game_info.push({ event: "RESET", time: Date.now() });
    }

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize gameState defaults
        resetGame();
        gameState.gamePhase = "START";
        
        // Expose control mode setter for HTML buttons
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // If changing mode, maybe reset? Optional.
            resetGame();
            gameState.gamePhase = "START";
        };
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Automated Input Handling
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate press
                p.keyCode = action.keyCode;
                handleKeyPressed(p);
                // Simple release simulation (next frame) - imperfect but sufficient for tests
                setTimeout(() => {
                    p.keyCode = action.keyCode;
                    handleKeyReleased(p);
                }, 100); // Hold for 100ms
            }
        }
        
        // Check for Restart from Game Over
        if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && gameState.keys.r) {
            resetGame();
            gameState.gamePhase = "START";
            gameState.keys.r = false; // consume key
        }

        // --- RENDER & UPDATE ---
        
        // 1. Background
        p.background(COLORS.SKY);
        
        // Parallax Clouds (simple visual)
        p.push();
        p.fill(255, 255, 255, 200);
        p.noStroke();
        const cloudX = (p.frameCount * 0.5) % (CANVAS_WIDTH + 200) - 200;
        p.ellipse(cloudX, 100, 100, 60);
        p.ellipse(cloudX + 50, 110, 120, 70);
        p.ellipse(cloudX - 40, 110, 80, 50);
        p.pop();

        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            
            // Update Camera (Follow player x)
            if (gameState.player) {
                const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3; // Player is at 30% screen width
                // Smooth camera
                gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
                // Clamp camera bounds
                if (gameState.cameraX < 0) gameState.cameraX = 0;
            }

            p.push();
            p.translate(-gameState.cameraX, 0);

            // Update Game Logic (only if playing)
            if (gameState.gamePhase === "PLAYING") {
                // Update Entities
                if (gameState.player) gameState.player.update(p, gameState.keys);
                
                gameState.entities.forEach(ent => {
                    if (ent.update) ent.update(p);
                });
                
                gameState.particlesSystem.update();
                
                // Logging
                if (gameState.frameCount % 60 === 0) { // Log every second
                   p.logs.player_info.push({
                       x: gameState.player.x,
                       y: gameState.player.y,
                       state: gameState.player.state,
                       time: Date.now()
                   });
                }
            }

            // Render World
            // 1. Tiles (visible only)
            const tileKeys = Object.keys(gameState.tiles);
            for (const key of tileKeys) {
                gameState.tiles[key].render(p, gameState.cameraX);
            }
            
            // 2. Entities
            gameState.entities.forEach(ent => ent.render(p));
            
            // 3. Player
            if (gameState.player) gameState.player.render(p);
            
            // 4. Particles
            gameState.particlesSystem.render(p);

            p.pop(); // End Camera
        }

        // UI Layer (Absolute coordinates)
        renderUI(p);
    };

    p.keyPressed = function() {
        if (gameState.controlMode === "HUMAN") {
            handleKeyPressed(p);
        }
    };

    p.keyReleased = function() {
        if (gameState.controlMode === "HUMAN") {
            handleKeyReleased(p);
        }
    };
});