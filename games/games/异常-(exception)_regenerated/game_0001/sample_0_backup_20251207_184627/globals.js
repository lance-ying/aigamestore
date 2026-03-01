// globals.js - Game constants and state management

// Dimensions and Grid
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const MAP_OFFSET_X = 20;
export const MAP_OFFSET_Y = 20;
export const UI_WIDTH = 200; // Width of the right-side UI panel
export const GAME_VIEW_WIDTH = CANVAS_WIDTH - UI_WIDTH;

// Colors (Neon/Sci-fi Palette)
export const COLORS = {
    BACKGROUND: '#111116',
    GRID_LINES: '#222233',
    WALL: '#444455',
    FLOOR: '#1a1a24',
    PLAYER: '#00ffcc', // Cyan
    PLAYER_GLOW: 'rgba(0, 255, 204, 0.3)',
    ENEMY: '#ff0055', // Magenta/Red
    GOAL: '#ffff00', // Yellow
    TEXT: '#eeeeee',
    TEXT_DIM: '#8888aa',
    HIGHLIGHT: '#00aaff',
    COMMAND_BG: '#22222a',
    SUCCESS: '#00ff00',
    ERROR: '#ff0000'
};

// Command Types
export const COMMANDS = {
    MOVE: 'MOVE',
    TURN_LEFT: 'TURN_L',
    TURN_RIGHT: 'TURN_R',
    ATTACK: 'ATTACK',
    WAIT: 'WAIT'
};

// Directions: 0: Right, 1: Down, 2: Left, 3: Up
export const DIRECTIONS = [
    { x: 1, y: 0 },  // 0 Right
    { x: 0, y: 1 },  // 1 Down
    { x: -1, y: 0 }, // 2 Left
    { x: 0, y: -1 }  // 3 Up
];

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    subPhase: "PROGRAMMING", // PROGRAMMING, EXECUTING
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Level State
    currentLevelIdx: 0,
    grid: [], // 2D array for the map
    cols: 0,
    rows: 0,
    
    // Entities
    player: null,
    enemies: [],
    particles: [],
    
    // Programming State
    programQueue: [], // Array of command strings
    selectedCommandIdx: 0, // Index in the available commands list
    maxCommands: 20,
    executionStep: 0, // Current step in the program during execution
    
    // Animation/Timing
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    executionTimer: 0, // Timer for step execution
    stepDuration: 30, // Frames per step (can be sped up)
    
    // Camera/Shake
    shake: 0
};

// Available commands list for the UI
export const AVAILABLE_COMMANDS = [
    { type: COMMANDS.MOVE, label: "MOVE FWD" },
    { type: COMMANDS.TURN_LEFT, label: "TURN LEFT" },
    { type: COMMANDS.TURN_RIGHT, label: "TURN RIGHT" },
    { type: COMMANDS.ATTACK, label: "ATTACK" },
    { type: COMMANDS.WAIT, label: "WAIT" }
];

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;