/**
 * Database of all cards in the game.
 */

export const CARD_TYPES = {
    ATTACK: 'ATTACK',
    SKILL: 'SKILL',
    POWER: 'POWER'
};

export const TARGET_TYPES = {
    ENEMY: 'ENEMY',
    SELF: 'SELF',
    ALL_ENEMIES: 'ALL_ENEMIES'
};

export const CARD_DATABASE = {
    "strike": {
        id: "strike",
        name: "Strike",
        type: CARD_TYPES.ATTACK,
        cost: 1,
        damage: 6,
        description: "Deal 6 damage.",
        target: TARGET_TYPES.ENEMY
    },
    "defend": {
        id: "defend",
        name: "Defend",
        type: CARD_TYPES.SKILL,
        cost: 1,
        block: 5,
        description: "Gain 5 Block.",
        target: TARGET_TYPES.SELF
    },
    "bash": {
        id: "bash",
        name: "Bash",
        type: CARD_TYPES.ATTACK,
        cost: 2,
        damage: 8,
        vulnerable: 2,
        description: "Deal 8 dmg. Apply 2 Vulnerable.",
        target: TARGET_TYPES.ENEMY
    },
    "anger": {
        id: "anger",
        name: "Anger",
        type: CARD_TYPES.ATTACK,
        cost: 0,
        damage: 6,
        description: "Deal 6 damage. Add a copy of this card to your discard pile.",
        special: "copy_self",
        target: TARGET_TYPES.ENEMY
    },
    "cleave": {
        id: "cleave",
        name: "Cleave",
        type: CARD_TYPES.ATTACK,
        cost: 1,
        damage: 8,
        description: "Deal 8 damage to ALL enemies.",
        target: TARGET_TYPES.ALL_ENEMIES
    },
    "iron_wave": {
        id: "iron_wave",
        name: "Iron Wave",
        type: CARD_TYPES.ATTACK,
        cost: 1,
        damage: 5,
        block: 5,
        description: "Gain 5 Block. Deal 5 damage.",
        target: TARGET_TYPES.ENEMY
    },
    "shrug": {
        id: "shrug",
        name: "Shrug It Off",
        type: CARD_TYPES.SKILL,
        cost: 1,
        block: 8,
        draw: 1,
        description: "Gain 8 Block. Draw 1 card.",
        target: TARGET_TYPES.SELF
    },
    "perfect_strike": {
        id: "perfect_strike",
        name: "Perfect Strike",
        type: CARD_TYPES.ATTACK,
        cost: 2,
        damage: 15, // Simplified: flat high damage
        description: "Deal 15 damage.",
        target: TARGET_TYPES.ENEMY
    },
    "pommel": {
        id: "pommel",
        name: "Pommel Strike",
        type: CARD_TYPES.ATTACK,
        cost: 1,
        damage: 9,
        draw: 1,
        description: "Deal 9 damage. Draw 1 card.",
        target: TARGET_TYPES.ENEMY
    }
};

export const STARTING_DECK = ["strike", "strike", "strike", "strike", "strike", "defend", "defend", "defend", "defend", "bash"];

export function getCardData(id) {
    return { ...CARD_DATABASE[id] }; // Return copy
}

export function getRandomCardReward() {
    const keys = Object.keys(CARD_DATABASE);
    // Filter out basic cards from rewards to make it interesting
    const pool = keys.filter(k => k !== "strike" && k !== "defend");
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return getCardData(pick);
}