// beast.js
import { gameState } from './globals.js';

export class Beast {
  constructor(x, y, wave) {
    this.x = x;
    this.y = y;
    this.wave = wave;
    this.health = 50 + wave * 20;
    this.maxHealth = this.health;
    this.damage = 5 + wave * 2;
    this.speed = 0.8 + wave * 0.1;
    this.isAlive = true;
    this.target = null;
    this.attackTimer = 0;
    this.attackCooldown = 60;
    this.size = 15 + wave * 2;
    this.color = [150 + wave * 5, 50, 50];
  }

  update() {
    if (!this.isAlive || gameState.gamePhase !== "PLAYING") return;

    this.attackTimer = Math.max(0, this.attackTimer - gameState.timeScale);

    // Find nearest building or hero
    let nearestTarget = null;
    let nearestDist = Infinity;

    // Check buildings
    for (const building of gameState.buildings) {
      if (!building.isAlive) continue;
      const dist = Math.hypot(building.x - this.x, building.y - this.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTarget = building;
      }
    }

    // Check heroes
    for (const hero of gameState.heroes) {
      if (!hero.isAlive) continue;
      const dist = Math.hypot(hero.x - this.x, hero.y - this.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTarget = hero;
      }
    }

    if (nearestTarget) {
      this.target = nearestTarget;
      const attackRange = 25;
      
      if (nearestDist > attackRange) {
        // Move towards target
        const angle = Math.atan2(nearestTarget.y - this.y, nearestTarget.x - this.x);
        this.x += Math.cos(angle) * this.speed * gameState.timeScale;
        this.y += Math.sin(angle) * this.speed * gameState.timeScale;
      } else {
        // Attack
        if (this.attackTimer <= 0) {
          nearestTarget.takeDamage(this.damage);
          this.attackTimer = this.attackCooldown;
        }
      }
    }

    if (this.health <= 0) {
      this.isAlive = false;
      // Reward resources
      gameState.food += 10 + this.wave * 2;
      gameState.wood += 5 + this.wave;
      gameState.coal += 3 + this.wave;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  render(p) {
    if (!this.isAlive) return;

    p.push();
    
    // Beast body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Draw as menacing creature
    p.ellipse(this.x, this.y, this.size * 1.5, this.size);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(this.x - this.size/4, this.y - this.size/4, this.size/4);
    p.circle(this.x + this.size/4, this.y - this.size/4, this.size/4);
    
    // Fangs
    p.fill(255, 255, 255);
    p.triangle(this.x - this.size/4, this.y, this.x - this.size/4 - 3, this.y + this.size/3, this.x - this.size/4 + 3, this.y + this.size/3);
    p.triangle(this.x + this.size/4, this.y, this.x + this.size/4 - 3, this.y + this.size/3, this.x + this.size/4 + 3, this.y + this.size/3);

    // Health bar
    const barWidth = this.size * 1.5;
    const barHeight = 3;
    p.fill(200, 50, 50);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - this.size/2 - 5, barWidth, barHeight);
    p.fill(50, 200, 50);
    const healthPercent = this.health / this.maxHealth;
    p.rect(this.x - barWidth/2, this.y - this.size/2 - 5, barWidth * healthPercent, barHeight);

    p.pop();
  }
}