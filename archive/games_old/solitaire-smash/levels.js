import { createDeck, shuffleDeck } from './cards.js';

export const LEVEL_SEEDS = [
  12345,  // Level 1 - Easy
  23456,  // Level 2 - Medium
  34567,  // Level 3 - Hard
  45678,  // Level 4 - Expert
  56789   // Level 5 - Master
];

export function dealLevel(level) {
  const seed = LEVEL_SEEDS[level - 1];
  const deck = createDeck();
  const shuffled = shuffleDeck(deck, seed);
  
  const tableau = [[], [], [], [], [], [], []];
  const stockpile = [];
  
  let cardIndex = 0;
  
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = shuffled[cardIndex++];
      card.isFaceUp = (row === col);
      tableau[col].push(card);
    }
  }
  
  while (cardIndex < shuffled.length) {
    const card = shuffled[cardIndex++];
    card.isFaceUp = false;
    stockpile.push(card);
  }
  
  return { tableau, stockpile };
}