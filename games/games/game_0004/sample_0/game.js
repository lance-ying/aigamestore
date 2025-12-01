// game.js
import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleInput, updateKeyState, KEYS } from './input.js';
import { Player, Platform, Collectible, Hazard } from './entities.js';
import { renderStartScreen, renderHUD, renderPaused, renderGameOver } from './ui.js';
import { Particle } from './particles.js';

// Setup p5 instance
const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        // Initial log
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update time
        let now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        p.background(20, 20, 30); // Dark background
        
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
                renderGame(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        updateKeyState(p.keyCode, true, p);
        
        if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
            startNewGame(p);
            gameState.gamePhase = "PLAYING";
        }
        if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        if (p.keyCode === KEYS.R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            gameState.gamePhase = "START";
        }
    };

    p.keyReleased = function() {
        updateKeyState(p.keyCode, false, p);
    };
});

function startNewGame(p) {
    resetGameState();
    
    // Create Level
    // Ground
    gameState.platforms.push(new Platform(-100, 350, 600, 50, 'grass')); // Start area
    
    // Gap then platform
    gameState.platforms.push(new Platform(600, 320, 400, 50, 'wood'));
    
    // High platform requiring puff/jump
    gameState.platforms.push(new Platform(1100, 200, 200, 20, 'metal'));
    
    // Long stretch with obstacles
    gameState.platforms.push(new Platform(1300, 350, 1000, 50, 'grass'));
    
    // Obstacles on the long stretch
    gameState.platforms.push(new Platform(1500, 300, 50, 50, 'wood')); // Box
    gameState.platforms.push(new Platform(1700, 250, 50, 100, 'wood')); // Tall box
    
    // Floating islands
    gameState.platforms.push(new Platform(2400, 300, 150, 20, 'metal'));
    gameState.platforms.push(new Platform(2650, 250, 150, 20, 'metal'));
    gameState.platforms.push(new Platform(2900, 200, 150, 20, 'metal'));
    
    // Final ground
    gameState.platforms.push(new Platform(3200, 350, 800, 50, 'grass'));

    // Hazards
    gameState.hazards.push(new Hazard(1600, 335, 'spike'));
    gameState.hazards.push(new Hazard(2000, 335, 'spike'));
    gameState.hazards.push(new Hazard(2050, 335, 'spike'));
    
    // Collectibles
    for (let i = 0; i < 20; i++) {
        let x = 300 + i * 150;
        // Simple variation in Y
        let y = 280 - Math.sin(i) * 100;
        gameState.collectibles.push(new Collectible(x, y));
    }
    
    // Goal visual (Just a text or zone in render, logical check is in player update)
    
    // Spawn Player
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
}

function updateGame(p) {
    // Update entities
    if (gameState.player) gameState.player.update(p);
    
    gameState.particles.forEach((part, i) => {
        part.update();
        if (part.isDead()) gameState.particles.splice(i, 1);
    });
    
    // Camera Logic
    if (gameState.player) {
        // Camera follows player X, with some lookahead
        let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3;
        // Smooth camera Y loosely
        let targetCamY = gameState.player.y - CANVAS_HEIGHT * 0.6;
        
        // Clamp camera
        targetCamX = p.constrain(targetCamX, 0, gameState.worldWidth - CANVAS_WIDTH);
        targetCamY = p.constrain(targetCamY, -200, gameState.worldHeight - CANVAS_HEIGHT); // Allow looking up slightly
        
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
    }
}

function renderGame(p) {
    p.push();
    
    // Draw Background Parallax
    drawBackground(p);
    
    // Apply Camera Transform
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Render World
    gameState.platforms.forEach(plat => plat.render(p));
    gameState.collectibles.forEach(col => col.render(p));
    gameState.hazards.forEach(haz => haz.render(p));
    
    // Render Goal
    p.fill(255, 255, 0, 100);
    p.noStroke();
    p.rect(gameState.worldWidth - 150, 0, 150, 800);
    
    // Render Player
    if (gameState.player) gameState.player.render(p);
    
    // Render Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

function drawBackground(p) {
    // Sky gradient
    // p.background(20, 20, 30) called at start of draw
    
    // Distant mountains/gears parallax
    p.push();
    let parallaxX = gameState.cameraX * 0.2;
    
    p.fill(40, 50, 60);
    p.noStroke();
    
    // Draw some shapes
    for (let i = 0; i < 10; i++) {
        let x = (i * 400) - (parallaxX % 400);
        p.triangle(x, 400, x + 200, 150, x + 400, 400);
    }
    
    // Closer layer
    parallaxX = gameState.cameraX * 0.5;
    p.fill(30, 40, 50);
    for (let i = 0; i < 15; i++) {
        let x = (i * 300) - (parallaxX % 300);
        p.rect(x, 300, 100, 100); // Simple buildings/structures
    }
    p.pop();
}

// Global hook for controls
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};