// environment.js - Environment objects like water, trees, rocks

export class WaterArea {
  constructor(x, y, width, height) {
    this.type = 'water';
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(p) {
    // Animated water
    p.push();
    p.noStroke();
    
    // Base water
    p.fill(80, 140, 200, 200);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Water shimmer effect
    for (let i = 0; i < 3; i++) {
      const offsetX = p.sin(p.frameCount * 0.02 + i * 2) * 10;
      const offsetY = p.cos(p.frameCount * 0.03 + i * 1.5) * 5;
      p.fill(120, 180, 220, 80);
      p.ellipse(
        this.x + this.width * 0.3 + offsetX + i * 30,
        this.y + this.height * 0.4 + offsetY + i * 20,
        40 + i * 10,
        30 + i * 8
      );
    }
    
    p.pop();
  }
}

export class Tree {
  constructor(x, y) {
    this.type = 'tree';
    this.x = x;
    this.y = y;
    this.trunkWidth = 15;
    this.trunkHeight = 40;
    this.crownRadius = 30;
  }

  draw(p) {
    p.push();
    
    // Trunk
    p.fill(100, 70, 40);
    p.stroke(80, 50, 30);
    p.strokeWeight(2);
    p.rect(this.x - this.trunkWidth / 2, this.y - this.trunkHeight, this.trunkWidth, this.trunkHeight);
    
    // Crown (foliage)
    p.fill(60, 140, 60);
    p.stroke(50, 120, 50);
    p.ellipse(this.x, this.y - this.trunkHeight, this.crownRadius * 2, this.crownRadius * 1.8);
    
    // Highlights
    p.fill(80, 160, 80, 150);
    p.noStroke();
    p.ellipse(this.x - 8, this.y - this.trunkHeight - 5, this.crownRadius, this.crownRadius * 0.8);
    
    p.pop();
  }
}

export class Rock {
  constructor(x, y, size) {
    this.type = 'rock';
    this.x = x;
    this.y = y;
    this.size = size;
  }

  draw(p) {
    p.push();
    
    // Rock
    p.fill(120, 120, 130);
    p.stroke(90, 90, 100);
    p.strokeWeight(2);
    
    // Draw irregular rock shape
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI;
      const radius = this.size * (0.8 + p.sin(i * 2.3) * 0.2);
      const x = this.x + p.cos(angle) * radius;
      const y = this.y + p.sin(angle) * radius * 0.8;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Highlight
    p.fill(150, 150, 160, 100);
    p.noStroke();
    p.ellipse(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.5, this.size * 0.4);
    
    p.pop();
  }
}