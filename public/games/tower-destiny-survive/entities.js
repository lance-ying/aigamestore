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
    // Reset combo on taking damage
    gameState.comboCount = 0;
    gameState.comboTimer = 0;
    gameState.comboMultiplier = 1;
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
    
    // Direction indicator
    p.fill(255, 255, 100);
    const indicatorX = gameState.facingRight ? this.x + this.width / 2 + 5 : this.x - this.width / 2 - 5;
    p.triangle(
      indicatorX, this.y - this.height / 2,
      indicatorX + (gameState.facingRight ? 6 : -6), this.y - this.height / 2 - 8,
      indicatorX + (gameState.facingRight ? 6 : -6), this.y - this.height / 2 + 8
    );
    
    // Weapon mounts
    for (let i = 0; i < gameState.activeWeaponSlots; i++) {
      const weapon = gameState.weapons[i];
      if (weapon && weapon.unlocked) {
        const offsetX = gameState.activeWeaponSlots === 1 ? 0 : (i === 0 ? -15 : 15);
        const directionFlip = gameState.facingRight ? 1 : -1;
        if (weapon.type === "cannon") {
          p.fill(180, 50, 50);
          p.rect(this.x + offsetX * directionFlip - 5, this.y - this.height - 8, 10, 15);
          p.fill(100, 30, 30);
          p.rect(this.x + offsetX * directionFlip - 3, this.y - this.height - 10, 6, 10);
        } else if (weapon.type === "machinegun") {
          p.fill(50, 180, 50);
          p.rect(this.x + offsetX * directionFlip - 4, this.y - this.height - 6, 8, 12);
          p.fill(30, 100, 30);
          p.rect(this.x + offsetX * directionFlip - 2, this.y - this.height - 8, 4, 8);
        }
      }
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, damage, weaponType, direction, angle) {
    this.x = x;
    this.y = y;
    this.damage = damage + gameState.powerupEffects.damageBoost;
    this.speed = 8;
    this.direction = direction; // 1 for right, -1 for left
    this.angle = angle; // angle in degrees
    this.radius = weaponType === "cannon" ? 4 : 3;
    this.weaponType = weaponType;
    this.active = true;
    
    // Calculate velocity components based on angle
    const angleRad = (angle * Math.PI) / 180;
    this.vx = Math.cos(angleRad) * this.speed * this.direction;
    this.vy = Math.sin(angleRad) * this.speed;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Extend bullet lifetime to reach zombies
    if (this.x > CANVAS_WIDTH + 50 || this.x < -50 || this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
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
    p.circle(this.x - 4 * this.direction, this.y, this.radius);
    p.pop();
  }
}

export class Zombie {
  constructor(x, y, type, level, movingLeft) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.movingLeft = movingLeft; // true if moving left, false if moving right
    this.active = true;
    this.hitFlashTimer = 0;
    
    const levelMultiplier = gameState.levels[level - 1].zombieSpeed;
    
    // All zombies now have same dimensions - narrow rectangles
    this.width = 20;  // Narrow width
    this.height = 40; // Tall height
    
