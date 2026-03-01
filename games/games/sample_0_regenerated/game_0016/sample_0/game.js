/**
 * Main Game Loop and p5.js Setup
 * 
 * Orchestrates the game initialization, loop, and rendering.
 * Implements instance mode for isolation.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, logGameEvent } from './globals.js';
import { handleKeyDown, handleKeyUp } from './input.js';
import { renderUI } from './ui.js';
import { Fighter, Platform, Hitbox } from './entities.js';
import { updateAndRenderParticles } from './particles.js';
import { checkAABB } from './physics.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs (Write-Only)
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Disable context menu for right click
        canvas.elt.addEventListener('contextmenu', e => e.preventDefault());
        
        // Log start
        logGameEvent(p, 'init', { phase: gameState.gamePhase });
        
        // Initial reset to safe state
        resetGame();
    };

    p.draw = function() {
        // Time Management
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        
        // Draw Background
        p.background(COLORS.BACKGROUND);
        
        // Camera Shake
        if (gameState.camera.shake > 0) {
            const mag = gameState.camera.shake;
            p.translate(p.random(-mag, mag), p.random(-mag, mag));
            gameState.camera.shake *= 0.9;
            if (gameState.camera.shake < 0.5) gameState.camera.shake = 0;
        }
        
        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
                
            case "PLAYING":
                updateGameLogic(p);
                renderGameScene(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGameScene(p); // Render frozen state
                renderUI(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameScene(p);
                renderUI(p);
                break;
        }
    };
    
    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
    };
    
    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

function resetGame() {
    gameState.resetMatch();
    
    // Setup Level
    // Main platform
    gameState.platforms.push(new Platform(100, 300, 400, 20));
    // Top platforms
    gameState.platforms.push(new Platform(150, 200, 100, 15));
    gameState.platforms.push(new Platform(350, 200, 100, 15));
    
    // Setup Players
    // Player (Fire)
    gameState.player = new Fighter(200, 200, true, COLORS.FIRE_PRIMARY);
    
    // Enemy (Water/CPU)
    const enemy = new Fighter(400, 200, false, COLORS.WATER_PRIMARY);
    gameState.enemies.push(enemy);
}

function updateGameLogic(p) {
    // 1. Update Platforms (Static usually, but good practice)
    gameState.platforms.forEach(plat => plat.update());
    
    // 2. Update Players
    if (gameState.player) {
        gameState.player.update(p);
        logPlayerInfo(p, gameState.player);
    }
    
    gameState.enemies.forEach(enemy => enemy.update(p));
    
    // 3. Update Projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.update(p);
        if (proj.markedForDeletion) {
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // 4. Update Hitboxes & Check Collisions
    for (let i = gameState.hitboxes.length - 1; i >= 0; i--) {
        const hb = gameState.hitboxes[i];
        hb.update();
        
        // Collision logic
        const targets = hb.owner.isPlayer ? gameState.enemies : [gameState.player];
        
        for (const target of targets) {
            if (!target) continue;
            // Don't hit twice in same hitbox duration
            if (hb.hasHit.includes(target.id)) continue;
            
            if (checkAABB(hb, target)) {
                // Apply Damage & Knockback
                target.takeDamage(hb.damage, hb.baseKnockback, hb.angle);
                hb.hasHit.push(target.id);
                
                // Hitlag (Pause effect) - simplified as just log here
                logGameEvent(p, 'hit', { damage: hb.damage });
            }
        }
        
        if (hb.markedForDeletion) {
            gameState.hitboxes.splice(i, 1);
        }
    }
    
    // Check if player needs reset (if mode changed from START)
    // This is handled in START->PLAYING transition in input.js logic primarily
    // but we check if entities exist here just in case
    if (!gameState.player && gameState.gamePhase === "PLAYING") {
        resetGame();
    }
}

function renderGameScene(p) {
    // Render Order: Platforms -> Particles -> Projectiles -> Enemies -> Player -> Hitboxes
    
    gameState.platforms.forEach(plat => plat.render(p));
    
    updateAndRenderParticles(p);
    
    gameState.projectiles.forEach(proj => proj.render(p));
    
    gameState.enemies.forEach(enemy => enemy.render(p));
    
    if (gameState.player) gameState.player.render(p);
    
    // Debug hitboxes
    // gameState.hitboxes.forEach(hb => hb.render(p));
}

function logPlayerInfo(p, player) {
    if (p.logs && p.logs.player_info) {
        p.logs.player_info.push({
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            state: player.state,
            percent: player.percent,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

// Global functions for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
    // Reset game to apply test conditions cleanly
    resetGame();
    gameState.gamePhase = "PLAYING";
};

// Expose game instance
window.gameInstance = gameInstance;