import { CARD_WIDTH, CARD_HEIGHT, CANVAS_WIDTH } from './globals.js';

export function createTableauLayout(level) {
  const layout = [];
  
  // Tripeaks layout: 3 pyramids with 4 rows each
  const startY = 80;
  const cardSpacingX = CARD_WIDTH + 5;
  const cardSpacingY = 25;
  
  // Three peaks
  const peakPositions = [
    CANVAS_WIDTH / 2 - cardSpacingX * 3,
    CANVAS_WIDTH / 2,
    CANVAS_WIDTH / 2 + cardSpacingX * 3
  ];
  
  let cardIndex = 0;
  
  // Row 4 (bottom, face up): 10 cards
  for (let i = 0; i < 10; i++) {
    layout.push({
      index: cardIndex++,
      x: CANVAS_WIDTH / 2 - cardSpacingX * 4.5 + i * cardSpacingX,
      y: startY + cardSpacingY * 3,
      faceUp: true,
      coveringIndices: []
    });
  }
  
  // Row 3: 9 cards
  for (let i = 0; i < 9; i++) {
    const covering = [i, i + 1];
    layout.push({
      index: cardIndex++,
      x: CANVAS_WIDTH / 2 - cardSpacingX * 4 + i * cardSpacingX,
      y: startY + cardSpacingY * 2,
      faceUp: false,
      coveringIndices: covering
    });
  }
  
  // Row 2: 6 cards (3 pyramids, 2 each)
  for (let peak = 0; peak < 3; peak++) {
    for (let i = 0; i < 2; i++) {
      const baseIndex = 10 + peak * 3 + i;
      const covering = [baseIndex, baseIndex + 1];
      layout.push({
        index: cardIndex++,
        x: peakPositions[peak] - cardSpacingX / 2 + i * cardSpacingX,
        y: startY + cardSpacingY,
        faceUp: false,
        coveringIndices: covering
      });
    }
  }
  
  // Row 1 (peaks): 3 cards
  for (let peak = 0; peak < 3; peak++) {
    const covering = [19 + peak * 2, 19 + peak * 2 + 1];
    layout.push({
      index: cardIndex++,
      x: peakPositions[peak],
      y: startY,
      faceUp: false,
      coveringIndices: covering
    });
  }
  
  return layout;
}

export function setupTableau(deck, layout, gameState) {
  gameState.tableauCards = [];
  
  for (let i = 0; i < layout.length; i++) {
    const card = deck[i];
    const pos = layout[i];
    card.x = pos.x;
    card.y = pos.y;
    card.targetX = pos.x;
    card.targetY = pos.y;
    card.isFaceUp = pos.faceUp;
    card.isCovered = false;
    card.coveringIndices = pos.coveringIndices;
    gameState.tableauCards.push(card);
  }
  
  // Set covered status
  updateCoveredStatus(gameState);
}

export function updateCoveredStatus(gameState) {
  // Reset all covered status
  for (let card of gameState.tableauCards) {
    card.isCovered = false;
  }
  
  // Mark cards as covered based on covering indices
  for (let i = 0; i < gameState.tableauCards.length; i++) {
    const card = gameState.tableauCards[i];
    if (card.coveringIndices && card.coveringIndices.length > 0) {
      let allCoveringPresent = true;
      for (let idx of card.coveringIndices) {
        if (!gameState.tableauCards[idx]) {
          allCoveringPresent = false;
          break;
        }
      }
      card.isCovered = allCoveringPresent;
    }
  }
  
  // Flip uncovered face-down cards
  for (let card of gameState.tableauCards) {
    if (!card.isCovered && !card.isFaceUp) {
      card.isFaceUp = true;
    }
  }
}