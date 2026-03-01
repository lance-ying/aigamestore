export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// UI Layout Constants
export const GRID_OFFSET_X = 20;
export const GRID_OFFSET_Y = 20;
export const GRID_SIZE_PX = 360; // 360x360 grid area
export const UI_PANEL_X = 400;
export const UI_PANEL_WIDTH = 200;

// Game Colors (Neon Palette)
export const COLORS = [
    { name: 'RED',    r: 255, g: 50,  b: 50 },
    { name: 'GREEN',  r: 50,  g: 255, b: 50 },
    { name: 'BLUE',   r: 50,  g: 50,  b: 255 },
    { name: 'YELLOW', r: 255, g: 255, b: 50 },
    { name: 'CYAN',   r: 50,  g: 255, b: 255 },
    { name: 'PURPLE', r: 255, g: 50,  b: 255 },
    { name: 'ORANGE', r: 255, g: 150, b: 50 },
    { name: 'PINK',   r: 255, g: 105, b: 180 },
    { name: 'LIME',   r: 150, g: 255, b: 50 },
    { name: 'WHITE',  r: 220, g: 220, b: 220 }
];

export const gameState = {
    // System State
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Level State
    levelIndex: 1,
    gridWidth: 5,
    gridHeight: 5,
    cells: [],              // 2D array of Cell objects
    activeColors: [],       // Subset of COLORS used in current level
    solutionPaths: [],      // Array of paths (solutions) from generator
    
    // Gameplay State
    cursor: {
        x: 0,
        y: 0,
        isDrawing: false,
        drawingColorIndex: -1
    },
    paths: {},              // Map of colorIndex -> array of {x, y} coordinates
    completedColors: [],    // Array of colorIndices that are successfully connected
    
    // Visuals
    particles: [],
    animations: []
};

// Initializer for logging
export const logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
};

// Global access
export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;