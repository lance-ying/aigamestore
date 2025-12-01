/**
 * Main Game Loop and Setup
 */
import { gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT, GENERATION_THRESHOLD, GRAVITY } from './globals.js';
import { handleInput, setKey, KEY, resetInputs } from './input.js';
import { updatePhysics } from './physics.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { Player, Platform, Enemy, Collectible } from './entities.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = initLogs();

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        // Log Initial State
        p.logs.game_info.push({
            event: "initialization",
            data: { phase: gameState.gamePhase },
            framecount: 0,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        
        // Handle Automated Inputs
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Mock key press
                if (action.keyCode === KEY.LEFT) gameState.player.moveLeft();
                if (action.keyCode === KEY.RIGHT) gameState.player.moveRight();
                if (action.keyCode === KEY.SPACE) gameState.player.shoot();
            }
        } else {
            // Handle Continuous Input (Movement)
            if (gameState.gamePhase === "PLAYING" && gameState.player) {
                if (p.keyIsDown(KEY.LEFT)) gameState.player.moveLeft();
                if (p.keyIsDown(KEY.RIGHT)) gameState.player.moveRight();
            }
        }

        // --- RENDER & UPDATE CYCLE ---
        
        // 1. Background
        renderBackground(p);
        
        // 2. State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderHUD(p);
                break;
            case "PAUSED":
                renderGameWorld(p);
                renderHUD(p);
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderHUD(p);
                renderGameOver(p);
                break;
        }
        
        // Log player info periodically
        if (gameState.player && gameState.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                score: gameState.score,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    };

    p.keyPressed = function() {
        setKey(p.keyCode, true);
        
        // Log Input
        p.logs.inputs.push({
            type: "keyPressed",
            key: p.key,
            keyCode: p.keyCode,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Global Phase Controls
        if (p.keyCode === KEY.ENTER && gameState.gamePhase === "START") {
            startGame();
        }
        
        if ((p.keyCode === KEY.ESC || p.key === 'p') && (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED")) {
            gameState.gamePhase = gameState.gamePhase === "PLAYING" ? "PAUSED" : "PLAYING";
        }
        
        if (p.keyCode === KEY.R && (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN")) {
            gameState.gamePhase = "START";
        }
        
        if (p.keyCode === KEY.SPACE && gameState.gamePhase === "PLAYING" && gameState.player) {
            gameState.player.shoot();
        }
        
        // Test Mode Toggle helper (SHIFT + T)
        if (p.key === 'T') {
             // Optional debug key
        }
    };

    p.keyReleased = function() {
        setKey(p.keyCode, false);
    };
});

// --- Game Logic Helpers ---

function startGame() {
    resetGame();
    gameState.gamePhase = "PLAYING";
}

function resetGame() {
    gameState.score = 0;
    gameState.cameraY = 0;
    gameState.maxHeightReached = 0;
    gameState.lastGenerationY = 380; // Start generating from the initial platform height
    
    // Clear entities
    gameState.entities = []; // General list if needed, but we use specific arrays
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    
    // Initialize Player
    gameState.player = new Player(CANVAS_WIDTH / 2, 300);
    
    // Initial Platforms
    gameState.platforms.push(new Platform(CANVAS_WIDTH / 2 - 30, 380, 'NORMAL')); // Starter platform
    generateContent(-500); // Generate initial chunk above screen
}

function generateContent(limitY) {
    // Generate platforms from lastGenerationY up to limitY
    // Note: limitY is negative (world coordinates go up into negative)
    
    while (gameState.lastGenerationY > limitY) {
        gameState.lastGenerationY -= (40 + Math.random() * 60); // Gap between platforms
        
        const y = gameState.lastGenerationY;
        const x = Math.random() * (CANVAS_WIDTH - 60);
        
        // Platform Type Logic
        let type = 'NORMAL';
        const rand = Math.random();
        
        // Difficulty scaling based on height (abs(y))
        const height = Math.abs(y);
        
        if (height > 1000) {
            if (rand < 0.2) type = 'MOVING';
            else if (rand < 0.3) type = 'BROKEN';
            else if (rand < 0.35) type = 'SPRING';
        } else {
             if (rand < 0.1) type = 'MOVING';
             else if (rand < 0.15) type = 'SPRING';
        }
        
        gameState.platforms.push(new Platform(x, y, type));
        
        // Chance for Enemy
        if (Math.random() < 0.05 && height > 500) {
            const ex = Math.random() * (CANVAS_WIDTH - 40) + 20;
            const et = Math.random() < 0.5 ? 'STATIC' : 'HOVER';
            gameState.enemies.push(new Enemy(ex, y - 40, et));
        }
        
        // Chance for Collectible
        if (Math.random() < 0.1) {
            gameState.collectibles.push(new Collectible(x + 30, y - 30));
        }
    }
}

function updateGameLogic(p) {
    // Physics & movement
    updatePhysics(p);
    
    // Camera Logic
    // Move camera up if player is above the threshold (middle of screen)
    // Threshold is e.g. 200px from top
    const targetY = gameState.player.y - 200;
    
    if (targetY < gameState.cameraY) {
        gameState.cameraY = targetY;
        gameState.score = Math.max(gameState.score, Math.abs(gameState.cameraY));
        gameState.maxHeightReached = gameState.cameraY;
    }
    
    // Fallback camera smoothing? No, classic doodle jump is strict on up movement
    // But if player falls, camera doesn't move down.
    
    // Procedural Generation trigger
    // Generate if the top of the screen (cameraY) is close to last generation point
    if (gameState.cameraY < gameState.lastGenerationY + CANVAS_HEIGHT) {
        generateContent(gameState.cameraY - CANVAS_HEIGHT); // Generate one screen height ahead
    }
    
    // Cleanup entities below screen
    const deleteThreshold = gameState.cameraY + CANVAS_HEIGHT + 100;
    
    gameState.platforms = gameState.platforms.filter(e => e.y < deleteThreshold);
    gameState.enemies = gameState.enemies.filter(e => e.y < deleteThreshold);
    gameState.collectibles = gameState.collectibles.filter(e => e.y < deleteThreshold);
    gameState.projectiles = gameState.projectiles.filter(e => e.y > gameState.cameraY - 100); // Remove if too high
    
    // Update Entities
    gameState.platforms.forEach(e => e.update());
    gameState.enemies.forEach(e => e.update());
    gameState.collectibles.forEach(e => e.update());
    gameState.projectiles.forEach(e => e.update());
    
    // Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function renderGameWorld(p) {
    p.push();
    
    // Apply Camera Transform
    // cameraY is negative (world coords). We want to shift world DOWN by -cameraY
    // So if cameraY is -100, we translate(0, 100).
    p.translate(0, -gameState.cameraY);
    
    // Render Order: Platforms -> Collectibles -> Enemies -> Player -> Projectiles -> Particles
    gameState.platforms.forEach(e => e.render(p));
    gameState.collectibles.forEach(e => e.render(p));
    gameState.enemies.forEach(e => e.render(p));
    if (gameState.player) gameState.player.render(p);
    gameState.projectiles.forEach(e => e.render(p));
    gameState.particles.forEach(e => e.render(p));
    
    p.pop();
}

function renderBackground(p) {
    // Dynamic background based on height
    const height = Math.abs(gameState.cameraY);
    let bgCol;
    
    if (height < 2000) {
        // Paper / Grass
        bgCol = p.color(245, 245, 240); // Paper
    } else if (height < 5000) {
        // Jungle
        bgCol = p.color(200, 230, 200);
    } else {
        // Space
        bgCol = p.color(20, 20, 40);
    }
    
    p.background(bgCol);
    
    // Draw Grid
    p.stroke(0, 0, 0, 20);
    p.strokeWeight(1);
    const gridSize = 30;
    
    // Determine grid offset based on camera to make it static relative to background or scrolling
    // Let's make it scroll with parallax or static? Static grid looks like graph paper
    if (height < 2000) {
        for (let x = 0; x < CANVAS_WIDTH; x += gridSize) p.line(x, 0, x, CANVAS_HEIGHT);
        for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) p.line(0, y, CANVAS_WIDTH, y);
    } else if (height >= 5000) {
        // Stars for space
        p.randomSeed(42); // Consistent stars
        p.fill(255);
        p.noStroke();
        for(let i=0; i<50; i++) {
            p.circle(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), p.random(2, 4));
        }
    }
}

// Expose instance
window.gameInstance = gameInstance;

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset focus to canvas logic if needed, but handled by global window listeners mostly
};