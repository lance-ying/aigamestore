/**
 * game.js
 * Main entry point. Sets up the p5 instance, game loop, and initialization.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_SPEED, GRAVITY } from './globals.js';
import { Player } from './entities.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { initLevel, updateLevelGen } from './level_gen.js';
import { updateParticles, renderParticles } from './particles.js';
import { initBackground, renderBackground, updateBackground } from './background.js';
import { renderUI } from './ui.js';

// Access p5 from global window object (loaded via script tag)
const p5 = window.p5;

// Create p5 instance
let gameInstance = new p5(p => {

    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42); // REQUIRED: Reproducibility
        
        // Initial setup of state
        gameState.gamePhase = "START";
        
        // Initialize Background System
        initBackground(p);
        
        // Log start
        p.logs.game_info.push({
            event: 'setup',
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount = p.frameCount;

        // Render pass
        // 1. Background (Parallax)
        // If playing, update parallax
        if (gameState.gamePhase === "PLAYING") {
            updateBackground(p);
        }
        renderBackground(p);

        // 2. Game Phase Handling
        switch (gameState.gamePhase) {
            case "START":
                // Just background and UI
                renderUI(p);
                break;
                
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                // No updates, just render
                renderGameWorld(p);
                renderUI(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderUI(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

// Expose instance globally
window.gameInstance = gameInstance;

// Helper: Set Control Mode (Called from HTML buttons)
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
    // Focus canvas to ensure keys work immediately
    const canvas = document.querySelector('canvas');
    if(canvas) canvas.focus();
};

/**
 * Main Logic Update Loop
 */
function updateGameLogic(p) {
    // 1. Update Player
    if (gameState.player) {
        gameState.player.update(p);
        
        // Update distance stats
        gameState.distanceTraveled = Math.floor(gameState.player.x);
        
        // Update Camera to follow player
        // Keep player at 1/4th of the screen
        gameState.cameraX = gameState.player.x - 100;
    }

    // 2. Level Generation & Cleanup
    updateLevelGen(p);

    // 3. Update Particles
    updateParticles();
}

/**
 * Main World Rendering Loop
 */
function renderGameWorld(p) {
    p.push();
    
    // Apply Camera Transform
    // We only translate X, Y is fixed (no vertical scrolling in this runner)
    p.translate(-gameState.cameraX, 0);

    // Render Entities
    // Filter visible for performance (simple culling)
    const visibleEntities = gameState.entities.filter(e => 
        e.x + e.w > gameState.cameraX && 
        e.x < gameState.cameraX + CANVAS_WIDTH
    );

    visibleEntities.forEach(entity => {
        entity.render(p);
    });

    // Render Player
    if (gameState.player) {
        gameState.player.render(p);
    }
    
    // Particles (They handle their own camera translation usually, 
    // but our system renders in screen space? No, world space.)
    // Wait, particles.js renderParticles does `p.translate`.
    // So we should pop this matrix before rendering particles OR adjust particles.js
    p.pop(); // Pop camera matrix
    
    renderParticles(p); // renderParticles applies its own camera transform
}

/**
 * Resets the game to initial state
 */
export function resetGame(p) {
    // Reset Game State
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.cameraX = 0;
    gameState.worldSpeed = BASE_SPEED;
    gameState.particles = [];
    
    // Initialize Level (Clears entities)
    initLevel();
    
    // Create Player
    // Start at x=100, y=200 (mid-air drop)
    gameState.player = new Player(100, 200);
    
    // Note: We do NOT reset frameCount or randomSeed to preserve continuity
    p.logs.game_info.push({ event: 'reset', timestamp: Date.now() });
}