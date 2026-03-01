/**
 * Global constants and game state management.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game Geometry Constants
export const OCTAGON_SIDES = 8;
export const SEGMENT_DEPTH = 100; // Distance between slices
export const VIEW_DISTANCE = 1000; // How far we render
export const INITIAL_SPEED = 8;
export const MAX_SPEED = 20;
export const ROTATION_SPEED = 0.1; // Radians per frame
export const TUNNEL_RADIUS = 250; // Visual radius of the tunnel

// Colors
export const COLORS = {
    BACKGROUND: [10, 10, 15],
    TUNNEL_LINES: [0, 255, 255, 100],
    // Increased brightness for tunnel fill to make gaps (showing dark BG) more visible
    TUNNEL_FILL_1: [40, 50, 70], 
    TUNNEL_FILL_2: [30, 40, 60],
    PLAYER: [255, 50, 50],
    PLAYER_SHIELD: [50, 255, 50, 100],
    OBSTACLE: [255, 150, 0],
    COIN: [255, 215, 0], // Gold
    GAP: [0, 0, 0], // Holes
    TEXT: [255, 255, 255],
    HUD_BG: [0, 0, 0, 150]
};

// Game State Object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Game Entities
    player: null,
    tunnelSegments: [],
    particles: [],
    
    // Gameplay Variables
    score: 0,
    lives: 5,
    currentSpeed: INITIAL_SPEED,
    tunnelRotation: 0, // Current rotation of the world in radians
    targetRotation: 0, // Target rotation for smooth transitions
    difficultyLevel: 1,
    
    // Input State
    keys: {},
    
    // Camera/Visuals
    cameraShake: 0
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging Utility (Write-only as per constraints)
export function logGameEvent(p, type, data) {
    // p.logs was removed from game.js as it was a testing artifact.
    // This function now effectively does nothing, but is kept to avoid breaking existing calls.
    // If future logging is needed, p.logs (or a similar structure) would need to be re-introduced
    // in gameState or another appropriate global context.
    if (!p.logs) return; 
    
    const entry = {
        type: type,
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    };
    
    if (type === 'input') p.logs.inputs.push(entry);
    else if (type === 'player') p.logs.player_info.push(entry);
    else p.logs.game_info.push(entry);
}