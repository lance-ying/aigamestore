/**
 * game.js
 * Main entry point. Setup, Draw loop, Game Logic integration.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS, COLORS, gameState, initLogs, logGameInfo 
} from './globals.js';
import { Player, spawnParticles, spawnConfetti, Collectible } from './entities.js';
import { WorldManager } from './world.js';
import { PhysicsEngine } from './physics.js';
import { handleKeyPress, handleKeyRelease, isKeyDown, KEYS } from './input.js';
import { renderUI } from './ui.js';
import { hexToRgb } from './utils.js';
import { get_automated_testing_action } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initialize Game State
        gameState.world = new WorldManager();
        resetGame();
        
        gameState.gamePhase = "START";
        
        logGameInfo(p, { action: "SETUP_COMPLETE" });
    };

    // Global reset function attached to instance for input.js access
    p.resetGame = function() {
        resetGame();
    };

    p.draw = function() {
        // Time management
        const current = p.millis();
        gameState.deltaTime = (current - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = current;
        gameState.frameCount = p.frameCount;
        
        // Input Handling (Polling for smooth movement)
        handleContinuousInput();
        
        // Automated Test Input override
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate key press just for this frame's logic
                gameState.keys[action.keyCode] = true;
                // Note: release logic is tricky for pulse inputs, 
                // but since we poll isKeyDown every frame, we need to manually clear 
                // or assume the bot holds it. 
                // The simple bot implementation returns an action if it wants to move.
                // We should clear keys if no action returned? 
                // For simplicity, let's just Apply force directly or set key.
            } else {
                // Clear keys if no action from bot to stop movement
                gameState.keys[KEYS.LEFT] = false;
                gameState.keys[KEYS.RIGHT] = false;
            }
        }

        // --- UPDATE & RENDER ---
        
        // 1. Background
        renderBackground(p);
        
        // 2. Logic based on Phase
        switch (gameState.gamePhase) {
            case "START":
                // Idle animation
                if (gameState.world.tiles.length === 0) gameState.world.init();
                updateCamera();
                renderWorld(p);
                renderUI(p);
                break;
                
            case "PLAYING":
                updateGameLogic();
                renderWorld(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderWorld(p);
                renderUI(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderWorld(p);
                renderUI(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

// --- HELPER FUNCTIONS ---

function resetGame() {
    gameState.score = 0;
    gameState.distance = 0;
    gameState.combo = 1;
    gameState.currentSpeed = CONSTANTS.FORWARD_SPEED_INITIAL;
    gameState.entities = [];
    gameState.particles = [];
    gameState.collectibles = [];
    
    // Init World
    gameState.world.init();
    
    // Init Player
    gameState.player = new Player();
    gameState.entities.push(gameState.player);
    gameState.camera = { x: 0, y: 0 };
    
    gameState.gamePhase = "START";
}

function handleContinuousInput() {
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
    
    const player = gameState.player;
    
    // Steering
    if (isKeyDown(KEYS.LEFT)) {
        player.ax = -CONSTANTS.LATERAL_ACCEL;
    } else if (isKeyDown(KEYS.RIGHT)) {
        player.ax = CONSTANTS.LATERAL_ACCEL;
    } else {
        player.ax = 0;
    }
}

function updateGameLogic() {
    const player = gameState.player;
    
    // 1. Move Player Forward (Auto-run)
    player.vy = gameState.currentSpeed;
    
    // 2. Update Entities
    // Iterate backwards for safe removal
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        ent.update(gameState.frameCount);
        if (ent.dead) {
            gameState.entities.splice(i, 1);
            // Also remove from specific arrays
            const pIdx = gameState.particles.indexOf(ent);
            if (pIdx > -1) gameState.particles.splice(pIdx, 1);
            const cIdx = gameState.collectibles.indexOf(ent);
            if (cIdx > -1) gameState.collectibles.splice(cIdx, 1);
        }
    }
    
    // 3. Update World Generation
    gameState.world.update(player.y);
    
    // 4. Update Camera
    updateCamera();
    
    // 5. Physics & Collision Interactions
    resolveCollisions();
    
    // 6. Stats
    gameState.distance = Math.floor(player.y);
    
    // 7. Check Game Over
    if (player.dead) {
        handleGameOver();
    }
}

function updateCamera() {
    if (gameState.player) {
        // Camera Y follows player Y smoothly
        gameState.camera.y = gameState.player.y;
        // Camera X could slightly follow player X for dynamic feel, but usually fixed center is better for aiming
        gameState.camera.x = gameState.player.x * 0.3; // Slight parallax
    }
}

function resolveCollisions() {
    const player = gameState.player;
    
    // Collectibles
    const collectedIdx = PhysicsEngine.checkCollectibleCollision(player, gameState.collectibles);
    if (collectedIdx !== -1) {
        const item = gameState.collectibles[collectedIdx];
        
        // Effect
        spawnParticles(item.x, item.y, item.z, hexToRgb(COLORS.PARTICLE_COLLECT), 10, 2);
        gameState.score += 50 * gameState.combo;
        gameState.combo++;
        
        // Remove
        item.dead = true;
    }
    
    // Landing on Tiles
    // Only check if player is "in air" but falling close to 0
    // If player.z is 0, they are "grounded" momentarily before bounce
    if (!player.isGrounded) {
        const landedTile = PhysicsEngine.checkLanding(player, gameState.world.tiles);
        
        if (landedTile) {
            // Success Land
            player.bounce();
            player.isGrounded = false; // Immediately bounce back up
            landedTile.onLand();
            
            // Score
            if (!landedTile.processed) {
                gameState.score += 10 * gameState.combo;
                gameState.tilesHopped++;
                landedTile.processed = true;
                
                // Spawn impact particles
                spawnParticles(player.x, player.y, 0, hexToRgb(COLORS.PARTICLE_LAND), 5, 1.5);
            }
        } else {
            // If z <= 0 and NO tile, we don't bounce. Gravity pulls z negative -> death.
            // Logic handled in Player.update()
        }
    }
}

function handleGameOver() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    spawnConfetti(gameState.player.x, gameState.player.y, gameState.player.z, 20);
}

function renderBackground(p) {
    p.background(hexToRgb(COLORS.BACKGROUND).r, hexToRgb(COLORS.BACKGROUND).g, hexToRgb(COLORS.BACKGROUND).b);
    
    // Draw pseudo-3D grid floor
    p.push();
    p.stroke(40);
    p.strokeWeight(1);
    
    // Vertical lines (perspective)
    const camX = gameState.camera.x;
    const camY = gameState.camera.y;
    
    const spacing = 100;
    const offsetX = (CANVAS_WIDTH/2 - camX) % spacing;
    
    // Draw vertical lines
    for (let x = -CANVAS_WIDTH; x < CANVAS_WIDTH * 2; x += spacing) {
        // Parallax scroll effect
        // Just simple 2D lines for the "void" below
        p.line(x + offsetX, 0, x + offsetX, CANVAS_HEIGHT);
    }
    
    // Horizontal lines (moving down)
    const offsetY = (camY * 0.5) % spacing; // Move slower than player
    for (let y = 0; y < CANVAS_HEIGHT; y += spacing) {
        let drawY = (y - offsetY + spacing) % CANVAS_HEIGHT;
        p.line(0, drawY, CANVAS_WIDTH, drawY);
    }
    
    p.pop();
}

function renderWorld(p) {
    const cam = gameState.camera;
    
    // Entities are rendered in order? 
    // Ideally sort by Y (depth) so far things are drawn first
    // Since Y grows "down" (forward), things with higher Y are "closer" to the camera in a top-down scroll?
    // Wait, in this "Into Screen" logic:
    // Player moves +Y. Tiles spawn at +Y.
    // So larger Y is "further away"? No.
    // Screen Y = (EntityY - CamY) + Offset.
    // If EntityY > CamY, Screen Y > Offset. (Down screen).
    // So Player is at Offset. Tiles spawn "ahead" (Screen Y > Offset?).
    // No, standard runner: Player is at bottom, tiles come from top?
    // OR Player is at top, tiles come from bottom?
    // Let's visualize: 
    // Player Y increases. Camera Y increases.
    // Tile Y is large (future).
    // Screen Y = (TileY - CamY) + Offset.
    // If TileY > CamY, ScreenY is positive.
    // If TileY is much larger, ScreenY is off bottom of screen.
    // This implies we are running "Down" the screen.
    // So things with *Lowest* Y should be drawn first (top of screen, behind).
    // Things with *Highest* Y are at bottom (front).
    // So we sort by Y ascending.
    
    // Need to copy array to sort
    const renderList = [...gameState.entities, ...gameState.particles];
    renderList.sort((a, b) => a.y - b.y);
    
    // Actually, Z matters too.
    // But mainly Y for painter's algorithm in this 2.5D view.
    
    renderList.forEach(ent => {
        if (ent.render) ent.render(p, cam);
    });
}

// Expose instance
window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart on mode switch for clean test
    if (gameState.gamePhase !== "START") {
        resetGame();
        gameState.gamePhase = "PLAYING"; // Auto start for tests
    }
};