// card_system.js - Card management and effects

import { gameState, CARD_TYPES, CARD_LIBRARY, createCard } from './globals.js';

export function initializeStarterDeck() {
  gameState.deck = [];
  
  // Starter deck: 5 strikes, 4 defends, 1 focus
  for (let i = 0; i < 5; i++) {
    const strikeTemplate = CARD_LIBRARY.find(c => c.id === "strike");
    gameState.deck.push(createCard(strikeTemplate));
  }
  for (let i = 0; i < 4; i++) {
    const defendTemplate = CARD_LIBRARY.find(c => c.id === "defend");
    gameState.deck.push(createCard(defendTemplate));
  }
  const focusTemplate = CARD_LIBRARY.find(c => c.id === "focus");
  gameState.deck.push(createCard(focusTemplate));
  
  shuffleDeck();
}

export function shuffleDeck() {
  // Fisher-Yates shuffle
  for (let i = gameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
  }
}

export function drawCards(count) {
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length === 0) {
      // Reshuffle discard pile into deck
      if (gameState.discardPile.length === 0) break;
      gameState.deck = [...gameState.discardPile];
      gameState.discardPile = [];
      shuffleDeck();
    }
    
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop();
      gameState.hand.push(card);
    }
  }
}

export function discardHand() {
  gameState.discardPile.push(...gameState.hand);
  gameState.hand = [];
}

export function playCard(cardIndex, targetEnemyIndex) {
  if (cardIndex < 0 || cardIndex >= gameState.hand.length) return false;
  
  const card = gameState.hand[cardIndex];
  
  // Check mana cost
  if (card.cost > gameState.player.mana) return false;
  
  // Deduct mana
  gameState.player.mana -= card.cost;
  
  // Apply card effects
  applyCardEffect(card, targetEnemyIndex);
  
  // Remove card from hand and add to discard
  gameState.hand.splice(cardIndex, 1);
  gameState.discardPile.push(card);
  
  return true;
}

function applyCardEffect(card, targetEnemyIndex) {
  // Attack cards
  if (card.type === CARD_TYPES.ATTACK) {
    if (card.aoe) {
      // Area of effect
      gameState.enemies.forEach(enemy => {
        dealDamageToEnemy(enemy, card.damage || 0);
      });
    } else if (card.hits) {
      // Multi-hit
      const target = gameState.enemies[targetEnemyIndex];
      if (target) {
        for (let i = 0; i < card.hits; i++) {
          dealDamageToEnemy(target, card.damage || 0);
        }
      }
    } else {
      // Single target
      const target = gameState.enemies[targetEnemyIndex];
      if (target) {
        dealDamageToEnemy(target, card.damage || 0);
      }
    }
    
    // Apply debuff if any
    if (card.debuff) {
      const target = gameState.enemies[targetEnemyIndex];
      if (target) {
        applyDebuff(target, card.debuff);
      }
    }
  }
  
  // Defend cards
  if (card.type === CARD_TYPES.DEFEND) {
    gameState.player.block = (gameState.player.block || 0) + (card.block || 0);
  }
  
  // Skill cards
  if (card.type === CARD_TYPES.SKILL) {
    if (card.drawCards) {
      drawCards(card.drawCards);
    }
    if (card.heal) {
      gameState.player.health = Math.min(
        gameState.player.maxHealth,
        gameState.player.health + card.heal
      );
    }
    if (card.debuff) {
      const target = gameState.enemies[targetEnemyIndex];
      if (target) {
        applyDebuff(target, card.debuff);
      }
    }
  }
}

function dealDamageToEnemy(enemy, damage) {
  if (!enemy || enemy.health <= 0) return;
  
  // Apply block first
  if (enemy.block > 0) {
    const blocked = Math.min(enemy.block, damage);
    enemy.block -= blocked;
    damage -= blocked;
  }
  
  enemy.health -= damage;
  
  if (enemy.health <= 0) {
    enemy.health = 0;
    enemy.isDead = true;
  }
}

function applyDebuff(enemy, debuffType) {
  if (!enemy.debuffs) enemy.debuffs = {};
  
  switch (debuffType) {
    case "weak":
      enemy.debuffs.weak = (enemy.debuffs.weak || 0) + 1;
      break;
    case "poison":
      enemy.debuffs.poison = (enemy.debuffs.poison || 0) + 2;
      break;
  }
}

export function endPlayerTurn() {
  // Discard remaining cards
  discardHand();
  
  // Reset block
  gameState.player.block = 0;
  
  // Apply poison to enemies
  gameState.enemies.forEach(enemy => {
    if (enemy.debuffs && enemy.debuffs.poison > 0) {
      enemy.health -= enemy.debuffs.poison;
      if (enemy.health <= 0) {
        enemy.health = 0;
        enemy.isDead = true;
      }
    }
  });
  
  // Check if all enemies are dead
  const allDead = gameState.enemies.every(e => e.isDead);
  if (allDead) {
    return "VICTORY";
  }
  
  return "CONTINUE";
}

export function generateRewardCards() {
  gameState.rewardCards = [];
  
  for (let i = 0; i < 3; i++) {
    // Pick random card from library (skip basic strike/defend)
    const eligibleCards = CARD_LIBRARY.filter(c => 
      c.id !== "strike" && c.id !== "defend"
    );
    const template = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    gameState.rewardCards.push(createCard(template));
  }
}

export function addCardToDeck(card) {
  gameState.deck.push(card);
  gameState.score += 10;
}