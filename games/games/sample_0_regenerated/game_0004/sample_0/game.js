/**
 * Main Game Entry Point.
 * Initializes p5 instance, game loop, and handles high-level logic.
 */

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WIN_DEPTH } from './globals.js';
import { Player } from './entities.js';
import { setupInput, resetGame } from './input.js';
import { updateWorldGeneration } from './world.js';
import { renderUI } from './ui.js';
import { updateParticles } from './particles.js';

const p5 = window.p5;

// Global method to set mode from HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state if switching mid-game
    // accessing game instance via global
    if (window.gameInstance) {
        // A rough way to reset, but effective
        gameState.gamePhase = "START";
        resetGame(window.gameInstance);
    }
};

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Setup Inputs
        setupInput(p);
        
        // Log Start
        p.logs.game_info.push({
            event: "INIT",
            timestamp: Date.now()
        });
        
        // Ensure START phase
        gameState.gamePhase = "START";
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Clear Background
        p.background(COLORS.BACKGROUND);
        
        // State Machine
        if (gameState.gamePhase === "START") {
            renderUI(p);
        } 
        else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderUI(p);
        }
        else if (gameState.gamePhase === "PAUSED") {
            // Render frozen game state behind overlay
            p.push();
            applyCamera(p);
            renderEntities(p);
            p.pop();
            renderUI(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             p.push();
            applyCamera(p);
            renderEntities(p);
            p.pop();
            renderUI(p);
        }
    };
    
    function updateGame(p) {
        // 1. Initialize Player if missing
        if (!gameState.player) {
            gameState.player = new Player(CANVAS_WIDTH / 2, 50);
            gameState.entities.push(gameState.player);
            updateWorldGeneration(); // Initial world gen
        }
        
        // 2. World Generation & cleanup
        updateWorldGeneration();
        
        // 3. Update all entities
        // Player
        if (gameState.player) gameState.player.update(p);
        
        // Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            gameState.projectiles[i].update(p);
            if (gameState.projectiles[i].markedForDeletion) {
                gameState.projectiles.splice(i, 1);
            }
        }
        
        // Enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            gameState.enemies[i].update(p);
            if (gameState.enemies[i].markedForDeletion) {
                gameState.enemies.splice(i, 1);
            }
        }
        
        // Gems
        gameState.collectibles.forEach(g => g.update(p));
        
        // Particles
        updateParticles(p);
        
        // 4. Update Game Logic (Depth, Win condition)
        if (gameState.player) {
            gameState.depth = Math.max(gameState.depth, gameState.player.y);
            
            if (gameState.depth > WIN_DEPTH + 200) {
                 gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }
    
    function applyCamera(p) {
        // Translate world up by cameraY
        p.translate(0, -gameState.cameraY);
    }
    
    function renderGame(p) {
        p.push();
        applyCamera(p);
        renderEntities(p);
        p.pop();
    }
    
    function renderEntities(p) {
        // Render Order: Platforms -> Gems -> Enemies -> Player -> Projectiles -> Particles
        gameState.platforms.forEach(e => e.render(p));
        gameState.collectibles.forEach(e => e.render(p));
        gameState.enemies.forEach(e => e.render(p));
        if (gameState.player) gameState.player.render(p);
        gameState.projectiles.forEach(e => e.render(p));
        // Particles handled in updateParticles but ideally rendered here if separated
        // The particle system renders immediately in its update loop in this architecture, 
        // but we called it in updateGame(). To fix layering, we should split update/render for particles.
        // For now, let's re-iterate to render or assume particles render on top. 
        // Refactor: We will just iterate to render here.
        gameState.particles.forEach(part => part.render(p));
    }
});

// Expose instance
window.gameInstance = gameInstance;