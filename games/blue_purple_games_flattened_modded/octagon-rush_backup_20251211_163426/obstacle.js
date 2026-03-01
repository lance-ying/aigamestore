// obstacle.js - Obstacle entity

import { TUNNEL_RADIUS, NUM_SEGMENTS, SEGMENT_ANGLE, OBSTACLE_WIDTH, OBSTACLE_HEIGHT } from './globals.js';

export class Obstacle {
  constructor(segment, z, id, color = [255, 100, 50]) {
    this.segment = segment; // Which segment it's on (0-7)
    this.z = z; // Distance along tunnel
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
    this.id = id;
    this.type = 'bump'; // speed bump type
    this.color = color; // Obstacle color based on level
  }

  update(speed) {
    this.z -= speed;
  }

  // Check if obstacle is behind the player (passed)
  isPassed() {
    return this.z < -50;
  }

  // Check if obstacle is too far ahead to render
  isTooFar() {
    return this.z > 600;
  }

  // Get screen position for rendering
  getScreenPosition(tunnelRotation, scrollOffset) {
    const angle = (this.segment * Math.PI * 2) / NUM_SEGMENTS + tunnelRotation;
    
    // Calculate perspective scale based on z depth
    const perspectiveScale = 400 / (400 + this.z);
    const radius = TUNNEL_RADIUS * perspectiveScale;
    
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return { x, y, scale: perspectiveScale };
  }

  render(p, tunnelRotation, scrollOffset) {
    if (this.z < -50 || this.z > 600) return;
    
    const pos = this.getScreenPosition(tunnelRotation, scrollOffset);
    
    p.push();
    p.translate(pos.x, pos.y);
    
    // Rotate to align with tunnel segment
    const angle = (this.segment * Math.PI * 2) / NUM_SEGMENTS + tunnelRotation + Math.PI / 2;
    p.rotate(angle);
    
    // Scale based on depth
    p.scale(pos.scale);
    
    // Draw speed bump with level-specific color
    p.fill(this.color[0], this.color[1], this.color[2]);
    const darkerColor = [
      Math.max(0, this.color[0] - 50),
      Math.max(0, this.color[1] - 50),
      Math.max(0, this.color[2] - 50)
    ];
    p.stroke(darkerColor[0], darkerColor[1], darkerColor[2]);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    
    // Add stripes with complementary color
    const stripeColor = [
      Math.min(255, this.color[0] + 100),
      Math.min(255, this.color[1] + 100),
      Math.min(255, this.color[2] + 100)
    ];
    p.stroke(stripeColor[0], stripeColor[1], stripeColor[2]);
    p.strokeWeight(1);
    for (let i = -1; i <= 1; i++) {
      p.line(i * 8, -this.height / 2, i * 8, this.height / 2);
    }
    
    p.pop();
  }

  // Check collision with player
  checkCollision(playerSegment, playerZ, tunnelRotation) {
    // Player is at z=0 effectively
    const zDiff = Math.abs(this.z);
    if (zDiff > 30) return false;
    
    // Calculate the angular positions
    const playerAngle = (playerSegment * Math.PI * 2) / NUM_SEGMENTS;
    const obstacleAngle = (this.segment * Math.PI * 2) / NUM_SEGMENTS + tunnelRotation;
    
    // Calculate angular difference
    let angleDiff = playerAngle - obstacleAngle;
    
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) {
      angleDiff -= Math.PI * 2;
    }
    while (angleDiff < -Math.PI) {
      angleDiff += Math.PI * 2;
    }
    
    // Get absolute angular difference
    const absAngleDiff = Math.abs(angleDiff);
    
    // Collision threshold
    const collisionThreshold = (Math.PI * 2) / NUM_SEGMENTS * 0.4;
    
    return absAngleDiff < collisionThreshold;
  }
}