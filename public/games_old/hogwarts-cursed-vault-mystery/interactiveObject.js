export class InteractiveObject {
  constructor(x, y, energyCost, type, year) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.energyCost = energyCost;
    this.type = type;
    this.year = year;
    this.completed = false;
    this.glowPhase = 0;
  }
  
  update(p) {
    if (!this.completed) {
      this.glowPhase += 0.05;
    }
  }
  
  render(p) {
    if (this.completed) return;
    
    p.push();
    const glowAlpha = 150 + Math.sin(this.glowPhase) * 100;
    p.fill(255, 220, 100, glowAlpha);
    p.noStroke();
    p.ellipse(this.x, this.y, this.width + 10, this.height + 10);
    
    if (this.type === 'book') {
      p.fill(139, 69, 19);
      p.rect(this.x - 15, this.y - 20, 30, 40);
      p.fill(255, 220, 150);
      p.rect(this.x - 12, this.y - 17, 24, 34);
    } else if (this.type === 'potion') {
      p.fill(100, 200, 255);
      p.ellipse(this.x, this.y + 10, 20, 25);
      p.fill(150, 220, 255);
      p.triangle(this.x - 10, this.y + 10, this.x + 10, this.y + 10, this.x, this.y - 15);
    } else if (this.type === 'wand') {
      p.fill(139, 90, 43);
      p.push();
      p.translate(this.x, this.y);
      p.rotate(p.PI / 4);
      p.rect(-3, -20, 6, 40);
      p.pop();
    } else {
      p.fill(200, 200, 200);
      p.ellipse(this.x, this.y, this.width, this.height);
    }
    p.pop();
  }
  
  isClicked(mx, my, p) {
    return p.dist(mx, my, this.x, this.y) < this.width / 2 + 10;
  }
}