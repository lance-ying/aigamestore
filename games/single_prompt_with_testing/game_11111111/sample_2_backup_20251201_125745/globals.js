// global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION = 0.85;
export const GROUND_FRICTION = 0.8;
export const AIR_RESISTANCE = 0.98;

// Colors
export const COLORS = {
    BACKGROUND: [20, 15, 25],
    PLATFORM: [60, 50, 70],
    PLATFORM_TOP: [100, 90, 110],
    PLAYER: [200, 50, 50], // The "Beheaded" red/pink
    PLAYER_HEAD: [255, 100, 50], // Flame
    ENEMY_ZOMBIE: [50, 150, 50],
    ENEMY_ARCHER: [100, 50, 150],
    CELL: [100, 200, 255],
    HEALTH: [255, 50, 50],
    TEXT: [255, 255, 255],
    ACCENT: [255, 204, 0]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // World
    cameraX: 0,
    cameraY: 0,
    levelWidth: 3000,
    levelHeight: 1000,
    groundY: 1000, // Death plane
    
    // Entities
    player: null,
    entities: [],
    platforms: [],
    enemies: [],
    projectiles: [],
    collectibles: [],
    particles: [],
    
    // Game Progress
    score: 0,
    level: 1,
    exitDoor: null
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging function helper
export function logGameInfo(p, infoType, data) {
    if (!p.logs) return;
    
    const entry = {
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    };

    if (infoType === 'game') p.logs.game_info.push(entry);
    if (infoType === 'input') p.logs.inputs.push(entry);
    if (infoType === 'player') p.logs.player_info.push(entry);
}