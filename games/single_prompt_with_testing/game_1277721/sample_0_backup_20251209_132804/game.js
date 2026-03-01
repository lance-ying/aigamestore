/**
 * Main Game Loop and Setup
 */

import { 
    gameState, getGameState, resetGameState,
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { Player } from './entities.js';
import { LevelManager } from './level_manager.js';
import { handleInput, keyPressed } from './input.js';
import { updateCamera, checkCollisions } from './physics.js';
import { renderUI } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { worldToScreen } from './iso_math.js'; // imported for any util needs

const p5 = window.p5;
const levelManager = new LevelManager();

window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game if needed
    if (window.gameInstance) {
        window.gameInstance.resetGame();
    }
};

let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial Reset
        p.resetGame();
        
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
    };

    // Exposed reset function on p5 instance
    p.resetGame = function() {
        resetGameState();
        levelManager.reset();
        
        // Spawn player at 0,0,0
        gameState.player = new Player(0, 0, 0);
        
        // Update high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
        }
    };

    p.draw = function() {
        // 1. Update Phase
        handleInput(p);
        
        // Update Game Logic
        if (gameState.gamePhase === "PLAYING") {
            gameState.frameCount++;
            
            // Entities
            if (gameState.player) gameState.player.update(p);
            levelManager.update(gameState.player);
            gameState.collectibles.forEach(c => c.update(p));
            
            // Physics
            checkCollisions();
            updateCamera();
            
            // Particles
            updateParticles();
        }
        else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            // Still update player for falling animation
            if (gameState.player) gameState.player.update(p);
            updateParticles();
            // Camera slows down or stops? Let's keep it updating slightly
             updateCamera();
        }

        // 2. Render
        drawBackground(p);

        // Sorting for Isometric Rendering (Painter's Algorithm)
        // We need to draw things from "back" to "front".
        // In our case (X+Z+Y) or similar depth metric.
        // Screen Y increases as (X+Z) increases. 
        // So generally, objects with lower Screen Y should be drawn first?
        // Wait, worldToScreen: y_screen = (x+z)*sin - y.
        // Larger x,z means LARGER y_screen (lower on screen).
        // Standard approach: Draw objects with smaller (x+z) first (further back).
        // Then draw objects with larger (x+z).
        
        // Gather all renderable objects
        let renderList = [];
        
        // Blocks
        gameState.blocks.forEach(block => {
            renderList.push({ type: 'block', obj: block, depth: block.x + block.z + block.y }); // blocks are y=0 or -size
        });
        
        // Falling blocks
        gameState.fallingBlocks.forEach(block => {
             renderList.push({ type: 'block', obj: block, depth: block.x + block.z + block.y });
        });
        
        // Collectibles
        gameState.collectibles.forEach(c => {
             renderList.push({ type: 'collectible', obj: c, depth: c.x + c.z + c.y });
        });
        
        // Player
        if (gameState.player) {
             renderList.push({ type: 'player', obj: gameState.player, depth: gameState.player.x + gameState.player.z + gameState.player.y });
        }
        
        // Particles (usually drawn last on top, but for true 3D they should sort)
        // For simplicity, particles draw last (on top) for arcade feel.
        
        // Sort
        renderList.sort((a, b) => a.depth - b.depth);
        
        // Draw Sorted
        renderList.forEach(item => {
            item.obj.render(p);
        });
        
        // Particles on top
        renderParticles(p);

        // UI
        renderUI(p);
        
        // Logging Player Info
        if (gameState.gamePhase === "PLAYING" && gameState.player && p.frameCount % 5 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                z: gameState.player.z,
                score: gameState.score,
                frameCount: p.frameCount
            });
        }
    };

    p.keyPressed = function() {
        keyPressed(p);
    };

    function drawBackground(p) {
        // Gradient Background
        // Interpolate from top to bottom
        p.noFill();
        for (let i = 0; i <= CANVAS_HEIGHT; i+=10) {
            let inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
            let c = p.lerpColor(
                p.color(COLORS.BACKGROUND_TOP), 
                p.color(COLORS.BACKGROUND_BOTTOM), 
                inter
            );
            p.fill(c);
            p.noStroke();
            p.rect(0, i, CANVAS_WIDTH, 10);
        }
    }
});

// Expose instance
window.gameInstance = gameInstance;