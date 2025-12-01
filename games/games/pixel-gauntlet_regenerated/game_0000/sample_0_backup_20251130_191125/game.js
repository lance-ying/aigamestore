import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { renderUI, renderStartScreen, renderPaused, renderGameOver, renderLevelComplete } from './ui.js';
import { Player, Enemy } from './entities.js';
import { get_automated_testing_action } from './automated_test.js';

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
        
        p.noSmooth(); // Pixel art feel
        
        // Log Initial State
        p.logs.game_info.push({
            event: "Initial State",
            data: { gamePhase: gameState.gamePhase },
            frame: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        p.background(30, 30, 40); // Dark Blueish bg

        switch (gameState.gamePhase) {
            case GAME_PHASES.START:
                renderStartScreen(p);
                break;
                
            case GAME_PHASES.PLAYING:
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
                
            case GAME_PHASES.PAUSED:
                // Still render game behind overlay
                p.push();
                applyCamera(p);
                renderEntities(p);
                p.pop();
                renderUI(p);
                renderPaused(p);
                break;
                
            case GAME_PHASES.LEVEL_COMPLETE:
                renderGame(p); // Static last frame
                renderUI(p);
                renderLevelComplete(p);
                break;
                
            case GAME_PHASES.GAME_OVER_WIN:
                renderGame(p);
                renderGameOver(p, true);
                break;
                
            case GAME_PHASES.GAME_OVER_LOSE:
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
        
        // Logging Periodically
        if (p.frameCount % 60 === 0 && gameState.player) {
             p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                score: gameState.score,
                frame: p.frameCount,
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

function updateGame(p) {
    if (!gameState.player) return;

    // Update Player
    gameState.player.update(p);

    // Update Entities
    gameState.entities.forEach(entity => {
        if (entity !== gameState.player) {
            entity.update(p);
        }
    });
    
    // Update Particles
    gameState.particles.forEach(particle => particle.update());

    // Clean up dead entities
    gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
    gameState.particles = gameState.particles.filter(pt => pt.life > 0);
    
    // Check Level Completion (All enemies dead in level 1-4, Boss dead in 5)
    // Or reach end of level X coordinate
    checkLevelWinCondition();
    
    // Update Camera
    updateCamera();
}

function updateCamera() {
    // Center on player
    const targetX = gameState.player.x - CANVAS_WIDTH / 3;
    
    // Smooth
    gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
    
    // Clamp
    gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth - CANVAS_WIDTH));
}

function applyCamera(p) {
    p.translate(-gameState.cameraX, 0);
}

function renderGame(p) {
    p.push();
    applyCamera(p);
    
    // Platforms
    gameState.platforms.forEach(pf => pf.render(p));
    
    // Entities (sorted by bottom Y for depth, though simple here)
    gameState.entities.forEach(e => e.render(p));
    
    // Particles
    gameState.particles.forEach(pt => pt.render(p));
    
    p.pop();
}

function renderEntities(p) {
    gameState.platforms.forEach(pf => pf.render(p));
    gameState.entities.forEach(e => e.render(p));
}

function checkLevelWinCondition() {
    // Win by reaching end of level
    // But concept says "Defeat all enemies" or "Reach exit".
    // Let's go with Reach Exit (World Width) IF required enemies are dead.
    
    const enemiesAlive = gameState.entities.filter(e => e instanceof Enemy && !e.isDead).length;
    
    // Specific logic per concept:
    // Lvl 1-4: Defeat enemies? Or just reach end?
    // Concept says "Objective: Defeat all X enemies". 
    // Let's enforce: Must kill all enemies to trigger "Portal/Exit" active or just immediate win?
    // Immediate win is abrupt. Let's say if enemiesAlive == 0, then reaching right edge triggers win.
    
    if (enemiesAlive === 0) {
        // Render an "EXIT" visual indicator at end of world?
        // Implicitly, if player x > worldWidth - 100
        if (gameState.player.x > gameState.worldWidth - 100) {
            gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
        }
    }
}

// Global hook for controls
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

window.gameInstance = gameInstance;