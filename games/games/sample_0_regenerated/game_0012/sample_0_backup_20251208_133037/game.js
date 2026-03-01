/**
 * Main Game Loop and Setup.
 * Initializes p5 instance, handles loading, drawing, and state transitions.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, logGameInfo, COLORS 
} from './globals.js';
import { 
    Player, Solid, Spike, Strawberry, DashCrystal, Goal 
} from './entities.js';
import { 
    handleKeyDown, handleKeyUp, clearFrameInputs 
} from './input.js';
import { 
    checkSpikeCollision, checkTriggerCollisions 
} from './physics.js';
import { 
    renderStartScreen, renderHUD, renderPauseScreen, renderGameOver 
} from './ui.js';
import { 
    createParticle, updateParticles, renderParticles 
} from './particles.js';

const p5 = window.p5;

// The Level Map (Vertical Slice)
// 30 tiles wide (600px / 20), arbitrary height.
// Let's make it 2 screens high (800px) or more.
// H = Wall, ^ = Spike Up, . = Air, S = Strawberry, D = Crystal, @ = Start, G = Goal
// We'll use a coordinate based builder for precision instead of ASCII to ensure jump heights work.

function buildLevel() {
    gameState.entities = [];
    gameState.solids = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.triggers = [];
    gameState.particles = [];
    gameState.score = 0;
    
    // --- GROUND FLOOR ---
    new Solid(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 40); // Floor
    new Solid(0, 0, 20, CANVAS_HEIGHT * 4); // Left Wall
    new Solid(CANVAS_WIDTH - 20, 0, 20, CANVAS_HEIGHT * 4); // Right Wall
    
    // --- SECTION 1: Basics ---
    new Solid(100, CANVAS_HEIGHT - 80, 100, 20);
    new Solid(300, CANVAS_HEIGHT - 140, 100, 20);
    new Spike(320, CANVAS_HEIGHT - 160, 'UP'); // Spike on platform
    
    new Strawberry(150, CANVAS_HEIGHT - 120);
    
    // --- SECTION 2: Wall Jumps ---
    // A vertical shaft
    new Solid(200, CANVAS_HEIGHT - 300, 20, 150); // Middle pillar
    
    // --- SECTION 3: Dash Practice ---
    // A gap too big to jump
    new Solid(0, CANVAS_HEIGHT - 450, 200, 20); // Ledge
    new Solid(350, CANVAS_HEIGHT - 450, 250, 20); // Landing
    
    new Spike(200, CANVAS_HEIGHT - 430, 'UP'); // Spikes in gap? No, maybe below
    new Solid(200, CANVAS_HEIGHT - 350, 150, 20); // Pit floor with spikes
    for(let i=0; i<7; i++) new Spike(210 + i*20, CANVAS_HEIGHT - 370, 'UP');
    
    new DashCrystal(275, CANVAS_HEIGHT - 520);
    
    // --- SECTION 4: The Summit ---
    // Climbing section
    new Solid(100, CANVAS_HEIGHT - 650, 20, 150);
    new Solid(480, CANVAS_HEIGHT - 750, 20, 150);
    
    new Spring(120, CANVAS_HEIGHT - 670); // Optional entity? We didn't define Spring, let's skip or implement
    
    // Goal Platform
    new Solid(250, CANVAS_HEIGHT - 900, 100, 20);
    new Goal(285, CANVAS_HEIGHT - 940);
    
    // Initial Player Position
    new Player(50, CANVAS_HEIGHT - 60);
    
    // Camera Init
    gameState.cameraY = 0;
    gameState.levelHeight = 1000;
}

// Fallback for Spring since we mentioned it
class Spring {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 10;
        gameState.triggers.push(this);
    }
    onCollide(player) {
        if (player.vy > 0) {
            player.vy = -10; // Bounce high
            player.refillDash();
            player.inputBuffer.dash = 0;
            player.inputBuffer.jump = 0;
        }
    }
    render(p) {
        p.fill(COLORS.spring);
        p.rect(this.x, this.y, this.width, this.height);
    }
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
        
        // Log start
        logGameInfo(p, { action: "SETUP", controlMode: gameState.controlMode });
        
        // Pre-create snow particles
        for(let i=0; i<50; i++) {
            createParticle(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 'SNOW');
        }
    };

    p.draw = function() {
        // Update Time
        let now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        p.background(COLORS.background);
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderGame(p);
            renderPauseScreen(p);
        } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
            renderGame(p);
            renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
        }
        
        // Clean inputs
        clearFrameInputs();
        
        // Auto-restart handling logic (if needed for testing loop)
        if (p.keyIsDown(82)) { // R key
             resetGame(p);
        }
    };

    p.keyPressed = function() {
        handleKeyDown(p);
    };

    p.keyReleased = function() {
        handleKeyUp(p);
    };
});

function resetGame(p) {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.deathCount = 0;
    buildLevel();
}

function updateGame(p) {
    if (!gameState.player) {
        buildLevel(); // Init level if empty
    }
    
    const player = gameState.player;
    
    // Update Entities
    player.update(p);
    gameState.triggers.forEach(t => { if(t.update) t.update(); });
    
    // Physics Checks
    if (checkSpikeCollision(p, player)) { // Pass p to checkSpikeCollision
        player.die();
    }
    checkTriggerCollisions(player);
    
    // Update Particles
    updateParticles();
    
    // Camera Follow
    // Keep player in middle-ish of screen vertically
    let targetCamY = player.y - CANVAS_HEIGHT / 2;
    // Clamp
    if (targetCamY > 0) targetCamY = 0; // Bottom (0 because coords go negative up? No, coords are positive down usually)
    // Wait, standard canvas: 0,0 is top left.
    // Ground is at CANVAS_HEIGHT.
    // So "up" is negative Y.
    // Level extends to -1000.
    
    if (targetCamY > 0) targetCamY = 0; // Don't show below ground
    if (targetCamY < -600) targetCamY = -600; // Top limit
    
    gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
    
    // Check Fall off world
    if (player.y > CANVAS_HEIGHT + 100) {
        player.die();
    }
}

function renderGame(p) {
    p.push();
    p.translate(0, -gameState.cameraY); // Simple Camera
    
    // Render World
    gameState.solids.forEach(s => s.render(p));
    gameState.hazards.forEach(h => h.render(p));
    gameState.triggers.forEach(t => t.render(p));
    gameState.collectibles.forEach(c => c.render(p));
    
    if (gameState.player && gameState.gamePhase !== "GAME_OVER_LOSE") {
        gameState.player.render(p);
    }
    
    renderParticles(p);
    
    p.pop();
}

window.gameInstance = gameInstance;