// Main Game Module
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, resetGameState } from './globals.js';
import { handleInput } from './input.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOver } from './ui.js';
import { Player } from './entities.js';
import { generateLevel } from './levels.js';
import { constrainToWorld } from './physics.js';
import { updateAutomatedTesting } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Input Handling
        handleInput(p);
        
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
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

        // Draw Background
        drawBackground(p);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderHUD(p); // Show HUD in pause
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        // Automated Testing Hooks
        if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
            updateAutomatedTesting();
        }
    };
});

export function resetGame(p) {
    resetGameState();
    gameState.gamePhase = "START";
    
    // Re-log
    p.logs.game_info.push({
        data: { event: "RESTART" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

function startGame() {
    generateLevel();
    // Spawn player at start
    gameState.player = new Player(50, 300);
    gameState.entities.push(gameState.player);
    gameState.cameraX = 0;
}

// Hook into state change to init game
const originalGamePhase = gameState.gamePhase;
Object.defineProperty(gameState, 'gamePhase', {
    get: function() { return this._gamePhase; },
    set: function(value) {
        this._gamePhase = value;
        if (value === "PLAYING" && !gameState.player) {
            startGame();
        }
    }
});
gameState._gamePhase = "START";


function updateGame(p) {
    // 1. Process Input (Continuous)
    if (gameState.player && gameState.player.isActive) {
        if (gameState.keys[37]) { // Left
            gameState.player.vx -= 1;
            gameState.player.facing = -1;
            // Cap speed
            if(gameState.player.vx < -gameState.player.speed) gameState.player.vx = -gameState.player.speed;
        }
        if (gameState.keys[39]) { // Right
            gameState.player.vx += 1;
            gameState.player.facing = 1;
            if(gameState.player.vx > gameState.player.speed) gameState.player.vx = gameState.player.speed;
        }
    }

    // 2. Update Entities
    // Player
    if (gameState.player) {
        gameState.player.update(p);
        constrainToWorld(gameState.player, gameState.worldWidth, gameState.worldHeight);
        
        // Camera Follow
        const targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3;
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        
        // Clamp Camera
        if (gameState.cameraX < 0) gameState.cameraX = 0;
        if (gameState.cameraX > gameState.worldWidth - CANVAS_WIDTH) gameState.cameraX = gameState.worldWidth - CANVAS_WIDTH;
    }

    // Other Entities
    gameState.entities.forEach(e => {
        if (e !== gameState.player) e.update();
    });

    // Collectibles (Animations)
    gameState.collectibles.forEach(c => {
        // Basic update if needed
    });
    
    // Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead()) gameState.particles.splice(i, 1);
    }
}

function renderGame(p) {
    p.push();
    
    // Apply Camera
    p.translate(-Math.floor(gameState.cameraX), 0);
    
    // Render Tiles (Optimization: Render only visible)
    const viewX = gameState.cameraX;
    gameState.tiles.forEach(tile => {
        if (tile.x + tile.width > viewX && tile.x < viewX + CANVAS_WIDTH) {
            tile.render(p);
        }
    });
    
    // Render Collectibles
    gameState.collectibles.forEach(c => {
        if (c.x > viewX - 50 && c.x < viewX + CANVAS_WIDTH + 50) {
            c.render(p);
        }
    });

    // Render Entities
    gameState.entities.forEach(e => {
        if (e.x > viewX - 100 && e.x < viewX + CANVAS_WIDTH + 100) {
            e.render(p);
        }
    });
    
    // Render Particles
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

function drawBackground(p) {
    // Sky Gradient
    const c1 = p.color(COLORS.SKY_TOP);
    const c2 = p.color(COLORS.SKY_BOTTOM);
    
    for(let y = 0; y < CANVAS_HEIGHT; y+=10) {
        const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        const c = p.lerpColor(c1, c2, inter);
        p.stroke(c);
        p.strokeWeight(10);
        p.line(0, y+5, CANVAS_WIDTH, y+5);
    }
    
    // Parallax Clouds
    p.noStroke();
    p.fill(255, 200);
    const cloudSpeed = gameState.frameCount * 0.2;
    
    p.ellipse((100 + cloudSpeed) % (CANVAS_WIDTH + 200) - 100, 80, 60, 40);
    p.ellipse((130 + cloudSpeed) % (CANVAS_WIDTH + 200) - 100, 90, 70, 50);
    p.ellipse((350 + cloudSpeed * 0.8) % (CANVAS_WIDTH + 200) - 100, 150, 80, 30);
}

// Window Globals for HTML interaction
window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};