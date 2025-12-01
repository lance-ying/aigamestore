// game.js
// Main game loop and setup

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameInfo, TILE_SIZE } from './globals.js';
import { handleInput, KEYS } from './input.js';
import { Player } from './entities.js';
import { generateLevel } from './level_generator.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOver } from './ui.js';
import { updateAutomatedTest } from './automated_test.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        handleInput(p);
        
        // Initial Log
        logGameInfo(p, "game_info", { msg: "Game Initialized" });
        
        // Pre-generate level (or do it on start)
        // We'll do it on start for freshness if we were using random seeds differently,
        // but here we stick to seed 42.
        resetGame(p);
        gameState.gamePhase = "START"; // Force start screen
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Automated Inputs
        updateAutomatedTest(p);
        
        // Rendering
        p.background(135, 206, 235); // Sky Blue
        
        // Phase Handling
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Draw game behind overlay
                renderPauseScreen(p);
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
    };
});

export function resetGame(p) {
    p.randomSeed(42); // Ensure identical levels
    gameState.score = 0;
    gameState.particles = [];
    gameState.gamePhase = "PLAYING";
    
    // Generate Level
    generateLevel(p);
    
    // Spawn Player at start
    // Find first ground platform
    gameState.player = new Player(100, 200);
    
    logGameInfo(p, "game_info", { msg: "Game Reset/Started" });
}

function updateGame(p) {
    if (!gameState.player) return;
    
    // Update Player
    gameState.player.update(p);
    
    // Update Camera (Center on player X, clamped to level bounds)
    const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3; // Player is at 30% of screen
    gameState.cameraX = Math.max(0, targetCamX); // Don't scroll left of 0
    // Optional: Clamp right if level end known
    
    // Update Entities
    gameState.entities.forEach(e => {
        // Optimize: only update if near camera?
        // For simplicity and correctness of simulation, update all active
        if (e.update) e.update(p);
    });
    
    // Update Goal
    // (Goal is in entities list now)

    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Clean up entities
    gameState.entities = gameState.entities.filter(e => {
        if (e.active !== undefined) return e.active;
        if (e.collected !== undefined) return !e.collected;
        return true; // Platforms/Goals usually don't have active flag
    });
    
    // Logging Player State (Throttled slightly or every frame)
    logGameInfo(p, "player_info", {
        x: gameState.player.x,
        y: gameState.player.y,
        vx: gameState.player.vx,
        vy: gameState.player.vy,
        state: gameState.player.onGround ? "GROUND" : "AIR"
    });
}

function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw Background Elements (Clouds)
    // Parallax could go here
    p.push();
    p.translate(gameState.cameraX * 0.5, 0); // Move slower than camera
    p.noStroke();
    p.fill(255, 255, 255, 150);
    p.ellipse(100, 100, 100, 60);
    p.ellipse(400, 150, 150, 80);
    p.ellipse(800, 80, 120, 70);
    p.pop();
    
    // Draw Platforms
    // Optimization: Render only visible
    gameState.platforms.forEach(plat => {
        if (plat.x + plat.width > gameState.cameraX && plat.x < gameState.cameraX + CANVAS_WIDTH) {
            plat.render(p);
        }
    });
    
    // Draw Entities
    gameState.entities.forEach(e => {
        if (e.render) e.render(p);
    });
    
    // Draw Player
    gameState.player.render(p);
    
    // Draw Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

window.gameInstance = gameInstance;