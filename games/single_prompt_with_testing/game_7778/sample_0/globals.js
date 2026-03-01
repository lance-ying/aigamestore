import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;
export const GRAVITY = -0.05;
export const JUMP_FORCE = 0.8;
export const LANE_WIDTH = 3.0;
export const GAME_SPEED_START = 0.7;
export const GAME_SPEED_MAX = 1.8;
export const CHUNK_LENGTH = 20;
export const VISIBLE_CHUNKS = 10;
export const RENDER_DISTANCE = CHUNK_LENGTH * VISIBLE_CHUNKS;

// Game State Object
export const gameState = {
    // Core Status
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Game Objects
    player: null,
    entities: [], // Enemies, Collectibles
    worldChunks: [], // Ground segments
    
    // Systems
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,

    // Progression
    score: 0,
    distance: 0,
    gameSpeed: GAME_SPEED_START,
    difficultyMultiplier: 1.0,
    
    // Input State (Global Access for Test Agents)
    input: {
        left: false,
        right: false,
        up: false,
        down: false,
        attack: false,
        pause: false,
        start: false,
        restart: false
    }
};

// Global Logs
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose globally
window.gameState = gameState;
window.logs = logs;
window.getGameState = () => gameState;

// Initialization Helper
export function resetGameState() {
    gameState.score = 0;
    gameState.distance = 0;
    gameState.gameSpeed = GAME_SPEED_START;
    gameState.entities = [];
    gameState.worldChunks = [];
    gameState.frameCount = 0;
    
    // Clear logs for new session if desired, or keep history
    // Keeping history is safer for analysis
}