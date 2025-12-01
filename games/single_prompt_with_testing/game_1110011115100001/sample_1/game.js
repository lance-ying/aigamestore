import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { handleInput, handleKeyPress } from './input.js';
import { applyTestInputs } from './automated_testing_controller.js';
import { drawVectorChar } from './graphics.js';

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
        
        // Initial setup
        gameState.gamePhase = "START";
        
        // Expose helper to set mode
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // Reset game to apply cleanly
            gameState.gamePhase = "START";
        };
        
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
        
        // Clear background
        p.background(COLORS.BACKGROUND);
        
        // Input processing
        if (gameState.controlMode === "HUMAN") {
            handleInput(p);
        } else {
            // Apply automated inputs
            applyTestInputs();
            // Log automated inputs
            if (gameState.keys[39]) logInput(39, "ArrowRight");
            // ... (logging all automated inputs can be verbose, simplifying for this pattern)
        }
        
        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                // Check for start trigger
                if (gameState.keys && (gameState.gamePhase === "START") && (p.keyIsDown(13) || gameState.controlMode !== "HUMAN")) {
                    generateLevel();
                    gameState.gamePhase = "PLAYING";
                }
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Draw game behind overlay
                renderPauseScreen(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
        
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    // Helper to update game logic
    function updateGame(p) {
        // Update Player
        if (gameState.player) {
            gameState.player.update(p);
            
            // Camera follow
            gameState.cameraX = p.lerp(gameState.cameraX, gameState.player.x - CANVAS_WIDTH/3, 0.1);
            // Clamp camera
            gameState.cameraX = Math.max(0, gameState.cameraX);
            
            // Log player
            if (p.frameCount % 60 === 0) {
                 p.logs.player_info.push({
                    screen_x: gameState.player.x - gameState.cameraX,
                    screen_y: gameState.player.y,
                    game_x: gameState.player.x,
                    game_y: gameState.player.y,
                    framecount: gameState.frameCount,
                    timestamp: Date.now()
                });
            }
        }
        
        // Update Entities
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            if (ent.update) ent.update(p);
            
            if (ent.isDead || ent.life <= 0) {
                gameState.entities.splice(i, 1);
            }
        }
        
        // Update Collectibles
        gameState.collectibles.forEach(c => c.update());
    }

    // Helper to render game world
    function renderGame(p) {
        p.push();
        // Camera Transform
        p.translate(-Math.floor(gameState.cameraX), -Math.floor(gameState.cameraY));
        
        // Render World Bounds (Ground)
        p.stroke(COLORS.GROUND);
        p.strokeWeight(2);
        const groundY = CANVAS_HEIGHT - 20;
        p.line(0, groundY, 3000, groundY);
        // Draw decorative grass
        for (let i=0; i<3000; i+=50) {
            if (i > gameState.cameraX - 50 && i < gameState.cameraX + CANVAS_WIDTH + 50) {
                drawVectorChar(p, i, groundY, 'GROUND_GRASS', COLORS.GROUND);
            }
        }
        
        // Render Platforms
        p.stroke(COLORS.PLATFORM);
        p.strokeWeight(2);
        p.noFill();
        gameState.platforms.forEach(plat => {
            // Cull offscreen
            if (plat.x + plat.width > gameState.cameraX && plat.x < gameState.cameraX + CANVAS_WIDTH) {
                drawVectorChar(p, plat.x + plat.width/2, plat.y + 10, 'BLOCK', COLORS.PLATFORM); // Simplified visual
                p.rect(plat.x, plat.y, plat.width, plat.height);
            }
        });
        
        // Render Collectibles
        gameState.collectibles.forEach(c => c.render(p));
        
        // Render Entities
        gameState.entities.forEach(ent => ent.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        p.pop();
    }
    
    function logInput(keyCode, keyName) {
         p.logs.inputs.push({
            input_type: 'automated_hold',
            data: { key: keyName, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
});

window.gameInstance = gameInstance;