// globals.js
// Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.25;
export const GLIDE_GRAVITY = 0.12; // Gravity when gliding
export const DIVE_GRAVITY = 0.9;   // Gravity when diving
export const FRICTION_AIR = 0.99;
export const FRICTION_GROUND_DIVE = 0.98; // Low friction when sliding downhill
export const FRICTION_GROUND_NORMAL = 0.90; // High friction when dragging uphill

// Game Balance
export const NIGHT_START_SPEED = 2.0;
export const NIGHT_ACCELERATION = 0.0005;
export const SCORE_MULTIPLIER = 0.1;

export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2
    
    // Main entities
    player: null,
    entities: [],
    
    // Terrain management
    terrainOffsetX: 0,      // Should match cameraX generally
    terrainSeed: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraZoom: 1.0,
    
    // Game progress
    score: 0,
    distance: 0,
    dayTime: 0,             // 0 to 1 cycle
    
    // The "Night" chaser
    nightX: -300,
    nightSpeed: NIGHT_START_SPEED,
    
    // Collections
    coins: [],
    particles: [],
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state (for easier access across modules)
    isDiving: false
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging function
export function logGameInfo(p, infoType, data) {
    if (p.logs && p.logs[infoType]) {
        p.logs[infoType].push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}