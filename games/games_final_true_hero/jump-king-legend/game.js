/**
 * Main Game Entry Point.
 * Sets up p5 instance, game loop, and integrates all systems.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameInfo, WORLD_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { initWorld, updateCamera } from './world.js';
import { handleInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { renderUI } from './ui.js';
import { updateAndRenderParticles } from './particles.js';
// Removed: import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initGame();
        
        // Log start
        logGameInfo(p, "game_info", { 
            event: "INITIALIZATION", 
            gamePhase: gameState.gamePhase 
        });
    };

    function initGame() {
        // Reset State
        gameState.gamePhase = "START";
        gameState.score = 0;
        gameState.currentHeight = 0;
        gameState.attempts = 0;
        gameState.falls = 0;
        gameState.startTime = 0;
        gameState.particles = [];
        
        // Build World
        initWorld();
        
        // Create Player at Bottom
        gameState.player = new Player(100, WORLD_HEIGHT - 100);
        
        // Reset Camera
        gameState.camera.y = WORLD_HEIGHT - CANVAS_HEIGHT;
    }

    p.draw = function() {
        // Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Reset check
        if (gameState.shouldReset) {
            initGame();
            gameState.shouldReset = false;
        }

        // Draw Background
        renderBackground(p);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGameWorld(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderUI(p);
                break;
        }
        
        // Removed: handleAutomatedTesting(p);
    };

    function updateGameLogic(p) {
        // Physics & Entities
        if (gameState.player) {
            gameState.player.update(p);
            
            // Log Player State
            if (p.frameCount % 10 === 0) { // Throttle logging
                logGameInfo(p, "player_info", {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: gameState.player.vx,
                    vy: gameState.player.vy,
                    state: gameState.player.state,
                    onGround: gameState.player.onGround
                });
            }
        }
        
        // Camera
        updateCamera(p);
    }

    function renderBackground(p) {
        // Gradient Sky based on Camera Height
        // Map camera Y to colors
        // Bottom (4000) = Dark Blue/Black
        // Mid (2000) = Light Blue
        // Top (0) = Space Black
        
        const camY = gameState.camera.y;
        let c1, c2;
        
        if (camY > 2000) {
            // Lower Atmosphere
            const t = p.map(camY, 4000, 2000, 0, 1);
            c1 = p.color(10, 10, 30); // Dark Cave
            c2 = p.color(100, 150, 255); // Sky Blue
            p.background(p.lerpColor(c2, c1, t));
        } else {
            // Upper Atmosphere to Space
            const t = p.map(camY, 2000, 0, 0, 1);
            c1 = p.color(100, 150, 255); // Sky Blue
            c2 = p.color(0, 0, 20); // Space
            p.background(p.lerpColor(c1, c2, t));
        }
        
        // Stars/Background elements parallax
        p.push();
        p.translate(0, -camY * 0.1); // Parallax factor
        p.fill(255, 255, 255, 50);
        p.noStroke();
        for(let i=0; i<50; i++) {
            // Deterministic stars
            const x = (i * 137) % CANVAS_WIDTH;
            const y = (i * 243) % CANVAS_HEIGHT; // Repeating pattern
            p.circle(x, y, 2);
        }
        p.pop();
    }

    function renderGameWorld(p) {
        p.push();
        // Apply Camera Transform
        p.translate(-gameState.camera.x, -gameState.camera.y);
        
        // Render Decor (Behind)
        gameState.decorations.forEach(d => d.render(p));
        
        // Render Platforms
        gameState.platforms.forEach(plat => plat.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        // Render Particles
        updateAndRenderParticles(p);
        
        p.pop();
    }

    // Removed: handleAutomatedTesting function
    /*
    function handleAutomatedTesting(p) {
        // If testing mode is active, override keys
        if (gameState.controlMode.startsWith("TEST")) {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Reset keys
                gameState.keys.jump = false;
                gameState.keys.left = false;
                gameState.keys.right = false;
                
                // Apply action
                if (action.keyCode === 32) gameState.keys.jump = true;
                if (action.keyCode === 37) gameState.keys.left = true;
                if (action.keyCode === 39) gameState.keys.right = true;
                
                // Force Start
                if (gameState.gamePhase === "START" && p.frameCount > 60) {
                    gameState.gamePhase = "PLAYING";
                }
            }
        }
    }
    */

    p.keyPressed = function() {
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
});

window.gameInstance = gameInstance;
// Removed: window.setControlMode function
/*
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to clean state
    gameState.shouldReset = true;
};
*/