export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 25;
export const GRID_W = 24; // 600 / 25
export const GRID_H = 16; // 400 / 25

export const COLORS = {
    BACKGROUND: [16, 16, 18],
    TEXT_GLOW: [255, 255, 255, 50],
    UI_BG: [0, 0, 0, 200]
};

// Game Phases
export const PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

// Global State
export const gameState = {
    gamePhase: PHASES.START,
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    currentLevelIndex: 0,
    grid: [], // 2D array of lists of entities
    entities: [], // Flat list of all entities
    rules: [], // Active parsed rules
    
    // Derived Rule States (Maps Type -> Boolean/Type)
    isYou: new Set(),
    isPush: new Set(),
    isStop: new Set(),
    isWin: new Set(),
    isDefeat: new Set(),
    isSink: new Set(),
    transforms: new Map(), // Type -> Type
    
    // Undo History
    history: [],
    
    // Input
    keys: {},
    moveCooldown: 0,
    
    // Visuals
    particles: [],
    shake: 0,
    
    // Testing
    testActionQueue: []
};

// Reset State for Level
export function resetLevelState() {
    gameState.grid = [];
    gameState.entities = [];
    gameState.rules = [];
    gameState.history = [];
    gameState.particles = [];
    gameState.isYou.clear();
    gameState.isPush.clear();
    gameState.isStop.clear();
    gameState.isWin.clear();
    gameState.isDefeat.clear();
    gameState.isSink.clear();
    gameState.transforms.clear();
    
    // Init Grid
    for (let x = 0; x < GRID_W; x++) {
        gameState.grid[x] = [];
        for (let y = 0; y < GRID_H; y++) {
            gameState.grid[x][y] = [];
        }
    }
}

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;