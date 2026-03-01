/**
 * Main Game Entry Point.
 */
import { gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, LEVEL_WIDTH } from './globals.js';
import { handleInput, handleKeyPressed, handleKeyReleased, registerResetFunction } from './input.js';
import { Runner, PowerUp } from './entities.js';
import { generateLevel, renderLevel } from './level.js';
import { renderUI } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Register reset for Input module to call
        registerResetFunction((p) => resetGame(p));
        
        // Initial Game Setup
        resetGame(p);
        gameState.gamePhase = "START"; // Override reset setting phase to PLAYING
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = Date.now();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        
        // Background
        p.background(COLORS.background);
        
        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

function resetGame(p) {
    // Reset Game State
    gameState.entities = [];
    gameState.particles = [];
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.aliveCount = 4;
    
    generateLevel();
    
    // Create Player
    gameState.player = new Runner(100, 300, false, 0);
    gameState.entities.push(gameState.player);
    
    // Create Bots
    gameState.entities.push(new Runner(100, 300, true, 1)); // Bot 1
    gameState.entities.push(new Runner(100, 300, true, 2)); // Bot 2
    gameState.entities.push(new Runner(100, 300, true, 3)); // Bot 3
    
    gameState.gamePhase = "START";
    
    // Log
    p.logs.game_info.push({
        data: { message: "Game Reset" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

function updateGame(p) {
    // Update Entities
    gameState.entities.forEach(entity => {
        if (entity.update) entity.update(p);
    });
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let part = gameState.particles[i];
        part.update();
        if (part.dead) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Update Camera
    updateCamera();
    
    // Win/Lose Logic
    if (gameState.player.eliminated) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    } else if (gameState.aliveCount === 1 && !gameState.player.eliminated) {
        // Wait a moment before declaring win?
        // Check if others are truly gone
        const botsAlive = gameState.entities.filter(e => e.isBot && !e.eliminated).length;
        if (botsAlive === 0) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    // Log Player State
    if (gameState.player && !gameState.player.eliminated && p.frameCount % 10 === 0) {
        p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.cameraX,
            screen_y: gameState.player.y - gameState.cameraY,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            velocity_x: gameState.player.vx,
            velocity_y: gameState.player.vy,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

function updateCamera() {
    // Strategy: Follow the leading runner, but keep them on the right side (75% of screen width)
    
    // Find leader (furthest X)
    let maxX = -Infinity;
    gameState.entities.forEach(e => {
        if (e instanceof Runner && !e.eliminated) {
            if (e.x > maxX) maxX = e.x;
        }
    });
    
    if (maxX === -Infinity) return; // Everyone dead
    
    // Desired Camera X: LeaderX - (ScreenW * 0.75)
    // This puts Leader at 75% across the screen.
    const targetCamX = maxX - (CANVAS_WIDTH * 0.75);
    
    // Smooth Lerp (or instant if we want strict enforcement)
    // SpeedRunners is strict. If you fall behind, you die.
    // Let's Lerp fast.
    gameState.cameraX = lerp(gameState.cameraX, targetCamX, 0.1);
    
    // Camera Shake
    if (gameState.cameraShake > 0) {
        gameState.cameraX += (Math.random() - 0.5) * gameState.cameraShake;
        gameState.cameraY += (Math.random() - 0.5) * gameState.cameraShake;
        gameState.cameraShake *= 0.9;
        if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
    }
    
    // Vertical Camera
    // Center vertically on player roughly, but clamp to level bounds
    // Level is mostly horizontal. Center around Y=200?
    // Let's follow player Y with loose lerp
    if (gameState.player && !gameState.player.eliminated) {
        const targetCamY = gameState.player.y - CANVAS_HEIGHT / 2;
        // Clamp
        // gameState.cameraY = lerp(gameState.cameraY, targetCamY, 0.05);
        // Actually, fixed Y is better for this specific flat runner to avoid motion sickness
        gameState.cameraY = 0; 
    }
}

function renderGame(p) {
    p.push();
    
    // Render Level Geometry
    renderLevel(p);
    
    // Render Dynamic Entities (Powerups, etc are in entities list)
    // Z-sort: items back, players front
    gameState.entities.sort((a, b) => {
        // Simple hack: if runner, high index
        const aScore = a instanceof Runner ? 10 : 0;
        const bScore = b instanceof Runner ? 10 : 0;
        return aScore - bScore;
    });
    
    gameState.entities.forEach(entity => {
        entity.render(p);
    });
    
    // Render Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Attach setControlMode to window for buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    
    // Force reset to apply clean state for testing
    // Access reset via global if needed, or just let user press R.
    // For automation, we often want instant reset.
    if (gameState.gamePhase !== "START") {
        // We can't easily access p here to reset.
        // The buttons are just for switching input logic.
        // User should press R or Enter.
    }
};

window.gameInstance = gameInstance;