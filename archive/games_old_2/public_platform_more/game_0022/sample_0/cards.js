// cards.js - Card definitions and management

import { RESOURCE_BERRY, RESOURCE_TWIG, RESOURCE_RESIN, RESOURCE_PEBBLE, CARD_TYPE_CONSTRUCTION, CARD_TYPE_CRITTER } from './globals.js';

export class Card {
  constructor(name, type, cost, victoryPoints, ability = null) {
    this.name = name;
    this.type = type;
    this.cost = cost; // {BERRY: 2, TWIG: 1, ...}
    this.victoryPoints = victoryPoints;
    this.ability = ability; // Function or description
  }
}

// Create the deck of cards
export function createDeck() {
  const cards = [];
  
  // Construction cards - Buildings
  cards.push(new Card("Farm", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 2, [RESOURCE_RESIN]: 1}, 2, "PRODUCE_BERRY"));
  cards.push(new Card("Mine", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 1, [RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 1}, 2, "PRODUCE_PEBBLE"));
  cards.push(new Card("Woodshop", CARD_TYPE_CONSTRUCTION, {[RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 1}, 2, "PRODUCE_TWIG"));
  cards.push(new Card("Resin Factory", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 1, [RESOURCE_PEBBLE]: 2}, 2, "PRODUCE_RESIN"));
  
  cards.push(new Card("Inn", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 2, [RESOURCE_RESIN]: 2}, 3, "DRAW_CARD"));
  cards.push(new Card("Market", CARD_TYPE_CONSTRUCTION, {[RESOURCE_BERRY]: 1, [RESOURCE_TWIG]: 1, [RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 1}, 3, "BONUS_RESOURCE"));
  cards.push(new Card("University", CARD_TYPE_CONSTRUCTION, {[RESOURCE_RESIN]: 2, [RESOURCE_PEBBLE]: 2}, 3, "BONUS_VP"));
  cards.push(new Card("Palace", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 2, [RESOURCE_RESIN]: 2, [RESOURCE_PEBBLE]: 3}, 4, "BONUS_VP_LARGE"));
  
  cards.push(new Card("Castle", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 3, [RESOURCE_RESIN]: 3, [RESOURCE_PEBBLE]: 2}, 4, "END_GAME_VP"));
  cards.push(new Card("Theater", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 3, [RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 1}, 3, "END_GAME_VP"));
  
  // Critter cards - Characters
  cards.push(new Card("Farmer", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 3}, 1, "WORKER"));
  cards.push(new Card("Miner", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 3}, 1, "WORKER"));
  cards.push(new Card("Lumberjack", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2}, 1, "WORKER"));
  
  cards.push(new Card("Teacher", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2, [RESOURCE_TWIG]: 1}, 2, "DRAW_CARD"));
  cards.push(new Card("Merchant", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2, [RESOURCE_TWIG]: 1}, 2, "BONUS_RESOURCE"));
  cards.push(new Card("Ranger", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 1, [RESOURCE_TWIG]: 1}, 1, "FREE_CARD"));
  
  cards.push(new Card("King", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 3, [RESOURCE_PEBBLE]: 2}, 4, "END_GAME_VP"));
  cards.push(new Card("Queen", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 3, [RESOURCE_PEBBLE]: 2}, 4, "END_GAME_VP"));
  cards.push(new Card("Bard", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2, [RESOURCE_RESIN]: 1}, 2, "BONUS_VP"));
  
  cards.push(new Card("Architect", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2, [RESOURCE_RESIN]: 2}, 3, "DISCOUNT_CONSTRUCTION"));
  cards.push(new Card("Scholar", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 2, [RESOURCE_RESIN]: 1}, 2, "BONUS_VP"));
  cards.push(new Card("Innkeeper", CARD_TYPE_CRITTER, {[RESOURCE_BERRY]: 1}, 1, "BONUS_RESOURCE"));
  
  // More variety
  cards.push(new Card("Chapel", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 2, [RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 1}, 2, "BONUS_VP"));
  cards.push(new Card("Clocktower", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 1, [RESOURCE_RESIN]: 1, [RESOURCE_PEBBLE]: 2}, 3, "BONUS_VP"));
  cards.push(new Card("Store", CARD_TYPE_CONSTRUCTION, {[RESOURCE_TWIG]: 2, [RESOURCE_RESIN]: 1}, 2, "BONUS_RESOURCE"));
  
  return cards;
}

export function canAffordCard(card, resources) {
  for (const [resourceType, amount] of Object.entries(card.cost)) {
    if ((resources[resourceType] || 0) < amount) {
      return false;
    }
  }
  return true;
}

export function payForCard(card, resources) {
  for (const [resourceType, amount] of Object.entries(card.cost)) {
    resources[resourceType] -= amount;
  }
}

export function applyCardAbility(card, gameState) {
  if (!card.ability) return;
  
  switch (card.ability) {
    case "PRODUCE_BERRY":
      gameState.resources[RESOURCE_BERRY] += 1;
      break;
    case "PRODUCE_TWIG":
      gameState.resources[RESOURCE_TWIG] += 1;
      break;
    case "PRODUCE_RESIN":
      gameState.resources[RESOURCE_RESIN] += 1;
      break;
    case "PRODUCE_PEBBLE":
      gameState.resources[RESOURCE_PEBBLE] += 1;
      break;
    case "DRAW_CARD":
      if (gameState.deck.length > 0) {
        const drawnCard = gameState.deck.pop();
        gameState.hand.push(drawnCard);
      }
      break;
    case "BONUS_RESOURCE":
      gameState.resources[RESOURCE_BERRY] += 1;
      break;
    case "WORKER":
      gameState.availableWorkers += 1;
      break;
    case "FREE_CARD":
      // Implemented during play card action
      break;
  }
}

export function calculateEndGameBonus(gameState) {
  let bonus = 0;
  
  for (const card of gameState.city) {
    if (card.ability === "END_GAME_VP") {
      // Each end game VP card gives bonus based on city size
      bonus += Math.floor(gameState.city.length / 5);
    }
    if (card.ability === "BONUS_VP_LARGE") {
      bonus += 3;
    }
    if (card.ability === "BONUS_VP") {
      bonus += 1;
    }
  }
  
  return bonus;
}