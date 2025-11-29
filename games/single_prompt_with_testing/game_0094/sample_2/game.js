// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleInput } from './input.js';
import { initGame, updateGame } from './logic.js';
import { renderBackground, renderHUD, renderCursor, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

// Maximum log entries to prevent memory issues
const MAX_LOG_ENTRIES = 100;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    // Helper to add log with size limit
    p.addLog = function(category, entry) {
        if (!p.logs[category]) return;
        p.logs[category].push(entry);
        // Keep only last MAX_LOG_ENTRIES
        if (p.logs[category].length > MAX_LOG_ENTRIES) {
            p.logs[category].shift(); // Remove oldest entry
        }
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        p.addLog("game_info", {
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Expose handleInput for test buttons if needed (via window wrapper usually, but here handled via key listeners)
    };

    p.draw = function() {
        // Time management
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // --- Automated Testing Inputs ---
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            // Throttle AI inputs to be "human-like" or every few frames to prevent glitching
            if (p.frameCount % 5 === 0) {
                const action = get_automated_testing_action(gameState);
                if (action) {
                    handleInput(p, action.keyCode, true);
                }
            }
        }

        // --- Render Loop ---
        switch (gameState.gamePhase) {
            case "START":
                renderBackground(p);
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                
                renderBackground(p);
                
                // Draw Entities sorted by Y mostly (though plants are in grid)
                // We'll draw Grid Contents first
                gameState.plants.forEach(e => e.render(p));
                gameState.zombies.forEach(e => e.render(p));
                gameState.projectiles.forEach(e => e.render(p));
                gameState.suns.forEach(e => e.render(p));
                gameState.particles.forEach(e => e.render(p));
                
                renderCursor(p);
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderBackground(p);
                // Draw static game state
                gameState.plants.forEach(e => e.render(p));
                gameState.zombies.forEach(e => e.render(p));
                renderHUD(p);
                renderPauseScreen(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderBackground(p);
                gameState.plants.forEach(e => e.render(p));
                gameState.zombies.forEach(e => e.render(p));
                renderHUD(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
    };

    p.keyPressed = function() {
        // Global State Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START" || gameState.gamePhase.includes("GAME_OVER")) {
                initGame();
                p.addLog("game_info", {
                    data: { gamePhase: "PLAYING" },
                    framecount: p.frameCount,
                    timestamp: Date.now()
                });
            }
        }
        
        if (p.keyCode === 27) { // ESC / P (Use 27 for ESC, maybe 80 for P)
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "PAUSED" || gameState.gamePhase.includes("GAME_OVER")) {
                 initGame();
            }
        }

        // Gameplay Controls
        handleInput(p, p.keyCode, false);
    };

});

// Global Helpers
window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If switching to test mode mid-game, ensure phase is correct or restart
    if (mode !== "HUMAN" && gameState.gamePhase !== "PLAYING") {
        initGame(); // Auto start for tests
    }
};