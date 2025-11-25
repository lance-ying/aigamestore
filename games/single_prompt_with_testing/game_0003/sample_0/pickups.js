// pickups.js - Experience gems, gold, and other pickups
import { XP_GEM_VALUE, GOLD_COIN_VALUE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.dead = false;
    this.animTimer = 0;
    this.magnetRange = 100;
    this.magnetSpeed = 0;
  }
  
  update(p, player) {
    // Magnet effect
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const effectiveRange = this.magnetRange * player.magnet;
    
    if (dist < effectiveRange && dist > 1) {
      this.magnetSpeed = p.lerp(this.magnetSpeed, 8, 0.1);
      this.x += (dx / dist) * this.magnetSpeed;
      this.y += (dy / dist) * this.magnetSpeed;
    } else {
      this.magnetSpeed = 0;
    }
    
    this.animTimer++;
  }
  
  collect(player) {
    this.dead = true;
    
    switch (this.type) {
      case 'xp':
        return { xp: XP_GEM_VALUE, gold: 0 };
      case 'gold':
        return { xp: 0, gold: GOLD_COIN_VALUE };
      case 'health':
        player.health = Math.min(player.health + 20, player.maxHealth + player.maxHealthBonus);
        return { xp: 0, gold: 0 };
      case 'big_xp':
        return { xp: XP_GEM_VALUE * 5, gold: 0 };
    }
    
    return { xp: 0, gold: 0 };
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    
    const float = Math.sin(this.animTimer * 0.1) * 3;
    
    switch (this.type) {
      case 'xp':
        p.fill(100, 255, 150);
        p.stroke(50, 200, 100);
        p.strokeWeight(2);
        p.ellipse(screenX, screenY + float, 10, 10);
        break;
      case 'big_xp':
        p.fill(150, 255, 200);
        p.stroke(100, 220, 150);
        p.strokeWeight(2);
        p.ellipse(screenX, screenY + float, 16, 16);
        // Inner glow
        p.noStroke();
        p.fill(200, 255, 220, 150);
        p.ellipse(screenX, screenY + float, 10, 10);
        break;
      case 'gold':
        p.fill(255, 215, 0);
        p.stroke(200, 170, 0);
        p.strokeWeight(2);
        p.ellipse(screenX, screenY + float, 12, 12);
        // Shine effect
        p.noStroke();
        p.fill(255, 255, 150, 200);
        p.ellipse(screenX - 2, screenY + float - 2, 4, 4);
        break;
      case 'health':
        p.fill(255, 100, 100);
        p.stroke(200, 50, 50);
        p.strokeWeight(2);
        // Heart shape (simplified)
        p.ellipse(screenX - 3, screenY + float - 2, 8, 8);
        p.ellipse(screenX + 3, screenY + float - 2, 8, 8);
        p.triangle(screenX - 6, screenY + float, screenX + 6, screenY + float, screenX, screenY + float + 8);
        break;
    }
    
    p.pop();
  }
}

export function createPickup(x, y, type) {
  return new Pickup(x, y, type);
}