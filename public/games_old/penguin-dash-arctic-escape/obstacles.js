// obstacles.js - Obstacle and item entities

import {
  TYPE_OBSTACLE_HIGH,
  TYPE_OBSTACLE_LOW,
  TYPE_GAP,
  TYPE_FISH,
  TYPE_RESCUED_PENGUIN,
  TYPE_POWERUP_SHIELD,
  TYPE_POWERUP_MAGNET,
  OBSTACLE_HIGH_WIDTH,
  OBSTACLE_HIGH_HEIGHT,
  OBSTACLE_LOW_WIDTH,
  OBSTACLE_LOW_HEIGHT,
  GAP_WIDTH,
  FISH_SIZE,
  RESCUED_PENGUIN_WIDTH,
  RESCUED_PENGUIN_HEIGHT,
  POWERUP_SIZE,
  GROUND_Y
} from './globals.js';

export class GameObject {
  constructor(p, type, x, lane, laneY) {
    this.p = p;
    this.type = type;
    this.x = x;
    this.lane = lane;
    this.y = laneY;
    this.active = true;
    this.collected = false;
    
    // Set dimensions based on type
    switch (type) {
      case TYPE_OBSTACLE_HIGH:
        this.width = OBSTACLE_HIGH_WIDTH;
        this.height = OBSTACLE_HIGH_HEIGHT;
        this.isOctopus = this.p.random() > 0.5;
        break;
      case TYPE_OBSTACLE_LOW:
        this.width = OBSTACLE_LOW_WIDTH;
        this.height = OBSTACLE_LOW_HEIGHT;
        break;
      case TYPE_GAP:
        this.width = GAP_WIDTH;
        this.height = 10;
        break;
      case TYPE_FISH:
        this.width = FISH_SIZE;
        this.height = FISH_SIZE;
        this.rotation = 0;
        break;
      case TYPE_RESCUED_PENGUIN:
        this.width = RESCUED_PENGUIN_WIDTH;
        this.height = RESCUED_PENGUIN_HEIGHT;
        break;
      case TYPE_POWERUP_SHIELD:
      case TYPE_POWERUP_MAGNET:
        this.width = POWERUP_SIZE;
        this.height = POWERUP_SIZE;
        this.pulseTimer = 0;
        break;
    }
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
    
    // Update animations
    if (this.type === TYPE_FISH) {
      this.rotation += 0.05;
    }
    
    if (this.type === TYPE_POWERUP_SHIELD || this.type === TYPE_POWERUP_MAGNET) {
      this.pulseTimer += 0.1;
    }

    // Deactivate if off screen
    if (this.x < -100) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active || this.collected) return;

    this.p.push();
    this.p.translate(this.x, this.y);

    switch (this.type) {
      case TYPE_OBSTACLE_HIGH:
        if (this.isOctopus) {
          // Octopus
          this.p.fill(200, 50, 50);
          this.p.noStroke();
          this.p.ellipse(0, -this.height / 3, this.width, this.width);
          // Tentacles
          for (let i = 0; i < 4; i++) {
            const angle = -Math.PI / 3 + (i * Math.PI / 6);
            this.p.stroke(200, 50, 50);
            this.p.strokeWeight(3);
            this.p.noFill();
            this.p.bezier(
              0, 0,
              Math.cos(angle) * 10, 10,
              Math.cos(angle) * 15, 20,
              Math.cos(angle) * 12, 30
            );
          }
        } else {
          // Barrier
          this.p.fill(100, 70, 50);
          this.p.stroke(70, 50, 30);
          this.p.strokeWeight(2);
          this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
        }
        break;

      case TYPE_OBSTACLE_LOW:
        this.p.fill(100, 70, 50);
        this.p.stroke(70, 50, 30);
        this.p.strokeWeight(2);
        this.p.rect(-this.width / 2, this.height / 2 - this.height, this.width, this.height, 3);
        break;

      case TYPE_GAP:
        this.p.fill(10, 30, 60);
        this.p.noStroke();
        this.p.rect(-this.width / 2, 0, this.width, GROUND_Y - this.y + 50);
        // Ice edges
        this.p.fill(200, 230, 255);
        this.p.rect(-this.width / 2 - 5, -3, 5, 6);
        this.p.rect(this.width / 2, -3, 5, 6);
        break;

      case TYPE_FISH:
        this.p.push();
        this.p.rotate(this.rotation);
        this.p.fill(255, 200, 50);
        this.p.noStroke();
        this.p.ellipse(0, 0, this.width, this.height * 0.5);
        this.p.triangle(this.width / 2, 0, this.width, -3, this.width, 3);
        this.p.pop();
        break;

      case TYPE_RESCUED_PENGUIN:
        this.p.fill(150, 180, 200);
        this.p.noStroke();
        this.p.ellipse(0, 0, this.width, this.height);
        this.p.fill(220, 230, 240);
        this.p.ellipse(0, 3, this.width * 0.6, this.height * 0.6);
        // Eyes
        this.p.fill(0);
        this.p.ellipse(-4, -5, 3, 4);
        this.p.ellipse(4, -5, 3, 4);
        break;

      case TYPE_POWERUP_SHIELD:
        const shieldPulse = 1 + Math.sin(this.pulseTimer) * 0.2;
        this.p.fill(100, 255, 150, 200);
        this.p.noStroke();
        this.p.ellipse(0, 0, this.width * shieldPulse, this.height * shieldPulse);
        this.p.fill(50, 200, 100);
        this.p.stroke(255);
        this.p.strokeWeight(2);
        this.p.beginShape();
        this.p.vertex(0, -8);
        this.p.vertex(-6, -2);
        this.p.vertex(-6, 6);
        this.p.vertex(0, 10);
        this.p.vertex(6, 6);
        this.p.vertex(6, -2);
        this.p.endShape(this.p.CLOSE);
        break;

      case TYPE_POWERUP_MAGNET:
        const magnetPulse = 1 + Math.sin(this.pulseTimer) * 0.2;
        this.p.fill(100, 150, 255, 200);
        this.p.noStroke();
        this.p.ellipse(0, 0, this.width * magnetPulse, this.height * magnetPulse);
        this.p.fill(200, 50, 50);
        this.p.stroke(255);
        this.p.strokeWeight(2);
        this.p.rect(-8, -6, 5, 12, 2);
        this.p.rect(3, -6, 5, 12, 2);
        this.p.fill(100, 100, 200);
        this.p.rect(-8, 6, 16, 5, 2);
        break;
    }

    this.p.pop();
  }

  getCollisionBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}