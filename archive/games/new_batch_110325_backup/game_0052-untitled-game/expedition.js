// expedition.js - Expedition system

import { gameState, GAME_PHASES, EXPEDITION_LOCATIONS } from './globals.js';

export function updateExpedition(p) {
  if (!gameState.inExpedition || gameState.inCombat) return;
  
  // Consume supplies over time
  if (p.frameCount % 180 === 0 && gameState.supplies > 0) {
    gameState.supplies--;
  }
  
  // Random encounters based on danger level
  const currentLoc = EXPEDITION_LOCATIONS.find(l => l.name === gameState.expeditionLocation);
  if (currentLoc && currentLoc.danger > 0) {
    if (p.frameCount % 240 === 0 && Math.random() < 0.3) {
      startCombat(currentLoc.danger);
    }
  }
}

export function moveExpedition(direction) {
  if (gameState.inCombat) return;
  
  const currentIndex = EXPEDITION_LOCATIONS.findIndex(l => l.name === gameState.expeditionLocation);
  
  if (direction === 'forward' && currentIndex < EXPEDITION_LOCATIONS.length - 1) {
    const nextLoc = EXPEDITION_LOCATIONS[currentIndex + 1];
    gameState.expeditionLocation = nextLoc.name;
    gameState.locationsVisited.add(nextLoc.name);
    gameState.expeditionProgress++;
    gameState.combatLog.push(`Arrived at ${nextLoc.display}`);
    
    // Check for win condition
    if (nextLoc.name === 'city') {
      gameState.hasCompletedGame = true;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
    
    // Random encounter chance
    if (nextLoc.danger > 0 && Math.random() < 0.5) {
      startCombat(nextLoc.danger);
    }
  } else if (direction === 'back' && currentIndex > 0) {
    const prevLoc = EXPEDITION_LOCATIONS[currentIndex - 1];
    gameState.expeditionLocation = prevLoc.name;
    gameState.combatLog.push(`Returned to ${prevLoc.display}`);
  } else if (direction === 'return') {
    gameState.inExpedition = false;
    gameState.combatLog = [];
  }
}

function startCombat(dangerLevel) {
  gameState.inCombat = true;
  
  const enemies = [
    { name: 'Wild Beast', health: 30 },
    { name: 'Bandit', health: 50 },
    { name: 'Desert Scorpion', health: 70 },
    { name: 'Mountain Troll', health: 90 },
    { name: 'Ancient Guardian', health: 120 }
  ];
  
  const enemyIndex = Math.min(dangerLevel - 1, enemies.length - 1);
  const enemy = enemies[enemyIndex];
  
  gameState.enemyName = enemy.name;
  gameState.enemyHealth = enemy.health;
  gameState.enemyMaxHealth = enemy.health;
  gameState.combatLog.push(`Encountered ${enemy.name}!`);
}

export function combatAction(action) {
  if (!gameState.inCombat) return;
  
  if (action === 'attack') {
    // Player attacks
    const playerDamage = 10 + Math.floor(Math.random() * 11); // 10-20
    gameState.enemyHealth -= playerDamage;
    gameState.combatLog.push(`You dealt ${playerDamage} damage`);
    
    if (gameState.enemyHealth <= 0) {
      gameState.combatLog.push(`${gameState.enemyName} defeated!`);
      gameState.inCombat = false;
      
      // Rewards
      const woodReward = 10 + Math.floor(Math.random() * 11);
      const foodReward = 5 + Math.floor(Math.random() * 6);
      gameState.wood += woodReward;
      gameState.food += foodReward;
      gameState.combatLog.push(`Found ${woodReward} wood, ${foodReward} food`);
      return;
    }
    
    // Enemy attacks back
    const enemyDamage = 5 + Math.floor(Math.random() * 11); // 5-15
    gameState.playerHealth -= enemyDamage;
    gameState.combatLog.push(`${gameState.enemyName} dealt ${enemyDamage} damage`);
    
    if (gameState.playerHealth <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
  } else if (action === 'flee') {
    if (Math.random() < 0.7) {
      gameState.combatLog.push('Fled successfully');
      gameState.inCombat = false;
      
      // Move back one location
      const currentIndex = EXPEDITION_LOCATIONS.findIndex(l => l.name === gameState.expeditionLocation);
      if (currentIndex > 0) {
        gameState.expeditionLocation = EXPEDITION_LOCATIONS[currentIndex - 1].name;
      }
    } else {
      gameState.combatLog.push('Failed to flee!');
      
      // Enemy gets free attack
      const enemyDamage = 5 + Math.floor(Math.random() * 11);
      gameState.playerHealth -= enemyDamage;
      gameState.combatLog.push(`${gameState.enemyName} dealt ${enemyDamage} damage`);
      
      if (gameState.playerHealth <= 0) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }
    }
  }
  
  // Keep combat log manageable
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
}