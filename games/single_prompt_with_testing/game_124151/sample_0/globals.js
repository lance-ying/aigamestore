/**
 * global.js
 * Contains global constants, configuration, and the shared game state.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 800;

// Game Settings
export const TARGET_FPS = 60;
export const GRAVITY = 0; // Top-down game, no gravity
export const FRICTION = 0.85; // Movement friction
export const TILE_SIZE = 40;

// Colors
export const COLORS = {
    background: '#2d3e50', // Dark blue-ish base
    grass: '#3e8948',
    grassLight: '#63c74d',
    dirt: '#8f563b',
    ui: {
        hp: '#e43b44',
        mp: '#0099db',
        xp: '#fbb954',
        text: '#ffffff',
        border: '#1a1c2c',
        bg: '#292b3d'
    },
    player: {
        skin: '#f2d3ab',
        hair: '#feae34',
        armor: '#c0cbdc',
        cloth: '#e43b44'
    },
    enemies: {
        slime: '#63c74d',
        wolf: '#8f563b',
        boss: '#990033'
    }
};

// Global Game State
export const gameState = {
    // Phases: START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    gamePhase: "START",
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World
    camera: { x: 0, y: 0 },
    bounds: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    
    // Entities
    player: null,
    entities: [],      // All active entities (enemies, items)
    particles: [],     // Visual effects
    floatingTexts: [], // Damage numbers
    
    // Game Progression
    score: 0,
    enemiesDefeated: 0,
    bossSpawned: false,
    level: 1,
    
    // System
    debugMode: false
};

// Expose gameState globally as required
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset function to clear state for restart
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.camera = { x: 0, y: 0 };
    gameState.player = null;
    gameState.entities = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.score = 0;
    gameState.enemiesDefeated = 0;
    gameState.bossSpawned = false;
    gameState.level = 1;
}