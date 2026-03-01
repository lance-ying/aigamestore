/**
 * Main Game Loop and p5.js Setup
 */

import { 
    gameState, getGameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { rhythmManager } from './rhythm.js';
import { Dungeon } from './grid.js';
import { Player, Enemy, Item } from './entities.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = gameState.logs; // Link logs
    
    // Setup
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Log initial
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Initial setup
        startGame(p);
    };

    // Draw Loop
    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Background
        p.background(COLORS.BACKGROUND);
        
        // Automated Inputs
        if (gameState.controlMode !== 'HUMAN') {
            const action = get_automated_testing_action(gameState);
            if (action) {
                p.keyPressed({ keyCode: action.keyCode });
                // We simulate the key press logic manually since p.keyPressed is an event
                handleKeyPress(p, action.keyCode);
            }
        }
        
        // State Machine
        switch(gameState.gamePhase) {
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
                renderUI(p); // Show UI even when paused
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
    };
    
    p.keyPressed = function(e) {
        // Handle physical key press
        // If simulated, e might be just { keyCode: ... }
        const code = e.keyCode || e;
        handleKeyPress(p, code);
    };
});

function handleKeyPress(p, keyCode) {
    // Log
    p.logs.inputs.push({
        type: 'press',
        key: keyCode,
        frame: p.frameCount,
        time: p.millis()
    });
    
    if (keyCode === 82) { // R - Restart
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             startGame(p);
             gameState.gamePhase = "START";
             return;
        }
    }
    
    handleInput(p, keyCode);
}

function startGame(p) {
    resetGameState();
    
    // Create Dungeon
    const dungeon = new Dungeon();
    gameState.dungeon = dungeon;
    const startData = dungeon.generateLevel(p);
    
    gameState.grid = dungeon.tiles;
    
    // Create Player
    gameState.player = new Player(startData.startX, startData.startY);
    gameState.entities.push(gameState.player);
    
    // Create Enemies
    const rooms = startData.rooms;
    // Skip first room (player start)
    for (let i = 1; i < rooms.length; i++) {
        const r = rooms[i];
        const cx = p.floor(r.x + r.w/2);
        const cy = p.floor(r.y + r.h/2);
        
        // Random enemy type
        const rand = p.random();
        let type = 'SLIME';
        if (rand > 0.6) type = 'SKELETON';
        if (rand > 0.9) type = 'BAT';
        
        gameState.entities.push(new Enemy(cx, cy, type));
    }
    
    // Create Items
    for (let i = 1; i < rooms.length; i++) {
        if (p.random() > 0.5) {
            const r = rooms[i];
            const x = p.floor(p.random(r.x, r.x + r.w));
            const y = p.floor(p.random(r.y, r.y + r.h));
            // Don't spawn on top of things ideally, but collision handles it
            gameState.entities.push(new Item(x, y, p.random() > 0.7 ? 'POTION' : 'GOLD'));
        }
    }
}

function updateGame(p) {
    // Rhythm Update
    rhythmManager.update(p.millis());
    
    // Entity Updates (Animation mostly, physics logic is turn based in input.js)
    gameState.entities.forEach(e => e.updatePosition());
    
    // Particle Updates
    updateParticles();
    
    // Screen Shake Decay
    if (gameState.shakeAmount > 0) {
        gameState.shakeAmount *= 0.9;
        if (gameState.shakeAmount < 0.5) gameState.shakeAmount = 0;
    }
    
    // Log Player State occasionally
    if (p.frameCount % 60 === 0 && gameState.player) {
        p.logs.player_info.push({
            x: gameState.player.gridX,
            y: gameState.player.gridY,
            health: gameState.player.health,
            score: gameState.score,
            combo: gameState.combo
        });
    }
}

function renderGame(p) {
    p.push();
    
    // Screen Shake
    if (gameState.shakeAmount > 0) {
        p.translate(p.random(-gameState.shakeAmount, gameState.shakeAmount), p.random(-gameState.shakeAmount, gameState.shakeAmount));
    }
    
    // Center Camera on Player
    if (gameState.player) {
        // Pixel Center
        const px = gameState.player.pixelX + 20;
        const py = gameState.player.pixelY + 20;
        
        let camX = CANVAS_WIDTH/2 - px;
        let camY = (CANVAS_HEIGHT - 40)/2 - py;
        
        // Clamp Camera
        // Actually, let's keep it simple and just center, or clamp if we want
        // Dungeon is small (15x9) -> 600x360 fits exactly in canvas width
        // If grid matches canvas, no camera needed!
        // GRID_WIDTH = 15, TILE_SIZE = 40 => 600px width.
        // GRID_HEIGHT = 9, TILE_SIZE = 40 => 360px height.
        // HUD = 40px. Total height 400.
        // Perfect fit. No camera translation needed.
    }
    
    // Render World
    if (gameState.dungeon) gameState.dungeon.render(p);
    
    // Render Entities (Sort by Y for depth)
    const sortedEntities = [...gameState.entities].sort((a,b) => a.pixelY - b.pixelY);
    sortedEntities.forEach(e => e.render(p));
    
    // Render Particles (on top)
    renderParticles(p);
    
    p.pop();
}

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};