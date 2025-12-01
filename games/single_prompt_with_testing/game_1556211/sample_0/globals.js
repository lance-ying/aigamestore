export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 40;
export const GRAVITY = 0.6;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Global Game State
export const gameState = {
    gamePhase: PHASE_START,
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Entities
    player: null,
    enemies: [],
    projectiles: [],
    particles: [],
    tiles: new Map(), // Map "x,y" -> Tile object
    
    // World data
    worldBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
    
    // Camera
    camera: { x: 0, y: 0 },
    shake: 0,
    
    // Narration
    currentNarration: null,
    narrationTimer: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    score: 0
};

// Expose globally
window.getGameState = () => gameState;

// Logging function helper (write-only)
export function logGameEvent(p, type, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            type: type,
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}