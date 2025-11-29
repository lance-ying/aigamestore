import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, COLORS, 
    gameState, initLogs, getGameState 
} from './globals.js';
import { GameGrid } from './grid.js';
import { Player, Bot } from './entities.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused, renderLevelSelect } from './ui.js';
import { LEVELS } from './levels.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    initLogs(p);

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(TARGET_FPS);
        p.randomSeed(42);
        
        // Start at level select
        gameState.gamePhase = "LEVEL_SELECT";
        
        // Initial Log
        p.logs.game_info.push({
            event: "SETUP_COMPLETE",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Clear background
        p.background(COLORS.BACKGROUND);

        switch (gameState.gamePhase) {
            case "LEVEL_SELECT":
                renderLevelSelect(p);
                break;
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateCamera(p);
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
            case "PAUSED":
                updateCamera(p);
                renderGame(p);
                renderPaused(p);
                renderHUD(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                updateCamera(p);
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
    
    p.keyReleased = function() {
        p.logs.inputs.push({
            type: "RELEASE",
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    };
    
    p.mousePressed = function() {
        if (gameState.gamePhase === "LEVEL_SELECT") {
            handleLevelClick(p);
        }
    };
});

function handleLevelClick(p) {
    const cols = 3;
    const boxWidth = 150;
    const boxHeight = 100;
    const spacing = 20;
    const startX = (CANVAS_WIDTH - (cols * boxWidth + (cols - 1) * spacing)) / 2;
    const startY = 100;
    
    for (let i = 0; i < LEVELS.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxWidth + spacing);
        const y = startY + row * (boxHeight + spacing);
        
        if (p.mouseX >= x && p.mouseX <= x + boxWidth &&
            p.mouseY >= y && p.mouseY <= y + boxHeight) {
            loadLevel(i, p);
            gameState.gamePhase = "START";
            break;
        }
    }
}

function loadLevel(levelIndex, p) {
    gameState.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    
    // Set world size
    gameState.worldWidth = level.worldWidth;
    gameState.worldHeight = level.worldHeight;
    
    // Initialize grid with new world size
    gameState.worldGrid = new GameGrid(p, level.worldWidth, level.worldHeight);
    
    resetGame(p);
}

function resetGame(p) {
    const level = LEVELS[gameState.currentLevel];
    
    gameState.worldGrid.reset(p);
    gameState.entities = [];
    gameState.enemies = [];
    
    // Create Player at starting position
    const playerX = 100;
    const playerY = 100;
    gameState.player = new Player(playerX, playerY);
    gameState.worldGrid.setSpawnArea(playerX, playerY, 30, 1, p);
    gameState.entities.push(gameState.player);
    
    // Create Bots from level config
    level.bots.forEach(cfg => {
        const bot = new Bot(cfg.id, cfg.x, cfg.y, cfg.color, cfg.territoryColor);
        gameState.worldGrid.setSpawnArea(cfg.x, cfg.y, 30, cfg.id, p);
        gameState.enemies.push(bot);
        gameState.entities.push(bot);
    });
    
    gameState.score = 0;
    
    // Initialize camera
    gameState.cameraX = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.cameraY = gameState.player.y - CANVAS_HEIGHT / 2;
}

window.resetGame = resetGame;

function updateCamera(p) {
    if (!gameState.player) return;
    
    // Smooth camera follow
    const targetX = gameState.player.x - CANVAS_WIDTH / 2;
    const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
    
    const smoothing = 0.1;
    gameState.cameraX += (targetX - gameState.cameraX) * smoothing;
    gameState.cameraY += (targetY - gameState.cameraY) * smoothing;
    
    // Clamp camera to world bounds
    gameState.cameraX = Math.max(0, Math.min(gameState.worldWidth - CANVAS_WIDTH, gameState.cameraX));
    gameState.cameraY = Math.max(0, Math.min(gameState.worldHeight - CANVAS_HEIGHT, gameState.cameraY));
}

function updateGame(p) {
    handleInput(p);
    
    // 1. Update all entities (Movement, Trails)
    gameState.entities.forEach(e => e.update(p));
    
    // 2. Cross-Entity Collision (Head vs Trail)
    checkCollisions();
    
    // 3. Update Score
    gameState.score = gameState.worldGrid.getScore(1); // Player ID 1
    
    // 4. Win Condition
    const level = LEVELS[gameState.currentLevel];
    if (gameState.score >= level.winCondition) {
        gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    // Remove dead entities
    gameState.entities = gameState.entities.filter(e => e.alive);
    gameState.enemies = gameState.enemies.filter(e => e.alive);
    
    // Check if player died
    if (!gameState.player.alive) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

function checkCollisions() {
    for (let attacker of gameState.entities) {
        if (!attacker.alive) continue;
        
        for (let victim of gameState.entities) {
            if (!victim.alive) continue;
            if (victim.trail.length < 2) continue;
            if (attacker === victim) continue;
            
            // Check segments
            for (let i = 0; i < victim.trail.length - 1; i++) {
                const p1 = victim.trail[i];
                const p2 = victim.trail[i+1];
                
                if (distToSegment(attacker.x, attacker.y, p1.x, p1.y, p2.x, p2.y) < attacker.radius) {
                    victim.die(`KILLED_BY_${attacker.id}`);
                    break;
                }
            }
        }
        
        // Head to Head collision
        for (let other of gameState.entities) {
            if (attacker === other || !other.alive) continue;
            
            const dist = Math.hypot(attacker.x - other.x, attacker.y - other.y);
            if (dist < attacker.radius + other.radius) {
                attacker.die("HEAD_ON_COLLISION");
                other.die("HEAD_ON_COLLISION");
            }
        }
    }
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
    if (l2 === 0) return Math.hypot(px-x1, py-y1);
    let t = ((px-x1)*(x2-x1) + (py-y1)*(y2-y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t*(x2-x1)), py - (y1 + t*(y2-y1)));
}

function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    gameState.worldGrid.render(p);
    gameState.entities.forEach(e => e.render(p));
    
    // Draw world boundaries
    p.noFill();
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(0, 0, gameState.worldWidth, gameState.worldHeight);
    
    p.pop();
}

window.gameInstance = gameInstance;