/**
 * Main Game Entry Point.
 * Sets up the p5 instance, game loop, and global state management.
 */

import { 
    gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT, 
    getGameState 
} from './globals.js';
import { Player } from './entities.js';
import { handleKeyPressed, handleKeyReleased, KEYS } from './input.js';
import { renderStartScreen, renderUI, renderGameOver, renderPaused } from './ui.js';
import { initLevel, updateLevelGen } from './level.js';
import { renderBackground } from './background.js';
import { get_automated_testing_action } from './automated_test.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Expose control mode setter for HTML buttons
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // Reset focus to canvas if needed
        };
        
        // Initial Log
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

        // --- PHASE HANDLING ---
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
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
        
        // --- INPUT HANDLING (Automated) ---
        handleAutomatedInput(p);
        
        // --- RESTART LOGIC ---
        if (gameState.requestRestart) {
            resetGame();
            gameState.requestRestart = false;
            gameState.gamePhase = "START";
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

function resetGame() {
    gameState.reset();
    initLevel();
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
}

function updateGame(p) {
    // If first time entering playing state
    if (!gameState.player) {
        resetGame();
    }

    // 1. Level Generation
    updateLevelGen(p);

    // 2. Update Entities
    // Player
    gameState.player.update(p);
    
    // Others
    gameState.enemies.forEach(e => e.update(p));
    gameState.collectibles.forEach(c => c.update(p));
    gameState.particles.forEach(pt => pt.update(p));
    
    // 3. Cleanup Dead Entities
    gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
    gameState.collectibles = gameState.collectibles.filter(c => !c.markedForDeletion);
    gameState.particles = gameState.particles.filter(pt => !pt.isDead());
    
    // 4. Update Camera (Follow Player X)
    // Keep player at 1/3rd of screen approx
    const targetCamX = gameState.player.x - 150;
    // Smooth Lerp or direct lock for runner?
    // Direct lock is better for runner to prevent player outrunning screen
    gameState.cameraX = Math.max(0, targetCamX); 
    
    gameState.distanceTraveled = Math.max(gameState.distanceTraveled, gameState.player.x);
}

function renderGame(p) {
    // 1. Background
    renderBackground(p);
    
    // 2. World Elements
    // Sort logic not strictly needed if arrays separated, but platforms behind entities is good
    gameState.platforms.forEach(pl => pl.render(p));
    
    gameState.collectibles.forEach(c => c.render(p));
    gameState.enemies.forEach(e => e.render(p));
    
    if (gameState.player) gameState.player.render(p);
    
    // 3. FX
    gameState.particles.forEach(pt => pt.render(p));
}

function handleAutomatedInput(p) {
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
        const action = get_automated_testing_action();
        if (action) {
            // Simulate press
            p.keyCode = action.keyCode;
            handleKeyPressed(p);
            
            // Release immediately next frame effectively (for tap actions)
            // Or for movement, we need sustained.
            // The automated logic is polled every frame.
            // If the logic returns same key, we keep it pressed?
            // The current input handler adds to 'keys' map on press.
            // We need a way to release keys if the bot stops requesting them.
            
            // NOTE: The automated_test.js is simple. Real simulation would need stateful key management.
            // For this implementation, we just trigger the 'pressed' logic. 
            // Continuous movement requires the bot to return the key every frame.
            
            // Hacky Reset for bot:
            // In next frame, if bot doesn't request it, we should release it.
            // But p5 keyReleased is event based.
            // We'll trust the bot sends key every frame it wants held.
            // We can auto-release keys not requested?
            // Simplification: Just trigger the action function directly.
            
            if (action.keyCode === KEYS.RIGHT) gameState.player.vx += 1; // Direct influence for smoother bot
        }
    }
}

// Expose instance
window.gameInstance = gameInstance;