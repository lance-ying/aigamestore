// entities.js - Game entity classes
import { GRAVITY, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Bird {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.type = type;
    this.active = true;
    this.launched = false;
    this.abilityUsed = false;
    this.rotation = 0;
  }

  update() {
    if (!this.launched) return;
    
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    
    this.rotation = this.p.atan2(this.vy, this.vx);
    
    // Ground collision
    if (this.y + this.radius >= GROUND_Y) {
      this.y = GROUND_Y - this.radius;
      this.vy *= -0.3;
      this.vx *= 0.7;
      if (this.p.abs(this.vy) < 0.5) {
        this.active = false;
      }
    }
    
    // Out of bounds
    if (this.x < -50 || this.x > CANVAS_WIDTH + 50 || this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    
    const colors = {
      'RED': [220, 50, 50],
      'BLUE': [50, 120, 220],
      'YELLOW': [240, 220, 50],
      'BLACK': [40, 40, 40]
    };
    
    this.p.fill(...colors[this.type]);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, this.radius * 2);
    
    // Eye
    this.p.fill(255);
    this.p.circle(4, -2, 6);
    this.p.fill(0);
    this.p.circle(5, -2, 3);
    
    // Beak
    this.p.fill(240, 180, 50);
    this.p.triangle(8, 0, 14, -2, 8, 4);
    
    this.p.pop();
  }

  launch(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.launched = true;
  }

  activateAbility(gameState) {
    if (this.abilityUsed) return [];
    this.abilityUsed = true;
    
    const newEntities = [];
    
    switch (this.type) {
      case 'BLUE': // Split into 3
        for (let i = -1; i <= 1; i++) {
          const newBird = new Bird(this.p, this.x, this.y, this.type);
          newBird.vx = this.vx + i * 2;
          newBird.vy = this.vy - 2;
          newBird.launched = true;
          newBird.abilityUsed = true;
          newBird.radius = 8;
          newEntities.push(newBird);
        }
        this.active = false;
        break;
        
      case 'YELLOW': // Speed boost
        this.vx *= 1.8;
        this.vy *= 0.3;
        break;
        
      case 'BLACK': // Explosion
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * this.p.TWO_PI;
          const particle = new Particle(
            this.p,
            this.x,
            this.y,
            this.p.cos(angle) * 5,
            this.p.sin(angle) * 5,
            [255, 150, 0]
          );
          newEntities.push(particle);
        }
        break;
    }
    
    return newEntities;
  }
}

export class Pig {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.health = 100;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (!this.active) return;
    
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    if (this.y + this.radius >= GROUND_Y) {
      this.y = GROUND_Y - this.radius;
      this.vy *= -0.4;
      this.vx *= 0.8;
      if (this.p.abs(this.vy) < 0.3) {
        this.vy = 0;
        this.vx = 0;
      }
    }
    
    if (this.health <= 0) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.fill(120, 200, 80);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Eyes
    this.p.fill(255);
    this.p.circle(this.x - 5, this.y - 3, 8);
    this.p.circle(this.x + 5, this.y - 3, 8);
    this.p.fill(0);
    this.p.circle(this.x - 5, this.y - 3, 4);
    this.p.circle(this.x + 5, this.y - 3, 4);
    
    // Snout
    this.p.fill(100, 180, 70);
    this.p.circle(this.x, this.y + 5, 10);
    this.p.fill(0);
    this.p.circle(this.x - 2, this.y + 5, 3);
    this.p.circle(this.x + 2, this.y + 5, 3);
    
    // Health bar
    this.p.noStroke();
    this.p.fill(255, 0, 0);
    this.p.rect(this.x - 15, this.y - 25, 30, 4);
    this.p.fill(0, 255, 0);
    this.p.rect(this.x - 15, this.y - 25, 30 * (this.health / 100), 4);
    
    this.p.pop();
  }

  takeDamage(damage) {
    this.health -= damage;
  }
}

export class Structure {
  constructor(p, x, y, w, h, type = 'wood') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.health = type === 'wood' ? 50 : type === 'stone' ? 100 : 30;
    this.maxHealth = this.health;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.angularVelocity = 0;
  }

  update() {
    if (!this.active) return;
    
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.angularVelocity;
    
    // Ground collision
    if (this.y + this.h / 2 >= GROUND_Y) {
      this.y = GROUND_Y - this.h / 2;
      this.vy *= -0.3;
      this.vx *= 0.7;
      this.angularVelocity *= 0.7;
      if (this.p.abs(this.vy) < 0.3) {
        this.vy = 0;
      }
    }
    
    if (this.health <= 0) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    
    const colors = {
      'wood': [160, 100, 50],
      'stone': [150, 150, 150],
      'glass': [150, 200, 255, 150]
    };
    
    this.p.fill(...colors[this.type]);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.w, this.h);
    
    // Texture
    if (this.type === 'wood') {
      this.p.stroke(120, 70, 30);
      this.p.strokeWeight(1);
      for (let i = -this.h / 2; i < this.h / 2; i += 5) {
        this.p.line(-this.w / 2, i, this.w / 2, i);
      }
    }
    
    this.p.pop();
  }

  takeDamage(damage) {
    this.health -= damage;
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 60;
    this.active = true;
    this.size = 4;
  }

  update() {
    this.vy += GRAVITY * 0.5;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.size *= 0.95;
    
    if (this.life <= 0 || this.size < 0.5) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.noStroke();
    this.p.fill(...this.color, (this.life / 60) * 255);
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }
}