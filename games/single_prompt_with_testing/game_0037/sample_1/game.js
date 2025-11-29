// game.js - Main entry point
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, getGameState } from './globals.js';
import { handleInput, registerKeyPress, registerKeyRelease } from './input.js';
import { loadLevel, renderLevel } from './level.js';
import { renderUI, renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';
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
        
        gameState.gamePhase = "START";
        gameState.currentLevel = 0;
        
        // Log initial
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Update Game Time (in seconds)
        if (gameState.gamePhase === "PLAYING") {
            gameState.time += 1/60;
        }

        // Draw Logic
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
                renderPausedOverlay(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                renderUI(p);
                break;
        }
    };

    p.keyPressed = function() {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        registerKeyPress(p, p.keyCode);
    };

    p.keyReleased = function() {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        registerKeyRelease(p.keyCode);
    };
});

function updateGame(p) {
    // Update Entities
    // We iterate backwards to allow removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        if (ent.active) {
            ent.update(p);
        } else {
            gameState.entities.splice(i, 1);
        }
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead()) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Camera Follow
    if (gameState.player) {
        // Target: Center player x, slightly look ahead based on facing?
        // Let's keep player in middle third horizontally
        let targetX = gameState.player.x - CANVAS_WIDTH / 2 + (gameState.player.facing * 50);
        let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Smooth
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
        gameState.cameraY += (targetY - gameState.cameraY) * 0.1; // Vertical follow looser
        
        // Clamp
        gameState.cameraX = p.constrain(gameState.cameraX, 0, (gameState.levelWidth * TILE_SIZE) - CANVAS_WIDTH);
        gameState.cameraY = p.constrain(gameState.cameraY, 0, (gameState.levelHeight * TILE_SIZE) - CANVAS_HEIGHT);
        
        // Logging
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: gameState.player.x - gameState.cameraX,
                screen_y: gameState.player.y - gameState.cameraY,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                vx: gameState.player.vx,
                vy: gameState.player.vy,
                state: gameState.player.state,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
}

function renderGame(p) {
    // Sky Background with parallax-ish effect
    p.background(0, 100, 200); // Base Blue
    
    // Clouds (static for now, effectively infinite distance)
    p.noStroke();
    p.fill(255);
    p.ellipse(100, 100, 60, 40);
    p.ellipse(130, 110, 60, 40);
    p.ellipse(400, 80, 80, 50);
    
    p.push();
    p.translate(-Math.floor(gameState.cameraX), -Math.floor(gameState.cameraY));
    
    renderLevel(p);
    
    // Render Entities
    gameState.entities.forEach(ent => ent.render(p));
    
    // Render Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

export function startGame() {
    loadLevel(); // Resets entities and player for current level
    gameState.score = 0;
    gameState.rings = 0;
    gameState.time = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.gamePhase = "PLAYING";
}

export function resetGame(p) {
    // Reset state
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    loadLevel(); // Reloads current level
    gameState.score = 0;
    gameState.rings = 0;
    gameState.time = 0;
    
    gameState.gamePhase = "START";
    
    p.logs.game_info.push({
        data: { action: "RESET" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

// Global hook for buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart to apply cleanly
    if (gameInstance) {
        resetGame(gameInstance);
        // Auto start for tests
        if (mode !== "HUMAN") {
            setTimeout(() => {
                if (gameState.gamePhase === "START") startGame();
            }, 100);
        }
    }
};

window.gameInstance = gameInstance;