/**
 * game.js
 * Main entry point. Initializes p5 instance and main game loop.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, FPS, gameState, COLORS, Logger 
} from './globals.js';
import { handleKeyDown, handleKeyUp, clearInputBuffer, resetInputs } from './input.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { renderUI } from './ui.js';

// Setup p5 in instance mode
const sketch = (p) => {
    
    // Attach Logger to p for global access if needed, or just use the imported one.
    // The requirement says p.logs must exist.
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.randomSeed(42);
        
        // Ensure focus for keyboard
        p.canvas.setAttribute('tabindex', '0');
        p.canvas.focus();
        
        // Log start
        Logger.logGameInfo(p, { phase: "START", info: "Game Initialized" });
    };

    p.draw = function() {
        // Time management
        const now = Date.now();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Common Background
        p.background(COLORS.BACKGROUND);

        switch (gameState.gamePhase) {
            case "START":
                renderUI(p);
                checkStartInput(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                checkRestartInput(p);
                break;
        }
        
        // Clear input buffer at end of frame
        clearInputBuffer();
    };

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
        Logger.logInput(p, 'keydown', { keyCode: p.keyCode, key: p.key });
        
        // Global toggles
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
};

function checkStartInput(p) {
    // Check ENTER
    if (p.keyIsDown(13)) {
        startGame(p);
    }
}

function checkRestartInput(p) {
    // Check R
    if (p.keyIsDown(82)) {
        gameState.gamePhase = "START";
        resetInputs();
    }
}

function updateTheme() {
    // Change colors based on level index
    if (gameState.levelIndex === 0) {
        // Default Blue/Grey Theme
        COLORS.BACKGROUND = [30, 30, 40];
        COLORS.GROUND = [60, 60, 75];
        COLORS.GROUND_TOP = [80, 80, 100];
        COLORS.ENEMY_SLIME = [40, 40, 40];
        COLORS.ENEMY_FLYER = [60, 20, 60];
    } else {
        // Level 2+: Red/Magma Theme
        COLORS.BACKGROUND = [40, 10, 10];
        COLORS.GROUND = [80, 40, 30];
        COLORS.GROUND_TOP = [100, 60, 50];
        COLORS.ENEMY_SLIME = [120, 40, 40]; // Red Slime
        COLORS.ENEMY_FLYER = [150, 120, 20]; // Yellow Bat
    }
}

function startGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.levelIndex = 0;
    gameState.particles = [];
    gameState.projectiles = [];
    
    updateTheme();
    
    // Generate Level
    p.randomSeed(42); // Ensure consistent generation
    generateLevel(42);
    
    // Spawn Player
    gameState.player = new Player(50, 200);
    gameState.entities.push(gameState.player);
    
    // Init Camera
    gameState.cameraX = 0;
    
    Logger.logGameInfo(p, { phase: "PLAYING", info: "Level Started" });
}

function nextLevel(p) {
    gameState.levelIndex++;
    updateTheme();
    
    // Store player state
    const player = gameState.player;
    
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.pendingLevelChange = false;
    
    // Generate new level with different seed
    const newSeed = 42 + (gameState.levelIndex * 999);
    p.randomSeed(newSeed);
    generateLevel(newSeed);
    
    // Restore player
    gameState.player = player;
    gameState.entities.push(player);
    
    // Reset player pos
    player.x = 50;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    
    // Reset Camera
    gameState.cameraX = 0;
    
    Logger.logGameInfo(p, { phase: "PLAYING", info: `Level ${gameState.levelIndex} Started` });
}

function updateGame(p) {
    if (!gameState.player) return;

    // Check for level transition
    if (gameState.pendingLevelChange) {
        nextLevel(p);
        return;
    }

    // Update Entities
    // Filter active
    gameState.entities = gameState.entities.filter(e => e.active);
    gameState.projectiles = gameState.projectiles.filter(p => p.active);
    gameState.particles = gameState.particles.filter(pt => pt.active);

    // Update Loops
    gameState.player.update(p);
    gameState.entities.forEach(e => {
        if (e !== gameState.player) e.update(p);
    });
    
    // Update Projectiles (Fix for shooting)
    gameState.projectiles.forEach(proj => proj.update(p));
    
    gameState.particles.forEach(pt => pt.update());

    // Update Camera
    // Target is player x centered, clamped to world bounds
    let targetCamX = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
    // Clamp
    targetCamX = Math.max(0, Math.min(targetCamX, gameState.worldWidth - CANVAS_WIDTH));
    // Smooth lerp
    gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
    
    // Logging
    Logger.logPlayer(p, gameState.player);
}

function renderGame(p) {
    p.push();
    
    // Apply Camera
    let camX = -gameState.cameraX;
    let camY = 0;
    
    // Screen Shake
    if (gameState.cameraShake > 0) {
        camX += (Math.random() - 0.5) * gameState.cameraShake;
        camY += (Math.random() - 0.5) * gameState.cameraShake;
        gameState.cameraShake *= 0.9;
        if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
    }
    
    p.translate(camX, camY);

    // Draw Map
    // Optimization: only draw visible tiles
    const startCol = Math.floor(gameState.cameraX / 40);
    const endCol = startCol + (CANVAS_WIDTH / 40) + 1;
    
    p.noStroke();
    
    // Background decorations (Parallax pipes maybe?)
    p.fill(COLORS.BACKGROUND[0] + 10, COLORS.BACKGROUND[1] + 10, COLORS.BACKGROUND[2] + 10);
    for (let i = startCol; i <= endCol; i++) {
        if (i % 5 === 0) p.rect(i * 40 + 10, 0, 20, CANVAS_HEIGHT);
    }

    // Tiles
    gameState.tiles.forEach(tile => {
        if (tile.col >= startCol && tile.col <= endCol) {
            p.fill(COLORS.GROUND);
            p.rect(tile.x, tile.y, tile.width, tile.height);
            // Top highlight
            p.fill(COLORS.GROUND_TOP);
            p.rect(tile.x, tile.y, tile.width, 5);
        }
    });

    // Entities
    gameState.entities.forEach(e => e.render(p));
    
    // Projectiles (Fix for shooting)
    gameState.projectiles.forEach(proj => proj.render(p));
    
    // Particles
    gameState.particles.forEach(pt => pt.render(p));

    p.pop();
}

// Global hook for controls from HTML
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

// Start p5
window.gameInstance = new p5(sketch);