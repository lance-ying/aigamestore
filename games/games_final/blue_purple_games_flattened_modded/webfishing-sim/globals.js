import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    
    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    ambientLight: null,
    directionalLight: null,
    
    // Physics & Time
    gravity: new THREE.Vector3(0, -0.015, 0),
    frameCount: 0,
    deltaTime: 0,
    time: 0,
    
    // Entities & World
    player: null,
    entities: [],
    npcs: [],
    particles: [],
    
    // Game Specific
    fishingSystem: null,
    inventory: [], // Caught fish
    money: 0,
    score: 0,
    goalFishCount: 10, // Catch 10 fish to win for this demo
    
    // Chat
    chatLog: [], // { sender: string, message: string, time: number }
};

// Log initialization
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose gameState globally
window.getGameState = () => gameState;

// Constants
export const COLORS = {
    SKY: 0x87CEEB,
    WATER: 0x4fa4b8,
    GRASS: 0x7cfc00,
    DIRT: 0x8B4513,
    PLAYER: 0xFFFFFF,
    UI_BG: 'rgba(0, 0, 0, 0.7)',
    UI_TEXT: '#FFFFFF'
};

export const FISH_TYPES = [
    { name: "Goldfish", value: 10, rarity: 1, difficulty: 0.5, color: 0xFFD700 },
    { name: "Bass", value: 20, rarity: 2, difficulty: 0.8, color: 0x556B2F },
    { name: "Trout", value: 30, rarity: 3, difficulty: 1.0, color: 0x8FBC8F },
    { name: "Salmon", value: 50, rarity: 4, difficulty: 1.2, color: 0xFA8072 },
    { name: "Bluegill", value: 15, rarity: 1, difficulty: 0.6, color: 0x4682B4 },
    { name: "Catfish", value: 40, rarity: 3, difficulty: 1.1, color: 0x708090 },
    { name: "Glitch Fish", value: 999, rarity: 10, difficulty: 2.0, color: 0xFF00FF }
];

export function logGameInfo(info) {
    window.logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}