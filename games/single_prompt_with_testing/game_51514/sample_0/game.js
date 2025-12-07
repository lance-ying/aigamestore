/**
 * game.js
 * Main entry point. Sets up p5.js instance, game loop, and initialization.
 */

import { 
    gameState, resetGameState, getGameState,
    CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT 
} from './globals.js';
import { handleKeyPressed, handleKeyReleased, updateInput } from './input.js';
import { 
    Player, Platform, Enemy, Collectible, Portal, Projectile 
} from './entities.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOver } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Get p5 from global scope (loaded via script tag)
const p5 = window.p5;

let gameInstance = new p5(p => {
    
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
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Handle Game Phases
        if (gameState.shouldRebuild) {
            setupLevel(p);
            gameState.shouldRebuild = false;
        }

        // Handle Automated Testing Inputs
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            get_automated_testing_action(gameState);
        }

        // Render Background
        p.background(20, 20, 30);
        
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
                renderGame(p); // Draw game frozen in background
                renderPauseScreen(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

/**
 * Main Game Update Loop
 */
function updateGame(p) {
    if (!gameState.player) {
        setupLevel(p);
    }
    
    // 1. Update Player
    if (gameState.player) {
        gameState.player.update(p);
    }
    
    // 2. Update Entities
    // We iterate backwards to allow safe removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        if (!ent.active) {
            gameState.entities.splice(i, 1);
            continue;
        }
        
        // Skip player in generic update if already updated
        if (ent === gameState.player) continue;
        
        ent.update(p);
    }
    
    // 3. Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

/**
 * Main Game Render Loop
 */
function renderGame(p) {
    p.push();
    
    // Camera Transform
    p.translate(-gameState.camera.x, -gameState.camera.y);
    
    // Draw Parallax Background (Stars/Grid)
    drawBackground(p);
    
    // Render Platforms
    for (let plat of gameState.platforms) {
        // Cull offscreen
        if (isOnScreen(plat)) plat.render(p);
    }
    
    // Render Enemies & Collectibles & Projectiles
    // Filter generic entities list for rendering order if needed, but simple iteration is fine for this 2D
    // Ideally: Platforms -> Collectibles -> Enemies -> Player -> Projectiles -> Effects
    
    // Sort logic or multiple passes:
    
    // 1. Collectibles
    gameState.collectibles.forEach(c => { if(c.active && isOnScreen(c)) c.render(p); });
    
    // 2. Enemies
    gameState.enemies.forEach(e => { if(e.active && isOnScreen(e)) e.render(p); });
    
    // 3. Player
    if (gameState.player) gameState.player.render(p);
    
    // 4. Projectiles
    gameState.projectiles.forEach(pr => { if(pr.active && isOnScreen(pr)) pr.render(p); });
    
    // 5. Particles
    gameState.particles.forEach(pt => { 
        // Simple culling
        if (pt.x > gameState.camera.x && pt.x < gameState.camera.x + CANVAS_WIDTH) pt.render(p); 
    });
    
    // 6. Portal
    if (gameState.goal && isOnScreen(gameState.goal)) gameState.goal.render(p);
    
    p.pop();
}

/**
 * Initializes the Level.
 * Creates platforms, enemies, player, etc.
 */
function setupLevel(p) {
    // Reset Entity Lists
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Create Player
    gameState.player = new Player(50, 200);
    gameState.entities.push(gameState.player);
    
    // Ground Generation
    createPlatform(0, 350, 600, 50); // Start zone
    createPlatform(700, 350, 300, 50); // Gap jump
    createPlatform(1100, 300, 400, 50); // Higher ground
    createPlatform(1600, 350, 400, 50); // Down again
    createPlatform(2100, 350, 900, 50); // Final stretch
    
    // Floating Platforms
    createPlatform(300, 250, 100, 20);
    createPlatform(500, 200, 100, 20);
    createPlatform(900, 200, 100, 20); // High jump
    createPlatform(1300, 180, 100, 20);
    
    // Walls and Obstacles
    createPlatform(600, 250, 20, 100); // Wall
    createPlatform(1500, 200, 20, 150, "PHASABLE"); // Phase wall
    createPlatform(1900, 150, 20, 200, "PHASABLE"); // Tall Phase wall
    
    // Enemies
    createEnemy(400, 320, "PATROLLER");
    createEnemy(1200, 270, "PATROLLER");
    createEnemy(1700, 320, "SEEKER");
    createEnemy(2200, 250, "SEEKER");
    
    // Collectibles
    createCollectible(350, 200);
    createCollectible(550, 150);
    createCollectible(1350, 140);
    createCollectible(1800, 300);
    createCollectible(2500, 300);
    
    // Goal
    gameState.goal = new Portal(2800, 290);
    gameState.entities.push(gameState.goal); // Add to entities for generic updates if needed
}

function createPlatform(x, y, w, h, type="SOLID") {
    let p = new Platform(x, y, w, h, type);
    gameState.platforms.push(p);
    gameState.entities.push(p);
}

function createEnemy(x, y, type) {
    let e = new Enemy(x, y, type);
    gameState.enemies.push(e);
    gameState.entities.push(e);
}

function createCollectible(x, y) {
    let c = new Collectible(x, y);
    gameState.collectibles.push(c);
    gameState.entities.push(c);
}

/**
 * Culling Helper
 */
function isOnScreen(entity) {
    return (
        entity.x + entity.width > gameState.camera.x &&
        entity.x < gameState.camera.x + CANVAS_WIDTH &&
        entity.y + entity.height > gameState.camera.y &&
        entity.y < gameState.camera.y + CANVAS_HEIGHT
    );
}

/**
 * Background Effect
 */
function drawBackground(p) {
    p.push();
    p.stroke(255, 50);
    p.strokeWeight(1);
    
    // Determine grid offset based on camera to create parallax or fixed grid
    // Fixed grid relative to world
    let startX = Math.floor(gameState.camera.x / 100) * 100;
    let startY = Math.floor(gameState.camera.y / 100) * 100;
    
    for (let x = startX; x < startX + CANVAS_WIDTH + 100; x += 100) {
        p.line(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = startY; y < startY + CANVAS_HEIGHT + 100; y += 100) {
        p.line(0, y, WORLD_WIDTH, y);
    }
    
    // Distant stars
    p.randomSeed(100); // Fixed stars
    for (let i = 0; i < 50; i++) {
        let sx = p.random(WORLD_WIDTH);
        let sy = p.random(WORLD_HEIGHT);
        p.point(sx, sy);
    }
    p.randomSeed(gameState.frameCount); // Restore random for other things
    p.pop();
}

// Global hook for controls
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};

// Expose game instance
window.gameInstance = gameInstance;