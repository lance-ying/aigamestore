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
    const points = 150;
    gameState.score += points;
    return `★ JACKPOT! Found ${points} gold! ★`;
  } else if (luckAdjusted > 0.5) {
    // Good treasure
    const points = 75 + level * 10;
    gameState.score += points;
    return `Found ${points} gold!`;
  } else {
    // Minor treasure
    const points = 50;
    gameState.score += points;
    return `Found ${points} gold.`;
  }
}

function handleTrap(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.2;
  
  if (luckAdjusted > 0.7) {
    // Avoided or minor
    const damage = 5;
    gameState.player.takeDamage(damage);
    gameState.score += 25;
    return `Minor trap triggered! -${damage} HP (+25 points)`;
  } else if (luckAdjusted > 0.3) {
    // Moderate trap
    const damage = 10 + level * 2;
    gameState.player.takeDamage(damage);
    gameState.score += 25;
    return `TRAP! Lost ${damage} HP (+25 points)`;
  } else {
    // Severe trap
    const damage = 15 + level * 5;
    gameState.player.takeDamage(damage);
    gameState.score += 25;
    return `DEADLY TRAP! Lost ${damage} HP (+25 points)`;
  }
}

function handleEnemy(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.15;
  
  if (luckAdjusted > 0.8) {
    // Easy victory
    const damage = 5 + level * 2;
    gameState.player.takeDamage(damage);
    const points = 50;
    gameState.score += points;
    return `Enemy defeated! -${damage} HP (+${points} points)`;
  } else if (luckAdjusted > 0.4) {
    // Normal fight
    const damage = 15 + level * 3;
    gameState.player.takeDamage(damage);
    const points = 35;
    gameState.score += points;
    return `Battle won! -${damage} HP (+${points} points)`;
  } else {
    // Hard fight
    const damage = 20 + level * 5;
    gameState.player.takeDamage(damage);
    const points = 50;
    gameState.score += points;
    return `Tough battle! -${damage} HP (+${points} points)`;
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
    return `Kind stranger heals you! +${heal} HP (+${points} points)`;
  } else if (luckAdjusted > 0.4) {
    // Neutral NPC
    const points = 30;
    gameState.score += points;
    return `Interesting conversation! (+${points} points)`;
  } else {
    // Hostile NPC
    const damage = 10;
    gameState.player.takeDamage(damage);
    gameState.score += 25;
    return `Argument! Lost ${damage} HP (+25 points)`;
  }
}

function handleMystery(level, luckBonus, p) {
  const rand = p.random();
  const luckAdjusted = rand + luckBonus * 0.3;
  
  if (luckAdjusted > 0.8) {
    // Very positive
    const heal = 30;
    gameState.player.heal(heal);
    const points = 100;
    gameState.score += points;
    return `MYSTERY BONUS! +${heal} HP & +${points} points!`;
  } else if (luckAdjusted > 0.6) {
    // Positive
    const points = 60;
    gameState.score += points;
    return `Lucky find! +${points} points`;
  } else if (luckAdjusted > 0.4) {
    // Neutral
    gameState.luck = Math.min(100, gameState.luck + 10);
    return `You feel lucky... (Luck +10)`;
  } else if (luckAdjusted > 0.2) {
    // Negative
    const damage = 12;
    gameState.player.takeDamage(damage);
    return `Mysterious curse! -${damage} HP`;
  } else {
    // Very negative
    const damage = 20;
    gameState.player.takeDamage(damage);
    gameState.luck = Math.max(0, gameState.luck - 10);
    return `CURSED! -${damage} HP, Luck -10`;
  }
}

function handleExit(level) {
  const bonusHP = Math.floor(gameState.player.hp / 10) * 5;
  gameState.score += 200 + bonusHP;
  return `Level Complete! +200 points (+${bonusHP} HP bonus)`;
}