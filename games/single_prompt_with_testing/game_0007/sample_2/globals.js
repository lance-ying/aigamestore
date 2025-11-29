export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 350;

export const gameState = {
    player: null,
    boss: null,
    entities: [],
    projectiles: [],
    particles: [],
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_COMPLETE
    controlMode: "HUMAN",
    
    score: 0,
    currentLevel: 1,
    maxLevel: 9,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Physics constants
    gravity: 0.8,
    friction: 0.85,
    groundFriction: 0.8,
    airResistance: 0.98,
    
    // Visual FX state
    screenShake: 0,
    filmGrainOffset: 0
};

// Level configurations
export const LEVEL_CONFIG = {
    1: { health: 60, attackSpeed: 150, projectileSpeed: 5, phase2Health: 40, phase3Health: 20, allowedAttacks: ['SPIT'], difficulty: 'EASY' },
    2: { health: 80, attackSpeed: 130, projectileSpeed: 5.5, phase2Health: 50, phase3Health: 25, allowedAttacks: ['SPIT', 'SLAM'], difficulty: 'EASY' },
    3: { health: 100, attackSpeed: 120, projectileSpeed: 6, phase2Health: 60, phase3Health: 30, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'EASY' },
    4: { health: 120, attackSpeed: 100, projectileSpeed: 6.5, phase2Health: 70, phase3Health: 35, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'MEDIUM' },
    5: { health: 140, attackSpeed: 90, projectileSpeed: 7, phase2Health: 80, phase3Health: 40, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'MEDIUM' },
    6: { health: 160, attackSpeed: 80, projectileSpeed: 7.5, phase2Health: 90, phase3Health: 50, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'MEDIUM' },
    7: { health: 180, attackSpeed: 70, projectileSpeed: 8, phase2Health: 100, phase3Health: 60, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'HARD' },
    8: { health: 200, attackSpeed: 60, projectileSpeed: 8.5, phase2Health: 110, phase3Health: 70, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'HARD' },
    9: { health: 250, attackSpeed: 50, projectileSpeed: 9, phase2Health: 140, phase3Health: 80, allowedAttacks: ['SPIT', 'SLAM', 'ROOTS'], difficulty: 'HARD' }
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export const COLORS = {
    BACKGROUND: [230, 220, 190], // Vintage paper
    PLAYER: {
        HEAD: [240, 240, 240], // White cup
        LIQUID: [255, 255, 255], // Milk?
        STRAW: [200, 40, 40], // Red
        SHOES: [130, 70, 30], // Brown
        SHORTS: [200, 40, 40] // Red
    },
    BOSS: {
        SKIN: [180, 60, 60], // Radish Red
        LEAVES: [60, 140, 60], // Green
        DIRT: [100, 80, 50] // Brown
    },
    PROJECTILE_PLAYER: [50, 150, 255], // Blue energy
    PROJECTILE_BOSS: [200, 100, 100], // Red energy
    TEXT: [30, 30, 30] // Dark ink
};