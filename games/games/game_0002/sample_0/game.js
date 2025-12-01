import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, logs, resetGameState } from './globals.js';
import { Player } from './entities.js';
import { loadLevel } from './level.js';
import { handleKeyDown, handleKeyUp, clearKeys } from './input.js';
import { renderStartScreen, renderHUD, renderPauseScreen, renderGameOverWin, renderGameOverLose } from './ui.js';
import { updateAndRenderParticles } from './particles.js';

const p5 = window.p5;

let gameInstance = new p5((p) => {
    
    p.logs = logs; // Expose logs to p instance

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize State
        resetGame();
        gameState.gamePhase = GAME_PHASES.START;
        
        // Log Initial
        p.logs.game_info.push({
            event: "Setup Complete",
            timestamp: Date.now()
        });
    };

    function resetGame() {
        resetGameState();
        clearKeys();
        
        // Create Player
        gameState.player = new Player(100, 300);
        gameState.entities.push(gameState.player);
        
        // Load Level
        loadLevel();
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Reset Logic if pending from globals helper
        if (gameState.gamePhase === GAME_PHASES.START && gameState.player === null) {
            resetGame();
        }

        // --- RENDER & UPDATE ---
        
        // Background
        drawBackground(p);

        // State Machine
        switch(gameState.gamePhase) {
            case GAME_PHASES.START:
                renderStartScreen(p);
                break;
                
            case GAME_PHASES.PLAYING:
                updateGame(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case GAME_PHASES.PAUSED:
                renderGame(p); // Draw game frozen behind overlay
                renderPauseScreen(p);
                break;
                
            case GAME_PHASES.GAME_OVER_WIN:
                renderGame(p);
                renderGameOverWin(p);
                break;
                
            case GAME_PHASES.GAME_OVER_LOSE:
                renderGame(p);
                renderGameOverLose(p);
                break;
        }
    };

    function updateGame(p) {
        // Update Player
        if (gameState.player) gameState.player.update(p);
        
        // Update Camera
        updateCamera();
        
        // Log Player Info
        if (gameState.player && p.frameCount % 5 === 0) { // Log every 5 frames to save memory
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

    function updateCamera() {
        if (!gameState.player) return;
        
        // Target is player x centered, clamped to world bounds
        const targetX = gameState.player.x - CANVAS_WIDTH / 2;
        
        // Smooth lerp
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
        
        // Clamp
        gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth - CANVAS_WIDTH));
        
        // Y camera usually fixed unless level is tall. Level is slightly tall.
        // Let's do simple Y following if player drops low or goes high
        const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        // Keep camera mostly grounded at bottom unless player climbs high
        // Clamp Y so we don't see below ground
        gameState.cameraY += (targetY - gameState.cameraY) * 0.05;
        gameState.cameraY = Math.max(-400, Math.min(gameState.cameraY, 50)); // Allow looking up, limit looking down
    }

    function renderGame(p) {
        p.push();
        p.translate(-gameState.cameraX, -gameState.cameraY);
        
        // Render Platforms
        gameState.platforms.forEach(plat => plat.render(p));
        
        // Render Hazards
        gameState.hazards.forEach(haz => haz.render(p));
        
        // Render Collectibles
        gameState.collectibles.forEach(c => c.render(p));
        
        // Render Goal
        if (gameState.goal) gameState.goal.render(p);
        
        // Render Particles
        updateAndRenderParticles(p);
        
        // Render Player
        if (gameState.player) gameState.player.render(p);
        
        p.pop();
    }

    function drawBackground(p) {
        // Parallax or Gradient
        // Sky
        setGradient(p, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, p.color(20, 30, 60), p.color(50, 80, 120));
        
        // Distant mountains (parallax)
        p.push();
        const paraX = gameState.cameraX * 0.2;
        p.fill(15, 20, 40);
        p.noStroke();
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        for(let i = 0; i <= CANVAS_WIDTH; i+=50) {
            const h = p.noise((i + paraX) * 0.01) * 150 + 50;
            p.vertex(i, CANVAS_HEIGHT - h);
        }
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.endShape(p.CLOSE);
        p.pop();
    }

    function setGradient(p, x, y, w, h, c1, c2) {
        p.noFill();
        for (let i = y; i <= y + h; i++) {
            let inter = p.map(i, y, y + h, 0, 1);
            let c = p.lerpColor(c1, c2, inter);
            p.stroke(c);
            p.line(x, i, x + w, i);
        }
    }

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

// Control Mode Setter for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Focus canvas
    document.querySelector('canvas').focus();
};

window.gameInstance = gameInstance;