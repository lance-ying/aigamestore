import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = -0.015;
export const TERMINAL_VELOCITY = -0.5;

// Teams
export const TEAMS = {
    NONE: 0,
    RED: 1,  // Player Team
    BLUE: 2  // Enemy Team
};

export const COLORS = {
    RED: 0xB8383B,
    BLUE: 0x5885A2,
    RED_DARK: 0x802020,
    BLUE_DARK: 0x305070,
    GROUND: 0xE6CFA1, // Dustbowl sand
    WALL: 0xA68B6A,
    CRATE: 0x8B5A2B,
    METAL: 0x666666,
    HEALTH: 0x44FF44,
    HUD_BG: 'rgba(0, 0, 0, 0.6)'
};

// Global Game State
export const gameState = {
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Game Flow
    gamePhase: "START", // START, CLASS_SELECT, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    deltaTime: 0,
    
    // Level
    walls: [],
    ground: null,
    controlPoint: null,
    spawnPoints: {
        [TEAMS.RED]: new THREE.Vector3(0, 2, 25),
        [TEAMS.BLUE]: new THREE.Vector3(0, 2, -25)
    },
    
    // Entities
    player: null,
    entities: [],     // All dynamic entities (bots, pickups)
    projectiles: [],
    particles: [],
    
    // Logic
    score: 0,
    selectedClass: 'SOLDIER', // Default
    captureProgress: 0, // -100 (Blue) to 100 (Red)
    captureRate: 0.2,
    matchTime: 180, // Seconds
    matchTimer: 0,
    
    // Lighting
    lights: []
};

// Initialize logs structure
if (!window.logs) {
    window.logs = {
        game_info: [],
        player_info: [],
        inputs: []
    };
}

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logger
export function logGameInfo(info) {
    window.logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}