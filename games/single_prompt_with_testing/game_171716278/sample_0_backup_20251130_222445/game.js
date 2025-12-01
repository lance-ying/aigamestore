// game.js
// Main entry point

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, NIGHT_START_SPEED, NIGHT_ACCELERATION, SCORE_MULTIPLIER } from './globals.js';
import { Player, Coin, Particle } from './entities.js';
import { handleInput, handleKeyPress, handleKeyRelease } from './input.js';
import { renderUI, renderStartScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { renderBackground } from './background.js';
import { renderTerrain } from './terrain.js';
import { getTerrainHeight } from './math_utils.js';

const p5 = window.p5;

// Expose reset globally
window.resetGame = function(p) {
    gameState.entities = [];
    gameState.coins = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.nightX = -400;
    gameState.nightSpeed = NIGHT_START_SPEED;
    gameState.cameraX = 0;
    gameState.frameCount = 0;
    gameState.isDiving = false;
    
    // Create Player
    new Player(100, 200);
    
    // Generate initial coins
    generateCoins(p, 0, 2000);
    
    gameState.gamePhase = "START";
    
    // Clear logs
    if (p.logs) {
         p.logs.game_info = [];
         p.logs.inputs = [];
         p.logs.player_info = [];
    }
};

function generateCoins(p, startX, endX) {
    for (let x = startX; x < endX; x += 150) {
        // Randomly place coins in arcs
        if (p.random() > 0.5) {
            const y = getTerrainHeight(p, x) - 50 - p.random(100);
            gameState.coins.push(new Coin(x, y));
            gameState.entities.push(gameState.coins[gameState.coins.length-1]);
        }
    }
}

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
        
        window.resetGame(p);
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        
        // Handle Input
        handleInput(p);
        
        // Update Logic based on phase
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        }
        
        // Rendering
        p.background(135, 206, 235); // Fallback
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else {
            renderGame(p);
            
            if (gameState.gamePhase === "PAUSED") {
                renderPausedScreen(p);
            } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
                renderGameOverScreen(p);
            }
        }
        
        renderUI(p);
        
        // Logging
        if (p.frameCount % 60 === 0 && gameState.player) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                vx: gameState.player.vx,
                vy: gameState.player.vy,
                score: gameState.score,
                frame: p.frameCount
            });
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

function updateGame(p) {
    const player = gameState.player;
    
    // Update Night
    gameState.nightSpeed += NIGHT_ACCELERATION;
    gameState.nightX += gameState.nightSpeed;
    
    // Prevent night from passing player too easily at start
    if (gameState.nightX < player.x - 500) gameState.nightX = player.x - 500;
    
    // Update Entities
    gameState.entities.forEach(e => e.update(p));
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead()) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Remove collected coins
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
        if (gameState.coins[i].collected) {
            const idx = gameState.entities.indexOf(gameState.coins[i]);
            if (idx > -1) gameState.entities.splice(idx, 1);
            gameState.coins.splice(i, 1);
        }
    }
    
    // Generate new coins as we move
    const lookAhead = gameState.cameraX + CANVAS_WIDTH + 1000;
    const lastCoinX = gameState.coins.length > 0 ? gameState.coins[gameState.coins.length-1].x : 0;
    if (lastCoinX < lookAhead) {
        generateCoins(p, lastCoinX + 150, lookAhead);
    }
    
    // Cleanup old entities
    if (gameState.coins.length > 0 && gameState.coins[0].x < gameState.cameraX - 200) {
        const c = gameState.coins.shift();
        const idx = gameState.entities.indexOf(c);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }
    
    // Update Camera
    // Camera follows player smoothly
    const targetCamX = player.x - CANVAS_WIDTH * 0.3;
    gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
    // Don't go backwards
    // gameState.cameraX = Math.max(gameState.cameraX, targetCamX); 
    
    // Update Score
    if (player.vx > 0) {
        gameState.score += player.vx * SCORE_MULTIPLIER;
    }
}

function renderGame(p) {
    renderBackground(p);
    
    p.push();
    // Camera Transform
    // We only translate X for side scrolling. Y is usually fixed unless player goes super high
    let camY = 0;
    if (gameState.player && gameState.player.y < 100) {
        camY = 100 - gameState.player.y; // Pan up
        if (camY > 200) camY = 200; // Cap
    }
    
    p.translate(-gameState.cameraX, camY);
    
    renderTerrain(p);
    
    // Entities
    gameState.coins.forEach(c => c.render(p));
    gameState.player.render(p);
    gameState.particles.forEach(pt => pt.render(p));
    
    p.pop();
}

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};