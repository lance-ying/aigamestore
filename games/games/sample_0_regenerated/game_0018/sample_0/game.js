/**
 * Main Game Entry Point
 * Sets up p5 instance, game loop, and state management.
 */
import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed, handleKeyReleased, clearInputBuffer } from './input.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { generateLevel, renderLevel } from './level.js';
import { checkAABB, lerp, constrain } from './utils.js';

// Get p5 from window
const p5 = window.p5;

// Create the game instance
let gameInstance = new p5(p => {
    
    // ----------------------------------------------
    // Setup
    // ----------------------------------------------
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        p.noSmooth(); // Pixel art look
        
        // Initialize Logging
        p.logs = {
            game_info: [],
            inputs: [],
            player_info: []
        };
        
        // Initial Game State
        resetGameState();
        
        // Control mode listener from HTML buttons (if present)
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
        };
        
        // Initial Log
        p.logs.game_info.push({
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    // ----------------------------------------------
    // Main Draw Loop
    // ----------------------------------------------
    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // --- State Machine ---
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                // If this is the first frame of playing (player is null), init level
                if (!gameState.player) {
                    generateLevel();
                }
                updateGameLogic(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Render underlying game frozen
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

        // Cleanup inputs
        clearInputBuffer();
        
        // Logging Game Info occasionally
        if (p.frameCount % 60 === 0) {
            p.logs.game_info.push({
                phase: gameState.gamePhase,
                entities: gameState.entities.length,
                fps: p.frameRate().toFixed(1),
                frame: p.frameCount
            });
            
            if (gameState.player) {
                p.logs.player_info.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    health: gameState.player.health,
                    frame: p.frameCount
                });
            }
        }
    };

    // ----------------------------------------------
    // Game Logic Update
    // ----------------------------------------------
    function updateGameLogic(p) {
        const { player, projectiles, entities, particles } = gameState;

        // 1. Update Player
        if (player.active) {
            player.update();
        }

        // 2. Update Entities (Enemies, Objects)
        // Iterate backwards for safe removal
        for (let i = entities.length - 1; i >= 0; i--) {
            const ent = entities[i];
            ent.update();
            if (!ent.active) {
                entities.splice(i, 1);
            }
        }

        // 3. Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            proj.update();
            if (!proj.active) {
                projectiles.splice(i, 1);
            }
        }

        // 4. Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const part = particles[i];
            part.update();
            if (part.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // 5. Camera Follow
        if (player) {
            // Target position: Player center - half screen
            let targetX = player.x + player.width / 2 - CANVAS_WIDTH / 2;
            let targetY = player.y + player.height / 2 - CANVAS_HEIGHT / 2;

            // Clamping to world bounds
            targetX = constrain(targetX, 0, gameState.levelWidth - CANVAS_WIDTH);
            // targetY = constrain(targetY, 0, gameState.levelHeight - CANVAS_HEIGHT); // Vertical scrolling allowed?

            // Smooth Lerp
            gameState.camera.x = lerp(gameState.camera.x, targetX, 0.1);
            // gameState.camera.y = lerp(gameState.camera.y, targetY, 0.1); // Keep Y steady for now unless vertical level
            
            // Screen Shake
            if (gameState.camera.shakeStrength > 0.1) {
                gameState.camera.x += p.random(-gameState.camera.shakeStrength, gameState.camera.shakeStrength);
                gameState.camera.y += p.random(-gameState.camera.shakeStrength, gameState.camera.shakeStrength);
                gameState.camera.shakeStrength *= gameState.camera.shakeDecay;
            } else {
                gameState.camera.shakeStrength = 0;
            }
        }
    }

    // ----------------------------------------------
    // Rendering
    // ----------------------------------------------
    function renderGame(p) {
        p.push();
        
        // Apply Camera Transform
        p.translate(-Math.floor(gameState.camera.x), -Math.floor(gameState.camera.y));
        
        // Render Level (Background & Platforms)
        renderLevel(p);
        
        // Render Interactive Entities
        gameState.entities.forEach(ent => ent.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        // Render Projectiles
        gameState.projectiles.forEach(proj => proj.render(p));
        
        // Render Particles (on top)
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }

    // ----------------------------------------------
    // Input Bindings
    // ----------------------------------------------
    p.keyPressed = function() {
        handleKeyPressed(p, p.keyCode);
        // Prevent default browser scrolling
        if ([37, 38, 39, 40, 32].includes(p.keyCode)) {
            return false;
        }
    };

    p.keyReleased = function() {
        handleKeyReleased(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;