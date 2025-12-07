/**
 * game.js
 * Main entry point. Sets up p5 instance, game loop, and integrates all systems.
 */

import { gameState, resetGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { handleInput, handleInputRelease, KEYS } from './input.js';
import { resolvePlatformCollision, checkPlayerHazard } from './physics.js';
import { levelManager } from './levels.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused, renderLevelComplete } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Get p5 from window (loaded via script tag)
const p5 = window.p5;

// Main Game Instance
let gameInstance = new p5(p => {

    // Logging Object (Write-only)
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize State
        resetGameState();
        
        // Setup Control Mode Handler
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log(`Control Mode set to: ${mode}`);
            // Reset buttons visual state
            document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
            if(mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
            if(mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
            if(mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
        };
        
        p.logs.game_info.push({ event: "SETUP_COMPLETE", timestamp: Date.now() });
    };

    p.draw = function() {
        // 1. Time Management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // 2. Automated Input Injection
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const actions = get_automated_testing_action(gameState);
            if (actions) {
                // Clear previous keys for clean simulation
                gameState.keys = {}; 
                // Apply new keys
                actions.forEach(action => {
                    gameState.keys[action.keyCode] = true;
                });
            } else if (gameState.gamePhase === "START" || gameState.gamePhase === "LEVEL_COMPLETE") {
                // Auto-advance menus
                if (p.frameCount % 60 === 0) gameState.keys[KEYS.ENTER] = true;
                else gameState.keys[KEYS.ENTER] = false;
            }
        }

        // 3. Game Logic Update
        updateGameLogic(p);

        // 4. Render
        renderGame(p);
    };

    // ===========================================
    // Input Handlers
    // ===========================================
    p.keyPressed = function() {
        if (gameState.controlMode === "HUMAN") {
            handleInput(p);
        }
    };

    p.keyReleased = function() {
        if (gameState.controlMode === "HUMAN") {
            handleInputRelease(p);
        }
    };

    // ===========================================
    // Update Logic
    // ===========================================
    function updateGameLogic(p) {
        
        // Handle Global Resets
        if (gameState.requestReset) {
            resetGameState();
            gameState.requestReset = false;
        }
        
        if (gameState.requestNextLevel) {
            levelManager.loadLevel(gameState.level + 1);
            gameState.gamePhase = "PLAYING";
            gameState.requestNextLevel = false;
        }

        if (gameState.gamePhase === "PLAYING") {
            
            // Check if level needs to be loaded (first run)
            if (!gameState.player) {
                levelManager.loadLevel(1);
            }
            
            // Update Player
            if (gameState.player) {
                gameState.player.update(p);
                
                // Physics & Collisions
                gameState.platforms.forEach(platform => {
                    resolvePlatformCollision(gameState.player, platform);
                });
                
                gameState.hazards.forEach(hazard => {
                    hazard.update(p);
                    if (checkPlayerHazard(gameState.player, hazard)) {
                        gameState.player.takeDamage(1);
                    }
                });
                
                gameState.enemies.forEach(enemy => {
                    enemy.update(p);
                });
                
                // Collectibles cleanup
                for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
                    let c = gameState.collectibles[i];
                    c.update(p);
                    if (c.markedForDeletion) gameState.collectibles.splice(i, 1);
                }
                
                if (gameState.portal) gameState.portal.update(p);
                
                // Camera Follow
                // Center player, but clamp to level start (0)
                // We assume infinite right scroll, but level based
                const targetCamX = gameState.player.x - CANVAS_WIDTH / 3;
                gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
                // Clamp cameraY slightly if we want vertical scrolling, 
                // but usually fixed for this genre unless level is tall.
                // Let's keep Y fixed for now unless player goes way up/down.
            }
            
            // Particles
            for (let i = gameState.particles.length - 1; i >= 0; i--) {
                let pt = gameState.particles[i];
                pt.update();
                if (pt.dead) gameState.particles.splice(i, 1);
            }
            
            // Screen Shake Decay
            if (gameState.shakeTimer > 0) gameState.shakeTimer--;
            
            // Logging
            if (gameState.frameCount % 60 === 0 && gameState.player) {
                p.logs.player_info.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    health: gameState.player.health,
                    score: gameState.score,
                    frame: gameState.frameCount
                });
            }
        }
    }

    // ===========================================
    // Render Logic
    // ===========================================
    function renderGame(p) {
        // Screen Shake Offset
        let shakeX = 0;
        let shakeY = 0;
        if (gameState.shakeTimer > 0) {
            shakeX = p.random(-gameState.shakeMagnitude, gameState.shakeMagnitude);
            shakeY = p.random(-gameState.shakeMagnitude, gameState.shakeMagnitude);
        }
        
        p.push();
        p.translate(shakeX, shakeY);
        
        // Background
        p.background(COLORS.BACKGROUND);
        
        // Draw Scrolling Grid (Parallax effect)
        drawBackgroundGrid(p);
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else {
            // Render Entities
            // Order: Portal (back), Platforms, Hazards, Collectibles, Enemies, Player, Particles
            
            if (gameState.portal) gameState.portal.render(p);
            
            gameState.platforms.forEach(e => e.render(p));
            gameState.hazards.forEach(e => e.render(p));
            gameState.collectibles.forEach(e => e.render(p));
            gameState.enemies.forEach(e => e.render(p));
            
            if (gameState.player) gameState.player.render(p);
            
            gameState.particles.forEach(e => e.render(p));
            
            // UI Overlays
            renderHUD(p);
            
            if (gameState.gamePhase === "PAUSED") renderPaused(p);
            if (gameState.gamePhase === "LEVEL_COMPLETE") renderLevelComplete(p);
            if (gameState.gamePhase === "GAME_OVER_WIN") renderGameOver(p, true);
            if (gameState.gamePhase === "GAME_OVER_LOSE") renderGameOver(p, false);
        }
        
        p.pop();
    }
    
    function drawBackgroundGrid(p) {
        p.stroke(20, 30, 40);
        p.strokeWeight(1);
        
        const gridSize = 50;
        // Calculate offset based on camera
        const offsetX = gameState.cameraX % gridSize;
        const offsetY = gameState.cameraY % gridSize;
        
        // Vertical lines
        for (let x = -offsetX; x < CANVAS_WIDTH; x += gridSize) {
            p.line(x, 0, x, CANVAS_HEIGHT);
        }
        // Horizontal lines
        for (let y = -offsetY; y < CANVAS_HEIGHT; y += gridSize) {
            p.line(0, y, CANVAS_WIDTH, y);
        }
    }
});

window.gameInstance = gameInstance;