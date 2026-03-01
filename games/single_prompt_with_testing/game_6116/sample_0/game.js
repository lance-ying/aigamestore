// game.js
// Main Game Loop and p5 Instance Configuration

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, 
    resetGameState, getGameState
} from './globals.js';
import { Player } from './entities.js';
import { generateWorld, updateCamera } from './world.js';
import { resolveCollisions, applyPhysics } from './physics.js';
import { setupInputHandlers, handleInput } from './input.js';
import { renderUI } from './ui.js';
import { ParticleSystem } from './particles.js';
import { get_automated_testing_action } from './automated_test.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Init Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        setupInputHandlers(p);
        
        // Initial Reset
        resetGame();
        
        // Log Start
        p.logs.game_info.push({
            event: "Initialization",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // --- UPDATE PHASE ---
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
            updateGame(p);
        } else if (gameState.gamePhase === GAME_PHASES.START) {
            // Nothing to update in start screen
        }

        // --- RENDER PHASE ---
        // 1. Background
        drawBackground(p);

        // 2. World Rendering (Camera transformed)
        if (gameState.gamePhase !== GAME_PHASES.START) {
            // Apply Camera Transform logic manually for entities
            // We pass camera coordinates to render methods to keep p.push/pop clean
            const cx = gameState.camera.x;
            const cy = gameState.camera.y;

            // Render Decorations
            if (gameState.decorations) {
                gameState.decorations.forEach(d => d.render(p, cx, cy));
            }

            // Render Platforms
            if (gameState.platforms) {
                gameState.platforms.forEach(plat => plat.render(p, cx, cy));
            }

            // Render Goal
            if (gameState.goalPosition) {
                p.push();
                p.translate(gameState.goalPosition.x - cx, gameState.goalPosition.y - cy);
                p.fill(255, 215, 0);
                p.noStroke();
                // Pulsing
                const s = 20 + Math.sin(p.frameCount * 0.1) * 5;
                p.circle(0, 0, s);
                p.pop();
            }

            // Render Player
            if (gameState.player) {
                gameState.player.render(p, cx, cy);
            }

            // Render Particles
            gameState.particles.forEach(part => part.render(p, cx, cy));
        }

        // 3. UI Overlay (Screen space)
        renderUI(p);
    };
    
    // --- Game Logic Functions ---
    
    function updateGame(p) {
        if (!gameState.player) return;

        // 1. Update Player Logic (State machine, inputs)
        gameState.player.update(p);
        
        // 2. Apply Physics (Gravity)
        applyPhysics(gameState.player);
        
        // 3. Resolve Collisions (Movement & Walls)
        resolveCollisions(gameState.player, gameState.platforms, p.logs);
        
        // 4. Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // 5. Camera
        updateCamera();
        
        // 6. Check Goal / Win Condition
        if (gameState.goalPosition) {
            const dist = p.dist(
                gameState.player.x + gameState.player.width/2,
                gameState.player.y + gameState.player.height/2,
                gameState.goalPosition.x,
                gameState.goalPosition.y
            );
            if (dist < 30) {
                gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
                p.logs.game_info.push("Player Reached Goal");
            }
        }
        
        // 7. Check Fall (Lose Condition? No, just setback, but track stats)
        // If player falls very far quickly? Just logging.
        
        // Logging
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                vx: gameState.player.vx,
                vy: gameState.player.vy,
                state: gameState.player.state,
                frame: p.frameCount
            });
        }
    }

    function drawBackground(p) {
        // Gradient Background
        // Dark blue at bottom (ground), Black at top (space)
        // Since world is tall, map color to camera Y
        
        let bottomColor = p.color(20, 20, 40);
        let topColor = p.color(0, 0, 10);
        
        // Ratio of camera height to world height
        let ratio = gameState.camera.y / gameState.worldHeight;
        let c = p.lerpColor(topColor, bottomColor, ratio);
        
        p.background(c);
        
        // Grid lines for debug/texture (optional)
        // p.stroke(255, 5);
        // for(let i=0; i<CANVAS_WIDTH; i+=50) p.line(i, 0, i, CANVAS_HEIGHT);
    }
    
    // Helper exposed to window for restart
    p.resetGame = function() {
        resetGame();
    };

});

function resetGame() {
    resetGameState();
    const { groundY } = generateWorld();
    
    // Spawn player at bottom
    gameState.player = new Player(300, groundY - 50);
    gameState.entities.push(gameState.player);
    
    // Center camera on start
    gameState.camera.y = groundY - CANVAS_HEIGHT + 100;
}

// Expose reset globally for input.js and buttons
window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart to apply clean state for testing
    if (mode.startsWith("TEST")) {
        window.gameInstance.resetGame();
        gameState.gamePhase = "PLAYING"; // Auto start for tests
    }
};