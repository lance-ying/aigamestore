export class InteractableObject {
  constructor(x, y, width, height, energyCost, description) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.energyCost = energyCost;
    this.description = description;
    this.glowPhase = 0;
    this.active = true;
  }
  
  update() {
    if (this.active) {
      this.glowPhase += 0.05;
    }
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    // Glow effect
    const glowAlpha = p.map(Math.sin(this.glowPhase), -1, 1, 100, 200);
    p.fill(255, 220, 100, glowAlpha);
    p.noStroke();
    p.rect(this.x - 5, this.y - 5, this.width + 10, this.height + 10, 5);
    
    // Object
    p.fill(150, 100, 50);
    p.stroke(80, 50, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 3);
    p.pop();
  }
  
  checkHover(mouseX, mouseY) {
    return mouseX > this.x && mouseX < this.x + this.width &&
           mouseY > this.y && mouseY < this.y + this.height;
  }
  
  interact() {
    return this.energyCost;
  }
}