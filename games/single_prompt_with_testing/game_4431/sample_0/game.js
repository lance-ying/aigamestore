/**
 * game.js
 * Main entry point. Sets up p5 instance and game loop.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_TURNS, getGameState } from './globals.js';
import { GridSystem } from './grid.js';
import { Mech, Vek } from './entities.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { moveEnemies, updateEnemyIntents, spawnEnemies, executeAttack } from './logic.js';
import { ParticleSystem } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gridSystem;
let turnTimer = 0;

window.gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Init Systems
        gridSystem = new GridSystem(p);
        gridSystem.generateMap(p);
        
        // Spawn Player Units
        spawnPlayerUnits(p);
        // Spawn Initial Enemies
        spawnEnemies(p);
        // Init Intents
        updateEnemyIntents();
        
        // Init Logs
        gameState.logs.game_info.push({ event: "INIT", timestamp: Date.now() });
    };

    function spawnPlayerUnits(p) {
        const types = ['PRIME', 'TANK', 'ARTILLERY'];
        for(let i=0; i<3; i++) {
            const x = 1 + i*2;
            const y = 2;
            const mech = new Mech(x, y, types[i]);
            gameState.entities.push(mech);
            gameState.grid[x][y].entity = mech;
        }
    }

    p.draw = function() {
        // Update Time
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Background
        p.background(20, 20, 28);

        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                gridSystem.render(p);
                renderEntities(p);
                renderUI(p);
                break;
            case "PAUSED":
                gridSystem.render(p);
                renderEntities(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
                gridSystem.render(p);
                renderEntities(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                gridSystem.render(p);
                renderEntities(p);
                renderGameOver(p, false);
                break;
        }

        // Handle Automated Inputs
        handleAutomatedTesting(p);
    };

    function updateGame(p) {
        // Update Entities (Animation interpolation)
        gameState.entities.forEach(e => e.updatePixelPosition());
        
        // Update Particles
        gameState.particles.forEach((part, i) => {
            part.update();
            part.render(p);
            if (part.life <= 0) gameState.particles.splice(i, 1);
        });

        // Remove Dead
        for(let i = gameState.entities.length-1; i>=0; i--) {
            if(gameState.entities[i].isDead) {
                const e = gameState.entities[i];
                gameState.grid[e.gridX][e.gridY].entity = null;
                gameState.entities.splice(i, 1);
            }
        }
        for(let i = gameState.buildings.length-1; i>=0; i--) {
            if(gameState.buildings[i].isDead) {
                // Buildings don't disappear, just look broken?
                // For now, let's keep them but broken state
            }
        }

        // Win/Loss Check
        if (gameState.gridPower <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        if (gameState.currentTurn > MAX_TURNS) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }

        // Turn Logic
        handleTurnPhases(p);
    }

    function handleTurnPhases(p) {
        if (gameState.turnPhase === "PLAYER_START") {
            // Reset Mechs
            gameState.entities.forEach(e => {
                if (e.type === 'MECH') e.hasActed = false;
            });
            gameState.turnPhase = "PLAYER_ACTION";
        }
        
        // PLAYER_ACTION is handled by Input

        if (gameState.turnPhase === "ENEMY_ATTACK") {
            // Wait a bit
            turnTimer++;
            if (turnTimer > 30) {
                // Execute one attack per frame or all at once?
                // Let's do all at once for simplicity but sequentially in logic
                gameState.entities.forEach(e => {
                    if (e.type === 'VEK' && !e.isDead && e.intent) {
                        // Re-evaluate target based on current pos + intent direction
                        const tx = e.gridX + e.intent.dx;
                        const ty = e.gridY + e.intent.dy;
                        executeAttack(e, tx, ty);
                    }
                });
                gameState.turnPhase = "SPAWN_ENEMIES";
                turnTimer = 0;
            }
        }

        if (gameState.turnPhase === "SPAWN_ENEMIES") {
            turnTimer++;
            if (turnTimer > 30) {
                spawnEnemies(p);
                gameState.turnPhase = "ENEMY_MOVE";
                turnTimer = 0;
            }
        }

        if (gameState.turnPhase === "ENEMY_MOVE") {
            turnTimer++;
            if (turnTimer > 30) {
                moveEnemies(p);
                updateEnemyIntents(); // Plan next attacks
                gameState.currentTurn++;
                gameState.turnPhase = "PLAYER_START";
                turnTimer = 0;
            }
        }
    }

    function renderEntities(p) {
        // Z-sort by Y position for depth
        const all = [...gameState.buildings, ...gameState.entities];
        all.sort((a, b) => a.pixelY - b.pixelY);
        all.forEach(e => e.render(p));
    }

    p.keyPressed = function() {
        handleInput(p, p.key, p.keyCode);
    };
    
    function handleAutomatedTesting(p) {
        if (gameState.controlMode.startsWith("TEST")) {
            const action = get_automated_testing_action(gameState);
            if (action) {
                handleInput(p, null, action.keyCode);
            }
        }
    }
});

// Helper for automated controller
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};