// platform.js - Platform entities
import { gameState } from './globals.js';

export class Platform {
  constructor(p, x, y, width, height, type = "grass") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // grass, stone, wood, cloud
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y;
    
    p.push();
    
    if (this.type === "grass") {
      // Grass platform
      p.fill(101, 67, 33);
      p.noStroke();
      p.rect(screenX, screenY, this.width, this.height, 2);
      
      // Grass top
      p.fill(34, 139, 34);
      p.rect(screenX, screenY, this.width, 6, 2, 2, 0, 0);
      
      // Grass blades
      p.fill(50, 205, 50);
      for (let i = 0; i < this.width; i += 8) {
        p.rect(screenX + i, screenY - 2, 3, 4);
      }
    } else if (this.type === "stone") {
      // Stone platform
      p.fill(128, 128, 128);
      p.stroke(80, 80, 80);
      p.strokeWeight(2);
      p.rect(screenX, screenY, this.width, this.height, 2);
      
      // Stone texture
      p.noStroke();
      p.fill(160, 160, 160);
      for (let i = 0; i < this.width; i += 16) {
        for (let j = 0; j < this.height; j += 16) {
          p.rect(screenX + i + 2, screenY + j + 2, 6, 6);
        }
      }
    } else if (this.type === "wood") {
      // Wood platform
      p.fill(139, 90, 43);
      p.stroke(101, 67, 33);
      p.strokeWeight(2);
      p.rect(screenX, screenY, this.width, this.height, 2);
      
      // Wood grain
      p.stroke(160, 120, 80);
      p.strokeWeight(1);
      for (let i = 0; i < this.width; i += 12) {
        p.line(screenX + i, screenY, screenX + i, screenY + this.height);
      }
    } else if (this.type === "cloud") {
      // Cloud platform (semi-transparent)
      p.fill(255, 255, 255, 200);
      p.noStroke();
      p.ellipse(screenX + this.width / 4, screenY + 10, this.width / 2, 20);
      p.ellipse(screenX + 3 * this.width / 4, screenY + 10, this.width / 2, 20);
      p.ellipse(screenX + this.width / 2, screenY + 5, this.width / 2, 24);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

export class Goal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 100;
    this.waveOffset = 0;
  }

  update() {
    this.waveOffset += 0.1;
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y;
    
    p.push();
    
    // Flag pole
    p.fill(139, 90, 43);
    p.noStroke();
    p.rect(screenX, screenY, 6, this.height);
    
    // Flag (waving)
    p.fill(255, 50, 50);
    p.stroke(200, 0, 0);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(screenX + 6, screenY + 10);
    for (let i = 0; i <= 30; i += 5) {
      const wave = p.sin(this.waveOffset + i * 0.2) * 3;
      p.vertex(screenX + 6 + 30 + wave, screenY + 10 + i);
    }
    p.vertex(screenX + 6, screenY + 40);
    p.endShape(p.CLOSE);
    
    // Flag detail
    p.fill(255, 200, 200);
    p.noStroke();
    p.ellipse(screenX + 20, screenY + 25, 8, 8);
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}