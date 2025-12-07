import { gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS } from './globals.js';
import { Player } from './entities.js';
import { LevelManager } from './map.js';
import { particleSystem } from './particles.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';

const p5 = window.p5;
const levelManager = new LevelManager();

window.resetGame = function() {
    gameState.score = 0;
    gameState.coins = 0;
    gameState.frameCount = 0;
    gameState.tideSpeed = 1.0;
    
    // Player Start
    const startX = Math.floor(CANVAS_WIDTH / TILE_SIZE / 2) * TILE_SIZE + (TILE_SIZE - 20)/2;
    const startY = (Math.floor(CANVAS_HEIGHT / TILE_SIZE) - 4) * TILE_SIZE + (TILE_SIZE - 20)/2;
    
    gameState.player = new Player(startX, startY);
    gameState.tideY = startY + 300; // Start tide well below
    gameState.cameraY = startY - 200;
    
    levelManager.reset();
    
    gameState.gamePhase = "START";
    gameState.entities = [gameState.player];
}

window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
    // Restart game to apply clean state for tests if needed
    if (gameState.gamePhase !== 'START') window.resetGame();
};

let gameInstance = new p5(p => {
    initLogs(p);

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        window.resetGame();
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Log info
        if (gameState.frameCount % 60 === 0) {
            p.logs.game_info.push({
                phase: gameState.gamePhase,
                score: gameState.score,
                fps: p.frameRate().toFixed(1)
            });
        }

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                handleInput(p); // Allow automated start
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Render background but don't update
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                handleInput(p); // Allow automated restart
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
});

function updateGame(p) {
    handleInput(p); // Continuous input check for automation/buffer
    
    const player = gameState.player;
    
    // Update Map Generation
    levelManager.update(p);
    
    // Update Entities
    gameState.entities.forEach(e => e.update(p));
    particleSystem.update();
    
    // Update Tide
    gameState.tideY -= gameState.tideSpeed;
    gameState.tideSpeed += 0.0005; // Slowly increase difficulty
    
    // Update Camera (Smooth Follow Player)
    const targetCamY = player.y - CANVAS_HEIGHT * 0.6;
    gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
    
    // High Score Update
    if (gameState.score > gameState.highScore) gameState.highScore = gameState.score;
}

function renderGame(p) {
    p.background(COLORS.BACKGROUND);
    
    // Render Map
    levelManager.render(p);
    
    // Render Tide
    const screenTideY = gameState.tideY - gameState.cameraY;
    if (screenTideY < CANVAS_HEIGHT) {
        p.push();
        p.fill(COLORS.TIDE);
        p.noStroke();
        p.rect(0, screenTideY, CANVAS_WIDTH, CANVAS_HEIGHT * 2); // Extend downwards
        
        // Wave effect
        p.stroke(COLORS.PLAYER);
        p.strokeWeight(2);
        p.beginShape();
        for(let x=0; x<=CANVAS_WIDTH; x+=20) {
            p.vertex(x, screenTideY + Math.sin(x*0.05 + gameState.frameCount*0.1)*10);
        }
        p.endShape();
        p.pop();
    }
    
    // Render Entities
    gameState.entities.forEach(e => e.render(p));
    particleSystem.render(p);
}

window.gameInstance = gameInstance;