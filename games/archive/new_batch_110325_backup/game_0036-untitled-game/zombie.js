// zombie.js
import { gameState, GROUND_Y } from './globals.js';

export class Zombie {
  constructor(p, x) {
    this.p = p;
    this.x = x;
    this.y = GROUND_Y - 15;
    this.width = 20;
    this.height = 30;
    this.vx = 0;
    this.health = 100;
    this.animOffset = p.random(1000);
  }
  
  update() {
    const p = this.p;
    
    // Move slightly toward player or stay still
    if (gameState.player && this.x > gameState.player.x) {
      this.vx = -0.3;
    } else {
      this.vx = 0.2;
    }
    
    this.x += this.vx;
    
    // Animation
    this.y = GROUND_Y - 15 + p.sin((p.frameCount + this.animOffset) * 0.1) * 2;
  }
  
  render() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    if (screenX < -50 || screenX > 650) return;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Body
    p.fill(50, 100, 50);
    p.stroke(30, 70, 30);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height, this.width, this.height, 3);
    
    // Head
    p.fill(70, 120, 70);
    p.circle(0, -this.height - 8, 16);
    
    // Arms
    const armSwing = p.sin((p.frameCount + this.animOffset) * 0.15) * 10;
    p.stroke(50, 100, 50);
    p.strokeWeight(3);
    p.line(-this.width / 2, -this.height + 5, -this.width / 2 - 8, -this.height + 10 + armSwing);
    p.line(this.width / 2, -this.height + 5, this.width / 2 + 8, -this.height + 10 - armSwing);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-3, -this.height - 8, 3);
    p.circle(3, -this.height - 8, 3);
    
    p.pop();
  }
}