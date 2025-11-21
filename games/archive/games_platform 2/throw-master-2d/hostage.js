// hostage.js - Hostage entity

export class Hostage {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.alive = true;
  }

  draw(p) {
    if (!this.alive) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Draw hostage (blue circle)
    p.fill(100, 150, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Draw simple stick figure
    p.stroke(255);
    p.strokeWeight(1.5);
    p.line(0, 2, 0, 8); // Body
    p.line(0, 4, -3, 7); // Left arm
    p.line(0, 4, 3, 7); // Right arm
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }

  kill() {
    this.alive = false;
  }
}