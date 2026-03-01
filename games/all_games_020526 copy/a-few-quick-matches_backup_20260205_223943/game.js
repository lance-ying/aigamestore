/**
 * Main Game Loop and Setup
 */

import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { Player, Enemy, Platform, Hitbox } from './entities.js';
import { updateInput, handleKeyPressed, handleKeyReleased, KEYS } from './input.js';
import { renderStartScreen, renderHUD, renderPaused, renderGameOver } from './ui.js';
import { checkCollision } from './physics.js';
import { createExplosion } from './particles.js';

// Expose Input module to window for Entities to access easily without circular dependency issues in bundlers
import * as inputModule from './input.js';
window.inputModule = inputModule;

const p5 = window.p5;

const gameInstance = new p5(p => {
    p.logs = { game_info: [], inputs: [], player_info: [] };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Log start
        p.logs.game_info.push({ event: "Setup Complete", timestamp: Date.now() });
    };

    p.draw = function() {
        // Update Time
        const now = Date.now();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Input Update
        updateInput(p);
        
        // Check Restart
        if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && 
            inputModule.isKeyDown(KEYS.R)) {
             resetGameState();
             // Re-init game
             initGame(p);
             gameState.gamePhase = "PLAYING";
        }
        
        // HitStop Freeze
        if (gameState.hitStop > 0) {
            gameState.hitStop--;
            return; // Skip update, just draw last frame (or keep shaking)
        }

        // --- UPDATE LOGIC ---
        if (gameState.gamePhase === "PLAYING") {
            if (!gameState.player && gameState.entities.length === 0) {
                initGame(p);
            }
            
            updateGame(p);
        }

        // --- RENDER LOGIC ---
        // Draw Stage Background
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase.startsWith("GAME_OVER") || gameState.gamePhase === "PAUSED") {
            drawGradientBackground(p);
        } else {
             p.background(30, 30, 40); // Default dark
        }
        
        // Camera Shake
        p.push();
        if (gameState.camera.shake > 0) {
            const rx = p.random(-gameState.camera.shake, gameState.camera.shake);
            const ry = p.random(-gameState.camera.shake, gameState.camera.shake);
            p.translate(rx, ry);
            gameState.camera.shake *= 0.9;
            if (gameState.camera.shake < 0.5) gameState.camera.shake = 0;
        }

        // Camera Follow (Center on player, clamped to world)
        if (gameState.player) {
            let targetX = -gameState.player.x + CANVAS_WIDTH / 2;
            let targetY = -gameState.player.y + CANVAS_HEIGHT / 2;
            
            // Clamp
            targetX = p.constrain(targetX, -WORLD_WIDTH + CANVAS_WIDTH, 0);
            targetY = p.constrain(targetY, -WORLD_HEIGHT + CANVAS_HEIGHT, 0); // Floor align
            
            // Smooth
            gameState.camera.x = p.lerp(gameState.camera.x, targetX, 0.1);
            gameState.camera.y = p.lerp(gameState.camera.y, targetY, 0.1);
            
            p.translate(gameState.camera.x, gameState.camera.y);
        }

        if (gameState.gamePhase === "START") {
            p.pop(); // Reset cam
            renderStartScreen(p);
        } else {
            // Render World
            drawBackgroundGrid(p);
            
            // Render Entities
            gameState.platforms.forEach(e => e.render(p));
            gameState.particles.forEach(e => e.render(p));
            gameState.enemies.forEach(e => e.render(p));
            if (gameState.player) gameState.player.render(p);
            
            // Debug Hitboxes
             gameState.projectiles.forEach(e => e.render(p));
            
            p.pop(); // Restore camera transform
            
            // UI Overlay
            renderHUD(p);
            
            if (gameState.gamePhase.startsWith("GAME_OVER")) renderGameOver(p);
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

function initGame(p) {
    // Platforms
    gameState.platforms.push(new Platform(WORLD_WIDTH/2, CANVAS_HEIGHT - 50, WORLD_WIDTH, 40)); // Ground
    gameState.platforms.push(new Platform(200, 250, 150, 20));
    gameState.platforms.push(new Platform(600, 250, 150, 20));
    gameState.platforms.push(new Platform(400, 150, 100, 20));

    // Player
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);

    // Initial Enemy (Stage 1)
    spawnEnemy(1, p);
    setStageTheme(p);
}

function spawnEnemy(level, p) {
    // Random color
    const r = p ? p.random(100, 255) : 255;
    const g = p ? p.random(50, 200) : 50;
    const b = p ? p.random(50, 200) : 50;
    
    const enemy = new Enemy(700, 300, level, [r, g, b]);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy); // Add to general entities for reference if needed
}

