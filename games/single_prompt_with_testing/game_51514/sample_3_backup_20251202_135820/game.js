/**
 * Main Game Loop
 * Initializes p5 instance, handles game lifecycle.
 */

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, resetFullGame, COLORS } from './globals.js';
import { initInput, handleKeyPressed, handleKeyReleased, getInputState, clearInputFrame } from './input.js';
import { loadLevel, checkLevelComplete, advanceLevel } from './level_manager.js';
import { updateEntityPhysics, checkCollision } from './physics.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderLevelComplete, renderGameOver } from './ui.js';
import { spawnParticles, updateAndRenderParticles } from './particles.js';

// Setup p5 in instance mode
const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Input
        initInput(p);
        
        // Initial Game State
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            event: "SETUP",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount = p.frameCount;
        
        // Clear input flags at end of frame (handled at bottom) but we need logic first
        
        // Global logic checks (restarts, transitions)
        if (gameState.shouldRestartLevel) {
            loadLevel(gameState.currentLevelIndex);
            gameState.shouldRestartLevel = false;
        }
        if (gameState.shouldNextLevel) {
            advanceLevel();
            gameState.shouldNextLevel = false;
        }
        if (gameState.shouldResetGame) {
            resetFullGame();
            gameState.shouldResetGame = false;
        }

        // --- RENDER & UPDATE ---
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        }
        else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "LEVEL_COMPLETE") {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
            if (gameState.gamePhase === "LEVEL_COMPLETE") {
                renderLevelComplete(p);
            }
        }
        else if (gameState.gamePhase === "PAUSED") {
            renderGame(p); // Render underlying game frozen
            renderPauseScreen(p);
            renderHUD(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p);
            renderGameOver(p);
        }
        
        // Clear frame-specific input flags
        clearInputFrame();
        
        // Log player info periodically
        if (p.frameCount % 60 === 0 && gameState.picos.length > 0) {
            const leader = gameState.picos[0];
            p.logs.player_info.push({
                x: Math.round(leader.x),
                y: Math.round(leader.y),
                state: gameState.gamePhase,
                frame: p.frameCount
            });
        }
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

// Update Loop for Gameplay
function updateGame(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    // Initialize level if needed (first run)
    if (gameState.picos.length === 0 && gameState.walls.length === 0) {
        loadLevel(0);
    }
    
    // Get Input
    const input = getInputState();
    
    // Calculate Squad Center of Mass (for Regroup logic)
    let cx = 0, cy = 0;
    let livePicos = 0;
    gameState.picos.forEach(pico => {
        if (!pico.dead) {
            cx += pico.x + pico.width/2;
            cy += pico.y + pico.height/2;
            livePicos++;
        }
    });
    if (livePicos > 0) {
        cx /= livePicos;
        cy /= livePicos;
    } else {
        // Everyone dead
        gameState.gamePhase = "GAME_OVER_LOSE";
        return;
    }
    
    // Update Camera Target (Smooth Follow)
    gameState.camera.targetX = cx - CANVAS_WIDTH/2;
    // Clamp Camera
    // Assuming level width up to 1000 for scrolling
    // If level is small, center it? Let's just clamp to 0 min.
    gameState.camera.targetX = Math.max(0, gameState.camera.targetX);
    gameState.camera.targetX = Math.min(gameState.camera.targetX, 400); // hardcoded max scroll for now
    
    gameState.camera.x += (gameState.camera.targetX - gameState.camera.x) * 0.1;

    // Update Picos
    gameState.picos.forEach(pico => {
        if (pico.dead) return;
        
        pico.applyInput(input, cx);
        updateEntityPhysics(pico, gameState.walls, gameState.blocks, gameState.picos);
        
        // Check death (fell off world)
        if (pico.y > CANVAS_HEIGHT + 100 || pico.dead) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    });
    
    // Update Blocks
    gameState.blocks.forEach(block => {
        updateEntityPhysics(block, gameState.walls, gameState.blocks, gameState.picos);
    });
    
    // Update Collectibles (Keys)
    gameState.collectibles.forEach(item => {
        item.update(p);
        if (!item.collected && !gameState.hasKey) {
            // Check collision with any pico
            for (let pico of gameState.picos) {
                if (checkCollision(pico, item)) {
                    item.collected = true;
                    gameState.hasKey = true;
                    spawnParticles(item.x + item.width/2, item.y + item.height/2, 'SPARKLE', 10);
                    // Unlock door
                    if (gameState.door) gameState.door.open = true;
                    break;
                }
            }
        }
    });
    
    // Update Door
    if (gameState.door) {
        gameState.door.update();
        if (checkLevelComplete()) {
            gameState.gamePhase = "LEVEL_COMPLETE";
            spawnParticles(gameState.door.x + gameState.door.width/2, gameState.door.y, 'CONFETTI', 30);
        }
    }
}

// Render Loop for Gameplay
function renderGame(p) {
    p.background(COLORS.BACKGROUND);
    
    p.push();
    p.translate(-gameState.camera.x, -gameState.camera.y);
    
    // Render Walls
    gameState.walls.forEach(w => w.render(p));
    
    // Render Door (Back layer)
    if (gameState.door) gameState.door.render(p);
    
    // Render Collectibles
    gameState.collectibles.forEach(c => c.render(p));
    
    // Render Blocks
    gameState.blocks.forEach(b => b.render(p));
    
    // Render Picos
    gameState.picos.forEach(pic => pic.render(p));
    
    // Render Particles
    updateAndRenderParticles(p);
    
    p.pop();
}

window.gameInstance = gameInstance;