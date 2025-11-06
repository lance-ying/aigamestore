// entities.js - Game entities (Player, Zombird, Bolt, Pumpkin, Particle)
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.type = 'player';
  }
  
  update(p) {
    // Player is stationary at bottom center
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw crossbow based on aim direction
    p.fill(80, 60, 40);
    p.noStroke();
    
    // Crossbow body
    p.rect(-10, -5, 20, 10);
    
    // Crossbow arms based on direction
    p.stroke(80, 60, 40);
    p.strokeWeight(3);
    
    if (gameState.aimDirection === 0) { // UP
      p.line(0, -5, -15, -10);
      p.line(0, -5, 15, -10);
      p.line(0, -5, 0, -20);
    } else if (gameState.aimDirection === 1) { // RIGHT
      p.line(10, 0, 15, -10);
      p.line(10, 0, 15, 10);
      p.line(10, 0, 25, 0);
    } else if (gameState.aimDirection === 2) { // DOWN
      p.line(0, 5, -15, 10);
      p.line(0, 5, 15, 10);
      p.line(0, 5, 0, 20);
    } else { // LEFT
      p.line(-10, 0, -15, -10);
      p.line(-10, 0, -15, 10);
      p.line(-10, 0, -25, 0);
    }
    
    p.pop();
  }
}

export class Zombird {
  constructor(x, y, type, p) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.typeData = type;
    this.health = type.health;
    this.maxHealth = type.health;
    this.speed = type.speed;
    this.size = type.size;
    this.vx = 0;
    this.vy = this.speed;
    this.wobbleOffset = p.random(0, 1000);
    this.alive = true;
    this.hitFlash = 0;
  }
  
  update(p) {
    // Move downward
    this.y += this.vy;
    
    // Wobble horizontally
    this.x += p.sin(p.frameCount * 0.05 + this.wobbleOffset) * 0.5;
    
    // Decay hit flash
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
    
    // Check if reached ground
    if (this.y > CANVAS_HEIGHT - 50) {
      this.alive = false;
      return 'landed';
    }
    
    return null;
  }
  
  takeDamage(damage) {
    this.health -= damage;
    this.hitFlash = 10;
    if (this.health <= 0) {
      this.alive = false;
      return true; // destroyed
    }
    return false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flash white when hit
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255, 200);
    } else {
      p.fill(...this.typeData.color);
    }
    p.noStroke();
    
    // Body
    p.ellipse(0, 0, this.size, this.size * 0.8);
    
    // Wings
    const wingFlap = p.sin(p.frameCount * 0.2 + this.wobbleOffset) * 0.3;
    p.fill(...this.typeData.color, 150);
    p.ellipse(-this.size * 0.6, wingFlap * 10, this.size * 0.5, this.size * 0.3);
    p.ellipse(this.size * 0.6, wingFlap * 10, this.size * 0.5, this.size * 0.3);
    
    // Eyes (creepy)
    p.fill(255, 50, 50);
    p.ellipse(-this.size * 0.2, -this.size * 0.1, 5, 5);
    p.ellipse(this.size * 0.2, -this.size * 0.1, 5, 5);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(200, 50, 50);
      p.rect(-this.size * 0.4, -this.size * 0.6, this.size * 0.8, 4);
      p.fill(50, 200, 50);
      const healthWidth = (this.health / this.maxHealth) * this.size * 0.8;
      p.rect(-this.size * 0.4, -this.size * 0.6, healthWidth, 4);
    }
    
    p.pop();
  }
}

export class Bolt {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = 15;
    this.alive = true;
    this.type = 'bolt';
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if out of bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.alive = false;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Rotate to face direction
    const angle = p.atan2(this.vy, this.vx);
    p.rotate(angle);
    
    // Bolt
    p.fill(150, 150, 150);
    p.noStroke();
    p.triangle(-this.size, 0, this.size, -3, this.size, 3);
    
    // Fletching
    p.fill(200, 50, 50);
    p.triangle(-this.size, -4, -this.size * 0.7, 0, -this.size, 4);
    
    p.pop();
  }
}

export class Pumpkin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 40;
    this.health = 3;
    this.maxHealth = 3;
    this.type = 'pumpkin';
    this.shakeAmount = 0;
  }
  
  takeDamage() {
    this.health--;
    this.shakeAmount = 15;
  }
  
  update(p) {
    if (this.shakeAmount > 0) {
      this.shakeAmount--;
    }
  }
  
  draw(p) {
    p.push();
    
    // Shake when damaged
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeAmount > 0) {
      shakeX = p.random(-3, 3);
      shakeY = p.random(-3, 3);
    }
    
    p.translate(this.x + shakeX, this.y + shakeY);
    
    // Pumpkin color based on health
    const healthRatio = this.health / this.maxHealth;
    p.fill(255 * healthRatio, 140 * healthRatio, 0);
    p.noStroke();
    
    // Pumpkin body
    p.ellipse(0, 0, this.size, this.size * 0.9);
    
    // Ridges
    p.stroke(200 * healthRatio, 100 * healthRatio, 0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, 0, this.size * 0.6, this.size * 0.9, -p.PI / 2, p.PI / 2);
    p.arc(0, 0, this.size * 0.3, this.size * 0.9, -p.PI / 2, p.PI / 2);
    
    // Stem
    p.noStroke();
    p.fill(80, 120, 40);
    p.rect(-4, -this.size * 0.5, 8, 10);
    
    // Face if damaged
    if (this.health < this.maxHealth) {
      p.fill(50, 30, 0);
      // Eyes
      p.ellipse(-10, -5, 6, 8);
      p.ellipse(10, -5, 6, 8);
      // Mouth
      p.arc(0, 5, 15, 10, 0, p.PI);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = 4;
    this.alive = true;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
    
    if (this.life <= 0) {
      this.alive = false;
    }
  }
  
  draw(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size, this.size);
  }
}