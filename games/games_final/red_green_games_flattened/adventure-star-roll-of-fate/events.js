// events.js - Event handling system

import { gameState } from './globals.js';

export function triggerEvent(tile, level, p) {
  if (tile.interacted) {
    return "Already interacted with this tile.";
  }
  
  tile.interacted = true;
  
  // Luck influences outcomes
  const luckBonus = (gameState.luck - 50) / 100; // -0.5 to +0.5
  
  switch (tile.type) {
    case 'EVENT_TREASURE':
      return handleTreasure(level, luckBonus, p);
    case 'EVENT_TRAP':
      return handleTrap(level, luckBonus, p);
    case 'EVENT_ENEMY':
      return handleEnemy(level, luckBonus, p);
    case 'EVENT_NPC':
      return handleNPC(level, luckBonus, p);
    case 'EVENT_MYSTERY':
      return handleMystery(level, luckBonus, p);
    case 'EXIT':
      return handleExit(level);
    default:
      return "";
  }
}

function handleTreasure(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.3;
  
  if (luckAdjusted > 0.9) {
    // Major treasure
    const points = 200 + level * 20;
    gameState.score += points;
    return `★ JACKPOT! Found ${points} gold! ★`;
  } else if (luckAdjusted > 0.5) {
    // Good treasure
    const points = 100 + level * 15;
    gameState.score += points;
    return `Found ${points} gold!`;
  } else {
    // Minor treasure
    const points = 60 + level * 10;
    gameState.score += points;
    return `Found ${points} gold.`;
  }
}

function handleTrap(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.2;
  
  if (luckAdjusted > 0.7) {
    // Avoided or minor
    const damage = 8 + level * 2;
    gameState.player.takeDamage(damage);
    gameState.score += 20;
    return `Minor trap triggered! -${damage} HP (+20 gold)`;
  } else if (luckAdjusted > 0.3) {
    // Moderate trap
    const damage = 15 + level * 3;
    gameState.player.takeDamage(damage);
    gameState.score += 30;
    return `TRAP! Lost ${damage} HP (+30 gold)`;
  } else {
    // Severe trap
    const damage = 25 + level * 5;
    gameState.player.takeDamage(damage);
    gameState.score += 40;
    return `DEADLY TRAP! Lost ${damage} HP (+40 gold)`;
  }
}

function handleEnemy(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.15;
  
  if (luckAdjusted > 0.75) {
    // Easy victory
    const damage = 10 + level * 2;
    gameState.player.takeDamage(damage);
    const points = 80 + level * 10;
    gameState.score += points;
    return `Enemy defeated! -${damage} HP (+${points} gold)`;
  } else if (luckAdjusted > 0.4) {
    // Normal fight
    const damage = 20 + level * 4;
    gameState.player.takeDamage(damage);
    const points = 70 + level * 10;
    gameState.score += points;
    return `Battle won! -${damage} HP (+${points} gold)`;
  } else {
    // Hard fight
    const damage = 30 + level * 6;
    gameState.player.takeDamage(damage);
    const points = 90 + level * 15;
    gameState.score += points;
    return `Tough battle! -${damage} HP (+${points} gold)`;
  }
}

function handleNPC(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.4;
  
  if (luckAdjusted > 0.7) {
    // Helpful NPC
    const heal = 20 + level * 5;
    gameState.player.heal(heal);
    const points = 50;
    gameState.score += points;
    return `Kind stranger heals you! +${heal} HP (+${points} gold)`;
  } else if (luckAdjusted > 0.4) {
    // Neutral NPC
    const points = 40 + level * 5;
    gameState.score += points;
    return `Interesting conversation! (+${points} gold)`;
  } else {
    // Hostile NPC
    const damage = 15;
    gameState.player.takeDamage(damage);
    gameState.score += 30;
    return `Argument! Lost ${damage} HP (+30 gold)`;
  }
}

function handleMystery(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.3;
  
  if (luckAdjusted > 0.8) {
    // Very positive
    const heal = 30 + level * 5;
    gameState.player.heal(heal);
    const points = 120;
    gameState.score += points;
    return `MYSTERY BONUS! +${heal} HP & +${points} gold!`;
  } else if (luckAdjusted > 0.6) {
    // Positive
    const points = 80 + level * 10;
    gameState.score += points;
    return `Lucky find! +${points} gold`;
  } else if (luckAdjusted > 0.4) {
    // Neutral
    gameState.luck = Math.min(100, gameState.luck + 10);
    const points = 30;
    gameState.score += points;
    return `You feel lucky... (Luck +10, +${points} gold)`;
  } else if (luckAdjusted > 0.2) {
    // Negative
    const damage = 15 + level * 2;
    gameState.player.takeDamage(damage);
    gameState.score += 25;
    return `Mysterious curse! -${damage} HP (+25 gold)`;
  } else {
    // Very negative
    const damage = 25 + level * 3;
    gameState.player.takeDamage(damage);
    gameState.luck = Math.max(0, gameState.luck - 10);
    gameState.score += 35;
    return `CURSED! -${damage} HP, Luck -10 (+35 gold)`;
  }
}

function handleExit(level) {
  const bonusHP = Math.floor(gameState.player.hp / 10) * 10;
  gameState.score += 300 + bonusHP;
  return `Level Complete! +300 gold (+${bonusHP} HP bonus)`;
}