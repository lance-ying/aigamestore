// hostage.js - Hostage entity

export class Hostage {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.alive = true;
    this.health = 100;
    this.maxHealth = 100;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  draw(p) {
    if (!this.alive) {
      // Draw dead hostage (gray X)
      p.push();
      p.translate(this.x, this.y);
      p.stroke(100);
      p.strokeWeight(3);
      p.line(-5, -5, 5, 5);
      p.line(-5, 5, 5, -5);
      p.pop();
      return;
    }
    
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
    
    // Draw health bar
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    // Background (red)
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(-barWidth / 2, -15, barWidth, barHeight);
    
    // Health (green to yellow to red based on health)
    let healthColor;
    if (healthPercent > 0.6) {
      healthColor = [0, 255, 0]; // Green
    } else if (healthPercent > 0.3) {
      healthColor = [255, 255, 0]; // Yellow
    } else {
      healthColor = [255, 100, 0]; // Orange
    }
    
    p.fill(...healthColor);
    p.rect(-barWidth / 2, -15, barWidth * healthPercent, barHeight);
    
    // Health text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(Math.ceil(this.health), 0, -20);
    
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
    this.health = 0;
  }
}