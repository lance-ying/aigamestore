export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Initial state factory function to ensure clean resets
export function createInitialState() {
    return {
        gamePhase: GAME_PHASES.START,
        controlMode: "HUMAN",
        
        // Physics & World
        gravity: 0, // Top down, no gravity
        friction: 0.85,
        
        // Time & Wave Management
        frameCount: 0,
        lastFrameTime: 0,
        deltaTime: 0,
        wave: 1,
        maxWaves: 3,
        waveTimer: 0,
        waveDuration: 20, // Seconds for first wave
        spawnTimer: 0,
        spawnRate: 60, // Frames between spawns
        
        // Entities
        player: null,
        entities: [], // Flat list for generic updates if needed
        enemies: [],
        projectiles: [],
        collectibles: [],
        particles: [],
        floatingTexts: [],
        
        // Score & Progress
        score: 0,
        enemiesKilled: 0,
        
        // Camera (Screen shake)
        shakeTimer: 0,
        shakeMagnitude: 0
    };
}

export const gameState = createInitialState();

export function getGameState() {
    return gameState;
}

// Global exposure
window.getGameState = getGameState;