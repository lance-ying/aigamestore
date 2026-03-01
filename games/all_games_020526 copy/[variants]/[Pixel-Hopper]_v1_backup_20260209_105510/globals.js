export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40; // Size of one tile
export const MOVE_SPEED = 0.2; // 0.0 to 1.0 progress per frame (speed of hop)

export const COLORS = {
    GRASS_LIGHT: '#8bc34a',
    GRASS_DARK: '#7cb342',
    ROAD: '#455a64',
    ROAD_MARKING: '#ffffff',
    WATER: '#4fc3f7',
    RAIL: '#5d4037',
    RAIL_TIE: '#3e2723',
    RAIL_METAL: '#90a4ae',
    PLAYER: '#ffeb3b',
    PLAYER_ACCENT: '#fbc02d',
    CAR_COLORS: ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa'],
    LOG: '#795548',
    TREE: '#2e7d32',
    TRAIN: '#d32f2f'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Logic state
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    score: 0,
    highScore: 0,
    
    // World state
    cameraY: 0,
    cameraOffsetTarget: 0,
    
    // Entities
    player: null,
    lanes: [], // Array of Lane objects
    particles: [],
    
    // Input state
    keys: {},

    // Auto-restart state
    autoRestartScheduled: false
};

// Initialize logs for debugging and analysis
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;