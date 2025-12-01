/**
 * Global constants and state management for Spire Climber.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

export const COLORS = {
    BACKGROUND: [30, 30, 40],
    UI_BG: [20, 20, 30, 200],
    TEXT: [230, 230, 230],
    ACCENT: [100, 200, 255],
    HIGHLIGHT: [255, 215, 0],
    HP_BAR_BG: [50, 0, 0],
    HP_BAR_FILL: [200, 30, 30],
    BLOCK_ICON: [50, 100, 200],
    ENERGY_ICON: [255, 150, 50],
    CARD_BG: [50, 50, 60],
    CARD_ATTACK: [100, 40, 40],
    CARD_SKILL: [40, 40, 100],
    CARD_POWER: [100, 40, 100],
    ENEMY: [200, 50, 50],
    PLAYER: [50, 200, 100]
};

// Initial Game State
export const gameState = {
    gamePhase: "START", // START, MAP, BATTLE, REWARD, CAMPFIRE, GAME_OVER_WIN, GAME_OVER_LOSE, PAUSED
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Player Progression
    player: null, // Will be instance of Player
    deck: [],     // Master deck (array of CardData)
    relics: [],   // Array of Relic objects
    gold: 0,
    floor: 0,
    
    // Map State
    map: null,    // Map structure
    currentNode: null, // Current position
    mapSelectionIndex: 0, // For navigating next nodes
    
    // Combat State
    combat: {
        turn: 0,
        energy: 3,
        maxEnergy: 3,
        hand: [],         // Current cards in hand (Card instances)
        drawPile: [],     // Cards in draw pile
        discardPile: [],  // Cards in discard pile
        exhaustPile: [],  // Cards removed from combat
        enemies: [],      // Array of Enemy instances
        selectedCardIndex: 0, // Index in hand
        targetIndex: 0,   // Index in enemies array (if we had multi-target, simplified to 0 usually)
        message: "",      // "Player Turn", "Enemy Turn"
        phase: "PLAYER_TURN" // PLAYER_TURN, ENEMY_TURN, RESOLVING
    },
    
    // Reward State
    rewards: [],
    rewardSelectionIndex: 0,
    
    // Campfire State
    campfireOptions: [],
    campfireSelectionIndex: 0,

    // Visual Effects
    particles: [],
    animations: []
};

// Logger function
export function log(category, data, p) {
    if (p && p.logs) {
        if (!p.logs[category]) p.logs[category] = [];
        p.logs[category].push({
            data: data,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

// Expose state globally
window.getGameState = () => gameState;