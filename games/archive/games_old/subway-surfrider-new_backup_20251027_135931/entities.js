// entities.js - Game entities (obstacles, coins, powerups)
import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_POSITIONS, PLAYER_START_Y } from './globals.js';

export class Obstacle {
  constructor(p, type, lanes, z) {
    this.p = p;
    this.type = type; // 'train', 'jump', 'slide'
    this.lanes = lanes; // Array of lane indices this obstacle occupies
    this.z = z;
    this.active = true;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition(laneIndex) {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    
    // Calculate screen Y with perspective
    const horizonY = CANVAS_HEIGHT * 0.4; // 160
    const playerLevelY = PLAYER_START_Y; // 300
    const screenY = horizonY + (playerLevelY - horizonY) * scale;
    
    // Calculate screen X with perspective - converge toward center at distance
    const centerX = CANVAS_WIDTH / 2;
    const laneX = LANE_POSITIONS[laneIndex];
    const offsetFromCenter = laneX - centerX;
    const screenX = centerX + offsetFromCenter * scale;
    
    return { scale, screenY, screenX };
  }
  
  getBoundingBoxes() {
    const boxes = [];
    
    for (const laneIndex of this.lanes) {
      const { scale, screenY, screenX } = this.getScreenPosition(laneIndex);
      
      if (this.type === 'train') {
        boxes.push({
          x: screenX - 40 * scale,
          y: screenY - 100 * scale,
          width: 80 * scale,
          height: 100 * scale
        });
      } else if (this.type === 'jump') {
        boxes.push({
          x: screenX - 30 * scale,
          y: screenY - 20 * scale,
          width: 60 * scale,
          height: 20 * scale
        });
      } else if (this.type === 'slide') {
        boxes.push({
          x: screenX - 30 * scale,
          y: screenY - 80 * scale,
          width: 60 * scale,
          height: 15 * scale
        });
      }
    }
    
    return boxes;
  }
  
  render() {
    const p = this.p;
    
    p.push();
    
    for (const laneIndex of this.lanes) {
      const { scale, screenY, screenX } = this.getScreenPosition(laneIndex);
      
      if (scale < 0.1) continue;
      
      if (this.type === 'train') {
        // Draw train
        p.fill(120, 120, 120);
        p.stroke(80, 80, 80);
        p.strokeWeight(2);
        p.rect(screenX - 40 * scale, screenY - 100 * scale, 80 * scale, 100 * scale, 5);
        
        // Train windows
        p.fill(50, 150, 200);
        p.noStroke();
        p.rect(screenX - 25 * scale, screenY - 80 * scale, 20 * scale, 25 * scale);
        p.rect(screenX + 5 * scale, screenY - 80 * scale, 20 * scale, 25 * scale);
        
        // "DODGE!" text if close enough
        if (scale > 0.5) {
          p.fill(255, 50, 50);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(14 * scale);
          p.textStyle(p.BOLD);
          p.text('DODGE!', screenX, screenY - 120 * scale);
        }
      } else if (this.type === 'jump') {
        // Draw low barrier
        p.fill(255, 220, 0);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(screenX - 30 * scale, screenY - 20 * scale, 60 * scale, 20 * scale);
        
        // Hazard stripes
        p.fill(0);
        for (let i = 0; i < 3; i++) {
          p.rect(screenX - 30 * scale + i * 20 * scale, screenY - 20 * scale, 10 * scale, 20 * scale);
        }
        
        // "JUMP!" text if close enough
        if (scale > 0.5) {
          p.fill(255, 255, 50);
          p.stroke(0);
          p.strokeWeight(2);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(16 * scale);
          p.textStyle(p.BOLD);
          p.text('JUMP!', screenX, screenY - 40 * scale);
          
          // Up arrow
          p.noStroke();
          p.fill(255, 255, 50);
          p.triangle(
            screenX, screenY - 60 * scale,
            screenX - 8 * scale, screenY - 48 * scale,
            screenX + 8 * scale, screenY - 48 * scale
          );
        }
      } else if (this.type === 'slide') {
        // Draw high barrier
        p.fill(200, 50, 50);
        p.stroke(150, 30, 30);
        p.strokeWeight(2);
        p.rect(screenX - 30 * scale, screenY - 80 * scale, 60 * scale, 15 * scale);
        
        // "SLIDE!" text if close enough
        if (scale > 0.5) {
          p.fill(255, 100, 100);
          p.stroke(0);
          p.strokeWeight(2);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(16 * scale);
          p.textStyle(p.BOLD);
          p.text('SLIDE!', screenX, screenY - 100 * scale);
          
          // Down arrow
          p.noStroke();
          p.fill(255, 100, 100);
          p.triangle(
            screenX, screenY - 60 * scale,
            screenX - 8 * scale, screenY - 72 * scale,
            screenX + 8 * scale, screenY - 72 * scale
          );
        }
      }
    }
    
    p.pop();
  }
}

export class Coin {
  constructor(p, lane, z, yOffset = 0) {
    this.p = p;
    this.lane = lane;
    this.z = z;
    this.yOffset = yOffset;
    this.active = true;
    this.collected = false;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition() {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    
    // Calculate screen Y with perspective
    const horizonY = CANVAS_HEIGHT * 0.4; // 160
    const playerLevelY = PLAYER_START_Y; // 300
    const screenY = horizonY + (playerLevelY - horizonY) * scale - this.yOffset * scale;
    
    // Calculate screen X with perspective - converge toward center at distance
    const centerX = CANVAS_WIDTH / 2;
    const laneX = LANE_POSITIONS[this.lane];
    const offsetFromCenter = laneX - centerX;
    const screenX = centerX + offsetFromCenter * scale;
    
    return { scale, screenY, screenX };
  }
  
  getBoundingBox() {
    const { scale, screenY, screenX } = this.getScreenPosition();
    const size = 15 * scale;
    return {
      x: screenX - size / 2,
      y: screenY - size / 2,
      width: size,
      height: size
    };
  }
  
  render() {
    const p = this.p;
    if (this.collected) return;
    
    const { scale, screenY, screenX } = this.getScreenPosition();
    
    if (scale < 0.1) return;
    
    p.push();
    
    // Coin glow
    p.noStroke();
    p.fill(255, 220, 100, 100);
    p.circle(screenX, screenY, 20 * scale);
    
    // Coin
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);
    p.circle(screenX, screenY, 15 * scale);
    
    // Highlight
    p.fill(255, 255, 200);
    p.noStroke();
    p.circle(screenX - 3 * scale, screenY - 3 * scale, 5 * scale);
    
    p.pop();
  }
}

export class Powerup {
  constructor(p, type, lane, z) {
    this.p = p;
    this.type = type; // 'jetpack', 'hoverboard', 'magnet'
    this.lane = lane;
    this.z = z;
    this.active = true;
    this.collected = false;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition() {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    
    // Calculate screen Y with perspective
    const horizonY = CANVAS_HEIGHT * 0.4; // 160
    const playerLevelY = PLAYER_START_Y; // 300
    const screenY = horizonY + (playerLevelY - horizonY) * scale - 50 * scale;
    
    // Calculate screen X with perspective - converge toward center at distance
    const centerX = CANVAS_WIDTH / 2;
    const laneX = LANE_POSITIONS[this.lane];
    const offsetFromCenter = laneX - centerX;
    const screenX = centerX + offsetFromCenter * scale;
    
    return { scale, screenY, screenX };
  }
  
  getBoundingBox() {
    const { scale, screenY, screenX } = this.getScreenPosition();
    const size = 30 * scale;
    return {
      x: screenX - size / 2,
      y: screenY - size / 2,
      width: size,
      height: size
    };
  }
  
  render() {
    const p = this.p;
    if (this.collected) return;
    
    const { scale, screenY, screenX } = this.getScreenPosition();
    
    if (scale < 0.1) return;
    
    p.push();
    
    const size = 30 * scale;
    
    // Background circle
    p.noStroke();
    p.fill(255, 255, 255, 150);
    p.circle(screenX, screenY, size * 1.3);
    
    if (this.type === 'jetpack') {
      // Green rocket
      p.fill(50, 200, 50);
      p.stroke(30, 150, 30);
      p.strokeWeight(2);
      p.triangle(
        screenX, screenY - size * 0.4,
        screenX - size * 0.3, screenY + size * 0.4,
        screenX + size * 0.3, screenY + size * 0.4
      );
      p.fill(255, 100, 0);
      p.noStroke();
      p.triangle(
        screenX - size * 0.15, screenY + size * 0.4,
        screenX, screenY + size * 0.6,
        screenX + size * 0.15, screenY + size * 0.4
      );
    } else if (this.type === 'hoverboard') {
      // Orange board
      p.fill(255, 150, 0);
      p.stroke(200, 100, 0);
      p.strokeWeight(2);
      p.rect(screenX - size * 0.4, screenY - size * 0.15, size * 0.8, size * 0.3, 5);
      
      // Wheels
      p.fill(50);
      p.circle(screenX - size * 0.25, screenY + size * 0.2, size * 0.15);
      p.circle(screenX + size * 0.25, screenY + size * 0.2, size * 0.15);
    } else if (this.type === 'magnet') {
      // Purple magnet
      p.fill(150, 50, 200);
      p.stroke(100, 30, 150);
      p.strokeWeight(2);
      p.rect(screenX - size * 0.35, screenY - size * 0.4, size * 0.25, size * 0.8, 5);
      p.rect(screenX + size * 0.1, screenY - size * 0.4, size * 0.25, size * 0.8, 5);
      
      p.fill(255, 100, 100);
      p.noStroke();
      p.rect(screenX - size * 0.35, screenY - size * 0.4, size * 0.25, size * 0.3);
      
      p.fill(100, 100, 255);
      p.rect(screenX + size * 0.1, screenY - size * 0.4, size * 0.25, size * 0.3);
    }
    
    p.pop();
  }
}