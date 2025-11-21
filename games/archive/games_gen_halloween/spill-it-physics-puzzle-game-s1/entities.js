// entities.js - Entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { 
  gameState, 
  BALL_RADIUS, 
  GLASS_WIDTH, 
  GLASS_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_HEIGHT
} from './globals.js';

export class Ball {
  constructor(p, x, y, color) {
    this.p = p;
    this.color = color || [255, 100, 100];
    
    this.body = Bodies.circle(x, y, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.6,
      friction: 0.3,
      density: 0.001
    });
    
    World.add(gameState.world, this.body);
    this.active = true;
  }
  
  update() {
    // Check if ball has gone off screen or settled
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      this.active = false;
    }
  }
  
  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Ball with shine effect
    this.p.noStroke();
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.circle(0, 0, BALL_RADIUS * 2);
    
    // Shine
    this.p.fill(255, 255, 255, 150);
    this.p.circle(-BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, BALL_RADIUS * 0.6);
    
    this.p.pop();
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Glass {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.isKnockedOver = false;
    this.initialAngle = 0;
    
    this.body = Bodies.rectangle(x, y, GLASS_WIDTH, GLASS_HEIGHT, {
      label: 'glass',
      restitution: 0.1,
      friction: 0.8,
      density: 0.0005
    });
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    // Check if glass is knocked over (tilted beyond threshold)
    const angle = Math.abs(this.body.angle);
    if (!this.isKnockedOver && angle > 0.3) {
      this.isKnockedOver = true;
      gameState.glassesKnockedOver++;
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Glass body
    if (this.isKnockedOver) {
      this.p.fill(200, 200, 200, 150);
    } else {
      this.p.fill(200, 230, 255, 180);
    }
    this.p.stroke(150, 180, 200);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, GLASS_WIDTH, GLASS_HEIGHT);
    
    // Glass shine
    this.p.noStroke();
    this.p.fill(255, 255, 255, 100);
    this.p.rect(-GLASS_WIDTH * 0.3, -GLASS_HEIGHT * 0.3, GLASS_WIDTH * 0.2, GLASS_HEIGHT * 0.5);
    
    this.p.pop();
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, isRotated = false) {
    this.p = p;
    this.width = width;
    this.height = height;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'obstacle',
      isStatic: true,
      restitution: 0.3,
      friction: 0.5
    });
    
    if (isRotated) {
      Body.setAngle(this.body, Math.PI / 6); // 30 degrees
    }
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Wood-like obstacle
    this.p.fill(139, 90, 60);
    this.p.stroke(101, 67, 33);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Wood grain effect
    this.p.noStroke();
    this.p.fill(120, 80, 50, 50);
    for (let i = 0; i < 3; i++) {
      this.p.rect(-this.width * 0.3 + i * this.width * 0.3, 0, this.width * 0.1, this.height);
    }
    
    this.p.pop();
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Ground {
  constructor(p, x, y, width, height, color) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.color = color;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'ground',
      isStatic: true,
      restitution: 0.3,
      friction: 0.8
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.rect(0, 0, this.width, this.height);
    
    // Grass effect on top
    this.p.fill(this.color[0] - 20, this.color[1] + 20, this.color[2] - 20);
    for (let i = -this.width / 2; i < this.width / 2; i += 10) {
      this.p.rect(i, -this.height / 2, 2, 5);
    }
    
    this.p.pop();
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Wall {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      restitution: 0.3,
      friction: 0.5
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    // Walls are invisible boundaries
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}