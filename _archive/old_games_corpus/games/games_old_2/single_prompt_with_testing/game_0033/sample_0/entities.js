// entities.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WATER_LEVEL } from './globals.js';

export class Worm {
  constructor(p, x, y, team) {
    this.p = p;
    this.team = team; // 'player' or 'enemy'
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    
    this.body = Bodies.circle(x, y, 8, {
      label: `worm_${team}`,
      friction: 0.8,
      restitution: 0.2,
      density: 0.002,
      frictionAir: 0.01
    });
    World.add(gameState.world, this.body);
    
    this.color = team === 'player' ? [0, 150, 255] : [255, 50, 50];
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    this.canJump = false;
    this.jumpCooldown = 0;
  }
  
  update() {
    if (!this.alive) return;
    
    // Check if worm fell in water
    if (this.body.position.y > WATER_LEVEL) {
      this.takeDamage(this.health);
    }
    
    // Check if on ground for jumping
    this.canJump = Math.abs(this.body.velocity.y) < 0.5;
    
    if (this.jumpCooldown > 0) this.jumpCooldown--;
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    if (dx > 5 || dy > 5) {
      if (this.team === 'player' && gameState.playerWorms[0] === this) {
        this.p.logs.player_info.push({
          screen_x: this.body.position.x,
          screen_y: this.body.position.y,
          game_x: this.body.position.x,
          game_y: this.body.position.y,
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }
  
  render() {
    if (!this.alive) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Draw worm body
    p.fill(this.color);
    p.noStroke();
    p.circle(0, 0, 16);
    
    // Draw eyes
    p.fill(255);
    p.circle(-3, -2, 4);
    p.circle(3, -2, 4);
    p.fill(0);
    p.circle(-3, -2, 2);
    p.circle(3, -2, 2);
    
    p.pop();
    
    // Draw health bar
    p.push();
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(this.body.position.x - 15, this.body.position.y - 20, 30, 4);
    p.fill(0, 255, 0);
    const healthWidth = (this.health / this.maxHealth) * 30;
    p.rect(this.body.position.x - 15, this.body.position.y - 20, healthWidth, 4);
    p.pop();
  }
  
  moveLeft() {
    if (!this.alive) return;
    Body.applyForce(this.body, this.body.position, { x: -0.002, y: 0 });
  }
  
  moveRight() {
    if (!this.alive) return;
    Body.applyForce(this.body, this.body.position, { x: 0.002, y: 0 });
  }
  
  jump() {
    if (!this.alive || !this.canJump || this.jumpCooldown > 0) return;
    Body.setVelocity(this.body, { x: this.body.velocity.x, y: -8 });
    this.jumpCooldown = 30;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      World.remove(gameState.world, this.body);
    }
  }
}

export class Projectile {
  constructor(p, x, y, vx, vy, weaponType) {
    this.p = p;
    this.weaponType = weaponType;
    this.exploded = false;
    this.explosionTimer = 0;
    
    this.body = Bodies.circle(x, y, 3, {
      label: 'projectile',
      friction: 0.3,
      restitution: 0.6,
      density: 0.001,
      frictionAir: 0.01
    });
    Body.setVelocity(this.body, { x: vx, y: vy });
    World.add(gameState.world, this.body);
  }
  
  update() {
    if (this.exploded) {
      this.explosionTimer--;
      if (this.explosionTimer <= 0) {
        return true; // Mark for removal
      }
      return false;
    }
    
    // Apply wind force
    Body.applyForce(this.body, this.body.position, { 
      x: gameState.wind * 0.00005, 
      y: 0 
    });
    
    // Check if hit ground or out of bounds
    const hitGround = this.checkTerrainCollision();
    const outOfBounds = this.body.position.y > CANVAS_HEIGHT || 
                        this.body.position.x < 0 || 
                        this.body.position.x > CANVAS_WIDTH;
    
    if (hitGround || outOfBounds || Math.abs(this.body.velocity.x) < 0.5 && Math.abs(this.body.velocity.y) < 0.5) {
      this.explode();
    }
    
    return false;
  }
  
  checkTerrainCollision() {
    for (let terrain of gameState.terrain) {
      if (!terrain.alive) continue;
      const dx = this.body.position.x - terrain.body.position.x;
      const dy = this.body.position.y - terrain.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        return true;
      }
    }
    return false;
  }
  
  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.explosionTimer = 20;
    
    const weapon = gameState.selectedWeapon;
    const weaponData = this.weaponType;
    
    // Create explosion effect
    gameState.explosions.push({
      x: this.body.position.x,
      y: this.body.position.y,
      radius: weaponData.radius,
      timer: 15,
      color: weaponData.color
    });
    
    // Damage worms in radius
    const allWorms = [...gameState.playerWorms, ...gameState.enemyWorms];
    for (let worm of allWorms) {
      if (!worm.alive) continue;
      const dx = worm.body.position.x - this.body.position.x;
      const dy = worm.body.position.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < weaponData.radius) {
        const damageMultiplier = 1 - (dist / weaponData.radius);
        const damage = weaponData.damage * damageMultiplier;
        worm.takeDamage(damage);
        
        // Apply knockback
        const force = 0.01 * damageMultiplier;
        const angle = Math.atan2(dy, dx);
        Body.applyForce(worm.body, worm.body.position, {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        });
      }
    }
    
    // Destroy terrain
    for (let terrain of gameState.terrain) {
      if (!terrain.alive) continue;
      const dx = terrain.body.position.x - this.body.position.x;
      const dy = terrain.body.position.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < weaponData.radius * 0.8) {
        terrain.destroy();
      }
    }
    
    World.remove(gameState.world, this.body);
  }
  
  render() {
    if (this.exploded) {
      // Render explosion
      const p = this.p;
      const weapon = this.weaponType;
      const progress = this.explosionTimer / 20;
      p.push();
      p.noStroke();
      p.fill(weapon.color[0], weapon.color[1], weapon.color[2], progress * 200);
      p.circle(this.body.position.x, this.body.position.y, weapon.radius * 2 * (1 - progress * 0.5));
      p.fill(255, 255, 100, progress * 255);
      p.circle(this.body.position.x, this.body.position.y, weapon.radius * (1 - progress * 0.7));
      p.pop();
    } else {
      // Render projectile
      const p = this.p;
      const weapon = this.weaponType;
      p.push();
      p.fill(weapon.color);
      p.noStroke();
      p.circle(this.body.position.x, this.body.position.y, 6);
      p.pop();
    }
  }
}

export class Terrain {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.alive = true;
    
    this.body = Bodies.rectangle(x, y, w, h, {
      label: 'terrain',
      isStatic: true,
      friction: 0.8,
      restitution: 0
    });
    World.add(gameState.world, this.body);
    
    this.color = [100 + Math.random() * 50, 150 + Math.random() * 50, 50];
  }
  
  render() {
    if (!this.alive) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    p.fill(this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    
    const vertices = this.body.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[1].y);
    
    p.rect(0, 0, width, height);
    p.pop();
  }
  
  destroy() {
    if (!this.alive) return;
    this.alive = false;
    World.remove(gameState.world, this.body);
  }
}