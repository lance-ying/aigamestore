// particles.js - Particle effects
import { gameState } from './globals.js';

export class Particle {
  constructor(p, x, y, type = "coin") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-2, 2);
    this.vy = p.random(-4, -1);
    this.life = 60;
    this.maxLife = 60;
    this.type = type;
    this.size = p.random(4, 8);
    this.rotation = p.random(0, p.TWO_PI);
    this.rotationSpeed = p.random(-0.2, 0.2);
    
    if (type === "coin") {
      this.color = [255, 215, 0];
    } else if (type === "health") {
      this.color = [50, 205, 50];
    } else if (type === "damage") {
      this.color = [255, 50, 50];
    } else {
      this.color = [255, 255, 255];
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
    this.rotation += this.rotationSpeed;
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const alpha = (this.life / this.maxLife) * 255;
    
    p.push();
    p.translate(screenX, this.y);
    p.rotate(this.rotation);
    p.fill(...this.color, alpha);
    p.noStroke();
    
    if (this.type === "coin") {
      p.ellipse(0, 0, this.size, this.size);
    } else if (this.type === "health") {
      p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      p.triangle(0, -this.size / 2, -this.size / 2, this.size / 2, this.size / 2, this.size / 2);
    }
    
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}