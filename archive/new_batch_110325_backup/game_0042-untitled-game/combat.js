// combat.js - Combat logic

import { gameState, COMBAT_PHASES } from './globals.js';
import { drawCards, endTurn, damageEnemy, damagePlayer } from './card_system.js';

export function playCard(cardIndex) {
  if (cardIndex < 0 || cardIndex >= gameState.hand.length) return false;
  
  const card = gameState.hand[cardIndex];
  const target = gameState.enemies[gameState.selectedTargetIndex];
  
  if (!target || target.hp <= 0) return false;
  
  // Calculate damage with strength
  let finalDamage = card.damage;
  if (card.type === "ATTACK" && gameState.player.strength > 0) {
    finalDamage += gameState.player.strength;
  }
  
  // Execute card effect
  if (card.effect) {
    card.effect(gameState.player, target);
  } else if (card.type === "ATTACK") {
    damageEnemy(target, finalDamage);
  }
  
  // Create animation
  gameState.animations.push({
    type: "CARD_EFFECT",
    x: target.x,
    y: target.y,
    text: card.name,
    timer: 30,
    maxTimer: 30
  });
  
  // Move card to discard
  gameState.hand.splice(cardIndex, 1);
  gameState.discardPile.push(card);
  
  return true;
}

export function executeEnemyTurn() {
  const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
  
  aliveEnemies.forEach(enemy => {
    const action = enemy.executeIntent();
    
    if (action.type === "ATTACK") {
      damagePlayer(action.damage);
      
      gameState.animations.push({
        type: "ENEMY_ATTACK",
        x: gameState.player.x,
        y: gameState.player.y,
        text: `-${action.damage}`,
        timer: 30,
        maxTimer: 30
      });
    }
    
    // Decide next intent
    enemy.decideIntent();
  });
  
  // Decrease enemy status effects
  gameState.enemies.forEach(enemy => {
    if (enemy.weak > 0) enemy.weak--;
    if (enemy.vulnerable > 0) enemy.vulnerable--;
    enemy.block = 0; // Enemy block doesn't persist
  });
}

export function checkCombatEnd() {
  const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
  
  if (aliveEnemies.length === 0) {
    // Victory
    gameState.score += 100 * gameState.currentFloor;
    return "WIN";
  }
  
  if (gameState.player.hp <= 0) {
    // Defeat
    return "LOSE";
  }
  
  return "CONTINUE";
}

export function updateAnimations(p) {
  gameState.animations = gameState.animations.filter(anim => {
    anim.timer--;
    return anim.timer > 0;
  });
}

export function renderAnimations(p) {
  gameState.animations.forEach(anim => {
    p.push();
    
    const alpha = (anim.timer / anim.maxTimer) * 255;
    const yOffset = (anim.maxTimer - anim.timer) * 2;
    
    if (anim.type === "CARD_EFFECT") {
      p.fill(255, 255, 100, alpha);
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(anim.text, anim.x, anim.y - yOffset);
    } else if (anim.type === "ENEMY_ATTACK") {
      p.fill(255, 100, 100, alpha);
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(anim.text, anim.x, anim.y - yOffset);
    }
    
    p.pop();
  });
}