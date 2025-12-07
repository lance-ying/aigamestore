/**
 * game.js
 * Main entry point, game loop, and initialization.
 */

import { 
    gameState, getGameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, 
    WORLD_COLS, WORLD_ROWS 
} from './globals.js';
import { initInput, updateInputState } from './input.js';
import { Player } from './entities.js';
import { generateLevel } from './level_gen.js';
import { checkMapCollision } from './physics.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { updateAutomatedInput } from './automated_testing_controller.js';

// p5.js Instance
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        p.noSmooth(); // Pixel art feel
        
        initInput(p);
        
        // Initial Log
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
        
        gameState.gamePhase = "START";
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Input processing
        updateInputState();
        updateAutomatedInput(); // Override if in test mode

        // Restart Handler
        if (gameState.shouldRestart) {
            gameState.shouldRestart = false;
            resetGame();
            gameState.gamePhase = "START";
        }

        // Render Background
        p.background(COLORS.BACKGROUND);
        
        // State Machine
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
                renderGame(p); // Draw game frozen in background
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
    };
    
    function resetGame() {
        resetGameState();
        // Regeneration happens when transitioning from START to PLAYING usually, 
        // but for R restart we do it here or defer to start.
        // Actually, let's just ready the state.
    }
    
    function startGame() {
        resetGameState();
        generateLevel(1);
        gameState.player = new Player(gameState.playerStart.x, gameState.playerStart.y);
        gameState.entities.push(gameState.player);
        
        p.logs.game_info.push({
            event: "Level Generated",
            level: 1,
            seed: 42
        });
    }
    
    // Check if we need to start the game logic
    // This is a bit of a hack to detect the phase change edge
    let prevPhase = "START";
    p.registerMethod('pre', () => {
        if (prevPhase === "START" && gameState.gamePhase === "PLAYING") {
            startGame();
        }
        prevPhase = gameState.gamePhase;
    });

    function updateGame(p) {
        // Update Entities
        // Backwards loop for safe deletion
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            ent.update(p);
            if (ent.markedForDeletion) {
                gameState.entities.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.markedForDeletion) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Update Floating Text
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            gameState.floatingTexts[i].update();
            if (gameState.floatingTexts[i].life <= 0) {
                gameState.floatingTexts.splice(i, 1);
            }
        }
        
        // Camera Logic
        if (gameState.player) {
            // Target position (centered on player)
            let targetX = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
            let targetY = gameState.player.y - CANVAS_HEIGHT / 2 + gameState.player.height / 2;
            
            // Smooth follow
            gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
            gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
            
            // Apply shake
            if (gameState.camera.shakeStrength > 0) {
                gameState.camera.x += (Math.random() - 0.5) * gameState.camera.shakeStrength;
                gameState.camera.y += (Math.random() - 0.5) * gameState.camera.shakeStrength;
                gameState.camera.shakeStrength *= gameState.camera.shakeDecay;
                if (gameState.camera.shakeStrength < 0.5) gameState.camera.shakeStrength = 0;
            }
            
            // Clamp to world
            gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.worldWidth - CANVAS_WIDTH));
            gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.worldHeight - CANVAS_HEIGHT));
        }
    }

    function renderGame(p) {
        p.push();
        // Apply Camera
        p.translate(-Math.floor(gameState.camera.x), -Math.floor(gameState.camera.y));
        
        // Optimization: Calculate visible tile range
        const startCol = Math.floor(gameState.camera.x / TILE_SIZE);
        const endCol = Math.floor((gameState.camera.x + CANVAS_WIDTH) / TILE_SIZE) + 1;
        const startRow = Math.floor(gameState.camera.y / TILE_SIZE);
        const endRow = Math.floor((gameState.camera.y + CANVAS_HEIGHT) / TILE_SIZE) + 1;
        
        // Render Tiles
        p.noStroke();
        for (let x = startCol; x < endCol; x++) {
            for (let y = startRow; y < endRow; y++) {
                if (x >= 0 && x < WORLD_COLS && y >= 0 && y < WORLD_ROWS) {
                    const tile = gameState.tiles[x][y];
                    if (tile !== 0) {
                        if (tile === 1) p.fill(COLORS.TILE_DIRT);
                        else if (tile === 2) p.fill(COLORS.TILE_STONE);
                        
                        // Simple texture variation
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        
                        // Detail overlay
                        if ((x * y) % 7 === 0) {
                            p.fill(0, 0, 0, 20);
                            p.rect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, 10, 10);
                        }
                    }
                }
            }
        }
        
        // Render Entities
        gameState.entities.forEach(ent => ent.render(p));
        
        // Render Particles
        gameState.particles.forEach(part => part.render(p));
        
        // Render Floating Texts
        gameState.floatingTexts.forEach(txt => txt.render(p));
        
        p.pop();
    }
});

// Expose instance
window.gameInstance = gameInstance;