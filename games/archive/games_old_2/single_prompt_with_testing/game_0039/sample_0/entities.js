import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Vehicle {
  constructor(p, x, y, color, isPlayer = false) {
    this.p = p;
    this.isPlayer = isPlayer;
    
    // Create compound body for better collision
    const width = 30;
    const height = 20;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: isPlayer ? 'player' : 'ai',
      friction: 0.1,
      frictionAir: 0.02,
      restitution: 0.3,
      density: 0.002,
      angle: 0
    });
    
    World.add(gameState.world, this.body);
    
    this.color = color;
    this.maxSpeed = 12;
    this.acceleration = 0.015;
    this.turnSpeed = 0.08;
    this.currentCheckpoint = 0;
    this.lapCount = 0;
    this.finished = false;
    this.finishTime = 0;
    this.isDrifting = false;
    this.driftAngle = 0;
    this.boostActive = false;
    this.boostTimer = 0;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Drift detection
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const velocityAngle = Math.atan2(velocity.y, velocity.x);
    const angleDiff = this.normalizeAngle(velocityAngle - this.body.angle);
    
    this.isDrifting = speed > 3 && Math.abs(angleDiff) > 0.3;
    this.driftAngle = angleDiff;
    
    // Boost timer
    if (this.boostActive) {
      this.boostTimer--;
      if (this.boostTimer <= 0) {
        this.boostActive = false;
      }
    }
    
    // Log player position if changed significantly
    if (this.isPlayer) {
      const dx = this.body.position.x - this.lastLoggedX;
      const dy = this.body.position.y - this.lastLoggedY;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
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
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  accelerate() {
    const force = {
      x: Math.cos(this.body.angle) * this.acceleration * (this.boostActive ? 2 : 1),
      y: Math.sin(this.body.angle) * this.acceleration * (this.boostActive ? 2 : 1)
    };
    Body.applyForce(this.body, this.body.position, force);
    
    // Cap speed
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const maxSpeed = this.maxSpeed * (this.boostActive ? 1.5 : 1);
    if (speed > maxSpeed) {
      Body.setVelocity(this.body, {
        x: velocity.x * maxSpeed / speed,
        y: velocity.y * maxSpeed / speed
      });
    }
  }

  brake() {
    const velocity = this.body.velocity;
    Body.setVelocity(this.body, {
      x: velocity.x * 0.95,
      y: velocity.y * 0.95
    });
  }

  turnLeft() {
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const turnAmount = this.turnSpeed * Math.min(speed / 5, 1);
    Body.setAngle(this.body, this.body.angle - turnAmount);
  }

  turnRight() {
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const turnAmount = this.turnSpeed * Math.min(speed / 5, 1);
    Body.setAngle(this.body, this.body.angle + turnAmount);
  }

  activateBoost() {
    if (!this.boostActive && gameState.boostCharges > 0) {
      this.boostActive = true;
      this.boostTimer = 60; // 1 second
      if (this.isPlayer) {
        gameState.boostCharges--;
      }
    }
  }

  render(p, offsetX, offsetY) {
    p.push();
    p.translate(this.body.position.x - offsetX, this.body.position.y - offsetY);
    p.rotate(this.body.angle);
    
    // Car body - isometric style
    if (this.boostActive) {
      p.fill(255, 200, 0);
      p.noStroke();
      // Boost flames
      for (let i = 0; i < 3; i++) {
        p.ellipse(-20 - i * 5, 0, 8 - i * 2, 12 - i * 3);
      }
    }
    
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Main body
    p.beginShape();
    p.vertex(-15, -10);
    p.vertex(15, -10);
    p.vertex(15, 10);
    p.vertex(-15, 10);
    p.endShape(p.CLOSE);
    
    // Windshield
    p.fill(100, 150, 200, 150);
    p.quad(-5, -8, 10, -8, 10, 8, -5, 8);
    
    // Wheels (isometric perspective)
    p.fill(40, 40, 40);
    p.noStroke();
    p.ellipse(-10, -8, 6, 4);
    p.ellipse(-10, 8, 6, 4);
    p.ellipse(10, -8, 6, 4);
    p.ellipse(10, 8, 6, 4);
    
    // Drift indicator
    if (this.isDrifting) {
      p.stroke(255, 100, 0);
      p.strokeWeight(3);
      p.noFill();
      p.arc(0, 0, 40, 40, -Math.PI / 4, Math.PI / 4);
    }
    
    p.pop();
  }
}

