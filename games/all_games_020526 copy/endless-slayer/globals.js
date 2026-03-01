/**
 * Global constants and game state management.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 350;
export const FPS = 60;

// Game Configuration
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const SPAWN_RATE_INITIAL = 120; // Frames between spawns
export const BOSS_WAVE_INTERVAL = 5; // Waves between bosses

// Entity Types
export const ENTITY_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    PROJECTILE: 'projectile',
    PARTICLE: 'particle',
    LOOT: 'loot'
};

export const CLASSES = {
    KNIGHT: 'KNIGHT',
    WIZARD: 'WIZARD',
    KNAVE: 'KNAVE'
};

// Global Game State
export const gameState = {
    // Phase management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Core game data
    frameCount: 0,
    score: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    wave: 1,
    
    // Selection screen
    selectedClassIndex: 0,
    
    // Entities
    player: null,
    entities: [], // All entities for update loop
    enemies: [],
    projectiles: [],
    particles: [],
    loot: [],
    
    // World state
    cameraShake: 0,
    flashDuration: 0, // For screen flash effects
    
    // Timers
    spawnTimer: 0,
    currentSpawnRate: SPAWN_RATE_INITIAL
};

/**
 * Resets the game state for a new game.
 */
export function resetGameState() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNextLevel = 100;
    gameState.wave = 1;
    gameState.frameCount = 0;
    gameState.player = null;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.loot = [];
    gameState.cameraShake = 0;
    gameState.spawnTimer = 0;
    gameState.currentSpawnRate = SPAWN_RATE_INITIAL;
    // Note: gamePhase is handled by the caller (Start vs Restart)
}

/**
 * Expose gameState globally
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;