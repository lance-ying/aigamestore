// utils.js - Utility functions

import { TILE_SIZE, gameState } from './globals.js';

// Convert world coordinates to tile coordinates
export function worldToTile(x, y) {
  return {
    tx: Math.floor(x / TILE_SIZE),
    ty: Math.floor(y / TILE_SIZE)
  };
}

// Convert tile coordinates to world coordinates
export function tileToWorld(tx, ty) {
  return {
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE
  };
}

// Check if tile coordinates are valid
export function isValidTile(tx, ty) {
  return tx >= 0 && tx < gameState.levelWidth && ty >= 0 && ty < gameState.levelHeight;
}

// Get tile at position
export function getTile(tx, ty) {
  if (!isValidTile(tx, ty)) return 1; // Treat out of bounds as solid
  return gameState.tiles[ty][tx];
}

// Set tile at position
export function setTile(tx, ty, value) {
  if (isValidTile(tx, ty)) {
    gameState.tiles[ty][tx] = value;
  }
}

// Check if tile is solid
export function isSolid(tx, ty) {
  const tile = getTile(tx, ty);
  return tile === 1 || tile === 2;
}

// Distance between two points
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Lerp function
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Clamp function
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Random integer between min and max (inclusive)
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random element from array
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Shuffle array
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}