export class Checkpoint {
  constructor(p, x, y, width, height, index) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.index = index;
    this.isFinishLine = index === 0;
    
    // Sensor body (no collision)
    this.body = Bodies.rectangle(x, y, width, height, {
      label: `checkpoint_${index}`,
      isSensor: true,
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
  }

  render(p, offsetX, offsetY) {
    p.push();
    p.translate(this.x - offsetX, this.y - offsetY);
    
    if (this.isFinishLine) {
      // Checkered pattern for finish line
      p.noStroke();
      const checkSize = 10;
      for (let i = 0; i < this.width; i += checkSize) {
        for (let j = 0; j < this.height; j += checkSize) {
          if ((Math.floor(i / checkSize) + Math.floor(j / checkSize)) % 2 === 0) {
            p.fill(255);
          } else {
            p.fill(0);
          }
          p.rect(i - this.width / 2, j - this.height / 2, checkSize, checkSize);
        }
      }
    } else {
      p.fill(100, 200, 100, 100);
      p.stroke(100, 255, 100);
      p.strokeWeight(2);
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
    
    p.pop();
  }
}

export class Wall {
  constructor(p, x, y, width, height, angle = 0) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      angle: angle,
      friction: 0.8,
      restitution: 0.5
    });
    
    World.add(gameState.world, this.body);
  }

  render(p, offsetX, offsetY) {
    p.push();
    p.translate(this.body.position.x - offsetX, this.body.position.y - offsetY);
    p.rotate(this.body.angle);
    
    // Muddy track boundary
    p.fill(80, 60, 40);
    p.stroke(60, 40, 20);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Texture
    p.noStroke();
    p.fill(70, 50, 30);
    for (let i = 0; i < 5; i++) {
      const rx = this.p.random(-this.width / 2, this.width / 2);
      const ry = this.p.random(-this.height / 2, this.height / 2);
      p.ellipse(rx, ry, 4, 4);
    }
    
    p.pop();
  }
}

export class AIOpponent extends Vehicle {
  constructor(p, x, y, color, difficulty) {
    super(p, x, y, color, false);
    this.difficulty = difficulty; // 0.5 to 1.5
    this.maxSpeed = 12 * difficulty;
    this.acceleration = 0.015 * difficulty;
    this.targetCheckpoint = 0;
    this.stuckTimer = 0;
    this.stuckThreshold = 180;
  }

  updateAI() {
    if (this.finished) return;
    
    // Find target checkpoint
    const targetCP = gameState.checkpoints[this.targetCheckpoint];
    if (!targetCP) return;
    
    // Calculate direction to checkpoint
    const dx = targetCP.x - this.body.position.x;
    const dy = targetCP.y - this.body.position.y;
    const targetAngle = Math.atan2(dy, dx);
    
    let angleDiff = this.normalizeAngle(targetAngle - this.body.angle);
    
    // Steering
    if (Math.abs(angleDiff) > 0.1) {
      if (angleDiff > 0) {
        this.turnRight();
      } else {
        this.turnLeft();
      }
    }
    
    // Acceleration
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    if (Math.abs(angleDiff) < 0.5 && speed < this.maxSpeed * 0.9) {
      this.accelerate();
    } else if (Math.abs(angleDiff) > 1.0) {
      this.brake();
    }
    
    // Check if stuck
    if (speed < 0.5) {
      this.stuckTimer++;
      if (this.stuckTimer > this.stuckThreshold) {
        // Unstuck by moving backward and turning
        const force = {
          x: -Math.cos(this.body.angle) * this.acceleration * 2,
          y: -Math.sin(this.body.angle) * this.acceleration * 2
        };
        Body.applyForce(this.body, this.body.position, force);
        this.turnRight();
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
  }
}