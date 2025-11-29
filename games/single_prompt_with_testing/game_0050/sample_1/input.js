import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';
import { LEVELS } from './levels.js';

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;

    let turnDir = 0;
    let boosting = false;

    if (gameState.controlMode === "HUMAN") {
        if (p.keyIsDown(p.LEFT_ARROW)) {
            turnDir = -1;
        } else if (p.keyIsDown(p.RIGHT_ARROW)) {
            turnDir = 1;
        }
        
        if (p.keyIsDown(p.DOWN_ARROW)) {
            gameState.player.turnSpeed = 0.12; 
            gameState.player.speed = 1.5;
        } else {
            gameState.player.turnSpeed = 0.08;
            gameState.player.speed = 2.0;
        }

        if (p.keyIsDown(32)) {
            boosting = true;
        }
    } 
    else {
        const action = get_automated_testing_action(gameState);
        if (action) {
            if (action.keyIsDown === "LEFT") turnDir = -1;
            if (action.keyIsDown === "RIGHT") turnDir = 1;
            if (action.keyIsDown === "SPACE") boosting = true;
        }
    }

    if (turnDir !== 0) {
        gameState.player.heading += turnDir * gameState.player.turnSpeed;
    }
    
    gameState.player.isBoosting = boosting;
}

export function handleKeyPress(p) {
    const k = p.keyCode;
    
    p.logs.inputs.push({
        type: "PRESS",
        key: p.key,
        keyCode: k,
        frame: p.frameCount,
        time: Date.now()
    });

    if (k === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    else if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        }
        else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
        else if (gameState.gamePhase === "START" || 
                 gameState.gamePhase === "GAME_OVER_WIN" || 
                 gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "LEVEL_SELECT";
        }
    }
    else if (k === 82) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
            gameState.gamePhase = "START";
            window.resetGame(p);
        }
    }
    else if (k === 78) { // N for Next Level
        if (gameState.gamePhase === "GAME_OVER_WIN" && 
            gameState.currentLevel < LEVELS.length - 1) {
            gameState.currentLevel++;
            const level = LEVELS[gameState.currentLevel];
            gameState.worldWidth = level.worldWidth;
            gameState.worldHeight = level.worldHeight;
            const GameGrid = require('./grid.js').GameGrid;
            gameState.worldGrid = new GameGrid(p, level.worldWidth, level.worldHeight);
            gameState.gamePhase = "START";
            window.resetGame(p);
        }
    }
}