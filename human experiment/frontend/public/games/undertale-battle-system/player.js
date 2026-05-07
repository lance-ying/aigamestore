// player.js - Player class representing the SOUL
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 12;
    this.speed = 2.5;
    this.dodgeSpeed = 5;
    this.isDodging = false;
    this.dodgeDuration = 0;
  }

  update(p, keys, dodgeCooldown) {
    let moveSpeed = this.speed;
    
    // Check if space is pressed and cooldown is ready
    if (keys[32] && dodgeCooldown <= 0) {
      this.isDodging = true;
      this.dodgeDuration = 8;
      return true; // Signal dodge was activated
    }

    if (this.isDodging) {
      moveSpeed = this.dodgeSpeed;
      this.dodgeDuration--;
      if (this.dodgeDuration <= 0) {
        this.isDodging = false;
      }
    }

    // Movement with arrow keys
    if (keys[37]) this.x -= moveSpeed; // LEFT
    if (keys[39]) this.x += moveSpeed; // RIGHT
    if (keys[38]) this.y -= moveSpeed; // UP
    if (keys[40]) this.y += moveSpeed; // DOWN

    // Constrain to battle box (centered area)
    const boxLeft = CANVAS_WIDTH / 2 - 140;
    const boxRight = CANVAS_WIDTH / 2 + 140;
    const boxTop = 240;
    const boxBottom = 370;

    this.x = p.constrain(this.x, boxLeft + this.size / 2, boxRight - this.size / 2);
    this.y = p.constrain(this.y, boxTop + this.size / 2, boxBottom - this.size / 2);

    return false; // No dodge activated
  }

  draw(p, damageFlash) {
    p.push();
    
    // Flash red when damaged
    if (damageFlash > 0) {
      p.fill(255, 100, 100);
    } else {
      p.fill(255, 0, 0);
    }
    
    // Draw heart shape
    p.noStroke();
    p.beginShape();
    const x = this.x;
    const y = this.y;
    const s = this.size / 2;
    
    // Simple heart using triangles
    p.triangle(x, y + s, x - s, y - s / 2, x, y);
    p.triangle(x, y + s, x + s, y - s / 2, x, y);
    
    p.endShape();
    
    // Dodge indicator
    if (this.isDodging) {
      p.noFill();
      p.stroke(255, 255, 0, 150);
      p.strokeWeight(2);
      p.circle(x, y, this.size * 2);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    };
  }
}