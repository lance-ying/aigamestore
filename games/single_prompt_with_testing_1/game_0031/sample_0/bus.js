// bus.js - Bus entity class
import { gameState, BUS_WIDTH, BUS_HEIGHT, BUS_MAX_SPEED, BUS_ACCELERATION, BUS_TURN_SPEED, BUS_FRICTION, BUS_TYPES } from './globals.js';

export class Bus {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.width = BUS_WIDTH;
    this.height = BUS_HEIGHT;
    this.speed = 0;
    this.targetAngle = 0;
    this.honking = false;
    this.honkTimer = 0;
  }

  update(input) {
    // Handle input
    let acceleration = 0;
    let turning = 0;
    let braking = false;

    if (input.up) acceleration = BUS_ACCELERATION;
    if (input.down) acceleration = -BUS_ACCELERATION * 0.7;
    if (input.left) turning = -BUS_TURN_SPEED;
    if (input.right) turning = BUS_TURN_SPEED;
    if (input.space) braking = true;
    if (input.shift && this.honkTimer <= 0) {
      this.honking = true;
      this.honkTimer = 30;
    }

    // Update honk timer
    if (this.honkTimer > 0) this.honkTimer--;
    if (this.honkTimer === 0) this.honking = false;

    // Apply speed multiplier based on bus type
    const busType = BUS_TYPES[gameState.currentBusType];
    const speedMultiplier = busType.speed;

    // Update speed
    this.speed += acceleration;
    
    // Apply braking
    if (braking) {
      this.speed *= 0.85;
    } else {
      this.speed *= BUS_FRICTION;
    }

    // Clamp speed
    const maxSpeed = BUS_MAX_SPEED * speedMultiplier;
    this.speed = this.p.constrain(this.speed, -maxSpeed * 0.5, maxSpeed);

    // Update angle based on speed and turning
    if (this.p.abs(this.speed) > 0.1) {
      this.angle += turning * this.p.abs(this.speed) / maxSpeed;
    }

    // Update velocity based on angle
    this.vx = this.p.cos(this.angle) * this.speed;
    this.vy = this.p.sin(this.angle) * this.speed;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep within world bounds (loose boundaries)
    this.x = this.p.constrain(this.x, 50, 550);
    this.y = this.p.constrain(this.y, 50, 350);
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);

    // Get bus color based on type
    const busType = BUS_TYPES[gameState.currentBusType];
    const busColor = busType.color;

    // Bus body
    p.fill(...busColor);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);

    // Windows
    p.fill(150, 200, 255, 150);
    p.noStroke();
    for (let i = -12; i <= 12; i += 8) {
      p.rect(i, -2, 5, 6);
    }

    // Front indicator
    p.fill(255, 255, 150);
    p.rect(this.width / 2 - 2, 0, 4, 10);

    // Wheels
    p.fill(40);
    p.circle(-10, -8, 5);
    p.circle(-10, 8, 5);
    p.circle(10, -8, 5);
    p.circle(10, 8, 5);

    // Honk indicator
    if (this.honking) {
      p.fill(255, 255, 100, 150);
      p.noStroke();
      p.circle(this.width / 2 + 5, 0, 15);
    }

    p.pop();
  }

  getCorners() {
    const corners = [];
    const hw = this.width / 2;
    const hh = this.height / 2;
    
    const localCorners = [
      [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]
    ];

    for (let [lx, ly] of localCorners) {
      const rx = lx * this.p.cos(this.angle) - ly * this.p.sin(this.angle);
      const ry = lx * this.p.sin(this.angle) + ly * this.p.cos(this.angle);
      corners.push({ x: this.x + rx, y: this.y + ry });
    }

    return corners;
  }
}