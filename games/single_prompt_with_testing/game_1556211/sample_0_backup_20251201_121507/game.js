import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, logGameEvent,
    PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE 
} from './globals.js';
import { handleKeyDown, handleKeyUp } from './input.js';
import { Player, Projectile } from './entities.js';
import { generateWorld } from './world.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { spawnParticles } from './particles.js';

const p5 = window.p5;

// Reset game state
export function resetGame(p) {
    p.randomSeed(42);
    
    gameState.player = new Player(0, 0);
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.shake = 0;
    gameState.currentNarration = "The Kid wakes up.";
    gameState.narrationTimer = 180;
    
    generateWorld(); // Uses predefined seed logic internally
    
    logGameEvent(p, 'GAME_RESET', { mode: gameState.controlMode });
}

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
        
        // Initial log
        logGameEvent(p, 'INIT', {});
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        
        // Background
        p.background(20, 15, 30);
        
        // Global Shake
        if (gameState.shake > 0) {
            p.translate(p.random(-gameState.shake, gameState.shake), p.random(-gameState.shake, gameState.shake));
            gameState.shake *= 0.9;
            if (gameState.shake < 0.5) gameState.shake = 0;
        }
        
        switch (gameState.gamePhase) {
            case PHASE_START:
                renderStartScreen(p);
                break;
                
            case PHASE_PLAYING:
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case PHASE_PAUSED:
                renderGame(p); // Render underlying game
                renderHUD(p);
                renderPaused(p);
                break;
                
            case PHASE_GAME_OVER_WIN:
            case PHASE_GAME_OVER_LOSE:
                renderGame(p);
                renderGameOver(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

function updateGame(p) {
    const player = gameState.player;
    
    // Camera Follow
    if (player) {
        const targetX = -player.x + CANVAS_WIDTH / 2;
        const targetY = -player.y + CANVAS_HEIGHT / 2;
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
    }
    
    // Update Tiles (Activation)
    gameState.tiles.forEach(tile => tile.update(player.x, player.y));
    
    // Update Entities
    player.update(p);
    gameState.enemies.forEach(e => e.update(p));
    gameState.projectiles.forEach((proj, i) => {
        proj.update(p);
        if (proj.life <= 0) gameState.projectiles.splice(i, 1);
    });
    gameState.particles.forEach((part, i) => {
        part.update();
        if (part.life <= 0) gameState.particles.splice(i, 1);
    });
    
    // Win Condition
    const distToEnd = Math.sqrt((player.x - gameState.endPoint.x)**2 + (player.y - gameState.endPoint.y)**2);
    if (distToEnd < 50) {
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        logGameEvent(p, 'WIN', { score: gameState.score });
    }
    
    // Narration Timer
    if (gameState.narrationTimer > 0) {
        gameState.narrationTimer--;
        if (gameState.narrationTimer <= 0) gameState.currentNarration = null;
    }
    
    // Trigger narration randomly
    if (!gameState.currentNarration && p.random() < 0.001) {
        const lines = [
            "Scumbags swarming...",
            "Just keeps going...",
            "The path forms ahead.",
            "Watch your step, Kid."
        ];
        gameState.currentNarration = p.random(lines);
        gameState.narrationTimer = 120;
    }
}

function renderGame(p) {
    p.push();
    p.translate(gameState.camera.x, gameState.camera.y);
    
    // Render Tiles
    gameState.tiles.forEach(tile => tile.render(p));
    
    // Render Ground decor/End point
    p.push();
    p.translate(gameState.endPoint.x, gameState.endPoint.y);
    p.fill(0, 255, 255, 100);
    p.circle(0, 0, 60);
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text("CORE", 0, 0);
    p.pop();
    
    // Render Entities (Simple depth sorting by Y)
    const entities = [gameState.player, ...gameState.enemies, ...gameState.projectiles];
    entities.sort((a, b) => a.y - b.y);
    
    entities.forEach(e => e.render(p));
    gameState.particles.forEach(part => part.render(p));
    
    p.pop();
}

// Global control for testing
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

window.gameInstance = gameInstance;