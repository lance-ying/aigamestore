// main game loop and logic
import { 
    gameState, getGameState, resetGame,
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    INITIAL_BLOCK_WIDTH, INITIAL_BLOCK_HEIGHT, 
    INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED, WIN_SCORE,
    COLORS, getBlockColor 
} from './globals.js';
import { Block, ActiveBlock, Debris, BackgroundParticle } from './entities.js';
import { checkStackAlignment, updatePhysics } from './physics.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { handleKeyPress, get_automated_testing_action } from './input.js';

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
        
        // Initialize background particles
        for(let i=0; i<50; i++) {
            gameState.backgroundParticles.push(new BackgroundParticle(p));
        }
        
        // Initial Game State
        gameState.gamePhase = "START";
        gameState.controlMode = "HUMAN";
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Update inputs from automated tester if needed
        handleAutomatedInput(p);
        
        // Draw common background
        renderBackground(p);
        
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
                renderHUD(p);
                renderPausedOverlay(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGame(p);
                renderHUD(p);
                renderGameOver(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderHUD(p);
                renderGameOver(p, false);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
});

window.gameInstance = gameInstance;

// Helper to handle automated inputs
function handleAutomatedInput(p) {
    if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
            // Simulate key press behavior
            p.keyCode = action.keyCode;
            p.keyPressed();
        }
    }
}

// ==========================================
// Game Logic
// ==========================================

function renderBackground(p) {
    p.background(COLORS.BACKGROUND);
    
    // Render particles
    gameState.backgroundParticles.forEach(particle => {
        particle.update(gameState.cameraY);
        particle.render(p, gameState.cameraY);
    });
}

function updateGame(p) {
    // 1. Initialize logic (if game just started)
    if (gameState.stack.length === 0 && !gameState.activeBlock) {
        initFirstBlock(p);
    }

    // 2. Update Active Block
    if (gameState.activeBlock) {
        gameState.activeBlock.update();
    }
    
    // 3. Update Debris
    updatePhysics();
    // Remove dead debris
    for(let i = gameState.debris.length - 1; i >= 0; i--) {
        gameState.debris[i].update();
        if(gameState.debris[i].isDead()) {
            gameState.debris.splice(i, 1);
        }
    }
    
    // 4. Update Camera
    // Calculate target Y based on top of stack
    if (gameState.stack.length > 0) {
        // We want the top block to be around 2/3 down the screen
        const topBlock = gameState.stack[gameState.stack.length - 1];
        gameState.targetCameraY = topBlock.y - CANVAS_HEIGHT * 0.7;
    } else {
        gameState.targetCameraY = 0;
    }
    
    // Smooth camera movement
    gameState.cameraY = p.lerp(gameState.cameraY, gameState.targetCameraY, 0.05);
    
    // Apply camera shake decay
    if (gameState.cameraShake > 0) {
        gameState.cameraShake *= 0.9;
        if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
    }
}

function renderGame(p) {
    p.push();
    
    // Apply Camera translation
    // We only translate Y. X is fixed.
    // Negative translation because moving camera up = moving world down
    let shakeX = (Math.random() - 0.5) * gameState.cameraShake;
    let shakeY = (Math.random() - 0.5) * gameState.cameraShake;
    
    // Clamp cameraY so we don't see below the start
    const renderY = Math.min(0, -gameState.cameraY);
    
    p.translate(shakeX, renderY + shakeY);
    
    // Draw debris (behind stack)
    gameState.debris.forEach(d => d.render(p));
    
    // Draw Stack
    gameState.stack.forEach(block => block.render(p));
    
    // Draw Active Block
    if (gameState.activeBlock) {
        gameState.activeBlock.render(p);
    }
    
    // Draw ground line
    p.stroke(COLORS.ACCENT);
    p.line(0, CANVAS_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.pop();
}

function initFirstBlock(p) {
    // Base block
    const baseBlock = new Block(
        CANVAS_WIDTH / 2, 
        CANVAS_HEIGHT - INITIAL_BLOCK_HEIGHT/2, 
        INITIAL_BLOCK_WIDTH, 
        INITIAL_BLOCK_HEIGHT, 
        getBlockColor(0, p)
    );
    gameState.stack.push(baseBlock);
    
    spawnNextBlock(p);
}

function spawnNextBlock(p) {
    const prevBlock = gameState.stack[gameState.stack.length - 1];
    const newIndex = gameState.stack.length;
    
    // Calculate new speed based on score/level
    let newSpeed = INITIAL_SPEED + (newIndex * SPEED_INCREMENT);
    newSpeed = Math.min(newSpeed, MAX_SPEED);
    
    const nextY = prevBlock.y - INITIAL_BLOCK_HEIGHT;
    
    gameState.activeBlock = new ActiveBlock(
        nextY,
        prevBlock.width,
        INITIAL_BLOCK_HEIGHT,
        getBlockColor(newIndex, p),
        newSpeed,
        newIndex
    );
}

// Exported to be used in input.js
export function handleBlockPlacement(p) {
    if (!gameState.activeBlock) return;
    if (gameState.stack.length === 0) return; // Should not happen after init
    
    const active = gameState.activeBlock;
    const prev = gameState.stack[gameState.stack.length - 1];
    
    const result = checkStackAlignment(active, prev);
    
    if (result.isMiss) {
        // Game Over Logic
        spawnDebris(p, active.x, active.y, active.width, active.height, active.color);
        gameState.activeBlock = null;
        gameState.cameraShake = 20;
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        p.logs.game_info.push({
            event: "game_over",
            score: gameState.score,
            reason: "miss",
            timestamp: Date.now()
        });
        
    } else {
        // Success Logic
        let placedWidth = active.width;
        let placedX = active.x;
        
        if (result.isPerfect) {
            // Perfect placement bonus
            placedX = result.snappedX; // Snap to center
            gameState.cameraShake = 5; // Little thump
            // maybe add particle effect here
            gameState.score += 2; // Bonus score
        } else {
            // Cut the block
            placedWidth = result.overlap;
            
            // Calculate placement X
            // If active was to the right (diff > 0), we keep the left part of active and right part of prev overlap
            // The center of the new block is: prev.x + (diff/2)
            placedX = prev.x + (result.diff / 2);
            
            // Spawn debris for the cut part
            const cutWidth = Math.abs(result.diff);
            const cutX = (result.diff > 0) 
                ? active.x + (active.width/2) - (cutWidth/2) // Cut from right
                : active.x - (active.width/2) + (cutWidth/2); // Cut from left
                
            spawnDebris(p, cutX, active.y, cutWidth, active.height, active.color);
            
            gameState.score += 1;
        }
        
        // Add new permanent block
        const newBlock = new Block(placedX, active.y, placedWidth, active.height, active.color);
        gameState.stack.push(newBlock);
        
        // Log
        p.logs.player_info.push({
            score: gameState.score,
            stackHeight: gameState.stack.length,
            lastPlacement: result.isPerfect ? "perfect" : "normal",
            timestamp: Date.now()
        });
        
        // Check Win Condition
        if (gameState.stack.length >= WIN_SCORE) {
            gameState.activeBlock = null;
            gameState.gamePhase = "GAME_OVER_WIN";
        } else {
            // Next turn
            spawnNextBlock(p);
        }
    }
}

function spawnDebris(p, x, y, w, h, c) {
    const debris = new Debris(x, y, w, h, c);
    gameState.debris.push(debris);
}