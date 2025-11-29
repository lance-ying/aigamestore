export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Grid configuration for the territory map
export const GRID_CELL_SIZE = 5;
export const GRID_COLS = CANVAS_WIDTH / GRID_CELL_SIZE;
export const GRID_ROWS = CANVAS_HEIGHT / GRID_CELL_SIZE;

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
    NEUTRAL: '#2A2A2A'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Game Entities & World
    player: null,
    enemies: [],
    entities: [],
    
    // Map State (Grid)
    // 2D Array or 1D TypedArray mapping cell index to Owner ID (0 = Neutral, 1 = Player, 2+ = Enemies)
    worldGrid: null, 
    mapGraphics: null, // p5.Graphics buffer for rendering the floor
    
    score: 0,    // Percent of map owned * 100 or tile count
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