// entities.js - Entity classes for plants, zombies, projectiles, etc.

import { 
  gameState, 
  GRID_ROWS, 
  GRID_COLS,
  getGridPosition,
  CELL_WIDTH,
  CELL_HEIGHT,
  SUNFLOWER_PRODUCTION_INTERVAL,
  SUN_VALUE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';

// Base Entity class
export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.active = true;
  }
  
  update(p) {
    // Override in subclasses
  }
  
  render(p) {
    // Override in subclasses
  }
  
  destroy() {
    this.active = false;
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
  }
}

// Plant base class
export class Plant extends Entity {
  constructor(row, col, type) {
    const pos = getGridPosition(row, col);
    super(pos.x, pos.y);
    this.row = row;
    this.col = col;
    this.type = type;
    this.health = 100;
    this.maxHealth = 100;
    this.attackTimer = 0;
    this.productionTimer = 0;
    
    gameState.plants[row][col] = this;
    gameState.entities.push(this);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.plants[this.row][this.col] = null;
    this.destroy();
    
    // Create death particles
    for (let i = 0; i < 8; i++) {
      gameState.particles.push(new Particle(this.x, this.y, [100, 200, 100]));
    }
  }
  
  update(p) {
    // Override in subclasses
  }
  
  renderHealthBar(p) {
    if (this.health < this.maxHealth) {
      const barWidth = 35;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.height / 2 - 10;
      
      // Background
      p.fill(100, 0, 0);
      p.noStroke();
      p.rect(barX, barY, barWidth, barHeight);
      
      // Health
      p.fill(0, 255, 0);
      p.rect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
      
      // Border
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(barX, barY, barWidth, barHeight);
    }
  }
}

// Sunflower - generates sun
export class Sunflower extends Plant {
  constructor(row, col) {
    super(row, col, 'SUNFLOWER');
    this.health = 100;
    this.maxHealth = 100;
    this.productionTimer = SUNFLOWER_PRODUCTION_INTERVAL;
  }
  
  update(p) {
    this.productionTimer--;
    if (this.productionTimer <= 0) {
      this.produceSun();
      this.productionTimer = SUNFLOWER_PRODUCTION_INTERVAL;
    }
  }
  
  produceSun() {
    const sun = new SunDrop(this.x, this.y, true);
    gameState.sunDrops.push(sun);
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Stem
    p.fill(50, 150, 50);
    p.noStroke();
    p.rect(-3, 5, 6, 15);
    
    // Petals (yellow)
    p.fill(255, 220, 0);
    p.stroke(200, 180, 0);
    p.strokeWeight(2);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const px = p.cos(angle) * 12;
      const py = p.sin(angle) * 12;
      p.circle(px, py, 10);
    }
    
    // Center
    p.fill(255, 180, 0);
    p.stroke(200, 140, 0);
    p.strokeWeight(2);
    p.circle(0, 0, 18);
    
    // Face
    p.fill(0);
    p.noStroke();
    p.circle(-5, -2, 3); // left eye
    p.circle(5, -2, 3);  // right eye
    p.arc(0, 3, 10, 8, 0, p.PI); // smile
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Peashooter - shoots peas at zombies
export class Peashooter extends Plant {
  constructor(row, col) {
    super(row, col, 'PEASHOOTER');
    this.health = 100;
    this.maxHealth = 100;
    this.attackTimer = 0;
    this.attackRate = 90; // frames between shots
  }
  
  update(p) {
    this.attackTimer++;
    
    // Check if there's a zombie in this row
    const zombieInRow = gameState.zombies.some(z => z.row === this.row && z.x > this.x);
    
    if (zombieInRow && this.attackTimer >= this.attackRate) {
      this.shoot();
      this.attackTimer = 0;
    }
  }
  
