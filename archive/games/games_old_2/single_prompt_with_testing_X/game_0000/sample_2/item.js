// item.js
import { ITEM_TYPES } from './globals.js';

export class Item {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    
    const itemData = ITEM_TYPES[type];
    this.value = itemData.value;
    this.weight = itemData.weight;
    this.color = itemData.color;
    this.size = itemData.size;
    this.name = itemData.name;
    this.grabbed = false;
    this.shimmer = 0;
  }

  update() {
    this.shimmer += 0.1;
  }

  render() {
    const p = this.p;
    
    p.push();
    
    if (this.type === "DIAMOND") {
      // Draw diamond
      let brightness = 1 + p.sin(this.shimmer) * 0.2;
      p.fill(this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness);
      p.noStroke();
      p.beginShape();
      p.vertex(this.x, this.y - this.size);
      p.vertex(this.x + this.size * 0.7, this.y);
      p.vertex(this.x, this.y + this.size);
      p.vertex(this.x - this.size * 0.7, this.y);
      p.endShape(p.CLOSE);
      
      // Diamond shine
      p.fill(255, 255, 255, 150);
      p.circle(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3);
    } else if (this.type === "ROCK") {
      // Draw rock (irregular shape)
      p.fill(this.color[0], this.color[1], this.color[2]);
      p.noStroke();
      p.beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * p.TWO_PI;
        let r = this.size * (0.8 + p.sin(i * 2.3) * 0.2);
        p.vertex(this.x + p.cos(angle) * r, this.y + p.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
      
      // Rock texture
      p.fill(80, 80, 80);
      p.circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
      p.circle(this.x + this.size * 0.3, this.y + this.size * 0.1, this.size * 0.25);
    } else if (this.type === "MYSTERY") {
      // Draw mystery bag
      p.fill(this.color[0], this.color[1], this.color[2]);
      p.noStroke();
      p.ellipse(this.x, this.y, this.size * 1.5, this.size * 1.8);
      
      // Bag tie
      p.fill(100, 50, 150);
      p.rect(this.x - this.size * 0.3, this.y - this.size, this.size * 0.6, this.size * 0.4);
      
      // Question mark
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(this.size);
      p.text("?", this.x, this.y);
    } else {
      // Draw gold nugget
      let brightness = 1 + p.sin(this.shimmer) * 0.15;
      p.fill(this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness);
      p.noStroke();
      p.circle(this.x, this.y, this.size * 2);
      
      // Gold highlights
      p.fill(255, 255, 150, 180);
      p.circle(this.x - this.size * 0.4, this.y - this.size * 0.4, this.size * 0.6);
      p.circle(this.x + this.size * 0.3, this.y + this.size * 0.2, this.size * 0.4);
    }
    
    p.pop();
  }
}