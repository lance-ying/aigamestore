/**
 * Main Game Loop and p5 instance setup.
 * Integrates all modules and handles the high-level game flow.
 */

import { gameState, resetGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Player } from './entities.js';
import { initWorld, renderWorld } from './world.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { updateParticles } from './particles.js';
import { screenShake, isOnScreen } from './utils.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
        
        resetGameState();
        
        // Initial log
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

        // Input Handling for Automated Testing
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.type === 'press') {
                    p.keyCode = action.keyCode;
                    p.keyPressed();
                    // Reset key immediately to simulate press
                    setTimeout(() => p.keyReleased(), 50); 
                } else {
                    // Simulate holding key by manually setting p5 keyIsDown state?
                    // p5 doesn't easily allow mocking keyIsDown.
                    // Instead, we inject into a custom input handler in Player class.
                    // For this architecture, we will simulate by setting a flag in gameState if needed
                    // Or simply modify the p.keyIsDown wrapper if we wrote one.
                    // For simplicity, we'll assume the entity handles movement via direct state check
                    // OR we trigger the logic directly here for test mode:
                    handleTestInput(p, action.keyCode);
                }
            }
        }

        // Render Background (Clear Screen)
        p.background(COLORS.BACKGROUND);

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
                renderGame(p); // Draw game behind overlay
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

    function updateGame(p) {
        // Camera Follow
        if (gameState.player) {
            const targetX = gameState.player.x - CANVAS_WIDTH / 2;
            const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
            
            // Smooth lerp
            gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
            gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
            
            // Bounds check (World size vs Canvas size)
            // Assuming world is large enough
            gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.mapWidth * 40 - CANVAS_WIDTH));
            gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.mapHeight * 40 - CANVAS_HEIGHT));
        }

        // Screen Shake update
        screenShake.update();

        // Update Entities
        gameState.entities.forEach(e => e.update(p));
        gameState.interactables.forEach(i => i.update(p));
        gameState.pickups.forEach(pick => pick.update(p));
        gameState.projectiles.forEach(proj => proj.update(p));
        
        // Update Particles
        updateParticles(p);

        // Cleanup
        gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
        gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
        gameState.projectiles = gameState.projectiles.filter(p => !p.markedForDeletion);
        gameState.pickups = gameState.pickups.filter(p => !p.markedForDeletion);

        // Log Player Info
        if (gameState.player && p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                screen_x: gameState.player.x,
                screen_y: gameState.player.y,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    function renderGame(p) {
        p.push();
        
        // Apply Camera Transformation
        const shake = screenShake.getOffset(p);
        p.translate(-gameState.camera.x + shake.x, -gameState.camera.y + shake.y);

        // Render World
        renderWorld(p);

        // Render Interactables (Bottom layer)
        gameState.interactables.forEach(i => {
            if (isOnScreen(i)) i.render(p);
        });
        
        // Render Pickups
        gameState.pickups.forEach(pick => {
             if (isOnScreen(pick)) pick.render(p);
        });

        // Render Entities
        // Sort by Y for simple depth sorting
        const renderList = [...gameState.entities, ...gameState.projectiles];
        renderList.sort((a, b) => (a.y + a.height) - (b.y + b.height));
        
        renderList.forEach(e => {
            if (isOnScreen(e)) e.render(p);
        });

        p.pop();
    }

    // Input Handlers
    p.keyPressed = function() {
        // Global Keys
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                initWorld(p);
                gameState.gamePhase = "PLAYING";
                p.logs.game_info.push({ data: { gamePhase: "PLAYING" }, framecount: p.frameCount, timestamp: Date.now() });
            }
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
                resetGameState();
                // initWorld(p); // Don't init immediately, go to start
                gameState.gamePhase = "START";
            }
        }
        
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
    
    // Monkey patch keyIsDown for Test Mode
    const originalKeyIsDown = p.keyIsDown;
    let testKeysDown = {};
    
    p.keyIsDown = function(code) {
        if (gameState.controlMode !== "HUMAN") {
            return !!testKeysDown[code];
        }
        return originalKeyIsDown.call(p, code);
    };
    
    function handleTestInput(p, keyCode) {
        testKeysDown = {}; // Reset previous frame's synthetic input
        testKeysDown[keyCode] = true;
    }

    p.keyReleased = function() {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
});

window.gameInstance = gameInstance;

// Control Mode Switcher
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};