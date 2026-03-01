/**
 * game.js
 * Main entry point, game loop, and initialization.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, getGameState, resetGameState, TILE_SIZE, WORLD_HEIGHT, BLOCK } from './globals.js';
import { World } from './world.js';
import { Player, Enemy } from './entities.js';
import { handleKeyDown, handleKeyUp, KEYS } from './input.js';
import { renderStartScreen, renderHUD, renderPausedScreen, renderGameOverWin, renderGameOverLose } from './ui.js';
import { ParticleSystem } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Global Logs
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
        gameState.gamePhase = "START";
        
        // Listen for external control mode changes
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode Set:", mode);
            // If test mode is set during start, auto-start
            if (mode !== "HUMAN" && gameState.gamePhase === "START") {
                p.keyCode = 13; // Simulate Enter
                p.keyPressed();
            }
        };
    };
    
    // Define reset function for restarts
    gameInstance.resetGameFn = function() {
        resetGameState();
        initGame();
    };

    function initGame() {
        gameState.world = new World();
        gameState.world.generate(p);
        
        // Spawn Player
        // Find surface at center
        const startX = 20; // tiles
        let startY = 0;
        while (startY < WORLD_HEIGHT && gameState.world.getBlock(startX, startY) === BLOCK.AIR) {
            startY++;
        }
        gameState.player = new Player(startX * TILE_SIZE, (startY - 2) * TILE_SIZE);
        gameState.entities.push(gameState.player);
        
        gameState.gamePhase = "PLAYING";
        
        // Log start
        p.logs.game_info.push({
            phase: "PLAYING",
            timestamp: Date.now()
        });
    }

    p.draw = function() {
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        p.background(135, 206, 235); // Sky Blue default

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
                renderGame(p); // Render background state
                renderPausedScreen(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOverWin(p);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOverLose(p);
                break;
        }
    };

    function updateGame(p) {
        // 1. Spawner logic (Simple)
        // Every 5 seconds, 20% chance to spawn zombie if fewer than 5
        if (p.frameCount % 300 === 0 && gameState.entities.filter(e => e instanceof Enemy).length < 5) {
            spawnEnemy(p);
        }

        // 2. TEST_2 Cheat: Teleport to Core
        if (gameState.controlMode === "TEST_2" && gameState.frameCount % 60 === 0) {
            // Find core
            for (let x = 0; x < gameState.worldWidth; x++) {
                for (let y = 0; y < gameState.worldHeight; y++) {
                    if (gameState.worldTiles[x][y] === BLOCK.CORE) {
                        // Teleport player right next to it
                        if (gameState.player) {
                            gameState.player.x = (x - 1) * TILE_SIZE;
                            gameState.player.y = y * TILE_SIZE;
                            gameState.player.vx = 0;
                            gameState.player.vy = 0;
                            gameState.player.facing = 1; // Face right towards core
                            gameState.player.selectedSlot = 0; // Pickaxe
                        }
                    }
                }
            }
        }

        // 3. Update Entities
        gameState.entities.forEach(entity => entity.update(p));
        
        // 4. Cleanup Dead Entities
        gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
        
        // 5. Update Camera
        if (gameState.player) {
            // Center camera on player with smooth lerp
            const targetCamX = gameState.player.x - CANVAS_WIDTH / 2;
            const targetCamY = gameState.player.y - CANVAS_HEIGHT / 2;
            
            gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
            gameState.cameraY += (targetCamY - gameState.cameraY) * 0.1;
            
            // Clamp camera to world bounds
            gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth * TILE_SIZE - CANVAS_WIDTH));
            gameState.cameraY = Math.max(0, Math.min(gameState.cameraY, gameState.worldHeight * TILE_SIZE - CANVAS_HEIGHT));
        }
        
        // 6. Update Particles
        ParticleSystem.updateAndRender(p); // Actually render is called here, strictly should separate but this is efficient for particles
    }

    function renderGame(p) {
        // Camera Transform already handled by subtraction in render methods of entities/world
        
        // 1. Render World
        gameState.world.render(p);
        
        // 2. Render Entities
        gameState.entities.forEach(entity => entity.render(p));
    }

    function spawnEnemy(p) {
        // Spawn randomly near player but not too close
        if (!gameState.player) return;
        const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 200 + 300);
        let x = gameState.player.x + offset;
        
        // Find ground
        let tileX = Math.floor(x / TILE_SIZE);
        if (tileX < 0) tileX = 0;
        if (tileX >= gameState.worldWidth) tileX = gameState.worldWidth - 1;
        
        let y = 0;
        // Search from top
        while (y < gameState.worldHeight && gameState.worldTiles[tileX][y] === BLOCK.AIR) {
            y++;
        }
        
        if (y < gameState.worldHeight) {
            gameState.entities.push(new Enemy(tileX * TILE_SIZE, (y - 2) * TILE_SIZE));
        }
    }

    p.keyPressed = function() {
        // Handle global start trigger here for strict compliance with "start on pressing ENTER" logic in setup/draw
        if (gameState.gamePhase === "START" && p.keyCode === 13) {
            initGame();
        }
        handleKeyDown(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;