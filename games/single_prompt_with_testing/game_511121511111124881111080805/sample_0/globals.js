// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Movement constants
export const WALK_SPEED = 2.5;
export const SPRINT_SPEED = 4.5;
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_RATE = 1.5;
export const STAMINA_REGEN_RATE = 0.8;

// Villager constants
export const VILLAGER_PATROL_SPEED = 1.0;
export const VILLAGER_CHASE_SPEED = 2.8;
export const VILLAGER_DETECTION_RANGE = 80;
export const VILLAGER_CHASE_RANGE = 150;
export const VILLAGER_CATCH_RANGE = 25;

// Game state object
export const gameState = {
    // Core state
    gamePhase: PHASE_START,
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Entities
    player: null,
    entities: [],
    villagers: [],
    items: [],
    obstacles: [],
    tasks: [],
    
    // Game data
    score: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 1200,
    worldHeight: 800,
    
    // Input state
    keys: {},
    
    // Particles and effects
    particles: [],
    honkEffects: [],
    
    // Timers
    lastHonkTime: 0,
    honkCooldown: 500, // milliseconds
};

// Expose globally
export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;

// Item types
export const ITEM_TYPES = {
    HAT: 'hat',
    BELL: 'bell',
    RADIO: 'radio',
    BASKET: 'basket',
    RAKE: 'rake',
    KEYS: 'keys',
    GLASSES: 'glasses',
    THERMOS: 'thermos'
};

// Task definitions
export const TASK_DEFINITIONS = [
    {
        id: 1,
        description: "Steal the gardener's hat",
        itemType: ITEM_TYPES.HAT,
        targetX: 150,
        targetY: 300,
        completed: false
    },
    {
        id: 2,
        description: "Get the bell into the pond",
        itemType: ITEM_TYPES.BELL,
        targetX: 300,
        targetY: 250,
        completed: false
    },
    {
        id: 3,
        description: "Make the shopkeeper fall",
        itemType: ITEM_TYPES.RAKE,
        targetX: 700,
        targetY: 200,
        completed: false
    },
    {
        id: 4,
        description: "Steal the boy's glasses",
        itemType: ITEM_TYPES.GLASSES,
        targetX: 900,
        targetY: 400,
        completed: false
    },
    {
        id: 5,
        description: "Get the radio to the village green",
        itemType: ITEM_TYPES.RADIO,
        targetX: 550,
        targetY: 600,
        completed: false
    }
];

// Zone definitions for village areas
export const ZONES = {
    GARDEN: { x: 0, y: 0, width: 400, height: 400, name: "Garden" },
    SHOPS: { x: 400, y: 0, width: 400, height: 400, name: "Shops" },
    VILLAGE_GREEN: { x: 400, y: 400, width: 400, height: 400, name: "Village Green" },
    POND: { x: 0, y: 400, width: 400, height: 400, name: "Pond" }
};

// Color palette
export const COLORS = {
    // Environment
    GRASS: [80, 150, 60],
    GRASS_DARK: [60, 120, 45],
    WATER: [100, 150, 200],
    PATH: [180, 160, 140],
    FENCE: [120, 80, 40],
    BUILDING: [200, 180, 160],
    BUILDING_ROOF: [180, 80, 60],
    
    // Goose
    GOOSE_WHITE: [245, 245, 245],
    GOOSE_BEAK: [255, 150, 50],
    GOOSE_EYE: [20, 20, 20],
    
    // Villager
    VILLAGER_SKIN: [255, 220, 180],
    VILLAGER_HAIR: [100, 70, 50],
    VILLAGER_CLOTHES_1: [80, 100, 180],
    VILLAGER_CLOTHES_2: [180, 80, 80],
    VILLAGER_CLOTHES_3: [100, 180, 100],
    
    // Items
    ITEM_HAT: [150, 100, 50],
    ITEM_METAL: [180, 180, 180],
    ITEM_WOOD: [160, 110, 70],
    
    // UI
    UI_BG: [240, 235, 220],
    UI_TEXT: [40, 40, 40],
    UI_ACCENT: [200, 100, 60],
    UI_COMPLETE: [80, 180, 80]
};