// boons.js - Boon (power-up) system

import {
  BOON_ATTACK, BOON_SPEED, BOON_HEALTH, BOON_DASH
} from './globals.js';

export const BOON_DEFINITIONS = {
  [BOON_ATTACK]: {
    name: "Zeus's Thunder",
    description: "Increase attack damage",
    effect: (gameState) => {
      gameState.attackBonus++;
      gameState.player.attackDamage += 10;
    }
  },
  [BOON_SPEED]: {
    name: "Hermes's Swift",
    description: "Increase movement speed",
    effect: (gameState) => {
      gameState.speedBonus++;
    }
  },
  [BOON_HEALTH]: {
    name: "Athena's Blessing",
    description: "Restore and increase max health",
    effect: (gameState) => {
      gameState.player.maxHealth += 20;
      gameState.player.heal(50);
    }
  },
  [BOON_DASH]: {
    name: "Poseidon's Wave",
    description: "Improve dash ability",
    effect: (gameState) => {
      gameState.dashBonus++;
    }
  }
};

export function offerRandomBoons(gameState, p) {
  const boonTypes = Object.keys(BOON_DEFINITIONS);
  const shuffled = boonTypes.sort(() => p.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
}

export function applyBoon(boonType, gameState) {
  const boon = BOON_DEFINITIONS[boonType];
  if (boon) {
    boon.effect(gameState);
    gameState.score += 50;
  }
}

export function renderBoonSelection(p, boons, selectedIndex) {
  const centerX = 300;
  const startY = 150;
  const spacing = 80;
  
  // Dim background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("Choose Your Boon", centerX, 80);
  
  // Render each boon option
  for (let i = 0; i < boons.length; i++) {
    const boonType = boons[i];
    const boon = BOON_DEFINITIONS[boonType];
    const y = startY + i * spacing;
    const selected = i === selectedIndex;
    
    // Background box
    p.fill(...(selected ? [100, 80, 150] : [50, 40, 80]));
    p.stroke(...(selected ? [200, 180, 255] : [100, 80, 150]));
    p.strokeWeight(2);
    p.rect(centerX - 200, y - 25, 400, 50, 5);
    
    // Icon
    p.fill(255, 220, 100);
    p.noStroke();
    p.textSize(20);
    p.text(getBoonIcon(boonType), centerX - 170, y);
    
    // Name
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(boon.name, centerX - 140, y - 5);
    
    // Description
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text(boon.description, centerX - 140, y + 10);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Use UP/DOWN arrows to select, SPACE to choose", centerX, 350);
}

function getBoonIcon(boonType) {
  switch (boonType) {
    case BOON_ATTACK: return "⚡";
    case BOON_SPEED: return "🏃";
    case BOON_HEALTH: return "❤️";
    case BOON_DASH: return "🌊";
    default: return "★";
  }
}