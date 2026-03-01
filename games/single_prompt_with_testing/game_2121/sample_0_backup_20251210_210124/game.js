// Main Game Loop

import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, STAGE_BOUNDS, COLORS } from './globals.js';
import { Platform, Player, Enemy, Projectile } from './entities.js';
import { handleKeyDown, handleKeyUp, clearInputs } from './input.js';
import { renderHUD, renderStartScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { checkBlastZone } from './physics.js';

const p5 = window.p5;

let gameInstance = new p5(p => {

    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        resetGameState();
        
        // Expose control mode setter for UI buttons
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // If setting test mode during play, ensure it takes effect
        };

        p.logs.game_info.push({
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    function initLevel() {
        gameState.entities = [];
        gameState.platforms = [];
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.enemies = [];
        
        // Create Stage (Battlefield Layout)
        // Main Platform
        gameState.platforms.push(new Platform(150, 300, 300, 20));
        // Side Platforms
        gameState.platforms.push(new Platform(100, 200, 80, 10));
        gameState.platforms.push(new Platform(420, 200, 80, 10));
        // Top Platform
        gameState.platforms.push(new Platform(260, 120, 80, 10));

        // Create Player
        gameState.player = new Player(300, 200);
        gameState.entities.push(gameState.player);

        // Wave 1
        spawnWave(1);
    }

    function spawnWave(waveNum) {
        const count = Math.ceil(waveNum * 1.5);
        for(let i=0; i<count; i++) {
            const ex = Math.random() > 0.5 ? 50 : 550;
            const ey = 50;
            const enemy = new Enemy(ex, ey);
            gameState.enemies.push(enemy);
            gameState.entities.push(enemy);
        }
    }

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Render Background
        p.background(COLORS.BACKGROUND);
        
        // Handle Game Phases
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
            // Check for restart signal
            if (p.keyIsDown(13)) { // Check logical transition if managed elsewhere
                initLevel();
            }
        } 
        else if (gameState.gamePhase === "PLAYING") {
            // Camera Shake logic
            let shakeX = 0;
            let shakeY = 0;
            if (gameState.camera.shake > 0) {
                shakeX = p.random(-gameState.camera.shake, gameState.camera.shake);
                shakeY = p.random(-gameState.camera.shake, gameState.camera.shake);
                gameState.camera.shake *= 0.9;
                if (gameState.camera.shake < 0.5) gameState.camera.shake = 0;
            }

            p.push();
            p.translate(shakeX, shakeY);

            // Update & Render Entities
            // Platforms
            gameState.platforms.forEach(plat => plat.render(p));

            // Particles
            for (let i = gameState.particles.length - 1; i >= 0; i--) {
                let part = gameState.particles[i];
                part.update();
                part.render(p);
                if (part.isDead()) gameState.particles.splice(i, 1);
            }

            // Projectiles
            for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
                let proj = gameState.projectiles[i];
                proj.update(p);
                proj.render(p);
                if (proj.toRemove) gameState.projectiles.splice(i, 1);
            }

            // Enemies
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                let enemy = gameState.enemies[i];
                enemy.update(p);
                enemy.render(p);
                if (enemy.toRemove) {
                    gameState.enemies.splice(i, 1);
                    // Also remove from main entities list
                    const idx = gameState.entities.indexOf(enemy);
                    if (idx > -1) gameState.entities.splice(idx, 1);
                    gameState.score += 100;
                }
            }

            // Player
            if (gameState.player) {
                gameState.player.update(p);
                gameState.player.render(p);
                
                if (gameState.player.toRemove) {
                    gameState.gamePhase = "GAME_OVER_LOSE";
                }
            }

            // Wave Management
            if (gameState.enemies.length === 0) {
                gameState.wave++;
                spawnWave(gameState.wave);
            }

            p.pop();

            renderHUD(p);
        } 
        else if (gameState.gamePhase === "PAUSED") {
            // Render last frame state frozen
            gameState.platforms.forEach(plat => plat.render(p));
            gameState.entities.forEach(ent => ent.render(p));
            renderHUD(p);
            renderPausedScreen(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             renderHUD(p);
             renderGameOverScreen(p);
        }
    };

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
        // Special case handling for init on transition
        if (p.keyCode === 13 && gameState.gamePhase === "PLAYING" && gameState.frameCount < 100) {
           // Ensure level is init if transitioning from start
           if (gameState.entities.length === 0) initLevel();
        }
        // Handle restart immediate logic if needed, but R key sets phase to START
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;