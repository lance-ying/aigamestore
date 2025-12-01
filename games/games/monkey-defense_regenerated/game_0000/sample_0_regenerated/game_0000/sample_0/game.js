import { gameState, getGameState, resetGameState } from './globals.js';
import { renderBackground, renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { handleInput, handleKeyPress } from './input.js';
import { handleCollisions } from './physics.js';
import { updateWaves } from './wave_manager.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(600, 400);
        p.frameRate(60);
        p.randomSeed(42);
        
        resetGameState();
        
        // Log initial
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Automated Input Handling
        if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === 'PLAYING') {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate key press
                p.keyCode = action.keyCode;
                p.keyPressed();
                p.keyReleased(); // Immediate release for trigger actions
            }
        }

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
        
        // Periodic logging
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                lives: gameState.lives,
                money: gameState.money,
                score: gameState.score,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    };

    function updateGameLogic(p) {
        // Inputs
        handleInput(p);
        
        // Waves
        updateWaves();
        
        // Towers
        gameState.towers.forEach(t => t.update(p));
        
        // Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            gameState.projectiles[i].update();
            if (gameState.projectiles[i].dead) {
                gameState.projectiles.splice(i, 1);
            }
        }
        
        // Bloons
        for (let i = gameState.bloons.length - 1; i >= 0; i--) {
            const b = gameState.bloons[i];
            b.update(p);
            
            // Check end of path
            if (b.pathIndex >= 7) { // 7 is last index
                gameState.lives -= b.health; // Lose lives
                b.dead = true;
            }
            
            if (b.dead) {
                gameState.bloons.splice(i, 1);
            }
        }
        
        // Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Collisions
        handleCollisions();
        
        // Game Over Check
        if (gameState.lives <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
             p.logs.game_info.push({
                data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score },
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    function renderGame(p) {
        renderBackground(p);
        
        // Towers
        gameState.towers.forEach(t => t.render(p, false));
        
        // Bloons
        gameState.bloons.forEach(b => b.render(p));
        
        // Projectiles
        gameState.projectiles.forEach(proj => proj.render(p));
        
        // Particles
        gameState.particles.forEach(part => part.render(p));
    }

    p.keyPressed = function() {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        handleKeyPress(p);
    };
});

// Window exposure for controls
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Auto-start if testing
    if (mode !== "HUMAN" && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
};