    switch (type) {
      case "basic":
        this.health = 40;
        this.maxHealth = 40;
        this.speed = 1.0 * levelMultiplier;
        this.damage = 10;
        this.color = [80, 180, 80];
        this.scoreValue = 10;
        break;
      case "fast":
        this.health = 25;
        this.maxHealth = 25;
        this.speed = 2.5 * levelMultiplier;
        this.damage = 5;
        this.color = [220, 220, 80];
        this.scoreValue = 25;
        break;
      case "tank":
        this.health = 120;
        this.maxHealth = 120;
        this.speed = 0.6 * levelMultiplier;
        this.damage = 25;
        this.color = [180, 80, 60];
        this.scoreValue = 50;
        break;
    }
  }
  
  update(p) {
    this.x += this.movingLeft ? -this.speed : this.speed;
    
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
      
      // Combo system
      gameState.comboCount++;
      gameState.comboTimer = gameState.comboTimeLimit;
      gameState.comboMultiplier = 1 + Math.floor(gameState.comboCount / 5) * 0.5;
      
      const scoreGain = Math.floor(this.scoreValue * gameState.comboMultiplier);
      gameState.score += scoreGain;
      
      return true;
    }
    return false;
  }
  
  render(p) {
    p.push();
    
    // Body - now consistently a narrow rectangle
    if (this.hitFlashTimer > 0 && this.hitFlashTimer % 2 === 0) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...this.color);
    }
    p.stroke(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 3);
    
    // Eyes
    p.fill(20);
    p.noStroke();
    p.circle(this.x - this.width / 4, this.y - this.height / 3, 4);
    p.circle(this.x + this.width / 4, this.y - this.height / 3, 4);
    
    // Type indicator on body
    p.fill(0, 0, 0, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    if (this.type === "fast") {
      p.text("F", this.x, this.y + 5);
    } else if (this.type === "tank") {
      p.text("T", this.x, this.y + 5);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(50);
      p.rect(this.x - this.width / 2, this.y - this.height / 2 - 8, this.width, 3);
      p.fill(200, 50, 50);
      p.rect(this.x - this.width / 2, this.y - this.height / 2 - 8, 
             this.width * (this.health / this.maxHealth), 3);
    }
    
    // Speed indicator for fast zombies
    if (this.type === "fast") {
      p.stroke(220, 220, 80, 150);
      p.strokeWeight(1);
      p.noFill();
      const dir = this.movingLeft ? -1 : 1;
      p.line(this.x + this.width / 2 * dir, this.y - 5, this.x + (this.width / 2 + 6) * dir, this.y - 5);
      p.line(this.x + this.width / 2 * dir, this.y, this.x + (this.width / 2 + 5) * dir, this.y);
      p.line(this.x + this.width / 2 * dir, this.y + 5, this.x + (this.width / 2 + 6) * dir, this.y + 5);
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

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "health", "energy", "damage"
    this.size = 12;
    this.active = true;
    this.floatOffset = 0;
    this.floatSpeed = 0.15;
    this.lifetime = 300; // 5 seconds
    
    switch (type) {
      case "health":
        this.color = [100, 255, 100];
        this.value = 30;
        break;
      case "energy":
        this.color = [100, 200, 255];
        this.value = 50;
        break;
      case "damage":
        this.color = [255, 150, 50];
        this.value = 10;
        this.duration = 300; // 5 seconds
        break;
    }
  }
  
  update(p) {
    this.floatOffset += this.floatSpeed;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    // Check collision with tower
    if (gameState.player && this.active) {
      const tower = gameState.player;
      const distance = Math.sqrt(
        Math.pow(this.x - tower.x, 2) + 
        Math.pow(this.y - (tower.y - tower.height / 2), 2)
      );
      
      if (distance < this.size + tower.width / 2) {
        this.active = false;
        this.applyEffect();
        createCollectParticles(p, this.x, this.y, this.color);
      }
    }
  }
  
  applyEffect() {
    switch (this.type) {
      case "health":
        gameState.towerHealth = Math.min(gameState.towerHealth + this.value, gameState.towerMaxHealth);
        if (gameState.player) {
          gameState.player.health = gameState.towerHealth;
        }
        break;
      case "energy":
        gameState.energy = Math.min(gameState.energy + this.value, gameState.maxEnergy);
        break;
      case "damage":
        gameState.powerupEffects.damageBoost += this.value;
        gameState.powerupEffects.damageBoostTimer = this.duration;
        break;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y + Math.sin(this.floatOffset) * 4);
    
    // Fade out when lifetime is low
    const alpha = this.lifetime < 60 ? (this.lifetime / 60) * 255 : 255;
    
    p.fill(...this.color, alpha);
    p.stroke(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30, alpha);
    p.strokeWeight(2);
    p.circle(0, 0, this.size * 2);
    
    // Icon
    p.fill(255, 255, 255, alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    if (this.type === "health") {
      p.text("+", 0, 0);
    } else if (this.type === "energy") {
      p.text("E", 0, 0);
    } else if (this.type === "damage") {
      p.text("!", 0, 0);
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

function createCollectParticles(p, x, y, color = [80, 180, 255]) {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const speed = 3 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      color,
      15 + Math.floor(Math.random() * 10)
    );
    gameState.particles.push(particle);
  }
}