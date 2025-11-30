export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    subPhase: "BUILD",  // BUILD, SIMULATE
    controlMode: "HUMAN",
    
    // Level Data
    budget: 12000,
    currentCost: 0,
    
    // Entities
    entities: [],
    nodes: [],
    constraints: [],
    cars: [],
    
    // Editor State
    cursorX: 100,
    cursorY: 300,
    cursorSnap: 20,
    selectedNode: null,
    hoveredNode: null,
    selectedMaterial: "ROAD", // ROAD, WOOD, STEEL, SPRING
    
    // Physics State
    gravity: 0.2,
    friction: 0.98,
    groundFriction: 0.8,
    simFrame: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Logs
    logs: null
};

export const MATERIALS = {
    ROAD: { cost: 200, strength: 100, weight: 1.0, color: [50, 50, 50], maxLen: 200 },
    WOOD: { cost: 100, strength: 60, weight: 0.5, color: [160, 82, 45], maxLen: 120 },
    STEEL: { cost: 400, strength: 200, weight: 2.0, color: [192, 192, 192], maxLen: 180 },
    SPRING: { cost: 300, strength: 80, weight: 0.5, color: [255, 100, 100], maxLen: 100, stiffness: 0.05 }
};

export const LEVEL_CONFIG = {
    groundLevel: 350,
    gapStart: 100,
    gapEnd: 500,
    anchorPoints: [
        {x: 100, y: 300},
        {x: 100, y: 200}, // Higher anchor for support
        {x: 500, y: 300},
        {x: 500, y: 200}
    ],
    winX: 550
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;