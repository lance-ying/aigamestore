// enemy.js - Enemy entities

export class Enemy {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.stunned = false;
    this.stunTimer = 0;
    this.flashTimer = 0;
    
    // Type-specific properties (reduced speeds for better gameplay)
    if (type === 'normal') {
      this.health = 1;
      this.maxHealth = 1;
      this.speed = 0.6; // Reduced from 1
      this.size = 15;
      this.color = [255, 50, 50];
      this.points = 10;
    } else if (type === 'fast') {
      this.health = 1;
      this.maxHealth = 1;
      this.speed = 1.0; // Reduced from 1.5
      this.size = 15;
      this.color = [255, 150, 50];
      this.points = 20;
    } else if (type === 'tank') {
      this.health = 3;
      this.maxHealth = 3;
      this.speed = 0.5; // Reduced from 0.7
      this.size = 20;
      this.color = [150, 30, 30];
      this.points = 30;
    }
    
    this.targetX = x;
    this.targetY = y;
    this.pathIndex = 0;
    this.path = [];
  }

  setPath(path) {
    this.path = path;
    if (path.length > 0) {
      this.targetX = path[0].x;
      this.targetY = path[0].y;
    }
  }

  update() {
    if (!this.active) return;
    
    // Update stun
    if (this.stunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.stunned = false;
      }
      return;
    }
    
    // Update flash
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else if (this.path.length > 0) {
      // Move to next waypoint
      this.pathIndex++;
      if (this.pathIndex < this.path.length) {
        this.targetX = this.path[this.pathIndex].x;
        this.targetY = this.path[this.pathIndex].y;
      }
    }
  }

  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flash white when hit
    const fillColor = this.flashTimer > 0 ? [255, 255, 255] : this.color;
    
    p.fill(...fillColor);
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.type === 'normal' || this.type === 'tank') {
      p.circle(0, 0, this.size);
    } else if (this.type === 'fast') {
      p.triangle(-this.size / 2, this.size / 2, this.size / 2, this.size / 2, 0, -this.size / 2);
    }
    
    // Draw health bar for tank
    if (this.type === 'tank') {
      const barWidth = this.size;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(255, 0, 0);
      p.noStroke();
      p.rect(-barWidth / 2, -this.size / 2 - 8, barWidth, barHeight);
      
      p.fill(0, 255, 0);
      p.rect(-barWidth / 2, -this.size / 2 - 8, barWidth * healthPercent, barHeight);
    }
    
    // Draw stun indicator
    if (this.stunned) {
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("Zzz", 0, -this.size - 10);
    }
    
    p.pop();
  }

  takeDamage(amount) {
    this.health -= amount;
    this.flashTimer = 10;
    
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy defeated
    }
    return false;
  }

  stun(duration) {
    this.stunned = true;
    this.stunTimer = duration;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.size / 2
    };
  }
}