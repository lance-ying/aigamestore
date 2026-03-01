/**
 * Cavern Tale - Main Game Loop
 * Initializes p5.js instance, manages gameloop, and coordinates rendering.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS, PALETTE } from './globals.js';
import { handleKeyDown, handleKeyUp } from './input.js';
import { Level } from './level.js';
import { renderHUD, renderStartScreen, renderPauseScreen, renderGameOverScreen } from './ui.js';
import { Player } from './entities.js';

// Setup p5 in instance mode
const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    // --- SETUP ---
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.noSmooth(); // Pixel art style
        
        // Seeding
        p.randomSeed(42);
        
        // Initialize Game State
        window.getGameState().gamePhase = "START";
        
        // Log start
        p.logs.game_info.push({
            event: "INITIALIZED",
            timestamp: Date.now()
        });
    };

    // --- MAIN DRAW LOOP ---
    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Clear background
        p.background(PALETTE.BACKGROUND);
        
        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Render frozen game state
                renderHUD(p);
                renderPauseScreen(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOverScreen(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOverScreen(p, false);
                break;
        }
    };

    // --- INPUTS ---
    p.keyPressed = function() {
        handleKeyDown(p.keyCode, p);
    };

    p.keyReleased = function() {
        handleKeyUp(p.keyCode, p);
    };
    
    // --- HELPER METHODS ---
    p.resetGame = function() {
        gameState.reset();
        gameState.gamePhase = "START";
        // Re-init level
        gameState.level = new Level();
    };
    
    // Expose reset for input handler
    window.gameInstance = p;
});

// --- GAME LOGIC ---

function updateGame(p) {
    // 1. Initialize Level if needed (lazy load)
    if (!gameState.level) {
        gameState.level = new Level();
    }
    
    // 2. Update Entities
    // We use a backwards loop for safe removal or filter approach. 
    // Filter approach is cleaner for readability.
    
    // Projectiles
    gameState.projectiles = gameState.projectiles.filter(e => e.active);
    gameState.projectiles.forEach(e => e.update(p));
    
    // Enemies
    gameState.enemies = gameState.enemies.filter(e => e.active);
    gameState.enemies.forEach(e => e.update(p));
    
    // Collectibles
    gameState.collectibles = gameState.collectibles.filter(e => e.active);
    gameState.collectibles.forEach(e => e.update(p));
    
    // Player
    if (gameState.player && gameState.player.active) {
        gameState.player.update(p);
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                hp: gameState.player.health,
                lvl: gameState.player.weaponLevel,
                frame: p.frameCount
            });
        }
    }
    
    // Particles & Text
    gameState.particles.forEach(e => e.update());
    gameState.particles = gameState.particles.filter(e => !e.dead);
    
    gameState.floatingTexts.forEach(e => e.update());
    gameState.floatingTexts = gameState.floatingTexts.filter(e => !e.dead);
    
    // 3. Camera System
    updateCamera();
}

function updateCamera() {
    if (!gameState.player) return;
    
    // Center camera on player
    let targetX = gameState.player.x - CANVAS_WIDTH / 2;
    let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Smooth lerp
    gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
    gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
    
    // Clamp to level bounds
    if (gameState.level) {
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.level.widthPx - CANVAS_WIDTH));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.level.heightPx - CANVAS_HEIGHT));
    }
}

function renderGame(p) {
    if (!gameState.level) return;
    
    p.push();
    // Apply Camera Transform
    p.translate(-Math.floor(gameState.camera.x), -Math.floor(gameState.camera.y));
    
    // 1. Level
    gameState.level.render(p, gameState.camera);
    
    // 2. Collectibles
    gameState.collectibles.forEach(e => e.render(p));
    
    // 3. Enemies
    gameState.enemies.forEach(e => e.render(p));
    
    // 4. Player
    if (gameState.player && gameState.player.active) {
        gameState.player.render(p);
    }
    
    // 5. Projectiles
    gameState.projectiles.forEach(e => e.render(p));
    
    // 6. Effects
    gameState.particles.forEach(e => e.render(p));
    gameState.floatingTexts.forEach(e => e.render(p));
    
    p.pop();
}

// Global control mode setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If switching to test, ensure game is running or resets if needed
    if (mode.startsWith("TEST") && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
};