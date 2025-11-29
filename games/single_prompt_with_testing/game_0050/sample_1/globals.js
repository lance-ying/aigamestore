export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Grid configuration for the territory map
export const GRID_CELL_SIZE = 5;

// Colors
export const COLORS = {
    BACKGROUND: '#222222',
    GRID_LINES: '#333333',
    TEXT: '#FFFFFF',
    PLAYER: '#00FFFF',      // Cyan
    PLAYER_TERRITORY: '#008888',
    ENEMY_1: '#FF0000',     // Red
    ENEMY_1_TERRITORY: '#880000',
    ENEMY_2: '#00FF00',     // Green
    ENEMY_2_TERRITORY: '#008800',
    ENEMY_3: '#FFFF00',     // Yellow
    ENEMY_3_TERRITORY: '#888800',
    ENEMY_4: '#FF00FF',     // Magenta
    ENEMY_4_TERRITORY: '#880088',
    ENEMY_5: '#FFA500',     // Orange
    ENEMY_5_TERRITORY: '#885500',
    NEUTRAL: '#2A2A2A'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_SELECT
    controlMode: "HUMAN",
    
    // Level System
    currentLevel: 0,
    worldWidth: 600,
    worldHeight: 400,
    
    // Camera System
    cameraX: 0,
    cameraY: 0,
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Game Entities & World
    player: null,
    enemies: [],
    entities: [],
    
    // Map State (Grid)
    worldGrid: null, 
    mapGraphics: null,
    
    score: 0,
    highScore: 0,
    
    // Input state
    keys: {}
};

// Initialize logs container
export const initLogs = (p) => {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
};

// Global accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;