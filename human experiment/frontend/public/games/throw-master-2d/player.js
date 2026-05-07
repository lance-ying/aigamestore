// player.js - Player entity

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.angle = -Math.PI / 2; // Aiming upward initially
  }

  update() {
    this.angle = gameState.playerAngle;
  }

  draw(p) {
    p.push();
    
    // Draw trajectory line first (so it appears behind the player)
    this.drawTrajectoryLine(p);
    
    p.translate(this.x, this.y);
    
    // Draw player body (green circle)
    p.fill(50, 200, 50);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Draw aiming indicator (white triangle pointing right in local coords)
    p.fill(255);
    p.noStroke();
    p.rotate(this.angle);
    // Triangle now points to the right (positive X) before rotation
    p.triangle(0, -5, 0, 5, 15, 0);
    
    p.pop();
  }

  drawTrajectoryLine(p) {
    const trajectoryLength = 200; // Length of trajectory line
    const numDots = 15; // Number of dots along the trajectory
    
    // Calculate end point of trajectory
    const endX = this.x + Math.cos(this.angle) * trajectoryLength;
    const endY = this.y + Math.sin(this.angle) * trajectoryLength;
    
    // Draw dotted line
    p.stroke(255, 255, 255, 120); // Semi-transparent white
    p.strokeWeight(2);
    
    for (let i = 1; i <= numDots; i++) {
      const t = i / numDots;
      const px = this.x + Math.cos(this.angle) * trajectoryLength * t;
      const py = this.y + Math.sin(this.angle) * trajectoryLength * t;
      
      // Draw small circle for each dot
      p.noStroke();
      p.fill(255, 255, 255, 150 * (1 - t * 0.5)); // Fade out along trajectory
      p.circle(px, py, 3);
    }
  }
}