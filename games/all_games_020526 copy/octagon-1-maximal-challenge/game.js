/**
 * Main game loop and p5 instance setup.
 */
import { 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    gameState, 
    FPS, 
    SEGMENT_DEPTH, 
    VIEW_DISTANCE, 
    INITIAL_SPEED,
    logGameEvent
} from './globals.js';
import { Player, TunnelSegment } from './entities.js';
import { checkCollisions } from './physics.js';
import { handleInput, keyPressed } from './input.js';
import { renderUI, renderStartScreen, renderGameOver } from './ui.js';
import { ParticleSystem } from './particles.js';


const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // p.logs removed as it was a testing artifact.
    // logGameEvent calls will now do nothing unless p.logs is re-introduced.
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(FPS);
        p.randomSeed(42);
        
        // Initialize systems
        gameState.particleSystem = new ParticleSystem();
        gameState.lives = 5;
        
        // Log start
        logGameEvent(p, 'info', { msg: "Game Initialized" });
    };
    
    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Camera Shake decay
        let shakeX = 0;
        let shakeY = 0;
        if (gameState.cameraShake > 0) {
            shakeX = p.random(-gameState.cameraShake, gameState.cameraShake);
            shakeY = p.random(-gameState.cameraShake, gameState.cameraShake);
            gameState.cameraShake *= 0.9;
            if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
        }
        
        // Background with Shake
        p.push();
        p.translate(shakeX, shakeY);
        p.background(10, 10, 15); // Dark BG
        
        switch (gameState.gamePhase) {
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
                renderUI(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        p.pop();
        
        // Removed Automated Testing Inputs block
    };
    
    p.keyPressed = function() {
        // Check for phase controls first
        keyPressed(p);
    };
    
    // Helper to init game
    window.setControlMode = function(mode) {
        gameState.controlMode = mode;
        console.log("Control Mode set to: " + mode);
        // Force restart (useful for 'Human Mode' button as well)
        p.keyCode = 82; // R
        keyPressed(p);
    };
});

function updateGame(p) {
    // 1. Inputs
    handleInput(p);
    
    // 2. Game Logic
    
    // Speed scaling - Reduced acceleration significantly (0.005 -> 0.001)
    gameState.currentSpeed = Math.min(
        gameState.currentSpeed + 0.001, 
        25
    );
    
    // Score (distance based)
    gameState.score += gameState.currentSpeed * 0.1;
    
    // Player Update
    if (!gameState.player) {
        gameState.player = new Player();
    }
    gameState.player.update();
    
    // Tunnel Management
    manageTunnel(p);
    
    // Particles
    if (gameState.particleSystem) gameState.particleSystem.update();
    
    // Spawn Speed Lines
    if (p.frameCount % 5 === 0) {
        gameState.particleSystem.spawn(0, 0, 1000, 1, 'speed_line');
    }
    
    // Physics
    checkCollisions(p);
}

function manageTunnel(p) {
    const segments = gameState.tunnelSegments;
    const speed = gameState.currentSpeed;
    
    // Move segments
    segments.forEach(seg => seg.update(speed));
    
    // Remove old
    if (segments.length > 0 && segments[0].z < -500) {
        segments.shift();
    }
    
    // Add new
    const lastZ = segments.length > 0 ? segments[segments.length - 1].z : 0;
    if (lastZ < VIEW_DISTANCE) {
        // Need more segments
        let nextZ = lastZ + SEGMENT_DEPTH;
        // If empty (start), fill up to view distance
        if (segments.length === 0) {
            for (let z = 0; z < VIEW_DISTANCE; z += SEGMENT_DEPTH) {
                segments.push(new TunnelSegment(z, segments.length));
            }
        } else {
            segments.push(new TunnelSegment(nextZ, segments[segments.length - 1].index + 1));
        }
    }
}

function renderGame(p) {
    // Render Tunnel (Back to Front)
    const segments = gameState.tunnelSegments;
    for (let i = segments.length - 2; i >= 0; i--) {
        const seg = segments[i];
        const nextSeg = segments[i + 1];
        seg.render(p, nextSeg);
    }
    
    // Render Particles
    gameState.particleSystem.render(p);
    
    // Render Player
    if (gameState.player) {
        gameState.player.render(p);
    }
}

window.gameInstance = gameInstance;