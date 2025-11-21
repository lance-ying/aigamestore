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
    p.translate(this.x, this.y);
    
    // Draw player body (green circle)
    p.fill(50, 200, 50);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Draw aiming indicator (white triangle)
    p.fill(255);
    p.noStroke();
    p.rotate(this.angle);
    p.triangle(-5, 0, 5, 0, 0, -15);
    
    p.pop();
  }
}