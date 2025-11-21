import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Hero {
  constructor() {
    this.x = 100;
    this.y = 200;
    this.speed = 2;
    this.maxHealth = 200;
    this.health = this.maxHealth;
    this.damage = 15;
    this.range = 80;
    this.attackSpeed = 30;
    this.attackCooldown = 0;
    this.target = null;
    this.abilityReady = true;
    this.abilityCooldown = 0;
    this.abilityMaxCooldown = 300; // 5 seconds at 60fps
    this.kills = 0;
  }
  
  update(inputs) {
    // Movement
    if (inputs.up) this.y -= this.speed;
    if (inputs.down) this.y += this.speed;
    if (inputs.left) this.x -= this.speed;
    if (inputs.right) this.x += this.speed;
    
    // Clamp to canvas
    this.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, this.x));
    this.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, this.y));
    
    // Update cooldowns
    this.attackCooldown--;
    if (this.abilityCooldown > 0) {
      this.abilityCooldown--;
      if (this.abilityCooldown <= 0) {
        this.abilityReady = true;
      }
    }
    
    // Find and attack enemies
    if (!this.target || !this.target.alive || !this.isInRange(this.target)) {
      this.target = this.findTarget();
    }
    
    if (this.target && this.attackCooldown <= 0) {
      this.attack();
      this.attackCooldown = this.attackSpeed;
    }
    
    // Use ability if requested
    if (inputs.ability && this.abilityReady) {
      this.useAbility();
    }
  }
  
  findTarget() {
    let bestTarget = null;
    let bestDist = Infinity;
    
    for (let enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      const dist = this.distanceTo(enemy);
      if (dist <= this.range && dist < bestDist) {
        bestTarget = enemy;
        bestDist = dist;
      }
    }
    
    return bestTarget;
  }
  
  isInRange(enemy) {
    return this.distanceTo(enemy) <= this.range;
  }
  
  distanceTo(enemy) {
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  attack() {
    if (!this.target) return;
    this.target.takeDamage(this.damage);
    if (!this.target.alive) {
      this.kills++;
    }
  }
  
  useAbility() {
    // Area damage ability
    this.abilityReady = false;
    this.abilityCooldown = this.abilityMaxCooldown;
    
    const abilityRange = 150;
    let hitCount = 0;
    
    for (let enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      if (this.distanceTo(enemy) <= abilityRange) {
        enemy.takeDamage(this.damage * 3);
        hitCount++;
      }
    }
    
    gameState.score += hitCount * 50;
  }
  
  draw(p) {
    p.push();
    
    // Draw ability range indicator when ready
    if (this.abilityReady) {
      p.fill(255, 255, 100, 30);
      p.noStroke();
      p.circle(this.x, this.y, 150 * 2);
    }
    
    // Draw attack range
    p.fill(100, 200, 255, 20);
    p.noStroke();
    p.circle(this.x, this.y, this.range * 2);
    
    // Draw hero body
    p.fill(100, 150, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 24);
    
    // Draw hero indicator (crown)
    p.fill(255, 215, 0);
    p.noStroke();
    p.triangle(
      this.x - 8, this.y - 12,
      this.x, this.y - 18,
      this.x + 8, this.y - 12
    );
    
    // Draw health bar
    const barWidth = 30;
    const barHeight = 4;
    const barY = this.y - 20;
    
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(100, 200, 255);
    p.rect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    
    // Draw targeting line
    if (this.target && this.target.alive) {
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(2);
      p.line(this.x, this.y, this.target.x, this.target.y);
    }
    
    p.pop();
  }
}