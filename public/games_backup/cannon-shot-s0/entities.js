// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, BALL_RADIUS, CANNON_SIZE, BUCKET_WIDTH, BUCKET_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Cannon {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 4; // Default 45 degrees up
    this.color = [60, 60, 80];
    this.fireDelay = 0;
  }

  update() {
    if (this.fireDelay > 0) {
      this.fireDelay--;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Base
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.rect(-CANNON_SIZE / 2, -10, CANNON_SIZE, 20);
    
    // Barrel
    this.p.push();
    this.p.rotate(this.angle);
    this.p.fill(this.color[0] - 10, this.color[1] - 10, this.color[2] - 10);
    this.p.rect(0, -8, 50, 16);
    this.p.pop();
    
    this.p.pop();
  }

  fire() {
    if (this.fireDelay > 0 || gameState.ballsRemaining <= 0) return;
    
    const speed = 8;
    const vx = Math.cos(this.angle) * speed;
    const vy = Math.sin(this.angle) * speed;
    
    const ball = new Ball(
      this.p,
      this.x + Math.cos(this.angle) * 50,
      this.y + Math.sin(this.angle) * 50,
      vx,
      vy
    );
    
    gameState.balls.push(ball);
    gameState.entities.push(ball);
    gameState.ballsRemaining--;
    gameState.ballsFired++;
    this.fireDelay = 8;
  }
}

export class Ball {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.body = Bodies.circle(x, y, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.6,
      friction: 0.1,
      density: 0.002
    });
    
    Body.setVelocity(this.body, { x: vx, y: vy });
    World.add(gameState.world, this.body);
    
    this.color = [255, 200, 50];
    this.active = true;
    this.inBucket = false;
  }

  update() {
    // Check if ball is out of bounds
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
    
    // Check if velocity is very low (settled)
    const speed = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.y ** 2
    );
    if (speed < 0.1 && this.body.position.y > CANVAS_HEIGHT - 100) {
      this.active = false;
    }
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(0, 0, BALL_RADIUS * 2);
    
    // Shine effect
    this.p.fill(255, 255, 200, 150);
    this.p.circle(-3, -3, BALL_RADIUS);
    
    this.p.pop();
  }

  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Bucket {
  constructor(p, x, y, id) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = BUCKET_WIDTH;
    this.height = BUCKET_HEIGHT;
    this.ballsInside = [];
    this.filled = false;
    this.color = [100, 150, 200];
    
    // Create walls for bucket (3 sides)
    const thickness = 5;
    
    // Left wall
    this.leftWall = Bodies.rectangle(
      x - this.width / 2 + thickness / 2,
      y,
      thickness,
      this.height,
      { isStatic: true, label: 'bucket_wall', friction: 0.3, restitution: 0.2 }
    );
    
    // Right wall
    this.rightWall = Bodies.rectangle(
      x + this.width / 2 - thickness / 2,
      y,
      thickness,
      this.height,
      { isStatic: true, label: 'bucket_wall', friction: 0.3, restitution: 0.2 }
    );
    
    // Bottom
    this.bottom = Bodies.rectangle(
      x,
      y + this.height / 2 - thickness / 2,
      this.width,
      thickness,
      { isStatic: true, label: 'bucket_wall', friction: 0.5, restitution: 0.1 }
    );
    
    World.add(gameState.world, [this.leftWall, this.rightWall, this.bottom]);
  }

  update() {
    // Check if any balls are inside
    this.ballsInside = [];
    
    gameState.balls.forEach(ball => {
      if (!ball.active || ball.inBucket) return;
      
      const bx = ball.body.position.x;
      const by = ball.body.position.y;
      
      // Check if ball is inside bucket bounds
      if (bx > this.x - this.width / 2 + 10 &&
          bx < this.x + this.width / 2 - 10 &&
          by > this.y - this.height / 2 &&
          by < this.y + this.height / 2) {
        
        if (!this.ballsInside.includes(ball)) {
          this.ballsInside.push(ball);
          ball.inBucket = true;
        }
      }
    });
    
    if (this.ballsInside.length > 0 && !this.filled) {
      this.filled = true;
      gameState.score += 100;
    }
  }

  render() {
    const fillColor = this.filled ? [50, 200, 50] : this.color;
    
    this.p.push();
    
    // Draw bucket structure
    this.p.fill(fillColor[0], fillColor[1], fillColor[2]);
    this.p.noStroke();
    
    // Left wall
    this.p.rect(this.x - this.width / 2, this.y - this.height / 2, 5, this.height);
    // Right wall
    this.p.rect(this.x + this.width / 2 - 5, this.y - this.height / 2, 5, this.height);
    // Bottom
    this.p.rect(this.x - this.width / 2, this.y + this.height / 2 - 5, this.width, 5);
    
    // Draw fill indicator
    if (this.filled) {
      this.p.fill(50, 255, 50, 100);
      this.p.rect(
        this.x - this.width / 2 + 5,
        this.y - this.height / 2,
        this.width - 10,
        this.height - 5
      );
    }
    
    // Draw checkmark if filled
    if (this.filled) {
      this.p.stroke(255);
      this.p.strokeWeight(3);
      this.p.noFill();
      this.p.beginShape();
      this.p.vertex(this.x - 10, this.y);
      this.p.vertex(this.x - 5, this.y + 8);
      this.p.vertex(this.x + 10, this.y - 10);
      this.p.endShape();
    }
    
    this.p.pop();
  }

  remove() {
    World.remove(gameState.world, [this.leftWall, this.rightWall, this.bottom]);
  }
}

export class MovableObject {
  constructor(p, x, y, width, height, angle, type) {
    this.p = p;
    this.originalX = x;
    this.originalY = y;
    this.width = width;
    this.height = height;
    this.originalAngle = angle;
    this.type = type; // 'ramp' or 'deflector'
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'movable',
      isStatic: true,
      angle: angle,
      friction: 0.3,
      restitution: 0.7
    });
    
    World.add(gameState.world, this.body);
    
    this.selected = false;
    this.color = type === 'ramp' ? [150, 100, 50] : [100, 100, 150];
  }

  update() {
    // Nothing to update for static objects
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    const c = this.selected ? [255, 255, 100] : this.color;
    this.p.fill(c[0], c[1], c[2]);
    this.p.stroke(255);
    this.p.strokeWeight(this.selected ? 3 : 1);
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Draw pattern based on type
    if (this.type === 'ramp') {
      this.p.stroke(200);
      this.p.strokeWeight(1);
      for (let i = -this.width / 2; i < this.width / 2; i += 10) {
        this.p.line(i, -this.height / 2, i, this.height / 2);
      }
    } else {
      this.p.fill(c[0] + 30, c[1] + 30, c[2] + 30);
      this.p.noStroke();
      this.p.circle(0, 0, Math.min(this.width, this.height) / 2);
    }
    
    this.p.pop();
  }

  moveTo(x, y) {
    Body.setPosition(this.body, { x, y });
  }

  rotate(angle) {
    Body.setAngle(this.body, this.body.angle + angle);
  }

  reset() {
    Body.setPosition(this.body, { x: this.originalX, y: this.originalY });
    Body.setAngle(this.body, this.originalAngle);
  }

  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Wall {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      friction: 0.3,
      restitution: 0.5
    });
    
    World.add(gameState.world, this.body);
    this.color = [80, 80, 80];
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    
    const vertices = this.body.vertices;
    this.p.beginShape();
    for (let v of vertices) {
      const vx = v.x - this.body.position.x;
      const vy = v.y - this.body.position.y;
      this.p.vertex(vx, vy);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }

  remove() {
    World.remove(gameState.world, this.body);
  }
}