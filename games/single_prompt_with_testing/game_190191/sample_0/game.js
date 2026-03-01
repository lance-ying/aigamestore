// Main Game Entry Point

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHYSICS_SUBSTEPS } from './globals.js';
import { updatePhysicsWorld } from './physics_core.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOverWin } from './ui.js';
import { loadLevel, nextLevel } from './levels.js';
import { handleKeyPressed } from './input.js';
import { get_automated_testing_action } from './input.js';

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
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        gameState.deltaTime = 1 / p.frameRate(); // Approx

        // Background
        p.background(gameState.gamePhase === "GAME_OVER_WIN" ? [20, 50, 20] : [20, 24, 30]);

        // Automated Testing Inputs
        const autoAction = get_automated_testing_action();
        if (autoAction) {
            handleKeyPressed(p, autoAction.keyCode, autoAction.key);
        }

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLANNING":
            case "SIMULATING":
            case "PAUSED":
                updateGameLogic(p);
                renderGame(p);
                renderHUD(p);
                
                if (gameState.gamePhase === "PAUSED") {
                    renderPauseScreen(p);
                }
                break;
            case "GAME_OVER_WIN":
                renderGameOverWin(p);
                break;
        }
    };

    function updateGameLogic(p) {
        if (gameState.gamePhase !== "SIMULATING") return;

        const dt = 1 / 60; // Fixed time step for physics consistency
        
        // Substep physics for stability
        for(let i=0; i<PHYSICS_SUBSTEPS; i++) {
             updatePhysicsWorld([...gameState.physicsBodies, ...gameState.staticBodies], dt / PHYSICS_SUBSTEPS);
        }
        
        // Check collisions with targets
        // We iterate backwards safely
        for (let i = gameState.targets.length - 1; i >= 0; i--) {
            const target = gameState.targets[i];
            if (target.collected) continue;
            
            let hit = false;
            for (const body of gameState.physicsBodies) {
                if (target.checkCollision(body)) {
                    hit = true;
                    break;
                }
            }
            
            if (hit) {
                target.collected = true;
                gameState.starsCollected++;
            }
        }
        
        // Check Win Condition
        if (gameState.starsCollected >= gameState.totalStarsInLevel && gameState.totalStarsInLevel > 0) {
            // Delay slightly or just win immediately
            nextLevel();
        }
        
        // Check Fail Condition (All bodies fell off)
        let activeBodies = 0;
        for (const body of gameState.physicsBodies) {
            if (body.pos.y < CANVAS_HEIGHT + 100) {
                activeBodies++;
            }
        }
        
        if (gameState.physicsBodies.length > 0 && activeBodies === 0 && gameState.starsCollected < gameState.totalStarsInLevel) {
            // Auto restart if everything fell out? 
            // Optional: for now let player press R
        }
    }

    function renderGame(p) {
        // Draw Static Bodies (Obstacles)
        gameState.staticBodies.forEach(b => b.render(p));
        
        // Draw Targets
        gameState.targets.forEach(t => t.render(p));
        
        // Draw Physics Bodies (Letters)
        gameState.physicsBodies.forEach(b => b.render(p));
    }

    p.keyPressed = function() {
        // Log input
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        handleKeyPressed(p, p.keyCode, p.key);
    };
});

window.gameInstance = gameInstance;