/**
 * game.js
 * Main entry point, game loop, and initialization.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE, logGameInfo } from './globals.js';
import { handleInput, handleKeyPress, setInitLevelCallback } from './input.js';
import { renderUI } from './ui.js';
import { createLevel } from './levels_data.js';
import { Player } from './entities.js';
import { ParticleSystem } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Setup p5 instance
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
        
        // Font setup if possible, otherwise default sans-serif
        p.textFont('sans-serif');
        
        gameState.particles = new ParticleSystem();
        
        // Initialize Logs
        logGameInfo(p, { event: "GAME_INIT" });
        
        // Setup Link
        setInitLevelCallback(startLevel);
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Clear Background
        p.background(PALETTE.background);
        
        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p); // Render frozen game
                renderUI(p);
                break;
            case "TRANSITION":
                // Simple fade or delay
                if (gameState.currentLevelIndex >= 3) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                } else {
                    startLevel(gameState.currentLevelIndex);
                    gameState.gamePhase = "PLAYING";
                }
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                break;
        }
        
        // Automated Testing Handling
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action();
            if (action) {
                // Simulate input
                if (action.keyCode) {
                    // Quick hack to simulate key press for one frame
                    p.keyCode = action.keyCode;
                    if (action.key) p.key = action.key;
                    
                    // Trigger handlers
                    if (action.key === 'z') {
                        handleKeyPress(p); // Trigger Once
                    } else {
                        // For movement (held keys), we manually invoke movement logic
                        // Because handleInput checks keyIsDown which relies on browser events
                        // We override this for testing
                        
                        // Fake keyIsDown
                        const originalKeyIsDown = p.keyIsDown;
                        p.keyIsDown = (code) => code === action.keyCode;
                        handleInput(p);
                        p.keyIsDown = originalKeyIsDown;
                    }
                }
            }
        } else if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "START") {
            // Auto start
            p.keyCode = 13;
            handleKeyPress(p);
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
    
    // Note: handleInput is called in draw() for continuous checks
});

function startLevel(index) {
    gameState.currentLevelIndex = index;
    gameState.level = createLevel(index);
    gameState.entities = [];
    gameState.particles = new ParticleSystem(); // Reset particles
    
    // Spawn Player
    gameState.player = new Player(
        gameState.level.startPos.x,
        gameState.level.startPos.y,
        gameState.level.startPos.z
    );
    gameState.entities.push(gameState.player);
    
    // Initial Graph Build
    gameState.level.update(); 
}

function updateGame(p) {
    // Update Level (Rotators)
    if (gameState.level) gameState.level.update();
    
    // Update Entities
    gameState.entities.forEach(e => e.update());
    
    // Update Particles
    if (gameState.particles) gameState.particles.update();
    
    // Handle Input (Continuous)
    if (gameState.controlMode === "HUMAN") {
        handleInput(p);
    }
    
    // Camera Follow
    if (gameState.player) {
        const targetPos = gridToScreen(gameState.player.x, gameState.player.y, gameState.player.z).x;
        // Just center X?
        // Let's implement simple centering
        // gameState.cameraOffset.x = lerp(gameState.cameraOffset.x, CANVAS_WIDTH/2 - targetPos.x, 0.1);
        // Actually, simple static offset for isometric is often better unless map is huge
        // Let's center on player
        
        const pScreen = gridToScreen(gameState.player.x, gameState.player.y, gameState.player.z);
        const desiredX = CANVAS_WIDTH / 2 - pScreen.x;
        const desiredY = CANVAS_HEIGHT / 2 - pScreen.y;
        
        gameState.cameraOffset.x = lerp(gameState.cameraOffset.x, desiredX, 0.05);
        gameState.cameraOffset.y = lerp(gameState.cameraOffset.y, desiredY, 0.05);
    }
}

// Helper to resolve imports for gridToScreen inside renderGame
// We import it at top, so it's fine.
import { gridToScreen } from './iso.js';
import { lerp } from './utils.js';

function renderGame(p) {
    p.push();
    // Sort all renderable objects by depth
    const renderList = [];
    
    if (gameState.level) {
        gameState.level.blocks.forEach(b => renderList.push(b));
    }
    gameState.entities.forEach(e => renderList.push(e));
    
    // Sort
    renderList.sort((a, b) => a.getSortDepth() - b.getSortDepth());
    
    // Render
    renderList.forEach(obj => {
        obj.render(p, gameState.cameraOffset.x, gameState.cameraOffset.y);
    });
    
    // Particles on top? Or depth sorted? 
    // Usually particles are semi-transparent and can be on top
    gameState.particles.render(p, gameState.cameraOffset.x, gameState.cameraOffset.y);
    
    p.pop();
}

// Global expose
window.gameInstance = gameInstance;

// Control Mode Setter (for HTML buttons)
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart if needed
    if (gameState.gamePhase !== "START") {
        gameState.gamePhase = "START";
    }
};