export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const PALETTE = {
    BG: '#111111',          // Dark background
    FG: '#FFFFFF',          // Player, Platforms, UI
    ACCENT: '#FF0044',      // Enemies, Gems, Danger
    SECONDARY: '#00AAAA',   // Background details, special items
    SHADOW: '#222222'       // Depth cues
};

export const PALETTE_THEMES = [
    { // Level 1: Caverns
        BG: '#111111', FG: '#FFFFFF', ACCENT: '#FF0044', SECONDARY: '#00AAAA', SHADOW: '#222222'
    },
    { // Level 2: Catacombs (Ice/Blue)
        BG: '#051015', FG: '#E0F0FF', ACCENT: '#00FFFF', SECONDARY: '#0077AA', SHADOW: '#002233'
    },
    { // Level 3: Core (Magma)
        BG: '#150505', FG: '#FFEEEE', ACCENT: '#FFAA00', SECONDARY: '#FF4400', SHADOW: '#331100'
    }
];

// Game Constants
export const INVULNERABILITY_FRAMES = 60; // Number of frames player is invincible after taking damage (1 second at 60 FPS)

export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN (all test modes removed)
    
    currentLevel: 0,        // Current stage index
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    gems: [],
    powerups: [],
    
    // World
    cameraY: 0,
    worldDepth: 6000,       // Depth of a single level (Increased from 2000)
    wellWidth: 400,         // Width of the playable area (centered)
    
    // Stats
    score: 0,
    combo: 0,
    comboTimer: 0,
    
    // Physics
    gravity: 0.45,          // Reduced gravity for floatier feel
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
    gameState.currentLevel = 0;
    gameState.worldDepth = 6000; // Reset to full depth
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.gems = [];
    gameState.powerups = [];
    gameState.cameraY = 0;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.comboTimer = 0;
    gameState.player = null; // Will be re-initialized
    
    // Reset palette to default
    Object.assign(PALETTE, PALETTE_THEMES[0]);
}