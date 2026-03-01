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
    // ENTER (13) - Start Game
    if (keyCode === 13) {
        if (gameState.gamePhase === "START") {
            startGame();
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
    setupLevel(1);
    
    // Create Player if not exists (setupLevel handles platforms)
    gameState.player = new Player(0, 5, 0);
    gameState.entities.push(gameState.player);
    
    logGameInfo({ action: "GAME_START" });
}

export function resetGame() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.frameCount = 0;
    clearEntities();
    
    // Reset camera
    if (gameState.camera) {
        gameState.camera.position.set(0, 5, 20);
        gameState.camera.lookAt(0, 2, 0);
    }
    
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