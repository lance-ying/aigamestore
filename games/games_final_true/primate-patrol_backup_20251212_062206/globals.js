// Game Configuration and Global State
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PATH_WIDTH = 40;

// Map Definitions
export const MAPS = {
    EASY: {
        name: "Meadows",
        bgColor: [34, 139, 34], // Forest Green
        pathColor: [169, 169, 169], // Grey
        path: [
            { x: 0, y: 100 },
            { x: 150, y: 100 },
            { x: 150, y: 300 },
            { x: 350, y: 300 },
            { x: 350, y: 50 },
            { x: 500, y: 50 },
            { x: 500, y: 250 },
            { x: 600, y: 250 }
        ]
    },
    MEDIUM: {
        name: "Desert",
        bgColor: [210, 180, 140], // Sand
        pathColor: [139, 69, 19], // Brown
        path: [
            { x: 0, y: 200 },
            { x: 100, y: 200 },
            { x: 100, y: 50 },
            { x: 500, y: 50 },
            { x: 500, y: 350 },
            { x: 100, y: 350 },
            { x: 100, y: 250 },
            { x: 600, y: 250 }
        ]
    },
    HARD: {
        name: "Volcano",
        bgColor: [40, 40, 40], // Dark Grey
        pathColor: [200, 50, 0], // Lava Red
        path: [
            { x: 0, y: 50 },
            { x: 550, y: 50 },
            { x: 50, y: 350 },
            { x: 600, y: 350 }
        ]
    }
};

// Tower Definitions
export const TOWER_TYPES = {
    DART: {
        name: "Dart Monkey",
        cost: 200,
        range: 120,
        cooldown: 40,
        damage: 1,
        projectileSpeed: 8,
        projectileType: "DART",
        color: [160, 82, 45], // Brown
        upgradeCost: 150
    },
    TACK: {
        name: "Tack Shooter",
        cost: 350,
        range: 70,
        cooldown: 50,
        damage: 1,
        projectileSpeed: 6,
        projectileType: "TACK_8", // Special type for 8-way shot
        color: [255, 105, 180], // Pink
        upgradeCost: 250
    },
    SNIPER: {
        name: "Sniper Monkey",
        cost: 600,
        range: 1000, // Global
        cooldown: 120,
        damage: 2,
        projectileSpeed: 20, // Instant visual
        projectileType: "INSTANT",
        color: [100, 100, 100], // Grey
        upgradeCost: 400
    }
};

// Bloon Definitions (Layers)
export const BLOON_TYPES = {
    RED: { health: 1, speed: 1.5, color: [255, 0, 0], radius: 10, value: 1, child: null },
    BLUE: { health: 1, speed: 2.0, color: [0, 0, 255], radius: 12, value: 2, child: "RED" },
    GREEN: { health: 1, speed: 2.5, color: [0, 255, 0], radius: 14, value: 3, child: "BLUE" },
    YELLOW: { health: 1, speed: 3.5, color: [255, 255, 0], radius: 16, value: 4, child: "GREEN" }
};

// Wave Definitions
export const WAVES = [
    // Wave 1: Just Reds
    [
        { type: "RED", delay: 0 }, { type: "RED", delay: 60 }, { type: "RED", delay: 60 },
        { type: "RED", delay: 60 }, { type: "RED", delay: 60 }
    ],
    // Wave 2: Reds and Blues
    [
        { type: "RED", delay: 0 }, { type: "RED", delay: 40 }, { type: "BLUE", delay: 60 },
        { type: "BLUE", delay: 60 }, { type: "RED", delay: 40 }, { type: "BLUE", delay: 40 }
    ],
    // Wave 3: Faster mix
    [
        { type: "GREEN", delay: 0 }, { type: "BLUE", delay: 50 }, { type: "GREEN", delay: 50 },
        { type: "BLUE", delay: 30 }, { type: "BLUE", delay: 30 }, { type: "RED", delay: 20 }
    ],
    // Wave 4: Yellow rush
    [
        { type: "YELLOW", delay: 0 }, { type: "YELLOW", delay: 80 }, { type: "GREEN", delay: 40 },
        { type: "GREEN", delay: 40 }, { type: "YELLOW", delay: 40 }
    ],
    // Wave 5: Final Rush
    [
        { type: "YELLOW", delay: 0 }, { type: "YELLOW", delay: 30 }, { type: "YELLOW", delay: 30 },
        { type: "GREEN", delay: 30 }, { type: "GREEN", delay: 30 }, { type: "BLUE", delay: 20 },
        { type: "BLUE", delay: 20 }, { type: "RED", delay: 10 }, { type: "RED", delay: 10 }
    ]
];

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    mapDifficulty: "EASY", // EASY, MEDIUM, HARD
    levelPath: [], // Populated on reset based on mapDifficulty
    
    // Economy and Stats
    money: 450,
    lives: 20,
    currentWave: 0,
    score: 0,
    
    // Wave Management
    waveActive: false,
    waveFrame: 0,
    enemiesSpawnedInWave: 0,
    waveComplete: false,
    
    // Entities
    towers: [],
    enemies: [], // Bloons
    projectiles: [],
    particles: [],
    
    // Interaction
    cursor: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, width: 20, height: 20 },
    selectedTowerType: "DART", // Key from TOWER_TYPES
    selectedTower: null, // Reference to placed tower instance
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;