/**
 * game.js
 * Main entry point. Setup p5 instance, game loop, and initialization.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TILE_SIZE, getGameState } from './globals.js';
import { Player } from './entities.js';
import { updateLevelGeneration, TILE_TYPES } from './level_gen.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderUI } from './ui.js';
import { gridToWorld, worldToGrid } from './physics.js';

// Get p5 from window
const p5 = window.p5;

// Main Game Instance
let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        gameState.reset();
    };

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // --- UPDATE LOGIC ---
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        }

        // --- RENDER LOGIC ---
        p.background(COLORS.BACKGROUND);
        
        if (gameState.gamePhase !== "START") {
            renderGameWorld(p);
        }
        
        // UI always on top
        renderUI(p);
    };

    p.keyPressed = function() {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
});

// Helper: Initialize a new game run
function startRun() {
    gameState.reset();
    
    // Generate initial area
    updateLevelGeneration();
    
    // Create Player at safe spot
    gameState.player = new Player(2, 5); // Start at col 2, row 5
    gameState.entities.push(gameState.player);
    
    // Camera snap
    gameState.cameraX = 0;
}

// Main Game Update Loop
function updateGame(p) {
    if (!gameState.player) startRun();

    // 1. Level Generation
    updateLevelGeneration();

    // 2. Input Handling (AI or Polling if needed)
    handleInput(p);

    // 3. Update Doom Wall
    gameState.doomWallX += gameState.doomWallSpeed;
    gameState.doomWallSpeed += 0.0001; // Slowly accelerate

    // 4. Update Entities
    // Filter dead entities first (except player, handled in state)
    gameState.entities = gameState.entities.filter(e => !e.dead || e === gameState.player);
    
    gameState.entities.forEach(entity => {
        entity.update(p);
    });
    
    // 5. Update Particles
    gameState.particles = gameState.particles.filter(pt => !pt.dead);
    gameState.particles.forEach(pt => pt.update());

    // 6. Camera Follow
    if (gameState.player) {
        // Smooth Lerp Camera to center player, but clamp to left side (0)
        // We generally move right, so cameraX follows player X
        const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3; // Player at 30% screen width
        
        // Don't scroll backwards
        if (targetCamX > gameState.cameraX) {
            gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        }
    }
    
    // 7. Log Player Info
    if (gameState.player && p.frameCount % 10 === 0) {
        p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.cameraX,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

// Main Render Function
function renderGameWorld(p) {
    p.push();
    
    // Camera Transform
    // Only translate X for scrolling runner
    p.translate(-gameState.cameraX, 0);

    // 1. Render Grid (visible range only)
    const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
    const endCol = startCol + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1;

    for (let c = startCol; c <= endCol; c++) {
        for (let r = 0; r < 10; r++) { // 10 rows fixed
            const key = `${c},${r}`;
            const tile = gameState.grid.get(key);
            if (tile) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                
                if (tile.type === TILE_TYPES.WALL) {
                    // Draw Wall
                    p.fill(COLORS.WALL);
                    p.rect(x, y, TILE_SIZE, TILE_SIZE);
                    // Top highlight
                    p.fill(COLORS.WALL_TOP);
                    p.rect(x, y, TILE_SIZE, 10);
                } else {
                    // Draw Floor
                    p.fill(tile.variation ? COLORS.FLOOR_1 : COLORS.FLOOR_2);
                    p.rect(x, y, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    // 2. Render Doom Wall
    p.fill(COLORS.DOOM_WALL);
    // It covers everything to the left
    p.rect(gameState.doomWallX - 1000, 0, 1000 + 50, CANVAS_HEIGHT); // Huge rect behind
    // Glowing edge
    p.noStroke();
    for(let i=0; i<10; i++) {
        p.fill(255, 50, 50, 50 - i*5);
        p.rect(gameState.doomWallX + 50 + i*5, 0, 5, CANVAS_HEIGHT);
    }

    // 3. Render Entities (Sorted by Z order?)
    // Simple Z-sort
    gameState.entities.sort((a, b) => a.zOrder - b.zOrder);
    gameState.entities.forEach(entity => {
        // Culling optimization
        if (entity.x > gameState.cameraX - 50 && entity.x < gameState.cameraX + CANVAS_WIDTH + 50) {
            entity.render(p);
        }
    });
    
    // 4. Render Particles
    gameState.particles.forEach(pt => pt.render(p));

    p.pop();
}

// Expose game instance
if (typeof window !== 'undefined') {
    window.gameInstance = gameInstance;
}