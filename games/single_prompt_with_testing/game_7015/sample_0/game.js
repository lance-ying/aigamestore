import { initInput, resetGame } from './input.js';
import { gameState, CONSTANTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, Gem, Projectile, Wall } from './entities.js';
import { checkCollisions } from './physics.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';

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
        
        initInput(p);
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, message: "Setup Complete" },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Visuals
        p.background(50, 60, 70); // Dirt arena color

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                drawGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                drawGame(p);
                renderUI(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                drawGame(p);
                renderGameOver(p);
                break;
        }
    };

    function updateGame(p) {
        // Spawners
        // Gems
        gameState.gemSpawnTimer++;
        if (gameState.gemSpawnTimer >= CONSTANTS.GEM_SPAWN_RATE) {
            // Spawn gem in center area with random jitter
            let gx = CANVAS_WIDTH/2 + (Math.random() - 0.5) * 200;
            let gy = CANVAS_HEIGHT/2 + (Math.random() - 0.5) * 100;
            gameState.gems.push(new Gem(gx, gy));
            gameState.gemSpawnTimer = 0;
        }

        // Enemies
        gameState.enemySpawnTimer++;
        if (gameState.enemySpawnTimer >= CONSTANTS.ENEMY_SPAWN_RATE && gameState.enemies.length < 5) {
            // Spawn at random edge
            let ex, ey;
            if (Math.random() < 0.5) {
                ex = Math.random() < 0.5 ? -20 : CANVAS_WIDTH + 20;
                ey = Math.random() * CANVAS_HEIGHT;
            } else {
                ex = Math.random() * CANVAS_WIDTH;
                ey = Math.random() < 0.5 ? -20 : CANVAS_HEIGHT + 20;
            }
            gameState.enemies.push(new Enemy(ex, ey));
            gameState.enemySpawnTimer = 0;
        }

        // Update Entities
        if (gameState.player) gameState.player.update(p);
        gameState.enemies.forEach(e => e.update(p));
        
        // Update Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            gameState.projectiles[i].update();
            // Bounds check
            let pr = gameState.projectiles[i];
            if (pr.x < -50 || pr.x > CANVAS_WIDTH + 50 || pr.y < -50 || pr.y > CANVAS_HEIGHT + 50 || pr.life <= 0) {
                gameState.projectiles.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }

        // Physics
        checkCollisions(p);

        // Win Logic (Countdown)
        if (gameState.isCountdownActive) {
            gameState.countdownTimer -= 1/60; // Approximate delta
            if (gameState.player.gems < gameState.winningGemCount) {
                gameState.isCountdownActive = false; // Lost gems
            }
            if (gameState.countdownTimer <= 0) {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }

    function drawGame(p) {
        // Draw Walls
        gameState.walls.forEach(w => w.render(p));
        
        // Draw Gems
        gameState.gems.forEach(g => g.render(p));
        
        // Draw Projectiles
        gameState.projectiles.forEach(pr => pr.render(p));
        
        // Draw Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // Draw Player
        if (gameState.player && !gameState.player.isDead) {
            gameState.player.render(p);
        }
        
        // Draw Particles
        gameState.particles.forEach(pt => pt.render(p));
    }

});

window.gameInstance = gameInstance;