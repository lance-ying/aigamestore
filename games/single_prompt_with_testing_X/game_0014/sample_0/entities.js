// entities.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World, Body } = Matter;
import { gameState } from './globals.js';

export class Ball {
  constructor(p, x, y, radius, color, label) {
    this.p = p;
    this.radius = radius;
    this.color = color;
    this.label = label;
    
    this.body = Bodies.circle(x, y, radius, {
      label: label,
      friction: 0.3,
      restitution: 0.6,
      density: 0.001
    });
    
    World.add(gameState.world, this.body);
    this.isAlive = true;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    
    if (dx > 5 || dy > 5) {
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }

  render() {
    if (!this.isAlive) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Add a shine effect
    this.p.fill(255, 255, 255, 100);
    this.p.circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.5);
    
    this.p.pop();
  }
}

export class GoodBall extends Ball {
  constructor(p, x, y) {
    super(p, x, y, 15, [100, 255, 100], 'goodBall');
  }
}

export class MonsterBall extends Ball {
  constructor(p, x, y) {
    super(p, x, y, 18, [255, 50, 50], 'monsterBall');
    this.targetBall = null;
    this.activated = false;
  }

  activate() {
    this.activated = true;
    this.findTarget();
  }

  findTarget() {
    // Find closest good ball
    let closestBall = null;
    let closestDist = Infinity;
    
    gameState.goodBalls.forEach(ball => {
      if (ball.isAlive) {
        const dx = ball.body.position.x - this.body.position.x;
        const dy = ball.body.position.y - this.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
          closestDist = dist;
          closestBall = ball;
        }
      }
    });
    
    this.targetBall = closestBall;
  }

  updateMovement() {
    if (!this.activated || !this.targetBall || !this.targetBall.isAlive) {
      if (this.activated) {
        this.findTarget();
      }
      return;
    }
    
    // Move towards target
    const dx = this.targetBall.body.position.x - this.body.position.x;
    const dy = this.targetBall.body.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      const force = 0.0003;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      Body.applyForce(this.body, this.body.position, { x: fx, y: fy });
    }
  }

  render() {
    if (!this.isAlive) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Monster appearance
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Evil eyes
    this.p.fill(50, 50, 50);
    this.p.circle(-this.radius * 0.4, -this.radius * 0.3, this.radius * 0.4);
    this.p.circle(this.radius * 0.4, -this.radius * 0.3, this.radius * 0.4);
    
    // Teeth
    if (this.activated) {
      this.p.fill(255);
      this.p.arc(0, this.radius * 0.3, this.radius * 1.2, this.radius * 0.8, 0, this.p.PI);
    }
    
    this.p.pop();
  }
}

export class MovableBlock {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.color = [150, 150, 200];
    this.selectedColor = [100, 200, 255];
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'movableBlock',
      isStatic: true, // Static until moved
      friction: 0.8,
      restitution: 0.1
    });
    
    World.add(gameState.world, this.body);
    this.isSelected = false;
  }

  select() {
    this.isSelected = true;
  }

  deselect() {
    this.isSelected = false;
  }

  move(dx, dy) {
    const newX = this.body.position.x + dx;
    const newY = this.body.position.y + dy;
    
    // Keep within bounds
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const clampedX = Math.max(halfW + 5, Math.min(600 - halfW - 5, newX));
    const clampedY = Math.max(halfH + 5, Math.min(400 - halfH - 5, newY));
    
    Body.setPosition(this.body, { x: clampedX, y: clampedY });
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    const drawColor = this.isSelected ? this.selectedColor : this.color;
    this.p.fill(drawColor);
    this.p.stroke(50);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw grid pattern
    this.p.stroke(100, 100, 150, 100);
    this.p.strokeWeight(1);
    for (let i = -this.width / 2; i < this.width / 2; i += 10) {
      this.p.line(i, -this.height / 2, i, this.height / 2);
    }
    for (let j = -this.height / 2; j < this.height / 2; j += 10) {
      this.p.line(-this.width / 2, j, this.width / 2, j);
    }
    
    if (this.isSelected) {
      this.p.noFill();
      this.p.stroke(255, 255, 0);
      this.p.strokeWeight(3);
      this.p.rect(0, 0, this.width + 6, this.height + 6);
    }
    
    this.p.pop();
  }
}

export class Wall {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.color = [80, 80, 80];
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      friction: 0.8,
      restitution: 0.3
    });
    
    World.add(gameState.world, this.body);
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color);
    this.p.stroke(60);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    this.p.pop();
  }
}