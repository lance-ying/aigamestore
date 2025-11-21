// layout.js - Layout constants and positioning functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, PILE_SPACING } from './globals.js';

export const STOCK_X = 20;
export const STOCK_Y = 20;

export const WASTE_X = STOCK_X + CARD_WIDTH + PILE_SPACING;
export const WASTE_Y = STOCK_Y;

export const FOUNDATION_START_X = CANVAS_WIDTH - 20 - (4 * CARD_WIDTH + 3 * PILE_SPACING);
export const FOUNDATION_Y = 20;

export const TABLEAU_START_X = 20;
export const TABLEAU_Y = 120;
export const TABLEAU_OFFSET_Y = 20;

export function getFoundationX(index) {
  return FOUNDATION_START_X + index * (CARD_WIDTH + PILE_SPACING);
}

export function getTableauX(index) {
  return TABLEAU_START_X + index * (CARD_WIDTH + PILE_SPACING);
}

export function getTableauCardY(columnIndex, cardIndex) {
  return TABLEAU_Y + cardIndex * TABLEAU_OFFSET_Y;
}