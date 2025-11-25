// wall.js - Wall obstacle entity

export class Wall {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Wall with texture
    p.fill(60, 55, 50);
    p.stroke(40, 35, 30);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);

    // Add some visual texture
    p.noStroke();
    for (let i = 0; i < this.width; i += 20) {
      for (let j = 0; j < this.height; j += 20) {
        if ((i + j) % 40 === 0) {
          p.fill(50, 45, 40, 100);
          p.rect(screenX + i, screenY + j, 10, 10);
        }
      }
    }

    p.pop();
  }

  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}