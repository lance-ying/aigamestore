/**
 * game.js
 * Main Entry point. Sets up the p5 instance and main loop.
 */

import { gameState, initLogs, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRID_ROWS, VOID_SPEED_INC } from './globals.js';
import { handleInput } from './input.js';
import { Player } from './entities.js';
import { setupLevel, updateLevelGen } from './level_gen.js';
import { gridToScreen } from './physics.js';
import { updateParticles } from './particles.js';
import { renderStartScreen, renderUI, renderGameOver, renderPausedOverlay } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Global p5 Access
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initial Game Setup
        gameState.gamePhase = "START";
        
        // Setup Player explicitly for Start Screen background (optional) or just wait for start
        gameState.player = new Player(0, 5); 
        setupLevel(p); // Pre-gen some level
    };

    p.draw = function() {
        // 1. Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // 2. Automated Input Injection
        if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === 'PLAYING') {
            const action = get_automated_testing_action();
            if (action) {
                // Simulate key press
                p.keyCode = action.keyCode;
                handleInput(p, 'pressed');
                // Auto release? Simple logic assumes one tap per frame or so.
                // In a robust system we'd manage keyUp. Here we just trigger the command logic.
            }
        }

        // 3. Clear Background
        p.background(COLORS.BACKGROUND);
        
        // 4. State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPausedOverlay(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
    };

    p.keyPressed = function() {
        handleInput(p, 'pressed');
    };

    p.keyReleased = function() {
        handleInput(p, 'released');
    };
});

// Update Logic
function updateGame(p) {
    // A. Update Camera
    if (gameState.player) {
        const targetCamX = gameState.player.visualX - CANVAS_WIDTH / 3;
        // Simple Lerp Camera
        gameState.cameraX = gameState.cameraX + (targetCamX - gameState.cameraX) * 0.1;
        // Clamp camera? Endless runner, so min is 0 roughly
        if (gameState.cameraX < 0) gameState.cameraX = 0;
    }
    
    // B. Update Void (Doom Wall)
    gameState.voidX += gameState.voidSpeed;
    gameState.voidSpeed += VOID_SPEED_INC;
    
    // Check if Void caught Player
    if (gameState.player && !gameState.player.isDead) {
        if (gameState.player.gridX < gameState.voidX) {
            gameState.player.die(p, "Consumed by the Void");
        }
    }
    
    // C. Level Generation
    updateLevelGen(p);
    
    // D. Update Entities
    // Player
    if (gameState.player) gameState.player.update(p);
    
    // Others
    // Use reverse loop for safe removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        if (ent === gameState.player) continue; // Already updated
        
        ent.update(p);
        
        if (ent.markedForDeletion) {
            gameState.entities.splice(i, 1);
        }
    }
    
    // E. Particles
    updateParticles(p);
}

// Render Logic
function renderGame(p) {
    p.push();
    
    // Apply Camera Transform
    // We only translate X because Y is fixed (10 rows fits in 400px height with 40px tiles)
    p.translate(-gameState.cameraX, 0);
    
    // 1. Render Tiles (Visible range only)
    const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
    const endCol = startCol + (CANVAS_WIDTH / TILE_SIZE) + 2;
    
    for (let x = startCol; x <= endCol; x++) {
        for (let y = 0; y < GRID_ROWS; y++) {
            const key = `${x},${y}`;
            const tile = gameState.tiles.get(key);
            
            // Draw floor/pit
            const pos = gridToScreen(x, y);
            
            if (tile) {
                if (tile.type === 'FLOOR') {
                    renderFloor(p, pos.x, pos.y);
                } else if (tile.type === 'WALL') {
                    renderWall(p, pos.x, pos.y);
                }
            } else {
                // PIT
                // Don't draw anything, background shows through.
                // Or draw darker rect
            }
        }
    }
    
    // 2. Render Entities (except Player, rendered last)
    for (const ent of gameState.entities) {
        if (ent !== gameState.player) {
            // Culling
            if (ent.visualX > gameState.cameraX - TILE_SIZE && 
                ent.visualX < gameState.cameraX + CANVAS_WIDTH) {
                ent.render(p);
            }
        }
    }
    
    // 3. Render Player
    if (gameState.player) gameState.player.render(p);
    
    // 4. Render Particles
    // (Particles usually in world space)
    // If particles are screen space, pop matrix first. Assuming world space:
    // (Actually particle system handles its own render call, assume they are world space)
    // Wait, particles render method doesn't transform. 
    // They are updated with world coords? 
    // Yes, createExplosion uses tile coords converted to pixels.
    // So they are in World Space.
    
    // 5. Render The Void
    const voidScreenX = gameState.voidX * TILE_SIZE;
    p.fill(COLORS.VOID);
    p.noStroke();
    // Draw a massive rect covering everything to the left
    p.rect(voidScreenX - 2000, 0, 2000, CANVAS_HEIGHT); 
    
    // Glow Edge
    for (let i = 0; i < 20; i++) {
        p.fill(231, 76, 60, 50 - i * 2);
        p.rect(voidScreenX + i * 2, 0, 2, CANVAS_HEIGHT);
    }
    
    p.pop();
}

/**
 * Helpers for drawing tiles
 */
function renderFloor(p, x, y) {
    p.stroke(COLORS.GRID_DARK);
    p.strokeWeight(1);
    p.fill(COLORS.GRID_LIGHT);
    p.rect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Detail
    p.noStroke();
    p.fill(COLORS.GRID_DARK);
    p.rect(x + 10, y + 10, 4, 4);
}

function renderWall(p, x, y) {
    p.fill(COLORS.WALL_SIDE);
    p.rect(x, y, TILE_SIZE, TILE_SIZE);
    
    // 3D Top effect
    p.fill(COLORS.WALL_TOP);
    p.rect(x, y, TILE_SIZE, TILE_SIZE - 10);
}

// Window Global
window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
};