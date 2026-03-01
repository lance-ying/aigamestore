/**
 * globals.js
 * Contains global constants, configuration, and the main gameState object.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Configuration
export const CONFIG = {
    // Timing
    FPS: 60,
    INITIAL_SPAWN_DELAY: 2000,
    STATION_SPAWN_INTERVAL_START: 15000,
    PASSENGER_SPAWN_INTERVAL_START: 2000,
    
    // Limits
    MAX_LINES: 3,
    MAX_STATIONS: 20,
    STATION_CAPACITY: 6,
    TRAIN_CAPACITY: 4,
    OVERCROWD_TIMER_MS: 10000, // Time before game over when overcrowded
    
    // Physics / Movement
    CURSOR_SPEED: 6,
    TRAIN_SPEED: 2.5,
    
    // Scoring
    SCORE_PER_DELIVERY: 10,
    
    // Visuals
    STATION_RADIUS: 15,
    PASSENGER_SIZE: 6,
    LINE_WIDTH: 6
};

// Colors
export const COLORS = {
    BACKGROUND: [245, 245, 240], // Off-white paper look
    TEXT: [50, 50, 50],
    UI_OVERLAY: [0, 0, 0, 150],
    
    // Line Colors (Red, Blue, Green, Yellow, etc.)
    LINES: [
        [220, 50, 50],   // Red
        [50, 50, 220],   // Blue
        [50, 180, 50],   // Green
        [220, 160, 20],  // Yellow
        [150, 50, 150]   // Purple
    ],
    
    STATION_BORDER: [40, 40, 40],
    STATION_FILL: [255, 255, 255],
    CURSOR: [80, 80, 80],
    
    OVERCROWD_WARNING: [200, 200, 200]
};

// Enums
export const SHAPES = {
    CIRCLE: 0,
    SQUARE: 1,
    TRIANGLE: 2
    // Potential expansion: CROSS, DIAMOND, STAR
};

export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Global Game State
export const gameState = {
    // System
    gamePhase: GAME_PHASES.START,
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input
    cursor: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, activeLineIndex: 0 },
    
    // Entities
    stations: [],
    lines: [],
    trains: [],
    passengers: [], // Floating passengers (animations), waiting ones are in stations
    particles: [],
    
    // Logic
    score: 0,
    passengersDelivered: 0,
    timeSinceStart: 0,
    
    // Timers
    nextStationTimer: 0,
    nextPassengerTimer: 0,
    
    // Map Logic
    networkGraph: null, // Routing table
    
    // Camera / View (Shake effect)
    shakeAmount: 0
};

// Expose globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Initialize logs if not present
if (!window.p5) {
    // Mock for testing environment if p5 not loaded yet
    window.plogs = { game_info: [], inputs: [], player_info: [] };
}