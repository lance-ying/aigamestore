// entities.js - Entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.health = gameState.towerMaxHealth;
    this.damageFlashTimer = 0;
  }
  
  update(p) {
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer--;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.damageFlashTimer = 15;
    gameState.towerHealth = this.health;
    if (this.health <= 0) {
      this.health = 0;
    }
  }
  
  render(p) {
    p.push();
    
    // Main tower body
    if (this.damageFlashTimer > 0 && this.damageFlashTimer % 4 < 2) {
      p.fill(255, 100, 100);
    } else {
      p.fill(60, 80, 120);
    }
    p.stroke(40, 60, 100);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height, this.width, this.height);
    
    // Tower segments
    p.fill(50, 70, 110);
    for (let i = 0; i < 3; i++) {
      p.rect(this.x - this.width / 2 + 2, this.y - this.height + i * 20 + 2, this.width - 4, 16);
    }
    
    // Weapon mounts
    for (let i = 0; i < gameState.activeWeaponSlots; i++) {
      const weapon = gameState.weapons[i];
      if (weapon && weapon.unlocked) {
        const offsetX = gameState.activeWeaponSlots === 1 ? 0 : (i === 0 ? -15 : 15);
        if (weapon.type === "cannon") {
          p.fill(180, 50, 50);
          p.rect(this.x + offsetX - 5, this.y - this.height - 8, 10, 15);
          p.fill(100, 30, 30);
          p.rect(this.x + offsetX - 3, this.y - this.height - 10, 6, 10);
        } else if (weapon.type === "machinegun") {
          p.fill(50, 180, 50);
          p.rect(this.x + offsetX - 4, this.y - this.height - 6, 8, 12);
          p.fill(30, 100, 30);
          p.rect(this.x + offsetX - 2, this.y - this.height - 8, 4, 8);
        }
      }
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, damage, weaponType) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = 8;
    this.radius = weaponType === "cannon" ? 4 : 3;
    this.weaponType = weaponType;
    this.active = true;
  }
  
  update(p) {
    this.x += this.speed;
    
    if (this.x > CANVAS_WIDTH) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.noStroke();
    if (this.weaponType === "cannon") {
      p.fill(255, 220, 100);
    } else {
      p.fill(100, 255, 100);
    }
    p.circle(this.x, this.y, this.radius * 2);
    
    // Bullet trail
    p.fill(255, 255, 255, 100);
    p.circle(this.x - 4, this.y, this.radius);
    p.pop();
  }
}

export class Zombie {
  constructor(x, y, type, level) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.hitFlashTimer = 0;
    
    const levelMultiplier = gameState.levels[level - 1].zombieSpeed;
    
    switch (type) {
      case "basic":
        this.health = 40;
        this.maxHealth = 40;
        this.speed = 1.0 * levelMultiplier;
        this.damage = 10;
        this.width = 30;
        this.height = 35;
        this.color = [80, 180, 80];
        this.scoreValue = 10;
        break;
      case "fast":
        this.health = 25;
        this.maxHealth = 25;
        this.speed = 2.5 * levelMultiplier;
        this.damage = 5;
        this.width = 25;
        this.height = 30;
        this.color = [220, 220, 80];
        this.scoreValue = 25;
        break;
      case "tank":
        this.health = 120;
        this.maxHealth = 120;
        this.speed = 0.6 * levelMultiplier;
        this.damage = 25;
        this.width = 45;
        this.height = 50;
        this.color = [180, 80, 60];
        this.scoreValue = 50;
        break;
    }
  }
  
  update(p) {
    this.x -= this.speed;
    
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer--;
    }
    
    // Check collision with tower
    if (gameState.player && this.active) {
      const tower = gameState.player;
      if (this.x - this.width / 2 < tower.x + tower.width / 2 &&
          this.x + this.width / 2 > tower.x - tower.width / 2 &&
          this.y - this.height / 2 < tower.y &&
          this.y + this.height / 2 > tower.y - tower.height) {
        tower.takeDamage(this.damage);
        this.active = false;
        createHitParticles(p, this.x, this.y, [255, 100, 100]);
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlashTimer = 5;
    if (this.health <= 0) {
      this.active = false;
      gameState.score += this.scoreValue;
      return true;
    }
    return false;
  }
  
  render(p) {
    p.push();
    
    // Body
    if (this.hitFlashTimer > 0 && this.hitFlashTimer % 2 === 0) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...this.color);
    }
    p.stroke(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Eyes
    p.fill(20);
    p.noStroke();
    p.circle(this.x - this.width / 4, this.y - this.height / 4, 6);
    p.circle(this.x + this.width / 4, this.y - this.height / 4, 6);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(50);
      p.rect(this.x - this.width / 2, this.y - this.height / 2 - 8, this.width, 4);
      p.fill(200, 50, 50);
      p.rect(this.x - this.width / 2, this.y - this.height / 2 - 8, 
             this.width * (this.health / this.maxHealth), 4);
    }
    
    // Speed indicator for fast zombies
    if (this.type === "fast") {
      p.stroke(220, 220, 80, 150);
      p.strokeWeight(2);
      p.noFill();
      p.line(this.x + this.width / 2, this.y - 5, this.x + this.width / 2 + 10, this.y - 5);
      p.line(this.x + this.width / 2, this.y, this.x + this.width / 2 + 8, this.y);
      p.line(this.x + this.width / 2, this.y + 5, this.x + this.width / 2 + 10, this.y + 5);
    }
    
    p.pop();
  }
}

export class Block {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 15;
    this.active = true;
    this.floatOffset = 0;
    this.floatSpeed = 0.1;
  }
  
  update(p) {
    this.floatOffset += this.floatSpeed;
    
    // Check collision with tower
    if (gameState.player && this.active) {
      const tower = gameState.player;
      if (this.x - this.size / 2 < tower.x + tower.width / 2 &&
          this.x + this.size / 2 > tower.x - tower.width / 2 &&
          this.y - this.size / 2 < tower.y &&
          this.y + this.size / 2 > tower.y - tower.height) {
        this.active = false;
        gameState.blocksCollected++;
        gameState.score += 5;
        createCollectParticles(p, this.x, this.y);
      }
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y + Math.sin(this.floatOffset) * 5);
    p.rotate(this.floatOffset * 0.5);
    
    p.fill(80, 180, 255);
    p.stroke(60, 140, 200);
    p.strokeWeight(2);
    p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    
    p.fill(120, 200, 255, 150);
    p.noStroke();
    p.rect(-this.size / 2 + 2, -this.size / 2 + 2, this.size - 4, this.size - 4);
    
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
    this.active = true;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

function createHitParticles(p, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      20 + Math.floor(Math.random() * 10)
    );
    gameState.particles.push(particle);
  }
}

function createCollectParticles(p, x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const speed = 3 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      [80, 180, 255],
      15 + Math.floor(Math.random() * 10)
    );
    gameState.particles.push(particle);
  }
}