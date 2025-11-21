// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, BIRD_TYPES } from './globals.js';

export class Bird {
  constructor(p, x, y, type = "RED") {
    this.p = p;
    this.type = type;
    this.birdData = BIRD_TYPES[type];
    this.color = this.birdData.color;
    this.ability = this.birdData.ability;
    this.abilityActivated = false;
    this.splitBirds = [];
    
    this.body = Bodies.circle(x, y, 15, {
      label: 'bird',
      density: 0.002,
      restitution: 0.4,
      friction: 0.8
    });
    
    World.add(gameState.world, this.body);
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update() {
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    
    if (dx > 5 || dy > 5) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
    
    // Check if bird is out of bounds or at rest
    if (this.body.position.y > 450 || this.body.position.x > 800 || this.body.position.x < -100) {
      return true; // Signal to remove/reset
    }
    
    return false;
  }
  
  render(offsetX = 0) {
    this.p.push();
    this.p.translate(this.body.position.x - offsetX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw bird body
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 30);
    
    // Draw eye
    this.p.fill(255);
    this.p.noStroke();
    this.p.circle(8, -3, 8);
    this.p.fill(0);
    this.p.circle(10, -3, 4);
    
    // Draw beak
    this.p.fill(255, 200, 0);
    this.p.triangle(12, 0, 18, -2, 12, 4);
    
    this.p.pop();
    
    // Render split birds if any
    for (let splitBird of this.splitBirds) {
      this.p.push();
      this.p.translate(splitBird.position.x - offsetX, splitBird.position.y);
      this.p.rotate(splitBird.angle);
      this.p.fill(this.color[0], this.color[1], this.color[2], 200);
      this.p.stroke(0);
      this.p.strokeWeight(1);
      this.p.circle(0, 0, 20);
      this.p.pop();
    }
  }
  
  activateAbility() {
    if (this.abilityActivated) return;
    this.abilityActivated = true;
    
    switch (this.ability) {
      case "speed_boost":
        // Boost velocity in current direction
        const vx = this.body.velocity.x * 1.8;
        const vy = this.body.velocity.y * 1.8;
        Body.setVelocity(this.body, { x: vx, y: vy });
        break;
        
      case "split":
        // Split into 3 smaller birds
        const baseVx = this.body.velocity.x;
        const baseVy = this.body.velocity.y;
        
        for (let i = 0; i < 3; i++) {
          const angle = (i - 1) * 0.3;
          const splitBody = Bodies.circle(
            this.body.position.x,
            this.body.position.y,
            8,
            {
              label: 'bird_split',
              density: 0.001,
              restitution: 0.3
            }
          );
          
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const newVx = baseVx * cos - baseVy * sin;
          const newVy = baseVx * sin + baseVy * cos;
          
          Body.setVelocity(splitBody, { x: newVx, y: newVy });
          World.add(gameState.world, splitBody);
          this.splitBirds.push(splitBody);
        }
        break;
        
      case "explode":
        // Create explosion effect - apply force to nearby objects
        const explosionRadius = 80;
        for (let entity of gameState.entities) {
          if (entity.body && entity.body !== this.body) {
            const dx = entity.body.position.x - this.body.position.x;
            const dy = entity.body.position.y - this.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < explosionRadius && dist > 0) {
              const forceMag = 0.015 * (1 - dist / explosionRadius);
              const forceX = (dx / dist) * forceMag;
              const forceY = (dy / dist) * forceMag;
              Body.applyForce(entity.body, entity.body.position, { x: forceX, y: forceY });
            }
          }
        }
        break;
    }
  }
  
  cleanup() {
    if (this.body) {
      World.remove(gameState.world, this.body);
    }
    for (let splitBody of this.splitBirds) {
      World.remove(gameState.world, splitBody);
    }
  }
}

export class Pig {
  constructor(p, x, y) {
    this.p = p;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    
    this.body = Bodies.circle(x, y, 18, {
      label: 'pig',
      density: 0.001,
      restitution: 0.2,
      friction: 0.9
    });
    
    World.add(gameState.world, this.body);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      gameState.score += 100;
      gameState.gems += 2;
    }
  }
  
  update() {
    // Pigs take damage based on collision velocity
    const speed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.y ** 2
    );
    
    if (speed > 3) {
      this.takeDamage((speed - 3) * 2);
    }
  }
  
  render(offsetX = 0) {
    if (!this.alive) return;
    
    this.p.push();
    this.p.translate(this.body.position.x - offsetX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw pig body
    this.p.fill(100, 200, 100);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 36);
    
    // Draw snout
    this.p.fill(120, 220, 120);
    this.p.ellipse(0, 5, 20, 15);
    this.p.fill(80, 160, 80);
    this.p.circle(-4, 5, 5);
    this.p.circle(4, 5, 5);
    
    // Draw eyes
    this.p.fill(255);
    this.p.circle(-6, -3, 10);
    this.p.circle(6, -3, 10);
    this.p.fill(0);
    this.p.circle(-5, -3, 5);
    this.p.circle(7, -3, 5);
    
    this.p.pop();
    
    // Draw health bar
    if (this.health < this.maxHealth) {
      this.p.push();
      this.p.noStroke();
      this.p.fill(255, 0, 0);
      this.p.rect(this.body.position.x - offsetX - 15, this.body.position.y - 30, 30, 4);
      this.p.fill(0, 255, 0);
      this.p.rect(
        this.body.position.x - offsetX - 15,
        this.body.position.y - 30,
        30 * (this.health / this.maxHealth),
        4
      );
      this.p.pop();
    }
  }
  
  cleanup() {
    if (this.body) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Structure {
  constructor(p, x, y, width, height, type = "wood") {
    this.p = p;
    this.type = type;
    this.health = type === "wood" ? 50 : 100;
    this.maxHealth = this.health;
    this.destroyed = false;
    
    const options = {
      label: 'structure',
      density: type === "wood" ? 0.001 : 0.002,
      restitution: 0.1,
      friction: 0.8
    };
    
    this.body = Bodies.rectangle(x, y, width, height, options);
    World.add(gameState.world, this.body);
    
    this.width = width;
    this.height = height;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroyed = true;
      gameState.score += 10;
      gameState.gems += 1;
    }
  }
  
  update() {
    const speed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.y ** 2
    );
    
    if (speed > 4) {
      this.takeDamage((speed - 4) * 3);
    }
  }
  
  render(offsetX = 0) {
    if (this.destroyed) return;
    
    this.p.push();
    this.p.translate(this.body.position.x - offsetX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Color based on type and damage
    const healthRatio = this.health / this.maxHealth;
    if (this.type === "wood") {
      this.p.fill(139 * healthRatio, 90 * healthRatio, 43 * healthRatio);
    } else {
      this.p.fill(120 * healthRatio, 120 * healthRatio, 120 * healthRatio);
    }
    
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw wood grain or stone texture
    if (this.type === "wood") {
      this.p.stroke(100, 60, 20, 100);
      this.p.strokeWeight(1);
      for (let i = -this.width/2; i < this.width/2; i += 8) {
        this.p.line(i, -this.height/2, i, this.height/2);
      }
    } else {
      this.p.noStroke();
      this.p.fill(100, 100, 100, 80);
      for (let i = 0; i < 5; i++) {
        const rx = (i * 17 % this.width) - this.width/2;
        const ry = (i * 23 % this.height) - this.height/2;
        this.p.circle(rx, ry, 3);
      }
    }
    
    this.p.pop();
  }
  
  cleanup() {
    if (this.body) {
      World.remove(gameState.world, this.body);
    }
  }
}