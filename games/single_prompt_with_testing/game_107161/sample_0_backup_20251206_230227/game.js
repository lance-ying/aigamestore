import { gameState, getGameState, PALETTE, PALETTE_THEMES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level_gen.js';
import { handleKeyPress, handleKeyRelease, isKeyDown, KEYS } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
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
        p.noSmooth(); // Pixel art feel
        
        // Initial setup
        resetGameState();
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Timing
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Handle Automated Inputs
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                p.keyCode = action.keyCode;
                p.keyPressed();
            }
        }

        // State Loop
        p.background(p.color(PALETTE.BG));
        
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
                renderPauseScreen(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
    
    // Core Game Update
    function updateGame(p) {
        // Init logic if fresh start
        if (!gameState.player) {
            gameState.player = new Player(300, 100);
            generateLevel();
        }
        
        const player = gameState.player;
        
        // Dynamic Palette Switching based on Depth
        const zoneHeight = 2000;
        const currentZone = Math.min(Math.floor(player.y / zoneHeight), PALETTE_THEMES.length - 1);
        const targetTheme = PALETTE_THEMES[currentZone];
        
        // Apply theme (mutating PALETTE const properties)
        Object.assign(PALETTE, targetTheme);
        
        // Update Entities
        player.update();
        
        // Log Player
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: player.x,
                screen_y: player.y - gameState.cameraY,
                game_x: player.x,
                game_y: player.y,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        // Update Enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.update(p);
            if (e.markedForDeletion) gameState.enemies.splice(i, 1);
        }
        
        // Update Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const proj = gameState.projectiles[i];
            proj.update(p);
            if (proj.markedForDeletion) gameState.projectiles.splice(i, 1);
        }
        
        // Update Gems
        for (let i = gameState.gems.length - 1; i >= 0; i--) {
            const g = gameState.gems[i];
            g.update(p);
            if (g.markedForDeletion) gameState.gems.splice(i, 1);
        }

        // Update Powerups
        for (let i = gameState.powerups.length - 1; i >= 0; i--) {
            const pup = gameState.powerups[i];
            pup.update(p);
            if (pup.markedForDeletion) gameState.powerups.splice(i, 1);
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.isDead()) gameState.particles.splice(i, 1);
        }
    }
    
    // Core Game Render
    function renderGame(p) {
        // Camera Transform
        p.push();
        p.translate(0, -Math.floor(gameState.cameraY));
        
        // Draw World Bounds/BG Details
        const wellLeft = (CANVAS_WIDTH - gameState.wellWidth) / 2;
        // Use a slightly lighter color than BG for the well shaft to distinguish it
        p.fill(p.color(PALETTE.BG)); 
        // We can use SHADOW or just manipulate BG slightly. 
        // Let's use SHADOW for the well background to make it distinct from the "void" outside
        p.fill(PALETTE.SHADOW);
        p.noStroke();
        p.rect(wellLeft, gameState.cameraY, gameState.wellWidth, CANVAS_HEIGHT); 
        
        // Render Platforms
        gameState.platforms.forEach(plat => plat.render(p));
        
        // Render Gems
        gameState.gems.forEach(gem => gem.render(p));

        // Render Powerups
        gameState.powerups.forEach(pup => pup.render(p));
        
        // Render Enemies
        gameState.enemies.forEach(enemy => enemy.render(p));
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        // Render Projectiles
        gameState.projectiles.forEach(proj => proj.render(p));
        
        // Render Particles
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }
});

window.gameInstance = gameInstance;

// Helper to set control mode from HTML
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // If switching to test, restart game to ensure clean slate
    if (mode.startsWith("TEST")) {
        resetGameState();
        // Force start
        gameState.gamePhase = "PLAYING";
    }
};