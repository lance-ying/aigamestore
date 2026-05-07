import { gameState, logInput, logGameInfo } from './globals.js';

const keys = {};

export function setupInputs() {
    document.addEventListener('keydown', (e) => {
        if (keys[e.keyCode]) return; // Prevent repeat
        keys[e.keyCode] = true;
        logInput('keydown', e.key, e.keyCode);
        handleGlobalKeys(e.keyCode);
    });

    document.addEventListener('keyup', (e) => {
        keys[e.keyCode] = false;
        logInput('keyup', e.key, e.keyCode);
    });
    
    // Expose control mode setter for tests
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log(`Control mode set to: ${mode}`);
        logGameInfo({ action: "CONTROL_MODE_CHANGE", mode: mode });
    };
}

function handleGlobalKeys(keyCode) {
    // ENTER (13) - Start Game / Next Level
    if (keyCode === 13) {
        if (gameState.gamePhase === "START") {
            startGame();
        } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
            nextLevel();
        }
    }

    // ESC (27) - Pause
    if (keyCode === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo({ action: "PAUSE" });
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo({ action: "RESUME" });
        }
    }

    // R (82) - Restart
    if (keyCode === 82) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame();
        }
    }
}

export function isKeyDown(keyCode) {
    // Helper to check multiple keys for same action (e.g., ArrowLeft or A)
    if (Array.isArray(keyCode)) {
        return keyCode.some(code => keys[code]);
    }
    return !!keys[keyCode];
}

import { setupLevel } from './world.js';
import { Player } from './entities.js';

export function startGame() {
    gameState.gamePhase = "PLAYING";
    
    // Clear old entities
    clearEntities();
    
    // Setup Level
    setupLevel(gameState.currentLevel);
    
    // Create Player if not exists (setupLevel handles platforms)
    gameState.player = new Player(0, 5, 0);
    gameState.entities.push(gameState.player);
    
    logGameInfo({ action: "GAME_START", level: gameState.currentLevel });
}

export function nextLevel() {
    gameState.currentLevel++;
    startGame();
}

export function resetGame() {
    // If we were at "GAME_OVER_WIN", we reset to level 1 and score 0
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        gameState.currentLevel = 1;
        gameState.score = 0;
        gameState.gamePhase = "START";
    } 
    // If we were at "GAME_OVER_LOSE", we restart the current level with score 0
    else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        gameState.score = 0; // Reset score when trying again after a loss
        startGame(); // Restart current level
    } else {
        // Fallback or other reset scenario, go to START
        gameState.gamePhase = "START";
        gameState.score = 0;
        gameState.currentLevel = 1;
    }
    
    gameState.frameCount = 0;
    
    // Reset camera if needed (startGame handles this implicitly by recreating player)
    
    logGameInfo({ action: "RESET" });
}

function clearEntities() {
    // Remove meshes from scene
    [...gameState.entities, ...gameState.platforms, ...gameState.enemies, ...gameState.collectibles, ...gameState.particles].forEach(e => {
        if (e.mesh) gameState.scene.remove(e.mesh);
        if (e.dispose) e.dispose();
    });
    
    if (gameState.player && gameState.player.mesh) {
        gameState.scene.remove(gameState.player.mesh);
    }

    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.player = null;
}