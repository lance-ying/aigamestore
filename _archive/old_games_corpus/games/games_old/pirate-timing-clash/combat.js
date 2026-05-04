// combat.js - Combat logic and message system

import { gameState, GAME_PHASES, saveHighScore, LEVELS } from './globals.js';

export class CombatMessage {
  constructor(text, x, y, color = [255, 255, 255]) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.timer = 60;
    this.startY = y;
  }

  update() {
    this.timer--;
    this.y = this.startY - (60 - this.timer) * 0.5;
  }

  draw(p) {
    if (this.timer <= 0) return;
    
    p.push();
    const alpha = Math.min(255, this.timer * 4);
    p.fill(...this.color, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.strokeWeight(3);
    p.stroke(0, 0, 0, alpha);
    p.text(this.text, this.x, this.y);
    p.pop();
  }

  isFinished() {
    return this.timer <= 0;
  }
}

export const combatMessages = [];

export function addCombatMessage(text, x, y, color) {
  combatMessages.push(new CombatMessage(text, x, y, color));
}

export function updateCombatMessages() {
  for (let i = combatMessages.length - 1; i >= 0; i--) {
    combatMessages[i].update();
    if (combatMessages[i].isFinished()) {
      combatMessages.splice(i, 1);
    }
  }
}

export function drawCombatMessages(p) {
  combatMessages.forEach(msg => msg.draw(p));
}

export function handlePlayerAttack(hitResult, ability) {
  const player = gameState.player;
  
  if (hitResult.type === "MISS") {
    addCombatMessage("MISS!", player.x, player.y - 80, [200, 200, 200]);
    return;
  }
  
  // Calculate base damage with ability modifier
  const baseDamage = Math.floor(player.attack * hitResult.damage * ability.damage);
  
  // Handle multi-target attacks
  if (ability.multiTarget) {
    let enemiesHit = 0;
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead) {
        enemy.takeDamage(baseDamage);
        addCombatMessage(`-${baseDamage} HP`, enemy.x, enemy.y - 60, [255, 150, 100]);
        enemiesHit++;
        
        if (enemy.hp <= 0) {
          const xpGain = 40;
          player.gainXP(xpGain);
          gameState.score += 500;
          addCombatMessage("+500", enemy.x, enemy.y, [255, 215, 0]);
        }
      }
    }
    
    // Show ability name
    addCombatMessage(ability.name + "!", player.x, player.y - 80, [255, 100, 255]);
    
    // XP gain
    const xpGain = hitResult.type === "PERFECT" ? 50 : 
                   hitResult.type === "GREAT" ? 35 : 25;
    player.gainXP(xpGain);
    addCombatMessage(`+${xpGain} XP`, player.x + 60, player.y - 60, [100, 200, 255]);
    
  } else {
    // Single target attack
    let targetEnemy = null;
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead) {
        targetEnemy = enemy;
        break;
      }
    }
    
    if (targetEnemy) {
      targetEnemy.takeDamage(baseDamage);
      
      // Show hit result
      const hitColors = {
        "PERFECT": [100, 255, 100],
        "GREAT": [255, 255, 100],
        "GOOD": [255, 200, 100]
      };
      addCombatMessage(hitResult.type + "!", player.x, player.y - 80, hitColors[hitResult.type]);
      addCombatMessage(`-${baseDamage} HP`, targetEnemy.x, targetEnemy.y - 60, [255, 100, 100]);
      
      // XP and score
      const xpGain = hitResult.type === "PERFECT" ? 45 : 
                     hitResult.type === "GREAT" ? 30 : 20;
      player.gainXP(xpGain);
      addCombatMessage(`+${xpGain} XP`, player.x + 60, player.y - 60, [100, 200, 255]);
      
      const scoreGain = hitResult.type === "PERFECT" ? 200 : 
                        hitResult.type === "GREAT" ? 100 : 50;
      gameState.score += scoreGain;
      
      // Check if enemy defeated
      if (targetEnemy.hp <= 0) {
        const enemyXP = 40;
        player.gainXP(enemyXP);
        gameState.score += 500;
        addCombatMessage("+500", targetEnemy.x, targetEnemy.y, [255, 215, 0]);
      }
    }
  }
  
  // Handle healing ability (ONLY heals if using Healing Strike)
  if (ability.healsPlayer && hitResult.type !== "MISS") {
    const healAmount = ability.healAmount;
    player.heal(healAmount);
    addCombatMessage(`+${healAmount} HP`, player.x, player.y - 40, [150, 255, 150]);
  }
  
  // Fill special gauge
  player.addSpecialGauge(ability.gaugeAdd);
}

export function handleSpecialAttack() {
  const player = gameState.player;
  
  // Special attack damage
  const damage = Math.floor(player.attack * 2.5);
  
  // Damage all enemies
  let enemiesHit = 0;
  for (const enemy of gameState.enemies) {
    if (!enemy.isDead) {
      enemy.takeDamage(damage);
      addCombatMessage(`-${damage} HP`, enemy.x, enemy.y - 60, [255, 100, 255]);
      enemiesHit++;
      
      if (enemy.hp <= 0) {
        const xpGain = 40;
        player.gainXP(xpGain);
        gameState.score += 500;
        addCombatMessage("+500", enemy.x, enemy.y, [255, 215, 0]);
      }
    }
  }
  
  addCombatMessage("SPECIAL ATTACK!", player.x, player.y - 80, [255, 100, 255]);
  
  // Reduced heal on special attack
  const specialHeal = 10;
  player.heal(specialHeal);
  addCombatMessage(`+${specialHeal} HP`, player.x - 60, player.y - 60, [100, 255, 100]);
  
  gameState.score += 300;
  
  const xpGain = 60;
  player.gainXP(xpGain);
  addCombatMessage(`+${xpGain} XP`, player.x + 60, player.y - 40, [100, 200, 255]);
}

export function handleEnemyTurn() {
  const player = gameState.player;
  
  // Get alive enemies
  const aliveEnemies = gameState.enemies.filter(e => !e.isDead);
  
  if (aliveEnemies.length === 0) return true; // All enemies dead
  
  if (gameState.currentEnemyTurnIndex >= aliveEnemies.length) {
    gameState.currentEnemyTurnIndex = 0;
    return true; // All enemies have attacked
  }
  
  const enemy = aliveEnemies[gameState.currentEnemyTurnIndex];
  enemy.performAttack();
  
  // Deal damage to player
  player.takeDamage(enemy.attack);
  addCombatMessage(`-${enemy.attack} HP`, player.x, player.y - 60, [255, 100, 100]);
  
  gameState.currentEnemyTurnIndex++;
  
  // Check if player died
  if (player.hp <= 0) {
    saveHighScore();
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return true;
  }
  
  return gameState.currentEnemyTurnIndex >= aliveEnemies.length;
}

export function checkLevelComplete() {
  const allDead = gameState.enemies.every(e => e.isDead);
  
  if (allDead) {
    const player = gameState.player;
    
    // Level complete bonus
    gameState.score += 1000;
    
    // HP bonus
    const hpBonus = Math.floor(player.hp / 10) * 5;
    gameState.score += hpBonus;
    
    // Restore HP on level complete
    const hpRestore = Math.floor(player.maxHp * 0.4); // Restore 40% of max HP
    player.heal(hpRestore);
    
    // XP reward
    const levelConfig = LEVELS[gameState.currentLevel - 1];
    if (levelConfig) {
      player.gainXP(levelConfig.xpReward);
    }
    
    return true;
  }
  
  return false;
}