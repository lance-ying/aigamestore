import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleInput, handleKeyPress, handleKeyRelease } from './input.js';
import { checkCollisions } from './physics.js';
import { 
    renderBackground, 
    renderGame, 
    renderUI, 
    renderStartScreen, 
    renderPausedOverlay, 
    renderGameOver,
    renderLevelComplete
} from './rendering.js';

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
        
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
        
        // Expose control mode setter for UI buttons
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // If setting test mode from start screen, auto start
            if (mode.startsWith("TEST") && gameState.gamePhase === "START") {
                 // Trigger enter key simulation
                 p.keyCode = 13;
                 p.keyPressed();
            }
        };
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Render Background (Always visible behind things)
        renderBackground(p);

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
                renderPausedOverlay(p);
                break;
                
            case "LEVEL_COMPLETE":
                renderGame(p); // Show game frozen in bg
                renderLevelComplete(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    function updateGameLogic(p) {
        handleInput(p);
        
        if (gameState.player) {
            gameState.player.update();
            
            // Log player info periodically
            if (p.frameCount % 10 === 0) {
                p.logs.player_info.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: gameState.player.vx,
                    vy: gameState.player.vy,
                    state: gameState.player.isInflated ? 'inflated' : (gameState.player.isDeflated ? 'deflated' : 'normal'),
                    frame: p.frameCount
                });
            }
        }
        
        // Update particles
        for(let i=gameState.particles.length-1; i>=0; i--) {
            gameState.particles[i].update();
            if(gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        checkCollisions();
    }

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

window.gameInstance = gameInstance;