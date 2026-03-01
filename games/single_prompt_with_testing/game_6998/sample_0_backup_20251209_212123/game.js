/**
 * game.js
 * Main game entry point and loop.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, logGameInfo } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Get p5 from global scope
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Logs
        logGameInfo(p, { action: "initialized", config: gameState });
    };

    // Helper to reset game
    function resetGame() {
        gameState.score = 0;
        gameState.frameCount = 0;
        gameState.projectiles = [];
        gameState.particles = [];
        
        generateLevel();
        
        // Find start position (spawn on first platform)
        gameState.player = new Player(50, CANVAS_HEIGHT - 100);
        gameState.entities = [gameState.player]; // Reset entities list with player
        
        // Add goal to entities
        if(gameState.goal) gameState.entities.push(gameState.goal);
        
        gameState.cameraX = 0;
    }

    // Input Handling
    function handleInputs() {
        // 1. Get raw inputs (Human or Bot)
        let currentKeys = {};
        
        if (gameState.controlMode === "HUMAN") {
            // Copy from p5 key state (handled via events) is tricky because p5 events trigger once.
            // We use the global `gameState.keys` which is updated by keyPressed/Released events.
            currentKeys = { ...gameState.keys };
        } else {
            // Bot overrides
            const botKeys = get_automated_testing_action();
            if (botKeys) {
                gameState.keys = { ...gameState.keys, ...botKeys }; // Merge to allow some manual override if needed, or mostly overwrite
                currentKeys = botKeys;
            }
        }
        
        // Log inputs if changed (optimization: usually logs grow too fast, maybe log only significant actions)
        // For constraints: "log... inputs... with proper initialization and updates"
        if (gameState.frameCount % 60 === 0) { // Log periodically to save space, or on specific events
             p.logs.inputs.push({
                keys: currentKeys,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    function updateGameLogic() {
        if (!gameState.player) return;

        // Update Entities
        gameState.player.update(p);
        
        gameState.enemies.forEach(e => e.update(p));
        gameState.collectibles.forEach(c => c.update(p));
        gameState.projectiles.forEach(pr => pr.update(p));
        gameState.particles.forEach(part => part.update());
        if (gameState.goal) gameState.goal.update();

        // Cleanup dead entities
        gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
        gameState.collectibles = gameState.collectibles.filter(c => !c.markedForDeletion);
        gameState.projectiles = gameState.projectiles.filter(pr => !pr.markedForDeletion);
        gameState.particles = gameState.particles.filter(part => part.life > 0);

        // Camera Follow
        const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3;
        gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
        
        // Clamp Camera
        gameState.cameraX = Math.max(0, gameState.cameraX);
        
        // Log Player Info
        if (gameState.frameCount % 30 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                score: gameState.score,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    function renderGameWorld() {
        p.push();
        p.translate(-Math.floor(gameState.cameraX), 0);
        
        // Background Parallax (Simple stars)
        p.push();
        p.translate(gameState.cameraX * 0.5, 0); // Move slower
        p.fill(255);
        p.noStroke();
        for(let i=0; i<50; i++) {
            // Pseudo-random stars based on fixed logic for consistency
            const sx = (i * 137) % CANVAS_WIDTH;
            const sy = (i * 53) % CANVAS_HEIGHT;
            p.circle(sx + gameState.cameraX, sy, 2); // Re-offset for absolute position relative to screen
        }
        p.pop();

        // Render Entities
        gameState.platforms.forEach(plat => {
            // Cull offscreen
            if (plat.x + plat.width > gameState.cameraX && plat.x < gameState.cameraX + CANVAS_WIDTH) {
                plat.render(p);
            }
        });
        
        if (gameState.goal) gameState.goal.render(p);
        
        gameState.collectibles.forEach(c => c.render(p));
        gameState.enemies.forEach(e => e.render(p));
        gameState.player.render(p);
        gameState.projectiles.forEach(pr => pr.render(p));
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }

    p.draw = function() {
        // Global Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        p.background(COLORS.background);

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                handleInputs();
                updateGameLogic();
                renderGameWorld();
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderGameWorld(); // Show frozen game
                renderHUD(p);
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGameWorld();
                renderGameOver(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGameWorld();
                renderGameOver(p, false);
                break;
        }
    };

    p.keyPressed = function() {
        // Phase Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                resetGame();
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, { event: "Game Start" });
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
            }
        }
        
        // Game Controls
        gameState.keys[p.keyCode] = true;
        
        // Z Key Trigger (Shoot) - Handle single press event for better feel
        if (p.keyCode === 90 && gameState.gamePhase === "PLAYING" && gameState.player) {
            gameState.player.shoot();
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
    };
});

// Control Mode Setter
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};