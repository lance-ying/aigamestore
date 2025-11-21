// obstacles.js - Obstacle and coin classes

import { OBSTACLE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Obstacle {
  constructor(type, z, lane) {
    this.type = type;
    this.z = z;
    this.lane = lane;
    this.active = true;
    this.x = CANVAS_WIDTH / 2 + lane * 100;
    this.width = 80;
    this.height = 40;
    
    if (type === OBSTACLE_TYPES.LOW_BARRIER) {
      this.height = 30;
    } else if (type === OBSTACLE_TYPES.HIGH_BARRIER) {
      this.height = 60;
    } else if (type === OBSTACLE_TYPES.GAP) {
      this.width = 120;
      this.height = 10;
    }
  }

  update(speed) {
    this.z -= speed;
    if (this.z < -100) {
      this.active = false;
    }
  }

  getScreenPosition() {
    const scale = 400 / (this.z + 400);
    const screenY = CANVAS_HEIGHT / 2 + (200 - this.z) * 0.5;
    const screenX = this.x;
    const screenWidth = this.width * scale;
    const screenHeight = this.height * scale;
    
    return { x: screenX, y: screenY, width: screenWidth, height: screenHeight, scale };
  }

  render(p) {
    if (this.z < -50 || this.z > 800) return;
    
    const pos = this.getScreenPosition();
    
    p.push();
    
    if (this.type === OBSTACLE_TYPES.LOW_BARRIER) {
      p.fill(160, 82, 45);
      p.rect(pos.x - pos.width / 2, pos.y - pos.height, pos.width, pos.height);
    } else if (this.type === OBSTACLE_TYPES.HIGH_BARRIER) {
      p.fill(139, 69, 19);
      p.rect(pos.x - pos.width / 2, pos.y - pos.height - 30, pos.width, 20);
    } else if (this.type === OBSTACLE_TYPES.GAP) {
      p.fill(20, 20, 30);
      p.rect(pos.x - pos.width / 2, pos.y - 10, pos.width, 20);
    }
    
    p.pop();
  }

  checkCollision(player) {
    if (this.z < -20 || this.z > 50) return false;
    
    const playerBox = player.getCollisionBox();
    const pos = this.getScreenPosition();
    
    // Check lane matching
    if (Math.abs(player.x - this.x) > 60) return false;
    
    if (this.type === OBSTACLE_TYPES.LOW_BARRIER) {
      // Can jump over
      if (player.state !== 'jumping') {
        return this.checkBoxCollision(playerBox, pos);
      }
    } else if (this.type === OBSTACLE_TYPES.HIGH_BARRIER) {
      // Must slide under
      if (player.state !== 'sliding') {
        return this.checkBoxCollision(playerBox, pos);
      }
    } else if (this.type === OBSTACLE_TYPES.GAP) {
      // Must jump over
      if (player.state !== 'jumping') {
        return this.checkBoxCollision(playerBox, pos);
      }
    }
    
    return false;
  }

  checkBoxCollision(box1, box2) {
    return box1.x < box2.x + box2.width / 2 &&
           box1.x + box1.width > box2.x - box2.width / 2 &&
           box1.y < box2.y &&
           box1.y + box1.height > box2.y - box2.height;
  }
}

export class Coin {
  constructor(z, lane, yOffset = 0) {
    this.z = z;
    this.lane = lane;
    this.x = CANVAS_WIDTH / 2 + lane * 100;
    this.yOffset = yOffset;
    this.active = true;
    this.rotation = 0;
  }

  update(speed) {
    this.z -= speed;
    this.rotation += 0.1;
    if (this.z < -100) {
      this.active = false;
    }
  }

  getScreenPosition() {
    const scale = 400 / (this.z + 400);
    const screenY = CANVAS_HEIGHT / 2 + (200 - this.z) * 0.5 - 50 + this.yOffset;
    const screenX = this.x;
    const size = 20 * scale;
    
    return { x: screenX, y: screenY, size, scale };
  }

  render(p) {
    if (this.z < -50 || this.z > 800) return;
    
    const pos = this.getScreenPosition();
    
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(this.rotation);
    p.fill(255, 215, 0);
    p.stroke(200, 160, 0);
    p.strokeWeight(2);
    p.ellipse(0, 0, pos.size, pos.size);
    p.fill(255, 235, 100);
    p.noStroke();
    p.ellipse(-pos.size * 0.2, -pos.size * 0.2, pos.size * 0.3, pos.size * 0.3);
    p.pop();
  }

  checkCollection(player) {
    if (this.z < -20 || this.z > 50) return false;
    
    const pos = this.getScreenPosition();
    const distance = Math.sqrt(
      Math.pow(player.x - pos.x, 2) + 
      Math.pow(player.y + 25 - pos.y, 2)
    );
    
    return distance < pos.size + 15;
  }
}