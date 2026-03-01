/**
 * game.js
 * Main entry point. Sets up p5 instance, game loop, and initialization.
 */

import { 
    gameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    COLORS, LEVEL_LENGTH 
} from './globals.js';
import { handleKeyPressed, handleKeyReleased, updateInputState } from './input.js';
import { Player } from './entities.js';
import { generateLevel } from './level_generator.js';
import { renderUI } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';

// Setup P5 Instance Mode
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Game State
        resetGameState();
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Input processing
        updateInputState(p);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                // Wait for Enter...
                p.background(...COLORS.BACKGROUND);
                renderUI(p);
                
                // If switching from START to PLAYING (handled in input.js or here), initialize
                if (wasPhaseChangedToPlaying()) {
                    initGameLevel();
                }
                break;

            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;

            case "PAUSED":
                // No update, just render
                renderGameWorld(p);
                renderUI(p);
                break;

            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                // Maybe slow motion update or just static
                renderGameWorld(p);
                renderUI(p);
                break;
        }
        
        // Handle Restart Signal from Input
        if (gameState.gamePhase === "START" && gameState.player) {
            // If we have a player but are in START, it means we just reset.
            // Clear entities.
            resetGameState();
        }
    };

    // ----------------------------------------------------------------
    // Logic & Rendering
    // ----------------------------------------------------------------

    function initGameLevel() {
        resetGameState();
        gameState.gamePhase = "PLAYING";
        
        // Create Player
        gameState.player = new Player(100, 200);
        gameState.entities.push(gameState.player);
        
        // Generate World
        generateLevel();
    }

    function updateGameLogic(p) {
        // Update Camera to follow player
        if (gameState.player) {
            const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3; // Player is at 30% screen width
            gameState.camera.x = p.lerp(gameState.camera.x, targetCamX, 0.1);
            
            // Constrain Camera
            gameState.camera.x = Math.max(0, gameState.camera.x);
            gameState.camera.y = 0; // Vertical scroll locked usually, or follow loosely
            
            // Update Distance
            gameState.distanceTraveled = Math.max(gameState.distanceTraveled, gameState.player.x);
            
            // Win Condition
            if (gameState.player.x >= LEVEL_LENGTH) {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }

        // Update All Dynamic Entities
        if (gameState.player) gameState.player.update(p);
        
        // Update collectibles (animations)
        gameState.collectibles.forEach(c => c.update ? c.update(p) : null);
        
        // Update Particles
        updateParticles();
    }

    function renderGameWorld(p) {
        // 1. Background
        drawBackground(p);

        // 2. Camera Transform
        p.push();
        
        const camX = gameState.camera.x;
        const camY = gameState.camera.y;

        // 3. Render World
        gameState.platforms.forEach(plat => plat.render(p, camX, camY));
        gameState.hazards.forEach(haz => haz.render(p, camX, camY));
        gameState.collectibles.forEach(col => col.render(p, camX, camY));
        
        // 4. Render Player
        if (gameState.player) gameState.player.render(p, camX, camY);

        // 5. Render Particles (On top)
        renderParticles(p);
        
        p.pop();
    }

    function drawBackground(p) {
        p.background(...COLORS.BACKGROUND);
        
        // Parallax Mountains
        p.push();
        const camX = gameState.camera.x;
        
        // Distant mountains
        p.fill(200, 210, 230);
        p.noStroke();
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        for (let i = 0; i <= CANVAS_WIDTH; i+=50) {
            // Use noise based on world position
            const h = p.noise((i + camX * 0.2) * 0.01) * 100 + 100;
            p.vertex(i, CANVAS_HEIGHT - h);
        }
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.endShape();

        // Closer hills
        p.fill(170, 190, 210);
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        for (let i = 0; i <= CANVAS_WIDTH; i+=30) {
            const h = p.noise((i + camX * 0.5) * 0.02 + 1000) * 50 + 50;
            p.vertex(i, CANVAS_HEIGHT - h);
        }
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.endShape();
        
        p.pop();
    }
    
    // Helper to detect transition
    let prevPhase = "START";
    function wasPhaseChangedToPlaying() {
        const changed = prevPhase !== "PLAYING" && gameState.gamePhase === "PLAYING";
        prevPhase = gameState.gamePhase;
        return changed;
    }

    // Input Event Bindings
    p.keyPressed = function() {
        handleKeyPressed(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyReleased(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;