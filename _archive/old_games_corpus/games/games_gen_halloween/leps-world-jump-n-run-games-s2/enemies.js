// enemies.js - Enemy entities
import { gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // "bee", "beetle", "snail"
    this.width = 20;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Type-specific properties
    if (type === "bee") {
      this.speed = 1.5;
      this.flyPattern = 0;
      this.baseY = y;
      this.patrolDistance = 60;
    } else if (type === "beetle") {
      this.speed = 1;
      this.direction = 1;
      this.patrolDistance = 100;
      this.startX = x;
    } else if (type === "snail") {
      this.speed = 0.5;
      this.direction = -1;
      this.width = 18;
      this.height = 16;
    }
  }

  update() {
    const p = this.p;
    
    if (this.type === "bee") {
      // Flying pattern - sine wave
      this.flyPattern += 0.05;
      this.y = this.baseY + p.sin(this.flyPattern) * 20;
      this.x += this.speed;
      
      // Turn around at patrol limits
      if (this.x > this.startX + this.patrolDistance || this.x < this.startX - this.patrolDistance) {
        this.speed *= -1;
      }
    } else if (this.type === "beetle") {
      // Ground patrol
      this.x += this.speed * this.direction;
      
      if (p.abs(this.x - this.startX) > this.patrolDistance) {
        this.direction *= -1;
      }
    } else if (this.type === "snail") {
      // Slow ground patrol
      this.x += this.speed * this.direction;
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 15) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    if (this.type === "bee") {
      this.renderBee();
    } else if (this.type === "beetle") {
      this.renderBeetle();
    } else if (this.type === "snail") {
      this.renderSnail();
    }
    
    p.pop();
  }

  renderBee() {
    const p = this.p;
    
    // Body (yellow and black stripes)
    p.fill(255, 223, 0);
    p.noStroke();
    p.ellipse(0, 0, 16, 12);
    
    // Stripes
    p.fill(0);
    p.rect(-2, -4, 2, 8);
    p.rect(2, -4, 2, 8);
    
    // Wings
    const wingFlap = this.animFrame === 0 ? -3 : -1;
    p.fill(200, 220, 255, 150);
    p.ellipse(-8, wingFlap, 10, 6);
    p.ellipse(8, wingFlap, 10, 6);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(-4, -2, 4, 4);
    p.ellipse(4, -2, 4, 4);
    
    // Stinger
    p.fill(0);
    p.triangle(8, 0, 12, -2, 12, 2);
  }

  renderBeetle() {
    const p = this.p;
    
    // Body (brown/red)
    p.fill(139, 69, 19);
    p.noStroke();
    p.ellipse(0, 0, 18, 14);
    
    // Shell pattern
    p.fill(160, 82, 45);
    p.ellipse(-3, 0, 8, 12);
    p.ellipse(3, 0, 8, 12);
    
    // Head
    p.fill(101, 67, 33);
    p.ellipse(-8, -2, 8, 8);
    
    // Legs
    const legMove = this.animFrame === 0 ? 2 : -2;
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    p.line(-4, 6, -6, 10 + legMove);
    p.line(0, 6, 0, 12);
    p.line(4, 6, 6, 10 - legMove);
    p.noStroke();
  }

  renderSnail() {
    const p = this.p;
    
    // Shell (spiral)
    p.fill(205, 133, 63);
    p.noStroke();
    p.ellipse(4, -4, 14, 14);
    
    // Shell spiral
    p.fill(160, 82, 45);
    p.ellipse(4, -4, 8, 8);
    
    // Body
    p.fill(210, 180, 140);
    p.ellipse(-4, 2, 12, 6);
    
    // Eye stalks
    p.stroke(210, 180, 140);
    p.strokeWeight(2);
    p.line(-6, 0, -8, -4);
    p.line(-4, 0, -6, -4);
    p.noStroke();
    
    // Eyes
    p.fill(0);
    p.ellipse(-8, -4, 3, 3);
    p.ellipse(-6, -4, 3, 3);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}