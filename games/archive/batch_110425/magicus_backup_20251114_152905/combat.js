// combat.js - Combat mechanics and calculations

import { gameState, RUNE_NAMES } from './globals.js';

export function calculateMatchDamage(matchedCells) {
  const baseScore = matchedCells.length * 10;
  const baseDamage = matchedCells.length * 8;
  
  // Bonus for larger matches
  let bonus = 0;
  if (matchedCells.length >= 4) {
    bonus = 20;
  }
  if (matchedCells.length >= 5) {
    bonus = 50;
  }
  
  return {
    damage: baseDamage + bonus,
    score: baseScore + bonus
  };
}

export function chargeMeter(color, amount) {
  gameState.elementalMeters[color] = Math.min(
    gameState.meterMax,
    gameState.elementalMeters[color] + amount
  );
}

export function castSpell(color, p) {
  if (gameState.elementalMeters[color] < gameState.meterMax) {
    return null;
  }
  
  gameState.elementalMeters[color] = 0;
  
  let damage = 0;
  let effect = "";
  
  switch (color) {
    case 0: // Fire - High damage
      damage = 80;
      effect = `${RUNE_NAMES[color]} Blast!`;
      break;
    case 1: // Ice - Medium damage + slow
      damage = 50;
      effect = `${RUNE_NAMES[color]} Storm!`;
      break;
    case 2: // Nature - Heal + damage
      damage = 40;
      gameState.player.heal(30);
      effect = `${RUNE_NAMES[color]} Renewal!`;
      break;
    case 3: // Light - Medium damage
      damage = 60;
      effect = `${RUNE_NAMES[color]} Ray!`;
      break;
    case 4: // Shadow - High damage
      damage = 70;
      effect = `${RUNE_NAMES[color]} Curse!`;
      break;
  }
  
  return { damage, effect };
}

export function enemyTurn(enemy, player) {
  if (!enemy || enemy.isDead()) {
    return 0;
  }
  
  const damage = enemy.performAttack();
  player.takeDamage(damage);
  
  return damage;
}

export function checkGameOver() {
  if (gameState.playerHP <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    return true;
  }
  
  if (gameState.currentEnemy && gameState.currentEnemy.isDead()) {
    gameState.totalEnemiesDefeated++;
    
    // Grant rewards
    const goldReward = 50 + gameState.stage * 10;
    const expReward = 30 + gameState.stage * 5;
    
    gameState.gold += goldReward;
    gameState.experience += expReward;
    
    // Check level up
    if (gameState.experience >= gameState.experienceToLevel) {
      gameState.experience -= gameState.experienceToLevel;
      gameState.player.levelUp();
      gameState.level++;
      gameState.experienceToLevel = Math.floor(gameState.experienceToLevel * 1.5);
    }
    
    // Check win condition
    if (gameState.stage >= 5) {
      gameState.gamePhase = "GAME_OVER_WIN";
      return true;
    }
    
    // Enemy defeated, need to advance stage
    return true;
  }
  
  return false;
}