// player.js - Player entity

import { PLAYER_SIZE, TUNNEL_RADIUS, NUM_SEGMENTS } from './globals.js';

export class Player {
  constructor(segment) {
    this.segment = segment; // Which segment of the octagon (0-7)
    this.size = PLAYER_SIZE;
    this.radius = TUNNEL_RADIUS;
  }

  // Get position in screen space
  getScreenPosition(tunnelRotation, p) {
    const angle = (this.segment * Math.PI * 2) / NUM_SEGMENTS + tunnelRotation;
    const x = TUNNEL_RADIUS * Math.cos(angle);
    const y = TUNNEL_RADIUS * Math.sin(angle);
    return { x, y };
  }

  render(p, tunnelRotation) {
    const pos = this.getScreenPosition(tunnelRotation, p);
    
    p.push();
    p.translate(pos.x, pos.y);
    
    // Draw player as a small ship
    p.fill(100, 200, 255);
    p.stroke(255);
    p.strokeWeight(2);
    
    // Simple triangle shape pointing toward center
    const angle = (this.segment * Math.PI * 2) / NUM_SEGMENTS + tunnelRotation + Math.PI;
    p.rotate(angle);
    
    p.beginShape();
    p.vertex(0, -this.size / 2);
    p.vertex(-this.size / 3, this.size / 2);
    p.vertex(this.size / 3, this.size / 2);
    p.endShape(p.CLOSE);
    
    // Add glow effect
    p.noFill();
    p.stroke(100, 200, 255, 100);
    p.strokeWeight(4);
    p.circle(0, 0, this.size * 1.5);
    
    p.pop();
  }
}