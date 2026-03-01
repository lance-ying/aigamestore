/**
 * game.js
 * Main entry point, setup, and game loop.
 */

import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, COLORS } from './globals.js';
import { Player, Enemy } from './entities.js';
import { handleInput, initInput, onKeyPressed, onKeyReleased } from './input.js';
import { Physics } from './physics.js';
import { updateParticles, renderParticles, createFloatingText } from './particles.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPaused } from './ui.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // p5 Setup
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Logs
        p.logs = {
            game_info: [],
            inputs: [],
            player_info: []
        };
        
        // Initial Log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        initInput(p);
    };

    // p5 Draw (Main Loop)
    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Clear background
        p.background(20);

        // Phase Management
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
                renderGame(p); // Render underlying game frozen
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
    };

    // Input Events
    p.keyPressed = function() {
        onKeyPressed(p, p.keyCode);
        
        // Log Input
        p.logs.inputs.push({
            input_type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    };

    p.keyReleased = function() {
        onKeyReleased(p, p.keyCode);
    };

    // --- Core Game Functions ---

    function initGameWorld() {
        gameState.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        gameState.entities = [gameState.player];
        
        // Spawn initial enemies
        for (let i = 0; i < 5; i++) {
            spawnEnemy('SLIME');
        }
    }
    
    // Expose reset to window for R key or testing
    window.resetGame = function() {
        resetGameState();
        initGameWorld();
        // Log reset
        p.logs.game_info.push({ event: "RESET", frame: p.frameCount });
    };

    // Initialize world once on first transition (hacky check, better to do in phase switch)
    // We'll do a lazy init check in updateGame
    let isGameInitialized = false;

    function updateGame(p) {
        if (!isGameInitialized || !gameState.player) {
            initGameWorld();
            isGameInitialized = true;
        }

        handleInput(p);

        // Camera Logic (Follow Player)
        const player = gameState.player;
        let targetCamX = player.x - CANVAS_WIDTH / 2;
        let targetCamY = player.y - CANVAS_HEIGHT / 2;
        
        // Smooth camera
        gameState.camera.x += (targetCamX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetCamY - gameState.camera.y) * 0.1;
        
        // Clamp Camera
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, WORLD_WIDTH - CANVAS_WIDTH));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, WORLD_HEIGHT - CANVAS_HEIGHT));

        // Spawning Logic
        manageSpawns(p);

        // Update Entities
        // Sort by Y for simple depth sorting
        gameState.entities.sort((a, b) => a.y - b.y);

        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const entity = gameState.entities[i];
            entity.update(p);
            
            // Remove dead entities (cleanup)
            if (entity.isDead) {
                // Keep player for game over render
                if (entity.type !== 'PLAYER') {
                    gameState.entities.splice(i, 1);
                }
            }
        }
        
        updateParticles();
        
        // Level Up Visual Hook
        if (gameState.levelUpTriggered) {
            createFloatingText(player.x, player.y - 40, "LEVEL UP!", COLORS.ui.xp, 32);
            gameState.levelUpTriggered = false;
        }
    }

    function renderGame(p) {
        p.push();
        
        // Render Background (Grid/Tiles)
        // Optimized: Only draw tiles visible in camera
        const startCol = Math.floor(gameState.camera.x / 40);
        const endCol = startCol + (CANVAS_WIDTH / 40) + 1;
        const startRow = Math.floor(gameState.camera.y / 40);
        const endRow = startRow + (CANVAS_HEIGHT / 40) + 1;

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                // Checker pattern subtle
                if ((c + r) % 2 === 0) p.fill(COLORS.grass);
                else p.fill(COLORS.grassLight);
                
                p.noStroke();
                p.rect(c * 40 - gameState.camera.x, r * 40 - gameState.camera.y, 40, 40);
            }
        }
        
        // Draw World Bounds
        p.noFill();
        p.stroke(0);
        p.strokeWeight(5);
        p.rect(-gameState.camera.x, -gameState.camera.y, WORLD_WIDTH, WORLD_HEIGHT);

        // Render Entities
        gameState.entities.forEach(entity => {
            entity.render(p, gameState.camera.x, gameState.camera.y);
        });
        
        // Render Particles (on top of entities)
        renderParticles(p, gameState.camera.x, gameState.camera.y);
        
        p.pop();
    }

    function spawnEnemy(type) {
        let x, y, safe = false;
        // Find safe spawn location away from player
        let attempts = 0;
        while (!safe && attempts < 10) {
            x = Math.random() * (WORLD_WIDTH - 100) + 50;
            y = Math.random() * (WORLD_HEIGHT - 100) + 50;
            
            const dist = Math.sqrt(Math.pow(gameState.player.x - x, 2) + Math.pow(gameState.player.y - y, 2));
            if (dist > 300) safe = true;
            attempts++;
        }
        
        const enemy = new Enemy(x, y, type);
        gameState.entities.push(enemy);
    }
    
    function manageSpawns(p) {
        // Boss Spawn Condition
        if (!gameState.bossSpawned && gameState.enemiesDefeated >= 10 && gameState.player.stats.level >= 2) {
            spawnEnemy('BOSS');
            gameState.bossSpawned = true;
            createFloatingText(gameState.player.x, gameState.player.y - 60, "BOSS SPAWNED!", "#ff0000", 40);
        }

        // Maintain min enemy count (unless boss is alive, then maybe just minions)
        const enemies = gameState.entities.filter(e => e.type === 'ENEMY');
        const maxEnemies = gameState.bossSpawned ? 12 : 6;
        
        if (p.frameCount % 120 === 0 && enemies.length < maxEnemies) {
            let type = Math.random() > 0.7 ? 'WOLF' : 'SLIME';
            spawnEnemy(type);
        }
    }
});

// Control Mode Setter for HTML Buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};