function setStageTheme(p) {
    if (!p) return;
    // Generate random gradient for background
    gameState.stageBgTop = [p.random(10, 60), p.random(10, 60), p.random(20, 80)];
    gameState.stageBgBottom = [p.random(0, 20), p.random(0, 20), p.random(10, 40)];
}

function updateGame(p) {
    // Update Entities
    if (gameState.player) {
        gameState.player.update(p);
        
        // Log Player
        if (p.frameCount % 10 === 0) {
             p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                state: gameState.player.state,
                health: gameState.player.health,
                framecount: p.frameCount
            });
        }
    }
    
    gameState.enemies.forEach(e => e.update(p));
    gameState.projectiles.forEach((h, i) => {
        h.update();
        if (h.markedForDeletion) {
            gameState.projectiles.splice(i, 1);
        } else {
            // Collision Check
            checkAttackCollision(h);
        }
    });
    
    gameState.particles.forEach((pt, i) => {
        pt.update();
        if (pt.life <= 0) gameState.particles.splice(i, 1);
    });

    // Win/Loss Condition
    if (gameState.player && gameState.player.health <= 0 && gameState.player.state === "DEAD") {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({ event: "Game Over Lose", framecount: p.frameCount });
    } else if (gameState.enemies.length > 0 && gameState.enemies[0].health <= 0 && gameState.enemies[0].state === "DEAD") {
        // Enemy Defeated - Next Stage Logic
        gameState.score += 1000 * gameState.stage;
        gameState.stage++;
        
        // Remove dead enemy
        gameState.enemies.shift(); 
        
        // Heal Player slightly (25%)
        if (gameState.player) {
             gameState.player.health = Math.min(gameState.player.health + 25, gameState.player.maxHealth);
             createExplosion(gameState.player.x, gameState.player.y, 10, 'SPARK'); // Visual feedback
        }

        // Spawn new stronger enemy
        spawnEnemy(gameState.stage, p);
        
        // Change Stage Color
        setStageTheme(p);
        
        p.logs.game_info.push({ event: "Stage Clear", stage: gameState.stage, framecount: p.frameCount });
    }
}

function checkAttackCollision(hitbox) {
    // Check against enemies if owner is player
    if (hitbox.owner.isPlayer) {
        gameState.enemies.forEach(enemy => {
            if (enemy.state !== "DEAD" && !hitbox.hitList.includes(enemy)) {
                if (checkCollision(hitbox, enemy)) {
                    enemy.takeDamage(hitbox.damage, hitbox.kbX, hitbox.kbY);
                    hitbox.hitList.push(enemy);
                    hitbox.owner.hasHit = true; // Enable dash cancel
                    createExplosion(enemy.x, enemy.y, 5, 'SPARK');
                    gameState.score += 10 + Math.floor(hitbox.damage);
                }
            }
        });
    } else {
        // Check against player
        if (gameState.player && gameState.player.state !== "DEAD" && !hitbox.hitList.includes(gameState.player)) {
            if (checkCollision(hitbox, gameState.player)) {
                gameState.player.takeDamage(hitbox.damage, hitbox.kbX, hitbox.kbY);
                hitbox.hitList.push(gameState.player);
            }
        }
    }
}

function drawGradientBackground(p) {
    // Simple vertical gradient
    p.push();
    p.noFill();
    for (let y = 0; y <= CANVAS_HEIGHT; y+=10) {
        let inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        let c = p.lerpColor(
            p.color(gameState.stageBgTop), 
            p.color(gameState.stageBgBottom), 
            inter
        );
        p.stroke(c);
        p.strokeWeight(10);
        p.line(0, y, CANVAS_WIDTH, y);
    }
    p.pop();
}

function drawBackgroundGrid(p) {
    p.stroke(255, 255, 255, 20);
    p.strokeWeight(1);
    const gridSize = 50;
    
    // Calculate visible range based on camera
    const startX = Math.floor(-gameState.camera.x / gridSize) * gridSize;
    const startY = Math.floor(-gameState.camera.y / gridSize) * gridSize;
    
    for (let x = startX; x < startX + CANVAS_WIDTH + gridSize; x += gridSize) {
        p.line(x, -WORLD_HEIGHT, x, WORLD_HEIGHT);
    }
    for (let y = startY; y < startY + CANVAS_HEIGHT + gridSize; y += gridSize) {
        p.line(-WORLD_WIDTH, y, WORLD_WIDTH, y);
    }
}

// Global functions for control mode (HTML buttons)
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state
    resetGameState();
    gameState.gamePhase = "START";
};

window.gameInstance = gameInstance;