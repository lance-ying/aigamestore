// loot.js
import { gameState } from './globals.js';

export class Loot {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'gold', 'health', 'mana'
    this.width = 16;
    this.height = 16;
    this.vy = -2;
    this.bounces = 0;
    this.collected = false;
    this.animTimer = 0;
  }
  
  update(platforms) {
    if (this.collected) return;
    
    this.animTimer++;
    this.vy += 0.3;
    this.y += this.vy;
    
    // Bounce on platforms
    for (let platform of platforms) {
      if (this.vy > 0 && this.y + this.height > platform.y && 
          this.y < platform.y + 10 &&
          this.x + this.width > platform.x && this.x < platform.x + platform.width) {
        this.y = platform.y - this.height;
        this.vy = -this.vy * 0.5;
        this.bounces++;
        if (this.bounces > 2) this.vy = 0;
      }
    }
  }
  
  checkCollection(player) {
    if (this.collected) return false;
    
    const dist = Math.sqrt(
      Math.pow(this.x + this.width/2 - (player.x + player.width/2), 2) +
      Math.pow(this.y + this.height/2 - (player.y + player.height/2), 2)
    );
    
    if (dist < 30) {
      this.collected = true;
      return true;
    }
    return false;
  }
  
  draw(p, cameraX) {
    if (this.collected) return;
    
    p.push();
    const screenX = this.x - cameraX;
    
    p.noStroke();
    
    if (this.type === 'gold') {
      // Spinning gold coin
      p.fill(255, 215, 0);
      const coinWidth = Math.abs(Math.sin(this.animTimer * 0.1) * this.width);
      p.ellipse(screenX + this.width/2, this.y + this.height/2, coinWidth, this.height);
      p.fill(255, 235, 50);
      p.ellipse(screenX + this.width/2, this.y + this.height/2, coinWidth * 0.6, this.height * 0.6);
    } else if (this.type === 'health') {
      // Red potion
      p.fill(150, 0, 0);
      p.rect(screenX + 4, this.y + 2, 8, 10, 2);
      p.fill(255, 0, 0);
      p.rect(screenX + 4, this.y + 4, 8, 8, 2);
      p.fill(200, 0, 0);
      p.ellipse(screenX + 8, this.y + 1, 4, 4);
    } else if (this.type === 'mana') {
      // Blue potion
      p.fill(0, 0, 150);
      p.rect(screenX + 4, this.y + 2, 8, 10, 2);
      p.fill(0, 100, 255);
      p.rect(screenX + 4, this.y + 4, 8, 8, 2);
      p.fill(0, 150, 255);
      p.ellipse(screenX + 8, this.y + 1, 4, 4);
    }
    
    p.pop();
  }
}