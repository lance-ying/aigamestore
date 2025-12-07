// game.js
// Main Game Loop and Initialization

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, 
    logGameInfo, resetGameState 
} from './globals.js';
import { handleKeyDown, handleKeyUp, clearInputs, KEYS } from './input.js';
import { generateLevel } from './level_gen.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen, renderTransition } from './ui.js';
import { Player } from './entities.js';
import { clamp, isInsideCamera } from './utils.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    // Make generateLevel accessible to entities (Exit door)
    p.generateLevel = function() {
        generateLevel(p);
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        logGameInfo(p, { event: "Game Initialized" });
    };

    p.draw = function() {
        // Update Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Handle Game Phases
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
                renderUI(p);
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
            case "TRANSITION":
                renderTransition(p);
                break;
        }
    };

    function updateGame(p) {
        if (!gameState.player) return;

        // Camera Follow
        // Lerp camera towards player center
        const targetCamX = gameState.player.x + gameState.player.width/2 - CANVAS_WIDTH/2;
        const targetCamY = gameState.player.y + gameState.player.height/2 - CANVAS_HEIGHT/2;
        
        gameState.camera.x += (targetCamX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetCamY - gameState.camera.y) * 0.1;
        
        // Clamp Camera to World
        const mapWidthPx = gameState.levelMap[0].length * TILE_SIZE;
        const mapHeightPx = gameState.levelMap.length * TILE_SIZE;
        
        gameState.camera.x = clamp(gameState.camera.x, 0, mapWidthPx - CANVAS_WIDTH);
        gameState.camera.y = clamp(gameState.camera.y, 0, mapHeightPx - CANVAS_HEIGHT);

        // Update Entities
        // Loop backwards to allow removal
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            ent.update(p);
            if (!ent.active) {
                gameState.entities.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }

    function renderGame(p) {
        p.background(COLORS.BACKGROUND);
        
        const cam = gameState.camera;
        
        // Render Map
        // Optimize: Only render visible tiles
        const startCol = Math.floor(cam.x / TILE_SIZE);
        const endCol = startCol + (CANVAS_WIDTH / TILE_SIZE) + 1;
        const startRow = Math.floor(cam.y / TILE_SIZE);
        const endRow = startRow + (CANVAS_HEIGHT / TILE_SIZE) + 1;
        
        p.push();
        p.translate(-cam.x, -cam.y);
        
        p.noStroke();
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y >= 0 && y < gameState.levelMap.length && x >= 0 && x < gameState.levelMap[0].length) {
                    const tile = gameState.levelMap[y][x];
                    if (tile === 1) {
                        // Wall
                        p.fill(COLORS.WALL);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        
                        // Detail: slightly darker border for depth
                        p.fill(COLORS.WALL_DARK);
                        p.rect(x * TILE_SIZE + 2, y * TILE_SIZE + 35, 36, 5);
                    } else if (tile === 0) {
                        // Background wall detail (optional)
                        if ((x+y) % 7 === 0) {
                            p.fill(30, 30, 40);
                            p.circle(x * TILE_SIZE + 20, y * TILE_SIZE + 20, 10);
                        }
                    }
                }
            }
        }
        p.pop(); // End Map Translate

        // Render Entities
        gameState.entities.forEach(ent => {
            if (isInsideCamera(ent.x, ent.y, ent.width, ent.height, cam)) {
                ent.render(p, cam);
            }
        });
        
        // Render Particles
        gameState.particles.forEach(part => {
             part.render(p, cam);
        });
    }

    p.keyPressed = function() {
        handleKeyDown(p, p.keyCode);

        if (p.keyCode === KEYS.ENTER) {
            if (gameState.gamePhase === "START") {
                resetGameState();
                generateLevel(p);
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, { event: "Game Started" });
            }
        }
        
        if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (p.keyCode === KEYS.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
                clearInputs();
            }
        }
    };

    p.keyReleased = function() {
        handleKeyUp(p, p.keyCode);
    };
});

window.gameInstance = gameInstance;