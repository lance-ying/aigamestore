import { gameState, logs, CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from './globals.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { LevelGenerator } from './generator.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.randomSeed(42);
        
        // Initialize Game
        window.startLevel(1);
        gameState.gamePhase = "START"; // Override to START screen
        
        // Logging init
        logs.game_info.push({
            data: { phase: gameState.gamePhase },
            frame: p.frameCount,
            time: Date.now()
        });
    };

    p.draw = function() {
        // Update Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Automated Testing
        const autoAction = get_automated_testing_action();
        if (autoAction) {
            p.keyPressed(autoAction.keyCode); // Simulate key press
        }
        
        // Render Background
        p.background(20, 20, 30);
        
        // Phase Handling
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderUI(p);
                renderParticles(p);
                break;
            case "PAUSED":
                renderUI(p); // Render underlying game
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
                renderUI(p);
                renderParticles(p); // Fireworks
                renderGameOver(p);
                updateGame(p); // Keep particles moving
                break;
            case "GAME_OVER_LOSE":
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function(e) {
        // Handle actual keyboard events or simulated ones
        const code = (typeof e === 'number') ? e : e.keyCode;
        
        // Prevent default scrolling for arrows and space
        if (typeof e === 'object' && [32, 37, 38, 39, 40].includes(code)) {
            e.preventDefault();
        }
        
        handleInput(p, code);
    };

    function updateGame(p) {
        updateParticles();
        
        // Logging player state occasionally
        if (p.frameCount % 60 === 0) {
            logs.player_info.push({
                cursor: gameState.cursor,
                flows_completed: gameState.completedColors.length,
                frame: p.frameCount
            });
        }
    }
});

// Helper to start/restart levels
window.startLevel = function(level) {
    gameState.levelIndex = level;
    gameState.gamePhase = "PLAYING";
    gameState.cursor = { x: 0, y: 0, isDrawing: false, drawingColorIndex: -1 };
    gameState.completedColors = [];
    gameState.particles = [];
    
    LevelGenerator.generate(level);
    
    // Log level start
    logs.game_info.push({
        event: "LEVEL_START",
        level: level,
        grid: `${gameState.gridWidth}x${gameState.gridHeight}`,
        time: Date.now()
    });
};

// Global control mode setter
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
    // Focus canvas to ensure keys work immediately
    document.querySelector('canvas').focus();
};

window.gameInstance = gameInstance;