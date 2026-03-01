/**
 * game.js
 * Main entry point and game loop.
 */

import { gameState, initLogs, CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { handleKeyPress, handleKeyRelease, processInput } from './input.js';
import { Snake, Block, Food, Wall } from './entities.js';
import { resolveCollisions } from './physics.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Spawning logic variables
    let spawnTimer = 0;
    let nextSpawnTime = 50;

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initialize gameState defaults
        gameState.gamePhase = "START";
        
        // Expose setupGame for resets
        p.setupGame = setupGame;

        // Initialize game state and create player on first load
        setupGame(); 
    };

    // Initialize/Reset game entities
    function setupGame() {
        gameState.reset();
        
        // Create Player
        gameState.player = new Snake(CANVAS_WIDTH / 2, CONFIG.PLAYER_BASE_Y);
        gameState.entities.push(gameState.player);
        
        spawnTimer = 0;
    }

    p.draw = function() {
        // Timekeeping
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Background
        p.background(...COLORS.BACKGROUND);
        
        // Handle Phases
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
                renderPausedOverlay(p);
                renderHUD(p);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p); // Render last frame in background
                renderGameOver(p);
                break;
        }
    };

    function updateGame(p) {
        // Process Inputs
        processInput(p);
        
        // Update Player
        if (gameState.player) {
            gameState.player.update(p);
        }

        // Spawn Entities
        handleSpawning(p);

        // Update Entities (move them down)
        // If hitting a block (isFrozen), entities don't scroll (handled inside entity.update via globals)
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            
            // Skip player in generic update loop if needed, but here player.update is separate
            if (ent === gameState.player) continue;
            
            ent.update(p);
            
            if (ent.toRemove) {
                gameState.entities.splice(i, 1);
                // Also remove from specific lists
                removeFromLists(ent);
            }
        }

        // Physics
        if (gameState.player) {
            resolveCollisions(p, gameState.player);
        }

        // Update Particles
        updateParticles(p);
        
        // Difficulty scaling and Distance Scoring
        if (!gameState.isFrozen) {
            if (gameState.scrollSpeed < CONFIG.MAX_SCROLL_SPEED) {
                gameState.scrollSpeed += CONFIG.SPEED_INCREMENT;
            }
            
            // Distance Calculation and Scoring
            gameState.distanceTraveled += gameState.scrollSpeed;
            
            // Award points for distance (e.g., 1 point every 100 pixels)
            const currentDistScore = Math.floor(gameState.distanceTraveled / 100);
            const prevDistScore = Math.floor((gameState.distanceTraveled - gameState.scrollSpeed) / 100);
            
            if (currentDistScore > prevDistScore) {
                gameState.score += (currentDistScore - prevDistScore);
            }
        }
        
        // Screen Shake decay
        if (gameState.screenShake > 0) {
            p.translate(p.random(-gameState.screenShake, gameState.screenShake), p.random(-gameState.screenShake, gameState.screenShake));
            gameState.screenShake *= 0.9;
        }
    }

    function renderGame(p) {
        p.push();
        // Screen shake transform applied in update affecting draw matrix? 
        // p5 transforms reset every draw. We need to apply it here.
        if (gameState.screenShake > 0) {
            p.translate(p.random(-gameState.screenShake, gameState.screenShake), p.random(-gameState.screenShake, gameState.screenShake));
        }

        // Render Walls first (behind)
        gameState.walls.forEach(w => w.render(p));
        
        // Blocks
        gameState.blocks.forEach(b => b.render(p));
        
        // Food
        gameState.foods.forEach(f => f.render(p));
        
        // Player
        if (gameState.player) gameState.player.render(p);
        
        // Particles (on top)
        renderParticles(p);
        
        p.pop();
    }

    function handleSpawning(p) {
        // Only spawn if world is moving
        if (gameState.isFrozen) return;

        spawnTimer++;
        if (spawnTimer > nextSpawnTime) {
            spawnRow(p);
            spawnTimer = 0;
            nextSpawnTime = p.random(CONFIG.SPAWN_INTERVAL_MIN, CONFIG.SPAWN_INTERVAL_MAX);
        }
    }

    function spawnRow(p) {
        const pattern = Math.floor(p.random(4));
        const laneWidth = CANVAS_WIDTH / CONFIG.LANE_COUNT;
        
        // Always spawn vertical walls between lanes occasionally
        if (p.random() < 0.3) {
            const wallX = Math.floor(p.random(1, CONFIG.LANE_COUNT)) * laneWidth;
            const wall = new Wall(wallX, -300, 300); // Start offscreen
            gameState.walls.push(wall);
            gameState.entities.push(wall);
        }

        const startY = -100;
        // Base value for blocks scales with score
        const baseVal = 5 + Math.floor(gameState.score / 20);

        if (pattern === 0) {
            // Full row of blocks (High density)
            for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
                // Randomize values, ensure at least one is somewhat breakable
                let val = Math.floor(p.random(baseVal, baseVal + 25));
                if (i === Math.floor(p.random(CONFIG.LANE_COUNT))) val = Math.floor(p.random(1, baseVal));
                
                const block = new Block(i * laneWidth + (laneWidth - CONFIG.BLOCK_SIZE)/2, startY, val);
                gameState.blocks.push(block);
                gameState.entities.push(block);
            }
        } else if (pattern === 1) {
            // Scattered blocks and food (Medium density)
            for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
                if (p.random() < 0.7) { // 70% chance of block
                    const val = Math.floor(p.random(baseVal, baseVal + 15));
                    const block = new Block(i * laneWidth + (laneWidth - CONFIG.BLOCK_SIZE)/2, startY, val);
                    gameState.blocks.push(block);
                    gameState.entities.push(block);
                } else {
                    const val = Math.floor(p.random(1, 5));
                    const food = new Food(i * laneWidth + laneWidth/2, startY, val);
                    gameState.foods.push(food);
                    gameState.entities.push(food);
                }
            }
        } else if (pattern === 2) {
            // Pyramid / High Density Blocks
            const center = Math.floor(CONFIG.LANE_COUNT / 2);
            for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
                // Blocks in middle, food on sides
                if (Math.abs(i - center) <= 1) {
                    const val = Math.floor(p.random(baseVal + 10, baseVal + 40));
                    const block = new Block(i * laneWidth + (laneWidth - CONFIG.BLOCK_SIZE)/2, startY, val);
                    gameState.blocks.push(block);
                    gameState.entities.push(block);
                } else {
                    const val = Math.floor(p.random(2, 6));
                    const food = new Food(i * laneWidth + laneWidth/2, startY, val);
                    gameState.foods.push(food);
                    gameState.entities.push(food);
                }
            }
        } else {
            // Mostly Food (Low density blocks)
            for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
                if (p.random() < 0.3) {
                    const val = Math.floor(p.random(baseVal, baseVal + 10));
                    const block = new Block(i * laneWidth + (laneWidth - CONFIG.BLOCK_SIZE)/2, startY, val);
                    gameState.blocks.push(block);
                    gameState.entities.push(block);
                } else if (p.random() < 0.8) {
                    const val = Math.floor(p.random(1, 4));
                    const food = new Food(i * laneWidth + laneWidth/2, startY, val);
                    gameState.foods.push(food);
                    gameState.entities.push(food);
                }
            }
        }
    }

    function removeFromLists(ent) {
        let idx = gameState.blocks.indexOf(ent);
        if (idx > -1) gameState.blocks.splice(idx, 1);
        
        idx = gameState.foods.indexOf(ent);
        if (idx > -1) gameState.foods.splice(idx, 1);
        
        idx = gameState.walls.indexOf(ent);
        if (idx > -1) gameState.walls.splice(idx, 1);
    }

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
};