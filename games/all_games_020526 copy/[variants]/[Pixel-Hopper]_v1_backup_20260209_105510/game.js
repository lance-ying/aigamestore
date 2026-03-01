import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, initLogs 
} from './globals.js';
import { handleInput, registerKeyPress, registerKeyRelease } from './input.js';
import { Player } from './entities.js';
import { LaneManager } from './lanes.js';
import { checkCollisions } from './physics.js';
import { renderUI, renderStartScreen, renderGameOver } from './ui.js'; // Removed renderPaused from import


const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Init Game State
        gameState.gamePhase = "START";
        gameState.score = 0;
        gameState.cameraY = 0;
        gameState.particles = [];
        
        // Initialize Managers
        gameState.laneManager = new LaneManager();
        gameState.lanes = gameState.laneManager.lanes;
        
        // Initialize Player for START screen (needed for proper state)
        gameState.player = new Player(7, 0);
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update Time
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Input Handling
        handleInput(p);
        
        // Rendering
        p.background(30, 30, 40); // Deep background color
        
        // UI Layers - Check phase first
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            renderGameWorld(p);
            updateGame(p);
            renderUI(p);
        } else if (gameState.gamePhase === "PAUSED") {
            // When paused, only render the current game world and UI, but do not update game logic
            // and do not render the "PAUSED" overlay or text.
            renderGameWorld(p);
            renderUI(p); // Show score behind
        } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
            renderGameWorld(p);
            renderUI(p);
            renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
        }
    };

    function renderGameWorld(p) {
        // Camera Logic
        if (gameState.player) {
            // Camera follows player Y smoothly, but mostly moves UP (negative Y)
            // Center player vertically around 3/4 of screen
            const targetCamY = gameState.player.visualY - CANVAS_HEIGHT * 0.7;
            
            // Only scroll forward (up), never back down?
            // Usually Crossy Road cam drifts up.
            // Let's just lerp to player.
            gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);
        }
        
        // Apply Camera
        p.push();
        p.translate(0, -gameState.cameraY);
        
        // Render World
        if (gameState.laneManager) {
            gameState.laneManager.render(p);
        }
        
        // Render Particles (Behind player?)
        // Particles should be z-sorted. Simple: Render all particles.
        gameState.particles.forEach(sys => sys.render(p));
        
        // Render Player
        if (gameState.player) {
            gameState.player.render(p);
        }
        
        p.pop();
    }

    function updateGame(p) {
        // Update Managers
        gameState.laneManager.update(p);
        
        // Update Entities
        if (gameState.player) gameState.player.update(p);
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Physics
        checkCollisions(p);
    }

    p.keyPressed = function() {
        registerKeyPress(p, p.keyCode);
    };

    p.keyReleased = function() {
        registerKeyRelease(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to ensure clean state
    if (gameState.gamePhase !== "START") {
        gameState.gamePhase = "START";
    }
};