// player.js - Player class and related functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GRAVITY, JUMP_STRENGTH, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 40;
    this.speed = 4;
    this.isGrounded = false;
    this.facingRight = true;
    
    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.maxMana = 100;
    this.mana = 50;
    this.manaRegen = 0.2;
    this.level = 1;
    this.exp = 0;
    this.expToLevel = 100;
    this.attackDamage = 10;
    this.defense = 5;
    
    // Combat
    this.attackCooldown = 0;
    this.attackRange = 50;
    this.isAttacking = false;
    this.attackFrame = 0;
    
    // Skills
    this.skills = [
      {
        name: "Power Strike",
        manaCost: 15,
        cooldown: 5000,
        lastUsed: 0,
        damage: 30,
        range: 70
      },
      {
        name: "Whirlwind",
        manaCost: 25,
        cooldown: 8000,
        lastUsed: 0,
        damage: 20,
        radius: 80,
        duration: 1000
      }
    ];
    
    this.activeSkill = null;
    this.skillStartTime = 0;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.15;
  }
  
  update() {
    // Apply gravity
    if (this.y < GROUND_Y - this.height / 2) {
      this.vy += GRAVITY;
      this.isGrounded = false;
    } else {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.isGrounded = true;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundaries
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    
    // Friction
    this.vx *= 0.85;
    
    // Mana regeneration
    this.mana = this.p.min(this.maxMana, this.mana + this.manaRegen);
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 15) {
        this.isAttacking = false;
        this.attackFrame = 0;
      }
    }
    
    // Update active skill
    if (this.activeSkill) {
      const elapsed = Date.now() - this.skillStartTime;
      if (elapsed > this.activeSkill.duration) {
        this.activeSkill = null;
      }
    }
    
    // Animation
    if (this.p.abs(this.vx) > 0.5) {
      this.animFrame += this.animSpeed;
    }
  }
  
  moveLeft() {
    this.vx = -this.speed;
    this.facingRight = false;
  }
  
  moveRight() {
    this.vx = this.speed;
    this.facingRight = true;
  }
  
  jump() {
    if (this.isGrounded) {
      this.vy = JUMP_STRENGTH;
      this.isGrounded = false;
    }
  }
  
  attack() {
    if (this.attackCooldown <= 0 && !this.isAttacking) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackCooldown = 20;
      
      // Check for enemy hits
      const hitEnemies = gameState.enemies.filter(e => {
        const dist = this.p.dist(this.x, this.y, e.x, e.y);
        const inRange = dist < this.attackRange + e.width / 2;
        const correctDirection = this.facingRight ? (e.x > this.x) : (e.x < this.x);
        return inRange && correctDirection && !e.isDead;
      });
      
      hitEnemies.forEach(enemy => {
        enemy.takeDamage(this.attackDamage);
        this.mana = this.p.min(this.maxMana, this.mana + 5); // Gain mana on hit
      });
      
      return hitEnemies.length > 0;
    }
    return false;
  }
  
  useSkill(skillIndex) {
    const skill = this.skills[skillIndex];
    if (!skill) return false;
    
    const now = Date.now();
    const cooldownReady = (now - skill.lastUsed) >= skill.cooldown;
    
    if (this.mana >= skill.manaCost && cooldownReady) {
      this.mana -= skill.manaCost;
      skill.lastUsed = now;
      
      if (skillIndex === 0) {
        // Power Strike
        const hitEnemies = gameState.enemies.filter(e => {
          const dist = this.p.dist(this.x, this.y, e.x, e.y);
          const inRange = dist < skill.range + e.width / 2;
          const correctDirection = this.facingRight ? (e.x > this.x) : (e.x < this.x);
          return inRange && correctDirection && !e.isDead;
        });
        
        hitEnemies.forEach(enemy => {
          enemy.takeDamage(skill.damage);
        });
        
        // Visual effect
        this.createSkillEffect(skillIndex);
      } else if (skillIndex === 1) {
        // Whirlwind
        this.activeSkill = skill;
        this.skillStartTime = now;
        
        const hitEnemies = gameState.enemies.filter(e => {
          const dist = this.p.dist(this.x, this.y, e.x, e.y);
          return dist < skill.radius && !e.isDead;
        });
        
        hitEnemies.forEach(enemy => {
          enemy.takeDamage(skill.damage);
        });
        
        this.createSkillEffect(skillIndex);
      }
      
      return true;
    }
    return false;
  }
  
  createSkillEffect(skillIndex) {
    const skill = this.skills[skillIndex];
    for (let i = 0; i < 15; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(2, 6);
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed,
        life: 30,
        color: skillIndex === 0 ? [255, 200, 0] : [100, 200, 255],
        size: this.p.random(3, 8)
      });
    }
  }
  
  takeDamage(amount) {
    const actualDamage = this.p.max(1, amount - this.defense / 2);
    this.health -= actualDamage;
    
    // Create damage particles
    for (let i = 0; i < 8; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(2, 5);
      gameState.particles.push({
        x: this.x,
        y: this.y - 10,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed - 2,
        life: 20,
        color: [255, 50, 50],
        size: 4
      });
    }
  }
  
  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= this.expToLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.exp -= this.expToLevel;
    this.expToLevel = this.p.floor(this.expToLevel * 1.5);
    
    // Stat increases
    this.maxHealth += 20;
    this.health = this.maxHealth; // Full heal on level up
    this.maxMana += 10;
    this.mana = this.maxMana;
    this.attackDamage += 5;
    this.defense += 2;
    
    // Level up particles
    for (let i = 0; i < 30; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(3, 8);
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed - 3,
        life: 40,
        color: [255, 255, 100],
        size: 6
      });
    }
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    // Flip for direction
    if (!this.facingRight) {
      p.scale(-1, 1);
    }
    
    // Body (hero)
    p.fill(80, 100, 200);
    p.noStroke();
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height * 0.6, 4);
    
    // Legs
    const legOffset = this.p.sin(this.animFrame) * 3;
    p.fill(60, 80, 160);
    p.rect(-8, this.height * 0.1, 6, this.height * 0.4);
    p.rect(2, this.height * 0.1 + legOffset, 6, this.height * 0.4);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(0, -this.height / 2 - 8, 16, 16);
    
    // Helmet/Crown
    p.fill(200, 150, 0);
    p.arc(0, -this.height / 2 - 8, 18, 18, p.PI, 0);
    
    // Cape
    p.fill(200, 50, 50, 150);
    p.beginShape();
    p.vertex(-this.width / 2 + 2, -this.height / 2 + 5);
    p.vertex(-this.width / 2 - 8, this.height / 2 - 5);
    p.vertex(-this.width / 2 + 2, this.height / 2 - 5);
    p.endShape(p.CLOSE);
    
    // Weapon
    if (this.isAttacking) {
      const attackAngle = this.p.map(this.attackFrame, 0, 15, -p.PI / 3, p.PI / 3);
      p.push();
      p.rotate(attackAngle);
      p.stroke(150, 150, 150);
      p.strokeWeight(3);
      p.line(this.width / 2, 0, this.width / 2 + 30, -5);
      p.fill(180, 180, 180);
      p.noStroke();
      p.triangle(this.width / 2 + 30, -5, this.width / 2 + 40, -8, this.width / 2 + 40, -2);
      p.pop();
    } else {
      p.stroke(150, 150, 150);
      p.strokeWeight(3);
      p.line(this.width / 2 - 5, 5, this.width / 2 - 5, 20);
      p.fill(180, 180, 180);
      p.noStroke();
      p.triangle(this.width / 2 - 5, 20, this.width / 2 - 8, 28, this.width / 2 - 2, 28);
    }
    
    // Whirlwind skill effect
    if (this.activeSkill && this.activeSkill.name === "Whirlwind") {
      const elapsed = Date.now() - this.skillStartTime;
      const alpha = p.map(elapsed, 0, this.activeSkill.duration, 200, 0);
      p.noFill();
      p.stroke(100, 200, 255, alpha);
      p.strokeWeight(3);
      const radius = this.activeSkill.radius;
      for (let i = 0; i < 3; i++) {
        const offset = (elapsed * 0.01 + i * p.TWO_PI / 3) % p.TWO_PI;
        p.push();
        p.rotate(offset);
        p.arc(0, 0, radius * 2, radius * 2, 0, p.PI);
        p.pop();
      }
    }
    
    p.pop();
    
    // Health bar above player
    this.renderHealthBar();
  }
  
  renderHealthBar() {
    const p = this.p;
    const barWidth = 40;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 25;
    
    // Background
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = this.health / this.maxHealth;
    p.fill(100, 255, 100);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
  }
}