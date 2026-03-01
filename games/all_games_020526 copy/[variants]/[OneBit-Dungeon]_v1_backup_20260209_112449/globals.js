export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 24;
export const GRID_W = Math.floor(CANVAS_WIDTH / TILE_SIZE);
export const GRID_H = Math.floor(CANVAS_HEIGHT / TILE_SIZE);

export const COLORS = {
    BACKGROUND: '#121212',
    WALL: '#4A4A4A',
    WALL_TOP: '#6E6E6E',
    FLOOR: '#222222',
    FLOOR_VISIBLE: '#2A2A2A',
    UI_BG: 'rgba(0, 0, 0, 0.8)',
    TEXT: '#FFFFFF',
    ACCENT: '#FFD700', // Gold
    PLAYER: '#FFFFFF',
    ENEMY_SLIME: '#00FF00',
    ENEMY_GOBLIN: '#FF5555',
    ENEMY_SKELETON: '#EEEEEE',
    STAIRS: '#00FFFF',
    POTION: '#FF00FF',
    GOLD: '#FFD700'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Auto-restart timer
    autoRestartTimer: null,
    
    // Game Specific
    level: 1,
    score: 0,
    turn: 0,
    
    // Dungeon
    map: [], // 2D array of tiles
    rooms: [],
    
    // Entities
    player: null,
    entities: [], // All entities (enemies, items)
    particles: [],
    floatingTexts: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    shake: 0,
    
    // Class Selection
    selectedClassIndex: 0,
    availableClasses: [
        { name: "WARRIOR", hp: 100, atk: 15, def: 2, desc: "High Health & Defense" },
        { name: "ROGUE",   hp: 70,  atk: 25, def: 0, desc: "High Damage, Low HP" },
        { name: "TANK",    hp: 150, atk: 10, def: 5, desc: "Very High Survivability" }
    ]
};

// Logging function helper
export function logGameInfo(p, info) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: info,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;