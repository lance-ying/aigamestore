/**
 * Global constants and game state management.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid Configuration
export const TILE_SIZE = 40;
export const GRID_OFFSET_X = 20;
export const GRID_OFFSET_Y = 20;

// Game Colors (Neon/Cyber Theme)
export const COLORS = {
    BACKGROUND: [10, 15, 20],
    GRID_LINES: [30, 40, 50],
    WALL: [40, 50, 60],
    FLOOR: [20, 25, 30],
    GOAL: [0, 255, 150],
    HAZARD: [255, 50, 50],
    ROBOT: [50, 150, 255],
    ROBOT_ACTIVE: [100, 200, 255],
    ENEMY: [255, 100, 0],
    UI_BG: [15, 20, 25],
    UI_BORDER: [50, 60, 70],
    TEXT: [220, 220, 220],
    COMMAND_EMPTY: [40, 40, 40],
    COMMAND_MOVE: [50, 150, 255],
    COMMAND_TURN_L: [255, 200, 0],
    COMMAND_TURN_R: [255, 200, 0],
    COMMAND_ATTACK: [255, 50, 50],
    COMMAND_WAIT: [150, 150, 150]
};

// Command Enums
export const COMMANDS = {
    EMPTY: 0,
    MOVE: 1,
    TURN_LEFT: 2,
    TURN_RIGHT: 3,
    ATTACK: 4,
    WAIT: 5
};

// Directions
export const DIR = {
    UP: { x: 0, y: -1, label: 'NORTH' },
    RIGHT: { x: 1, y: 0, label: 'EAST' },
    DOWN: { x: 0, y: 1, label: 'SOUTH' },
    LEFT: { x: -1, y: 0, label: 'WEST' }
};

// Simulation Constants
export const SIMULATION_SPEED = 30; // Frames per tick (0.5s at 60fps)
export const MAX_COMMANDS = 8; // Max commands per robot

// Initial Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, GAME_OVER_WIN, GAME_OVER_LOSE, PAUSED
    controlMode: "HUMAN",
    
    // Level State
    currentLevelIndex: 0,
    grid: [], // 2D array of tile types
    units: [], // Array of Robot objects
    enemies: [], // Array of Enemy objects
    effects: [], // Particles/Visual effects
    
    // Simulation State
    isSimulating: false,
    simulationTickTimer: 0,
    simulationStep: 0,
    
    // Editor State
    activeUnitIndex: 0,
    selectedSlotIndex: 0,
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

// Expose state globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging Helper
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}