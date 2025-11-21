// player.js - Player and AI opponent classes
import { Deck, createStarterDeck } from './cards.js';
import { FACTIONS, RESOURCE_SPICE, RESOURCE_SOLARI } from './globals.js';

export class Player {
  constructor(isAI = false) {
    this.isAI = isAI;
    this.deck = new Deck(createStarterDeck());
    this.hand = [];
    this.resources = {
      [RESOURCE_SPICE]: 0,
      [RESOURCE_SOLARI]: 2 // Start with 2 Solari
    };
    this.influence = {
      [FACTIONS[0]]: 0,
      [FACTIONS[1]]: 0,
      [FACTIONS[2]]: 0,
      [FACTIONS[3]]: 0
    };
    this.victoryPoints = 0;
    this.agentsAvailable = 2;
    this.agentsPlaced = [];
    this.combatStrength = 0;
    
    // For logging
    this.screen_x = isAI ? 500 : 100;
    this.screen_y = isAI ? 50 : 50;
    this.game_x = this.screen_x;
    this.game_y = this.screen_y;
  }
  
  drawCards(p, count) {
    const drawn = this.deck.draw(count);
    if (drawn.length < count && this.deck.discardPile.length > 0) {
      this.deck.cards = [...this.deck.discardPile];
      this.deck.discardPile = [];
      this.deck.shuffle(p);
      const additional = this.deck.draw(count - drawn.length);
      drawn.push(...additional);
    }
    this.hand.push(...drawn);
    return drawn;
  }
  
  canAffordCard(card) {
    return this.resources[RESOURCE_SOLARI] >= card.cost;
  }
  
  buyCard(card) {
    if (this.canAffordCard(card)) {
      this.resources[RESOURCE_SOLARI] -= card.cost;
      this.deck.addCard(card);
      return true;
    }
    return false;
  }
  
  gainResource(resource, amount) {
    this.resources[resource] += amount;
  }
  
  gainInfluence(faction, amount) {
    if (faction && this.influence[faction] !== undefined) {
      this.influence[faction] += amount;
      // Check for influence milestones (every 2 influence = 1 VP)
      const milestones = Math.floor(this.influence[faction] / 2);
      const vpGained = milestones - Math.floor((this.influence[faction] - amount) / 2);
      if (vpGained > 0) {
        this.victoryPoints += vpGained;
      }
    }
  }
  
  gainVP(amount) {
    this.victoryPoints += amount;
  }
  
  resetAgents() {
    this.agentsAvailable = 2;
    this.agentsPlaced = [];
  }
  
  placeAgent(location) {
    if (this.agentsAvailable > 0) {
      this.agentsAvailable--;
      this.agentsPlaced.push(location);
      return true;
    }
    return false;
  }
  
  calculateCombatStrength() {
    this.combatStrength = 0;
    for (const card of this.hand) {
      this.combatStrength += card.combat;
    }
    return this.combatStrength;
  }
  
  endRound() {
    this.deck.discardAll(this.hand);
    this.hand = [];
    this.resetAgents();
  }
}