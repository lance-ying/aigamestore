// entities.js - Game entities (balls, cue stick, etc.)
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, BALL_RADIUS, BALL_COLORS } from './globals.js';

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
    const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
    const cushionThickness = 20;
    const options = {
      isStatic: true,
      friction: 0.9,
      restitution: 0.8,
      label: 'cushion',
      slop: 0.05
    };
    
    // Smaller gap percentage to reduce corner escape potential
    const gapPercent = 0.08; // Reduced from ~0.1 to make smaller gaps
    const cornerGapPercent = 0.06; // Even smaller gaps in corners
    
    // Top cushions (with gaps for pockets)
    // Left section (before middle pocket)
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth * 0.25, tableY - cushionThickness / 2,
      tableWidth * (0.5 - gapPercent), cushionThickness, options
    ));
    // Right section (after middle pocket)
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth * 0.75, tableY - cushionThickness / 2,
      tableWidth * (0.5 - gapPercent), cushionThickness, options
    ));
    
    // Bottom cushions (with gaps for pockets)
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth * 0.25, tableY + tableHeight + cushionThickness / 2,
      tableWidth * (0.5 - gapPercent), cushionThickness, options
    ));
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth * 0.75, tableY + tableHeight + cushionThickness / 2,
      tableWidth * (0.5 - gapPercent), cushionThickness, options
    ));
    
    // Left cushions (with smaller gap at top and bottom for corner pockets)
    // Top section
    this.cushions.push(Bodies.rectangle(
      tableX - cushionThickness / 2, tableY + tableHeight * 0.25,
      cushionThickness, tableHeight * (0.5 - cornerGapPercent), options
    ));
    // Bottom section
    this.cushions.push(Bodies.rectangle(
      tableX - cushionThickness / 2, tableY + tableHeight * 0.75,
      cushionThickness, tableHeight * (0.5 - cornerGapPercent), options
    ));
    
    // Right cushions (with smaller gap at top and bottom for corner pockets)
    // Top section
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth + cushionThickness / 2, tableY + tableHeight * 0.25,
      cushionThickness, tableHeight * (0.5 - cornerGapPercent), options
    ));
    // Bottom section
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth + cushionThickness / 2, tableY + tableHeight * 0.75,
      cushionThickness, tableHeight * (0.5 - cornerGapPercent), options
    ));
    
    // Add diagonal corner guards to prevent balls from escaping through corners
    const cornerGuardSize = 15;
    const cornerGuardOptions = {
      ...options,
      chamfer: { radius: 3 }
    };
    
    // Top-left corner guard
    this.cushions.push(Bodies.rectangle(
      tableX - 5, tableY - 5,
      cornerGuardSize, cornerGuardSize, cornerGuardOptions
    ));
    
    // Top-right corner guard
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth + 5, tableY - 5,
      cornerGuardSize, cornerGuardSize, cornerGuardOptions
    ));
    
    // Bottom-left corner guard
    this.cushions.push(Bodies.rectangle(
      tableX - 5, tableY + tableHeight + 5,
      cornerGuardSize, cornerGuardSize, cornerGuardOptions
    ));
    
    // Bottom-right corner guard
    this.cushions.push(Bodies.rectangle(
      tableX + tableWidth + 5, tableY + tableHeight + 5,
      cornerGuardSize, cornerGuardSize, cornerGuardOptions
    ));
    
    this.cushions.forEach(cushion => World.add(this.world, cushion));
  }
  
  render() {
    const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
    
    // Draw table felt
    this.p.fill(34, 139, 34);
    this.p.stroke(101, 67, 33);
    this.p.strokeWeight(20);
    this.p.rect(tableX, tableY, tableWidth, tableHeight);
    
    // Draw pockets
    this.p.fill(0);
    this.p.noStroke();
    const pocketRadius = 12 * gameState.levelParams.pocketSizeMultiplier;
    
    // Corner pockets
    this.p.circle(tableX, tableY, pocketRadius * 2);
    this.p.circle(tableX + tableWidth, tableY, pocketRadius * 2);
    this.p.circle(tableX, tableY + tableHeight, pocketRadius * 2);
    this.p.circle(tableX + tableWidth, tableY + tableHeight, pocketRadius * 2);
    
    // Middle pockets
    this.p.circle(tableX + tableWidth / 2, tableY, pocketRadius * 2);
    this.p.circle(tableX + tableWidth / 2, tableY + tableHeight, pocketRadius * 2);
    
    // Draw baulk line
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(1);
    this.p.line(tableX + 100, tableY, tableX + 100, tableY + tableHeight);
  }
}