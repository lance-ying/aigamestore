export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 80;
  }

  render(p) {
    p.push();
    // Head
    p.fill(220, 180, 140);
    p.ellipse(this.x, this.y - 30, 30, 30);
    
    // Body
    p.fill(60, 60, 80);
    p.rect(this.x - 15, this.y - 10, 30, 40);
    
    // Arms
    p.fill(220, 180, 140);
    p.rect(this.x - 25, this.y - 5, 10, 30);
    p.rect(this.x + 15, this.y - 5, 10, 30);
    
    // Legs
    p.fill(40, 40, 60);
    p.rect(this.x - 15, this.y + 30, 12, 35);
    p.rect(this.x + 3, this.y + 30, 12, 35);
    
    // Boots
    p.fill(50, 30, 20);
    p.rect(this.x - 17, this.y + 62, 15, 8);
    p.rect(this.x + 2, this.y + 62, 15, 8);
    
    p.pop();
  }

  update() {
    // Player doesn't move in this game style
  }
}