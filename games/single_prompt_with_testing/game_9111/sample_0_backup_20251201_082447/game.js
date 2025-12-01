import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GAME_OPTS } from './globals.js';
import { Player } from './entities.js';
import { handleInput, handleKeyPress, handleKeyRelease } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { updatePhysics } from './physics.js';
import { LevelGenerator } from './level_generator.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let levelGen;

export function initGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.distance = 0;
    gameState.obstacles = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.frameCount = 0;
    gameState.feverMode = false;
    gameState.landings = 0;
    gameState.lastFrameEggs = 0;
    
    gameState.player = new Player(GAME_OPTS.spawnX, CANVAS_HEIGHT - GAME_OPTS.groundHeight - GAME_OPTS.playerSize);
    
    levelGen = new LevelGenerator();
    levelGen.reset();
    
    p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

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
        
        // Pre-init level gen
        levelGen = new LevelGenerator();
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;

        // Automated Input
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate key press
                if (!gameState.keys[action.keyCode]) {
                    p.keyCode = action.keyCode;
                    handleKeyPress(p);
                }
            } else {
                // Release all simulated keys if no action
                 // Simplified: just release space (32) if it was pressed by bot
                 if (gameState.keys[32]) {
                     p.keyCode = 32;
                     handleKeyRelease(p);
                 }
            }
        }

        // Background
        drawBackground(p);

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
                renderPausedOverlay(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

function updateGame(p) {
    if (gameState.player) {
        gameState.player.update();
    }
    
    // Level Generation
    let speed = gameState.feverMode ? GAME_OPTS.feverSpeed : GAME_OPTS.scrollSpeed;
    levelGen.update(speed);
    
    // Physics
    updatePhysics(p);
    
    // Logging
    if (gameState.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            eggs: gameState.player.eggs,
            distance: gameState.distance,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

function renderGame(p) {
    // Draw Ground
    p.noStroke();
    p.fill(COLORS.ground);
    p.rect(0, CANVAS_HEIGHT - GAME_OPTS.groundHeight, CANVAS_WIDTH, GAME_OPTS.groundHeight);
    
    // Ground detail (scrolling stripes)
    p.fill(COLORS.groundDetail);
    let offset = (gameState.distance) % 50;
    for (let x = -offset; x < CANVAS_WIDTH; x += 50) {
        p.rect(x, CANVAS_HEIGHT - GAME_OPTS.groundHeight, 20, GAME_OPTS.groundHeight);
    }
    
    // Entities
    gameState.obstacles.forEach(o => o.render(p));
    gameState.projectiles.forEach(proj => proj.render(p));
    if (gameState.player) gameState.player.render(p);
    gameState.particles.forEach(part => part.render(p));
}

function drawBackground(p) {
    if (gameState.feverMode) {
        // Flashy disco background
        if (p.frameCount % 10 < 5) p.background(COLORS.feverBg[0], COLORS.feverBg[1], COLORS.feverBg[2]);
        else p.background(255, 200, 200);
    } else {
        p.background(COLORS.bg);
        // Simple clouds
        p.fill(255, 255, 255, 200);
        p.noStroke();
        p.ellipse(100, 100, 60, 40);
        p.ellipse(130, 110, 60, 40);
        p.ellipse(400, 80, 80, 50);
        p.ellipse(440, 90, 70, 40);
    }
}

window.gameInstance = gameInstance;