export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const RANK_VALUE = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};
export const SORT_ORDER = {
    '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
    'J': 9, 'Q': 10, 'K': 11, 'A': 12
};

export const HAND_TYPES = {
    HIGH_CARD: { name: "High Card", chips: 5, mult: 1 },
    PAIR: { name: "Pair", chips: 10, mult: 2 },
    TWO_PAIR: { name: "Two Pair", chips: 20, mult: 2 },
    THREE_OF_A_KIND: { name: "Three of a Kind", chips: 30, mult: 3 },
    STRAIGHT: { name: "Straight", chips: 30, mult: 4 },
    FLUSH: { name: "Flush", chips: 35, mult: 4 },
    FULL_HOUSE: { name: "Full House", chips: 40, mult: 4 },
    FOUR_OF_A_KIND: { name: "Four of a Kind", chips: 60, mult: 7 },
    STRAIGHT_FLUSH: { name: "Straight Flush", chips: 100, mult: 8 },
    ROYAL_FLUSH: { name: "Royal Flush", chips: 100, mult: 8 }
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    roundPhase: "BLIND", // BLIND, SHOP
    
    // Run State
    ante: 1,
    round: 1, // 1=Small, 2=Big, 3=Boss
    money: 0,
    
    // Round State
    currentBlind: 300,
    currentScore: 0,
    handsLeft: 4,
    discardsLeft: 3,
    targetScore: 300,
    
    // Entities
    deck: [],
    hand: [],
    jokers: [],
    shopItems: [],
    
    // UI State
    selectedIndex: 0, // Card index in hand or item in shop
    message: "",
    messageTimer: 0,
    
    // Visuals
    particles: [],
    cameraShake: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;