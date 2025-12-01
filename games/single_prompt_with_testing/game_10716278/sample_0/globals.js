export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Arrow directions/IDs
export const NOTE_LEFT = 0;
export const NOTE_DOWN = 1;
export const NOTE_UP = 2;
export const NOTE_RIGHT = 3;

// Key Codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    R: 82,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

// Game constants
export const SCROLL_SPEED = 5; // Pixels per frame
export const NOTE_SIZE = 40;
export const RECEPTOR_Y = 50; // Y position where notes should be hit
export const SPAWN_Y = CANVAS_HEIGHT + 50;
export const LANE_WIDTH = 50;
export const HIT_WINDOW = 40; // Pixels allowance for a hit

// Colors
export const COLORS = {
    PURPLE: [175, 75, 220],  // Left
    BLUE: [75, 175, 235],    // Down
    GREEN: [75, 235, 125],   // Up
    RED: [235, 75, 95],      // Right
    GRAY: [100, 100, 100],
    WHITE: [255, 255, 255],
    BG: [30, 30, 40],
    HEALTH_PLAYER: [50, 255, 50],
    HEALTH_ENEMY: [255, 50, 50]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Rhythm Stats
    score: 0,
    combo: 0,
    health: 50, // 0 to 100. 50 is neutral. 0 is lose, 100 is max win.
    maxHealth: 100,
    
    // Entities
    notes: [], // Active notes scrolling up
    particles: [], // Hit effects
    
    // Characters
    player: null,
    enemy: null,
    girlfriend: null,
    
    // Song Data
    songTime: 0,
    bpm: 120,
    beatDuration: 0, // Calculated from BPM
    lastBeatTime: 0,
    currentBeat: 0,
    songStartFrame: 0,
    
    // Inputs (for visual feedback)
    lanePressed: [false, false, false, false], // Player lanes [L, D, U, R]
    enemyLanePressed: [false, false, false, false], // Enemy lanes
    
    // Metadata
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}

// Initializer helper
export function resetGameState() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.health = 50;
    gameState.notes = [];
    gameState.particles = [];
    gameState.songTime = 0;
    gameState.currentBeat = 0;
    gameState.lanePressed = [false, false, false, false];
    gameState.enemyLanePressed = [false, false, false, false];
}

// Global logger
export function logGameEvent(p, type, data) {
    if (p.logs && p.logs[type]) {
        p.logs[type].push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}