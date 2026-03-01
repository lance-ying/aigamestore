import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level_generator.js';
import { handleKeyDown, handleKeyUp, processInputs } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused } from './ui.js';
import { checkAABB } from './utils.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    function resetGame() {
        gameState.score = 0;
        gameState.frameCount = 0;
        gameState.entities = [];
        gameState.enemies = [];
        gameState.collectibles = [];
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.shouldRestart = false;
        
        // Generate World
        generateLevel(p);
        
        // Spawn Player
        gameState.player = new Player(100, 200);
        gameState.entities.push(gameState.player);
        
        // Reset Camera
        gameState.cameraX = 0;
        gameState.cameraY = 0;
    }

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize logic
        resetGame();
        gameState.gamePhase = "START";
        
        // Log init
        p.logs.game_info.push({ event: "initialized", timestamp: Date.now() });
    };

    p.draw = function() {
        // Time management
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount = p.frameCount;

        // Restart check
        if (gameState.shouldRestart) {
            resetGame();
            gameState.gamePhase = "START";
        }

        // Input Processing
        if (gameState.gamePhase === "PLAYING") {
            processInputs(p);
        }

        // --- UPDATE ---
        if (gameState.gamePhase === "PLAYING") {
            
            // Clean up dead entities
            gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
            gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
            gameState.collectibles = gameState.collectibles.filter(e => !e.markedForDeletion);
            gameState.projectiles = gameState.projectiles.filter(e => !e.markedForDeletion);
            gameState.particles = gameState.particles.filter(e => e.life > 0);

            // Update entities
            gameState.entities.forEach(e => e.update(p));
            gameState.particles.forEach(pt => pt.update());

            // Camera follow
            if (gameState.player) {
                let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.4;
                // Clamp
                targetCamX = Math.max(0, Math.min(targetCamX, gameState.levelLength * 40 - CANVAS_WIDTH));
                
                // Smooth
                gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
            }
            
            // Logging Player
            if (gameState.player && p.frameCount % 10 === 0) {
                 p.logs.player_info.push({
                     x: gameState.player.x,
                     y: gameState.player.y,
                     health: gameState.player.health,
                     frame: p.frameCount
                 });
            }
        }

        // --- RENDER ---
        p.background(COLORS.SKY);
        
        // Start Screen
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
            return;
        }

        p.push();
        p.translate(-gameState.cameraX, -gameState.cameraY);

        // 1. Draw Tiles (Optimization: only visible)
        const startCol = Math.floor(gameState.cameraX / 40);
        const endCol = startCol + Math.ceil(CANVAS_WIDTH / 40) + 1;
        
        for(let x = startCol; x < endCol; x++) {
            if(x >= 0 && x < gameState.levelLength) {
                for(let y = 0; y < gameState.tiles[x].length; y++) {
                    const tile = gameState.tiles[x][y];
                    if(tile) tile.render(p);
                }
            }
        }

        // 2. Draw Entities
        gameState.collectibles.forEach(c => c.render(p));
        gameState.enemies.forEach(e => e.render(p));
        gameState.player.render(p);
        gameState.projectiles.forEach(pr => pr.render(p));
        gameState.particles.forEach(pt => pt.render(p));

        p.pop();

        // 3. UI
        renderHUD(p);
        
        if (gameState.gamePhase === "PAUSED") renderPaused(p);
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") renderGameOver(p);
    };

    p.keyPressed = function() {
        handleKeyDown(p);
    };

    p.keyReleased = function() {
        handleKeyUp(p);
    };
    
    // Global hook for control mode
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
    };
});