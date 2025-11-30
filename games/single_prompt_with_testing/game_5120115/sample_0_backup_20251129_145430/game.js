import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, LEVEL_CONFIG, getGameState } from './globals.js';
import { handleInput, handleKeyPress } from './input.js';
import { updatePhysics, checkBreakage } from './physics.js';
import { renderGame, renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { resetLevel } from './input.js'; // Helper import

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
        
        gameState.gamePhase = "START";
        
        // Initial Log
        p.logs.game_info.push({
            event: "initialized",
            timestamp: Date.now()
        });
        
        // Automated Testing Hook
        window.get_automated_testing_action = get_automated_testing_action;
    };

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                if (gameState.gamePhase !== "PAUSED") {
                    updateGameLogic(p);
                }
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        // Handle Automated Testing Inputs
        if (gameState.controlMode.startsWith("TEST")) {
            const action = window.get_automated_testing_action(gameState);
            if (action) {
                // Mock key press
                p.keyCode = action.keyCode;
                p.key = action.key || '';
                handleKeyPress(p);
            }
        }
    };

    p.keyPressed = function() {
        if (gameState.controlMode === "HUMAN") {
            handleKeyPress(p);
        }
    };
});

function updateGameLogic(p) {
    if (gameState.subPhase === "SIMULATE") {
        updatePhysics(p);
        
        // Update Cars
        gameState.cars.forEach(car => car.update());
        
        // Check Win/Lose
        // 1. Breakage
        if (checkBreakage()) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        
        // 2. Car Success
        let allCarsFinished = true;
        let anyCarDied = false;
        
        gameState.cars.forEach(car => {
            if (car.x > LEVEL_CONFIG.winX) {
                // Success
            } else {
                allCarsFinished = false;
            }
            
            if (car.y > CANVAS_HEIGHT) {
                anyCarDied = true;
            }
        });
        
        if (anyCarDied) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        } else if (allCarsFinished) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
}

// Automated Testing Logic
let testStep = 0;
let testTimer = 0;

function get_automated_testing_action(gs) {
    if (gs.gamePhase === "START") return { keyCode: 13 }; // Enter
    if (gs.gamePhase !== "PLAYING") return null;
    
    testTimer++;
    if (testTimer < 10) return null; // Delay
    testTimer = 0;
    
    if (gs.controlMode === "TEST_1") {
        // Build a bridge
        // Strategy: 
        // 1. Start at 100, 300 (Left Anchor)
        // 2. Build Road to 500, 300 (Right Anchor) in steps
        // 3. Start Sim
        
        const actions = [
            // Ensure ROAD material (Default is ROAD)
            
            // Move to anchor 1 (100, 300) is start pos
            { keyCode: 32 }, // Select Anchor 1
            
            // Move Right 4 times (80px), Place
            { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, 
            { keyCode: 32 },
            
            // Move Right 4 times, Place
            { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, 
            { keyCode: 32 },
            
            // Move Right 4 times, Place
            { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, 
            { keyCode: 32 },
            
             // Move Right 4 times, Place
            { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, 
            { keyCode: 32 },
            
            // Move Right 4 times (Reach 500, 300), Connect
            { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, { keyCode: 39 }, 
            { keyCode: 32 },
            
            // Deselect
            { keyCode: 32 }, 
            
            // Start Sim
            { keyCode: 13 }
        ];
        
        if (testStep < actions.length) {
            return actions[testStep++];
        }
    }
    
    if (gs.controlMode === "TEST_2") {
        // Random Chaos
        const keys = [37, 38, 39, 40, 32, 16, 90];
        return { keyCode: keys[Math.floor(Math.random() * keys.length)] };
    }
    
    return null;
}