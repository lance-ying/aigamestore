// enemy.js - Enemy class and related functions
import { gameState } from './globals.js';

export class Enemy {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.maxHealth = 30 + gameState.waveNumber * 5;
    this.health = this.maxHealth;
    this.attack = 8 + gameState.waveNumber * 2;
    this.defense = 2 + gameState.waveNumber;
    this.expReward = 20 + gameState.waveNumber * 5;
    this.goldReward = 10 + gameState.waveNumber * 3;
    this.turnDelay = 2; // Attacks every 2 turns
    this.turnCounter = 0;
    this.isDead = false;
    this.damageFlash = 0;
    this.attackFlash = 0;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.health -= actualDamage;
    this.damageFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      gameState.player.gainExperience(this.expReward);
      gameState.player.gold += this.goldReward;
      gameState.gold += this.goldReward;
      gameState.score += this.expReward * 2;
      gameState.enemiesDefeatedThisWave++;
    }
    return actualDamage;
  }

  update() {
    if (this.isDead) return;
    
    if (this.damageFlash > 0) this.damageFlash--;
    if (this.attackFlash > 0) this.attackFlash--;
  }

  performTurn() {
    if (this.isDead) return;
    
    this.turnCounter++;
    if (this.turnCounter >= this.turnDelay) {
      this.turnCounter = 0;
      this.attackFlash = 15;
      const damage = gameState.player.takeDamage(this.attack);
      return damage;
    }
    return 0;
  }

  render(p) {
    if (this.isDead) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flash effects
    if (this.damageFlash > 0) {
      p.fill(255, 100, 100);
    } else if (this.attackFlash > 0) {
      p.fill(255, 200, 0);
    } else {
      p.fill(180, 50, 50);
    }
    
    p.stroke(100, 20, 20);
    p.strokeWeight(2);
    
    // Body
    p.ellipse(0, 5, 28, 35);
    
    // Head
    p.fill(150, 40, 40);
    p.ellipse(0, -10, 24, 24);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(-6, -12, 6, 8);
    p.ellipse(6, -12, 6, 8);
    
    // Horns
    p.stroke(80, 20, 20);
    p.strokeWeight(2);
    p.noFill();
    p.arc(-8, -18, 8, 12, p.PI, p.PI + p.HALF_PI);
    p.arc(8, -18, 8, 12, -p.HALF_PI, 0);
    
    // Health bar
    p.noStroke();
    p.fill(50, 50, 50);
    p.rect(-15, 25, 30, 4);
    const healthPercent = this.health / this.maxHealth;
    p.fill(...(healthPercent > 0.5 ? [0, 255, 0] : healthPercent > 0.25 ? [255, 255, 0] : [255, 0, 0]));
    p.rect(-15, 25, 30 * healthPercent, 4);
    
    p.pop();
  }
}

export function spawnEnemies(p) {
  const numEnemies = gameState.enemiesPerWave + Math.floor(gameState.waveNumber / 3);
  const positions = [];
  
  for (let i = 0; i < numEnemies; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = 380 + p.floor(p.random(0, 3)) * 70;
      y = 120 + p.floor(p.random(0, 4)) * 60;
      attempts++;
    } while (positions.some(pos => p.dist(pos.x, pos.y, x, y) < 50) && attempts < 20);
    
    positions.push({x, y});
    const enemy = new Enemy(x, y);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}