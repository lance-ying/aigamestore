// combat.js - Combat and turn management

import { gameState, GAME_PHASES } from './globals.js';
import { spawnEnemies } from './enemy.js';

export function processTileEffect(tileType, count) {
  const player = gameState.player;
  
  switch (tileType) {
    case 'RED': // Attack
      const damagePerTile = 5 + Math.floor(player.getTotalAttack() * 0.5);
      const totalDamage = damagePerTile * count;
      dealDamageToEnemies(totalDamage);
      break;
      
    case 'BLUE': // Defense
      const defensePercent = 0.1 * count;
      player.addDefense(defensePercent);
      break;
      
    case 'GREEN': // Healing
      const healAmount = 5 * count;
      player.heal(healAmount);
      break;
      
    case 'YELLOW': // Mana
      const manaAmount = 10 * count;
      player.gainMana(manaAmount);
      break;
  }
  
  // Add to score
  gameState.score += count * 10;
}

export function dealDamageToEnemies(totalDamage) {
  if (gameState.enemies.length === 0) return;
  
  // Distribute damage across enemies
  const damagePerEnemy = Math.floor(totalDamage / gameState.enemies.length);
  
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    const killed = enemy.takeDamage(damagePerEnemy);
    
    if (killed) {
      onEnemyDefeated(enemy);
      gameState.enemies.splice(i, 1);
    }
  }
}

export function onEnemyDefeated(enemy) {
  const player = gameState.player;
  player.gainExperience(enemy.expReward);
  player.gainGold(enemy.goldReward);
  gameState.enemiesDefeated++;
  gameState.score += enemy.expReward * 2;
}

export function enemyTurn() {
  const player = gameState.player;
  
  for (const enemy of gameState.enemies) {
    const damage = enemy.attack;
    player.takeDamage(damage);
  }
  
  // Reset defense after enemy turn
  player.resetDefense();
  
  // Check if player died
  if (player.hp <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

export function checkFloorComplete() {
  if (gameState.enemies.length === 0) {
    nextFloor();
  }
}

export function nextFloor() {
  gameState.currentFloor++;
  gameState.score += gameState.currentFloor * 50;
  spawnEnemies(gameState.currentFloor);
  
  // Heal player slightly between floors
  gameState.player.heal(10);
}