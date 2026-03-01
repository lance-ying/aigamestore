import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", 
    
    // Core Three.js components
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    elapsedTime: 0,
    
    // Game Entities
    player: null,
    opponents: [],
    itemBoxes: [],
    projectiles: [],
    coins: [], // Active coins
    track: null,
    
    // State
    lapsTotal: 3,
    debugMode: false,
    
    // Lighting
    lights: [],
    
    // Input State
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        w: false,
        a: false,
        s: false,
        d: false,
        " ": false,
        Shift: false
    }
};

// Expose gameState globally
window.getGameState = () => gameState;