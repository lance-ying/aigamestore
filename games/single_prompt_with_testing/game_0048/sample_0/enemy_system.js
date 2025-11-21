// enemy_system.js - Enemy AI and combat

import { gameState, BOOKS } from './globals.js';

export function createEnemy(type, floor, isBoss = false) {
  const book = BOOKS.find(b => b.id === gameState.currentBook);
  
  let baseHealth = 20;
  let baseDamage = 5;
  
  if (isBoss) {
    baseHealth = 60;
    baseDamage = 10;
  }
  
  // Scale with floor
  const healthMultiplier = 1 + (floor - 1) * 0.15;
  const damageMultiplier = 1 + (floor - 1) * 0.1;
  
  const enemy = {
    name: type,
    maxHealth: Math.floor(baseHealth * healthMultiplier),
    health: Math.floor(baseHealth * healthMultiplier),
    damage: Math.floor(baseDamage * damageMultiplier),
    block: 0,
    isBoss: isBoss,
    isDead: false,
    intent: "ATTACK",
    intentValue: Math.floor(baseDamage * damageMultiplier),
    debuffs: {},
    color: book ? book.color : [150, 150, 150],
    aiPattern: Math.floor(Math.random() * 3)
  };
  
  return enemy;
}

export function generateEnemies(floor) {
  gameState.enemies = [];
  
  const book = BOOKS.find(b => b.id === gameState.currentBook);
  if (!book) return;
  
  if (floor === gameState.maxFloor) {
    // Boss fight
    const boss = createEnemy(book.bossName, floor, true);
    gameState.enemies.push(boss);
  } else {
    // Regular encounter
    const numEnemies = floor === 1 ? 1 : (floor === 2 ? 2 : 2);
    for (let i = 0; i < numEnemies; i++) {
      const enemyType = book.enemyTypes[Math.floor(Math.random() * book.enemyTypes.length)];
      const enemy = createEnemy(enemyType, floor, false);
      gameState.enemies.push(enemy);
    }
  }
}

export function planEnemyIntents() {
  gameState.enemies.forEach(enemy => {
    if (enemy.isDead) return;
    
    // Reset debuff durations
    if (enemy.debuffs.weak > 0) enemy.debuffs.weak--;
    
    // AI pattern
    switch (enemy.aiPattern) {
      case 0: // Aggressive
        enemy.intent = "ATTACK";
        enemy.intentValue = enemy.damage;
        break;
      case 1: // Defensive
        if (Math.random() < 0.3) {
          enemy.intent = "DEFEND";
          enemy.intentValue = 5;
        } else {
          enemy.intent = "ATTACK";
          enemy.intentValue = enemy.damage;
        }
        break;
      case 2: // Mixed
        if (Math.random() < 0.2) {
          enemy.intent = "STRONG_ATTACK";
          enemy.intentValue = Math.floor(enemy.damage * 1.5);
        } else {
          enemy.intent = "ATTACK";
          enemy.intentValue = enemy.damage;
        }
        break;
    }
  });
}

export function executeEnemyTurn() {
  gameState.enemies.forEach(enemy => {
    if (enemy.isDead) return;
    
    // Reset block
    enemy.block = 0;
    
    switch (enemy.intent) {
      case "ATTACK":
      case "STRONG_ATTACK":
        let damage = enemy.intentValue;
        
        // Apply weak debuff
        if (enemy.debuffs.weak > 0) {
          damage = Math.floor(damage * 0.75);
        }
        
        // Player block
        if (gameState.player.block > 0) {
          const blocked = Math.min(gameState.player.block, damage);
          gameState.player.block -= blocked;
          damage -= blocked;
        }
        
        gameState.player.health -= damage;
        break;
        
      case "DEFEND":
        enemy.block = enemy.intentValue;
        break;
    }
  });
  
  // Check game over
  if (gameState.player.health <= 0) {
    gameState.player.health = 0;
    return "DEFEAT";
  }
  
  return "CONTINUE";
}

export function startNewTurn() {
  // Reset player mana
  let baseMana = gameState.player.maxMana;
  
  // Check for mana relics
  const hasManaRelic = gameState.relics.some(r => r.effect === "extraMana");
  if (hasManaRelic) baseMana += 1;
  
  gameState.player.mana = baseMana;
  
  // Draw cards
  let drawCount = 5;
  const hasDrawRelic = gameState.relics.some(r => r.effect === "drawCard");
  if (hasDrawRelic) drawCount += 1;
  
  drawCards(drawCount);
  
  // Apply regen relic
  const hasRegenRelic = gameState.relics.some(r => r.effect === "regen");
  if (hasRegenRelic) {
    gameState.player.health = Math.min(
      gameState.player.maxHealth,
      gameState.player.health + 2
    );
  }
  
  gameState.turnCounter++;
}

function drawCards(count) {
  // Import needed
  const cardSystem = require('./card_system.js');
  cardSystem.drawCards(count);
}