// shotgun.js - Shotgun and shell management

import { gameState, SHELLS_PER_ROUND } from './globals.js';

export function initializeShells(p) {
  const shells = [];
  
  // Random number of live and blank shells (at least 2 of each)
  const numLive = Math.floor(p.random(2, SHELLS_PER_ROUND - 1));
  const numBlank = SHELLS_PER_ROUND - numLive;
  
  for (let i = 0; i < numLive; i++) {
    shells.push("LIVE");
  }
  for (let i = 0; i < numBlank; i++) {
    shells.push("BLANK");
  }
  
  // Shuffle
  for (let i = shells.length - 1; i > 0; i--) {
    const j = Math.floor(p.random(i + 1));
    [shells[i], shells[j]] = [shells[j], shells[i]];
  }
  
  gameState.shells = shells;
  gameState.currentShellIndex = 0;
  gameState.sawedOff = false;
  gameState.knownNextShell = null;
}

export function getCurrentShell() {
  if (gameState.currentShellIndex >= gameState.shells.length) {
    return null;
  }
  return gameState.shells[gameState.currentShellIndex];
}

export function advanceShell() {
  gameState.currentShellIndex++;
}

export function getRemainingShells() {
  return gameState.shells.length - gameState.currentShellIndex;
}

export function countRemainingLive() {
  let count = 0;
  for (let i = gameState.currentShellIndex; i < gameState.shells.length; i++) {
    if (gameState.shells[i] === "LIVE") count++;
  }
  return count;
}

export function countRemainingBlank() {
  let count = 0;
  for (let i = gameState.currentShellIndex; i < gameState.shells.length; i++) {
    if (gameState.shells[i] === "BLANK") count++;
  }
  return count;
}