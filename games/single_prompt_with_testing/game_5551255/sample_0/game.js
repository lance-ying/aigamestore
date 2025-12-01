import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from './globals.js';
import { Player } from './entities.js';
import { initLevel, updateLevelGen } from './level_gen.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { handleInput, automatedInput } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        // Initialize logs
        p.logs.game_info.push({
            event: "initialized",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        p.background(20, 20, 30);

        // State Machine
        switch(gameState.gamePhase) {
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
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p); // Render last state behind overlay
                renderGameOver(p);
                break;
        }
        
        // Automated inputs
        if (gameState.controlMode !== "HUMAN") {
            automatedInput(p);
        }
    };

    p.keyPressed = function() {
        // Log input
        p.logs.inputs.push({
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });

        // Global Phase Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                startGame();
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
            }
        }

        // Gameplay Input
        handleInput(p);
    };
});

function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.entities = [];
    gameState.particles = [];
    
    // Create Player
    gameState.player = new Player(300, 300); // Start near bottom center
    gameState.entities.push(gameState.player);
    
    // Init Level
    initLevel();
    
    // Log
    window.gameInstance.logs.game_info.push({
        event: "start_game",
        timestamp: Date.now()
    });
}

function updateGame(p) {
    if (!gameState.player) return;

    // Update Player
    gameState.player.update(p);
    
    // Update Enemies
    gameState.enemies.forEach(e => e.update());
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) gameState.particles.splice(i, 1);
    }
    
    // Update Tide
    gameState.tideY -= gameState.tideSpeed;
    
    // Level Generation
    updateLevelGen();
    
    // Camera Follow
    // Keep player in middle 3rd vertically
    const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
    // Smooth Lerp
    gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
    
    // Render Tide Effect (Logic here, render later)
}

function renderGame(p) {
    p.push();
    p.translate(0, -gameState.cameraY); // Apply Camera
    
    // Render Background Grid (World Space)
    p.stroke(255, 255, 255, 10);
    p.strokeWeight(1);
    const startGridY = Math.floor(gameState.cameraY / 50) * 50;
    for(let y = startGridY; y < startGridY + CANVAS_HEIGHT + 50; y += 50) {
        p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Render Walls
    gameState.walls.forEach(w => w.render(p));
    
    // Render Coins
    gameState.coins.forEach(c => c.render(p));
    
    // Render Enemies
    gameState.enemies.forEach(e => e.render(p));
    
    // Render Player
    if (gameState.player) gameState.player.render(p);
    
    // Render Particles
    gameState.particles.forEach(pt => pt.render(p));
    
    // Render Tide
    p.fill(255, 50, 0, 150);
    p.noStroke();
    p.rect(0, gameState.tideY, CANVAS_WIDTH, CANVAS_HEIGHT * 2); // Big rect covering bottom
    // Tide wave crest
    p.fill(255, 100, 0);
    p.rect(0, gameState.tideY, CANVAS_WIDTH, 10);
    
    p.pop();
}

// Global hook for controls
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};