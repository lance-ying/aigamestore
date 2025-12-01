// game.js
// Main Game Loop and Entry Point

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { handleKeyPress, handleKeyRelease, resetGame } from './input.js';
import { loadLevel } from './level.js';
import { renderStartScreen, renderUI, renderGameOver, renderPaused } from './ui.js';

// Import p5 via window object (since it's loaded via script tag)
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
        
        // Initial log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Initialize Level logic is deferred to start
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        p.background(20, 30, 40); // Dark blue-ish background
        
        // Phase Management
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
            // Reset level if just entered? handled by LoadLevel on transition
        } else if (gameState.gamePhase === "PLAYING") {
            // Check if we need to load level (first frame of playing)
            if (!gameState.player) {
                loadLevel();
            }
            
            updateGame(p);
            renderGame(p);
            renderUI(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderGame(p);
            renderUI(p);
            renderPaused(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p);
            renderGameOver(p);
        }
    };
    
    p.keyPressed = function() {
        // Handle global reset here for simplicity if R is pressed in End screens
        if (p.keyCode === 82) { // R
             resetGame(p);
             gameState.player = null; // Force reload level next play
             // Also need to clear logs? No constraints say write-only.
             p.logs.game_info.push({
                data: { action: "RESTART" },
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        handleKeyPress(p);
    };
    
    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

function updateGame(p) {
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead()) {
            gameState.particles.splice(i, 1);
        }
    }

    // Update Player
    if (gameState.player) {
        gameState.player.update(p);
        
        // Camera Follow
        // Target x is player x minus half screen
        let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.4;
        let targetCamY = gameState.player.y - CANVAS_HEIGHT * 0.6;
        
        // Clamp Target
        targetCamX = Math.max(0, Math.min(targetCamX, WORLD_WIDTH - CANVAS_WIDTH));
        targetCamY = Math.max(0, Math.min(targetCamY, WORLD_HEIGHT - CANVAS_HEIGHT));
        
        // Lerp
        gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
        gameState.cameraY += (targetCamY - gameState.cameraY) * 0.1;
    }
    
    // Update Collectibles
    gameState.collectibles.forEach(c => c.update(p));
    
    // Update Hazards
    gameState.hazards.forEach(h => h.update(p));
    
    // Update Exit
    if (gameState.exitDoor) gameState.exitDoor.update(p);
}

function renderGame(p) {
    p.push();
    // Camera Transform
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw Background Elements (Parallax?)
    drawBackground(p);
    
    // Draw Platforms
    gameState.platforms.forEach(plat => plat.render(p));
    
    // Draw Exit
    if (gameState.exitDoor) gameState.exitDoor.render(p);
    
    // Draw Hazards
    gameState.hazards.forEach(h => h.render(p));
    
    // Draw Collectibles
    gameState.collectibles.forEach(c => c.render(p));
    
    // Draw Player
    if (gameState.player) gameState.player.render(p);
    
    // Draw Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

function drawBackground(p) {
    // Simple parallax decoration
    // Far back mountains
    p.push();
    p.noStroke();
    
    // Mountains move slower (0.2 parallax)
    const paraX = gameState.cameraX * 0.2;
    p.fill(30, 40, 50);
    p.beginShape();
    p.vertex(0 + paraX, WORLD_HEIGHT);
    p.vertex(0 + paraX, 200);
    p.vertex(300 + paraX, 100);
    p.vertex(600 + paraX, 250);
    p.vertex(900 + paraX, 150);
    p.vertex(1200 + paraX, 300);
    p.vertex(1500 + paraX, 100);
    p.vertex(WORLD_WIDTH + paraX, 200);
    p.vertex(WORLD_WIDTH + paraX, WORLD_HEIGHT);
    p.endShape(p.CLOSE);
    
    p.pop();
}

// Window Global
window.gameInstance = gameInstance;

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
    
    // Update button visual state
    const buttons = document.querySelectorAll('.control-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
    if (mode === 'TEST_3') document.getElementById('test_3_ModeBtn') && document.getElementById('test_3_ModeBtn').classList.add('active');
};