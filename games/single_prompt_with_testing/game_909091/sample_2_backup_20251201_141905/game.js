/**
 * Main Game Entry Point
 */
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS 
} from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderUI, renderStartScreen, renderPausedScreen, renderGameOver } from './ui.js';

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
        p.randomSeed(42); // Daily seed
        
        resetGameLogic(p);
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        p.background(COLORS.background);

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderUI(p);
                renderPausedScreen(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p, p.keyCode);
    };
});

// Helper to reset game state
function resetGameLogic(p) {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.lives = gameState.maxLives;
    gameState.currentCheckpoint = null;
    gameState.particles = [];
    
    // Generate Level
    generateLevel(p);
    
    // Spawn Player
    gameState.player = new Player(CANVAS_WIDTH/2 - 12, gameState.worldHeight - 100);
    gameState.entities.push(gameState.player);
    
    // Reset Camera
    gameState.cameraY = gameState.worldHeight - CANVAS_HEIGHT;
}

// Expose reset to window for Input handling
window.resetGame = function(p) {
    resetGameLogic(p);
};

// Expose control mode setter for buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    
    // Update button visual state
    document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
        if(btn.id.includes(mode)) btn.classList.add('active');
        // Fallback for button ID naming convention in example
        if(mode === 'TEST_1' && btn.id === 'test_1_ModeBtn') btn.classList.add('active');
        if(mode === 'TEST_2' && btn.id === 'test_2_ModeBtn') btn.classList.add('active');
        if(mode === 'HUMAN' && btn.id === 'humanModeBtn') btn.classList.add('active');
    });
};

function updateGame(p) {
    handleInput(p);

    // Update Player
    if (gameState.player) gameState.player.update(p);

    // Update Entities
    gameState.entities.forEach(e => {
        if (e !== gameState.player) e.update(p);
    });

    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let pt = gameState.particles[i];
        pt.update();
        if (pt.isDead()) gameState.particles.splice(i, 1);
    }

    // Update Camera
    updateCamera(p);
}

function updateCamera(p) {
    if (!gameState.player) return;
    
    // Target Y is player Y minus some offset to keep player lower-middle
    const targetY = gameState.player.y - CANVAS_HEIGHT * 0.6;
    
    // Smooth lerp
    gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
    
    // Clamp camera
    gameState.cameraY = p.constrain(gameState.cameraY, 0, gameState.worldHeight - CANVAS_HEIGHT);
}

function renderGame(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Render Walls
    gameState.walls.forEach(w => w.render(p));
    
    // Render Hazards
    gameState.hazards.forEach(h => h.render(p));
    
    // Render Checkpoints
    gameState.checkpoints.forEach(cp => cp.render(p));
    
    // Render Collectibles
    gameState.collectibles.forEach(c => c.render(p));
    
    // Render Enemies
    gameState.enemies.forEach(e => e.render(p));
    
    // Render Player
    if (gameState.player) gameState.player.render(p);
    
    // Render Particles
    gameState.particles.forEach(pt => pt.render(p));
    
    p.pop();
}

window.gameInstance = gameInstance;