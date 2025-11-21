// entities.js - Game entities (balls, cue stick, etc.)
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, BALL_RADIUS, BALL_COLORS, TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT } from './globals.js';

export class Ball {
  constructor(p, x, y, number) {
    this.p = p;
    this.number = number;
    this.color = BALL_COLORS[number];
    this.pocketed = false;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, BALL_RADIUS, {
      label: `ball_${number}`,
      friction: 0.05,
      frictionAir: 0.01,
      restitution: 0.9,
      density: 0.001,
      number: number
    });
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    // Check if ball is moving slowly enough to be considered stopped
    const vel = this.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    
    if (speed < 0.1) {
      Body.setVelocity(this.body, { x: 0, y: 0 });
      Body.setAngularVelocity(this.body, 0);
    }
  }
  
  render() {
    if (this.pocketed) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw ball
    this.p.fill(this.color.r, this.color.g, this.color.b);
    this.p.stroke(0);
    this.p.strokeWeight(1);
    this.p.circle(0, 0, BALL_RADIUS * 2);
    
    // Draw stripe for striped balls
    if (this.color.type === "stripe") {
      this.p.fill(255);
      this.p.noStroke();
      this.p.rect(-BALL_RADIUS, -BALL_RADIUS * 0.4, BALL_RADIUS * 2, BALL_RADIUS * 0.8);
    }
    
    // Draw number
    if (this.number !== 0) {
      this.p.fill(this.color.type === "eight" ? 255 : 0);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text(this.number, 0, 0);
    }
    
    this.p.pop();
  }
  
  isStopped() {
    const vel = this.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    return speed < 0.1;
  }
}

export class CueStick {
  constructor(p) {
    this.p = p;
    this.length = 150;
    this.width = 4;
  }
  
  render(cueBall, angle, power) {
    if (!cueBall || cueBall.pocketed) return;
    
    this.p.push();
    this.p.translate(cueBall.body.position.x, cueBall.body.position.y);
    this.p.rotate(angle);
    
    // Calculate pullback distance based on power
    const pullback = (power / gameState.maxShotPower) * 50;
    
    // Draw cue stick
    this.p.fill(139, 90, 43);
    this.p.stroke(101, 67, 33);
    this.p.strokeWeight(1);
    this.p.rect(-BALL_RADIUS - 10 - pullback, -this.width / 2, -this.length, this.width);
    
    // Draw tip
    this.p.fill(200, 200, 200);
    this.p.rect(-BALL_RADIUS - 10 - pullback, -this.width / 2, -10, this.width);
    
    this.p.pop();
  }
}

export class Table {
  constructor(p, world) {
    this.p = p;
    this.world = world;
    this.cushions = [];
    
    this.createCushions();
  }
  
  createCushions() {
    const cushionThickness = 15;
    const options = {
      isStatic: true,
      friction: 0.8,
      restitution: 0.7,
      label: 'cushion'
    };
    
    // Top cushions (with gaps for pockets)
    this.cushions.push(Bodies.rectangle(
      TABLE_X + TABLE_WIDTH * 0.25, TABLE_Y - cushionThickness / 2,
      TABLE_WIDTH * 0.4, cushionThickness, options
    ));
    this.cushions.push(Bodies.rectangle(
      TABLE_X + TABLE_WIDTH * 0.75, TABLE_Y - cushionThickness / 2,
      TABLE_WIDTH * 0.4, cushionThickness, options
    ));
    
    // Bottom cushions
    this.cushions.push(Bodies.rectangle(
      TABLE_X + TABLE_WIDTH * 0.25, TABLE_Y + TABLE_HEIGHT + cushionThickness / 2,
      TABLE_WIDTH * 0.4, cushionThickness, options
    ));
    this.cushions.push(Bodies.rectangle(
      TABLE_X + TABLE_WIDTH * 0.75, TABLE_Y + TABLE_HEIGHT + cushionThickness / 2,
      TABLE_WIDTH * 0.4, cushionThickness, options
    ));
    
    // Left cushions
    this.cushions.push(Bodies.rectangle(
      TABLE_X - cushionThickness / 2, TABLE_Y + TABLE_HEIGHT * 0.5,
      cushionThickness, TABLE_HEIGHT * 0.9, options
    ));
    
    // Right cushions
    this.cushions.push(Bodies.rectangle(
      TABLE_X + TABLE_WIDTH + cushionThickness / 2, TABLE_Y + TABLE_HEIGHT * 0.5,
      cushionThickness, TABLE_HEIGHT * 0.9, options
    ));
    
    this.cushions.forEach(cushion => World.add(this.world, cushion));
  }
  
  render() {
    // Draw table felt
    this.p.fill(34, 139, 34);
    this.p.stroke(101, 67, 33);
    this.p.strokeWeight(20);
    this.p.rect(TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);
    
    // Draw pockets
    this.p.fill(0);
    this.p.noStroke();
    const pocketRadius = 12 * gameState.levelParams.pocketSizeMultiplier;
    
    // Corner pockets
    this.p.circle(TABLE_X, TABLE_Y, pocketRadius * 2);
    this.p.circle(TABLE_X + TABLE_WIDTH, TABLE_Y, pocketRadius * 2);
    this.p.circle(TABLE_X, TABLE_Y + TABLE_HEIGHT, pocketRadius * 2);
    this.p.circle(TABLE_X + TABLE_WIDTH, TABLE_Y + TABLE_HEIGHT, pocketRadius * 2);
    
    // Middle pockets
    this.p.circle(TABLE_X + TABLE_WIDTH / 2, TABLE_Y, pocketRadius * 2);
    this.p.circle(TABLE_X + TABLE_WIDTH / 2, TABLE_Y + TABLE_HEIGHT, pocketRadius * 2);
    
    // Draw baulk line
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(1);
    this.p.line(TABLE_X + 100, TABLE_Y, TABLE_X + 100, TABLE_Y + TABLE_HEIGHT);
  }
}