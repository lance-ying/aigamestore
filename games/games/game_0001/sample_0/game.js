import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, initLogs, COLORS } from './globals.js';
import { handleInput, handleKeyPress, handleKeyRelease } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { Player } from './entities.js';
import { getLevelData } from './levels.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initial setup
        resetGame();
        
        // Log start
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
                renderGame(p); // Render underlying game frozen
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        // Handle continuous input for movement
        handleInput(p);
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

// Main Game Update Loop
function updateGame(p) {
    // Camera Logic (Follow Player)
    if (gameState.player) {
        // Target camera position (center player)
        let targetCamX = gameState.player.x - CANVAS_WIDTH / 2;
        let targetCamY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Clamp camera to world bounds
        targetCamX = p.constrain(targetCamX, 0, gameState.worldWidth - CANVAS_WIDTH);
        targetCamY = p.constrain(targetCamY, 0, gameState.worldHeight - CANVAS_HEIGHT);
        
        // Smooth lerp
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
        
        // Update Player
        gameState.player.update(p);
    }
    
    // Update Particles
    for(let i = gameState.particles.length - 1; i >= 0; i--) {
        let pt = gameState.particles[i];
        pt.update();
        if(pt.life <= 0) gameState.particles.splice(i, 1);
    }
}

// Main Game Render Loop
function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Render World
    gameState.platforms.forEach(plat => plat.render(p));
    gameState.hazards.forEach(haz => haz.render(p));
    gameState.coins.forEach(coin => coin.render(p));
    if(gameState.goal) gameState.goal.render(p);
    
    // Render Particles (behind player mostly)
    gameState.particles.forEach(pt => pt.render(p));
    
    // Render Player
    if (gameState.player) gameState.player.render(p);
    
    p.pop();
}

// Global functions for state management
window.loadLevel = function(index) {
    const data = getLevelData(index);
    gameState.platforms = data.platforms;
    gameState.hazards = data.hazards;
    gameState.coins = data.coins;
    gameState.goal = data.goal;
    gameState.worldWidth = data.worldWidth;
    gameState.worldHeight = data.worldHeight;
    gameState.player = new Player(data.playerStart.x, data.playerStart.y);
    
    // Reset camera
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.particles = [];
};

window.globalResetGame = function() {
    gameState.score = 0;
    gameState.currentLevelIndex = 0;
    gameState.gamePhase = "START";
    gameState.particles = [];
    window.loadLevel(0);
};

// For test buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

window.gameInstance = gameInstance;