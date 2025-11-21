// obstacle.js - Obstacle entity

import { TUNNEL_RADIUS, NUM_SEGMENTS, SEGMENT_ANGLE, OBSTACLE_WIDTH, OBSTACLE_HEIGHT } from './globals.js';

export class Obstacle {
  constructor(segment, z, id) {
    this.segment = segment; // Which segment it's on (0-7)
    this.z = z; // Distance along tunnel
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
    this.id = id;
    this.type = 'bump'; // speed bump type
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
    
    // Draw speed bump
    p.fill(255, 100, 50);
    p.stroke(200, 50, 0);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    
    // Add stripes
    p.stroke(255, 200, 0);
    p.strokeWeight(1);
    for (let i = -1; i <= 1; i++) {
      p.line(i * 8, -this.height / 2, i * 8, this.height / 2);
    }
    
    p.pop();
  }

  // Check collision with player
  checkCollision(playerSegment, playerZ) {
    // Player is at z=0 effectively
    const zDiff = Math.abs(this.z);
    const segmentMatch = this.segment === playerSegment;
    
    // Collision if on same segment and z is close to 0
    return segmentMatch && zDiff < 30;
  }
}