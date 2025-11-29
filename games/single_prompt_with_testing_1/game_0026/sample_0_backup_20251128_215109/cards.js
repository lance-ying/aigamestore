// cards.js - Card definitions and management
import { CARD_TYPES, HERO_CLASSES } from './globals.js';

export class Card {
  constructor(id, name, type, heroClass, cost, damage, defense, special, description) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.heroClass = heroClass;
    this.cost = cost; // Gold cost to purchase
    this.damage = damage || 0;
    this.defense = defense || 0;
    this.special = special || null;
    this.description = description;
    this.level = 1;
  }
  
  upgrade() {
    this.level++;
    this.damage = Math.floor(this.damage * 1.3);
    this.defense = Math.floor(this.defense * 1.3);
  }
  
  getDisplayDamage() {
    return this.damage * this.level;
  }
  
  getDisplayDefense() {
    return this.defense * this.level;
  }
}

// Card database
export function createCardDatabase() {
  const cards = [
    // Warrior cards
    new Card(1, "Heavy Strike", CARD_TYPES.ATTACK, HERO_CLASSES.WARRIOR, 20, 15, 0, null, "Deal heavy damage"),
    new Card(2, "Shield Bash", CARD_TYPES.ATTACK, HERO_CLASSES.WARRIOR, 25, 10, 5, null, "Attack and defend"),
    new Card(3, "Iron Wall", CARD_TYPES.DEFEND, HERO_CLASSES.WARRIOR, 20, 0, 20, null, "Block damage"),
    new Card(4, "Cleave", CARD_TYPES.ATTACK, HERO_CLASSES.WARRIOR, 35, 12, 0, "AOE", "Hit all enemies"),
    new Card(5, "Fortify", CARD_TYPES.DEFEND, HERO_CLASSES.WARRIOR, 30, 0, 15, "HEAL", "Defend and heal 10"),
    
    // Mage cards
    new Card(6, "Fireball", CARD_TYPES.ATTACK, HERO_CLASSES.MAGE, 25, 18, 0, null, "Blast of fire"),
    new Card(7, "Ice Shard", CARD_TYPES.ATTACK, HERO_CLASSES.MAGE, 20, 12, 0, "SLOW", "Damage enemy"),
    new Card(8, "Magic Shield", CARD_TYPES.DEFEND, HERO_CLASSES.MAGE, 25, 0, 18, null, "Magical barrier"),
    new Card(9, "Lightning", CARD_TYPES.ATTACK, HERO_CLASSES.MAGE, 40, 25, 0, null, "Huge damage"),
    new Card(10, "Arcane Blast", CARD_TYPES.SPECIAL, HERO_CLASSES.MAGE, 35, 10, 5, "DRAW", "Attack, defend, draw"),
    
    // Rogue cards
    new Card(11, "Quick Strike", CARD_TYPES.ATTACK, HERO_CLASSES.ROGUE, 15, 10, 0, null, "Fast attack"),
    new Card(12, "Backstab", CARD_TYPES.ATTACK, HERO_CLASSES.ROGUE, 30, 20, 0, "CRIT", "Critical hit"),
    new Card(13, "Dodge", CARD_TYPES.DEFEND, HERO_CLASSES.ROGUE, 20, 0, 15, null, "Evade attack"),
    new Card(14, "Poison Dagger", CARD_TYPES.ATTACK, HERO_CLASSES.ROGUE, 35, 8, 0, "POISON", "Damage over time"),
    new Card(15, "Smoke Bomb", CARD_TYPES.DEFEND, HERO_CLASSES.ROGUE, 30, 0, 25, null, "High defense"),
    
    // Universal cards
    new Card(16, "Basic Attack", CARD_TYPES.ATTACK, null, 10, 8, 0, null, "Simple attack"),
    new Card(17, "Defend", CARD_TYPES.DEFEND, null, 10, 0, 12, null, "Basic defense"),
    new Card(18, "Power Strike", CARD_TYPES.ATTACK, null, 30, 16, 0, null, "Strong attack"),
    new Card(19, "Heal", CARD_TYPES.SPECIAL, null, 25, 0, 0, "HEAL", "Restore 15 health"),
    new Card(20, "Counter", CARD_TYPES.DEFEND, null, 35, 5, 10, "COUNTER", "Defend and counter"),
  ];
  
  return cards;
}

export function getStarterDeck() {
  const db = createCardDatabase();
  // Start with basic cards from each hero
  return [
    Object.assign({}, db[0]),  // Heavy Strike
    Object.assign({}, db[0]),  // Heavy Strike
    Object.assign({}, db[2]),  // Iron Wall
    Object.assign({}, db[5]),  // Fireball
    Object.assign({}, db[6]),  // Ice Shard
    Object.assign({}, db[7]),  // Magic Shield
    Object.assign({}, db[10]), // Quick Strike
    Object.assign({}, db[10]), // Quick Strike
    Object.assign({}, db[12]), // Dodge
    Object.assign({}, db[15]), // Basic Attack
    Object.assign({}, db[15]), // Basic Attack
    Object.assign({}, db[16]), // Defend
  ];
}

export function drawCards(deck, hand, discardPile, count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      // Reshuffle discard pile into deck
      deck.push(...discardPile);
      discardPile.length = 0;
      shuffleDeck(deck);
    }
    if (deck.length > 0) {
      const card = deck.pop();
      hand.push(card);
      drawn.push(card);
    }
  }
  return drawn;
}

export function shuffleDeck(deck) {
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}