// combat.js - Combat system logic

import { gameState, GAME_PHASES } from './globals.js';
import { createEnemy, createBoss, generateEquipment } from './entities.js';

export function initializeCombat() {
  if (gameState.combat.isInCombat) return;
  
  spawnNextEnemy();
}

export function spawnNextEnemy() {
  gameState.zoneProgress++;
  
  // Every 10 enemies, spawn a boss
  if (gameState.zoneProgress % 10 === 0) {
    gameState.combat.enemy = createBoss(gameState.currentZone);
    addCombatLog(`⚔️ BOSS APPEARED: ${gameState.combat.enemy.name}!`);
  } else {
    gameState.combat.enemy = createEnemy(gameState.currentZone);
    addCombatLog(`Enemy encountered: ${gameState.combat.enemy.name}`);
  }
  
  gameState.combat.isInCombat = true;
  gameState.combat.attackCooldown = 60; // 1 second
  gameState.combat.enemyAttackCooldown = 90; // 1.5 seconds
  gameState.combat.playerTurn = true;
}

export function updateCombat(deltaTime) {
  if (!gameState.combat.isInCombat || !gameState.combat.enemy) return;
  
  // Player attack
  if (gameState.combat.attackCooldown > 0) {
    gameState.combat.attackCooldown--;
  } else {
    performPlayerAttack();
    gameState.combat.attackCooldown = 60;
  }
  
  // Enemy attack
  if (gameState.combat.enemy.isAlive()) {
    if (gameState.combat.enemyAttackCooldown > 0) {
      gameState.combat.enemyAttackCooldown--;
    } else {
      performEnemyAttack();
      gameState.combat.enemyAttackCooldown = 90;
    }
  }
  
  // Check combat end
  if (!gameState.combat.enemy.isAlive()) {
    endCombat();
  }
  
  // Check player death
  if (gameState.player.hp <= 0) {
    handlePlayerDeath();
  }
}

function performPlayerAttack() {
  const enemy = gameState.combat.enemy;
  const damage = gameState.player.attack;
  const actualDamage = enemy.takeDamage(damage);
  
  addCombatLog(`You attack for ${actualDamage} damage!`);
  
  if (!enemy.isAlive()) {
    addCombatLog(`${enemy.name} defeated!`);
  }
}

function performEnemyAttack() {
  const enemy = gameState.combat.enemy;
  const damage = enemy.getAttackDamage();
  const actualDamage = Math.max(1, damage - gameState.player.defense);
  
  gameState.player.hp -= actualDamage;
  gameState.player.hp = Math.max(0, gameState.player.hp);
  
  addCombatLog(`${enemy.name} attacks for ${actualDamage} damage!`);
}

function endCombat() {
  const enemy = gameState.combat.enemy;
  
  // Create notification for rewards
  createNotification({
    gold: enemy.goldReward,
    exp: enemy.expReward,
    equipment: Math.random() < 0.3 ? generateEquipment(gameState.currentZone) : null
  });
  
  gameState.enemiesDefeated++;
  if (enemy.isBoss) {
    gameState.bossesDefeated++;
    addCombatLog(`🏆 BOSS DEFEATED! Zone ${gameState.currentZone} cleared!`);
    
    // Advance to next zone
    gameState.currentZone++;
    gameState.zoneProgress = 0;
    gameState.zonesCleared++;
    
    // Check win condition (beat zone 5 boss)
    if (gameState.currentZone > 5) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      addCombatLog("🎉 VICTORY! You are the ultimate warrior!");
      return;
    }
    
    addCombatLog(`Advancing to Zone ${gameState.currentZone}...`);
  }
  
  gameState.combat.isInCombat = false;
  gameState.combat.enemy = null;
  
  // Spawn next enemy after short delay
  setTimeout(() => {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      spawnNextEnemy();
    }
  }, 500);
}

function handlePlayerDeath() {
  addCombatLog("💀 You have been defeated!");
  addCombatLog("Respawning...");
  
  // Respawn with full HP
  gameState.player.hp = gameState.player.maxHp;
  
  // End current combat
  gameState.combat.isInCombat = false;
  gameState.combat.enemy = null;
  
  // Restart combat after delay
  setTimeout(() => {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      spawnNextEnemy();
    }
  }, 1000);
}

export function addCombatLog(message) {
  gameState.combatLog.push({
    message,
    timestamp: Date.now(),
    frameCount: gameState.gameTime
  });
  
  // Keep only last 100 messages
  if (gameState.combatLog.length > 100) {
    gameState.combatLog.shift();
  }
}

export function createNotification(rewards) {
  gameState.notifications.push({
    id: Date.now() + Math.random(),
    rewards,
    collected: false,
    spawnTime: Date.now()
  });
}

export function collectNotification(notification) {
  if (notification.collected) return;
  
  notification.collected = true;
  
  // Award rewards
  if (notification.rewards.gold) {
    gameState.player.gold += notification.rewards.gold;
    addCombatLog(`+${notification.rewards.gold} Gold`);
  }
  
  if (notification.rewards.exp) {
    addExperience(notification.rewards.exp);
  }
  
  if (notification.rewards.equipment) {
    handleEquipmentDrop(notification.rewards.equipment);
  }
  
  // Remove notification
  const index = gameState.notifications.indexOf(notification);
  if (index > -1) {
    gameState.notifications.splice(index, 1);
  }
}

function addExperience(exp) {
  gameState.player.exp += exp;
  addCombatLog(`+${exp} EXP`);
  
  while (gameState.player.exp >= gameState.player.expToLevel) {
    levelUp();
  }
}

function levelUp() {
  gameState.player.exp -= gameState.player.expToLevel;
  gameState.player.level++;
  gameState.player.expToLevel = Math.floor(gameState.player.expToLevel * 1.5);
  
  // Stat increases on level up
  gameState.player.baseAttack += 2;
  gameState.player.baseDefense += 1;
  gameState.player.baseMaxHp += 10;
  
  recalculateStats();
  gameState.player.hp = gameState.player.maxHp; // Full heal on level up
  
  addCombatLog(`🎉 LEVEL UP! Now level ${gameState.player.level}!`);
}

function handleEquipmentDrop(equipment) {
  addCombatLog(`Found: ${"⭐".repeat(equipment.rarity)} ${equipment.name}`);
  
  const currentEquip = gameState.equipment[equipment.type];
  
  // Auto-equip if better or no current equipment
  if (!currentEquip || equipment.getPowerScore() > currentEquip.getPowerScore()) {
    gameState.equipment[equipment.type] = equipment;
    addCombatLog(`Equipped: ${equipment.name}`);
    recalculateStats();
  }
}

export function recalculateStats() {
  // Start with base stats
  gameState.player.attack = gameState.player.baseAttack;
  gameState.player.defense = gameState.player.baseDefense;
  gameState.player.maxHp = gameState.player.baseMaxHp;
  
  // Add equipment bonuses
  for (const slot in gameState.equipment) {
    const equip = gameState.equipment[slot];
    if (equip) {
      gameState.player.attack += equip.stats.attack || 0;
      gameState.player.defense += equip.stats.defense || 0;
      gameState.player.maxHp += equip.stats.maxHp || 0;
    }
  }
  
  // Ensure HP doesn't exceed max
  gameState.player.hp = Math.min(gameState.player.hp, gameState.player.maxHp);
}