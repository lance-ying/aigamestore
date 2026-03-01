import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, resetGameState } from './globals.js';
import { Player, Platform, Coin, Hazard, ExitPipe } from './entities.js';
import { loadLevel } from './levels.js';
import { initInput } from './input.js';
import { updateParticles } from './particles.js';
import { renderUI, renderStartScreen, renderGameOverWin, renderGameOverLose, renderPaused, renderLevelComplete, renderGameComplete } from './ui.js';

const p5 = window.p5;

window.resetGame = function() {
    // Restart the current level
    // Restore score to what it was at the start of the level to prevent farming
    gameState.score = gameState.levelStartScore;
    
    resetGameState();
    loadLevel(gameState.currentLevelIndex);
}

window.nextLevel = function() {
    // Save current score as the new baseline for the next level
    gameState.levelStartScore = gameState.score;
    
    // Advance level
    gameState.currentLevelIndex++;
    if (gameState.currentLevelIndex >= gameState.totalLevels) {
        // Game Complete
        gameState.gamePhase = "GAME_COMPLETE";
    } else {
        resetGameState();
        loadLevel(gameState.currentLevelIndex);
    }
}

window.goToTitle = function() {
    gameState.gamePhase = "START";
    gameState.currentLevelIndex = 0;
    gameState.score = 0;
    gameState.levelStartScore = 0;
    loadLevel(0);
}

// Window function to set control mode from HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Update button styles
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    if(mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if(mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if(mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
};

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initInput(p);
        
        // Initial load
        gameState.score = 0;
        gameState.levelStartScore = 0;
        gameState.currentLevelIndex = 0; 
        loadLevel(0);
        
        // Explicitly set to START for the very first load
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            event: "Game Initialized",
            frame: 0,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount = p.frameCount;
        
        // Render Background (Parallax simulation via color gradient or simple bg)
        drawBackground(p);
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        }
        else if (gameState.gamePhase === "PLAYING") {
            updateGameLogic(p);
            renderGameWorld(p);
            renderUI(p);
        }
        else if (gameState.gamePhase === "PAUSED") {
            renderGameWorld(p);
            renderUI(p);
            renderPaused(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_WIN") {
            renderGameWorld(p);
            renderUI(p);
            renderGameOverWin(p);
        }
        else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGameWorld(p);
            renderUI(p);
            renderGameOverLose(p);
        }
        else if (gameState.gamePhase === "LEVEL_COMPLETE") {
            // Keep rendering world in background
            renderGameWorld(p);
            renderUI(p);
            renderLevelComplete(p);
            
            // Handle auto-transition
            gameState.transitionTimer -= gameState.deltaTime;
            if (gameState.transitionTimer <= 0) {
                window.nextLevel();
            }
        }
        else if (gameState.gamePhase === "GAME_COMPLETE") {
            renderGameWorld(p);
            renderUI(p);
            renderGameComplete(p);
        }
    };
});

function updateGameLogic(p) {
    // Update Player
    if (gameState.player) {
        gameState.player.update(p);
    }
    
    // Update Particles
    updateParticles(p);
    
    // Camera Follow Logic
    if (gameState.player) {
        // Target is player centered
        let targetX = gameState.player.x - CANVAS_WIDTH / 2;
        let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Clamp camera to world bounds
        targetX = Math.max(0, Math.min(targetX, gameState.worldWidth - CANVAS_WIDTH));
        targetY = Math.max(0, Math.min(targetY, gameState.worldHeight - CANVAS_HEIGHT));
        
        // Smooth lerp
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
        gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
    }
}

function renderGameWorld(p) {
    p.push();
    // Apply Camera Transform
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw Level Elements
    // Platforms
    for (let plat of gameState.platforms) {
        plat.render(p);
    }
    
    // Exit
    if (gameState.exit) gameState.exit.render(p);
    
    // Coins
    for (let coin of gameState.coins) {
        coin.render(p);
    }
    
    // Hazards
    for (let hazard of gameState.hazards) {
        hazard.render(p);
    }
    
    // Player
    if (gameState.player) {
        gameState.player.render(p);
    }
    
    // Particles
    for (let part of gameState.particles) {
        part.render(p);
    }
    
    p.pop();
}

function drawBackground(p) {
    // Create a nice gradient background
    // Sky
    p.background(135, 206, 235);
    
    // Distant mountains (parallax layer 1 - moves slower)
    p.push();
    p.translate(-gameState.cameraX * 0.2, -gameState.cameraY * 0.1);
    p.fill(100, 149, 237);
    p.noStroke();
    p.beginShape();
    p.vertex(0, CANVAS_HEIGHT);
    p.vertex(0, 200);
    p.vertex(200, 100);
    p.vertex(400, 250);
    p.vertex(600, 150);
    p.vertex(800, 280);
    p.vertex(1200, 100);
    p.vertex(1200, CANVAS_HEIGHT);
    p.endShape(p.CLOSE);
    p.pop();
    
    // Closer hills (parallax layer 2)
    p.push();
    p.translate(-gameState.cameraX * 0.5, -gameState.cameraY * 0.2);
    p.fill(60, 179, 113);
    p.noStroke();
    p.ellipse(0, CANVAS_HEIGHT, 800, 400);
    p.ellipse(600, CANVAS_HEIGHT+50, 900, 500);
    p.ellipse(1200, CANVAS_HEIGHT, 800, 400);
    p.pop();
}