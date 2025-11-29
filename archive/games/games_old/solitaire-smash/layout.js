import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING, CARD_OFFSET_Y } from './globals.js';

export function getTableauPosition(col, row) {
  const startX = 40;
  const startY = 140;
  const x = startX + col * (CARD_WIDTH + CARD_SPACING);
  const y = startY + row * CARD_OFFSET_Y;
  return { x, y };
}

export function getFoundationPosition(index) {
  const startX = 340;
  const startY = 40;
  const x = startX + index * (CARD_WIDTH + CARD_SPACING);
  const y = startY;
  return { x, y };
}

export function getStockpilePosition() {
  return { x: 40, y: 40 };
}

export function getWastePosition(offset = 0) {
  return { x: 110 + offset * 15, y: 40 };
}

export function updateCardPositions(gameState) {
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < gameState.tableau[col].length; row++) {
      const card = gameState.tableau[col][row];
      const pos = getTableauPosition(col, row);
      card.moveTo(pos.x, pos.y, true);
    }
  }
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < gameState.foundations[i].length; j++) {
      const card = gameState.foundations[i][j];
      const pos = getFoundationPosition(i);
      card.moveTo(pos.x, pos.y, true);
    }
  }
  
  for (let i = 0; i < gameState.stockpile.length; i++) {
    const card = gameState.stockpile[i];
    const pos = getStockpilePosition();
    card.moveTo(pos.x, pos.y, false);
  }
  
  const wasteCount = Math.min(3, gameState.waste.length);
  for (let i = 0; i < gameState.waste.length; i++) {
    const card = gameState.waste[i];
    const displayIndex = Math.max(0, gameState.waste.length - wasteCount);
    const offset = i >= displayIndex ? i - displayIndex : 0;
    const pos = getWastePosition(offset);
    card.moveTo(pos.x, pos.y, true);
  }
}