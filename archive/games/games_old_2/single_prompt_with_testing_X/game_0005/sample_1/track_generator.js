// track_generator.js - Generates track layout with collectibles and obstacles

import { 
  TRACK_LENGTH, NUM_LANES, ITEM_CUP, ITEM_COFFEE, ITEM_MILK, 
  ITEM_SLEEVE, ITEM_LID, OBSTACLE_BARRIER, OBSTACLE_SPILL, OBSTACLE_WIND
} from './globals.js';
import { Collectible } from './collectibles.js';
import { Obstacle } from './obstacles.js';

export class TrackGenerator {
  constructor(p, level = 1) {
    this.p = p;
    this.level = level;
    this.collectibles = [];
    this.obstacles = [];
  }

  generate() {
    this.collectibles = [];
    this.obstacles = [];
    
    const sectionLength = 400;
    const sections = Math.floor(TRACK_LENGTH / sectionLength);
    
    for (let i = 0; i < sections; i++) {
      const sectionY = -i * sectionLength - 200;
      
      // Determine section type based on progression
      if (i < 2) {
        // Tutorial: cups only
        this.generateCupSection(sectionY, sectionLength);
      } else if (i < 4) {
        // Cups + Coffee
        this.generateCupCoffeeSection(sectionY, sectionLength);
      } else if (i < 6) {
        // Add sleeves
        this.generateFullSection(sectionY, sectionLength, false);
      } else {
        // Full game with lids
        this.generateFullSection(sectionY, sectionLength, true);
      }
      
      // Add obstacles (increasing with level)
      if (i > 1) {
        this.generateObstacles(sectionY, sectionLength, i);
      }
    }
    
    return { collectibles: this.collectibles, obstacles: this.obstacles };
  }

  generateCupSection(startY, length) {
    const numCups = 6 + this.level;
    for (let i = 0; i < numCups; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - this.p.random(length * 0.8);
      this.collectibles.push(new Collectible(lane, y, ITEM_CUP));
    }
  }

  generateCupCoffeeSection(startY, length) {
    // Cups
    const numCups = 5 + this.level;
    for (let i = 0; i < numCups; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - this.p.random(length * 0.4);
      this.collectibles.push(new Collectible(lane, y, ITEM_CUP));
    }
    
    // Coffee and milk
    const numLiquid = numCups + 2;
    for (let i = 0; i < numLiquid; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - length * 0.5 - this.p.random(length * 0.4);
      const type = this.p.random() > 0.3 ? ITEM_COFFEE : ITEM_MILK;
      this.collectibles.push(new Collectible(lane, y, type));
    }
  }

  generateFullSection(startY, length, includeLids) {
    // Cups
    const numCups = 4 + this.level;
    for (let i = 0; i < numCups; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - this.p.random(length * 0.25);
      this.collectibles.push(new Collectible(lane, y, ITEM_CUP));
    }
    
    // Coffee/Milk
    const numLiquid = numCups + 1;
    for (let i = 0; i < numLiquid; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - length * 0.3 - this.p.random(length * 0.2);
      const type = this.p.random() > 0.4 ? ITEM_COFFEE : ITEM_MILK;
      this.collectibles.push(new Collectible(lane, y, type));
    }
    
    // Sleeves
    const numSleeves = numCups;
    for (let i = 0; i < numSleeves; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - length * 0.55 - this.p.random(length * 0.2);
      this.collectibles.push(new Collectible(lane, y, ITEM_SLEEVE));
    }
    
    // Lids
    if (includeLids) {
      const numLids = numCups + 1;
      for (let i = 0; i < numLids; i++) {
        const lane = Math.floor(this.p.random(NUM_LANES));
        const y = startY - length * 0.8 - this.p.random(length * 0.15);
        this.collectibles.push(new Collectible(lane, y, ITEM_LID));
      }
    }
  }

  generateObstacles(startY, length, difficulty) {
    const baseObstacles = 2;
    const numObstacles = baseObstacles + Math.floor(difficulty * 0.5);
    
    for (let i = 0; i < numObstacles; i++) {
      const lane = Math.floor(this.p.random(NUM_LANES));
      const y = startY - this.p.random(length * 0.9);
      
      const rand = this.p.random();
      let type, damage;
      
      if (rand < 0.4) {
        type = OBSTACLE_BARRIER;
        damage = 2;
      } else if (rand < 0.7) {
        type = OBSTACLE_SPILL;
        damage = 1;
      } else {
        type = OBSTACLE_WIND;
        damage = 3;
      }
      
      this.obstacles.push(new Obstacle(lane, y, type, damage));
    }
  }
}