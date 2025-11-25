// ai.js - Enemy AI

import { Projectile } from './projectile.js';
import { gameState, WEAPONS } from './globals.js';
import { clamp } from './utils.js';

export class EnemyAI {
  constructor(p, enemy) {
    this.p = p;
    this.enemy = enemy;
    this.thinkTime = 0;
    this.maxThinkTime = 60; // 1 second
    this.targetAngle = 0;
    this.targetPower = 0;
    this.calculated = false;
  }

  update() {
    if (!this.enemy.alive) return;

    this.thinkTime++;

    if (this.thinkTime >= this.maxThinkTime && !this.calculated) {
      this.calculateShot();
      this.calculated = true;
    }

    if (this.thinkTime >= this.maxThinkTime + 30) {
      this.fireShot();
      return true; // Turn complete
    }

    return false;
  }

  calculateShot() {
    const p = this.p;
    const player = gameState.player;
    
    if (!player || !player.alive) return;

    const dx = player.x - this.enemy.x;
    const dy = player.y - this.enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate base angle
    let baseAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Add some randomness for difficulty variation
    const angleNoise = p.random(-10, 10);
    this.targetAngle = clamp(baseAngle + angleNoise, 0, 180);

    // Calculate power based on distance
    const basePower = Math.min(100, (distance / 4) + 30);
    const powerNoise = p.random(-10, 10);
    this.targetPower = clamp(basePower + powerNoise, 20, 100);
  }

  fireShot() {
    if (!this.enemy.alive) return;

    const weapon = WEAPONS[0]; // Enemies use basic weapon
    const turretEnd = this.enemy.getTurretEnd();
    
    const projectile = new Projectile(
      this.p,
      turretEnd.x,
      turretEnd.y,
      this.targetAngle,
      this.targetPower,
      weapon,
      gameState.windSpeed,
      gameState.windDirection
    );

    gameState.projectiles.push(projectile);
    this.reset();
  }

  reset() {
    this.thinkTime = 0;
    this.calculated = false;
  }
}