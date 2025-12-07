/**
 * Main Game Loop and p5 instance setup.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_HEIGHT, getGameState } from './globals.js';
import { Player } from './entities.js';
import { handleKeyPress, handleKeyRelease, updatePlayerInput } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { loadLevel } from './level_data.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
        
        resetGameLogic();
        
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

        // --- Automated Testing Input Injection ---
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate press/hold
                if (!p.keyIsDown(action.keyCode)) {
                    p.keyCode = action.keyCode;
                    handleKeyPress(p);
                }
            } else {
                // If no action returned, we might need to simulate release if a key was "held" by the tester
                // Ideally the tester sends null to release.
                // Simple implementation: check keys
                 // Note: This simple test controller might not handle complex hold/release perfectly frame-by-frame 
                 // without a persistent virtual keyboard state, but works for basic sequential actions.
            }
            // For release simulation in simple tests:
            if (action === null) {
                // If we were pressing space (32), release it
                if (p.keyIsDown(32)) { p.keyCode = 32; handleKeyRelease(p); }
                if (p.keyIsDown(39)) { p.keyCode = 39; handleKeyRelease(p); }
                if (p.keyIsDown(37)) { p.keyCode = 37; handleKeyRelease(p); }
            }
        }
        // -----------------------------------------

        // Update Logic
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        }

        // Render Logic
        p.background(20, 20, 30); // Clear screen

        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else {
            renderGameWorld(p);
            renderHUD(p);
            
            if (gameState.gamePhase === "PAUSED") {
                renderPausedOverlay(p);
            } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
                renderGameOver(p);
            }
        }
    };

    p.keyPressed = function() {
        if (gameState.controlMode === "HUMAN") {
            handleKeyPress(p);
        }
    };

    p.keyReleased = function() {
        if (gameState.controlMode === "HUMAN") {
            handleKeyRelease(p);
        }
    };
});

function resetGameLogic() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.maxHeight = 0;
    
    // Initialize Level
    loadLevel(gameState);
    
    // Spawn Player at bottom
    // Ground is at WORLD_HEIGHT - 40. Player height is 45.
    // Spawn higher to ensure no initial overlap (WORLD_HEIGHT - 100)
    gameState.player = new Player(100, WORLD_HEIGHT - 100);
    gameState.entities = [gameState.player, ...gameState.platforms, ...gameState.decorations];
    
    gameState.cameraY = WORLD_HEIGHT - CANVAS_HEIGHT;
}

// Expose reset globally
window.resetGame = resetGameLogic;

function updateGame(p) {
    updatePlayerInput(p);
    
    // Update Player
    if (gameState.player) {
        gameState.player.update(p);
    }
    
    // Update Camera (Vertical follow with clamping)
    if (gameState.player) {
        let targetCamY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Clamp to world bounds
        targetCamY = p.constrain(targetCamY, 0, WORLD_HEIGHT - CANVAS_HEIGHT);
        
        // Smooth lerp
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
    }
}

function renderGameWorld(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Render Background Gradient (simulated based on height)
    drawBackground(p);

    // Render Decorations (Behind platforms)
    gameState.decorations.forEach(d => {
        // Simple culling
        if (d.y > gameState.cameraY - 50 && d.y < gameState.cameraY + CANVAS_HEIGHT + 50) {
            d.render(p);
        }
    });

    // Render Platforms
    gameState.platforms.forEach(plat => {
        // Simple culling
        if (plat.y + plat.height > gameState.cameraY && plat.y < gameState.cameraY + CANVAS_HEIGHT) {
            plat.render(p);
        }
    });
    
    // Render Player
    if (gameState.player) gameState.player.render(p);

    p.pop();
}

function drawBackground(p) {
    // Draw gradient rects based on camera height to change atmosphere
    let c1, c2;
    const progress = 1 - (gameState.cameraY / (WORLD_HEIGHT - CANVAS_HEIGHT)); // 0 bottom, 1 top
    
    if (progress < 0.3) {
        // Bottom: Dark Cave
        c1 = p.color(20, 20, 30);
        c2 = p.color(40, 30, 40);
    } else if (progress < 0.7) {
        // Middle: Twilight
        c1 = p.color(40, 30, 60);
        c2 = p.color(80, 50, 80);
    } else {
        // Top: Sky
        c1 = p.color(80, 50, 100);
        c2 = p.color(150, 100, 200);
    }
    
    // Very simple gradient or just solid color lerped
    p.push();
    p.noStroke();
    
    // Draw chunks relative to screen to avoid heavy loop
    p.fill(p.lerpColor(c1, c2, 0.5));
    p.rect(0, gameState.cameraY, CANVAS_WIDTH, CANVAS_HEIGHT); 
    
    p.pop();
}

// Global exposure
window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to ensure clean state for tests
    window.resetGame();
};