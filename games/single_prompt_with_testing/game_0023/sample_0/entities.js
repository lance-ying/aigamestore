// entities.js - Game entities and objects

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.color = [100, 150, 255];
  }
  
  update() {
    // Player is mostly static in this game, represents the developer
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...this.color);
    p.rect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(0, -this.height/2 - 10, 20);
    
    // Eyes
    p.fill(0);
    p.circle(-4, -this.height/2 - 10, 4);
    p.circle(4, -this.height/2 - 10, 4);
    
    p.pop();
  }
}

export class Game {
  constructor(name, type, design, tech, marketing) {
    this.name = name;
    this.type = type;
    this.design = design;
    this.tech = tech;
    this.marketing = marketing;
    this.score = 0;
    this.revenue = 0;
    this.developmentCost = 500 + design * 2 + tech * 2 + marketing * 2;
  }
  
  calculateScore() {
    // Calculate score based on balance and total investment
    const total = this.design + this.tech + this.marketing;
    const balance = 1 - Math.abs(this.design - this.tech) / 100 - Math.abs(this.tech - this.marketing) / 100;
    const rawScore = (total / 3) * (0.5 + balance * 0.5);
    
    // Add some randomness but deterministic based on game properties
    const seed = this.name.length + this.type.length;
    const variance = (seed % 20) - 10;
    
    this.score = Math.max(0, Math.min(100, rawScore + variance));
    return this.score;
  }
  
  calculateRevenue() {
    // Revenue based on score and marketing
    const baseRevenue = this.score * 10;
    const marketingBonus = this.marketing * 5;
    this.revenue = Math.floor(baseRevenue + marketingBonus);
    return this.revenue;
  }
}

export class RivalCompany {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.reputation = 50;
    this.lastReleaseWeek = 0;
  }
  
  update(currentWeek) {
    // Rival companies release games periodically
    if (currentWeek - this.lastReleaseWeek > 20) {
      this.lastReleaseWeek = currentWeek;
      return true; // Released a game
    }
    return false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Building icon
    p.fill(80, 80, 100);
    p.rect(-15, -20, 30, 40);
    
    // Windows
    p.fill(150, 200, 255);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        p.rect(-10 + j * 15, -15 + i * 12, 8, 8);
      }
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = 4;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
    return this.life > 0;
  }
  
  draw(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}