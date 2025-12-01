import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RECEPTOR_Y, LANE_WIDTH, NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT, resetGameState } from './globals.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { updateRhythm } from './rhythm_engine.js';
import { Character, Particle } from './entities.js';
import { drawReceptor } from './drawing.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Setup Logging
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
        
        // Initialize Characters
        initEntities();
        
        logInitialState(p);
        
        // Input handling
        handleInput(p);
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - (gameState.lastFrameTime || currentTime)) / 1000;
        gameState.lastFrameTime = currentTime;

        // Auto-control handling for tests
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                p.keyCode = action.keyCode;
                p.keyPressed();
                // Simulate release shortly after (simple hack for test)
                setTimeout(() => {
                    p.keyCode = action.keyCode;
                    p.keyReleased();
                }, 50); 
            }
        }

        p.background(30, 30, 40); // Dark BG
        
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
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };
});

function initEntities() {
    // Spawn chars
    // Center GF
    gameState.girlfriend = new Character(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20, false, 'gf');
    // Enemy Left
    gameState.enemy = new Character(150, CANVAS_HEIGHT / 2 + 50, false, 'dad');
    // Player Right
    gameState.player = new Character(450, CANVAS_HEIGHT / 2 + 60, true, 'bf');
}

function updateGame(p) {
    updateRhythm(p);
    
    // Update notes positions
    const speed = 7; // Scroll speed
    gameState.notes.forEach(note => note.update(gameState.songTime, speed));
    
    // Cleanup notes (remove off screen or hit)
    // Actually we keep hit notes invisible for a bit or splice? Splicing might mess up loops if not careful.
    // Let's filter periodically or just draw check.
    // Remove really old notes to save memory
    if (gameState.frameCount % 60 === 0) {
        gameState.notes = gameState.notes.filter(n => n.y > -200 && (!n.missed || n.y > -500));
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].lifetime <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Update Characters
    if (gameState.player) gameState.player.update();
    if (gameState.enemy) gameState.enemy.update();
    if (gameState.girlfriend) gameState.girlfriend.update();
}

function renderGame(p) {
    // 1. Background / Stage
    // Simple floor
    p.fill(20, 20, 30);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100); // Floor shadow
    
    // 2. Characters (Back to Front)
    if (gameState.girlfriend) gameState.girlfriend.render(p);
    if (gameState.enemy) gameState.enemy.render(p);
    if (gameState.player) gameState.player.render(p);
    
    // 3. UI Layer (Lanes)
    renderLanes(p);
    
    // 4. Notes
    gameState.notes.forEach(note => note.render(p));
    
    // 5. Particles
    gameState.particles.forEach(pt => pt.render(p));
}

function renderLanes(p) {
    // Draw Receptors
    
    // Enemy Receptors (Left side)
    const enemyLaneX = 50;
    for (let i = 0; i < 4; i++) {
        const x = enemyLaneX + (i * LANE_WIDTH) + (LANE_WIDTH / 2);
        drawReceptor(p, i, x, RECEPTOR_Y, 40, gameState.enemyLanePressed[i]);
    }
    
    // Player Receptors (Right side)
    const playerLaneX = CANVAS_WIDTH - (LANE_WIDTH * 4) - 50;
    for (let i = 0; i < 4; i++) {
        const x = playerLaneX + (i * LANE_WIDTH) + (LANE_WIDTH / 2);
        drawReceptor(p, i, x, RECEPTOR_Y, 40, gameState.lanePressed[i]);
    }
}

function logInitialState(p) {
    p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

// Global functions for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game if button pressed to ensure clean state
    if (gameState.gamePhase !== "START") {
        gameState.gamePhase = "START";
        resetGameState();
    }
};

window.gameInstance = gameInstance;