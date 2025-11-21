// platform.js - Static platforms
export class Platform {
  constructor(x, y, width, height, color = [80, 80, 80]) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(...this.color);
    p.stroke(60, 60, 60);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);
    p.pop();
  }
}