// interactable.js
export class Interactable {
  constructor(id, x, y, width, height, type, name, description) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // "item", "door", "window", "furniture", "useable"
    this.name = name;
    this.description = description;
    this.visible = true;
    this.collected = false;
    this.secured = false;
    this.room = null;
  }

  isNear(playerX, playerY, distance = 50) {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }

  render(p) {
    if (!this.visible || this.collected) return;

    p.push();
    
    switch (this.type) {
      case "item":
        this.renderItem(p);
        break;
      case "door":
        this.renderDoor(p);
        break;
      case "window":
        this.renderWindow(p);
        break;
      case "furniture":
        this.renderFurniture(p);
        break;
      case "useable":
        this.renderUseable(p);
        break;
    }
    
    p.pop();
  }

  renderItem(p) {
    // Generic item rendering
    p.fill(220, 200, 100);
    p.stroke(180, 160, 60);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Item name
    p.fill(0);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.name.substring(0, 1).toUpperCase(), this.x, this.y);
  }

  renderDoor(p) {
    const color = this.secured ? [100, 200, 100] : [139, 90, 60];
    p.fill(...color);
    p.stroke(80, 50, 30);
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Door handle
    p.fill(200, 180, 100);
    p.ellipse(this.x + this.width / 2 - 10, this.y, 6, 6);
    
    if (this.secured) {
      // X marks secured
      p.stroke(50, 150, 50);
      p.strokeWeight(4);
      p.line(this.x - 15, this.y - 15, this.x + 15, this.y + 15);
      p.line(this.x + 15, this.y - 15, this.x - 15, this.y + 15);
    }
  }

  renderWindow(p) {
    const color = this.secured ? [100, 200, 100] : [180, 220, 255];
    p.fill(...color);
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Window panes
    p.line(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
    p.line(this.x - this.width / 2, this.y, this.x + this.width / 2, this.y);
    
    if (this.secured) {
      // Boards
      p.stroke(139, 90, 60);
      p.strokeWeight(8);
      p.line(this.x - this.width / 2 - 5, this.y - this.height / 2, 
             this.x + this.width / 2 + 5, this.y + this.height / 2);
      p.line(this.x + this.width / 2 + 5, this.y - this.height / 2, 
             this.x - this.width / 2 - 5, this.y + this.height / 2);
    }
  }

  renderFurniture(p) {
    p.fill(100, 70, 50);
    p.stroke(60, 40, 30);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
  }

  renderUseable(p) {
    p.fill(180, 140, 100);
    p.stroke(140, 100, 60);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    p.fill(0);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.name.substring(0, 2).toUpperCase(), this.x, this.y);
  }
}