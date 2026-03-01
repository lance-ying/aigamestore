/**
 * game.js
 * Main entry point. Sets up p5 instance, game loop, and connects all modules.
 */

import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, DEBUG_MODE } from './globals.js';
import { handleInput, onKeyPressed, onKeyReleased } from './input.js';
import { Player } from './entities.js';
import { resolveCharacterSpacing } from './physics.js';
import { LevelManager } from './level.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5((p) => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Disable context menu
        canvas.elt.oncontextmenu = () => false;
        
        // Initial Reset
        resetGameState();
        
        // Log Start
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // 1. Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // 2. Input Processing
        handleInput(p);
        
        // 3. Game Phase Handling
        if (gameState.input.enter && gameState.gamePhase === "START") {
            startGame();
        }
        if (gameState.input.restart && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            resetGameState(); // Reset data
            startGame();     // Start fresh
        }
        if (gameState.input.escape) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }

        // 4. Update Logic
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        }

        // 5. Render Logic
        renderGame(p);
    };

    // Events
    p.keyPressed = function() {
        onKeyPressed(p, p.keyCode);
    };

    p.keyReleased = function() {
        onKeyReleased(p, p.keyCode);
    };

    // --- Core Game Functions ---

    function startGame() {
        gameState.gamePhase = "PLAYING";
        gameState.player = new Player(100, 300);
        gameState.entities.push(gameState.player);
        gameState.levelManager = new LevelManager();
        
        p.logs.game_info.push({
            event: "Game Started",
            controlMode: gameState.controlMode,
            timestamp: Date.now()
        });
    }

    function updateGame(p) {
        // Update Level (Spawning)
        gameState.levelManager.update(p);

        // Update Entities
        // Filter out dead entities that should be removed
        // (Note: Enemies handle their own removal from the specific arrays, but we clean main list here)
        gameState.entities = gameState.entities.filter(e => {
            // Keep player, keep enemies unless fully dead and processed
            if (e === gameState.player) return true;
            if (e.dead && e.stateTimer > 100) return false; 
            return true;
        });

        gameState.entities.forEach(entity => entity.update(p));
        
        // Physics resolution (Entity vs Entity spacing)
        const characters = gameState.entities.filter(e => e.width !== undefined); // Simple check for char
        resolveCharacterSpacing(characters);

        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }

        // Camera Shake decay
        if (gameState.cameraShake > 0) {
            gameState.cameraShake *= 0.9;
            if (gameState.cameraShake < 0.1) gameState.cameraShake = 0;
        }

        // Logging Player Info
        if (gameState.player && p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: Math.round(gameState.player.x),
                y: Math.round(gameState.player.y),
                health: gameState.player.health,
                state: gameState.player.state,
                frame: p.frameCount
            });
        }
    }

    function renderGame(p) {
        // Clear with Safety
        p.background(0);

        // Screens
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
            return;
        }

        // Camera Shake Application
        p.push();
        if (gameState.cameraShake > 0) {
            p.translate(p.random(-gameState.cameraShake, gameState.cameraShake), p.random(-gameState.cameraShake, gameState.cameraShake));
        }

        // 1. Background
        if (gameState.levelManager) {
            gameState.levelManager.renderBackground(p);
        }

        // 2. Sort Entities by Y (Depth)
        // We include particles in this sort if they have Y, otherwise render on top
        // For simplicity, we render entities sorted, then particles on top
        gameState.entities.sort((a, b) => a.y - b.y);

        // 3. Render Entities
        gameState.entities.forEach(entity => entity.render(p));

        // 4. Render Particles (Simple Z-sort agnostic or on top)
        gameState.particles.forEach(pt => pt.render(p));

        p.pop(); // End Camera Shake

        // 5. UI Overlays (Always on top, no camera shake)
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            renderUI(p);
        }

        if (gameState.gamePhase === "PAUSED") {
            renderPauseScreen(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            renderGameOver(p, true);
        } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGameOver(p, false);
        }
    }
});

// Expose instance
window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};