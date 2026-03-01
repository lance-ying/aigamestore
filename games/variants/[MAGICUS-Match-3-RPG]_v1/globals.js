// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_ROWS = 6;
export const GRID_COLS = 6;
export const TILE_SIZE = 45;
export const GRID_OFFSET_X = 300; // Right side of screen
export const GRID_OFFSET_Y = 80; // Lowered slightly to fit top UI

export const MOVE_COST = 2; // HP cost per move

export const RUNE_TYPES = {
    FIRE: 0,  // Red - Damage
    WATER: 1, // Blue - Heal
    EARTH: 2, // Green - Shield
    LIGHT: 3, // Yellow - Mana
    DARK: 4   // Purple - Bonus/Debuff
};

export const COLORS = {
    BACKGROUND: '#1a1a24',
    UI_BG: '#252530',
    GRID_BG: '#15151e',
    TEXT: '#ffffff',
    ACCENT: '#ffd700',
    HP: '#ff4444',
    MANA: '#4488ff',
    SHIELD: '#44ff44',
    FIRE: '#e74c3c',
    WATER: '#3498db',
    EARTH: '#2ecc71',
    LIGHT: '#f1c40f',
    DARK: '#9b59b6'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Game Entities
    player: null,
    currentEnemy: null,
    stage: 1,
    maxStages: 6,
    
    // Grid State
    grid: [], // 2D array of Tile objects
    selectedTile: null, // {c, r}
    cursor: { c: 0, r: 0 },
    
    // Battle State
    turnState: "PLAYER_INPUT", // PLAYER_INPUT, ANIMATING, RESOLVING, ENEMY_TURN
    matches: [],
    fallingTiles: false,
    comboMultiplier: 1,
    matchStreak: 0,
    streakType: null,
    
    // Particles
    particles: [],
    floatingTexts: [],
    
    // Logs (Write-only references)
    logs: null
};

// Initialize logs in main setup
export function initLogs(p) {
    gameState.logs = p.logs;
}

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;