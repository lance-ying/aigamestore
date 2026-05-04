// layout.js - Layout and positioning utilities

import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING, CARD_VERTICAL_OFFSET } from './globals.js';

export const LAYOUT = {
  FOUNDATION_START_X: 300,
  FOUNDATION_Y: 20,
  TABLEAU_START_X: 40,
  TABLEAU_Y: 120,
  STOCKPILE_X: 40,
  STOCKPILE_Y: 20,
  WASTE_X: 110,
  WASTE_Y: 20
};

export function getTableauPosition(pileIndex, cardIndex) {
  return {
    x: LAYOUT.TABLEAU_START_X + pileIndex * CARD_SPACING,
    y: LAYOUT.TABLEAU_Y + cardIndex * CARD_VERTICAL_OFFSET
  };
}

export function getFoundationPosition(pileIndex) {
  return {
    x: LAYOUT.FOUNDATION_START_X + pileIndex * CARD_SPACING,
    y: LAYOUT.FOUNDATION_Y
  };
}

export function drawEmptyPileOutline(p, x, y) {
  p.push();
  p.noFill();
  p.stroke(150, 150, 150);
  p.strokeWeight(2);
  p.drawingContext.setLineDash([5, 5]);
  p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
  p.drawingContext.setLineDash([]);
  p.pop();
}