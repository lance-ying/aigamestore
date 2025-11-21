// hero.js
import { gameState, HERO_DEFS } from './globals.js';

export class Hero {
  constructor(type, x, y) {
    const def = HERO_DEFS[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.color = def.color;
    this.health = def.health;
    this.maxHealth = def.health;
    this.damage = def.damage;
    this.range = def.range;
    this.speed = def.speed;
    this.attackCooldown = def.attackCooldown;
    this.attackTimer = 0;
    this.level = 1;
    this.isAlive = true;
    this.target = null;
    this.aoe = def.aoe || false;
  }

  update() {
    if (!this.isAlive || gameState.gamePhase !== "PLAYING") return;

    this.attackTimer = Math.max(0, this.attackTimer - gameState.timeScale);

    // Find nearest beast
    let nearestBeast = null;
    let nearestDist = Infinity;
    
    for (const beast of gameState.beasts) {
      if (!beast.isAlive) continue;
      const dist = Math.hypot(beast.x - this.x, beast.y - this.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBeast = beast;
      }
    }

    if (nearestBeast) {
      this.target = nearestBeast;
      
      // Move towards or attack
      if (nearestDist > this.range) {
        // Move towards beast
        const angle = Math.atan2(nearestBeast.y - this.y, nearestBeast.x - this.x);
        this.x += Math.cos(angle) * this.speed * gameState.timeScale;
        this.y += Math.sin(angle) * this.speed * gameState.timeScale;
        
        // Constrain to canvas
        this.x = Math.max(20, Math.min(580, this.x));
        this.y = Math.max(20, Math.min(380, this.y));
      } else {
        // Attack
        if (this.attackTimer <= 0) {
          this.attack(nearestBeast);
          this.attackTimer = this.attackCooldown;
        }
      }
    } else {
      // Return to town hall
      this.target = null;
      const townHall = gameState.buildings.find(b => b.type === "TOWN_HALL" && b.isAlive);
      if (townHall) {
        const dist = Math.hypot(townHall.x - this.x, townHall.y - this.y);
        if (dist > 80) {
          const angle = Math.atan2(townHall.y - this.y, townHall.x - this.x);
          this.x += Math.cos(angle) * this.speed * gameState.timeScale;
          this.y += Math.sin(angle) * this.speed * gameState.timeScale;
        }
      }
    }

    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  attack(beast) {
    if (this.aoe) {
      // Area of effect damage
      for (const b of gameState.beasts) {
        if (!b.isAlive) continue;
        const dist = Math.hypot(b.x - this.target.x, b.y - this.target.y);
        if (dist < 50) {
          b.takeDamage(this.damage * this.level);
        }
      }
    } else {
      beast.takeDamage(this.damage * this.level);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  upgrade() {
    const upgradeCost = this.getUpgradeCost();
    if (gameState.food >= upgradeCost.food && 
        gameState.wood >= upgradeCost.wood && 
        gameState.coal >= upgradeCost.coal) {
      gameState.food -= upgradeCost.food;
      gameState.wood -= upgradeCost.wood;
      gameState.coal -= upgradeCost.coal;
      this.level++;
      this.health = Math.min(this.health + 50, this.maxHealth * this.level);
      this.maxHealth = this.maxHealth * this.level;
      return true;
    }
    return false;
  }

  getUpgradeCost() {
    const baseCost = HERO_DEFS[this.type].cost;
    return {
      food: Math.floor(baseCost.food * this.level * 1.3),
      wood: Math.floor(baseCost.wood * this.level * 1.3),
      coal: Math.floor(baseCost.coal * this.level * 1.3)
    };
  }

  render(p) {
    if (!this.isAlive) return;

    p.push();
    
    // Hero body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 20);

    // Weapon indicator
    p.noStroke();
    if (this.type === "WARRIOR") {
      p.fill(150, 150, 150);
      p.rect(this.x - 12, this.y - 2, 15, 4);
    } else if (this.type === "ARCHER") {
      p.fill(100, 50, 0);
      p.arc(this.x - 10, this.y, 15, 15, -Math.PI/4, Math.PI/4);
    } else if (this.type === "MAGE") {
      p.fill(255, 255, 100);
      p.circle(this.x - 12, this.y - 5, 8);
    }

    // Attack range when selected
    if (gameState.selectedHero === this) {
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(1);
      p.circle(this.x, this.y, this.range * 2);
    }

    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = 25;
      const barHeight = 3;
      p.fill(200, 50, 50);
      p.noStroke();
      p.rect(this.x - barWidth/2, this.y - 18, barWidth, barHeight);
      p.fill(50, 200, 50);
      const healthPercent = this.health / this.maxHealth;
      p.rect(this.x - barWidth/2, this.y - 18, barWidth * healthPercent, barHeight);
    }

    // Level
    if (this.level > 1) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.textSize(8);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`L${this.level}`, this.x + 12, this.y - 12);
    }

    // Attack animation
    if (this.attackTimer > this.attackCooldown * 0.7 && this.target) {
      p.stroke(255, 100, 100);
      p.strokeWeight(2);
      p.line(this.x, this.y, this.target.x, this.target.y);
    }

    p.pop();
  }
}