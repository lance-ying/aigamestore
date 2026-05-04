// vehicle.js
import { gameState, GROUND_Y, GRAVITY } from './globals.js';

export class Vehicle {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.rotationVel = 0;
    this.width = 60;
    this.height = 30;
    this.wheelRadius = 12;
    this.onGround = false;
    this.nitroActive = false;
    this.nitroCooldown = 0;
  }

  getSpeed() {
    const engineLevel = gameState.upgrades.engine;
    return 3 + engineLevel * 0.5;
  }

  getNitroBoost() {
    const nitroLevel = gameState.upgrades.nitro;
    return 2 + nitroLevel * 0.3;
  }

  update() {
    const p = this.p;
    
    // Base acceleration
    const baseSpeed = this.getSpeed();
    this.vx += 0.1;
    if (this.vx < baseSpeed) {
      this.vx = p.min(this.vx + 0.05, baseSpeed);
    }
    
    // Nitro boost
    this.nitroCooldown = p.max(0, this.nitroCooldown - 1);
    if (this.nitroActive && gameState.nitro > 0 && this.nitroCooldown === 0) {
      this.vx += this.getNitroBoost();
      gameState.nitro -= 0.5;
      if (gameState.nitro < 0) gameState.nitro = 0;
      this.spawnNitroParticle();
    }
    
    // Fuel consumption
    if (gameState.fuel > 0) {
      gameState.fuel -= 0.02 * (1 + this.vx * 0.01);
      if (gameState.fuel < 0) gameState.fuel = 0;
    } else {
      this.vx *= 0.98;
    }
    
    // Braking
    if (gameState.keys[40]) { // Down arrow
      this.vx *= 0.95;
    }
    
    // Air control
    if (!this.onGround) {
      if (gameState.keys[37]) { // Left arrow
        this.rotationVel -= 0.002;
      }
      if (gameState.keys[39]) { // Right arrow
        this.rotationVel += 0.002;
      }
    }
    
    // Gravity
    this.vy += GRAVITY;
    
    // Ground collision
    const groundLevel = this.getGroundLevel();
    this.onGround = false;
    
    if (this.y + this.height / 2 >= groundLevel) {
      this.y = groundLevel - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      
      // Ground friction affects rotation
      if (p.abs(this.rotation) > 0.1) {
        this.rotation *= 0.9;
      } else {
        this.rotation = 0;
      }
      this.rotationVel *= 0.8;
      
      // Landing impact
      if (p.abs(this.rotation) > 0.3) {
        const damage = p.abs(this.rotation) * 20;
        gameState.health -= damage;
        this.vx *= 0.7;
        this.spawnDebris();
      }
    }
    
    // Update rotation
    this.rotation += this.rotationVel;
    this.rotationVel *= 0.98;
    this.rotation = p.constrain(this.rotation, -p.PI / 2, p.PI / 2);
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Update distance
    gameState.distance = p.max(0, this.x - 100);
    if (gameState.distance > gameState.maxDistance) {
      gameState.maxDistance = gameState.distance;
    }
  }
  
  getGroundLevel() {
    const p = this.p;
    // Terrain variation
    const terrainOffset = p.sin(this.x * 0.01) * 20 + p.sin(this.x * 0.02) * 10;
    return GROUND_Y + terrainOffset;
  }
  
  spawnNitroParticle() {
    const p = this.p;
    for (let i = 0; i < 2; i++) {
      gameState.particles.push({
        x: this.x - this.width / 2,
        y: this.y + p.random(-10, 10),
        vx: p.random(-2, -1),
        vy: p.random(-1, 1),
        life: 20,
        color: [255, 150 + p.random(50), 0]
      });
    }
  }
  
  spawnDebris() {
    const p = this.p;
    for (let i = 0; i < 5; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: p.random(-3, 3),
        vy: p.random(-3, -1),
        life: 30,
        color: [100, 100, 100]
      });
    }
  }
  
  collideWithZombie(zombie) {
    const p = this.p;
    const dx = this.x - zombie.x;
    const dy = this.y - zombie.y;
    const dist = p.sqrt(dx * dx + dy * dy);
    
    if (dist < this.width / 2 + zombie.width / 2) {
      // Kill zombie
      zombie.health = 0;
      gameState.zombiesKilled++;
      gameState.score += 10;
      
      // Damage and momentum loss
      const armorLevel = gameState.upgrades.armor;
      const damage = 5 - armorLevel * 0.5;
      gameState.health -= p.max(1, damage);
      
      this.vx *= 0.92;
      
      // Spawn blood particles
      for (let i = 0; i < 8; i++) {
        gameState.particles.push({
          x: zombie.x,
          y: zombie.y,
          vx: p.random(-2, 2),
          vy: p.random(-3, -1),
          life: 40,
          color: [200, 0, 0]
        });
      }
      
      return true;
    }
    return false;
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.x - gameState.cameraX, this.y);
    p.rotate(this.rotation);
    
    // Vehicle body
    p.fill(80, 100, 120);
    p.stroke(50, 70, 90);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Armor plating
    if (gameState.upgrades.armor > 0) {
      p.fill(150, 150, 150);
      p.rect(-this.width / 2 - 5, -this.height / 2 - 5, 10, this.height + 10, 2);
    }
    
    // Weapon
    if (gameState.upgrades.weapon > 0) {
      p.fill(60, 60, 60);
      p.rect(this.width / 2 - 10, -this.height / 2 - 5, 15, 8, 2);
      
      // Spikes
      for (let i = 0; i < 3; i++) {
        p.triangle(
          this.width / 2 - 10 + i * 8, -this.height / 2 - 5,
          this.width / 2 - 10 + i * 8 + 4, -this.height / 2 - 12,
          this.width / 2 - 10 + i * 8 + 8, -this.height / 2 - 5
        );
      }
    }
    
    // Wheels
    p.fill(40, 40, 40);
    p.stroke(30, 30, 30);
    p.circle(-this.width / 3, this.height / 2, this.wheelRadius * 2);
    p.circle(this.width / 3, this.height / 2, this.wheelRadius * 2);
    
    // Wheel details
    p.stroke(60, 60, 60);
    p.line(-this.width / 3 - 5, this.height / 2, -this.width / 3 + 5, this.height / 2);
    p.line(-this.width / 3, this.height / 2 - 5, -this.width / 3, this.height / 2 + 5);
    p.line(this.width / 3 - 5, this.height / 2, this.width / 3 + 5, this.height / 2);
    p.line(this.width / 3, this.height / 2 - 5, this.width / 3, this.height / 2 + 5);
    
    // Nitro flame
    if (this.nitroActive && gameState.nitro > 0) {
      p.noStroke();
      p.fill(255, 100, 0, 200);
      p.triangle(-this.width / 2, -5, -this.width / 2, 5, -this.width / 2 - 20, 0);
      p.fill(255, 200, 0, 150);
      p.triangle(-this.width / 2, -3, -this.width / 2, 3, -this.width / 2 - 15, 0);
    }
    
    p.pop();
  }
}