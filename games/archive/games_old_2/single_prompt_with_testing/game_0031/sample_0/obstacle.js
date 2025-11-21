// obstacle.js - Static obstacles in the city
export class Obstacle {
  constructor(p, x, y, width, height, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'building', 'tree', 'car'
  }

  draw(p) {
    p.push();
    
    if (this.type === 'building') {
      p.fill(120, 120, 140);
      p.stroke(80);
      p.strokeWeight(2);
      p.rect(this.x, this.y, this.width, this.height);
      
      // Windows
      p.fill(200, 200, 100, 100);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          p.rect(this.x + 5 + i * 15, this.y + 5 + j * 15, 10, 10);
        }
      }
    } else if (this.type === 'tree') {
      // Tree trunk
      p.fill(101, 67, 33);
      p.noStroke();
      p.rect(this.x + this.width / 2 - 3, this.y + this.height / 2, 6, 15);
      
      // Tree foliage
      p.fill(34, 139, 34);
      p.circle(this.x + this.width / 2, this.y + this.height / 2 - 5, 25);
    } else if (this.type === 'car') {
      p.fill(200, 50, 50);
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(this.x, this.y, this.width, this.height, 2);
      
      // Windows
      p.fill(150, 200, 255, 150);
      p.noStroke();
      p.rect(this.x + 5, this.y + 3, 8, 6);
    }
    
    p.pop();
  }

  checkCollision(busCorners) {
    // Simple AABB collision with bus corners
    for (let corner of busCorners) {
      if (corner.x > this.x && corner.x < this.x + this.width &&
          corner.y > this.y && corner.y < this.y + this.height) {
        return true;
      }
    }
    return false;
  }
}