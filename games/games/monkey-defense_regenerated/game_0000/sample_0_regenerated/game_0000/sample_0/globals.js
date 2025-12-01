/**
 * Global constants and state management
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Path for the Bloons
export const PATH_POINTS = [
    { x: 0, y: 100 },
    { x: 150, y: 100 },
    { x: 150, y: 300 },
    { x: 300, y: 300 },
    { x: 300, y: 100 },
    { x: 450, y: 100 },
    { x: 450, y: 300 },
    { x: 600, y: 300 } // Exit
];

// Bloon Definitions
export const BLOON_TYPES = {
    RED: { color: '#ff0000', speed: 1.5, health: 1, value: 1, child: null, radius: 10 },
    BLUE: { color: '#0000ff', speed: 1.8, health: 1, value: 2, child: 'RED', radius: 11 },
    GREEN: { color: '#008000', speed: 2.2, health: 1, value: 3, child: 'BLUE', radius: 12 },
    YELLOW: { color: '#ffff00', speed: 3.0, health: 1, value: 4, child: 'GREEN', radius: 13 }
};

// Tower Definitions
export const TOWER_TYPES = [
    {
        name: "DART MONKEY",
        id: "DART",
        cost: 200,
        range: 100,
        damage: 1,
        fireRate: 40, // Frames between shots
        color: [139, 69, 19], // Brown
        upgradeCost: 150,
        description: "Cheap, reliable."
    },
    {
        name: "TACK SHOOTER",
        id: "TACK",
        cost: 400,
        range: 70,
        damage: 1,
        fireRate: 50,
        color: [255, 105, 180], // Pink
        upgradeCost: 300,
        description: "Shoots 8 directions."
    },
    {
        name: "SNIPER MONKEY",
        id: "SNIPER",
        cost: 750,
        range: 1000, // Infinite effectively
        damage: 2,
        fireRate: 90,
        color: [50, 205, 50], // Lime Green
        upgradeCost: 500,
        description: "Infinite range, slow."
    }
];

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Player State
    lives: 100,
    money: 650,
    score: 0,
    wave: 1,
    
    // Entities
    towers: [],
    bloons: [],
    projectiles: [],
    particles: [],
    
    // Input/Cursor
    cursor: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        speed: 5,
        selectedTowerIndex: 0,
        radius: 10
    },
    
    // Wave Management
    waveState: {
        active: false,
        bloonsToSpawn: [], // Queue of {type, delay}
        spawnTimer: 0,
        waveCompleteTimer: 0,
        totalWaves: 10
    },
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.lives = 100;
    gameState.money = 650;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.towers = [];
    gameState.bloons = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.cursor.x = CANVAS_WIDTH / 2;
    gameState.cursor.y = CANVAS_HEIGHT / 2;
    gameState.waveState.active = false;
    gameState.waveState.bloonsToSpawn = [];
    gameState.waveState.spawnTimer = 0;
}