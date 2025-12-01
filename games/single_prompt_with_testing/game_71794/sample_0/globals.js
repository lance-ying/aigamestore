// globals.js
// Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Hexagon Configuration
export const HEX_SIZE = 22; // Radius of hex
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;
export const GRID_RADIUS = 5; // How many rings of hexes

// Colors
export const COLORS = {
    BACKGROUND: '#1a1a2e',
    HEX_BG: '#16213e',
    HEX_BORDER: '#0f3460',
    HEX_WALL: '#303a52',
    HEX_EXIT: '#5cdb95',
    PLAYER: '#ffd700',
    PLAYER_SHADOW: '#c5a000',
    ENEMY_MELEE: '#e94560',
    ENEMY_RANGED: '#ff2e63',
    CURSOR: '#00fff5',
    DANGER: 'rgba(233, 69, 96, 0.4)',
    PATH: 'rgba(255, 255, 255, 0.1)',
    UI_TEXT: '#ffffff',
    UI_ACCENT: '#4ecca3'
};

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_TRANSITION
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Level Data
    level: 1,
    score: 0,
    
    // Grid & Entities
    tiles: new Map(), // key: "q,r", value: Tile object
    entities: [],     // All active entities
    player: null,
    exitPos: null,
    
    // Turn System
    turnState: "PLAYER_INPUT", // PLAYER_INPUT, PLAYER_ACT, ENEMY_ACT
    turnCount: 0,
    
    // Input/Cursor
    cursor: { q: 0, r: 0 },
    
    // Animations
    animations: [], // Queue of active animations {update(dt), isFinished(), render(p)}
    particles: [],
    
    // Camera/Visuals
    camera: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    dangerTiles: new Set(), // Set of "q,r" strings that are dangerous next turn
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// Global accessor
window.getGameState = () => gameState;

// Logging Helper
export function logGameEvent(type, data) {
    if (window.gameInstance && window.gameInstance.logs) {
        window.gameInstance.logs.game_info.push({
            type,
            data,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}