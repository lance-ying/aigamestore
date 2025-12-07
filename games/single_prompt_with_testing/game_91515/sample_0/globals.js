export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Player Constants
export const MECH_SPEED = 4;
export const CAT_SPEED = 6;
export const MECH_JUMP_FORCE = -14; // Increased from -11 for higher jump
export const CAT_JUMP_FORCE = -12; // Increased from -9 for higher jump
export const MECH_WIDTH = 32;
export const MECH_HEIGHT = 48;
export const CAT_WIDTH = 14;
export const CAT_HEIGHT = 14;

// Game State Container
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    player: null,
    level: null,
    
    // Entity lists
    entities: [],
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    collectibles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // State
    score: 0,
    frameCount: 0,
    
    // Key States (for continuous input)
    keys: {}
};

// Expose globally
window.getGameState = () => gameState;

// Logging Helper
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