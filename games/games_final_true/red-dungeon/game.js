import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, gameState, 
    PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE, PHASE_GAME_OVER_WIN 
} from './globals.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { updateLevelGen } from './level_gen.js';
import { updateParticles } from './particles.js';
import { getGridKey, gridToWorld } from './utils.js';


const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
    
    // Custom key tracking
    p.keysDown = {};
    p.keysPrev = {};
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Log initial
        p.logs.game_info.push({ data: { gamePhase: gameState.gamePhase }, framecount: p.frameCount, timestamp: Date.now() });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Update input state (wasPressed logic)
        // This ensures p.keysPrev is updated for p.keyWasDown
        for (let k in p.keysDown) {
            p.keysPrev[k] = p.keysDown[k];
        }
        
        // Handle Global Inputs (Pause, etc)
        handleInput(p);

        p.background(20, 20, 30);

        if (gameState.gamePhase === PHASE_START) {
            renderStartScreen(p);
        } else if (gameState.gamePhase === PHASE_PLAYING) {
            updateGame(p);
            renderGame(p);
            renderUI(p);
        } else if (gameState.gamePhase === PHASE_PAUSED) {
            renderGame(p);
            renderPaused(p);
        } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE || gameState.gamePhase === PHASE_GAME_OVER_WIN) {
            renderGame(p);
            renderGameOver(p);
        }
    };
    
    p.keyPressed = function() {
        p.keysDown[p.keyCode] = true;
    };
    
    p.keyReleased = function() {
        p.keysDown[p.keyCode] = false;
    };
    
    // Extensions
    p.keyWasDown = function(code) {
        return p.keysPrev[code] === true;
    };
});

function updateGame(p) {
    // 1. Level Generation
    updateLevelGen(p);
    
    // 2. Entities
    if (gameState.player) gameState.player.update(p);
    
    gameState.entities.forEach(e => {
        if (e !== gameState.player) e.update(p);
    });
    
    // Clean up dead entities
    gameState.entities = gameState.entities.filter(e => {
        if (e.collected) return false; // coins
        // keep others unless specific destroy logic exists
        return true;
    });

    // 3. Doom Wall
    // Progressive speed increase based on depth (maxDist)
    // Base speed 0.6, increases by 0.002 per unit of distance
    const speedIncrease = Math.max(0, gameState.maxDist) * 0.002;
    gameState.doomSpeed = 0.6 + speedIncrease;
    
    gameState.doomY -= gameState.doomSpeed;
    
    // 4. Camera
    if (gameState.player) {
        // Camera follows player smoothly, but biased upwards
        const targetCamY = gameState.player.y - CANVAS_HEIGHT * 0.7;
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
        
        // Camera X centers on track (track is ~11 tiles wide = 440px)
        const trackCenter = (11 * TILE_SIZE) / 2;
        const targetCamX = trackCenter - CANVAS_WIDTH / 2;
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.05);
    }
}

function renderGame(p) {
    p.push();
    
    // Camera shake
    if (gameState.cameraShake > 0) {
        p.translate(p.random(-gameState.cameraShake, gameState.cameraShake), p.random(-gameState.cameraShake, gameState.cameraShake));
        gameState.cameraShake *= 0.9;
    }
    
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Render visible grid
    // Calculate visible range based on camera
    const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
    const endRow = startRow + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1;
    const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
    const endCol = startCol + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1;
    
    // Draw Floor & Walls
    for (let y = startRow - 2; y <= endRow; y++) {
        for (let x = startCol - 2; x <= endCol; x++) {
            const key = getGridKey(x, y);
            const tile = gameState.grid.get(key);
            
            if (tile) {
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                
                if (tile.type === 'floor') {
                    // Checkerboard tint
                    if ((x + y) % 2 === 0) p.fill(40, 40, 50);
                    else p.fill(45, 45, 55);
                    p.noStroke();
                    p.rect(px, py, TILE_SIZE, TILE_SIZE);
                } else if (tile.type === 'wall') {
                    // 3D effect wall
                    p.fill(80, 80, 90);
                    p.rect(px, py, TILE_SIZE, TILE_SIZE);
                    // Top highlight
                    p.fill(120, 120, 130);
                    p.rect(px, py, TILE_SIZE, 5);
                    // Shadow
                    p.fill(50, 50, 60);
                    p.rect(px, py + TILE_SIZE - 10, TILE_SIZE, 10);
                } else if (tile.type === 'hole') {
                    p.fill(10, 10, 15);
                    p.rect(px, py, TILE_SIZE, TILE_SIZE);
                }
            } else {
                // Void
                p.fill(5, 5, 10);
                p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw Doom Wall (below everything logic-wise, but rendered on top of floor)
    // Actually doom wall obscures previous tiles
    p.fill(255, 0, 0, 100);
    p.noStroke();
    p.rect(gameState.cameraX, gameState.doomY, CANVAS_WIDTH * 2, CANVAS_HEIGHT * 2);
    // Doom edge
    p.fill(200, 0, 0);
    for (let i = 0; i < CANVAS_WIDTH * 2; i += 20) {
        const h = p.noise(i * 0.05, p.frameCount * 0.1) * 40;
        p.rect(gameState.cameraX + i - CANVAS_WIDTH/2, gameState.doomY - h, 20, h + 20);
    }
    
    // Render Entities
    gameState.entities.forEach(e => {
        // Simple culling
        if (e.y > gameState.cameraY - 50 && e.y < gameState.cameraY + CANVAS_HEIGHT + 50) {
            e.render(p);
        }
    });
    
    // Render Particles
    updateParticles(p);
    
    p.pop();
}

window.gameInstance = gameInstance;