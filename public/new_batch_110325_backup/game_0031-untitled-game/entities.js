// entities.js - Game entities (Player, City, Route, Cards)

import { CARD_COLORS, INITIAL_TRAIN_PIECES } from './globals.js';

export class Player {
  constructor(name, colorIndex) {
    this.name = name;
    this.colorIndex = colorIndex;
    this.trainPieces = INITIAL_TRAIN_PIECES;
    this.trainCards = [];
    this.destinationTickets = [];
    this.claimedRoutes = [];
    this.score = 0;
    this.isHuman = name === "You";
  }
  
  addCard(color) {
    const existing = this.trainCards.find(c => c.color === color);
    if (existing) {
      existing.count++;
    } else {
      this.trainCards.push({ color, count: 1 });
    }
  }
  
  removeCards(color, count) {
    const card = this.trainCards.find(c => c.color === color);
    if (card && card.count >= count) {
      card.count -= count;
      if (card.count === 0) {
        this.trainCards = this.trainCards.filter(c => c.color !== color);
      }
      return true;
    }
    return false;
  }
  
  getCardCount(color) {
    const card = this.trainCards.find(c => c.color === color);
    return card ? card.count : 0;
  }
  
  getTotalCards() {
    return this.trainCards.reduce((sum, card) => sum + card.count, 0);
  }
}

export class City {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
  }
}

export class Route {
  constructor(city1Index, city2Index, color, length) {
    this.city1Index = city1Index;
    this.city2Index = city2Index;
    this.color = color; // color name or "GRAY" for any color
    this.length = length;
    this.claimedBy = -1; // player index or -1 if unclaimed
    this.points = this.calculatePoints(length);
  }
  
  calculatePoints(length) {
    const pointTable = [0, 1, 2, 4, 7, 10, 15];
    return pointTable[Math.min(length, 6)];
  }
}

export class DestinationTicket {
  constructor(city1Index, city2Index, points) {
    this.city1Index = city1Index;
    this.city2Index = city2Index;
    this.points = points;
    this.completed = false;
  }
}