  shoot() {
    const projectile = new Pea(this.x + 20, this.y, this.row);
    gameState.projectiles.push(projectile);
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Stem
    p.fill(50, 150, 50);
    p.noStroke();
    p.rect(-3, 5, 6, 15);
    
    // Head
    p.fill(100, 200, 100);
    p.stroke(70, 170, 70);
    p.strokeWeight(2);
    p.circle(0, 0, 28);
    
    // Mouth/shooter
    p.fill(50, 100, 50);
    p.noStroke();
    p.circle(12, 0, 12);
    
    // Eyes
    p.fill(255);
    p.circle(-6, -4, 8);
    p.circle(6, -4, 8);
    p.fill(0);
    p.circle(-6, -4, 4);
    p.circle(6, -4, 4);
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Wallnut - defensive plant with high health
export class Wallnut extends Plant {
  constructor(row, col) {
    super(row, col, 'WALLNUT');
    this.health = 400;
    this.maxHealth = 400;
  }
  
  update(p) {
    // Wallnut doesn't do anything, just blocks
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Determine crack level based on health
    const healthPercent = this.health / this.maxHealth;
    let crackLevel = 0;
    if (healthPercent < 0.3) crackLevel = 2;
    else if (healthPercent < 0.6) crackLevel = 1;
    
    // Shell
    p.fill(139, 90, 43);
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    p.circle(0, 0, 35);
    
    // Shell pattern
    p.noFill();
    p.stroke(101, 67, 33);
    p.strokeWeight(1);
    p.arc(-10, -5, 15, 15, 0, p.PI);
    p.arc(10, -5, 15, 15, 0, p.PI);
    p.arc(0, 5, 15, 15, p.PI, p.TWO_PI);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    p.circle(-8, -5, 6);
    p.circle(8, -5, 6);
    p.fill(0);
    p.circle(-8, -5, 3);
    p.circle(8, -5, 3);
    
    // Draw cracks based on damage
    if (crackLevel > 0) {
      p.stroke(80, 50, 20);
      p.strokeWeight(2);
      p.line(-12, -8, -5, 0);
      p.line(12, -8, 5, 0);
    }
    if (crackLevel > 1) {
      p.line(-8, 10, 0, 5);
      p.line(8, 10, 0, 5);
    }
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Cherry Bomb - explosive plant
export class CherryBomb extends Plant {
  constructor(row, col) {
    super(row, col, 'CHERRY_BOMB');
    this.health = 100;
    this.maxHealth = 100;
    this.fuseTimer = 90; // explodes after 1.5 seconds
    this.pulsePhase = 0;
  }
  
  update(p) {
    this.fuseTimer--;
    this.pulsePhase += 0.3;
    
    if (this.fuseTimer <= 0) {
      this.explode();
    }
  }
  
  explode() {
    // Damage all zombies in 3x3 area
    const explosionRadius = 150;
    
    gameState.zombies.forEach(zombie => {
      const dx = zombie.x - this.x;
      const dy = zombie.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < explosionRadius) {
        zombie.takeDamage(1800); // Instant kill
      }
    });
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      const particle = new Particle(this.x, this.y, [255, 100, 0]);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      gameState.particles.push(particle);
    }
    
    this.die();
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Pulsing effect as it's about to explode
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
    p.scale(pulseScale);
    
    // Two cherries
    const positions = [
      { x: -8, y: -3 },
      { x: 8, y: -3 }
    ];
    
    positions.forEach(pos => {
      // Cherry body
      p.fill(200, 0, 0);
      p.stroke(150, 0, 0);
      p.strokeWeight(2);
      p.circle(pos.x, pos.y, 18);
      
      // Highlight
      p.fill(255, 100, 100);
      p.noStroke();
      p.circle(pos.x - 4, pos.y - 4, 5);
      
      // Eyes (angry)
      p.fill(255);
      p.circle(pos.x - 3, pos.y, 4);
      p.circle(pos.x + 3, pos.y, 4);
      p.fill(0);
      p.circle(pos.x - 3, pos.y, 2);
      p.circle(pos.x + 3, pos.y, 2);
    });
    
    // Stem
    p.stroke(50, 150, 50);
    p.strokeWeight(3);
    p.noFill();
    p.arc(0, -8, 20, 10, p.PI, p.TWO_PI);
    
    // Fuse timer indicator
    if (this.fuseTimer < 45) {
      p.fill(255, 200, 0);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(Math.ceil(this.fuseTimer / 60), 0, 15);
    }
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Zombie base class
export class Zombie extends Entity {
  constructor(row, type = 'BASIC') {
    const pos = getGridPosition(row, GRID_COLS);
    super(pos.x + 50, pos.y);
    this.row = row;
    this.type = type;
    this.width = 35;
    this.height = 50;
    this.speed = 0.3;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 20;
    this.attackRate = 60; // frames between attacks
    this.attackTimer = 0;
    this.isEating = false;
    this.targetPlant = null;
    this.walkPhase = 0;
    
    gameState.zombies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Check for plant in front
    this.checkForPlant();
    
    if (this.isEating && this.targetPlant) {
      // Attack plant
      this.attackTimer++;
      if (this.attackTimer >= this.attackRate) {
        this.attackPlant();
        this.attackTimer = 0;
      }
    } else {
      // Move left
      this.x -= this.speed;
      this.walkPhase += 0.1;
      this.isEating = false;
      this.targetPlant = null;
      
      // Check if reached house
      if (this.x < 50) {
        this.reachHouse();
      }
    }
  }
  
  checkForPlant() {
    // Check all plants in this row
    for (let col = 0; col < GRID_COLS; col++) {
      const plant = gameState.plants[this.row][col];
      if (plant && plant.active) {
        const distance = Math.abs(this.x - plant.x);
        if (distance < 40) {
          this.isEating = true;
          this.targetPlant = plant;
          return;
        }
      }
    }
  }
  
  attackPlant() {
    if (this.targetPlant && this.targetPlant.active) {
      this.targetPlant.takeDamage(this.damage);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.zombiesKilled++;
    gameState.score += 10;
    
    const index = gameState.zombies.indexOf(this);
    if (index > -1) {
      gameState.zombies.splice(index, 1);
    }
    
    // Create death particles
    for (let i = 0; i < 10; i++) {
      gameState.particles.push(new Particle(this.x, this.y, [100, 100, 100]));
    }
    
    this.destroy();
  }
  
  reachHouse() {
    // Game over - zombie reached the house
    gameState.gamePhase = "GAME_OVER_LOSE";
    this.die();
  }
  
  renderHealthBar(p) {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 8;
    
    // Background
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    p.fill(255, 0, 0);
    p.rect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
    
    // Border
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
  }
}

// Basic Zombie
export class BasicZombie extends Zombie {
  constructor(row) {
    super(row, 'BASIC');
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 0.3;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(100, 150, 100);
    p.stroke(70, 120, 70);
    p.strokeWeight(2);
    p.rect(-12, -5, 24, 25, 5);
    
    // Head
    p.fill(150, 200, 150);
    p.circle(0, -18, 20);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-5, -18, 4);
    p.circle(5, -18, 4);
    
    // Mouth
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, -15, 10, 8, 0, p.PI);
    
    // Arms (walking animation)
    const armSwing = Math.sin(this.walkPhase) * 15;
    p.stroke(100, 150, 100);
    p.strokeWeight(4);
    p.line(-10, 0, -15, 10 + armSwing);
    p.line(10, 0, 15, 10 - armSwing);
    
    // Legs
    p.line(-6, 20, -8, 30 - armSwing);
    p.line(6, 20, 8, 30 + armSwing);
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Cone Zombie - wears a cone for extra protection
export class ConeZombie extends Zombie {
  constructor(row) {
    super(row, 'CONE');
    this.health = 200;
    this.maxHealth = 200;
    this.speed = 0.3;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(100, 150, 100);
    p.stroke(70, 120, 70);
    p.strokeWeight(2);
    p.rect(-12, -5, 24, 25, 5);
    
    // Head
    p.fill(150, 200, 150);
    p.circle(0, -18, 20);
    
    // Cone
    p.fill(255, 150, 0);
    p.stroke(200, 100, 0);
    p.strokeWeight(2);
    p.triangle(-10, -25, 10, -25, 0, -35);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-5, -18, 4);
    p.circle(5, -18, 4);
    
    // Mouth
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, -15, 10, 8, 0, p.PI);
    
    // Arms
    const armSwing = Math.sin(this.walkPhase) * 15;
    p.stroke(100, 150, 100);
    p.strokeWeight(4);
    p.line(-10, 0, -15, 10 + armSwing);
    p.line(10, 0, 15, 10 - armSwing);
    
    // Legs
    p.line(-6, 20, -8, 30 - armSwing);
    p.line(6, 20, 8, 30 + armSwing);
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Bucket Zombie - wears a bucket for maximum protection
export class BucketZombie extends Zombie {
  constructor(row) {
    super(row, 'BUCKET');
    this.health = 400;
    this.maxHealth = 400;
    this.speed = 0.25;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(100, 150, 100);
    p.stroke(70, 120, 70);
    p.strokeWeight(2);
    p.rect(-12, -5, 24, 25, 5);
    
    // Head
    p.fill(150, 200, 150);
    p.circle(0, -18, 20);
    
    // Bucket
    p.fill(150, 150, 150);
    p.stroke(100, 100, 100);
    p.strokeWeight(2);
    p.rect(-12, -32, 24, 14, 0, 0, 5, 5);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-5, -18, 4);
    p.circle(5, -18, 4);
    
    // Mouth
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, -15, 10, 8, 0, p.PI);
    
    // Arms
    const armSwing = Math.sin(this.walkPhase) * 15;
    p.stroke(100, 150, 100);
    p.strokeWeight(4);
    p.line(-10, 0, -15, 10 + armSwing);
    p.line(10, 0, 15, 10 - armSwing);
    
    // Legs
    p.line(-6, 20, -8, 30 - armSwing);
    p.line(6, 20, 8, 30 + armSwing);
    
    p.pop();
    
    this.renderHealthBar(p);
  }
}

// Projectile - Pea shot by Peashooter
export class Pea extends Entity {
  constructor(x, y, row) {
    super(x, y);
    this.row = row;
    this.width = 8;
    this.height = 8;
    this.speed = 4;
    this.damage = 20;
    
    gameState.projectiles.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.speed;
    
    // Check collision with zombies
    for (const zombie of gameState.zombies) {
      if (zombie.row === this.row) {
        const dx = this.x - zombie.x;
        const dy = this.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
          zombie.takeDamage(this.damage);
          this.destroy();
          
          // Impact particle
          gameState.particles.push(new Particle(this.x, this.y, [150, 255, 150]));
          return;
        }
      }
    }
    
    // Remove if off screen
    if (this.x > CANVAS_WIDTH + 50) {
      this.destroy();
    }
  }
  
  destroy() {
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
    super.destroy();
  }
  
  render(p) {
    p.fill(150, 255, 150);
    p.stroke(100, 200, 100);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 8);
  }
}

// Sun drop - collectible resource
export class SunDrop extends Entity {
  constructor(x, y, fromPlant = false) {
    super(x, y);
    this.width = 30;
    this.height = 30;
    this.value = SUN_VALUE;
    this.lifetime = fromPlant ? 240 : 600; // 4 seconds for plant sun, 10 for sky sun
    this.age = 0;
    this.vy = fromPlant ? -2 : 1;
    this.targetY = fromPlant ? y - 30 : Math.random() * (CANVAS_HEIGHT - 100) + 50;
    this.falling = !fromPlant;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    gameState.sunDrops.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.age++;
    this.pulsePhase += 0.1;
    
    // Movement
    if (this.falling) {
      this.y += this.vy;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.vy = 0;
        this.falling = false;
      }
    } else if (this.vy !== 0) {
      this.y += this.vy;
      this.vy *= 0.9;
      if (Math.abs(this.vy) < 0.1) {
        this.vy = 0;
      }
    }
    
