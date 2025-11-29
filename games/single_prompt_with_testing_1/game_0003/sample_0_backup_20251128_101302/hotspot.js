// hotspot.js - Interactive hotspot implementation

export class Hotspot {
  constructor(x, y, width, height, type, id, data = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // "examine", "pickup", "use", "talk", "exit"
    this.id = id;
    this.data = data;
    this.active = true;
    this.examined = false;
    this.pickedUp = false;
  }
  
  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
  
  isPlayerNear(player) {
    const centerX = this.x + this.width / 2;
    const distance = Math.abs(player.x - centerX);
    return distance < 40;
  }
  
  render(p, highlighted) {
    if (!this.active) return;
    
    p.push();
    p.noFill();
    p.strokeWeight(2);
    p.stroke(...(highlighted ? [255, 255, 0, 150] : [255, 255, 255, 50]));
    p.rect(this.x, this.y, this.width, this.height);
    
    if (highlighted) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(12);
      p.text(this.data.name || this.id, this.x + this.width / 2, this.y - 5);
    }
    
    p.pop();
  }
}