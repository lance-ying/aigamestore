// tunnel.js - Tunnel rendering and management

import { TUNNEL_RADIUS, NUM_SEGMENTS, SEGMENT_ANGLE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Tunnel {
  constructor() {
    this.radius = TUNNEL_RADIUS;
    this.numSegments = NUM_SEGMENTS;
  }

  render(p, tunnelRotation, scrollOffset) {
    p.push();
    
    // Draw tunnel segments
    for (let i = 0; i < this.numSegments; i++) {
      const angle1 = (i * SEGMENT_ANGLE) + tunnelRotation;
      const angle2 = ((i + 1) * SEGMENT_ANGLE) + tunnelRotation;
      
      // Alternate colors for segments
      const isEven = i % 2 === 0;
      
      // Draw near edge
      p.stroke(isEven ? 80 : 60);
      p.strokeWeight(3);
      p.fill(isEven ? 40 : 30);
      
      // Draw segment as trapezoid for perspective
      const x1 = this.radius * Math.cos(angle1);
      const y1 = this.radius * Math.sin(angle1);
      const x2 = this.radius * Math.cos(angle2);
      const y2 = this.radius * Math.sin(angle2);
      
      // Far points (smaller for perspective)
      const farScale = 0.3;
      const x3 = this.radius * farScale * Math.cos(angle2);
      const y3 = this.radius * farScale * Math.sin(angle2);
      const x4 = this.radius * farScale * Math.cos(angle1);
      const y4 = this.radius * farScale * Math.sin(angle1);
      
      p.beginShape();
      p.vertex(x1, y1);
      p.vertex(x2, y2);
      p.vertex(x3, y3);
      p.vertex(x4, y4);
      p.endShape(p.CLOSE);
      
      // Draw grid lines for depth effect
      p.stroke(isEven ? 100 : 80);
      p.strokeWeight(1);
      for (let d = 0; d < 1; d += 0.2) {
        const scale = 1 - d * 0.7;
        const xa = this.radius * scale * Math.cos(angle1);
        const ya = this.radius * scale * Math.sin(angle1);
        const xb = this.radius * scale * Math.cos(angle2);
        const yb = this.radius * scale * Math.sin(angle2);
        p.line(xa, ya, xb, yb);
      }
    }
    
    // Draw center circle for visual reference
    p.fill(20);
    p.stroke(100);
    p.strokeWeight(2);
    p.circle(0, 0, 30);
    
    p.pop();
  }

  renderDepthLines(p, tunnelRotation, scrollOffset) {
    // Draw animated depth lines for motion effect
    p.push();
    p.stroke(70);
    p.strokeWeight(2);
    
    for (let i = 0; i < this.numSegments; i++) {
      const angle = (i * SEGMENT_ANGLE) + tunnelRotation;
      
      // Animated lines moving toward player
      for (let j = 0; j < 5; j++) {
        const offset = (scrollOffset * 2 + j * 100) % 400;
        const scale = 1 - (offset / 400) * 0.7;
        const x = this.radius * scale * Math.cos(angle);
        const y = this.radius * scale * Math.sin(angle);
        
        const nextAngle = ((i + 1) * SEGMENT_ANGLE) + tunnelRotation;
        const x2 = this.radius * scale * Math.cos(nextAngle);
        const y2 = this.radius * scale * Math.sin(nextAngle);
        
        p.line(x, y, x2, y2);
      }
    }
    
    p.pop();
  }
}