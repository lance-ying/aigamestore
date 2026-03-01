import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, etc.
    
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Time
    deltaTime: 0,
    frameCount: 0,
    lastFrameTime: 0,
    
    // Entities
    player: null,
    entities: [],     // All generic entities
    enemies: [],      // Specific lists for easy access
    projectiles: [],
    particles: [],    // Blood, explosions
    platforms: [],    // Static collision geometry
    
    // Physics
    gravity: new THREE.Vector3(0, -35.0, 0), // Strong gravity for snappy FPS feel
    
    // Game Logic
    score: 0,
    styleRank: 0, // 0-100 float
    styleGrade: "D", // D, C, B, A, S, SS, ULTRAKILL
    wave: 1,
    
    // Inputs
    keys: {}
};

export const COLORS = {
    sky: 0x101010,
    ground: 0x202020,
    player: 0x00ff00,
    enemy_filth: 0xaa4400, // Basic melee enemy
    enemy_stray: 0xaa0000, // Ranged enemy
    blood: 0xff0000,
    bullet: 0xffff00,
    beam: 0x00ffff,
    health: 0x00ff00,
    style: 0xffcc00
};

export const CONSTANTS = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    PLAYER_SPEED: 12.0,
    PLAYER_DASH_SPEED: 40.0,
    PLAYER_JUMP_FORCE: 15.0,
    GRAVITY: 40.0,
    SENSITIVITY: 2.5, // Keyboard look sensitivity
    BLOOD_HEAL_RADIUS: 4.0,
    BLOOD_HEAL_AMOUNT: 5
};

// Initial Logging
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;