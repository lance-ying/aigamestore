// negotiation.js - Negotiation system

import { gameState, PLAY_PHASES, CARD_TYPES } from './globals.js';
import { Customer, NegotiationCard } from './entities.js';

export function startNegotiation() {
  if (gameState.potions.length === 0) return false;
  
  gameState.playPhase = PLAY_PHASES.NEGOTIATION;
  
  // Generate customer
  const difficulty = Math.min(5, 1 + Math.floor(gameState.day / 10));
  const budget = 50 + difficulty * 20 + Math.floor(Math.random() * 30);
  const patience = 40 + difficulty * 10;
  
  const names = ["Warrior Quinn", "Mage Elara", "Rogue Finn", "Cleric Maya", "Ranger Soren"];
  const name = names[Math.floor(Math.random() * names.length)];
  
  gameState.currentCustomer = new Customer(name, difficulty, budget, patience);
  gameState.currentCustomer.desiredPotion = gameState.currentCustomer.selectPotion(gameState.potions);
  
  if (!gameState.currentCustomer.desiredPotion) {
    gameState.playPhase = PLAY_PHASES.SHOP_MENU;
    return false;
  }
  
  // Initialize negotiation
  gameState.customerStress = gameState.currentCustomer.getStartingStress();
  gameState.playerStress = 0;
  gameState.currentPrice = gameState.currentCustomer.desiredPotion.basePrice;
  gameState.priceTarget = gameState.currentCustomer.getMaxPrice();
  
  // Generate cards
  const cardTypes = Object.keys(CARD_TYPES);
  gameState.negotiationCards = [];
  for (let i = 0; i < 5; i++) {
    const type = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    gameState.negotiationCards.push(new NegotiationCard(type));
  }
  gameState.selectedCard = 0;
  
  return true;
}

export function playNegotiationCard() {
  const card = gameState.negotiationCards[gameState.selectedCard];
  if (!card) return false;
  
  // Apply card effects
  gameState.currentPrice += card.getValue();
  gameState.playerStress = Math.max(0, gameState.playerStress - card.getStressReduce());
  
  // Customer reacts
  const stressIncrease = Math.floor(2 + Math.random() * 3);
  gameState.customerStress += stressIncrease;
  
  // Remove played card
  gameState.negotiationCards.splice(gameState.selectedCard, 1);
  gameState.selectedCard = Math.min(gameState.selectedCard, gameState.negotiationCards.length - 1);
  
  // Increase player stress
  gameState.playerStress += 3;
  
  return true;
}

export function checkNegotiationEnd() {
  // Customer leaves if too stressed
  if (gameState.customerStress >= gameState.currentCustomer.patience) {
    return "CUSTOMER_LEFT";
  }
  
  // Player fails if too stressed
  if (gameState.playerStress >= 100) {
    return "PLAYER_STRESSED";
  }
  
  // Success if price reached target
  if (gameState.currentPrice >= gameState.priceTarget) {
    return "SUCCESS";
  }
  
  // Success if no cards left and price is reasonable
  if (gameState.negotiationCards.length === 0) {
    if (gameState.currentPrice >= gameState.currentCustomer.desiredPotion.basePrice * 0.8) {
      return "SUCCESS";
    }
    return "CUSTOMER_LEFT";
  }
  
  return null;
}

export function completeNegotiation(result) {
  if (result === "SUCCESS") {
    // Sell potion
    gameState.gold += gameState.currentPrice;
    gameState.totalRevenue += gameState.currentPrice;
    gameState.potionsSold++;
    
    // Remove potion from inventory
    const potionIndex = gameState.potions.indexOf(gameState.currentCustomer.desiredPotion);
    if (potionIndex >= 0) {
      gameState.potions.splice(potionIndex, 1);
    }
  }
  
  gameState.currentCustomer = null;
  gameState.negotiationCards = [];
  gameState.playPhase = PLAY_PHASES.SHOP_MENU;
}