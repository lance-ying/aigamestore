/**
 * game.js
 * Main entry point. Setup p5 instance, main loop.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameEvent } from './globals.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderUI } from './ui.js';
import { LevelGenerator } from './level_gen.js';
import { animationSystem } from './animations.js';
import { globalParticles } from './particles.js';

// Setup p5 in instance mode
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
        
        // Initialize Game
        resetGame();
        
        // Initial Log
        logGameEvent(p, "INIT", "Game Initialized");
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Input Polling (for automated tests mainly)
        handleInput(p);

        // Update Systems
        if (gameState.gamePhase === 'PLAYING') {
            animationSystem.update();
            globalParticles.update();
        }

        // --- RENDER ---
        p.background(20, 15, 25);
        
        // Apply Camera Shake
        p.push();
        animationSystem.applyCamera(p);

        // Center Grid
        // Calculate offset to center the grid
        // Grid width approx: cols * size * 1.5
        // Grid height approx: rows * size * sqrt(3)
        // This is rough, can be refined
        const gridW = gameState.grid ? gameState.grid.cols * 25 * 1.5 : 0;
        const gridH = gameState.grid ? gameState.grid.rows * 25 * 1.7 : 0;
        const offsetX = (CANVAS_WIDTH - gridW) / 2 + 20; // +20 padding adjust
        const offsetY = (CANVAS_HEIGHT - gridH) / 2 + 20;
        
        p.translate(offsetX, offsetY);
        gameState.viewOffset = { x: offsetX, y: offsetY };

        // Render Game World
        if (gameState.gamePhase !== 'START') {
            if (gameState.grid) gameState.grid.render(p);
            
            // Entities
            // Sort by Y for depth
            const renderList = [...gameState.entities];
            renderList.sort((a, b) => a.pixelY - b.pixelY);
            renderList.forEach(e => e.render(p));
            
            globalParticles.render(p);
        }

        p.pop(); // End Camera

        // Render UI (on top, no camera transform)
        renderUI(p);
        
        // Logging Player Info
        if (gameState.player && p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                hp: gameState.player.hp,
                q: gameState.player.q,
                r: gameState.player.r,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    };

    p.keyPressed = function() {
        p.logs.inputs.push({
            type: 'keyPressed',
            key: p.key,
            keyCode: p.keyCode,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        handleKeyPress(p);
    };

    // Global reset exposed to instance
    // We attach to 'p' because 'window.gameInstance' is not assigned yet
    p.resetGame = resetGame;
    p.resetLevel = resetLevel;

    function resetGame() {
        gameState.score = 0;
        gameState.level = 1;
        gameState.gamePhase = "START";
        gameState.entities = [];
        gameState.particles = [];
        LevelGenerator.generate(1);
        logGameEvent(p, "RESET", "Game Reset");
    }

    function resetLevel(level) {
        LevelGenerator.generate(level);
        logGameEvent(p, "LEVEL_START", level);
    }
});

// Expose instance
window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};