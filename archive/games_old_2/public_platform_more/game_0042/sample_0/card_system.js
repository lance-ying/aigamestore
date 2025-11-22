// card_system.js - Card definitions and deck management

import { gameState } from './globals.js';

export class Card {
  constructor(name, type, cost, damage, effect, description) {
    this.name = name;
    this.type = type; // "ATTACK", "SKILL", "POWER"
    this.cost = cost;
    this.damage = damage;
    this.effect = effect; // function to execute
    this.description = description;
    this.id = Math.random().toString(36).substr(2, 9);
  }
  
  play(caster, target) {
    if (this.effect) {
      this.effect(caster, target);
    }
  }
}

export function createStarterDeck() {
  return [
    new Card("Strike", "ATTACK", 1, 6, null, "Deal 6 damage"),
    new Card("Strike", "ATTACK", 1, 6, null, "Deal 6 damage"),
    new Card("Strike", "ATTACK", 1, 6, null, "Deal 6 damage"),
    new Card("Strike", "ATTACK", 1, 6, null, "Deal 6 damage"),
    new Card("Defend", "SKILL", 1, 0, (caster) => { caster.block += 5; }, "Gain 5 block"),
    new Card("Defend", "SKILL", 1, 0, (caster) => { caster.block += 5; }, "Gain 5 block"),
    new Card("Defend", "SKILL", 1, 0, (caster) => { caster.block += 5; }, "Gain 5 block"),
    new Card("Bash", "ATTACK", 2, 10, null, "Deal 10 damage")
  ];
}

export function getAllPossibleCards() {
  return [
    new Card("Heavy Strike", "ATTACK", 2, 14, null, "Deal 14 damage"),
    new Card("Cleave", "ATTACK", 1, 8, (caster, target) => {
      gameState.enemies.forEach(e => {
        if (e.hp > 0) damageEnemy(e, 8);
      });
    }, "Deal 8 damage to ALL enemies"),
    new Card("Iron Wall", "SKILL", 1, 0, (caster) => { caster.block += 12; }, "Gain 12 block"),
    new Card("Rage", "POWER", 1, 0, (caster) => { caster.strength += 2; }, "Gain 2 strength"),
    new Card("Pommel Strike", "ATTACK", 1, 9, (caster) => {
      drawCards(1);
    }, "Deal 9 damage, draw 1 card"),
    new Card("Twin Strike", "ATTACK", 1, 5, (caster, target) => {
      damageEnemy(target, 5);
      damageEnemy(target, 5);
    }, "Deal 5 damage twice"),
    new Card("Shockwave", "SKILL", 2, 0, (caster) => {
      gameState.enemies.forEach(e => {
        if (e.hp > 0) e.vulnerable = 2;
      });
    }, "Apply 2 vulnerable to ALL"),
    new Card("Body Slam", "ATTACK", 1, 0, (caster, target) => {
      damageEnemy(target, caster.block);
    }, "Deal damage = your block"),
    new Card("Uppercut", "ATTACK", 2, 13, (caster, target) => {
      target.weak = 1;
      target.vulnerable = 1;
    }, "Deal 13, apply weak & vuln"),
    new Card("Entrench", "SKILL", 2, 0, (caster) => {
      caster.block *= 2;
    }, "Double your block"),
    new Card("Sentinel", "SKILL", 1, 0, (caster) => { 
      caster.block += 5; 
      drawCards(2);
    }, "Gain 5 block, draw 2"),
    new Card("Carnage", "ATTACK", 2, 20, null, "Deal 20 damage")
  ];
}

export function damageEnemy(enemy, amount) {
  if (!enemy || enemy.hp <= 0) return;
  
  let finalDamage = amount;
  
  // Apply vulnerable (50% more damage)
  if (enemy.vulnerable > 0) {
    finalDamage = Math.floor(finalDamage * 1.5);
  }
  
  // Apply block
  const blockUsed = Math.min(enemy.block, finalDamage);
  enemy.block -= blockUsed;
  finalDamage -= blockUsed;
  
  // Apply damage
  enemy.hp -= finalDamage;
  if (enemy.hp < 0) enemy.hp = 0;
  
  return finalDamage;
}

export function damagePlayer(amount) {
  if (!gameState.player) return;
  
  let finalDamage = amount;
  
  // Apply weak (25% less damage for enemies)
  const attacker = gameState.enemies.find(e => e.hp > 0);
  if (attacker && attacker.weak > 0) {
    finalDamage = Math.floor(finalDamage * 0.75);
  }
  
  // Apply vulnerable
  if (gameState.player.vulnerable > 0) {
    finalDamage = Math.floor(finalDamage * 1.5);
  }
  
  // Apply block
  const blockUsed = Math.min(gameState.player.block, finalDamage);
  gameState.player.block -= blockUsed;
  finalDamage -= blockUsed;
  
  // Apply damage
  gameState.player.hp -= finalDamage;
  if (gameState.player.hp < 0) gameState.player.hp = 0;
}

export function drawCards(count) {
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length === 0) {
      // Shuffle discard into deck
      gameState.deck = [...gameState.discardPile];
      gameState.discardPile = [];
      shuffleDeck();
    }
    
    if (gameState.deck.length > 0 && gameState.hand.length < 10) {
      gameState.hand.push(gameState.deck.pop());
    }
  }
}

export function shuffleDeck() {
  // Fisher-Yates shuffle
  for (let i = gameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
  }
}

export function startNewCombat() {
  // Reset deck
  gameState.deck = [...gameState.player.masterDeck];
  gameState.hand = [];
  gameState.discardPile = [];
  shuffleDeck();
  
  // Draw starting hand
  drawCards(5);
  
  // Reset player state
  gameState.player.block = 0;
  gameState.player.strength = 0;
  gameState.player.weak = 0;
  gameState.player.vulnerable = 0;
  
  // Reset enemies
  gameState.enemies.forEach(e => {
    e.block = 0;
    e.weak = 0;
    e.vulnerable = 0;
  });
  
  gameState.selectedCardIndex = 0;
  gameState.selectedTargetIndex = 0;
  gameState.turnCount = 0;
}

export function endTurn() {
  // Discard hand
  gameState.discardPile.push(...gameState.hand);
  gameState.hand = [];
  
  // Clear player block
  gameState.player.block = 0;
  
  // Decrease status effects
  if (gameState.player.weak > 0) gameState.player.weak--;
  if (gameState.player.vulnerable > 0) gameState.player.vulnerable--;
  
  // Draw new hand
  drawCards(5);
  
  gameState.turnCount++;
}