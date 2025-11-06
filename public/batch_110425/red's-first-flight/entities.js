// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { 
  gameState, 
  BIRD_RADIUS, 
  PIG_RADIUS, 
  BLOCK_WIDTH, 
  BLOCK_HEIGHT,
  BLOCK_POINTS,
  PIG_POINTS
} from './globals.js';

export class Bird {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, BIRD_RADIUS, {
      label: 'bird',
      density: 0.002,
      restitution: 0.4,
      friction: 0.3
    });
    this.body.isStatic = true; // Static until launched
    World.add(gameState.world, this.body);
    
    this.color = [220, 50, 50];
    this.launched = false;
    this.settled = false;
    this.settledTime = 0;
  }
  
  launch(forceX, forceY) {
    Body.setStatic(this.body, false);
    Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    this.launched = true;
  }
  
  update() {
    if (this.launched && !this.settled) {
      const speed = Math.sqrt(
        this.body.velocity.x * this.body.velocity.x +
        this.body.velocity.y * this.body.velocity.y
      );
      
      // Check if bird has settled (stopped moving)
      if (speed < 0.5) {
        this.settledTime++;
        if (this.settledTime > 60) { // 1 second at 60 fps
          this.settled = true;
        }
      } else {
        this.settledTime = 0;
      }
    }
    
    // Remove if out of bounds
    if (this.body.position.y > 500) {
      this.settled = true;
    }
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Draw bird body
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.noStroke();
    p.circle(0, 0, BIRD_RADIUS * 2);
    
    // Draw eye
    p.fill(255);
    p.circle(3, -2, 6);
    p.fill(0);
    p.circle(4, -2, 3);
    
    // Draw beak
    p.fill(255, 200, 0);
    p.triangle(8, 0, 12, -2, 12, 2);
    
    p.pop();
  }
}

export class Pig {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, PIG_RADIUS, {
      label: 'pig',
      density: 0.001,
      restitution: 0.3,
      friction: 0.5
    });
    World.add(gameState.world, this.body);
    
    this.color = [100, 200, 100];
    this.health = 100;
    this.eliminated = false;
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0 && !this.eliminated) {
      this.eliminated = true;
      gameState.score += PIG_POINTS;
      return true;
    }
    return false;
  }
  
  update() {
    // Damage based on high velocity impacts handled in physics.js
  }
  
  render() {
    if (this.eliminated) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Draw pig body
    const healthRatio = this.health / 100;
    p.fill(
      this.color[0] * healthRatio,
      this.color[1] * healthRatio,
      this.color[2] * healthRatio
    );
    p.noStroke();
    p.circle(0, 0, PIG_RADIUS * 2);
    
    // Draw snout
    p.fill(120, 220, 120);
    p.circle(0, 3, 10);
    p.fill(80, 150, 80);
    p.circle(-2, 3, 3);
    p.circle(2, 3, 3);
    
    // Draw eyes
    p.fill(255);
    p.circle(-4, -3, 5);
    p.circle(4, -3, 5);
    p.fill(0);
    p.circle(-4, -3, 2);
    p.circle(4, -3, 2);
    
    p.pop();
  }
}

export class Block {
  constructor(p, x, y, width, height, type = 'wood') {
    this.p = p;
    this.width = width;
    this.height = height;
    this.type = type;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'block',
      density: 0.001,
      restitution: 0.2,
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    
    this.color = type === 'wood' ? [160, 120, 80] : [100, 100, 100];
    this.health = type === 'wood' ? 50 : 100;
    this.destroyed = false;
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      gameState.score += BLOCK_POINTS;
      return true;
    }
    return false;
  }
  
  update() {
    // Damage handled in physics.js
  }
  
  render() {
    if (this.destroyed) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    const healthRatio = this.health / (this.type === 'wood' ? 50 : 100);
    p.fill(
      this.color[0] * healthRatio,
      this.color[1] * healthRatio,
      this.color[2] * healthRatio
    );
    p.stroke(50);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw wood grain
    if (this.type === 'wood') {
      p.stroke(140, 100, 60);
      p.strokeWeight(1);
      for (let i = -this.width / 2; i < this.width / 2; i += 10) {
        p.line(i, -this.height / 2, i, this.height / 2);
      }
    }
    
    p.pop();
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
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    
    this.color = [100, 200, 100];
  }
  
  update() {}
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw grass details
    p.stroke(80, 160, 80);
    p.strokeWeight(2);
    for (let i = -this.width / 2; i < this.width / 2; i += 20) {
      p.line(i, -this.height / 2, i - 3, -this.height / 2 - 5);
      p.line(i, -this.height / 2, i + 3, -this.height / 2 - 5);
    }
    
    p.pop();
  }
}

export class Slingshot {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.baseWidth = 15;
    this.baseHeight = 60;
    this.color = [80, 50, 30];
  }
  
  update() {}
  
  render(angle, power) {
    const p = this.p;
    p.push();
    
    // Draw base
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.baseWidth, this.baseHeight);
    
    // Draw slingshot arms
    p.stroke(60, 40, 20);
    p.strokeWeight(3);
    p.line(this.x - 7, this.y - 30, this.x - 10, this.y - 50);
    p.line(this.x + 7, this.y - 30, this.x + 10, this.y - 50);
    
    // Draw elastic band if bird is ready
    if (gameState.currentBird && !gameState.birdLaunched) {
      const angleRad = (angle * Math.PI) / 180;
      const pullDistance = power * 50;
      const pullX = this.x + Math.cos(angleRad) * pullDistance;
      const pullY = this.y + Math.sin(angleRad) * pullDistance;
      
      p.stroke(100, 80, 60);
      p.strokeWeight(2);
      p.line(this.x - 10, this.y - 50, pullX, pullY);
      p.line(this.x + 10, this.y - 50, pullX, pullY);
    }
    
    p.pop();
  }
}