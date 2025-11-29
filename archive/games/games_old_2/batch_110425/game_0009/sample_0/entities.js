// entities.js
import { gameState, HERO_CLASSES, LOOT_RARITY, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Hero {
  constructor(p, classType, position, isLeader = false) {
    this.p = p;
    this.classData = HERO_CLASSES[classType];
    this.classType = classType;
    this.x = position.x;
    this.y = position.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.isLeader = isLeader;
    
    // Stats
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.maxHp = this.classData.baseHp;
    this.hp = this.maxHp;
    this.damage = this.classData.baseDamage;
    this.speed = this.classData.baseSpeed;
    this.attackRange = 40;
    this.attackCooldown = 0;
    this.attackSpeed = 60;
    
    // Skills
    this.skillCooldown = 0;
    this.maxSkillCooldown = this.classData.skillCooldown;
    
    // Equipment bonuses
    this.equipmentBonus = { hp: 0, damage: 0, speed: 0 };
    
    // Combat
    this.target = null;
    this.attackTimer = 0;
    
    // Animation
    this.angle = 0;
    this.animOffset = 0;
  }
  
  update() {
    // Move towards target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      const moveSpeed = this.speed;
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
      this.angle = Math.atan2(dy, dx);
      this.animOffset = Math.sin(this.p.frameCount * 0.2) * 3;
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.skillCooldown > 0) this.skillCooldown--;
    
    // Find and attack enemies
    this.findTarget();
    if (this.target && this.attackCooldown <= 0) {
      this.attack();
    }
  }
  
  findTarget() {
    let closest = null;
    let closestDist = this.attackRange;
    
    for (const enemy of gameState.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }
    
    this.target = closest;
  }
  
  attack() {
    if (!this.target || this.target.hp <= 0) return;
    
    this.target.takeDamage(this.damage + this.equipmentBonus.damage);
    this.attackCooldown = this.attackSpeed;
    
    // Attack particle
    this.createAttackParticle();
  }
  
  createAttackParticle() {
    if (!this.target) return;
    gameState.particles.push({
      x: this.target.x,
      y: this.target.y,
      life: 20,
      color: this.classData.color,
      size: 8
    });
  }
  
  useSkill() {
    if (this.skillCooldown > 0) return false;
    
    this.skillCooldown = this.maxSkillCooldown;
    
    // Different skills based on class
    switch (this.classType) {
      case 'KNIGHT':
        this.knightSkill();
        break;
      case 'MAGE':
        this.mageSkill();
        break;
      case 'ARCHER':
        this.archerSkill();
        break;
      case 'WARRIOR':
        this.warriorSkill();
        break;
    }
    
    return true;
  }
  
  knightSkill() {
    // Shield Bash - stun nearby enemies and deal damage
    for (const enemy of gameState.enemies) {
      const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < 80) {
        enemy.takeDamage(this.damage * 2);
        enemy.stunned = 60;
      }
    }
    this.createSkillEffect(80);
  }
  
  mageSkill() {
    // Fireball - create projectile
    const angle = this.target ? Math.atan2(this.target.y - this.y, this.target.x - this.x) : this.angle;
    gameState.projectiles.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      damage: this.damage * 3,
      radius: 12,
      color: this.classData.skillColor,
      life: 120,
      owner: this
    });
  }
  
  archerSkill() {
    // Multi-Shot - three arrows
    const baseAngle = this.target ? Math.atan2(this.target.y - this.y, this.target.x - this.x) : this.angle;
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.3;
      gameState.projectiles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        damage: this.damage * 1.5,
        radius: 6,
        color: this.classData.skillColor,
        life: 100,
        owner: this
      });
    }
  }
  
  warriorSkill() {
    // Whirlwind - damage all nearby
    for (const enemy of gameState.enemies) {
      const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < 100) {
        enemy.takeDamage(this.damage * 2.5);
      }
    }
    this.createSkillEffect(100);
  }
  
  createSkillEffect(radius) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      gameState.particles.push({
        x: this.x + Math.cos(angle) * radius,
        y: this.y + Math.sin(angle) * radius,
        life: 30,
        color: this.classData.skillColor,
        size: 10
      });
    }
  }
  
  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= this.expToNext) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.exp = 0;
    this.expToNext = Math.floor(this.expToNext * 1.5);
    
    // Stat increases
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.damage += 3;
    this.speed += 0.1;
    
    // Level up effect
    for (let i = 0; i < 20; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 40,
        color: [255, 255, 100],
        size: 6
      });
    }
  }
  
  equipItem(item) {
    const bonus = item.rarity.statBonus;
    this.equipmentBonus.hp += bonus * 5;
    this.equipmentBonus.damage += bonus;
    this.equipmentBonus.speed += bonus * 0.05;
    this.maxHp += bonus * 5;
    this.hp = Math.min(this.hp + bonus * 5, this.maxHp);
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
    }
  }
  
  draw() {
    this.p.push();
    this.p.translate(this.x - gameState.camera.x, this.y - gameState.camera.y);
    
    // Shadow
    this.p.fill(0, 0, 0, 50);
    this.p.noStroke();
    this.p.ellipse(0, 5, 20, 8);
    
    // Body
    this.p.fill(...this.classData.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.ellipse(0, this.animOffset, 24, 28);
    
    // Head
    this.p.fill(255, 220, 180);
    this.p.ellipse(0, this.animOffset - 15, 16, 16);
    
    // Weapon indicator
    this.p.stroke(...this.classData.color);
    this.p.strokeWeight(3);
    const weaponX = Math.cos(this.angle) * 15;
    const weaponY = Math.sin(this.angle) * 15 + this.animOffset;
    this.p.line(0, this.animOffset, weaponX, weaponY);
    
    // Leader indicator
    if (this.isLeader) {
      this.p.noStroke();
      this.p.fill(255, 255, 100);
      this.p.triangle(-6, this.animOffset - 30, 6, this.animOffset - 30, 0, this.animOffset - 35);
    }
    
    // HP bar
    this.p.strokeWeight(1);
    this.p.stroke(0);
    this.p.fill(200, 50, 50);
    this.p.rect(-12, this.animOffset + 18, 24, 4);
    this.p.fill(100, 255, 100);
    const hpWidth = (this.hp / this.maxHp) * 24;
    this.p.rect(-12, this.animOffset + 18, hpWidth, 4);
    
    // Skill cooldown indicator
    if (this.skillCooldown > 0) {
      this.p.fill(100, 100, 255, 150);
      this.p.noStroke();
      const cooldownArc = (this.skillCooldown / this.maxSkillCooldown) * this.p.TWO_PI;
      this.p.arc(0, this.animOffset, 30, 30, -this.p.PI / 2, -this.p.PI / 2 + cooldownArc);
    }
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, tier = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.tier = tier;
    
    // Stats scale with tier
    this.maxHp = 50 + tier * 20;
    this.hp = this.maxHp;
    this.damage = 8 + tier * 3;
    this.speed = 1.5 + tier * 0.3;
    this.attackRange = 35;
    this.attackCooldown = 0;
    this.attackSpeed = 90;
    this.expReward = 20 + tier * 10;
    
    this.target = null;
    this.stunned = 0;
    
    // Visuals
    this.color = [
      150 + tier * 20,
      50 - tier * 10,
      50 - tier * 10
    ];
    this.size = 20 + tier * 4;
    this.animOffset = 0;
  }
  
  update() {
    if (this.hp <= 0) return;
    
    // Update stunned
    if (this.stunned > 0) {
      this.stunned--;
      return;
    }
    
    // Find closest hero
    this.findTarget();
    
    // Move towards target
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > this.attackRange) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.animOffset = Math.sin(this.p.frameCount * 0.15) * 2;
      } else {
        // Attack
        if (this.attackCooldown <= 0) {
          this.attack();
        }
      }
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
  }
  
  findTarget() {
    let closest = null;
    let closestDist = Infinity;
    
    for (const hero of gameState.party) {
      if (hero.hp <= 0) continue;
      const dist = this.p.dist(this.x, this.y, hero.x, hero.y);
      if (dist < closestDist) {
        closest = hero;
        closestDist = dist;
      }
    }
    
    this.target = closest;
  }
  
  attack() {
    if (!this.target) return;
    
    this.target.takeDamage(this.damage);
    this.attackCooldown = this.attackSpeed;
    
    // Attack effect
    gameState.particles.push({
      x: this.target.x,
      y: this.target.y,
      life: 15,
      color: [255, 100, 100],
      size: 10
    });
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    
    // Damage number particle
    gameState.particles.push({
      x: this.x,
      y: this.y - 20,
      vy: -2,
      life: 30,
      text: Math.floor(amount),
      color: [255, 255, 100],
      size: 14
    });
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.enemiesDefeated++;
    gameState.enemiesThisMission++;
    gameState.specialCharge = Math.min(gameState.specialCharge + 10, gameState.maxSpecialCharge);
    
    // Drop loot
    this.dropLoot();
    
    // Give exp to party
    for (const hero of gameState.party) {
      if (hero.hp > 0) {
        hero.gainExp(this.expReward);
      }
    }
    
    // Death particles
    for (let i = 0; i < 15; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 40,
        color: this.color,
        size: 6
      });
    }
  }
  
  dropLoot() {
    // Random chance for loot
    const rand = Math.random();
    let rarity;
    
    if (rand < 0.5) {
      rarity = LOOT_RARITY.COMMON;
    } else if (rand < 0.75) {
      rarity = LOOT_RARITY.UNCOMMON;
    } else if (rand < 0.9) {
      rarity = LOOT_RARITY.RARE;
    } else if (rand < 0.97) {
      rarity = LOOT_RARITY.EPIC;
    } else {
      rarity = LOOT_RARITY.LEGENDARY;
    }
    
    gameState.loot.push({
      x: this.x,
      y: this.y,
      rarity: rarity,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2
    });
  }
  
  draw() {
    if (this.hp <= 0) return;
    
    this.p.push();
    this.p.translate(this.x - gameState.camera.x, this.y - gameState.camera.y);
    
    // Shadow
    this.p.fill(0, 0, 0, 50);
    this.p.noStroke();
    this.p.ellipse(0, 5, this.size * 0.8, this.size * 0.4);
    
    // Stunned effect
    if (this.stunned > 0) {
      this.p.fill(100, 100, 255, 100);
      this.p.ellipse(0, this.animOffset, this.size * 1.3, this.size * 1.3);
    }
    
    // Body
    this.p.fill(...this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.ellipse(0, this.animOffset, this.size, this.size);
    
    // Eyes
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    this.p.ellipse(-4, this.animOffset - 3, 6, 8);
    this.p.ellipse(4, this.animOffset - 3, 6, 8);
    this.p.fill(255, 0, 0);
    this.p.ellipse(-4, this.animOffset - 2, 3, 4);
    this.p.ellipse(4, this.animOffset - 2, 3, 4);
    
    // HP bar
    this.p.strokeWeight(1);
    this.p.stroke(0);
    this.p.fill(200, 50, 50);
    this.p.rect(-this.size / 2, this.animOffset + this.size / 2 + 5, this.size, 4);
    this.p.fill(100, 255, 100);
    const hpWidth = (this.hp / this.maxHp) * this.size;
    this.p.rect(-this.size / 2, this.animOffset + this.size / 2 + 5, hpWidth, 4);
    
    // Tier indicator
    if (this.tier > 1) {
      this.p.fill(255, 200, 50);
      this.p.noStroke();
      this.p.textSize(10);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.text(`T${this.tier}`, 0, this.animOffset + this.size / 2 + 15);
    }
    
    this.p.pop();
  }
}

