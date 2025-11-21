// entities.js - Game entities

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.screenX = x;
    this.screenY = y;
    this.gameX = x;
    this.gameY = y;
  }

  update() {
    this.screenX = this.x;
    this.screenY = this.y;
    this.gameX = this.x;
    this.gameY = this.y;
  }

  render(p) {
    p.push();
    // Draw player as a simple indicator at bottom center
    p.fill(100, 200, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, 20, 20);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("D", this.x, this.y);
    p.pop();
  }
}

export class Item {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  render(p, x, y, size = 30) {
    p.push();
    p.stroke(255);
    p.strokeWeight(2);
    
    switch(this.name) {
      case "keycard":
        p.fill(150, 180, 200);
        p.rect(x - size/2, y - size/2, size, size * 0.6);
        p.fill(255);
        p.noStroke();
        p.textSize(8);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("ID", x, y);
        break;
      case "battery":
        p.fill(60, 180, 60);
        p.rect(x - size/2, y - size/2, size * 0.6, size);
        p.fill(255, 200, 0);
        p.rect(x - size/4, y - size/2 - 5, size * 0.5, 5);
        break;
      case "chemical":
        p.fill(100, 200, 255, 180);
        p.ellipse(x, y, size, size * 1.2);
        p.fill(50, 150, 200, 100);
        p.ellipse(x, y - size/4, size * 0.6, size * 0.6);
        break;
      case "wrench":
        p.fill(150, 150, 160);
        p.rect(x - size/2, y, size * 0.8, size * 0.2);
        p.ellipse(x - size/2, y, size * 0.4, size * 0.4);
        break;
      default:
        p.fill(200);
        p.rect(x - size/2, y - size/2, size, size);
    }
    p.pop();
  }
}