    // Expire
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  collect() {
    gameState.sun += this.value;
    this.destroy();
    
    // Particle effect
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new Particle(this.x, this.y, [255, 255, 0]));
    }
  }
  
  destroy() {
    const index = gameState.sunDrops.indexOf(this);
    if (index > -1) {
      gameState.sunDrops.splice(index, 1);
    }
    super.destroy();
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Pulsing scale
    const scale = 1 + Math.sin(this.pulsePhase) * 0.1;
    p.scale(scale);
    
    // Sun rays
    p.fill(255, 255, 150, 100);
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      p.push();
      p.rotate((i / 8) * p.TWO_PI);
      p.triangle(0, 0, -5, -20, 5, -20);
      p.pop();
    }
    
    // Sun body
    p.fill(255, 255, 0);
    p.stroke(255, 220, 0);
    p.strokeWeight(2);
    p.circle(0, 0, 25);
    
    // Highlight
    p.fill(255, 255, 150);
    p.noStroke();
    p.circle(-5, -5, 8);
    
    // Value text
    p.fill(255, 150, 0);
    p.stroke(255, 100, 0);
    p.strokeWeight(1);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.value, 0, 0);
    
    p.pop();
  }
}

// Particle effect
export class Particle extends Entity {
  constructor(x, y, color) {
    super(x, y);
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.lifetime = 30 + Math.random() * 20;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.color = color;
    
    gameState.particles.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += gameState.gravity * 0.5;
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  destroy() {
    const index = gameState.particles.indexOf(this);
    if (index > -1) {
      gameState.particles.splice(index, 1);
    }
    super.destroy();
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}