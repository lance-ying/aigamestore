/**
 * Main Game Entry Point
 */
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, getGameState, resetGameState, LEVEL_LENGTH 
} from './globals.js';
import { Player } from './entities.js';
import { setupLevel } from './level.js';
import { updatePhysics } from './physics.js';
import { handleInput, keyPressed, keyReleased } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // logs initialization
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Setup initial empty world to avoid null errors if rendered before start
        setupLevel();
        gameState.player = new Player(50, 200);
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        gameState.deltaTime = 1 / p.frameRate();

        p.background(20, 20, 30); // Clear screen

        handleInput(p);

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };
    
    function updateGame(p) {
        if (!gameState.player) return;

        // Physics
        updatePhysics(p, gameState.player);
        gameState.player.update(p);
        
        // Entities
        gameState.platforms.forEach(plat => plat.update());
        
        // Particles
        // Filter out dead particle systems
        for(let i=gameState.particles.length-1; i>=0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Camera Follow
        // Keep player roughly in left-center
        let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.3;
        // Clamp camera
        targetCamX = Math.max(0, targetCamX);
        
        // Smooth Lerp
        gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
        gameState.cameraY = 0; // No vertical scrolling for this prototype usually, or limited
        
        // Win Condition
        if (gameState.player.x > gameState.levelLength) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    function renderGame(p) {
        p.push();
        p.translate(-gameState.cameraX, -gameState.cameraY);
        
        // Draw decorative background grid
        drawBackgroundGrid(p);
        
        // Draw entities
        gameState.platforms.forEach(plat => plat.render(p));
        gameState.hazards.forEach(haz => haz.render(p));
        gameState.collectibles.forEach(col => col.render(p));
        
        // Draw particles (behind player mostly, or mix)
        gameState.particles.forEach(ps => ps.render(p));
        
        if (gameState.player) gameState.player.render(p);
        
        // Finish Line
        p.fill(255);
        p.rect(gameState.levelLength, 0, 20, CANVAS_HEIGHT);
        p.fill(0, 255, 0);
        p.textSize(20);
        p.text("GOAL", gameState.levelLength + 10, 200);
        
        p.pop();
    }
    
    function drawBackgroundGrid(p) {
        p.stroke(40, 40, 60);
        p.strokeWeight(1);
        let startX = Math.floor(gameState.cameraX / 50) * 50;
        for (let x = startX; x < gameState.cameraX + CANVAS_WIDTH; x += 50) {
            p.line(x, 0, x, CANVAS_HEIGHT);
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
            p.line(gameState.cameraX, y, gameState.cameraX + CANVAS_WIDTH, y);
        }
    }

    p.keyPressed = function() {
        // Special Restart Handler logic from input.js call
        if (p.keyCode === 82 && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
             resetGame();
        }
        keyPressed(p, p.keyCode);
    };

    p.keyReleased = function() {
        keyReleased(p, p.keyCode);
    };
    
    function resetGame() {
        resetGameState();
        p.randomSeed(42); // Ensure reproducibility
        setupLevel();
        gameState.player = new Player(50, 200);
    }
});

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If switching modes, maybe focus canvas
};

window.gameInstance = gameInstance;