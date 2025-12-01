/**
 * Main Game Loop
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, getGameState } from './globals.js';
import { Player, Projectile } from './entities.js';
import { handleKeyPress, handleKeyRelease, isInputActive, isInputTriggered, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_R } from './input.js';
import { updateGamePhysics } from './physics.js';
import { initLevel, updateLevelGeneration, handleScrolling } from './level_gen.js';
import { renderStartScreen, renderBackground, renderUI, renderGameOver, renderPausedOverlay } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize logging
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Game State Log
        p.logs.game_info.push({ event: "Setup Complete", timestamp: Date.now() });
        
        // Set window control mode handler
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to: " + mode);
            // Reset game for clean test
            resetGame();
        };
        
        resetGame();
    };

    function resetGame() {
        gameState.score = 0;
        gameState.worldTheme = "GRASS";
        gameState.frameCount = 0;
        
        // Setup Entities
        gameState.player = new Player(CANVAS_WIDTH/2, 300);
        initLevel();
        
        // Ensure phase is reset if not in start
        if(gameState.gamePhase.startsWith("GAME_OVER")) {
            gameState.gamePhase = "START";
        }
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        
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
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                checkRestart();
                break;
        }
    };

    function updateGame(p) {
        const player = gameState.player;
        
        // Input Handling for Player Movement
        player.vx = 0;
        if (isInputActive(KEY_LEFT)) {
            player.vx = -6; // PLAYER_SPEED
            player.facing = -1;
        }
        if (isInputActive(KEY_RIGHT)) {
            player.vx = 6;
            player.facing = 1;
        }
        
        // Shooting
        // Rate limiting logic would go here, simplified for now
        if (isInputTriggered(KEY_SPACE)) {
            // Check cooldown if needed, but for now allow rapid fire or rely on key repeat
            // To prevent beam spam on bot, we can add a frame check
            if (p.frameCount % 10 === 0 || !gameState.controlMode.startsWith("TEST")) {
                 gameState.projectiles.push(new Projectile(player.x, player.y - 10));
            }
        }

        // Entity Updates
        player.update(p);
        gameState.platforms.forEach(pl => pl.update());
        gameState.enemies.forEach(en => en.update());
        gameState.projectiles.forEach(pr => pr.update());
        gameState.collectibles.forEach(co => co.update());
        
        // Particle Updates
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }

        // Logic
        updateGamePhysics(p);
        handleScrolling(p);
        updateLevelGeneration();
        
        // Logging
        if (p.frameCount % 10 === 0) { // Log every 10 frames to save memory
            p.logs.player_info.push({
                screen_x: player.x,
                screen_y: player.y,
                score: gameState.score,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    function renderGame(p) {
        renderBackground(p);
        
        // Draw Order
        gameState.platforms.forEach(pl => pl.render(p));
        gameState.collectibles.forEach(co => co.render(p));
        gameState.enemies.forEach(en => en.render(p));
        gameState.projectiles.forEach(pr => pr.render(p));
        if (gameState.player && !gameState.player.isDead) gameState.player.render(p);
        gameState.particles.forEach(ps => ps.render(p));
    }
    
    function checkRestart() {
        if (p.keyIsDown(KEY_R)) {
            resetGame();
            gameState.gamePhase = "START";
        }
    }

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

window.gameInstance = gameInstance;