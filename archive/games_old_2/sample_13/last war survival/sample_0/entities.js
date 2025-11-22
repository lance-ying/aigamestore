// entities.js - Entity classes

import { HERO_CONFIG, ZOMBIE_CONFIG, OBSTACLE_CONFIG } from './config.js';
import { gameState, CANVAS_WIDTH, BASE_ZONE_WIDTH, LANE_START_Y, LANE_HEIGHT } from './globals.js';

export class Hero {
  constructor(type, lane, level = 1) {
    this.type = type;
    this.lane = lane;
    this.level = level;
    
    const config = HERO_CONFIG[type];
    this.maxHP = config.baseHP + (level - 1) * 20;
    this.hp = this.maxHP;
    this.damage = config.baseDamage + (level - 1) * 3;
    this.attackSpeed = config.attackSpeed;
    this.moveSpeed = config.moveSpeed;
    this.range = config.range;
    this.color = config.color;
    this.size = config.size;
    this.skillCooldown = config.skillCooldown;
    
    this.x = BASE_ZONE_WIDTH + 20;
    this.y = LANE_START_Y + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    this.attackTimer = 0;
    this.skillTimer = 0;
    this.target = null;
    this.isMoving = true;
    this.isDead = false;
  }
  
  update(p) {
    if (this.isDead) return;
    
    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.skillTimer > 0) this.skillTimer--;
    
    // Find target in lane
    this.findTarget();
    
    if (this.target) {
      const dist = this.target.x - this.x;
      
      if (dist > this.range) {
        // Move towards target
        this.x += this.moveSpeed;
        this.isMoving = true;
      } else {
        // Attack target
        this.isMoving = false;
        if (this.attackTimer <= 0) {
          this.attack();
          this.attackTimer = this.attackSpeed;
        }
      }
    } else {
      // No target, move forward
      if (this.x < CANVAS_WIDTH - 50) {
        this.x += this.moveSpeed;
        this.isMoving = true;
      } else {
        this.isMoving = false;
      }
    }
  }
  
  findTarget() {
    // Find closest obstacle or zombie in lane ahead
    let closestDist = Infinity;
    let closest = null;
    
    // Check obstacles
    for (const obs of gameState.obstacles) {
      if (obs.lane === this.lane && obs.x > this.x && !obs.destroyed) {
        const dist = obs.x - this.x;
        if (dist < closestDist) {
          closestDist = dist;
          closest = obs;
        }
      }
    }
    
    // Check zombies
    for (const zombie of gameState.zombies) {
      if (zombie.lane === this.lane && zombie.x > this.x && !zombie.isDead) {
        const dist = zombie.x - this.x;
        if (dist < closestDist) {
          closestDist = dist;
          closest = zombie;
        }
      }
    }
    
    this.target = closest;
  }
  
  attack() {
    if (!this.target || this.target.isDead || this.target.destroyed) {
      this.target = null;
      return;
    }
    
    this.target.takeDamage(this.damage);
    
    // Create projectile effect
    gameState.projectiles.push(new Projectile(
      this.x + this.size / 2,
      this.y,
      this.target.x,
      this.target.y,
      this.color
    ));
  }
  
  useSkill() {
    if (this.skillTimer > 0) return false;
    
    this.skillTimer = this.skillCooldown;
    
    // Different skills based on hero type
    if (this.type === 'INFANTRY') {
      // Single target burst damage
      if (this.target) {
        this.target.takeDamage(this.damage * 3);
        gameState.effects.push(new Effect(this.target.x, this.target.y, 'BURST', [255, 0, 0]));
      }
    } else if (this.type === 'ENGINEER') {
      // Area of effect damage
      for (const zombie of gameState.zombies) {
        if (zombie.lane === this.lane && !zombie.isDead) {
          const dist = Math.abs(zombie.x - this.x);
          if (dist < 150) {
            zombie.takeDamage(this.damage * 2);
          }
        }
      }
      gameState.effects.push(new Effect(this.x + 75, this.y, 'AOE', [255, 200, 0]));
    } else if (this.type === 'MEDIC') {
      // Heal nearby heroes
      for (const hero of gameState.heroes) {
        if (hero.lane === this.lane && !hero.isDead) {
          const dist = Math.abs(hero.x - this.x);
          if (dist < 120) {
            hero.heal(30);
          }
        }
      }
      gameState.effects.push(new Effect(this.x, this.y, 'HEAL', [0, 255, 100]));
    }
    
    return true;
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
  
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }
  
  draw(p) {
    if (this.isDead) return;
    
    // Draw hero
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    
    // Draw HP bar
    const barWidth = 30;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHP;
    
    p.fill(50);
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth, barHeight);
    p.fill(...(hpPercent > 0.5 ? [0, 200, 0] : hpPercent > 0.25 ? [200, 200, 0] : [200, 0, 0]));
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth * hpPercent, barHeight);
    
    // Draw skill cooldown indicator
    if (this.skillTimer > 0) {
      const cooldownPercent = this.skillTimer / this.skillCooldown;
      p.noFill();
      p.stroke(255, 200, 0);
      p.strokeWeight(2);
      p.arc(this.x, this.y, this.size + 8, this.size + 8, 0, p.TWO_PI * (1 - cooldownPercent));
    }
    
    p.pop();
  }
}

