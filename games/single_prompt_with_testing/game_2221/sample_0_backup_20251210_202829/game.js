/**
 * game.js
 * Main entry point. Sets up p5 instance and game loop.
 */

import { 
    gameState, getGameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { initInput } from './input.js';
import { Player } from './entities.js';
import { initLevel } from './level_generator.js';
import { renderUI, renderStartScreen, renderPaused, renderGameOver } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initInput(p);
        
        // Log start
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
        
        // Reset Logic wrapper
        startNewGame();
    };
    
    function startNewGame() {
        resetGameState();
        
        // Create initial entities
        gameState.player = new Player(100, 200);
        gameState.entities.push(gameState.player);
        
        initLevel();
    }

    p.draw = function() {
        // Delta time calc
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Check reset flag
        if (gameState._shouldReset) {
            startNewGame();
            gameState.gamePhase = "START";
            gameState._shouldReset = false;
        }

        // Draw Background
        p.background(COLORS.BACKGROUND);
        
        // Parallax stars
        drawStars(p);

        // State Handling
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGameWorld(p); // Render frozen world
                renderUI(p);
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderGameOver(p);
                break;
        }
    };
    
    function updateGameLogic(p) {
        // Update Camera
        updateCamera(p);
        
        // Update Entities
        if (gameState.player) gameState.player.update(p);
        
        gameState.enemies.forEach(e => e.update(p));
        gameState.collectibles.forEach(c => c.update(p));
        
        // Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Log Player Info
        if (gameState.player && p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                state: gameState.player.state,
                frame: p.frameCount
            });
        }
        
        // Win Condition (Reach 3000px)
        if (gameState.player.x > 3000) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    function updateCamera(p) {
        const targetX = gameState.player.x - CANVAS_WIDTH / 3;
        // Smooth lerp
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        
        // Clamp
        gameState.camera.x = Math.max(0, gameState.camera.x);
        gameState.camera.y = 0; // Lock Y axis for this style
        
        // Screen shake decay
        if (gameState.camera.shake > 0) {
            gameState.camera.x += (Math.random() - 0.5) * gameState.camera.shake;
            gameState.camera.y += (Math.random() - 0.5) * gameState.camera.shake;
            gameState.camera.shake *= 0.9;
            if (gameState.camera.shake < 0.5) gameState.camera.shake = 0;
        }
    }
    
    function renderGameWorld(p) {
        p.push();
        p.translate(-gameState.camera.x, -gameState.camera.y);
        
        // Render Platforms
        gameState.platforms.forEach(plat => {
            // Culling
            if (plat.x + plat.width > gameState.camera.x && plat.x < gameState.camera.x + CANVAS_WIDTH) {
                plat.render(p);
            }
        });
        
        // Render Collectibles
        gameState.collectibles.forEach(c => c.render(p));
        
        // Render Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        // Render Particles
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }
    
    function drawStars(p) {
        p.push();
        p.noStroke();
        p.fill(255, 255, 255, 100);
        const camX = gameState.camera.x * 0.5; // Parallax factor
        
        for (let i = 0; i < 50; i++) {
            // Pseudo-random stars based on index, fixed positions relative to world
            const sx = (i * 137) % CANVAS_WIDTH;
            const sy = (i * 241) % CANVAS_HEIGHT;
            
            // Scroll them
            const renderX = (sx - camX) % CANVAS_WIDTH;
            const finalX = renderX < 0 ? renderX + CANVAS_WIDTH : renderX;
            
            p.circle(finalX, sy, 2);
        }
        p.pop();
    }
});

// Helper for UI buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset game to apply cleanly
    if (gameState.gamePhase !== "START") {
        gameState._shouldReset = true;
    }
};