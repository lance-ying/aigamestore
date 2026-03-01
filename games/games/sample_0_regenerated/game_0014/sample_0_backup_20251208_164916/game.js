/**
 * game.js
 * Main entry point. Setup and Game Loop.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, DIFFICULTY_SCALING_RATE, BASE_ENEMY_CREDIT_RATE, COLORS, logGameEvent } from './globals.js';
import { Player, Enemy } from './entities.js';
import { generateLevel } from './level.js';
import { handleInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { resolvePlatformCollision, checkCollision, lerp } from './utils.js';
import { renderHUD, renderStartScreen, renderGameOver } from './ui.js';
import { spawnParticles } from './particles.js';

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
        
        // Initial Log
        logGameEvent(p, 'game', { phase: 'SETUP' });
        
        // Initialize Game
        resetGame();
    };
    
    // Exposed for Restart (use 'p' which is the current p5 instance)
    p.resetGame = resetGame;

    function resetGame() {
        gameState.gamePhase = "START";
        gameState.time = 0;
        gameState.frameCount = 0;
        gameState.difficultyCoeff = 1.0;
        gameState.directorCredits = 0;
        gameState.score = 0;
        
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.enemies = [];
        gameState.items = {};
        
        // Generate World
        generateLevel();
        
        // Spawn Player
        gameState.player = new Player(100, 100);
        
        // Reset Event
        gameState.teleporterState = "IDLE";
        gameState.teleporterCharge = 0;
        
        logGameEvent(p, 'game', { msg: "Game Reset" });
    }

    p.draw = function() {
        // Delta Time
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount++;
        
        p.background(COLORS.background);
        
        // State Machine
        if (gameState.gamePhase === 'PLAYING') {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
        } else if (gameState.gamePhase === 'START') {
            renderStartScreen(p);
        } else if (gameState.gamePhase === 'PAUSED') {
            renderGame(p);
            renderHUD(p);
            // Pause Overlay
            p.fill(0, 0, 0, 150);
            p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            p.fill(255);
            p.textAlign(p.CENTER);
            p.textSize(30);
            p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
            renderGame(p);
            renderGameOver(p);
        }
    };
    
    function updateGame(p) {
        const player = gameState.player;
        const input = handleInput(p);
        
        // Update Time & Difficulty
        gameState.time += 1/60;
        gameState.difficultyCoeff = 1.0 + (gameState.time * 0.05); // Scales faster than generic linear
        
        // Log Inputs
        if (input.keys.jumpPressed || input.keys.shoot || input.keys.dodge) {
             logGameEvent(p, 'input', input.keys);
        }
        
        // Update Player
        player.update(input);
        
        // Handle Interactions (Pressed Down)
        if (input.keys.interactPressed || (gameState.controlMode !== 'HUMAN' && input.keys.interactPressed)) {
            // Find nearby interactable
            for (const item of gameState.interactables) {
                if (item.active && Math.abs(item.x - player.x) < 50 && Math.abs(item.y - player.y) < 50) {
                    item.interact(player);
                    break;
                }
            }
        }
        
        // AI Director (Enemy Spawning)
        updateDirector();
        
        // Update Teleporter Event
        updateTeleporterEvent();
        
        // Update Enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.update();
            if (e.dead) gameState.enemies.splice(i, 1);
        }
        
        // Update Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const proj = gameState.projectiles[i];
            proj.update();
            if (proj.dead) gameState.projectiles.splice(i, 1);
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.life <= 0) gameState.particles.splice(i, 1);
        }
        
        // Camera Follow
        const targetCamX = player.x + player.width/2 - CANVAS_WIDTH/2;
        const targetCamY = player.y + player.height/2 - CANVAS_HEIGHT/2;
        
        gameState.camera.x = lerp(gameState.camera.x, targetCamX, 0.1);
        gameState.camera.y = lerp(gameState.camera.y, targetCamY, 0.1);
        
        // Clamp Camera
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.worldWidth - CANVAS_WIDTH));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.worldHeight - CANVAS_HEIGHT));
        
        // Logging Player
        if (gameState.frameCount % 60 === 0) {
            logGameEvent(p, 'player', { x: player.x, y: player.y, hp: player.health });
        }
    }
    
    function updateDirector() {
        if (gameState.teleporterState === 'CHARGED') return; // Stop spawning after win
        
        // Accumulate credits
        let rate = BASE_ENEMY_CREDIT_RATE * gameState.difficultyCoeff;
        if (gameState.teleporterState === 'CHARGING') rate *= 3; // Intense during event
        
        gameState.directorCredits += rate;
        
        // Spawn Logic
        // Costs: Lemurian: 10, Wisp: 15, Golem: 40
        const spawnList = [
            { type: 'LEMURIAN', cost: 15 },
            { type: 'WISP', cost: 25 },
            { type: 'GOLEM', cost: 60 }
        ];
        
        // Try to spawn expensive things first if difficulty is high
        if (gameState.directorCredits > 10) {
            // Pick random enemy affordable
            const affordable = spawnList.filter(e => e.cost <= gameState.directorCredits);
            if (affordable.length > 0) {
                // 5% chance per frame to actually spawn if can afford, to bunch them up slightly
                if (Math.random() < 0.05) {
                    const choice = affordable[Math.floor(Math.random() * affordable.length)];
                    gameState.directorCredits -= choice.cost;
                    spawnEnemy(choice.type);
                }
            }
        }
    }
    
    function spawnEnemy(type) {
        // Find spawn point off-screen but near player
        const dist = 400; // spawn distance
        const angle = Math.random() * Math.PI * 2;
        const x = gameState.player.x + Math.cos(angle) * dist;
        const y = gameState.player.y + Math.sin(angle) * dist;
        
        // Clamp to world
        const clampedX = Math.max(50, Math.min(x, gameState.worldWidth - 50));
        let clampedY = Math.max(50, Math.min(y, gameState.worldHeight - 50));
        
        // If ground enemy, snap to floor
        if (type !== 'WISP') {
             // quick hack: find nearest platform y below
             // actually, just drop them from sky, they have gravity
             clampedY -= 100;
        }
        
        gameState.enemies.push(new Enemy(clampedX, clampedY, type));
    }
    
    function updateTeleporterEvent() {
        if (gameState.teleporterState === 'CHARGING') {
            gameState.teleporterCharge += 0.05; // 0.05 per frame -> ~33 seconds to charge (at 60fps)
            
            // Spawn Boss at 10%
            if (Math.abs(gameState.teleporterCharge - 10) < 0.1 && !gameState.bossSpawned) {
                spawnEnemy('BOSS');
                gameState.bossSpawned = true;
                spawnParticles(gameState.teleporter.x, gameState.teleporter.y, 'EXPLOSION', 20);
            }
            
            if (gameState.teleporterCharge >= 100) {
                gameState.teleporterCharge = 100;
                // Check if boss is dead
                const bossAlive = gameState.enemies.some(e => e.enemyType === 'BOSS');
                if (!bossAlive) {
                    gameState.teleporterState = 'CHARGED';
                    gameState.gamePhase = 'GAME_OVER_WIN';
                }
            }
        }
    }
    
    function renderGame(p) {
        const cx = gameState.camera.x;
        const cy = gameState.camera.y;
        
        p.push();
        
        // Background Parallax (Stars)
        p.fill(200);
        for(let i=0; i<50; i++) {
            const sx = (i * 137) % CANVAS_WIDTH;
            const sy = (i * 243) % CANVAS_HEIGHT;
            p.circle(sx, sy, 1);
        }
        
        // World Objects
        p.fill(COLORS.ground);
        p.noStroke();
        gameState.platforms.forEach(plat => {
            if (plat.x - cx < CANVAS_WIDTH && plat.x + plat.width - cx > 0) {
                p.rect(plat.x - cx, plat.y - cy, plat.width, plat.height);
            }
        });
        
        // Entities
        gameState.interactables.forEach(i => i.render(p, cx, cy));
        gameState.enemies.forEach(e => e.render(p, cx, cy));
        gameState.player.render(p, cx, cy);
        gameState.projectiles.forEach(pr => pr.render(p, cx, cy));
        gameState.particles.forEach(pt => pt.render(p, cx, cy));
        
        p.pop();
    }

    p.keyPressed = function() {
        handleKeyPressed(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyReleased(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply mode cleanly
    window.gameInstance.resetGame(); // Access through window.gameInstance
    gameState.gamePhase = "PLAYING"; // Auto start
};