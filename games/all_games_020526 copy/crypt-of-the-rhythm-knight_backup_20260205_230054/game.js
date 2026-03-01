/**
 * Main Game Loop and p5.js Setup
 */

import { 
    gameState, getGameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { rhythmManager } from './rhythm.js';
import { Dungeon } from './grid.js';
import { Player, Enemy, Item } from './entities.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';


const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = gameState.logs; // Link logs
    
    // Setup
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Log initial
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Initial setup
        startGame(p);
    };

    // Draw Loop
    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Background
        p.background(COLORS.BACKGROUND);
        
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
                renderUI(p); // Show UI even when paused
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
    };
    
    p.keyPressed = function(e) {
        // Handle physical key press
        // If simulated, e might be just { keyCode: ... }
        const code = e.keyCode || e;
        handleKeyPress(p, code);
    };
});

function handleKeyPress(p, keyCode) {
    // Log
    p.logs.inputs.push({
        type: 'press',
        key: keyCode,
        frame: p.frameCount,
        time: p.millis()
    });
    
    if (keyCode === 82) { // R - Restart
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             startGame(p);
             gameState.gamePhase = "START";
             return;
        }
    }
    
    handleInput(p, keyCode);
}

function startGame(p) {
    resetGameState();
    startLevel(p);
}

function nextLevel(p) {
    gameState.level++;
    if (gameState.level > gameState.maxLevels) {
        gameState.gamePhase = "GAME_OVER_WIN";
    } else {
        startLevel(p);
    }
}

function startLevel(p) {
    // Clear previous entities but keep player stats if exists
    gameState.entities = [];
    gameState.particles = [];
    
    // Create Dungeon
    const dungeon = new Dungeon();
    gameState.dungeon = dungeon;
    const startData = dungeon.generateLevel(p);
    
    gameState.grid = dungeon.tiles;
    
    // Create Player
    // If player exists, preserve stats
    let hp = 10; // Default to 10
    let score = 0;
    let combo = 0;
    let multiplier = 1;
    
    if (gameState.player) {
        hp = gameState.player.health;
        score = gameState.score;
        combo = gameState.combo;
        multiplier = gameState.multiplier;
    }
    
    gameState.player = new Player(startData.startX, startData.startY);
    gameState.player.health = hp;
    gameState.score = score;
    gameState.combo = combo;
    gameState.multiplier = multiplier;
    
    gameState.entities.push(gameState.player);
    
    // Create Enemies
    const rooms = startData.rooms;
    // Iterate all rooms for enemies, ensuring distance from player
    for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i];
        
        // Chance to spawn enemies in this room
        // More enemies in later levels
        const enemyCount = p.floor(p.random(0, 2 + gameState.level));
        
        for(let j=0; j<enemyCount; j++) {
            const ex = p.floor(p.random(r.x, r.x + r.w));
            const ey = p.floor(p.random(r.y, r.y + r.h));
            
            // Don't spawn on player or exit
            if (ex === gameState.player.gridX && ey === gameState.player.gridY) continue;
            if (gameState.exit && ex === gameState.exit.gridX && ey === gameState.exit.gridY) continue;
            
            // Random enemy type based on level
            const rand = p.random();
            let type = 'SLIME';
            if (gameState.level > 1 && rand > 0.5) type = 'SKELETON';
            if (gameState.level > 2 && rand > 0.8) type = 'BAT';
            
            gameState.entities.push(new Enemy(ex, ey, type));
        }
    }
    
    // Create Items
    for (let i = 0; i < rooms.length; i++) {
        if (p.random() > 0.5) {
            const r = rooms[i];
            const x = p.floor(p.random(r.x, r.x + r.w));
            const y = p.floor(p.random(r.y, r.y + r.h));
            
            // Avoid collisions
            let occupied = false;
            if (x === gameState.player.gridX && y === gameState.player.gridY) occupied = true;
            if (gameState.exit && x === gameState.exit.gridX && y === gameState.exit.gridY) occupied = true;
            
            if (!occupied) {
                gameState.entities.push(new Item(x, y, p.random() > 0.7 ? 'POTION' : 'GOLD'));
            }
        }
    }
}

function updateGame(p) {
    // Check for level transition
    if (gameState.triggerNextLevel) {
        gameState.triggerNextLevel = false;
        nextLevel(p);
        return;
    }

    // Rhythm Update
    rhythmManager.update(p.millis());
    
    // Entity Updates (Animation mostly, physics logic is turn based in input.js)
    gameState.entities.forEach(e => e.updatePosition());
    
    // Particle Updates
    updateParticles();
    
    // Screen Shake Decay
    if (gameState.shakeAmount > 0) {
        gameState.shakeAmount *= 0.9;
        if (gameState.shakeAmount < 0.5) gameState.shakeAmount = 0;
    }
    
    // Log Player State occasionally
    if (p.frameCount % 60 === 0 && gameState.player) {
        p.logs.player_info.push({
            x: gameState.player.gridX,
            y: gameState.player.gridY,
            health: gameState.player.health,
            score: gameState.score,
            combo: gameState.combo
        });
    }
}

function renderGame(p) {
    p.push();
    
    // Screen Shake
    if (gameState.shakeAmount > 0) {
        p.translate(p.random(-gameState.shakeAmount, gameState.shakeAmount), p.random(-gameState.shakeAmount, gameState.shakeAmount));
    }
    
    // Center Camera on Player
    if (gameState.player) {
        // Pixel Center
        const px = gameState.player.pixelX + 20;
        const py = gameState.player.pixelY + 20;
        
        // No camera translation needed for standard grid size
    }
    
    // Render World
    if (gameState.dungeon) gameState.dungeon.render(p);
    
    // Render Entities (Sort by Y for depth)
    const sortedEntities = [...gameState.entities].sort((a,b) => a.pixelY - b.pixelY);
    sortedEntities.forEach(e => e.render(p));
    
    // Render Particles (on top)
    renderParticles(p);
    
    p.pop();
}

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};