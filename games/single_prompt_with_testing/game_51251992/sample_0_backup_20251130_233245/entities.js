// Game Entities Classes
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World, Vector } = Matter;
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { drawBody } from './renderer.js';

class Entity {
  constructor(p) {
    this.p = p;
    this.markedForDeletion = false;
  }
  
  destroy() {
    this.markedForDeletion = true;
    if (this.body) {
      gameState.bodiesToRemove.push(this.body);
    }
  }
}

export class Player extends Entity {
  constructor(p, x, y, type = "WARRIOR") {
    super(p);
    this.type = type;
    
    // Stats based on class
    this.maxHealth = type === "WARRIOR" ? 100 : 60;
    this.health = this.maxHealth;
    this.speed = type === "WARRIOR" ? 3 : 4;
    
    // Physics Body
    this.radius = 15;
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'player',
      frictionAir: 0.1, // High friction for tight controls
      restitution: 0
    });
    World.add(gameState.world, this.body);
    
    this.facing = { x: 0, y: -1 };
    this.cooldown = 0;
    this.dashCooldown = 0;
  }
  
  update() {
    // Cooldowns
    if (this.cooldown > 0) this.cooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    
    // Update facing direction based on movement
    const vel = this.body.velocity;
    if (Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
      this.facing = Vector.normalise(vel);
    }
    
    // Log info occasionally
    if (this.p.frameCount % 60 === 0) {
      this.p.logs.player_info.push({
        health: this.health,
        pos: this.body.position,
        score: gameState.score,
        timestamp: Date.now()
      });
    }
  }
  
  move(x, y) {
    // Direct velocity control for responsive feel
    Body.setVelocity(this.body, {
      x: x * this.speed,
      y: y * this.speed
    });
  }
  
  dash() {
    if (this.dashCooldown > 0) return;
    
    const force = Vector.mult(this.facing, 0.15); // Impulse
    Body.applyForce(this.body, this.body.position, force);
    this.dashCooldown = 60; // 1 second
  }
  
  attack() {
    if (this.cooldown > 0) return;
    
    if (this.type === "WIZARD") {
      // Shoot fireball
      const proj = new Projectile(this.p, 
        this.body.position.x + this.facing.x * 30,
        this.body.position.y + this.facing.y * 30,
        this.facing
      );
      gameState.entities.push(proj);
    } else {
      // Melee Swing
      const sensorPos = Vector.add(this.body.position, Vector.mult(this.facing, 40));
      const sensor = Bodies.circle(sensorPos.x, sensorPos.y, 30, {
        label: 'attackSensor',
        isSensor: true,
        isStatic: true // Temporary static sensor
      });
      
      // Add sensor briefly
      World.add(gameState.world, sensor);
      setTimeout(() => {
        World.remove(gameState.world, sensor);
      }, 100);
      
      // Visual feedback handled in renderer
      this.isAttacking = true;
      setTimeout(() => this.isAttacking = false, 150);
    }
    
    this.cooldown = 30; // 0.5s
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
      this.p.logs.game_info.push({ event: "PLAYER_DIED", score: gameState.score });
    }
  }
  
  render(p) {
    const pos = this.body.position;
    
    p.push();
    p.translate(pos.x, pos.y);
    
    // Draw Character
    p.fill(this.type === "WARRIOR" ? '#4a90e2' : '#9b59b6');
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    // Draw direction indicator
    p.stroke(255, 200);
    p.strokeWeight(2);
    p.line(0, 0, this.facing.x * 20, this.facing.y * 20);
    
    // Draw Health Bar
    p.noStroke();
    p.fill(255, 0, 0);
    p.rect(-20, -30, 40, 5);
    p.fill(0, 255, 0);
    p.rect(-20, -30, 40 * (this.health / this.maxHealth), 5);
    
    // Melee Swipe Visual
    if (this.isAttacking && this.type === "WARRIOR") {
      p.noFill();
      p.stroke(255);
      p.strokeWeight(3);
      p.arc(0, 0, 60, 60, 
            Math.atan2(this.facing.y, this.facing.x) - 1, 
            Math.atan2(this.facing.y, this.facing.x) + 1);
    }
    
    p.pop();
  }
}

export class Enemy extends Entity {
  constructor(p, x, y, type = "SLIME") {
    super(p);
    this.type = type;
    
    this.radius = 15;
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'enemy',
      frictionAir: 0.05,
      restitution: 0.5
    });
    World.add(gameState.world, this.body);
    
    this.health = 30;
    this.speed = 1.5;
    this.aggroRange = 300;
  }
  
  update() {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.body.position;
    const myPos = this.body.position;
    const dist = Vector.magnitude(Vector.sub(playerPos, myPos));
    
    // Simple AI
    if (dist < this.aggroRange) {
      const dir = Vector.normalise(Vector.sub(playerPos, myPos));
      Body.setVelocity(this.body, {
        x: dir.x * this.speed,
        y: dir.y * this.speed
      });
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      gameState.score += 50;
      
      // Chance to drop loot
      if (Math.random() < 0.3) {
        gameState.entities.push(new Collectible(this.p, this.body.position.x, this.body.position.y));
      }
    }
  }
  
  render(p) {
    const pos = this.body.position;
    p.push();
    p.translate(pos.x, pos.y);
    p.fill(this.type === "SLIME" ? '#e74c3c' : '#e67e22');
    p.noStroke();
    // Wobble effect
    const wobble = Math.sin(p.frameCount * 0.2) * 2;
    p.circle(0, 0, this.radius * 2 + wobble);
    
    // Eyes
    p.fill(0);
    p.circle(-5, -5, 4);
    p.circle(5, -5, 4);
    p.pop();
  }
}

export class Collectible extends Entity {
  constructor(p, x, y) {
    super(p);
    this.value = 100;
    this.body = Bodies.circle(x, y, 10, {
      label: 'collectible',
      isSensor: true,
      isStatic: true
    });
    World.add(gameState.world, this.body);
  }
  
  collect() {
    gameState.score += this.value;
    this.destroy();
  }
  
  render(p) {
    const pos = this.body.position;
    p.push();
    p.translate(pos.x, pos.y);
    p.fill('#f1c40f');
    p.noStroke();
    p.rotate(p.frameCount * 0.05);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 15, 15);
    p.pop();
  }
}

export class Projectile extends Entity {
  constructor(p, x, y, direction) {
    super(p);
    this.damage = 20;
    this.body = Bodies.circle(x, y, 5, {
      label: 'projectile',
      frictionAir: 0,
      restitution: 0.8
    });
    
    const speed = 8;
    Body.setVelocity(this.body, {
      x: direction.x * speed,
      y: direction.y * speed
    });
    
    World.add(gameState.world, this.body);
    this.life = 120; // 2 seconds
  }
  
  update() {
    this.life--;
    if (this.life <= 0) this.destroy();
  }
  
  render(p) {
    drawBody(p, this.body, '#3498db');
  }
}

export class Wall {
  constructor(p, x, y, w, h) {
    this.body = Bodies.rectangle(x, y, w, h, {
      label: 'wall',
      isStatic: true
    });
    World.add(gameState.world, this.body);
    this.w = w;
    this.h = h;
    this.color = '#7f8c8d';
  }
  
  render(p) {
    drawBody(p, this.body, this.color);
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}