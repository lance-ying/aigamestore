/**
 * game.js
 * Main entry point and game loop.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, FPS, gameState, COLORS, 
    logGameInfo, TILE_SIZE 
} from './globals.js';
import { handleKeyDown, handleKeyUp, clearKeys } from './input.js';
import { Level, TILE } from './level.js';
import { Player, Enemy, Collectible } from './entities.js';
import { updateParticles, renderParticles, spawnParticles } from './particles.js';
import { renderHUD, renderStartScreen, renderPauseScreen, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';
import { constrain, randomChoice, randomRange } from './utils.js';

// Get p5 from window
const p5 = window.p5;

// Global Reset Function
window.resetGame = (p) => {
    // Reset Game State
    gameState.score = 0;
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.items = [];
    gameState.enemies = [];
    gameState.particles = [];
    clearKeys();
    
    // Rebuild Level
    gameState.level = new Level(p);
    
    // Spawn Player
    gameState.player = new Player(gameState.level.startPos.x, gameState.level.startPos.y);
    gameState.camera = { x: 0, y: 0 };
    
    // Spawn Entities
    spawnEntities(p);
};

function spawnEntities(p) {
    gameState.enemies = [];
    gameState.items = [];
    
    const level = gameState.level;
    
    // Scan level for valid spawn points
    for (let x = 1; x < level.cols - 1; x++) {
        for (let y = 1; y < level.rows - 1; y++) {
            const tile = level.getTileAt(x, y);
            const tileBelow = level.getTileAt(x, y + 1);
            
            // Spawn Chance
            if (tile === TILE.EMPTY && (tileBelow === TILE.DIRT || tileBelow === TILE.ROCK)) {
                const rand = p.random();
                
                // Avoid spawn near player
                const d = Math.sqrt(Math.pow(x*TILE_SIZE - gameState.player.x, 2) + Math.pow(y*TILE_SIZE - gameState.player.y, 2));
                if (d < 200) continue;

                if (rand < 0.05) {
                    gameState.enemies.push(new Enemy(x * TILE_SIZE + 5, y * TILE_SIZE, 'SNAKE'));
                } else if (rand < 0.07) {
                    gameState.enemies.push(new Enemy(x * TILE_SIZE + 5, y * TILE_SIZE, 'BAT'));
                } else if (rand < 0.12) {
                    gameState.items.push(new Collectible(x * TILE_SIZE, y * TILE_SIZE, 'GOLD'));
                } else if (rand < 0.13) {
                    gameState.items.push(new Collectible(x * TILE_SIZE, y * TILE_SIZE, 'GEM'));
                }
            }
        }
    }
}

// Instance Mode
let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.randomSeed(42);
        p.noSmooth(); // Pixel art style feel
        
        // Initial setup
        window.resetGame(p);
        gameState.gamePhase = "START"; // Force start screen
        
        logGameInfo(p, { event: "Game Initialized" });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        
        // Clear background
        p.background(COLORS.BACKGROUND);

        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        }
        else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
        }
        else if (gameState.gamePhase === "PAUSED") {
            renderGame(p);
            renderHUD(p);
            renderPauseScreen(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_WIN") {
            renderGame(p);
            renderGameOverScreen(p, true);
        }
        else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p);
            renderGameOverScreen(p, false);
        }
    };

    function updateGame(p) {
        if (!gameState.player) return;

        // Update Player
        gameState.player.update(p);
        
        // Update Enemies
        gameState.enemies.forEach(e => e.update(p));
        // Remove dead enemies
        gameState.enemies = gameState.enemies.filter(e => !e.dead);
        
        // Update Items
        gameState.items.forEach(i => i.update(p));
        gameState.items = gameState.items.filter(i => !i.collected);
        
        // Update Particles
        updateParticles(p);
        
        // Update Camera
        updateCamera();
    }
    
    function updateCamera() {
        // Target is player
        const targetX = gameState.player.x - CANVAS_WIDTH / 2;
        const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Smooth lerp
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
        
        // Clamp to world bounds
        gameState.camera.x = constrain(gameState.camera.x, 0, (gameState.level.cols * TILE_SIZE) - CANVAS_WIDTH);
        gameState.camera.y = constrain(gameState.camera.y, 0, (gameState.level.rows * TILE_SIZE) - CANVAS_HEIGHT);
    }

    function renderGame(p) {
        p.push();
        // Camera Transform
        p.translate(-gameState.camera.x, -gameState.camera.y);
        
        // Render Level
        gameState.level.render(p, gameState.camera);
        
        // Render Items
        gameState.items.forEach(i => i.render(p));
        
        // Render Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // Render Player
        gameState.player.render(p);
        
        // Render Particles
        renderParticles(p);
        
        p.pop();
    }

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;

// Control Mode Setter for HTML buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
    // If switching to test mode, ensure game is running
    if ((mode === 'TEST_1' || mode === 'TEST_2') && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
};