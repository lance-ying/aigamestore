import { gameState, TOWER_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Tower } from './entities.js';
import { isPointOnPath, isOverlappingTower } from './physics.js';

const CURSOR_SPEED = 5;

// Keys
const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    Z: 90, // Switch Tower
    SPACE: 32, // Place / Select
    SHIFT: 16, // Upgrade
    ENTER: 13, // Start Wave
    ESC: 27, // Pause
    R: 82, // Restart
    ONE: 49,
    TWO: 50,
    THREE: 51
};

const keysState = {};

export function handleKeyDown(p) {
    const code = p.keyCode;
    keysState[code] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'keydown',
            key: p.key,
            keyCode: code,
            frame: p.frameCount
        });
    }

    // Phase Transitions
    if (code === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "PLAYING" && !gameState.waveActive) {
            startNextWave();
        }
    }
    
    if (code === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            window.resetGame();
        }
    }
    
    if (code === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }

    // Map Selection Removed to enforce sequential progression
    
    // Gameplay Actions
    if (gameState.gamePhase === "PLAYING") {
        if (code === KEYS.Z) {
            cycleTowerType();
        }
        
        if (code === KEYS.SPACE) {
            handleSpaceAction();
        }
        
        if (code === KEYS.SHIFT) {
            if (gameState.selectedTower) {
                gameState.selectedTower.upgrade();
            }
        }
    }
}

export function handleKeyUp(p) {
    keysState[p.keyCode] = false;
}

export function processInput() {
    if (gameState.gamePhase !== "PLAYING") return;
    
    // Cursor Movement
    if (keysState[KEYS.LEFT]) gameState.cursor.x = Math.max(0, gameState.cursor.x - CURSOR_SPEED);
    if (keysState[KEYS.RIGHT]) gameState.cursor.x = Math.min(CANVAS_WIDTH, gameState.cursor.x + CURSOR_SPEED);
    if (keysState[KEYS.UP]) gameState.cursor.y = Math.max(0, gameState.cursor.y - CURSOR_SPEED);
    if (keysState[KEYS.DOWN]) gameState.cursor.y = Math.min(CANVAS_HEIGHT, gameState.cursor.y + CURSOR_SPEED);
}

function cycleTowerType() {
    const types = Object.keys(TOWER_TYPES);
    let idx = types.indexOf(gameState.selectedTowerType);
    idx = (idx + 1) % types.length;
    gameState.selectedTowerType = types[idx];
}

function handleSpaceAction() {
    // 1. Check if selecting a tower
    let clickedTower = null;
    for (const tower of gameState.towers) {
        const dx = gameState.cursor.x - tower.x;
        const dy = gameState.cursor.y - tower.y;
        if (Math.sqrt(dx*dx + dy*dy) < tower.radius + 10) {
            clickedTower = tower;
            break;
        }
    }
    
    if (clickedTower) {
        gameState.selectedTower = (gameState.selectedTower === clickedTower) ? null : clickedTower;
        return;
    }
    
    // 2. Try to place tower
    // Deselect if clicking empty space
    if (gameState.selectedTower) {
        gameState.selectedTower = null;
    }
    
    attemptBuildTower();
}

function attemptBuildTower() {
    const type = TOWER_TYPES[gameState.selectedTowerType];
    const x = gameState.cursor.x;
    const y = gameState.cursor.y;
    
    // Checks
    if (gameState.money < type.cost) return; // Not enough money
    if (isPointOnPath(x, y, 15)) return; // On path
    if (isOverlappingTower(x, y, 15)) return; // On other tower
    
    // Build
    gameState.money -= type.cost;
    new Tower(x, y, gameState.selectedTowerType);
}

function startNextWave() {
    gameState.waveActive = true;
    gameState.waveFrame = 0;
    gameState.enemiesSpawnedInWave = 0;
    gameState.waveComplete = false;
}