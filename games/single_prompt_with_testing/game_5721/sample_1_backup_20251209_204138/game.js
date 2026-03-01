/**
 * Main Entry Point for Go Escape
 * Sets up the p5.js instance, game loop, and initialization.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, resetGameState } from './globals.js';
import { initInput, updateInput } from './input.js';
import { Player } from './entities.js';
import { updatePhysics } from './physics.js';
import { renderUI } from './ui.js';
import { generateLevel } from './level_generator.js';
import { addCameraShake } from './utils.js';

// Get p5 from window
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Inputs
        initInput(p);
        
        // Log start
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
        
        // Initial Draw Config
        p.textAlign(p.CENTER, p.CENTER);
        p.noSmooth(); // Retro pixel feel
    };

    p.draw = function() {
        // 1. Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // 2. Clear Screen
        p.background(COLORS.BACKGROUND);
        
        // 3. State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
                
            case "PLAYING":
                // Logic
                updateInput(); // Get latest control state
                updateGameLogic(p);
                
                // Render
                renderGameWorld(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                updateInput(); // Still check for unpause
                renderGameWorld(p); // Draw static world behind
                renderUI(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                updateInput(); // Check for restart
                if (gameState.inputs.restart) {
                    initGame(p); // Reset
                    gameState.gamePhase = "START";
                }
                renderGameWorld(p);
                renderUI(p);
                break;
        }
    };
});

/**
 * Initializes/Resets the game world
 */
function initGame(p) {
    resetGameState();
    
    // Generate World
    generateLevel(p);
    
    // Spawn Player at start
    gameState.player = new Player(100, CANVAS_HEIGHT - 150);
    gameState.entities.push(gameState.player);
    gameState.camera.target = gameState.player;
    
    p.logs.game_info.push({
        event: "Level Generated",
        seed: 42
    });
}

/**
 * Main Game Loop Logic
 */
function updateGameLogic(p) {
    // If just started playing and no player exists, init
    if (!gameState.player) {
        initGame(p);
    }
    
    // Update Camera
    updateCamera();
    
    // Update Entities
    // Filter active entities only to save perf? No, just iterate backwards for removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        if (ent.update) ent.update(p);
        
        // Cleanup inactive particles
        if (ent.life !== undefined && ent.life <= 0) {
            gameState.entities.splice(i, 1);
            // Also remove from specific lists if needed (optimization for later)
        }
    }
    
    // Particle System cleanup specifically
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Run Physics Engine
    updatePhysics(p);
    
    // Check Goal Condition
    if (gameState.goal && gameState.player) {
        gameState.goal.checkReached(gameState.player);
    }
}

/**
 * Smooth Camera Follow
 */
function updateCamera() {
    if (!gameState.camera.target) return;
    
    const targetX = gameState.camera.target.x - CANVAS_WIDTH * 0.3; // Keep player to left side
    const targetY = gameState.camera.target.y - CANVAS_HEIGHT * 0.6;
    
    // Linear Interpolation
    gameState.camera.x = lerp(gameState.camera.x, targetX, 0.1);
    gameState.camera.y = lerp(gameState.camera.y, targetY, 0.1);
    
    // Bounds (Floor mostly)
    gameState.camera.y = Math.min(gameState.camera.y, CANVAS_HEIGHT * 0.5); // Don't show too much below floor
    
    // Shake decay
    if (gameState.camera.shakeAmount > 0) {
        gameState.camera.x += Math.random() * gameState.camera.shakeAmount - gameState.camera.shakeAmount/2;
        gameState.camera.y += Math.random() * gameState.camera.shakeAmount - gameState.camera.shakeAmount/2;
        gameState.camera.shakeAmount *= 0.9;
        if (gameState.camera.shakeAmount < 0.5) gameState.camera.shakeAmount = 0;
    }
}

/**
 * World Rendering
 */
function renderGameWorld(p) {
    p.push();
    
    // Apply Camera Transform
    p.translate(-gameState.camera.x, -gameState.camera.y);
    
    // Draw Parallax Background (Stars or grid)
    drawBackground(p);
    
    // Render Entities
    // Platforms
    gameState.platforms.forEach(plat => plat.render(p));
    
    // Obstacles
    gameState.obstacles.forEach(obs => obs.render(p));
    
    // Collectibles
    gameState.collectibles.forEach(col => col.render(p));
    
    // Goal
    if (gameState.goal) gameState.goal.render(p);
    
    // Particles (behind player)
    gameState.particles.forEach(part => part.render(p));
    
    // Player
    if (gameState.player) gameState.player.render(p);
    
    p.pop();
}

function drawBackground(p) {
    // Simple grid relative to camera
    p.stroke(40);
    p.strokeWeight(1);
    
    const gridSize = 50;
    const startX = Math.floor(gameState.camera.x / gridSize) * gridSize;
    const startY = Math.floor(gameState.camera.y / gridSize) * gridSize;
    
    for (let x = startX; x < gameState.camera.x + CANVAS_WIDTH; x += gridSize) {
        p.line(x, gameState.camera.y, x, gameState.camera.y + CANVAS_HEIGHT * 2);
    }
    for (let y = startY; y < gameState.camera.y + CANVAS_HEIGHT * 2; y += gridSize) {
        p.line(gameState.camera.x, y, gameState.camera.x + CANVAS_WIDTH, y);
    }
}

// Expose instance
window.gameInstance = gameInstance;