export class Projectile {
  constructor(data) {
    Object.assign(this, data);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < this.radius + enemy.size / 2) {
        enemy.takeDamage(this.damage);
        this.life = 0;
        return;
      }
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x - gameState.camera.x, this.y - gameState.camera.y);
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Trail effect
    p.fill(...this.color, 100);
    p.ellipse(-this.vx, -this.vy, this.radius, this.radius);
    
    p.pop();
  }
}

export class Loot {
  update(p) {
    this.bobOffset += 0.1;
    
    // Check collection by party
    for (const hero of gameState.party) {
      if (hero.hp <= 0) continue;
      const dist = p.dist(this.x, this.y, hero.x, hero.y);
      if (dist < 30) {
        this.collect(hero);
        return;
      }
    }
  }
  
  collect(hero) {
    this.collected = true;
    hero.equipItem(this);
    gameState.score += this.rarity.statBonus * 10;
    
    // Collection effect
    for (let i = 0; i < 10; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 30,
        color: this.rarity.color,
        size: 4
      });
    }
  }
  
  draw(p) {
    if (this.collected) return;
    
    const bobY = Math.sin(this.bobOffset) * 5;
    
    p.push();
    p.translate(this.x - gameState.camera.x, this.y - gameState.camera.y + bobY);
    
    // Glow
    p.fill(...this.rarity.color, 50);
    p.noStroke();
    p.ellipse(0, 0, 30, 30);
    
    // Item
    p.fill(...this.rarity.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-8, -8, 16, 16, 2);
    
    // Shine
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.ellipse(-3, -3, 4, 4);
    
    p.pop();
  }
}

export class Particle {
  update() {
    this.life--;
    if (this.vx !== undefined) {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
    if (this.vy !== undefined && !this.vx) {
      this.y += this.vy;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x - gameState.camera.x, this.y - gameState.camera.y);
    
    if (this.text !== undefined) {
      p.fill(...this.color, (this.life / 30) * 255);
      p.noStroke();
      p.textSize(this.size);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.text, 0, 0);
    } else {
      p.fill(...this.color, (this.life / 40) * 200);
      p.noStroke();
      p.ellipse(0, 0, this.size, this.size);
    }
    
    p.pop();
  }
}