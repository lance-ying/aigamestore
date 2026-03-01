/**
 * Main Game Loop and Initialization.
 * Assembles all modules and handles the primary lifecycle of the p5.js instance.
 */

import { gameState, resetGameState, GAME_CONFIG, COLORS, SIDE, KEYS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Tree, WoodChip, FloatingText } from './entities.js';
import { Background } from './background.js';
import { updatePhysics, checkPlayerTreeCollision, getShakeOffset, triggerShake } from './physics.js';
import { renderHUD, renderStartScreen, renderGameOver } from './ui.js';
import { handleKeyPress, handleKeyRelease, consumeInput, inputQueue } from './input.js';
// Removed import for automated_testing_controller.js

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Logging Initialization
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Game State Setup
        resetGameState();
        
        // Create permanent background object
        gameState.background = new Background();
        
        // Initialize Entities for Start Screen
        gameState.tree = new Tree();
        gameState.player = new Player();
        
        // Log Start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time Management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // --- RENDER START ---
        
        // Clear background (Background module handles drawing sky/mountains)
        // If we are in menus, we might draw over it, but we draw it every frame
        
        // 1. Logic Update
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        } else if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            // Handle restart input here to ensure responsiveness
            if (p.keyIsDown(KEYS.R)) {
                 startGame(p);
            }
        }

        // 2. Rendering
        // Apply Screen Shake
        const shake = getShakeOffset(p);
        p.push();
        p.translate(shake.x, shake.y);

        // Render World
        if (gameState.background) gameState.background.render(p);
        
        // Render Tree
        if (gameState.tree) gameState.tree.render(p, COLORS.SEASONS[gameState.currentSeasonIndex]);
        
        // Render Particles (Behind player)
        gameState.particles.forEach(part => part.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        // Render Popups (Front)
        gameState.popups.forEach(pop => pop.render(p));
        
        p.pop(); // End Shake

        // 3. UI Overlay (No Shake)
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                renderHUD(p);
                break;
            case "PAUSED":
                renderHUD(p); // Show HUD in background, but no pause overlay
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderHUD(p);
                renderGameOver(p);
                break;
        }
        
        // Logging Player Info
        if (gameState.gamePhase === "PLAYING" && gameState.player && p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: gameState.player.x,
                screen_y: gameState.player.y,
                score: gameState.score,
                energy: gameState.energy,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

// Game Logic Functions

function startGame(p) {
    resetGameState();
    gameState.gamePhase = "PLAYING";
    
    // Initialize Entities
    gameState.tree = new Tree();
    gameState.player = new Player();
    
    // Keep background consistent or reset clouds? Let's keep clouds flowing.
    // Reset inputs
    inputQueue.length = 0;
    
    p.logs.game_info.push({
        data: { action: "START_GAME" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

function updateGame(p) {
    // 1. Process Input (Human)
    let inputKey = consumeInput(); // Only human input remains
    
    if (inputKey) {
        processPlayerMove(p, inputKey);
    }
    
    // 2. Update Entities
    if (gameState.player) gameState.player.update();
    if (gameState.tree) gameState.tree.update();
    if (gameState.background) gameState.background.update();
    
    // 3. Update Physics / Particles
    updatePhysics(gameState.particles);
    // Remove dead particles
    gameState.particles = gameState.particles.filter(pt => !pt.dead);
    
    // 4. Update Popups
    gameState.popups.forEach(pop => pop.update());
    gameState.popups = gameState.popups.filter(pop => !pop.dead);
    
    // 5. Energy Depletion
    // Depletion rate increases with score
    const currentDepletion = GAME_CONFIG.TIME_DEPLETION_RATE + (gameState.score * GAME_CONFIG.DIFFICULTY_SCALING);
    gameState.energy -= currentDepletion;
    
    if (gameState.energy <= 0) {
        triggerGameOver(p, "TIMEOUT");
    }
}

function processPlayerMove(p, keyCode) {
    if (!gameState.player || !gameState.tree) return;
    
    let moved = false;
    
    // Determine target side
    if (keyCode === KEYS.LEFT) {
        gameState.player.moveTo(SIDE.LEFT);
        moved = true;
    } else if (keyCode === KEYS.RIGHT) {
        gameState.player.moveTo(SIDE.RIGHT);
        moved = true;
    }
    
    if (moved) {
        // Perform Chop
        gameState.player.chop();
        
        // Visuals
        triggerShake(5, 2);
        createChopEffects(p);
        
        // LOGIC:
        // 1. Check if we hit the branch on the CURRENT bottom segment (if we moved into it)
        // Note: Tree logic usually implies you chop the bottom one. 
        // If the bottom one has a branch on Right, and you move to Right, you hit it.
        const currentSeg = gameState.tree.segments[0];
        if (checkPlayerTreeCollision(gameState.player, currentSeg)) {
            triggerGameOver(p, "COLLISION");
            return;
        }
        
        // 2. If safe, execute tree chop (shift down)
        gameState.tree.chop();
        
        // 3. Check collision with the NEW bottom segment (the one that just fell)
        // The tree.chop() shifted the array. So index 0 is now the one that was index 1.
        // It falls instantly in logic, visually interpolated.
        const newSeg = gameState.tree.segments[0];
        if (checkPlayerTreeCollision(gameState.player, newSeg)) {
            triggerGameOver(p, "SQUASHED");
            return;
        }
        
        // 4. Success - Score & Energy
        gameState.score++;
        gameState.energy += GAME_CONFIG.TIME_GAIN_PER_CHOP;
        if (gameState.energy > GAME_CONFIG.MAX_TIME) gameState.energy = GAME_CONFIG.MAX_TIME;
        
        // Popup
        gameState.popups.push(new FloatingText(gameState.player.x, gameState.player.y - 50, "+1", p.color(255, 255, 0)));
    }
}

function createChopEffects(p) {
    // Wood chips flying opposite to player side
    const chipCount = 5;
    const originX = CANVAS_WIDTH / 2;
    const originY = CANVAS_HEIGHT - 60;
    
    for (let i = 0; i < chipCount; i++) {
        // If player is Left, chips fly Right
        const chipSide = (gameState.player.side === SIDE.LEFT) ? SIDE.RIGHT : SIDE.LEFT;
        // Position slightly varied
        const x = originX + (Math.random() * 20 - 10);
        const y = originY + (Math.random() * 20 - 10);
        
        gameState.particles.push(new WoodChip(x, y, chipSide));
    }
}

function triggerGameOver(p, reason) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    if (gameState.player) gameState.player.die();
    
    p.logs.game_info.push({
        data: { action: "GAME_OVER", reason: reason, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
    
    triggerShake(20, 5);
}

// Expose instance
window.gameInstance = gameInstance;

// Removed window.setControlMode as it was only used by test modes and the HTML buttons are removed.