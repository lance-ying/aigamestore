// Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const TILE_SIZE = 40;

// Game Phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Entity Types
export const TYPE_PLAYER = "PLAYER";
export const TYPE_ENEMY = "ENEMY";
export const TYPE_PLATFORM = "PLATFORM";
export const TYPE_PROJECTILE = "PROJECTILE";
export const TYPE_COLLECTIBLE = "COLLECTIBLE";
export const TYPE_PARTICLE = "PARTICLE";
export const TYPE_HAZARD = "HAZARD";

// Weapon Types
export const WEAPON_PISTOL = "PISTOL";
export const WEAPON_SHOTGUN = "SHOTGUN";
export const WEAPON_LASER = "LASER";
export const WEAPON_MACHINEGUN = "MACHINEGUN";

export const gameState = {
    gamePhase: PHASE_START,
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    entities: [], // All dynamic entities (enemies, projectiles, collectibles)
    platforms: [], // Static geometry
    particles: [], // Visual effects
    
    // World State
    cameraY: 0,
    cameraShake: 0,
    worldHeight: 4000, // Total height of the tower
    smokeY: 0, // Position of the rising toxic smoke
    smokeSpeed: 0.8,
    
    // Game Progress
    score: 0,
    floor: 1,
    
    // Input State
    keys: {},
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug
    debugMode: false
};

export function getGameState() {
    return gameState;
}

// Make accessible globally
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = PHASE_START;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.cameraY = 0;
    gameState.cameraShake = 0;
    gameState.smokeY = 0;
    gameState.frameCount = 0;
    gameState.player = null;
}