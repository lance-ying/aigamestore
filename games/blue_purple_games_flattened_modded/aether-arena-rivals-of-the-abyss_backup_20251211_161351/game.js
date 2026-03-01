// Main Game Loop

import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, STAGE_BOUNDS, COLORS } from './globals.js';
import { Platform, Player, Enemy, Projectile } from './entities.js';
import { handleKeyDown, handleKeyUp, clearInputs } from './input.js';
import { renderHUD, renderStartScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { checkBlastZone } from './physics.js';
import { createExplosion } from './particles.js'; // Import createExplosion

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
            // Remove focus from button so keyboard works immediately
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        p.logs.game_info.push({
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    function initLevel() {
        // Reset Game Stats
        gameState.wave = 1;
        gameState.score = 0;
        gameState.levelPhase = 1;
        gameState.camera = { x: 0, y: 0, shake: 0 };

        gameState.entities = [];
        gameState.platforms = [];
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.enemies = [];
        
        setupPlatformsPhase1();

        // Create Player
        gameState.player = new Player(300, 200);
        gameState.entities.push(gameState.player);

        // Wave 1
        spawnWave(1);
    }

    function setupPlatformsPhase1() {
        gameState.platforms = [];
        // Main Platform
        gameState.platforms.push(new Platform(150, 300, 300, 20));
        // Side Platforms
        gameState.platforms.push(new Platform(100, 200, 80, 10));
        gameState.platforms.push(new Platform(420, 200, 80, 10));
        // Top Platform
        gameState.platforms.push(new Platform(260, 120, 80, 10));
    }

    function setupPlatformsPhase2() {
        gameState.platforms = [];
        // Two split islands
        gameState.platforms.push(new Platform(50, 300, 200, 20));
        gameState.platforms.push(new Platform(350, 300, 200, 20));
        
        // Higher floating platforms
        gameState.platforms.push(new Platform(200, 180, 200, 10));
        gameState.platforms.push(new Platform(20, 120, 60, 10));
        gameState.platforms.push(new Platform(520, 120, 60, 10));
    }

    function changeLevelPhase(phase) {
        gameState.levelPhase = phase;
        if (phase === 2) {
            setupPlatformsPhase2();
            // Reposition player safely
            if (gameState.player) {
                gameState.player.x = 100;
                gameState.player.y = 200;
                gameState.player.vx = 0;
                gameState.player.vy = 0;
            }
            createExplosion(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 50, 'SMOKE');
        }
    }

    function spawnWave(waveNum) {
        // Level Transition Logic
        if (waveNum === 4 && gameState.levelPhase === 1) {
            changeLevelPhase(2);
        }

        const count = Math.ceil(waveNum * 1.5);
        
        for(let i=0; i<count; i++) {
            const ex = Math.random() > 0.5 ? 50 : 550;
            const ey = 50;
            
            let type = 'NORMAL';
            
            // Enemy Variety Logic
            if (waveNum >= 3) {
                const rand = Math.random();
                if (waveNum === 3) {
                    if (rand < 0.3) type = 'FAST';
                } else if (waveNum >= 4) {
                    if (rand < 0.2) type = 'HEAVY';
                    else if (rand < 0.5) type = 'FAST';
                }
            }

            const enemy = new Enemy(ex, ey, type);
            gameState.enemies.push(enemy);
            gameState.entities.push(enemy);
        }
    }

    function drawBackground() {
        if (gameState.levelPhase === 2) {
            // Gradient Background for Phase 2
            let ctx = p.drawingContext;
            let grd = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            
            // Convert array colors to CSS strings
            const c1 = COLORS.BACKGROUND_PHASE2_TOP;
            const c2 = COLORS.BACKGROUND_PHASE2_BOT;
            
            grd.addColorStop(0, `rgb(${c1[0]}, ${c1[1]}, ${c1[2]})`);
            grd.addColorStop(1, `rgb(${c2[0]}, ${c2[1]}, ${c2[2]})`);
            
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
            p.background(COLORS.BACKGROUND);
        }
    }

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Render Background
        drawBackground();
        
        // Handle Game Phases
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
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
        const prevPhase = gameState.gamePhase;
        handleKeyDown(p, p.keyCode);
        
        // Detect transition from START to PLAYING to initialize level
        if (prevPhase === "START" && gameState.gamePhase === "PLAYING") {
            initLevel();
        }
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;