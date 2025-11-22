// card.js - Card system

import { CARD_TYPES, STATUS_EFFECTS } from './globals.js';

export class Card {
  constructor(name, type, cost, effect, description) {
    this.name = name;
    this.type = type;
    this.cost = cost;
    this.effect = effect;
    this.description = description;
    this.level = 1;
  }
  
  clone() {
    const card = new Card(this.name, this.type, this.cost, this.effect, this.description);
    card.level = this.level;
    return card;
  }
}

export function createStarterDeck() {
  const deck = [];
  
  // Basic attack cards
  for (let i = 0; i < 5; i++) {
    deck.push(new Card(
      "Strike",
      CARD_TYPES.ATTACK,
      1,
      { damage: 8 },
      "Deal 8 damage"
    ));
  }
  
  for (let i = 0; i < 3; i++) {
    deck.push(new Card(
      "Heavy Blow",
      CARD_TYPES.ATTACK,
      2,
      { damage: 15 },
      "Deal 15 damage"
    ));
  }
  
  // Defensive cards
  for (let i = 0; i < 3; i++) {
    deck.push(new Card(
      "Shield",
      CARD_TYPES.DEFEND,
      1,
      { shield: 10 },
      "Gain 10 shield"
    ));
  }
  
  for (let i = 0; i < 2; i++) {
    deck.push(new Card(
      "Repair",
      CARD_TYPES.DEFEND,
      2,
      { heal: 12 },
      "Heal 12 HP"
    ));
  }
  
  // Special cards
  for (let i = 0; i < 2; i++) {
    deck.push(new Card(
      "Power Up",
      CARD_TYPES.SPECIAL,
      2,
      { status: STATUS_EFFECTS.POWER_UP, value: 5, duration: 2 },
      "Gain +5 damage for 2 turns"
    ));
  }
  
  deck.push(new Card(
    "Steam Burst",
    CARD_TYPES.ATTACK,
    3,
    { damage: 25, aoe: true },
    "Deal 25 damage to all enemies"
  ));
  
  deck.push(new Card(
    "Fortify",
    CARD_TYPES.DEFEND,
    2,
    { shield: 20, allHeroes: true },
    "Grant 20 shield to all heroes"
  ));
  
  return deck;
}

export function getAdvancedCards() {
  return [
    new Card(
      "Devastate",
      CARD_TYPES.ATTACK,
      3,
      { damage: 30 },
      "Deal 30 damage"
    ),
    new Card(
      "Chain Attack",
      CARD_TYPES.ATTACK,
      2,
      { damage: 10, hits: 2 },
      "Deal 10 damage twice"
    ),
    new Card(
      "Weaken",
      CARD_TYPES.SPECIAL,
      1,
      { status: STATUS_EFFECTS.WEAK, value: 5, duration: 2, target: "enemy" },
      "Enemy deals -5 damage for 2 turns"
    ),
    new Card(
      "Full Restore",
      CARD_TYPES.DEFEND,
      3,
      { heal: 30, allHeroes: true },
      "Heal all heroes for 30 HP"
    )
  ];
}