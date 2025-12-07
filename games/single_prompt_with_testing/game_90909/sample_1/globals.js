export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 400;

export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.8;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = -11;
export const DOUBLE_JUMP_FORCE = -10;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    player: null,
    entities: [],
    particles: [],
    camera: { x: 0, y: 0 },
    
    score: 0,
    levelData: null,
    
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    keys: {}
};

// Global accessor as required
window.getGameState = () => gameState;