// entities.js - Entity classes for game objects
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { World, Bodies, Body } = Matter;

import { gameState, CANVAS_HEIGHT, BIN_CONFIG } from './globals.js';

export class Ball {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 6, {
      label: 'ball',
      restitution: 0.7,
      friction: 0.001,
      density: 0.001
    });
    World.add(gameState.world, this.body);
    this.color = [255, 220, 100];
    this.landed = false;
    this.landedTime = 0;
    this.multiplied = false;
  }

  update() {
    // Check if ball has landed in a bin
    if (this.body.position.y > CANVAS_HEIGHT - 50 && !this.landed) {
      this.landed = true;
      this.landedTime = this.p.frameCount;
      this.scoreInBin();
      gameState.ballsInPlay--;
    }

    // Remove ball after it's been landed for a while
    if (this.landed && this.p.frameCount - this.landedTime > 60) {
      this.remove();
    }
  }

  scoreInBin() {
    const x = this.body.position.x;
    for (let bin of BIN_CONFIG) {
      if (x >= bin.x && x <= bin.x + bin.width) {
        gameState.score += bin.value;
        break;
      }
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, 12);
    
    // Add shine effect
    this.p.fill(255, 255, 200, 150);
    this.p.circle(-2, -2, 4);
    this.p.pop();
  }

  remove() {
    World.remove(gameState.world, this.body);
    const index = gameState.balls.indexOf(this);
    if (index > -1) {
      gameState.balls.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
}

export class Peg {
  constructor(p, x, y, radius) {
    this.p = p;
    this.body = Bodies.circle(x, y, radius, {
      label: 'peg',
      isStatic: true,
      restitution: 0.8
    });
    World.add(gameState.world, this.body);
    this.color = [200, 100, 200];
    this.hitAnimation = 0;
  }

  update() {
    if (this.hitAnimation > 0) {
      this.hitAnimation--;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    const size = this.body.circleRadius * 2;
    const animSize = size + this.hitAnimation * 0.5;
    
    this.p.fill(this.color);
    this.p.stroke(150, 50, 150);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, animSize);
    
    // Inner circle
    this.p.fill(220, 120, 220);
    this.p.noStroke();
    this.p.circle(0, 0, animSize * 0.6);
    this.p.pop();
  }

  hit() {
    this.hitAnimation = 10;
  }
}

export class MultiplierGate {
  constructor(p, x, y, width, height, value) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.value = value;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'multiplier',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.activationAnimation = 0;
  }

  update() {
    if (this.activationAnimation > 0) {
      this.activationAnimation--;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    const glow = this.activationAnimation > 0 ? 50 : 0;
    
    // Gate background
    this.p.fill(255, 150 + glow, 0, 200);
    this.p.stroke(255, 200 + glow, 0);
    this.p.strokeWeight(2);
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Multiplier text
    this.p.fill(255);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(12);
    this.p.textStyle(this.p.BOLD);
    this.p.text(`x${this.value}`, 0, 0);
    
    this.p.pop();
  }

  activate() {
    this.activationAnimation = 20;
  }
}

export class Bin {
  constructor(p, x, width, value, color) {
    this.p = p;
    this.x = x;
    this.width = width;
    this.value = value;
    this.color = color;
    this.y = CANVAS_HEIGHT - 30;
    this.height = 30;
    
    // Create walls for the bin
    const wallThickness = 3;
    this.leftWall = Bodies.rectangle(
      x - wallThickness / 2,
      this.y,
      wallThickness,
      this.height,
      { label: 'binWall', isStatic: true, restitution: 0.3 }
    );
    this.rightWall = Bodies.rectangle(
      x + width + wallThickness / 2,
      this.y,
      wallThickness,
      this.height,
      { label: 'binWall', isStatic: true, restitution: 0.3 }
    );
    this.bottom = Bodies.rectangle(
      x + width / 2,
      CANVAS_HEIGHT - wallThickness / 2,
      width,
      wallThickness,
      { label: 'binBottom', isStatic: true, restitution: 0.1 }
    );
    
    World.add(gameState.world, [this.leftWall, this.rightWall, this.bottom]);
  }

  render() {
    this.p.push();
    
    // Bin background
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Bin borders (walls)
    this.p.fill(80, 100, 150);
    this.p.rect(this.x - 3, this.y, 3, this.height);
    this.p.rect(this.x + this.width, this.y, 3, this.height);
    this.p.rect(this.x, CANVAS_HEIGHT - 3, this.width, 3);
    
    // Value text
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(16);
    this.p.textStyle(this.p.BOLD);
    this.p.text(this.value, this.x + this.width / 2, this.y + this.height / 2);
    
    this.p.pop();
  }
}

export class Dropper {
  constructor(p) {
    this.p = p;
    this.x = gameState.dropperX;
  }

  update() {
    this.x = gameState.dropperX;
  }

  render() {
    this.p.push();
    
    // Dropper triangle
    this.p.fill(255, 200, 50);
    this.p.stroke(200, 150, 0);
    this.p.strokeWeight(2);
    this.p.triangle(
      this.x, 20,
      this.x - 15, 5,
      this.x + 15, 5
    );
    
    // Drop indicator line
    this.p.stroke(255, 200, 50, 100);
    this.p.strokeWeight(1);
    this.p.drawingContext.setLineDash([5, 5]);
    this.p.line(this.x, 25, this.x, 60);
    this.p.drawingContext.setLineDash([]);
    
    this.p.pop();
  }
}