// entities.js - Monster, Hero, and Projectile classes

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  MONSTER_TYPES,
  gameState
} from './globals.js';

export class Monster {
  constructor(slotIndex, typeIndex, p) {
    this.p = p;
    this.slotIndex = slotIndex;
    this.typeIndex = typeIndex;
    const type = MONSTER_TYPES[typeIndex];
    
    this.name = type.name;
    this.maxHealth = type.health * gameState.modifiers.healthMultiplier;
    this.health = this.maxHealth;
    this.damage = type.damage * gameState.modifiers.damageMultiplier;
    this.attackSpeed = type.attackSpeed / gameState.modifiers.attackSpeedMultiplier;
    this.range = type.range * gameState.modifiers.rangeMultiplier;
    this.color = type.color;
    
    this.skillName = type.skillName;
    this.skillCooldown = type.skillCooldown * gameState.modifiers.skillCooldownMultiplier;
    this.skillEffect = type.skillEffect;
    this.skillTimer = 0;
    
    this.attackTimer = 0;
    this.target = null;
    this.size = 30;
    
    this.animationOffset = 0;
  }
  
  update() {
    this.animationOffset = Math.sin(this.p.frameCount * 0.1) * 3;
    
    // Update skill cooldown
    if (this.skillTimer > 0) {
      this.skillTimer--;
    }
    
    // Find target
    this.findTarget();
    
    // Attack target
    if (this.target && this.attackTimer <= 0) {
      this.attack();
      this.attackTimer = this.attackSpeed;
    }
    
    if (this.attackTimer > 0) {
      this.attackTimer--;
    }
  }
  
  findTarget() {
    this.target = null;
    let closestDist = this.range;
    
    for (const hero of gameState.heroes) {
      const d = this.p.dist(this.getX(), this.getY(), hero.x, hero.y);
      if (d <= this.range && d < closestDist) {
        this.target = hero;
        closestDist = d;
      }
    }
  }
  
  attack() {
    if (!this.target) return;
    
    // Create projectile
    gameState.projectiles.push({
      x: this.getX(),
      y: this.getY(),
      targetX: this.target.x,
      targetY: this.target.y,
      damage: this.damage,
      speed: 5,
      color: this.color,
      size: 6
    });
  }
  
  useSkill() {
    if (this.skillTimer > 0) return false;
    
    this.skillTimer = this.skillCooldown;
    
    switch (this.skillEffect) {
      case "damage":
        // Extra damage to all nearby enemies
        for (const hero of gameState.heroes) {
          const d = this.p.dist(this.getX(), this.getY(), hero.x, hero.y);
          if (d <= this.range * 1.5) {
            hero.health -= this.damage * 2;
            this.createParticles(hero.x, hero.y, [255, 200, 100]);
          }
        }
        break;
      case "buff":
        // Buff all monsters
        for (const monster of gameState.monsters) {
          monster.damage *= 1.5;
          setTimeout(() => {
            monster.damage /= 1.5;
          }, 3000);
        }
        this.createParticles(this.getX(), this.getY(), [255, 255, 100]);
        break;
      case "aoe":
        // Area damage
        for (const hero of gameState.heroes) {
          const d = this.p.dist(this.getX(), this.getY(), hero.x, hero.y);
          if (d <= this.range * 2) {
            hero.health -= this.damage * 1.5;
            this.createParticles(hero.x, hero.y, [255, 100, 50]);
          }
        }
        break;
      case "heal":
        // Heal self
        this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.3);
        this.createParticles(this.getX(), this.getY(), [100, 255, 100]);
        break;
    }
    
