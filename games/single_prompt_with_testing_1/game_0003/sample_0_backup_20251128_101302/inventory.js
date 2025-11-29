// inventory.js - Inventory item and management

export class InventoryItem {
  constructor(id, name, description, sprite) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.sprite = sprite;
    this.combinable = [];
  }
  
  render(p, x, y, size, selected) {
    p.push();
    p.fill(selected ? 100 : 60);
    p.stroke(selected ? 255 : 150);
    p.strokeWeight(selected ? 3 : 1);
    p.rect(x, y, size, size);
    
    // Render sprite function
    if (this.sprite) {
      this.sprite(p, x + size / 2, y + size / 2, size * 0.6);
    }
    
    p.pop();
  }
}

export function createInventoryItems() {
  return {
    newspaper: new InventoryItem(
      "newspaper",
      "Newspaper",
      "A newspaper with a mysterious article circled in red",
      (p, x, y, s) => {
        p.fill(240);
        p.rect(x - s / 2, y - s / 2, s, s * 0.7);
        p.fill(0);
        p.textSize(s * 0.15);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("NEWS", x, y - s * 0.2);
      }
    ),
    key: new InventoryItem(
      "key",
      "Rusty Key",
      "An old key that might open something important",
      (p, x, y, s) => {
        p.fill(180, 140, 60);
        p.circle(x - s * 0.2, y - s * 0.1, s * 0.3);
        p.rect(x - s * 0.05, y - s * 0.1, s * 0.5, s * 0.2);
        p.rect(x + s * 0.3, y - s * 0.15, s * 0.1, s * 0.1);
        p.rect(x + s * 0.3, y + s * 0.05, s * 0.1, s * 0.1);
      }
    ),
    photograph: new InventoryItem(
      "photograph",
      "Photograph",
      "A faded photograph of a mysterious location",
      (p, x, y, s) => {
        p.fill(200, 180, 160);
        p.rect(x - s / 2, y - s / 2, s, s * 0.8);
        p.fill(100, 100, 120);
        p.rect(x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.5);
      }
    ),
    map: new InventoryItem(
      "map",
      "Map Fragment",
      "Part of an old map with markings",
      (p, x, y, s) => {
        p.fill(220, 200, 150);
        p.beginShape();
        p.vertex(x - s / 2, y - s / 2);
        p.vertex(x + s / 2, y - s / 2);
        p.vertex(x + s / 2, y + s / 2);
        p.vertex(x - s * 0.2, y + s / 2);
        p.endShape(p.CLOSE);
        p.stroke(150, 50, 50);
        p.strokeWeight(2);
        p.line(x - s * 0.2, y - s * 0.1, x + s * 0.2, y + s * 0.1);
      }
    ),
    clue: new InventoryItem(
      "clue",
      "Combined Clue",
      "A vital piece of evidence combining the newspaper and photograph",
      (p, x, y, s) => {
        p.fill(255, 220, 100);
        p.star(x, y, s * 0.3, s * 0.5, 5);
      }
    ),
    masterkey: new InventoryItem(
      "masterkey",
      "Master Key",
      "A key that unlocks the final mystery",
      (p, x, y, s) => {
        p.fill(220, 180, 0);
        p.circle(x - s * 0.2, y - s * 0.1, s * 0.35);
        p.rect(x - s * 0.05, y - s * 0.1, s * 0.6, s * 0.25);
        p.fill(200, 160, 0);
        p.rect(x + s * 0.4, y - s * 0.2, s * 0.1, s * 0.15);
        p.rect(x + s * 0.4, y + 0, s * 0.1, s * 0.15);
      }
    )
  };
}

// Helper function to draw star
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    const angle = (2 * Math.PI) / npoints;
    const halfAngle = angle / 2;
    this.beginShape();
    for (let a = -Math.PI / 2; a < 2 * Math.PI - Math.PI / 2; a += angle) {
      let sx = x + Math.cos(a) * radius2;
      let sy = y + Math.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + Math.cos(a + halfAngle) * radius1;
      sy = y + Math.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}