import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameEvent } from './globals.js';
import { initInput, handleInput, setInitGameCallback } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { generateLevel } from './level.js';

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
        
        gameState.gamePhase = "START";
        gameState.controlMode = "HUMAN";
        
        // Setup input listeners
        initInput(p);
        
        // Setup restart callback
        setInitGameCallback(() => {
            generateLevel();
            gameState.score = 0;
            gameState.frameCount = 0;
            gameState.cameraX = 0;
            
            logGameEvent(p, "GAME_START", { mode: gameState.controlMode });
        });
        
        logGameEvent(p, "INIT", { phase: gameState.gamePhase });
    };

    p.draw = function() {
        // Global Update
        gameState.frameCount = p.frameCount;
        
        // Render
        p.background(20); // Dark background
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            
            // Logic Update (only if playing)
            if (gameState.gamePhase === "PLAYING") {
                updateGameLogic(p);
            }
            
            // Render Game World
            renderGameWorld(p);
            
            // UI Overlay
            renderUI(p);
            
            if (gameState.gamePhase === "PAUSED") renderPausedOverlay(p);
            if (gameState.gamePhase.startsWith("GAME_OVER")) renderGameOver(p);
        }
        
        // Shake decay
        if (gameState.cameraShake > 0) gameState.cameraShake *= 0.9;
    };
});

function updateGameLogic(p) {
    handleInput(p);
    
    // Update Camera
    if (gameState.player) {
        // Target: Center on player, clamped to bounds
        let targetX = gameState.player.x - CANVAS_WIDTH / 2;
        targetX = Math.max(0, targetX); // Left bound
        // Right bound: assume level is long
        
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
    }
    
    // Update Entities
    // Iterate backwards to allow safe removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        ent.update(p);
        if (ent.dead) {
            gameState.entities.splice(i, 1);
            // Also remove from specific lists if needed (optimization)
            const projIdx = gameState.projectiles.indexOf(ent);
            if (projIdx > -1) gameState.projectiles.splice(projIdx, 1);
            const enemIdx = gameState.enemies.indexOf(ent);
            if (enemIdx > -1) gameState.enemies.splice(enemIdx, 1);
            const colIdx = gameState.collectibles.indexOf(ent);
            if (colIdx > -1) gameState.collectibles.splice(colIdx, 1);
        }
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function renderGameWorld(p) {
    p.push();
    
    // Camera Transform
    let shakeX = (Math.random() - 0.5) * gameState.cameraShake;
    let shakeY = (Math.random() - 0.5) * gameState.cameraShake;
    p.translate(-gameState.cameraX + shakeX, shakeY);
    
    // Draw Platforms
    p.fill(255);
    p.noStroke();
    for (let plat of gameState.platforms) {
        // Culling
        if (plat.x - gameState.cameraX < CANVAS_WIDTH && plat.x + plat.width - gameState.cameraX > 0) {
            p.fill(80); // Darker grey walls
            p.rect(plat.x, plat.y, plat.width, plat.height);
            // Texture
            p.stroke(100);
            p.line(plat.x, plat.y, plat.x + plat.width, plat.y);
            p.noStroke();
        }
    }
    
    // Draw Entities
    for (let ent of gameState.entities) {
        if (ent.x - gameState.cameraX < CANVAS_WIDTH && ent.x + ent.width - gameState.cameraX > 0) {
            ent.renderAt(p, ent.x, ent.y);
        }
    }
    
    // Draw Particles
    for (let part of gameState.particles) {
        part.render(p);
    }
    
    p.pop();
}

// Expose instance
window.gameInstance = gameInstance;

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};