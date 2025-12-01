export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_OPTS = {
    gravity: 0.8,
    scrollSpeed: 5,
    feverSpeed: 8,
    groundHeight: 50,
    eggSize: 30,
    playerSize: 30,
    spawnX: 150, // Fixed X position of the player
    feverDuration: 300, // Frames (5 seconds)
    landingTarget: 3, // Landings needed for fever
    levelLength: 10000 // Distance to win
};

export const COLORS = {
    bg: [135, 206, 235], // Sky blue
    ground: [34, 139, 34], // Forest green
    groundDetail: [0, 100, 0],
    player: [255, 215, 0], // Gold
    playerFace: [0, 0, 0],
    egg: [255, 255, 255],
    eggBorder: [200, 200, 200],
    obstacle: [70, 70, 70],
    obstacleBorder: [0, 0, 0],
    feverBg: [255, 105, 180], // Hot pink
    feverParticle: [255, 255, 0]
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Entity lists
    player: null,
    obstacles: [],
    particles: [],
    projectiles: [],
    
    // Game progress
    distance: 0,
    score: 0,
    highScore: 0,
    
    // Fever mechanics
    feverMode: false,
    feverTimer: 0,
    landings: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state
    keys: {}
};

export function getGameState() {
    return gameState;
}
// Expose globally
window.getGameState = getGameState;