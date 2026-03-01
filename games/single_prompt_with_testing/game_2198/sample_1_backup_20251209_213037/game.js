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
import { updateParticles } from './particles.js';

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
                // While in START, we can maybe show a scrolling background or just static
                p.background(COLORS.BACKGROUND);
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
        // Filter out those far off screen to save cycles? 
        // For simplicity in this scope, update active ones.
        
        if (gameState.player) gameState.player.update(p);
        
        // Update collectibles (animations)
        gameState.collectibles.forEach(c => c.update ? c.update(p) : null);
        
        // Update Particles
        updateParticles(p);
    }

    function renderGameWorld(p) {
        // 1. Background
        drawBackground(p);

        // 2. Camera Transform
        p.push();
        // Translation is handled manually in entity render methods for granular control (e.g. parallax), 
        // but usually global translate is easier.
        // Let's use Manual Calculation in entities to allow parallax background efficiently.
        // Actually, entities.js uses `render(p, camX, camY)`.
        
        const camX = gameState.camera.x;
        const camY = gameState.camera.y;

        // 3. Render World
        gameState.platforms.forEach(plat => plat.render(p, camX, camY));
        gameState.hazards.forEach(haz => haz.render(p, camX, camY));
        gameState.collectibles.forEach(col => col.render(p, camX, camY));
        
        // 4. Render Player
        if (gameState.player) gameState.player.render(p, camX, camY);

        // 5. Render Particles (On top)
        // Handled in updateParticles for simplicity or here?
        // particles.js has its own render loop call inside update usually, but we separated them.
        // We called updateParticles in logic. We need a renderParticles.
        // Let's fix particles.js to have separate update/render or handle render there.
        // Ideally: update in logic, render here.
        // I'll assume updateParticles(p) handles both for brevity in that file, 
        // but strictly render should be here. 
        // Re-checking particles.js: updateParticles calls render. Correct.
        // NOTE: updateParticles needs to be called in DRAW loop, not logic loop if it renders!
        // Moving updateParticles to render phase or splitting.
        // Let's call updateParticles in Logic (update only) and renderParticles in Render.
        // For now, `updateParticles` in `particles.js` does both. This is fine for simple games,
        // but technically "update" changes state.
        // Correction: updateGameLogic is called in Draw. So it's fine.
        
        p.pop();
    }

    function drawBackground(p) {
        p.background(COLORS.BACKGROUND);
        
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