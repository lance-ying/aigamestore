import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, initLogs } from './globals.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './ui.js';
import { handleGridUpdate } from './match3.js';
import { updateParticles } from './particles.js';

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
        
        initLogs(p);
        
        gameState.gamePhase = "START";
        gameState.controlMode = "HUMAN";
        
        // Log init
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
        
        // Setup window hook for mode control
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // Reset if changing modes mid-game to ensure consistent state
            if (mode === 'TEST_2' || mode === 'TEST_1') {
                gameState.gamePhase = "START";
            }
        };
    };

    p.draw = function() {
        // Time management
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Input handling (Automated)
        handleInput(p);
        
        // Render switch
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
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
        
        // Logging
        if (p.frameCount % 60 === 0 && gameState.player) {
            p.logs.player_info.push({
                hp: gameState.player.hp,
                mana: gameState.player.mana,
                score: gameState.stage,
                framecount: p.frameCount
            });
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
});

function updateGame(p) {
    handleGridUpdate();
    updateParticles();
}

// Expose instance
window.gameInstance = gameInstance;