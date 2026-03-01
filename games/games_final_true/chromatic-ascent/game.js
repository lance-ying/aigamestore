/**
 * game.js
 * Main entry point, game loop, and level generation logic.
 */

import { gameState, getGameState, resetGameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_KEYS } from './globals.js';
import { Player, RingObstacle, CrossObstacle, DoubleRingObstacle, Star, ColorChanger } from './entities.js';
import { updateCamera } from './physics.js';
import { handleInput, handleContinuousInput } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused } from './ui.js';
import { updateParticles } from './particles.js';

const p5 = window.p5;

// ==========================================
// LEVEL GENERATION
// ==========================================

function initGameLevel(p) {
    resetGameState();
    gameState.gamePhase = "PLAYING";
    
    // Create Player at bottom center
    gameState.player = new Player(CANVAS_WIDTH / 2, 300);
    gameState.entities.push(gameState.player);
    
    // Initial Platform/Base logic?
    // In Color Switch, you just start hovering.
    
    // Generate initial obstacles
    generateChunk(p, 0);
}

/**
 * Procedurally generate obstacles as the player climbs.
 * This function is called in the update loop to ensure obstacles exist above.
 */
function updateLevelGeneration(p) {
    // Generate up to 1000px above current camera
    const generationHorizon = gameState.cameraY - 800;
    
    if (gameState.lastObstacleY > generationHorizon) {
        generateChunk(p, gameState.lastObstacleY);
    }
    
    // Cleanup entities far below (2 screens down)
    const destroyLimit = gameState.cameraY + CANVAS_HEIGHT * 2;
    
    gameState.obstacles = gameState.obstacles.filter(o => o.y < destroyLimit);
    gameState.items = gameState.items.filter(i => i.y < destroyLimit);
}

function generateChunk(p, startY) {
    // We generate upwards, so Y decreases
    let currentY = startY;
    if (currentY === 0) currentY = 100; // Offset for first gen
    
    // Generate 5 obstacles
    for (let i = 0; i < 5; i++) {
        currentY -= 350; // Spacing between obstacles
        
        // Randomly choose obstacle type
        const type = Math.floor(p.random(3));
        let obs;
        
        switch(type) {
            case 0:
                obs = new RingObstacle(CANVAS_WIDTH/2, currentY);
                break;
            case 1:
                obs = new CrossObstacle(CANVAS_WIDTH/2, currentY);
                break;
            case 2:
                obs = new DoubleRingObstacle(CANVAS_WIDTH/2, currentY);
                break;
        }
        
        gameState.obstacles.push(obs);
        gameState.entities.push(obs);
        
        // Add a Star inside the obstacle
        const star = new Star(CANVAS_WIDTH/2, currentY);
        gameState.items.push(star);
        gameState.entities.push(star);
        
        // Add a Color Changer between obstacles
        const changerY = currentY - 175;
        const changer = new ColorChanger(CANVAS_WIDTH/2, changerY);
        gameState.items.push(changer);
        gameState.entities.push(changer);
    }
    
    gameState.lastObstacleY = currentY;
}

// ==========================================
// AUTOMATED TESTING
// ==========================================

function runAutomatedTests(p) {
    if (gameState.controlMode === "HUMAN") return;
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;

    // --- TEST_1: Hover Logic ---
    if (gameState.controlMode === "TEST_1") {
        // Simple logic: If falling and below center, jump
        // Center of screen Y is gameState.cameraY + 200
        const screenCenterY = gameState.cameraY + 300;
        
        if (gameState.player.y > screenCenterY && gameState.player.vy > 0) {
            gameState.player.jump();
            p.logs.inputs.push({ type: 'TEST_JUMP', frame: gameState.frameCount });
        }
    }
    
    // --- TEST_2: Smart Progress ---
    if (gameState.controlMode === "TEST_2") {
        // 1. Maintain height mostly
        const targetY = gameState.cameraY + 250;
        
        // 2. Look for nearest obstacle ABOVE player
        let nearestObs = null;
        let minDist = 9999;
        
        for (let obs of gameState.obstacles) {
            if (obs.y < gameState.player.y && (gameState.player.y - obs.y) < minDist) {
                minDist = gameState.player.y - obs.y;
                nearestObs = obs;
            }
        }
        
        let safeToClimb = true;
        
        // 3. Analyze Obstacle if close
        if (nearestObs && minDist < 150) {
            // Check if current rotation aligns player color with safe segment
            // This is a simplification: We assume if we are not safe, we wait.
            // Actually verifying "safe" programmatically without duplicating collision logic is hard.
            // We'll rely on a heuristic:
            // "Wait" by hovering low. "Go" by jumping high.
            
            // Randomly decide to "go" periodically to simulate attempts
            if (p.frameCount % 120 < 60) {
                safeToClimb = false; // Hesitate
            }
        }
        
        // Execute Move
        if (gameState.player.y > targetY || (safeToClimb && gameState.player.vy > 0)) {
            // Don't let player fall off screen
            if (gameState.player.y > gameState.cameraY + 350) {
                gameState.player.jump();
            }
            // Climb if safe
            else if (safeToClimb && gameState.player.vy > -2) {
                gameState.player.jump();
            }
        }
    }
}

// ==========================================
// P5 INSTANCE
// ==========================================

const gameInstance = new p5(p => {
    
    // Logs initialization
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Attach inputs
        handleInput(p);
        
        // Initial Log
        p.logs.game_info.push({
            event: "INITIALIZED",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const now = Date.now();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // --- UPDATE PHASE ---
        if (gameState.gamePhase === "PLAYING") {
            if (!gameState.player) {
                initGameLevel(p);
            }
            
            // Input Handling
            handleContinuousInput(p);
            runAutomatedTests(p);
            
            // Physics & Entities
            if (gameState.player) gameState.player.update(p);
            gameState.obstacles.forEach(o => o.update());
            updateCamera(p);
            updateLevelGeneration(p);
            updateParticles(p);
            
            // Log Player State occasionally
            if (p.frameCount % 30 === 0 && gameState.player) {
                p.logs.player_info.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    score: gameState.score,
                    frame: p.frameCount
                });
            }
        }

        // --- RENDER PHASE ---
        p.background(COLORS.BACKGROUND);
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        }
        else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            // Render Game World
            // Note: Render order matters
            
            // 1. Items/Collectibles (Behind)
            gameState.items.forEach(i => i.render(p));
            
            // 2. Player
            if (gameState.player) gameState.player.render(p);
            
            // 3. Obstacles
            gameState.obstacles.forEach(o => o.render(p));
            
            // 4. Particles
            gameState.particles.forEach(pt => pt.render(p));
            
            // 5. HUD
            renderHUD(p);
            
            // Overlays
            if (gameState.gamePhase === "PAUSED") {
                renderPaused(p);
            }
            if (gameState.gamePhase === "GAME_OVER_WIN") {
                renderGameOver(p, true);
            }
            if (gameState.gamePhase === "GAME_OVER_LOSE") {
                renderGameOver(p, false);
            }
        }
    };
});

// Expose control mode setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state for testing
    resetGameState();
    gameState.gamePhase = "PLAYING"; 
};

window.gameInstance = gameInstance;