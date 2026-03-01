/**
 * Main Game Loop and Entry Point.
 * Sets up p5 instance and orchestrates update/render cycles.
 */
import { 
    gameState, 
    getGameState, 
    resetGameState, 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    COLORS 
} from './globals.js';
import { setupInput, handleInput } from './input.js';
import { loadLevel } from './level_generator.js';
import { renderUI } from './ui.js';
import { Player } from './entities.js';

// Get p5 from window
const p5 = window.p5;

// Create the P5 Instance
const gameInstance = new p5((p) => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Input setup
        setupInput(p);
        
        // Log start
        p.logs.game_info.push({
            event: "INITIALIZATION",
            timestamp: Date.now()
        });

        // Initial Reset
        resetGame();
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Background
        p.background(COLORS.background);
        drawBackground(p);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderUI(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderUI(p); // Draws overlay
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                break;
        }

        // Global logging for phase changes (debounce could be added but kept simple)
        if (p.frameCount % 60 === 0) {
            p.logs.game_info.push({
                phase: gameState.gamePhase,
                score: gameState.score,
                timestamp: Date.now()
            });
        }
    };
});

function resetGame() {
    resetGameState();
    loadLevel(); // Re-generates entities
}

// Expose reset for R key
window.resetGameInstance = resetGame;

// Set control mode globally
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    // Update active button styles
    document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id.includes(mode === 'HUMAN' ? 'human' : mode === 'TEST_1' ? 'test_1' : 'test_2')) {
            btn.classList.add('active');
        }
    });
    // Reset game on mode switch to ensure fair test
    resetGame();
    gameState.gamePhase = "PLAYING"; // Auto-start for tests
};

function updateGame(p) {
    // Process Inputs
    handleInput(p);
    
    // Update Entities
    gameState.entities.forEach(entity => {
        if (entity.active) entity.update(p);
    });
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (!part.active) gameState.particles.splice(i, 1);
    }
    
    // Camera Logic (Follow Player)
    if (gameState.player) {
        const targetX = gameState.player.x - CANVAS_WIDTH * 0.3; // Keep player at 30% screen
        gameState.camera.x = p.lerp(gameState.camera.x, targetX, 0.1);
        
        // Clamp Camera
        gameState.camera.x = p.constrain(gameState.camera.x, 0, 3000 - CANVAS_WIDTH);
        gameState.camera.y = 0; // No vertical scrolling for this level design
    }
}

function renderGame(p) {
    // Draw Particles (Behind entities)
    gameState.particles.forEach(part => part.render(p));
    
    // Draw Platforms
    gameState.platforms.forEach(plat => plat.render(p));
    
    // Draw Collectibles
    gameState.collectibles.forEach(col => col.render(p));
    
    // Draw Entities (Player, Enemies)
    gameState.entities.forEach(entity => entity.render(p));
}

function drawBackground(p) {
    // Parallax Stars
    p.push();
    p.noStroke();
    
    // Layer 1 (Slow)
    p.fill(255, 255, 255, 100);
    const offset1 = (gameState.camera.x * 0.1) % CANVAS_WIDTH;
    for(let i=0; i<20; i++) {
        const x = (i * 100 - offset1 + CANVAS_WIDTH) % CANVAS_WIDTH;
        const y = (Math.sin(i)*200 + CANVAS_HEIGHT/2);
        p.circle(x, y, 2);
    }
    
    // Layer 2 (Faster)
    p.fill(255, 255, 255, 50);
    const offset2 = (gameState.camera.x * 0.5) % CANVAS_WIDTH;
    for(let i=0; i<10; i++) {
        const x = (i * 150 - offset2 + CANVAS_WIDTH) % CANVAS_WIDTH;
        const y = (Math.cos(i)*100 + 100);
        p.circle(x, y, 4);
    }
    
    p.pop();
}

// Expose instance
window.gameInstance = gameInstance;