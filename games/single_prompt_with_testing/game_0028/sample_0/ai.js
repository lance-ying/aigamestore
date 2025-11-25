// ai.js - Basic AI for opponent

import { gameState } from './globals.js';

export function getOpponentInputs() {
  const opponent = gameState.opponent;
  const player = gameState.player;
  
  if (!opponent || !player || !opponent.isAlive || !player.isAlive) {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      shift: false,
      z: false
    };
  }
  
  const inputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
    z: false
  };
  
  const dx = player.x - opponent.x;
  const dy = player.y - opponent.y;
  const distance = Math.sqrt(dx*dx + dy*dy);
  
  // Move toward player
  if (Math.abs(dx) > 50) {
    if (dx > 0) {
      inputs.right = true;
    } else {
      inputs.left = true;
    }
  }
  
  // Jump if player is above
  if (dy < -50 && opponent.grounded) {
    inputs.up = true;
  }
  
  // Attack when in range
  if (distance < 80) {
    if (Math.random() < 0.3) {
      inputs.space = true; // Light attack
    } else if (Math.random() < 0.15) {
      inputs.z = true; // Strong attack
    } else if (Math.random() < 0.1) {
      inputs.shift = true; // Special
    }
  }
  
  // Use special occasionally from distance
  if (distance > 150 && distance < 300 && Math.random() < 0.05) {
    inputs.shift = true;
  }
  
  return inputs;
}