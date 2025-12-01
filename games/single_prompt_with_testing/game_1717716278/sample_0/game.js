/**
 * Main Game Loop and Initialization
 */
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Composite } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, DAY_DURATION } from './globals.js';
import { Player } from './entities.js';
import { setupPhysics } from './physics.js';
import { TerrainManager } from './terrain.js';
import { renderBackground, renderUI, renderStartScreen, renderGameOver, renderPaused } from './renderer.js';
import { updateCamera } from './camera.js';

// Input tracking
const keys = {
    space: false,
    down: false
};

let terrainManager;

function initializeGame(p) {
    // Reset Game State
    gameState.score = 0;
    gameState.distance = 0;
    gameState.timeRemaining = DAY_DURATION;
    gameState.entities = [];
    gameState.coins = [];
    gameState.isDiving = false;
    
    // Setup Terrain
    if (!terrainManager) {
        terrainManager = new TerrainManager(p);
    }
    terrainManager.reset();
    
    // Create Player
    // Start x=100, y=200 to drop onto first hill
    gameState.player = new Player(p, 100, 0);
    gameState.entities.push(gameState.player);
    
    // Reset Camera
    gameState.cameraX = 0;
    gameState.cameraY = 0;
}

function handleInput(p) {
    // Process input for gameplay
    gameState.isDiving = keys.space || keys.down;
    
    // Test mode inputs (Automation)
    if (gameState.controlMode === 'TEST_1') {
        // Just start and do nothing (gravity test)
    } else if (gameState.controlMode === 'TEST_2') {
        // Auto play logic for testing
        // Simple heuristic: Dive if going down, Glide if going up
        if (gameState.player) {
            const vy = gameState.player.body.velocity.y;
            // Crude assumption: falling/moving down = downslope
            gameState.isDiving = vy > 0;
        }
    }
}

function updateGameLogic(p) {
    // Update Terrain (generation/culling)
    terrainManager.update();
    
    // Update Physics Entities
    gameState.entities.forEach(entity => entity.update());
    
    // Update Camera
    updateCamera();
    
    // Update Game Progress
    if (gameState.player) {
        // Distance score
        const currentDist = Math.max(0, gameState.player.body.position.x);
        gameState.distance = currentDist / 10; // Scale down for meters
        
        // Add distance to score as well roughly
        // gameState.score = Math.floor(gameState.distance) + coins... (coins handled in physics)
        
        // Check "Night" Catch up
        gameState.timeRemaining--;
        if (gameState.timeRemaining <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            logGameState(p, "GAME_OVER_LOSE");
        }
    }
}

function logGameState(p, status) {
    const logEntry = {
        game_status: status || gameState.gamePhase,
        data: {
            score: gameState.score,
            distance: gameState.distance,
            playerX: gameState.player ? gameState.player.body.position.x : 0,
            playerY: gameState.player ? gameState.player.body.position.y : 0
        },
        framecount: p.frameCount,
        timestamp: Date.now()
    };
    p.logs.game_info.push(logEntry);
}

// p5 Instance
let gameInstance = new p5(p => {
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Matter.js setup
        // Increase iterations to prevent tunneling through floor
        const engine = Engine.create({
            positionIterations: 10,
            velocityIterations: 10
        });
        gameState.engine = engine;
        gameState.world = engine.world;
        
        // Physics collision events
        setupPhysics(engine);
        
        // Initialize Logging
        p.logs = {
            game_info: [],
            player_info: [],
            inputs: []
        };
        
        // Initialize game entities
        initializeGame(p);
        
        logGameState(p, "START");
    };
    
    p.draw = function() {
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Logic Step
        if (gameState.gamePhase === "PLAYING") {
            Engine.update(gameState.engine, 1000 / 60);
            handleInput(p);
            updateGameLogic(p);
            
            // Log Player info periodically
            if (p.frameCount % 60 === 0 && gameState.player) {
                p.logs.player_info.push({
                    x: gameState.player.body.position.x,
                    y: gameState.player.body.position.y,
                    velocity: gameState.player.body.velocity,
                    framecount: p.frameCount
                });
            }
        }
        
        // Render Step
        p.push();
        // Camera Transform
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
            renderBackground(p);
            
            p.translate(-gameState.cameraX, -gameState.cameraY);
            
            // Draw Terrain
            if (terrainManager) terrainManager.render(p);
            
            // Draw Entities
            gameState.entities.forEach(entity => entity.render(p));
            
            p.pop(); // Restore camera transform
            
            // UI Overlay
            renderUI(p);
        }
        
        // Phase Overlays
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderPaused(p);
        } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
            renderGameOver(p);
        }
        p.pop();
    };
    
    p.keyPressed = function() {
        // Input Logging
        p.logs.inputs.push({
            type: "keyPressed",
            key: p.key,
            keyCode: p.keyCode,
            framecount: p.frameCount
        });
        
        // Global Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                logGameState(p, "PLAYING");
            }
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase.startsWith("GAME_OVER")) {
                initializeGame(p);
                gameState.gamePhase = "START"; // Go back to start or instant play? Let's go to Start
                logGameState(p, "START");
            }
        }
        
        if (p.keyCode === 27 || p.key === 'p' || p.key === 'P') { // ESC or P
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        // Gameplay Controls
        if (p.key === ' ' || p.keyCode === 32) keys.space = true;
        if (p.keyCode === 40) keys.down = true; // Down Arrow
        
        return false; // Prevent default
    };
    
    p.keyReleased = function() {
        p.logs.inputs.push({
            type: "keyReleased",
            key: p.key,
            keyCode: p.keyCode,
            framecount: p.frameCount
        });
        
        if (p.key === ' ' || p.keyCode === 32) keys.space = false;
        if (p.keyCode === 40) keys.down = false;
        
        return false;
    };
});

// Global helpers for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state for test
    if (gameState.engine) {
        World.clear(gameState.engine.world);
        Engine.clear(gameState.engine);
        // Re-init happens in next loop or manually:
        // Ideally we just reset the phase to start
        gameState.gamePhase = "START";
        initializeGame(gameInstance);
    }
};