export class Zombie {
  constructor(type, lane) {
    this.type = type;
    this.lane = lane;
    
    const config = ZOMBIE_CONFIG[type];
    this.maxHP = config.hp;
    this.hp = this.maxHP;
    this.damage = config.damage;
    this.speed = config.speed;
    this.reward = config.reward;
    this.color = config.color;
    this.size = config.size;
    
    this.x = CANVAS_WIDTH + 20;
    this.y = LANE_START_Y + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    this.isDead = false;
    this.reachedBase = false;
    this.attackTimer = 0;
    this.target = null;
  }
  
  update(p) {
    if (this.isDead || this.reachedBase) return;
    
    // Update attack timer
    if (this.attackTimer > 0) this.attackTimer--;
    
    // Find target (heroes or obstacles in lane)
    this.findTarget();
    
    if (this.target) {
      const dist = this.x - this.target.x;
      
      if (dist > this.size) {
        // Move towards target
        this.x -= this.speed;
      } else {
        // Attack target
        if (this.attackTimer <= 0) {
          this.attack();
          this.attackTimer = 60; // 1 second between attacks
        }
      }
    } else {
      // No target, move towards base
      this.x -= this.speed;
    }
    
    // Check if reached base
    if (this.x < BASE_ZONE_WIDTH) {
      this.reachedBase = true;
      gameState.baseHP -= this.damage;
      if (gameState.baseHP < 0) gameState.baseHP = 0;
    }
  }
  
  findTarget() {
    // Find closest hero or obstacle in lane behind
    let closestDist = Infinity;
    let closest = null;
    
    // Check heroes
    for (const hero of gameState.heroes) {
      if (hero.lane === this.lane && hero.x < this.x && !hero.isDead) {
        const dist = this.x - hero.x;
        if (dist < closestDist) {
          closestDist = dist;
          closest = hero;
        }
      }
    }
    
    // Check obstacles
    for (const obs of gameState.obstacles) {
      if (obs.lane === this.lane && obs.x < this.x && !obs.destroyed) {
        const dist = this.x - obs.x;
        if (dist < closestDist) {
          closestDist = dist;
          closest = obs;
        }
      }
    }
    
    this.target = closest;
  }
  
  attack() {
    if (!this.target || this.target.isDead || this.target.destroyed) {
      this.target = null;
      return;
    }
    
    this.target.takeDamage(this.damage);
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      gameState.score += this.reward;
    }
  }
  
  draw(p) {
    if (this.isDead || this.reachedBase) return;
    
    // Draw zombie
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    
    // Draw HP bar
    const barWidth = 30;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHP;
    
    p.fill(50);
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth, barHeight);
    p.fill(...(hpPercent > 0.7 ? [200, 0, 0] : hpPercent > 0.3 ? [180, 80, 0] : [100, 100, 0]));
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth * hpPercent, barHeight);
    
    p.pop();
  }
}

export class Obstacle {
  constructor(type, lane) {
    this.type = type;
    this.lane = lane;
    
    const config = OBSTACLE_CONFIG[type];
    this.maxHP = config.hp;
    this.hp = this.maxHP;
    this.reward = config.reward;
    this.color = config.color;
    this.width = config.width;
    this.height = config.height;
    
    // Random position in lane
    this.x = 200 + Math.random() * 200;
    this.y = LANE_START_Y + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    
    this.destroyed = false;
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.destroyed = true;
      gameState.score += this.reward;
    }
  }
  
  draw(p) {
    if (this.destroyed) return;
    
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Draw HP bar
    const barWidth = this.width;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHP;
    
    p.rectMode(p.CORNER);
    p.fill(50);
    p.rect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);
    p.fill(150, 100, 50);
    p.rect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth * hpPercent, barHeight);
    
    p.pop();
  }
}

export class Projectile {
  constructor(x1, y1, x2, y2, color) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    this.life = 10; // frames
  }
  
  update() {
    this.life--;
  }
  
  draw(p) {
    if (this.life <= 0) return;
    
    p.push();
    p.stroke(...this.color);
    p.strokeWeight(3);
    p.line(this.x1, this.y1, this.x2, this.y2);
    p.pop();
  }
}

export class Effect {
  constructor(x, y, type, color) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.life = 30; // frames
    this.maxLife = 30;
  }
  
  update() {
    this.life--;
  }
  
  draw(p) {
    if (this.life <= 0) return;
    
    const alpha = (this.life / this.maxLife) * 200;
    
    p.push();
    
    if (this.type === 'BURST') {
      p.noFill();
      p.stroke(...this.color, alpha);
      p.strokeWeight(3);
      const size = (1 - this.life / this.maxLife) * 40;
      p.circle(this.x, this.y, size);
    } else if (this.type === 'AOE') {
      p.fill(...this.color, alpha);
      p.noStroke();
      const size = 150 * (1 - this.life / this.maxLife);
      p.circle(this.x, this.y, size);
    } else if (this.type === 'HEAL') {
      p.fill(...this.color, alpha);
      p.noStroke();
      p.circle(this.x, this.y - (this.maxLife - this.life) * 2, 15);
    }
    
    p.pop();
  }
}