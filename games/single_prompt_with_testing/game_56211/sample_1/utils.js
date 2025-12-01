import { RANKS, SUITS, SORT_ORDER, HAND_TYPES } from './globals.js';

export function shuffleDeck(deck, p) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(p.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function createStandardDeck() {
    let deck = [];
    for (let s of SUITS) {
        for (let r of RANKS) {
            deck.push({
                suit: s,
                rank: r,
                id: Math.random().toString(36).substr(2, 9),
                isSelected: false,
                isBonus: false,
                mult: 0,
                chips: 0
            });
        }
    }
    return deck;
}

export function sortHand(hand, bySuit = false) {
    return hand.sort((a, b) => {
        if (bySuit) {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return SORT_ORDER[b.rank] - SORT_ORDER[a.rank];
        } else {
            if (SORT_ORDER[a.rank] !== SORT_ORDER[b.rank]) return SORT_ORDER[b.rank] - SORT_ORDER[a.rank];
            return a.suit.localeCompare(b.suit);
        }
    });
}

// Poker Hand Evaluation
export function evaluateHand(cards) {
    if (cards.length === 0) return null;
    
    // Sort for evaluation
    const sorted = [...cards].sort((a, b) => SORT_ORDER[a.rank] - SORT_ORDER[b.rank]);
    
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);
    const uniqueRanks = [...new Set(ranks)];
    const uniqueSuits = [...new Set(suits)];
    
    // Check Flush
    const isFlush = uniqueSuits.length === 1 && cards.length === 5;
    
    // Check Straight
    let isStraight = false;
    if (uniqueRanks.length === 5 && cards.length === 5) {
        const indices = uniqueRanks.map(r => SORT_ORDER[r]).sort((a, b) => a - b);
        // Standard check
        if (indices[4] - indices[0] === 4) isStraight = true;
        // Ace low straight (A, 2, 3, 4, 5) -> indices: 0, 1, 2, 3, 12
        if (indices[0] === 0 && indices[1] === 1 && indices[2] === 2 && indices[3] === 3 && indices[4] === 12) isStraight = true;
    }
    
    // Counts
    const counts = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const countsValues = Object.values(counts).sort((a, b) => b - a);
    
    let type = HAND_TYPES.HIGH_CARD;
    let scoringCards = []; // Usually all selected cards contribute chips, but strictly speaking in Balatro only scoring hand parts do. Simplified here: all played cards count if they form a hand.
    
    if (isFlush && isStraight) {
        // Royal check
        if (ranks.includes('A') && ranks.includes('K')) type = HAND_TYPES.ROYAL_FLUSH;
        else type = HAND_TYPES.STRAIGHT_FLUSH;
    } else if (countsValues[0] === 4) {
        type = HAND_TYPES.FOUR_OF_A_KIND;
    } else if (countsValues[0] === 3 && countsValues[1] === 2) {
        type = HAND_TYPES.FULL_HOUSE;
    } else if (isFlush) {
        type = HAND_TYPES.FLUSH;
    } else if (isStraight) {
        type = HAND_TYPES.STRAIGHT;
    } else if (countsValues[0] === 3) {
        type = HAND_TYPES.THREE_OF_A_KIND;
    } else if (countsValues[0] === 2 && countsValues[1] === 2) {
        type = HAND_TYPES.TWO_PAIR;
    } else if (countsValues[0] === 2) {
        type = HAND_TYPES.PAIR;
    } else {
        type = HAND_TYPES.HIGH_CARD;
    }
    
    return {
        type: type,
        cards: cards
    };
}

export function calculateScore(handType, playedCards, jokers) {
    let chips = handType.chips;
    let mult = handType.mult;
    
    // Card bonuses
    for (let card of playedCards) {
        chips += (card.chips || 0) + (import_RANK_VALUE(card.rank));
        mult += (card.mult || 0);
    }
    
    // Joker bonuses
    for (let joker of jokers) {
        const res = joker.calculate(handType, playedCards, chips, mult);
        chips = res.chips;
        mult = res.mult;
    }
    
    return {
        chips: Math.floor(chips),
        mult: Math.floor(mult),
        total: Math.floor(chips * mult)
    };
}

// Helper to avoid circular dependency import issue in calculateScore
import { RANK_VALUE as rv } from './globals.js';
function import_RANK_VALUE(rank) {
    return rv[rank];
}