// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, BIRD_TYPES } from './globals.js';

export class Bird {
  constructor(p, x, y, type = "RED") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 15;
    this.type = type;
    this.birdData = BIRD_TYPES[type];
    this.launched = false;
    this.abilityUsed = false;
    this.active = true;
    this.trailPoints = [];
    this.rotation = 0;
  }

  update() {
    if (this.launched && this.active) {
      // Apply gravity
      this.vy += 0.5;
      
      // Apply air resistance
      this.vx *= 0.99;
      this.vy *= 0.99;
      
      // Update position
      this.x += this.vx;
      this.y += this.vy;
      
      // Update rotation based on velocity
      this.rotation = this.p.atan2(this.vy, this.vx);
      
      // Add trail point
      if (this.p.frameCount % 3 === 0) {
        this.trailPoints.push({ x: this.x, y: this.y });
        if (this.trailPoints.length > 15) {
          this.trailPoints.shift();
        }
      }
      
      // Check if off screen or stopped
      if (this.y > CANVAS_HEIGHT + 50 || this.x < -50 || this.x > CANVAS_WIDTH + 400) {
        this.active = false;
      }
      
      // Check if velocity is very low (stopped)
      if (this.launched && Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5 && this.y > CANVAS_HEIGHT - 100) {
        this.active = false;
      }
    }
  }

  launch(angle, power) {
    this.launched = true;
    const radians = this.p.radians(angle);
    this.vx = this.p.cos(radians) * power * 0.2;
    this.vy = this.p.sin(radians) * power * 0.2;
  }

  activateAbility() {
    if (this.abilityUsed || !this.launched) return;
    
    this.abilityUsed = true;
    
    switch (this.type) {
      case "BLUE":
        // Split into 3 birds
        return this.splitBird();
      case "YELLOW":
        // Speed boost
        this.vx *= 2.5;
        this.vy *= 2.5;
        createParticles(this.p, this.x, this.y, 20, [240, 220, 40]);
        break;
      case "BLACK":
        // Explode
        createExplosion(this.p, this.x, this.y);
        this.active = false;
        break;
    }
    return [];
  }

  splitBird() {
    const splitBirds = [];
    for (let i = -1; i <= 1; i++) {
      const newBird = new Bird(this.p, this.x, this.y, "BLUE");
      newBird.launched = true;
      newBird.vx = this.vx + i * 3;
      newBird.vy = this.vy - 2;
      newBird.abilityUsed = true;
      newBird.radius = 10;
      splitBirds.push(newBird);
    }
    this.active = false;
    return splitBirds;
  }

  draw() {
    const p = this.p;
    
    // Draw trail
    for (let i = 0; i < this.trailPoints.length; i++) {
      const alpha = (i / this.trailPoints.length) * 150;
      p.fill(...this.birdData.color, alpha);
      p.noStroke();
      const size = (i / this.trailPoints.length) * this.radius;
      p.circle(this.trailPoints[i].x, this.trailPoints[i].y, size);
    }
    
    // Draw bird
    p.push();
    p.translate(this.x, this.y);
    if (this.launched) {
      p.rotate(this.rotation);
    }
    
    // Body
    p.fill(...this.birdData.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Eye
    p.fill(255);
    p.circle(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.6);
    p.fill(0);
    p.circle(this.radius * 0.4, -this.radius * 0.2, this.radius * 0.3);
    
    // Beak
    p.fill(255, 150, 0);
    p.triangle(
      this.radius * 0.6, 0,
      this.radius * 1.1, -this.radius * 0.2,
      this.radius * 1.1, this.radius * 0.2
    );
    
    p.pop();
    
    // Draw ability indicator if not used
    if (!this.abilityUsed && this.launched && this.type !== "RED") {
      p.fill(255, 255, 0, 150);
      p.noStroke();
      p.circle(this.x, this.y - this.radius - 10, 8);
    }
  }
}

