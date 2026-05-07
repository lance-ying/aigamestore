export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    // Core State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    subPhase: "SHOP",   // SHOP, DESCENT, ASCENT, SHOOTING, SUMMARY
    controlMode: "HUMAN",
    
    // Physics & Time
    gravity: 0.15,
    friction: 0.9,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World State
    cameraY: 0,
    depth: 0,
    
    // Player State
    money: 0,
    score: 0,
    hookX: CANVAS_WIDTH / 2,
    hookY: 100, // Relative to camera/screen top in some contexts, or world y
    hookVelocityX: 0,
    hookVelocityY: 2,
    
    // Upgrades
    lineLengthLevel: 1, // Max Depth
    gunLevel: 1,        // Damage/Spread
    lureSpeedLevel: 1,  // Descent Speed
    
    // Entities
    entities: [],
    fish: [],
    caughtFish: [], // Fish on the hook
    airborneFish: [], // Fish in the air (Shooting phase)
    projectiles: [],
    particles: [],
    
    // Inputs
    keys: {}
};

export const CONSTANTS = {
    WATER_LEVEL: 100,
    SKY_HEIGHT: 300, // Area above water
    SHOP_PRICES: {
        LINE: 100,
        GUN: 250,
        LURE: 150
    },
    FISH_TYPES: [
        { name: "Sardine", value: 10, color: [200, 200, 200], radius: 10, speed: 1, depthMin: 0, depthMax: 10000 },
        { name: "Clownfish", value: 30, color: [255, 100, 50], radius: 15, speed: 2, depthMin: 200, depthMax: 10000 },
        { name: "Jellyfish", value: 10, color: [200, 100, 255, 150], radius: 20, speed: 0.5, depthMin: 0, depthMax: 10000 }, // Electrocutes? Just subtracts money for now
        { name: "Shark", value: 100, color: [100, 100, 120], radius: 35, speed: 3, depthMin: 800, depthMax: 10000 },
        { name: "AbyssEater", value: 500, color: [20, 0, 0], radius: 50, speed: 1.5, depthMin: 2000, depthMax: 10000 }
    ]
};

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;