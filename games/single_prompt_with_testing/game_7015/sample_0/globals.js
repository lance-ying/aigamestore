export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Centralized Game State
export const gameState = {
    // Game Flow
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Core Gameplay Data
    score: 0, // Not primarily used for win condition, but tracks kills/hits
    
    // Win Condition
    gemsCollected: 0,
    winningGemCount: 10,
    countdownTimer: 0,
    isCountdownActive: false,
    countdownDuration: 10, // seconds
    
    // Entities
    player: null,
    enemies: [],
    projectiles: [],
    gems: [],
    walls: [],
    particles: [],
    
    // Map bounds
    mapWidth: 600,
    mapHeight: 400,
    
    // Spawners
    gemSpawnTimer: 0,
    enemySpawnTimer: 0,
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

// Constants for tuning
export const CONSTANTS = {
    PLAYER_SPEED: 4,
    PLAYER_HEALTH: 100,
    PLAYER_DAMAGE: 20,
    ENEMY_SPEED: 2.5,
    ENEMY_HEALTH: 60,
    ENEMY_DAMAGE: 10,
    GEM_SPAWN_RATE: 180, // Frames
    ENEMY_SPAWN_RATE: 300, // Frames
    PROJECTILE_SPEED: 8,
    SUPER_CHARGE_PER_HIT: 20,
    MAX_SUPER_CHARGE: 100
};