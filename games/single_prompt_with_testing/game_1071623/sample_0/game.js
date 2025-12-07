import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level_gen.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { handleInput, keys, INPUT, logInput } from './input.js';

// Setup p5 instance
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
        
        gameState.gamePhase = "START";
        
        // Initialize player for the title screen background or just ready state
        gameState.player = new Player(50, 300);
        
        // Log start
        p.logs.game_info.push({
            event: "initialized",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        
        // Input continuous handling happens in Entity updates, but we can check global hotkeys here
        
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
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
        
        // Camera shake decay
        if (gameState.shake > 0) {
            gameState.shake *= 0.9;
            if (gameState.shake < 0.5) gameState.shake = 0;
        }
    };

    p.keyPressed = function() {
        keys[p.keyCode] = true;
        logInput(p, "press", p.key, p.keyCode);
        
        if (p.keyCode === INPUT.ENTER && gameState.gamePhase === "START") {
            startNewGame();
        }
        
        if (p.keyCode === INPUT.ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === INPUT.R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            startNewGame();
        }
        
        // Level progression on win
        if (p.keyCode === INPUT.SPACE && gameState.gamePhase === "GAME_OVER_WIN") {
            gameState.level++;
            startNewGame();
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        logInput(p, "release", p.key, p.keyCode);
    };
    
    function startNewGame() {
        gameState.gamePhase = "PLAYING";
        
        // Only reset deaths on actual restart, not level progression
        if (gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.score = 0;
            gameState.deaths = 0;
            gameState.level = 1;
        }
        
        generateLevel(gameState.level);
        
        p.logs.game_info.push({
            event: "level_start",
            level: gameState.level,
            timestamp: Date.now()
        });
    }
    
    function updateGame(p) {
        if (gameState.player) gameState.player.update(p);
        
        gameState.hazards.forEach(h => {
            if (h.update) h.update();
        });
        
        // Remove dead enemies
        gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
        gameState.enemies.forEach(e => e.update(p));
        
        // Particles
        gameState.particles = gameState.particles.filter(pt => !pt.markedForDeletion);
        gameState.particles.forEach(pt => pt.update(p));
        
        updateCamera();
    }
    
    function updateCamera() {
        if (!gameState.player) return;
        
        // Smooth follow
        let targetX = gameState.player.x - CANVAS_WIDTH * 0.3;
        // Clamp
        targetX = Math.max(0, Math.min(targetX, gameState.worldWidth - CANVAS_WIDTH));
        
        // Lerp
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
        
        // Y follow with more buffer
        let targetY = gameState.player.y - CANVAS_HEIGHT * 0.5;
        // Clamp Y mostly to prevent seeing below world, but allow climbing
        targetY = Math.max(-500, Math.min(targetY, 100)); // Arbitrary vertical limits
        
        gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
    }
    
    function renderGame(p) {
        p.background(COLORS.bg);
        
        p.push();
        // Camera Transform
        let shakeX = (Math.random() - 0.5) * gameState.shake;
        let shakeY = (Math.random() - 0.5) * gameState.shake;
        p.translate(-gameState.cameraX + shakeX, -gameState.cameraY + shakeY);
        
        // Render World
        gameState.platforms.forEach(plat => plat.render(p));
        gameState.hazards.forEach(haz => haz.render(p));
        gameState.enemies.forEach(en => en.render(p));
        if (gameState.goal) gameState.goal.render(p);
        if (gameState.player) gameState.player.render(p);
        gameState.particles.forEach(pt => pt.render(p));
        
        p.pop();
    }
});

// Control Mode Exposer
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
};