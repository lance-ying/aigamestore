import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { loadLevel } from './levels.js';
import { handleInput, keys, keyPressed, keyReleased } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // --- Setup ---
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Logs init
        p.logs = {
            "game_info": [],
            "inputs": [],
            "player_info": []
        };
        
        resetGame();
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    function resetGame() {
        gameState.currentLevelIndex = 0;
        gameState.score = 0;
        gameState.gamePhase = "START";
        gameState.particles = [];
        startLevel(0);
    }

    function startLevel(index) {
        const levelData = loadLevel(index);
        if (levelData) {
            gameState.player = new Player(levelData.startX, levelData.startY);
            gameState.worldWidth = levelData.width;
            gameState.gamePhase = "PLAYING";
        } else {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    // --- Main Loop ---
    p.draw = function() {
        // Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Automated Inputs
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action();
            if (action) {
                // Simulate key press for one frame
                // Note: This is a simplification. Ideally we inject into key state.
                // We will directly manipulate the keys object for the test
                // Reset keys first
                keys.right = false; keys.left = false; keys.jump = false; keys.down = false;
                
                if (action.keyCode === 39) keys.right = true;
                if (action.keyCode === 37) keys.left = true;
                if (action.keyCode === 32) keys.jump = true;
                if (action.keyCode === 40) keys.down = true;
                if (action.keyCode === 32 && !keys.jump) keys.jumpPressed = true;
            }
        }
        
        // Logic & Render
        p.background(20, 20, 30); // Dark Blue BG
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderUI(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderGame(p);
            renderPaused(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p); // Render behind overlay
            renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
        } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
            // Transition
            gameState.currentLevelIndex++;
            startLevel(gameState.currentLevelIndex);
        }
        
        // Logging
        if (gameState.player) {
            p.logs.player_info.push({
                screen_x: gameState.player.x,
                screen_y: gameState.player.y,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    };

    function updateGame(p) {
        if (!gameState.player) return;
        
        // Handle input state helper
        handleInput(p);
        
        // Update Camera
        // Center player with lookahead
        let targetCamX = gameState.player.x - CANVAS_WIDTH / 2 + (gameState.player.vx * 20);
        
        // Clamp camera
        targetCamX = Math.max(0, Math.min(targetCamX, gameState.worldWidth - CANVAS_WIDTH));
        
        // Smooth
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        gameState.cameraY = 0; // No vertical scrolling for this prototype
        
        // Update Entities
        gameState.player.update(p, keys);
        
        gameState.particles.forEach((part, i) => {
            part.update();
            if (part.isDead()) gameState.particles.splice(i, 1);
        });
    }

    function renderGame(p) {
        p.push();
        p.translate(-gameState.cameraX, -gameState.cameraY);
        
        // Background Parallax (Simple stars)
        p.push();
        p.translate(gameState.cameraX * 0.9, 0); // Move with camera slightly
        p.fill(255);
        p.noStroke();
        for(let i=0; i<50; i++) {
            // Deterministic random stars
            let sx = (i * 137) % CANVAS_WIDTH;
            let sy = (i * 53) % CANVAS_HEIGHT;
            p.circle(sx, sy, 2);
        }
        p.pop();
        
        // Entities
        gameState.platforms.forEach(plat => plat.render(p));
        gameState.hazards.forEach(h => h.render(p));
        gameState.exits.forEach(e => e.render(p));
        gameState.collectibles.forEach(c => c.render(p));
        gameState.particles.forEach(part => part.render(p));
        
        if (gameState.player) gameState.player.render(p);
        
        p.pop();
    }

    // --- Inputs ---
    p.keyPressed = function() {
        keyPressed(p);
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                resetGame();
            } else {
                 // Restart current level
                 startLevel(gameState.currentLevelIndex);
            }
        }
    };
    
    p.keyReleased = function() {
        keyReleased(p);
    };
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};