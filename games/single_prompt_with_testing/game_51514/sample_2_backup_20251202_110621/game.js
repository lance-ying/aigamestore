// game.js - Main Entry Point
import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { loadLevel } from './level.js';
import { Player } from './entities.js';
import { handleInput, keyPressed, keyReleased } from './input.js';
import { updateEntityPhysics } from './physics.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused, drawBackground } from './ui.js';
import { get_automated_testing_action } from './automated_test.js';
import { particleSystem } from './particles.js';

const p5 = window.p5;

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
        
        // Initialize
        resetGameState();
        loadLevel();
        
        // Log start
        p.logs.game_info.push({
            event: "setup",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        const startTime = p.millis();
        
        // Global Update Logic
        gameState.frameCount = p.frameCount;
        
        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p); // Render underlying game frozen
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
        
        // Calculate Delta (simple version)
        gameState.deltaTime = (p.millis() - startTime) / 1000;
    };

    function updateGame(p) {
        // 1. Input / AI
        if (gameState.controlMode === "HUMAN") {
            handleInput(p);
        } else {
            get_automated_testing_action();
        }

        // 2. Update Entities
        if (gameState.player) gameState.player.update(p);
        
        gameState.bombs.forEach(b => b.update());
        // Remove inactive bombs
        gameState.bombs = gameState.bombs.filter(b => b.active);
        
        gameState.collectibles.forEach(c => c.update());
        gameState.collectibles = gameState.collectibles.filter(c => c.active);
        
        gameState.blocks = gameState.blocks.filter(b => b.active); // Just clean up destroyed ones
        
        // 3. Particles
        gameState.particles.forEach(pt => pt.update());
        gameState.particles = gameState.particles.filter(pt => pt.active);

        // 4. Camera Update
        updateCamera();
    }

    function updateCamera() {
        if (!gameState.player) return;
        
        // Target: Center player
        let targetX = gameState.player.x - CANVAS_WIDTH / 2;
        let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Smooth lerp
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
        
        // Clamp
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.levelW - CANVAS_WIDTH));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.levelH - CANVAS_HEIGHT));
    }

    function renderGame(p) {
        drawBackground(p);
        
        p.push();
        // Apply Camera Transform
        p.translate(-gameState.camera.x, -gameState.camera.y);

        // Render Order:
        // 1. World Static (Platforms)
        gameState.platforms.forEach(plat => plat.render(p));
        
        // 2. Objects (Blocks, Goal, Hazards)
        if (gameState.goal) gameState.goal.render(p);
        gameState.hazards.forEach(h => h.render(p));
        gameState.blocks.forEach(b => b.render(p));
        gameState.collectibles.forEach(c => c.render(p));
        
        // 3. Bombs
        gameState.bombs.forEach(b => b.render(p));
        
        // 4. Player
        if (gameState.player) gameState.player.render(p);
        
        // 5. Particles
        gameState.particles.forEach(pt => pt.render(p));

        p.pop();
    }

    p.keyPressed = function() {
        keyPressed(p);
    };

    p.keyReleased = function() {
        keyReleased(p);
    };
});

window.gameInstance = gameInstance;

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply mode cleanly
    resetGameState();
    loadLevel();
    // If setting to test, start playing immediately
    if (mode !== "HUMAN") {
        gameState.gamePhase = "PLAYING";
    } else {
        gameState.gamePhase = "START";
    }
};