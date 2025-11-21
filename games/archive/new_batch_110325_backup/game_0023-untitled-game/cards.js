// cards.js - Card definitions and deck management
import { RESOURCE_SPICE, RESOURCE_SOLARI, FACTION_EMPEROR, FACTION_BENE_GESSERIT, FACTION_SPACING_GUILD, FACTION_FREMEN } from './globals.js';

export class Card {
  constructor(name, cost, agentEffect, revealEffect, combat, faction) {
    this.name = name;
    this.cost = cost; // Solari cost to acquire
    this.agentEffect = agentEffect; // Effect when placing agent
    this.revealEffect = revealEffect; // Effect when revealed
    this.combat = combat; // Combat strength
    this.faction = faction; // Associated faction
  }
}

// Starter cards
export function createStarterDeck() {
  return [
    new Card("Diplomacy", 0, { type: "influence", faction: null, value: 1 }, null, 0, null),
    new Card("Diplomacy", 0, { type: "influence", faction: null, value: 1 }, null, 0, null),
    new Card("Reconnaissance", 0, { type: "draw", value: 1 }, null, 1, null),
    new Card("Reconnaissance", 0, { type: "draw", value: 1 }, null, 1, null),
    new Card("Dagger", 0, null, null, 2, null),
    new Card("Dagger", 0, null, null, 2, null),
    new Card("Convincing Argument", 0, { type: "resource", resource: RESOURCE_SOLARI, value: 2 }, null, 0, null),
    new Card("Convincing Argument", 0, { type: "resource", resource: RESOURCE_SOLARI, value: 2 }, null, 0, null),
    new Card("Seek Allies", 0, { type: "resource", resource: RESOURCE_SOLARI, value: 1 }, { type: "draw", value: 1 }, 0, null),
    new Card("Seek Allies", 0, { type: "resource", resource: RESOURCE_SOLARI, value: 1 }, { type: "draw", value: 1 }, 0, null)
  ];
}

// Market cards
export function createMarketCards() {
  return [
    new Card("Spice Smuggler", 3, { type: "resource", resource: RESOURCE_SPICE, value: 2 }, null, 2, FACTION_FREMEN),
    new Card("Imperial Favor", 4, { type: "influence", faction: FACTION_EMPEROR, value: 2 }, { type: "resource", resource: RESOURCE_SOLARI, value: 2 }, 1, FACTION_EMPEROR),
    new Card("Guild Banker", 5, { type: "resource", resource: RESOURCE_SOLARI, value: 3 }, null, 1, FACTION_SPACING_GUILD),
    new Card("Bene Gesserit Sister", 5, { type: "influence", faction: FACTION_BENE_GESSERIT, value: 2 }, { type: "draw", value: 2 }, 0, FACTION_BENE_GESSERIT),
    new Card("Fremen Warriors", 4, { type: "resource", resource: RESOURCE_SPICE, value: 1 }, null, 4, FACTION_FREMEN),
    new Card("Sardaukar Legion", 6, null, null, 5, FACTION_EMPEROR),
    new Card("Mentat", 3, { type: "draw", value: 2 }, { type: "resource", resource: RESOURCE_SOLARI, value: 1 }, 1, null),
    new Card("Arrakis Liaison", 4, { type: "influence", faction: null, value: 2 }, { type: "resource", resource: RESOURCE_SPICE, value: 1 }, 2, null)
  ];
}

export class Deck {
  constructor(cards) {
    this.cards = [...cards];
    this.discardPile = [];
  }
  
  shuffle(p) {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(p.random(i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  draw(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.cards.length === 0) {
        if (this.discardPile.length === 0) break;
        this.cards = [...this.discardPile];
        this.discardPile = [];
        // Note: shuffle happens externally when needed
      }
      if (this.cards.length > 0) {
        drawn.push(this.cards.pop());
      }
    }
    return drawn;
  }
  
  addCard(card) {
    this.discardPile.push(card);
  }
  
  discardAll(cards) {
    this.discardPile.push(...cards);
  }
}