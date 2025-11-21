import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Elfin {
  constructor(p, type) {
    this.p = p;
    this.type = type; // 'red', 'blue', 'green'
    this.x = CANVAS_WIDTH;
    this.y = 200 + this.p.random(-50, 50);
    this.size = 30;
    this.speed = 2;
    this.collected = false;
    this.active = true;
    this.bobPhase = this.p.random(this.p.TWO_PI);
    
    // Type-specific properties
    if (type === 'red') {
      this.color = [255, 100, 100];
      this.multiplierBonus = 0.5;
      this.duration = 300;
    } else if (type === 'blue') {
      this.color = [100, 150, 255];
      this.multiplierBonus = 0.3;
      this.duration = 450;
    } else {
      this.color = [100, 255, 150];
      this.multiplierBonus = 0.2;
      this.duration = 600;
    }
  }

  update() {
    this.x -= this.speed;
    this.bobPhase += 0.1;
    
    // Check collision with player
    if (!this.collected && gameState.player) {
      const dist = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < (this.size + gameState.player.size) / 2) {
        this.collect();
      }
    }
    
    if (this.x < -this.size) {
      this.active = false;
    }
  }

  collect() {
    this.collected = true;
    this.active = false;
    gameState.scoreMultiplier += this.multiplierBonus;
    gameState.score += 300;
  }

  draw() {
    if (!this.active || this.collected) return;
    
    const bobOffset = this.p.sin(this.bobPhase) * 5;
    
    this.p.push();
    this.p.translate(this.x, this.y + bobOffset);
    
    // Glow effect
    this.p.noStroke();
    this.p.fill(...this.color, 80);
    this.p.ellipse(0, 0, this.size * 1.4, this.size * 1.4);
    
    // Main body
    this.p.fill(...this.color);
    this.p.stroke(255);
    this.p.strokeWeight(2);
    this.p.ellipse(0, 0, this.size, this.size);
    
    // Wings
    this.p.fill(255, 255, 255, 150);
    this.p.noStroke();
    const wingFlap = this.p.sin(this.bobPhase * 2) * 5;
    this.p.ellipse(-this.size/2 - 5, wingFlap, 15, 20);
    this.p.ellipse(this.size/2 + 5, -wingFlap, 15, 20);
    
    // Face
    this.p.fill(255);
    this.p.ellipse(-5, -3, 4, 4);
    this.p.ellipse(5, -3, 4, 4);
    
    this.p.pop();
  }
}