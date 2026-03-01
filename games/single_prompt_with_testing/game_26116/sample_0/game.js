/**
 * Main Game Entry Point
 * 
 * Sets up p5 instance, main loop, and integrates all subsystems.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, getGameState } from './globals.js';
import { updateInputState, handleKeyPressed, handleKeyReleased, KEYS } from './input.js';
import { Player } from './entities.js';
import { World, Room } from './level.js';
import { ParticleSystem } from './particles.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOver, drawScanlines } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.noSmooth();
        p.randomSeed(42);
        
        // Initialize Game
        initGame();
        
        // Log Start
        p.logs.game_info.push({
            event: "GAME_INIT",
            timestamp: Date.now()
        });
    };

    function initGame() {
        gameState.gamePhase = "START";
        gameState.world = new World();
        gameState.currentRoomX = 0;
        gameState.currentRoomY = 0;
        
        // Create Player (Spawn in Room 0,0)
        gameState.player = new Player(50, 300);
        
        gameState.entities = [];
        gameState.particles = new ParticleSystem();
        gameState.collectedItems = [];
        gameState.equippedItemIndex = 0;
        gameState.score = 0;
        
        // Load initial entities
        gameState.world.loadRoomEntities();
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Background
        p.background(COLORS.BACKGROUND);

        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic();
                renderGame(p);
                renderHUD(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                handleRestartLogic();
                break;
        }
        
        // Update input state for 'wasPressed' logic
        updateInputState();
        
        // Automated Testing Hook
        handleAutomatedTesting();
    };

    function updateGameLogic() {
        // Player
        if (gameState.player) gameState.player.update(p);
        
        // Entities
        gameState.entities.forEach(ent => {
            if (ent.active) ent.update(p);
        });
        
        // Clean up inactive entities
        gameState.entities = gameState.entities.filter(ent => ent.active);
        
        // Particles
        gameState.particles.update();
        
        // Log Player Info
        if (gameState.player && p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                room: `${gameState.currentRoomX},${gameState.currentRoomY}`,
                frame: p.frameCount
            });
        }
    }

    function renderGame(p) {
        // Camera Shake
        p.push();
        if (gameState.shakeAmount > 0) {
            p.translate(p.random(-gameState.shakeAmount, gameState.shakeAmount), p.random(-gameState.shakeAmount, gameState.shakeAmount));
            gameState.shakeAmount *= 0.9;
            if (gameState.shakeAmount < 0.5) gameState.shakeAmount = 0;
        }

        // Render World
        const room = gameState.world.getCurrentRoom();
        if (room) room.render(p);
        
        // Render Entities
        // Draw things behind player (e.g. some particles or background props)
        
        gameState.entities.forEach(ent => ent.render(p));
        
        if (gameState.player) gameState.player.render(p);
        
        gameState.particles.render(p);

        // Lighting overlay (Darkness)
        // Simple radial gradient around player
        if (gameState.player) {
            const px = gameState.player.x + gameState.player.width/2;
            const py = gameState.player.y + gameState.player.height/2;
            
            // We simulate darkness by drawing a giant shape with a hole, 
            // or just simple vignette rects. Since we can't use complex shaders easily without separate files:
            // We'll just draw semi-transparent darkness that is less opaque near player.
            // But for performance in p5 2d, per-pixel is slow.
            // We'll skip complex lighting for performance and rely on Scanlines for atmosphere.
        }
        
        p.pop();
        drawScanlines(p);
    }
    
    function handleRestartLogic() {
        if (gameState.shouldRestart) {
            initGame();
            gameState.gamePhase = "PLAYING"; // Skip start screen on restart
            gameState.shouldRestart = false;
        }
    }
    
    function handleAutomatedTesting() {
        if (gameState.controlMode.startsWith("TEST")) {
            const action = get_automated_testing_action();
            if (action) {
                // Simulate press
                p.keyCode = action.keyCode;
                handleKeyPressed(p);
                // For holds, we'd need more complex logic, but this suffices for basic nav
            }
        }
    }

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

window.gameInstance = gameInstance;