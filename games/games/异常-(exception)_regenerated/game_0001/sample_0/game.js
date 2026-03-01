// game.js - Main entry point
import { 
    gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { handleInput, handleKeyRelease } from './input.js';
import { renderUI } from './ui.js';
import { Robot, Enemy } from './entities.js';
import { executeStep } from './physics.js';
import { loadLevel } from './levels.js';

const p5 = window.p5;

// Global Game Instance
let gameInstance = new p5(p => {
    
    // Write-only logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };
    
    // Internal state for events
    let levelLoaded = false;

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Setup Event Listeners for Game Logic
        window.addEventListener("LEVEL_COMPLETE", () => {
            initLevel(gameState.currentLevelIdx);
        });
        
        window.addEventListener("LEVEL_RESET", () => {
            resetCurrentLevel();
        });
        
        window.addEventListener("GAME_RESTART", () => {
            gameState.currentLevelIdx = 0;
            gameState.score = 0;
            gameState.gamePhase = "START";
            initLevel(0);
        });
        
        // Initial Level Load
        initLevel(0);
        
        // Log start
        p.logs.game_info.push({
            event: "GAME_START",
            timestamp: Date.now()
        });
    };

    function initLevel(idx) {
        const levelData = loadLevel(p, idx);
        if (levelData) {
            // Create Player
            gameState.player = new Robot(levelData.startPos.x, levelData.startPos.y);
            
            // Create Enemies
            gameState.enemies = [];
            levelData.enemies.forEach(e => {
                gameState.enemies.push(new Enemy(e.x, e.y, e.type));
            });
            
            gameState.particles = [];
            levelLoaded = true;
            
            p.logs.game_info.push({
                event: "LEVEL_LOADED",
                level: idx,
                timestamp: Date.now()
            });
        } else {
            // End of game
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    function resetCurrentLevel() {
        initLevel(gameState.currentLevelIdx);
    }

    p.draw = function() {
        // Delta Time calculation
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Background with screen shake
        p.background(20, 20, 25);
        if (gameState.shake > 0) {
            p.translate(p.random(-gameState.shake, gameState.shake), p.random(-gameState.shake, gameState.shake));
            gameState.shake *= 0.9;
            if (gameState.shake < 0.5) gameState.shake = 0;
        }

        // Logic Update
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            // Handle Automated Testing
            handleAutomatedTesting(p);
        }

        // Rendering
        renderGame(p);
    };

    function updateGame(p) {
        if (!gameState.player) return;
        
        // Update entities
        gameState.player.update(p);
        
        gameState.enemies.forEach(e => e.update(p));
        // Remove dead enemies
        gameState.enemies = gameState.enemies.filter(e => !e.isDead);
        
        gameState.particles.forEach(pt => pt.update());
        // Remove dead particles
        gameState.particles = gameState.particles.filter(pt => pt.life > 0);
        
        // Execution Logic
        if (gameState.subPhase === "EXECUTING") {
            // If robot is currently moving (animating), wait
            if (gameState.player.isMoving) {
                // waiting for animation to finish
            } else {
                gameState.executionTimer++;
                if (gameState.executionTimer >= gameState.stepDuration) {
                    gameState.executionTimer = 0;
                    executeStep(p);
                }
            }
        }
    }
    
    function renderGame(p) {
        // The renderUI function handles both the game view and the UI panel
        // This ensures correct layering
        renderUI(p);
        
        // Render Entities on top of grid (inside renderUI's coordinate system implicitly? 
        // No, renderUI handles grid lines. We need to render entities in the correct coordinate space.)
        // Refactoring: renderUI should call renderEntities to ensure order.
        
        // Actually, let's render entities here after UI background but before overlay
        if (gameState.gamePhase !== "START") {
            // Entities need to be offset by MAP_OFFSET
            // The entities class render methods handle the offset themselves
            
            // Draw particles behind
            gameState.particles.forEach(pt => pt.render(p));
            
            // Draw Enemies
            gameState.enemies.forEach(e => e.render(p));
            
            // Draw Player
            if (gameState.player) gameState.player.render(p);
        }
    }

    p.keyPressed = function() {
        handleInput(p);
    };
    
    p.keyReleased = function() {
        handleKeyRelease(p);
    };
    
    // Automated Testing Implementation
    function handleAutomatedTesting(p) {
        if (gameState.controlMode === "TEST_1" && gameState.currentLevelIdx === 0 && gameState.subPhase === "PROGRAMMING") {
            // Strategy: Inject optimal path for Level 1
            // Level 1 requires moving 5 times to the right.
            // Start pos: (1,1). End pos: (7,1). Distance: 6 tiles?
            // Layout: [1, 2, 0, 0, 0, 0, 0, 3, 1] -> Indices: 1, 2, 3, 4, 5, 6, 7(exit).
            // Moves needed: 1->2, 2->3, 3->4, 4->5, 5->6, 6->7. Total 6 moves.
            
            if (gameState.programQueue.length === 0) {
                // Automate input
                console.log("TEST_1: Injecting solution...");
                for(let i=0; i<6; i++) {
                    gameState.programQueue.push("MOVE");
                }
                // Trigger Run
                gameState.subPhase = "EXECUTING";
                gameState.executionStep = 0;
            }
        }
        
        if (gameState.controlMode === "TEST_2" && gameState.subPhase === "PROGRAMMING") {
             // Collision test strategy
             if (gameState.programQueue.length === 0) {
                 gameState.programQueue.push("TURN_L"); // Face Wall (Up)
                 gameState.programQueue.push("MOVE");   // Hit Wall
                 gameState.programQueue.push("TURN_R"); // Turn Back
                 gameState.programQueue.push("TURN_R"); 
                 gameState.programQueue.push("MOVE");   // Move
                 gameState.subPhase = "EXECUTING";
             }
        }
        
        // TEST_3 Logic (Combat) for Level 3
        if (gameState.controlMode === "TEST_1" && gameState.currentLevelIdx === 2 && gameState.subPhase === "PROGRAMMING") {
             // Level 3 Enemy at (4,1). Start (1,1).
             // Moves: Move(2,1), Move(3,1), Attack(kills 4,1), Move(4,1)...
             if (gameState.programQueue.length === 0) {
                 gameState.programQueue.push("MOVE");
                 gameState.programQueue.push("MOVE");
                 gameState.programQueue.push("ATTACK");
                 gameState.programQueue.push("MOVE");
                 gameState.programQueue.push("MOVE");
                 gameState.programQueue.push("MOVE");
                 gameState.subPhase = "EXECUTING";
             }
        }
    }
});

// Helper for automated tests to set mode
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state
    window.dispatchEvent(new CustomEvent("GAME_RESTART"));
};