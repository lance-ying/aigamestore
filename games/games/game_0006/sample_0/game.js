import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, resetLevelState } from './globals.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { updateParticles } from './particles.js';
import { loadLevel, LEVEL_DATA } from './level_data.js';
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
        
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;

        // Automated Testing
        if (gameState.controlMode.startsWith("TEST")) {
            get_automated_testing_action(gameState);
        }

        // Render Background
        drawBackground(p);

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
                renderPausedOverlay(p);
                renderUI(p);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
            case "LEVEL_COMPLETE":
                renderGame(p);
                renderGameOver(p, true);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

function drawBackground(p) {
    // Parallax background effect simulation
    p.background(30, 30, 45);
    
    // Distant stars/particles that move slowly with camera
    p.push();
    p.translate(-gameState.cameraX * 0.1, -gameState.cameraY * 0.1);
    p.fill(255, 255, 255, 50);
    p.noStroke();
    for(let i=0; i<50; i++) {
        let x = (i * 137) % 2000;
        let y = (i * 243) % 1000;
        p.circle(x, y, 2);
    }
    p.pop();
    
    // Midground
    p.push();
    p.translate(-gameState.cameraX * 0.3, -gameState.cameraY * 0.3);
    p.fill(40, 40, 60);
    for(let i=0; i<20; i++) {
        let x = (i * 311) % 2500;
        let y = 300 + (i * 73) % 500;
        p.rect(x, y, 100, 1000);
    }
    p.pop();
}

function updateGame(p) {
    if (gameState.player) {
        gameState.player.update(p);
        
        // Log player info
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: gameState.player.x - gameState.cameraX,
                screen_y: gameState.player.y - gameState.cameraY,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        // Camera Follow
        let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.4;
        let targetCamY = gameState.player.y - CANVAS_HEIGHT * 0.6;
        
        // Smooth camera
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
        
        // Clamp Camera
        gameState.cameraX = p.constrain(gameState.cameraX, 0, gameState.worldWidth - CANVAS_WIDTH);
        gameState.cameraY = p.constrain(gameState.cameraY, 0, gameState.worldHeight - CANVAS_HEIGHT);
    }
    
    updateParticles(p);
}

function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw Level Bounds (Debugging/Visual)
    p.noFill();
    p.stroke(255, 50);
    p.rect(0, 0, gameState.worldWidth, gameState.worldHeight);
    
    // Render entities
    gameState.switches.forEach(s => s.render(p));
    gameState.doors.forEach(d => d.render(p));
    gameState.platforms.forEach(plat => plat.render(p));
    gameState.hazards.forEach(h => h.render(p));
    gameState.coins.forEach(c => c.render(p));
    
    gameState.particles.forEach(part => part.render(p));
    
    if (gameState.player) {
        gameState.player.render(p);
    }
    
    p.pop();
}

// Global functions for state management
window.startGame = function() {
    // If completed or just starting
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "LEVEL_COMPLETE") {
        gameState.currentLevelIndex++;
        if (gameState.currentLevelIndex >= LEVEL_DATA.length) gameState.currentLevelIndex = 0;
    } else {
        gameState.currentLevelIndex = 0;
        gameState.score = 0;
    }
    
    loadLevel(gameState.currentLevelIndex, gameInstance);
    gameState.gamePhase = "PLAYING";
};

window.restartLevel = function() {
    loadLevel(gameState.currentLevelIndex, gameInstance);
    gameState.gamePhase = "PLAYING";
};

window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If in game, might want to restart to clean test
    if (mode !== "HUMAN") {
         window.restartLevel();
    }
};

window.gameInstance = gameInstance;