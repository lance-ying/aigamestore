/**
 * Main Game Entry Point
 * Handles P5 instance setup, game loop, and level management.
 */

import { 
    gameState, getGameState, resetGameState,
    CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BG
} from './globals.js';
import { handleKeyPress, handleKeyRelease, clearInputBuffer } from './input.js';
import { renderUI, renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';
import { SpatialGrid, updatePhysics } from './physics.js';
import { Player, EnemyBase, Gate } from './entities.js';

// --- Level Generation Logic ---
let gateSpawnTimer = 0;

function spawnGameElements(p) {
    gateSpawnTimer++;
    
    // Spawn Gates every ~2 seconds (120 frames)
    if (gateSpawnTimer > 150) {
        gateSpawnTimer = 0;
        
        // Randomize gate properties
        const isMult = Math.random() > 0.4; // 60% chance mult
        const value = isMult ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 20) + 10;
        const width = 80 + Math.random() * 60;
        const x = Math.random() * (CANVAS_WIDTH - width);
        const y = 80; // Below base
        
        const gate = new Gate(x, y, width, value, isMult ? 'MULT' : 'ADD');
        gameState.gates.push(gate);
    }
}

function updateGame(p) {
    // Update Player
    if (gameState.player) gameState.player.update(p);
    
    // Update Enemy Base
    if (gameState.enemyBase) gameState.enemyBase.update(p);
    
    // Spawn Level Elements
    spawnGameElements(p);
    
    // Update Physics & Collisions
    updatePhysics(p);
    
    // Update Gates
    for (let i = gameState.gates.length - 1; i >= 0; i--) {
        const gate = gameState.gates[i];
        gate.update(p);
        if (gate.isDead) gameState.gates.splice(i, 1);
    }

    // Cleanup Dead Mobs (Optimized in physics loop ideally, but cleanup here to be safe)
    // We filter once per frame
    gameState.mobs = gameState.mobs.filter(m => !m.isDead);

    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const pt = gameState.particles[i];
        pt.update();
        if (pt.isDead()) gameState.particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
        const ft = gameState.floatingTexts[i];
        ft.update();
        if (ft.isDead()) gameState.floatingTexts.splice(i, 1);
    }

    // Screen Shake Decay
    if (gameState.shakeTimer > 0) gameState.shakeTimer--;
}

function renderGame(p) {
    // Screen Shake Transform
    p.push();
    if (gameState.shakeTimer > 0) {
        const amt = gameState.shakeIntensity;
        const dx = p.random(-amt, amt);
        const dy = p.random(-amt, amt);
        p.translate(dx, dy);
    }

    // Draw Entities
    // 1. Gates (Below mobs)
    gameState.gates.forEach(g => g.render(p));
    
    // 2. Base
    if (gameState.enemyBase) gameState.enemyBase.render(p);
    
    // 3. Mobs
    gameState.mobs.forEach(m => m.render(p));
    
    // 4. Player
    if (gameState.player) gameState.player.render(p);
    
    // 5. Particles
    gameState.particles.forEach(pt => pt.render(p));
    gameState.floatingTexts.forEach(ft => ft.render(p));

    p.pop();
}

/**
 * Initialize Game Objects
 */
function initGame() {
    resetGameState();
    gameState.spatialGrid = new SpatialGrid(40); // 40px cells
    
    gameState.player = new Player();
    gameState.enemyBase = new EnemyBase();
    
    // Initial gates
    gameState.gates.push(new Gate(100, 150, 100, 2, 'MULT'));
    gameState.gates.push(new Gate(400, 200, 100, 10, 'ADD'));
}

// --- P5 Instance ---

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
        
        // Log Start
        p.logs.game_info.push({
            event: 'setup',
            timestamp: Date.now()
        });
        
        // Initial setup not needed here as Start Phase handles transition to Init
    };

    p.draw = function() {
        // Global Time Updates
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        
        // Background
        p.background(...COLOR_BG);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                // Check if we need to auto-start for testing
                if (gameState.controlMode !== 'HUMAN' && p.frameCount > 10) {
                     initGame();
                     gameState.gamePhase = "PLAYING";
                }
                break;
                
            case "PLAYING":
                // If just switched to playing and objects not init, init them
                if (!gameState.player) initGame();
                
                updateGame(p);
                renderGame(p);
                renderUI(p);
                
                // Logging Player Info (Periodic)
                if (p.frameCount % 60 === 0 && gameState.player) {
                    p.logs.player_info.push({
                        frame: p.frameCount,
                        x: gameState.player.x,
                        score: gameState.score,
                        mobs: gameState.mobs.length
                    });
                }
                break;
                
            case "PAUSED":
                renderGame(p);
                renderPausedOverlay(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        clearInputBuffer();
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

// Control Mode Hook
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If setting mode while game running, restart
    if (gameState.gamePhase !== "START") {
        gameState.gamePhase = "START";
        // Reset logs slightly or just mark event
        gameInstance.logs.game_info.push({ event: 'mode_change', mode: mode });
    }
};

window.gameInstance = gameInstance;