    return true;
  }
  
  createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      gameState.particles.push({
        x: x,
        y: y,
        vx: this.p.random(-3, 3),
        vy: this.p.random(-3, 3),
        life: 30,
        color: color,
        size: this.p.random(3, 6)
      });
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.createParticles(this.getX(), this.getY(), [255, 100, 100]);
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  getX() {
    const slot = this.getSlot();
    return slot.x;
  }
  
  getY() {
    const slot = this.getSlot();
    return slot.y + this.animationOffset;
  }
  
  getSlot() {
    return gameState.monsters.indexOf(this) >= 0 
      ? { x: 150 + (this.slotIndex % 2) * 100, y: 100 + Math.floor(this.slotIndex / 2) * 100 }
      : { x: 0, y: 0 };
  }
  
  draw(p, isSelected) {
    const x = this.getX();
    const y = this.getY();
    
    // Health bar
    p.push();
    p.noStroke();
    p.fill(80);
    p.rect(x - 20, y - 25, 40, 4);
    p.fill(100, 255, 100);
    const healthPercent = this.health / this.maxHealth;
    p.rect(x - 20, y - 25, 40 * healthPercent, 4);
    p.pop();
    
    // Monster body
    p.push();
    if (isSelected) {
      p.strokeWeight(3);
      p.stroke(255, 255, 100);
    } else {
      p.noStroke();
    }
    p.fill(...this.color);
    p.ellipse(x, y, this.size, this.size);
    
    // Eyes
    p.fill(255);
    p.ellipse(x - 6, y - 4, 6, 8);
    p.ellipse(x + 6, y - 4, 6, 8);
    p.fill(0);
    p.ellipse(x - 6, y - 2, 3, 4);
    p.ellipse(x + 6, y - 2, 3, 4);
    p.pop();
    
    // Skill cooldown indicator
    if (this.skillTimer > 0) {
      p.push();
      p.noFill();
      p.stroke(100, 150, 255);
      p.strokeWeight(2);
      const angle = p.map(this.skillTimer, 0, this.skillCooldown, 0, p.TWO_PI);
      p.arc(x, y, this.size + 8, this.size + 8, -p.HALF_PI, -p.HALF_PI + angle);
      p.pop();
    }
  }
}

export class Hero {
  constructor(type, wave, p) {
    this.p = p;
    this.name = type.name;
    this.maxHealth = type.health * (1 + wave * 0.2);
    this.health = this.maxHealth;
    this.damage = type.damage * (1 + wave * 0.15);
    this.speed = type.speed;
    this.shards = type.shards;
    this.color = type.color;
    
    this.x = CANVAS_WIDTH + 20;
    this.y = this.p.random(80, CANVAS_HEIGHT - 80);
    this.size = 25;
    this.attackTimer = 0;
    this.attackSpeed = 90;
    this.defeated = false;
  }
  
  update() {
    if (this.health <= 0 && !this.defeated) {
      this.defeated = true;
      gameState.soulShards += this.shards;
      gameState.totalShardsEarned += this.shards;
      this.createDeathParticles();
      return;
    }
    
    // Move towards left
    this.x -= this.speed;
    
    // Attack monsters in range
    if (this.attackTimer <= 0) {
      for (const monster of gameState.monsters) {
        const d = this.p.dist(this.x, this.y, monster.getX(), monster.getY());
        if (d <= 80) {
          monster.takeDamage(this.damage);
          this.attackTimer = this.attackSpeed;
          break;
        }
      }
    }
    
    if (this.attackTimer > 0) {
      this.attackTimer--;
    }
  }
  
  createDeathParticles() {
    for (let i = 0; i < 12; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.random(-4, 4),
        vy: this.p.random(-4, 4),
        life: 40,
        color: this.color,
        size: this.p.random(4, 8)
      });
    }
  }
  
  draw(p) {
    if (this.defeated) return;
    
    // Health bar
    p.push();
    p.noStroke();
    p.fill(80);
    p.rect(this.x - 15, this.y - 20, 30, 3);
    p.fill(255, 100, 100);
    const healthPercent = this.health / this.maxHealth;
    p.rect(this.x - 15, this.y - 20, 30 * healthPercent, 3);
    p.pop();
    
    // Hero body
    p.push();
    p.noStroke();
    p.fill(...this.color);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Shield/weapon
    p.fill(150, 150, 150);
    p.rect(this.x - this.size/2 - 4, this.y - 8, 4, 16);
    
    // Helmet
    p.fill(100, 100, 120);
    p.arc(this.x, this.y - 5, 18, 18, p.PI, 0);
    p.pop();
  }
}