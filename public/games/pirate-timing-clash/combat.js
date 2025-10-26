// combat.js - Combat logic and message system

import { gameState, GAME_PHASES, saveHighScore } from './globals.js';

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

export function handlePlayerAttack(hitResult) {
  const player = gameState.player;
  
  if (hitResult.type === "MISS") {
    addCombatMessage("MISS!", player.x, player.y - 80, [200, 200, 200]);
    return;
  }
  
  // Calculate damage
  const damage = Math.floor(player.attack * hitResult.damage);
  
  // Find first alive enemy and deal damage
  let targetEnemy = null;
  for (const enemy of gameState.enemies) {
    if (!enemy.isDead) {
      targetEnemy = enemy;
      break;
    }
  }
  
  if (targetEnemy) {
    targetEnemy.takeDamage(damage);
    
    // Show hit result
    const hitColors = {
      "PERFECT": [100, 255, 100],
      "GREAT": [255, 255, 100],
      "GOOD": [255, 200, 100]
    };
    addCombatMessage(hitResult.type + "!", player.x, player.y - 80, hitColors[hitResult.type]);
    addCombatMessage(`-${damage} HP`, targetEnemy.x, targetEnemy.y - 60, [255, 100, 100]);
    
    // Add score
    const scoreGain = hitResult.type === "PERFECT" ? 200 : 
                      hitResult.type === "GREAT" ? 100 : 50;
    gameState.score += scoreGain;
    addCombatMessage(`+${scoreGain}`, player.x + 60, player.y - 40, [255, 255, 100]);
    
    // Fill special gauge
    player.addSpecialGauge(hitResult.gaugeAdd);
    
    // Check if enemy defeated
    if (targetEnemy.hp <= 0) {
      gameState.score += 500;
      addCombatMessage("+500 BONUS!", targetEnemy.x, targetEnemy.y, [255, 215, 0]);
    }
  }
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
        gameState.score += 500;
        addCombatMessage("+500 BONUS!", enemy.x, enemy.y, [255, 215, 0]);
      }
    }
  }
  
  addCombatMessage("SPECIAL ATTACK!", player.x, player.y - 80, [255, 100, 255]);
  gameState.score += 300;
  addCombatMessage("+300", player.x + 60, player.y - 40, [255, 255, 100]);
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
    // Level complete bonus
    gameState.score += 1000;
    
    // HP bonus
    const hpBonus = Math.floor(gameState.player.hp / 10) * 5;
    gameState.score += hpBonus;
    
    return true;
  }
  
  return false;
}