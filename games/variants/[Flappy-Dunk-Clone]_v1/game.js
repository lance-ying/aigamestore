import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Composite } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './globals.js';
import { Player, Hoop, Particle } from './entities.js';
import { renderGame, renderStartScreen, renderGameOver, renderPaused } from './renderer.js';
import { setupPhysics } from './physics.js';
import { updateCamera } from './camera.js';

const p5 = window.p5;

function initializeGame(p) {
    // Reset World
    World.clear(gameState.world);
    Engine.clear(gameState.engine);
    
    // Reset Game State vars
    gameState.score = 0;
    gameState.distance = 0;
    gameState.bounces = 1; // Reset bounces (Modified: starts at 1)
    gameState.hoops = [];
    gameState.particles = [];
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.nextHoopIndex = 0;

    // Create Ground (Static, infinitely wide logically, but we use a wide rectangle that moves? 
    // No, better to have a static ground that we periodically move or just a really long one.
    // For "endless", we usually delete and re-add segments. 
    // Or simpler: A static ground body that follows the camera X?
    // Matter.js static bodies can be moved.
    gameState.ground = Bodies.rectangle(0, CANVAS_HEIGHT - 25, 100000, 50, { 
        isStatic: true,
        label: 'ground',
        friction: 0.1
    });
    World.add(gameState.world, gameState.ground);

    // Ceiling (invisible wall to prevent flying over everything)
    gameState.ceiling = Bodies.rectangle(0, -1000, 100000, 100, {
        isStatic: true,
        label: 'ceiling'
    });
    World.add(gameState.world, gameState.ceiling);

    // Create Player
    gameState.player = new Player(200, CANVAS_HEIGHT / 2);
    World.add(gameState.world, gameState.player.body);

    // Initial Hoops
    spawnHoopChunk(400);
}

function spawnHoopChunk(startX) {
    // Spawn a batch of hoops
    for (let i = 0; i < 5; i++) {
        const x = startX + i * GAME_CONFIG.HOOP_SPACING;
        // Random height
        // Center of screen is H/2 (200). 
        // Ground is at 350 (top visual). 
        // We want to avoid spawning too low. 
        // Range: 100 to 250 (leaving 100px buffer from ground)
        const y = Math.random() * 150 + 100;
        
        const hoop = new Hoop(x, y);

        // Randomly add bounce supply (Modified: reduced from 0.2 to 0.08)
        if (Math.random() < 0.08) {
            hoop.addSupply();
        }

        hoop.addToWorld(gameState.world);
        gameState.hoops.push(hoop);
    }
}

function updateGameLogic(p) {
    // 1. Spawning Hoops
    // Get last hoop
    if (gameState.hoops.length > 0) {
        const lastHoop = gameState.hoops[gameState.hoops.length - 1];
        // If player is getting close to the end of generated hoops, spawn more
        // Player X + Screen Width > Last Hoop X - Buffer
        if (gameState.player.body.position.x + CANVAS_WIDTH > lastHoop.x) {
            spawnHoopChunk(lastHoop.x + GAME_CONFIG.HOOP_SPACING);
        }
    }

    // 2. Cleanup Old Hoops
    const cleanupThreshold = gameState.camera.x - 200;
    gameState.hoops = gameState.hoops.filter(hoop => {
        if (hoop.x < cleanupThreshold) {
            hoop.removeFromWorld(gameState.world);
            return false;
        }
        return true;
    });

    // 3. Move Ground (keep it under player)
    // Actually, making a super wide static body is easiest, but eventually float precision issues occur at x=1,000,000.
    // Better: Reposition ground to camera.x
    Matter.Body.setPosition(gameState.ground, {
        x: gameState.camera.x,
        y: CANVAS_HEIGHT + 0 // Half height of ground rect (50/2 = 25) is handled by body creation y? 
        // Initial creation was y=375.
        // Let's just update x.
    });
    // Ground rect width is 100000. It's fine for a while. 
    // If x > 40000, reset player and world origin? (Too complex for this exercise).
    // Let's assume standard gameplay doesn't go on for hours.

    // 4. Update Entities
    gameState.player.update();
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.update();
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

const gameInstance = new p5(p => {
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        
        gameState.p5 = p;
        gameState.engine = Engine.create();
        gameState.world = gameState.engine.world;
        
        setupPhysics(gameState.engine);
        
        p.logs = { game_info: [], player_info: [], inputs: [] };
        
        // Initial state log
        p.logs.game_info.push({
            event: "initialization",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        const now = Date.now();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                // Only update physics when playing
                Engine.update(gameState.engine, 1000 / 60);
                updateGameLogic(p);
                updateCamera();
                renderGame(p);
                break;
            case "PAUSED":
                // Don't update physics or game logic when paused
                renderGame(p); // Render underlying game frozen
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                Engine.update(gameState.engine, 1000 / 60);
                updateCamera(); // Keep following for a bit? Or freeze?
                renderGame(p);
                renderGameOver(p);
                break;
        }

        // Logging
        if (gameState.player && gameState.gamePhase === "PLAYING" && p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: gameState.player.body.position.x,
                y: gameState.player.body.position.y,
                vx: gameState.player.body.velocity.x,
                vy: gameState.player.body.velocity.y,
                score: gameState.score,
                frame: p.frameCount
            });
        }
    };

    p.keyPressed = function() {
        p.logs.inputs.push({ key: p.key, code: p.keyCode, type: "press", frame: p.frameCount });

        // Global keys
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }

        if (p.key === 'r' || p.key === 'R') {
            if (gameState.gamePhase.includes("GAME_OVER")) {
                gameState.gamePhase = "START";
                initializeGame(p);
            }
        }

        // Phase specific
        if (gameState.gamePhase === "START") {
            if (p.keyCode === 13) { // ENTER
                initializeGame(p);
                gameState.gamePhase = "PLAYING";
            }
        } else if (gameState.gamePhase === "PLAYING") {
            // Gameplay Controls
            const jumpKeys = [32, 38, 90, 87]; // Space, Up, Z, W
            if (jumpKeys.includes(p.keyCode)) {
                if (gameState.player) gameState.player.flap();
            }
        }
    };
    
    // Mouse click support for "Tap" feel
    p.mousePressed = function() {
        // Ensure click is on canvas
        if (p.mouseX >= 0 && p.mouseX <= CANVAS_WIDTH && p.mouseY >= 0 && p.mouseY <= CANVAS_HEIGHT) {
             if (gameState.gamePhase === "PLAYING" && gameState.player) {
                gameState.player.flap();
                return false;
             }
        }
    }
});