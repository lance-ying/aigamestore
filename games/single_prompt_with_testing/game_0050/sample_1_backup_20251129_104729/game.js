import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, COLORS, 
    gameState, initLogs, getGameState 
} from './globals.js';
import { GameGrid } from './grid.js';
import { Player, Bot } from './entities.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPaused } from './ui.js';
import { collideLineLine } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    initLogs(p);

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(TARGET_FPS);
        p.randomSeed(42);
        
        // Initialize Game State
        gameState.worldGrid = new GameGrid(p);
        resetGame(p);
        
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
                renderHUD(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
    
    p.keyReleased = function() {
        // Optional: Handle release if needed for smooth controls
        p.logs.inputs.push({
            type: "RELEASE",
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    };
});

function resetGame(p) {
    gameState.worldGrid.reset(p);
    gameState.entities = [];
    gameState.enemies = [];
    
    // Create Player
    gameState.player = new Player(100, 100);
    // Give player initial territory
    gameState.worldGrid.setSpawnArea(100, 100, 30, 1, p);
    
    gameState.entities.push(gameState.player);
    
    // Create Bots
    const botConfigs = [
        {id: 2, x: 500, y: 100, c: COLORS.ENEMY_1, tc: COLORS.ENEMY_1_TERRITORY},
        {id: 3, x: 100, y: 300, c: COLORS.ENEMY_2, tc: COLORS.ENEMY_2_TERRITORY},
        {id: 4, x: 500, y: 300, c: COLORS.ENEMY_3, tc: COLORS.ENEMY_3_TERRITORY}
    ];
    
    botConfigs.forEach(cfg => {
        const bot = new Bot(cfg.id, cfg.x, cfg.y, cfg.c, cfg.tc);
        gameState.worldGrid.setSpawnArea(cfg.x, cfg.y, 30, cfg.id, p);
        gameState.enemies.push(bot);
        gameState.entities.push(bot);
    });
    
    gameState.score = 0;
}

// Exposed globally for the 'R' key handler in input.js
window.resetGame = resetGame;

function updateGame(p) {
    handleInput(p);
    
    // 1. Update all entities (Movement, Trails)
    gameState.entities.forEach(e => e.update(p));
    
    // 2. Cross-Entity Collision (Head vs Trail)
    checkCollisions();
    
    // 3. Update Score
    gameState.score = gameState.worldGrid.getScore(1); // Player ID 1
    
    // 4. Win Condition
    if (gameState.score >= 90) { // Win at 90%
        gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    // Remove dead entities
    gameState.entities = gameState.entities.filter(e => e.alive);
    gameState.enemies = gameState.enemies.filter(e => e.alive);
    
    // Check if player died (removed from entities list or marked dead)
    if (!gameState.player.alive) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

function checkCollisions() {
    // Check every entity against every other entity's trail
    
    for (let attacker of gameState.entities) {
        if (!attacker.alive) continue;
        
        for (let victim of gameState.entities) {
            if (!victim.alive) continue;
            if (victim.trail.length < 2) continue;
            
            // Optimization: Bounding box check first
            // But for low entity count (4), O(N^2) is fine.
            
            // Check attacker HEAD against victim TRAIL
            // Using a simple proximity check for each trail segment
            // This is O(TrailLength), potentially expensive. 
            // Optimization: Only check if attacker is NOT in their own territory (assumed safe? No, can be killed in own territory if trail is cut outside)
            // Wait, trail only exists outside territory.
            
            // If Attacker hits Victim's trail:
            // 1. Attacker kills Victim (if Attacker != Victim)
            // 2. Attacker kills Self (if Attacker == Victim) -> Handled in Entity.update already
            
            if (attacker === victim) continue; // Self-collision handled in update
            
            // Check segments
            for (let i = 0; i < victim.trail.length - 1; i++) {
                const p1 = victim.trail[i];
                const p2 = victim.trail[i+1];
                
                // Segment collision with Attacker Head (Point/Small Circle)
                // p5.collide2d collideLineCircle(x1, y1, x2, y2, cx, cy, d)
                // Note: p5.collide2d needs to be accessible. We use imported functions usually or raw math.
                // Using simple distance to segment check
                
                if (distToSegment(attacker.x, attacker.y, p1.x, p1.y, p2.x, p2.y) < attacker.radius) {
                    victim.die(`KILLED_BY_${attacker.id}`);
                    // Award bonus?
                    break;
                }
            }
        }
        
        // Head to Head collision
        for (let other of gameState.entities) {
            if (attacker === other || !other.alive) continue;
            
            const dist = Math.hypot(attacker.x - other.x, attacker.y - other.y);
            if (dist < attacker.radius + other.radius) {
                // Both die
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
    gameState.worldGrid.render(p);
    gameState.entities.forEach(e => e.render(p));
}

window.gameInstance = gameInstance;