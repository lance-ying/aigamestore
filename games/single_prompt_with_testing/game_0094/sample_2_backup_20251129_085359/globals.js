// globals.js
// Constants and Global Game State

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Grid Configuration
export const GRID_OFFSET_X = 20;
export const GRID_OFFSET_Y = 60; // Space for HUD
export const GRID_COLS = 9;
export const GRID_ROWS = 5;
export const CELL_WIDTH = (CANVAS_WIDTH - GRID_OFFSET_X * 2) / GRID_COLS; // ~62px
export const CELL_HEIGHT = (CANVAS_HEIGHT - GRID_OFFSET_Y - 10) / GRID_ROWS; // ~66px

// Game Colors
export const COLORS = {
    BG: [34, 34, 34],
    LAWN_LIGHT: [46, 204, 113],
    LAWN_DARK: [39, 174, 96],
    HUD_BG: [50, 50, 50],
    HUD_BORDER: [100, 100, 100],
    TEXT: [255, 255, 255],
    ACCENT: [241, 196, 15], // Gold
    DANGER: [231, 76, 60]
};

// Plant Types Definition
export const PLANT_TYPES = {
    SUNFLOWER: {
        id: 'SUNFLOWER',
        name: 'Sunflower',
        cost: 50,
        hp: 100,
        cooldown: 300, // Frames
        color: [241, 196, 15],
        icon: '🌻'
    },
    PEASHOOTER: {
        id: 'PEASHOOTER',
        name: 'Peashooter',
        cost: 100,
        hp: 150,
        cooldown: 300,
        color: [46, 204, 113],
        icon: '🔫'
    },
    WALLNUT: {
        id: 'WALLNUT',
        name: 'Wall-Nut',
        cost: 50,
        hp: 1000,
        cooldown: 600,
        color: [160, 82, 45],
        icon: '🌰'
    }
};

export const PLANT_KEYS = Object.keys(PLANT_TYPES);

// Global State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Grid State
    grid: [], // 2D array [col][row] containing entities
    
    // Player State
    sun: 150, // Starting sun
    score: 0,
    cursor: { col: 2, row: 2 }, // Grid position
    selectedPlantIndex: 0,
    
    // Timers
    plantCooldowns: {}, // Map of plant ID to frames remaining
    waveTimer: 0,
    currentWave: 0,
    totalWaves: 5,
    
    // Entities
    entities: [], // All active entities for update/draw
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [], // Collectible sun
    particles: [],
    
    // Mouse tracking (fallback/debug)
    mouseX: 0,
    mouseY: 0
};

// Initialize logs structure (Write-only)
if (typeof window !== 'undefined') {
    window.gameState = gameState; // Expose for debugging if needed
    
    // Helper to get state
    window.getGameState = function() {
        return gameState;
    };
}