export class Pig {
  constructor(p, x, y, health = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.health = health;
    this.maxHealth = health;
    this.alive = true;
    this.hitAnimation = 0;
  }

  takeDamage(damage) {
    this.health -= damage;
    this.hitAnimation = 10;
    
    if (this.health <= 0) {
      this.alive = false;
      gameState.score += 100 * this.maxHealth;
      gameState.gems += 5 * this.maxHealth;
      createParticles(this.p, this.x, this.y, 30, [100, 200, 100]);
    }
  }

  update() {
    if (this.hitAnimation > 0) {
      this.hitAnimation--;
    }
  }

  draw() {
    const p = this.p;
    
    p.push();
    
    // Shake animation when hit
    if (this.hitAnimation > 0) {
      p.translate(p.random(-3, 3), p.random(-3, 3));
    }
    
    // Body
    p.fill(100, 200, 100);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Eyes
    p.fill(255);
    p.circle(this.x - 6, this.y - 4, 8);
    p.circle(this.x + 6, this.y - 4, 8);
    p.fill(0);
    p.circle(this.x - 6, this.y - 4, 4);
    p.circle(this.x + 6, this.y - 4, 4);
    
    // Snout
    p.fill(150, 220, 150);
    p.ellipse(this.x, this.y + 6, 12, 8);
    p.fill(0);
    p.circle(this.x - 3, this.y + 6, 3);
    p.circle(this.x + 3, this.y + 6, 3);
    
    // Ears
    p.fill(100, 200, 100);
    p.ellipse(this.x - 12, this.y - 12, 8, 12);
    p.ellipse(this.x + 12, this.y - 12, 8, 12);
    
    p.pop();
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = 30;
      const barHeight = 4;
      p.fill(255, 0, 0);
      p.noStroke();
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
      p.fill(0, 255, 0);
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * (this.health / this.maxHealth), barHeight);
    }
  }
}

export class Structure {
  constructor(p, x, y, width, height, type = "WOOD") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.health = type === "WOOD" ? 1 : type === "STONE" ? 2 : 3;
    this.maxHealth = this.health;
    this.destroyed = false;
    this.rotation = 0;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.destroyed = true;
      gameState.score += 50;
      const color = this.type === "WOOD" ? [150, 100, 50] : [150, 150, 150];
      createParticles(this.p, this.x, this.y, 15, color);
    }
  }

  draw() {
    if (this.destroyed) return;
    
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Material color based on type
    if (this.type === "WOOD") {
      p.fill(150, 100, 50);
    } else if (this.type === "STONE") {
      p.fill(120, 120, 120);
    } else {
      p.fill(80, 80, 100);
    }
    
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Texture lines
    p.stroke(0, 50);
    p.strokeWeight(1);
    if (this.type === "WOOD") {
      for (let i = 0; i < 3; i++) {
        p.line(-this.width / 2 + i * 10, -this.height / 2, -this.width / 2 + i * 10, this.height / 2);
      }
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, life) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = p.random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.vx *= 0.98;
    this.life--;
  }

  draw() {
    const alpha = (this.life / this.maxLife) * 255;
    this.p.fill(...this.color, alpha);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.size);
  }

  isAlive() {
    return this.life > 0;
  }
}

function createParticles(p, x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(2, 6);
    const particle = new Particle(
      p,
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      30
    );
    gameState.particles.push(particle);
  }
}

function createExplosion(p, x, y) {
  // Create explosion particles
  createParticles(p, x, y, 50, [255, 150, 0]);
  
  // Damage nearby entities
  const explosionRadius = 60;
  
  gameState.pigs.forEach(pig => {
    const dist = p.dist(x, y, pig.x, pig.y);
    if (dist < explosionRadius) {
      pig.takeDamage(2);
    }
  });
  
  gameState.structures.forEach(structure => {
    const dist = p.dist(x, y, structure.x, structure.y);
    if (dist < explosionRadius) {
      structure.takeDamage(1);
    }
  });
}