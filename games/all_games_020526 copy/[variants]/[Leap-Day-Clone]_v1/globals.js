/**
 * Global constants and state management
 */

export const CANVAS_WIDTH = 600; // Updated for 600x400 aspect ratio
export const CANVAS_HEIGHT = 400;
export const PLAYABLE_WIDTH = 400; // The original game width
export const OFFSET_X = (CANVAS_WIDTH - PLAYABLE_WIDTH) / 2; // Center the game

export const GRAVITY = 0.5;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.98;
export const JUMP_FORCE = -10; // Lowered from -11
export const MOVE_SPEED = 5;
export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_FORCE = { x: 8, y: -11 }; // Lowered y from -12
export const MAX_FALL_SPEED = 15;

export const COLORS = {
    background: '#2C3E50',
    player: '#F1C40F',
    playerOutline: '#F39C12',
    wall: '#7F8C8D',
    wallTop: '#27AE60',
    spike: '#C0392B',
    enemy: '#8E44AD',
    fruit: '#E67E22',
    checkpoint: '#2980B9',
    checkpointActive: '#3498DB',
    trophy: '#F1C40F',
    text: '#ECF0F1',
    sword: '#BDC3C7',
    shield: '#3498DB'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    
    player: null,
    entities: [], // All updateable/renderable entities
    
    // Level objects (for efficient collision)
    walls: [],
    platforms: [],
    hazards: [],
    collectibles: [],
    checkpoints: [],
    enemies: [],
    particles: [],
    
    // Camera
    cameraY: 0,
    cameraTargetY: 0,
    worldHeight: 3200, // Total height of the level
    
    // Game stats
    score: 0, // Total score (fruit + altitude)
    fruitCollectedScore: 0, // Score from collected fruit
    maxAltitudeReached: 0, // Highest altitude reached in pixels
    lives: 3,
    maxLives: 3,
    currentCheckpoint: null, // {x, y}
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Auto-restart state
    autoRestartScheduled: false,
    autoRestartTimeoutId: null
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging utility
export function logGameInfo(p, info) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: info,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}