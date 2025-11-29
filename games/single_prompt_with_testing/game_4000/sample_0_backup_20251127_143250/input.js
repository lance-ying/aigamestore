// input.js - Input handling
import { gameState, logInput } from './globals.js';
import { getCameraDirection, getCameraRightVector } from './camera.js';
import { castRayForPortal } from './physics.js';
import { Portal } from './entities.js';

export function setupInput() {
    // Keyboard input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mouse input for portal firing (optional)
    document.addEventListener('click', handleMouseClick);
}

function handleKeyDown(event) {
    logInput('keydown', event.key, event.keyCode);
    gameState.keys[event.keyCode] = true;
    
    // Prevent default for game keys
    if ([37, 38, 39, 40, 32, 27, 13, 82].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    // Phase controls
    if (event.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            startGame();
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            if (gameState.currentLevel < gameState.maxLevels) {
                nextLevel();
            }
        }
    }
    
    if (event.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            pauseGame();
        } else if (gameState.gamePhase === "PAUSED") {
            resumeGame();
        }
    }
    
    if (event.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE" ||
            gameState.gamePhase === "PAUSED") {
            restartGame();
        }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING") {
        // Portal firing
        if (event.keyCode === 90) { // Z - Blue portal
            firePortal(true);
        }
        if (event.keyCode === 88 || event.keyCode === 16) { // X or Shift - Orange portal
            firePortal(false);
        }
    }
}

function handleKeyUp(event) {
    logInput('keyup', event.key, event.keyCode);
    gameState.keys[event.keyCode] = false;
}

function handleMouseClick(event) {
    if (gameState.gamePhase === "PLAYING") {
        // Left click = blue portal
        firePortal(true);
    }
}

export function processInput() {
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
    
    const player = gameState.player;
    const keys = gameState.keys;
    
    // Movement
    const cameraDir = getCameraDirection();
    const cameraRight = getCameraRightVector();
    
    // Forward/backward (W/S or Up/Down)
    if (keys[87] || keys[38]) { // W or Up
        const moveDir = new THREE.Vector3(cameraDir.x, 0, cameraDir.z);
        player.move(moveDir);
    }
    if (keys[83] || keys[40]) { // S or Down
        const moveDir = new THREE.Vector3(-cameraDir.x, 0, -cameraDir.z);
        player.move(moveDir);
    }
    
    // Strafe left/right (A/D or Left/Right)
    if (keys[65] || keys[37]) { // A or Left
        player.move(cameraRight.clone().negate());
    }
    if (keys[68] || keys[39]) { // D or Right
        player.move(cameraRight);
    }
    
    // Jump (Space)
    if (keys[32]) {
        player.jump();
    }
}

function firePortal(isBlue) {
    // Cast ray from camera center
    const origin = gameState.camera.position.clone();
    const direction = getCameraDirection();
    
    const hit = castRayForPortal(origin, direction);
    
    if (hit) {
        // Create or move portal
        if (isBlue) {
            if (!gameState.bluePortal) {
                gameState.bluePortal = new Portal(true);
            }
            gameState.bluePortal.place(hit.position, hit.normal, hit.surface);
        } else {
            if (!gameState.orangePortal) {
                gameState.orangePortal = new Portal(false);
            }
            gameState.orangePortal.place(hit.position, hit.normal, hit.surface);
        }
    }
}

function startGame() {
    gameState.gamePhase = "PLAYING";
    import('./levels.js').then(module => {
        module.loadLevel(1);
    });
}

function nextLevel() {
    gameState.currentLevel++;
    gameState.gamePhase = "PLAYING";
    import('./levels.js').then(module => {
        module.loadLevel(gameState.currentLevel);
    });
}

function pauseGame() {
    gameState.gamePhase = "PAUSED";
}

function resumeGame() {
    gameState.gamePhase = "PLAYING";
}

function restartGame() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.currentLevel = 1;
    
    // Reset player
    if (gameState.player) {
        gameState.player.mesh.position.set(0, 2, 0);
        gameState.player.velocity.set(0, 0, 0);
    }
}