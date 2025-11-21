// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, BIRD_TYPES } from './globals.js';

export class Bird {
  constructor(p, x, y, type = BIRD_TYPES.RED) {
    this.p = p;
    this.type = type;
    this.color = this.getColorForType(type);
    this.launched = false;
    this.abilityUsed = false;
    this.radius = 15;
    
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'bird',
      friction: 0.5,
      restitution: 0.4,
      density: 0.002,
      collisionFilter: {
        category: 0x0002
      }
    });
    
    World.add(gameState.world, this.body);
    
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  getColorForType(type) {
    switch(type) {
      case BIRD_TYPES.RED: return [220, 50, 50];
      case BIRD_TYPES.BLUE: return [50, 150, 220];
      case BIRD_TYPES.YELLOW: return [240, 200, 50];
      default: return [200, 50, 50];
    }
  }
  
  launch(angle, power) {
    const radians = angle * Math.PI / 180;
    const force = power / 1000;
    const velocityX = Math.cos(radians) * force * 100;
    const velocityY = Math.sin(radians) * force * 100;
    
    Body.setVelocity(this.body, { x: velocityX, y: velocityY });
    this.launched = true;
  }
  
  useAbility() {
    if (this.abilityUsed || !this.launched) return;
    
    this.abilityUsed = true;
    
    switch(this.type) {
      case BIRD_TYPES.RED:
        // Speed boost
        const currentVel = this.body.velocity;
        const boostFactor = 1.5;
        Body.setVelocity(this.body, {
          x: currentVel.x * boostFactor,
          y: currentVel.y * boostFactor
        });
        break;
        
      case BIRD_TYPES.BLUE:
        // Split into 3 birds
        this.splitBird();
        break;
        
      case BIRD_TYPES.YELLOW:
        // Dive down
        const vel = this.body.velocity;
        Body.setVelocity(this.body, {
          x: vel.x,
          y: Math.max(vel.y, 15)
        });
        break;
    }
  }
  
  splitBird() {
    const pos = this.body.position;
    const vel = this.body.velocity;
    
    // Create two additional birds
    for (let i = 0; i < 2; i++) {
      const offsetAngle = (i === 0 ? -0.3 : 0.3);
      const newBird = new Bird(this.p, pos.x, pos.y, this.type);
      newBird.launched = true;
      newBird.abilityUsed = true;
      
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const angle = Math.atan2(vel.y, vel.x) + offsetAngle;
      
      Body.setVelocity(newBird.body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      });
      
      gameState.entities.push(newBird);
    }
  }
  
  update() {
    if (this.launched) {
      const dx = Math.abs(this.body.position.x - this.lastLoggedX);
      const dy = Math.abs(this.body.position.y - this.lastLoggedY);
      
      if (dx > 20 || dy > 20) {
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
    }
    
    // Check if bird is out of bounds or stopped moving
    if (this.launched && this.body.position.y > 450) {
      this.remove();
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x - gameState.cameraX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Bird body
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Eye
    this.p.fill(255);
    this.p.circle(5, -3, 8);
    this.p.fill(0);
    this.p.circle(6, -3, 4);
    
    // Beak
    this.p.fill(255, 150, 0);
    this.p.triangle(10, 0, 18, -3, 18, 3);
    
    // Eyebrow (angry look)
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.line(3, -8, 10, -10);
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
  }
}

export class Pig {
  constructor(p, x, y, size = 20) {
    this.p = p;
    this.size = size;
    this.health = 100;
    this.destroyed = false;
    
    this.body = Bodies.circle(x, y, size, {
      label: 'pig',
      friction: 0.8,
      restitution: 0.3,
      density: 0.001,
      collisionFilter: {
        category: 0x0001
      }
    });
    
    World.add(gameState.world, this.body);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      gameState.score += 1000;
      gameState.pigsDestroyed++;
      this.remove();
    }
  }
  
  update() {
    // Check velocity for collision damage
    const speed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x +
      this.body.velocity.y * this.body.velocity.y
    );
    
    if (speed > 5) {
      this.takeDamage(speed * 2);
    }
  }
  
  render() {
    if (this.destroyed) return;
    
    this.p.push();
    this.p.translate(this.body.position.x - gameState.cameraX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Pig body (green)
    this.p.fill(100, 200, 100);
    this.p.noStroke();
    this.p.circle(0, 0, this.size * 2);
    
    // Snout
    this.p.fill(120, 220, 120);
    this.p.circle(0, 5, this.size);
    
    // Nostrils
    this.p.fill(80, 160, 80);
    this.p.circle(-3, 5, 4);
    this.p.circle(3, 5, 4);
    
    // Eyes
    this.p.fill(255);
    this.p.circle(-5, -5, 8);
    this.p.circle(5, -5, 8);
    this.p.fill(0);
    this.p.circle(-5, -5, 4);
    this.p.circle(5, -5, 4);
    
    // Health bar
    if (this.health < 100) {
      this.p.fill(200, 0, 0);
      this.p.rect(-15, -25, 30, 4);
      this.p.fill(0, 200, 0);
      this.p.rect(-15, -25, 30 * (this.health / 100), 4);
    }
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Block {
  constructor(p, x, y, width, height, type = 'wood') {
    this.p = p;
    this.width = width;
    this.height = height;
    this.type = type;
    this.destroyed = false;
    this.health = 100;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'block',
      friction: 0.8,
      restitution: 0.1,
      density: 0.001,
      collisionFilter: {
        category: 0x0001
      }
    });
    
    World.add(gameState.world, this.body);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      gameState.score += 100;
      this.remove();
    }
  }
  
  update() {
    // Check velocity for collision damage
    const speed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x +
      this.body.velocity.y * this.body.velocity.y
    );
    
    if (speed > 5) {
      this.takeDamage(speed * 3);
    }
  }
  
  render() {
    if (this.destroyed) return;
    
    this.p.push();
    this.p.translate(this.body.position.x - gameState.cameraX, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Wood texture
    if (this.type === 'wood') {
      this.p.fill(139, 90, 43);
      this.p.stroke(101, 67, 33);
    } else {
      this.p.fill(150, 150, 150);
      this.p.stroke(100, 100, 100);
    }
    
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Wood grain effect
    if (this.type === 'wood') {
      this.p.stroke(120, 80, 40);
      this.p.strokeWeight(1);
      for (let i = -this.width/2 + 5; i < this.width/2; i += 10) {
        this.p.line(i, -this.height/2, i, this.height/2);
      }
    }
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Ground {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'ground',
      isStatic: true,
      friction: 0.9,
      restitution: 0.1
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x - gameState.cameraX, this.body.position.y);
    
    // Ground with grass
    this.p.fill(101, 67, 33); // Brown dirt
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Grass on top
    this.p.fill(34, 139, 34);
    this.p.rect(0, -this.height/2 + 5, this.width, 10);
    
    // Grass blades
    this.p.stroke(20, 100, 20);
    this.p.strokeWeight(2);
    for (let i = -this.width/2; i < this.width/2; i += 20) {
      this.p.line(i, -this.height/2, i - 2, -this.height/2 - 5);
      this.p.line(i, -this.height/2, i + 2, -this.height/2 - 5);
    }
    
    this.p.pop();
  }
}