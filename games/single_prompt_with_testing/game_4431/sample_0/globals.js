/**
 * globals.js
 * Contains global constants, game state initialization, and shared configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid Configuration
export const TILE_SIZE = 45;
export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const GRID_OFFSET_X = (CANVAS_WIDTH - (GRID_COLS * TILE_SIZE)) / 2; // Center horizontally
export const GRID_OFFSET_Y = 80; // Margin from top

// Game Constants
export const MAX_TURNS = 5;
export const MAX_GRID_POWER = 7;
export const ANIMATION_SPEED = 0.2; // 0.0 to 1.0 lerp factor

// Global Game State
// This object tracks the entire state of the game
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    turnPhase: "PLAYER_START", // PLAYER_START, PLAYER_ACTION, ENEMY_MOVE, ENEMY_ATTACK, SPAWN_ENEMIES
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Core Game Data
    grid: [], // 2D array of Tile objects
    entities: [], // All active units (Mechs + Vek)
    buildings: [], // Static building entities
    particles: [], // Visual effects
    
    // Player Status
    gridPower: MAX_GRID_POWER,
    maxGridPower: MAX_GRID_POWER,
    currentTurn: 1,
    score: 0,
    
    // Interaction State
    cursor: { x: 3, y: 3 }, // Grid coordinates
    selectedUnit: null, // Currently selected mech
    selectionState: "NONE", // NONE, MOVING, TARGETING
    validMoves: [], // Array of valid tile coordinates for movement
    validTargets: [], // Array of valid tile coordinates for attacks
    
    // Animation State
    isAnimating: false,
    animationQueue: [], // Queue of actions to animate
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Logs (Write-only)
    logs: {
        game_info: [],
        inputs: [],
        player_info: []
    }
};

/**
 * Returns the global game state object.
 * Exposed to window for debugging and testing.
 */
export function getGameState() {
    return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}