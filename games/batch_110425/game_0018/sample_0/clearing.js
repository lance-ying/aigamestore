// clearing.js - Clearing (territory) management
import { CLEARING_SUITS, BUILDING_TYPES } from './globals.js';

export class Clearing {
  constructor(id, x, y, suit, slots) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.suit = suit;
    this.slots = slots; // building slots
    this.adjacentIds = [];
    this.units = {}; // faction -> count
    this.buildings = {}; // faction -> building type
    this.tokens = {}; // special tokens like sympathy
    this.ruler = null; // faction controlling clearing
  }

  addAdjacent(clearingId) {
    if (!this.adjacentIds.includes(clearingId)) {
      this.adjacentIds.push(clearingId);
    }
  }

  addUnit(faction, count = 1) {
    this.units[faction] = (this.units[faction] || 0) + count;
    this.updateRuler();
  }

  removeUnit(faction, count = 1) {
    this.units[faction] = Math.max(0, (this.units[faction] || 0) - count);
    if (this.units[faction] === 0) {
      delete this.units[faction];
    }
    this.updateRuler();
  }

  getUnitCount(faction) {
    return this.units[faction] || 0;
  }

  updateRuler() {
    // Ruler is faction with most warriors
    let maxUnits = 0;
    let ruler = null;
    for (const faction in this.units) {
      if (this.units[faction] > maxUnits) {
        maxUnits = this.units[faction];
        ruler = faction;
      }
    }
    this.ruler = ruler;
  }

  hasBuilding(faction) {
    return this.buildings[faction] !== undefined;
  }

  addBuilding(faction, buildingType) {
    if (Object.keys(this.buildings).length < this.slots) {
      this.buildings[faction] = buildingType;
      return true;
    }
    return false;
  }

  removeBuilding(faction) {
    delete this.buildings[faction];
  }

  getBuildingCount() {
    return Object.keys(this.buildings).length;
  }

  hasSympathy() {
    return this.tokens.sympathy === true;
  }

  addSympathy() {
    this.tokens.sympathy = true;
  }
}

export function createMapLayout() {
  const clearings = [];
  
  // Create 12 clearings in a tree-like pattern
  const positions = [
    { x: 150, y: 80, suit: "FOX", slots: 1 },
    { x: 300, y: 80, suit: "MOUSE", slots: 2 },
    { x: 450, y: 80, suit: "RABBIT", slots: 1 },
    { x: 100, y: 160, suit: "RABBIT", slots: 2 },
    { x: 250, y: 160, suit: "FOX", slots: 2 },
    { x: 400, y: 160, suit: "MOUSE", slots: 1 },
    { x: 150, y: 240, suit: "MOUSE", slots: 1 },
    { x: 300, y: 240, suit: "RABBIT", slots: 2 },
    { x: 450, y: 240, suit: "FOX", slots: 1 },
    { x: 100, y: 320, suit: "FOX", slots: 1 },
    { x: 300, y: 320, suit: "MOUSE", slots: 2 },
    { x: 500, y: 320, suit: "RABBIT", slots: 1 }
  ];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    clearings.push(new Clearing(i, pos.x, pos.y, pos.suit, pos.slots));
  }

  // Define adjacencies (forest paths)
  const adjacencies = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
    [3, 4], [4, 5], [3, 6], [4, 7], [5, 8],
    [6, 7], [7, 8], [6, 9], [7, 10], [8, 11],
    [9, 10], [10, 11]
  ];

  for (const [a, b] of adjacencies) {
    clearings[a].addAdjacent(b);
    clearings[b].addAdjacent(a);
  }

  return clearings;
}