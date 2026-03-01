/**
 * game.js
 * Main game loop, initialization, and render orchestration.
 */

import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_HEIGHT, WORLD_WIDTH } from './globals.js';
import { Player } from './entities.js';
import { handleKeyDown, handleKeyUp, updateInputState } from './input.js';
import { generateLevel } from './level_gen.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPaused } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Logs initialization (Write-only)
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        p.noSmooth(); // Retro pixel feel
        
        resetGameState();
        
        // Log start
        p.logs.game_info.push({
            event: "Setup Complete",
            timestamp: Date.now()
        });
    };

    function initGame() {
        resetGameState();
        gameState.gamePhase = "PLAYING";
        
        // Generate World
        generateLevel(p);
        
        // Create Player at bottom
        gameState.player = new Player(WORLD_WIDTH/2, WORLD_HEIGHT - 60);
        gameState.entities.push(gameState.player);
        
        gameState.cameraY = WORLD_HEIGHT - CANVAS_HEIGHT;
    }

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Input processing
        updateInputState();
        
        // Handle RESETTING phase trigger from input
        if (gameState.gamePhase === "RESETTING") {
            resetGameState();
        }
        
        // Start Game Transition
        if (gameState.gamePhase === "PLAYING" && !gameState.player) {
            initGame();
        }

        p.background(20, 20, 30);

        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            
            // --- UPDATE LOOP ---
            if (gameState.gamePhase === "PLAYING") {
                // Update Entities
                // 1. Player
                if (gameState.player) gameState.player.update(p);
                
                // 2. Enemies
                gameState.enemies.forEach(e => { if(e.active) e.update(p); });
                
                // 3. Projectiles
                gameState.projectiles.forEach(proj => { if(proj.active) proj.update(p); });
                
                // 4. Collectibles
                gameState.collectibles.forEach(c => { if(c.active) c.update(p); });
                
                // 5. Particles
                for (let i = gameState.particles.length - 1; i >= 0; i--) {
                    let part = gameState.particles[i];
                    part.update();
                    if (part.life <= 0) gameState.particles.splice(i, 1);
                }
                
                // Cleanup inactive entities
                gameState.enemies = gameState.enemies.filter(e => e.active);
                gameState.projectiles = gameState.projectiles.filter(p => p.active);
                gameState.collectibles = gameState.collectibles.filter(c => c.active);
                
                // Camera Follow
                if (gameState.player) {
                    const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
                    // Lerp camera
                    gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
                    
                    // Clamp camera
                    if (gameState.cameraY < 0) gameState.cameraY = 0;
                    if (gameState.cameraY > WORLD_HEIGHT - CANVAS_HEIGHT) gameState.cameraY = WORLD_HEIGHT - CANVAS_HEIGHT;
                }
                
                // Camera Shake Decay
                if (gameState.cameraShake > 0) {
                    gameState.cameraShake *= 0.9;
                    if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
                }
            }

            // --- RENDER LOOP ---
            p.push();
            
            // Apply Camera Transform
            let shakeX = (Math.random() - 0.5) * gameState.cameraShake;
            let shakeY = (Math.random() - 0.5) * gameState.cameraShake;
            p.translate(-gameState.cameraX + shakeX, -gameState.cameraY + shakeY);
            
            // Draw Background (Parallax placeholder: simple grid)
            drawBackground(p);
            
            // Draw Platforms
            gameState.platforms.forEach(plat => plat.render(p));
            
            // Draw Collectibles
            gameState.collectibles.forEach(c => c.render(p));
            
            // Draw Enemies
            gameState.enemies.forEach(e => e.render(p));
            
            // Draw Player
            if (gameState.player) gameState.player.render(p);
            
            // Draw Projectiles
            gameState.projectiles.forEach(proj => proj.render(p));
            
            // Draw Particles
            gameState.particles.forEach(part => part.render(p));
            
            p.pop(); // End Camera
            
            // UI Overlay
            renderHUD(p);
            
            if (gameState.gamePhase === "PAUSED") renderPaused(p);
            if (gameState.gamePhase.startsWith("GAME_OVER")) renderGameOver(p);
        }
    };

    function drawBackground(p) {
        // Draw some static tower bricks in background
        p.stroke(30, 30, 40);
        p.strokeWeight(2);
        
        // Optimize: only draw visible range
        const startY = Math.floor(gameState.cameraY / 100) * 100;
        const endY = startY + CANVAS_HEIGHT + 100;
        
        for (let y = startY; y < endY; y += 100) {
            p.line(0, y, WORLD_WIDTH, y);
            for (let x = 0; x < WORLD_WIDTH; x += 100) {
                if ((y/100) % 2 === 0) p.line(x, y, x, y + 100);
                else p.line(x + 50, y, x + 50, y + 100);
            }
        }
    }

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

// Control Mode switching for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    
    // Update button visuals
    document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
        if(btn.id.includes(mode)) btn.classList.add('active'); // loose match
    });
    
    // Fix for button ID matching
    if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
};