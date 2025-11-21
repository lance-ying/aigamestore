// utils.js - Utility functions for isometric projection and calculations

import { TILE_WIDTH, TILE_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Convert grid coordinates to isometric screen coordinates
export function gridToIso(gridX, gridY) {
  const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
  const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { x: isoX, y: isoY };
}

// Convert isometric coordinates to screen coordinates (with offset)
export function isoToScreen(isoX, isoY, offsetY = 0) {
  return {
    x: CANVAS_WIDTH / 2 + isoX,
    y: 100 + isoY - offsetY
  };
}

// Convert grid to screen directly
export function gridToScreen(gridX, gridY, offsetY = 0) {
  const iso = gridToIso(gridX, gridY);
  return isoToScreen(iso.x, iso.y, offsetY);
}

// Calculate distance between two grid points
export function gridDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Linear interpolation
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Easing function for smooth transitions
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Check if two grid positions are adjacent
export function isAdjacent(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}