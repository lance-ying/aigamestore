export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const PALETTE = {
    BG: '#111111',          // Dark background
    FG: '#FFFFFF',          // Player, Platforms, UI
    ACCENT: '#FF0044',      // Enemies, Gems, Danger
    SECONDARY: '#00AAAA',   // Background details, special items
    SHADOW: '#222222'       // Depth cues
};

export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2, etc.
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    gems: [],
    
    // World
    cameraY: 0,
    worldDepth: 6000,       // Total depth of the well
    wellWidth: 400,         // Width of the playable area (centered)
    
    // Stats
    score: 0,
    combo: 0,
    comboTimer: 0,
    
    // Physics
    gravity: 0.6,
    friction: 0.85,
    airResistance: 0.95,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// Expose getGameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.gems = [];
    gameState.cameraY = 0;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.comboTimer = 0;
    gameState.player = null; // Will be re-initialized
}