// objects.js
import { ALIEN_WORDS } from './globals.js';

export class InteractiveObject {
  constructor(x, y, width, height, englishName, alienWord, description, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.englishName = englishName;
    this.alienWord = alienWord;
    this.description = description;
    this.p = p;
    this.discovered = false;
    this.highlightIntensity = 0;
  }
  
  draw(isSelected) {
    const p = this.p;
    
    // Highlight animation
    if (isSelected) {
      this.highlightIntensity = p.min(this.highlightIntensity + 0.1, 1);
    } else {
      this.highlightIntensity = p.max(this.highlightIntensity - 0.1, 0);
    }
    
    p.push();
    
    // Selection glow
    if (this.highlightIntensity > 0) {
      p.noFill();
      p.stroke(255, 255, 100, 150 * this.highlightIntensity);
      p.strokeWeight(3);
      p.rect(this.x - 5, this.y - 5, this.width + 10, this.height + 10, 5);
    }
    
    // Draw object based on type
    this.drawObject();
    
    // Show discovered indicator
    if (this.discovered) {
      p.fill(100, 255, 100);
      p.noStroke();
      p.circle(this.x + this.width - 8, this.y + 8, 12);
      p.fill(255);
      p.textSize(8);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("✓", this.x + this.width - 8, this.y + 8);
    }
    
    p.pop();
  }
  
  drawObject() {
    const p = this.p;
    // Override in subclasses
    p.fill(150);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
  }
}

export class Door extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 60, 100, "door", ALIEN_WORDS.door.alien, "A closed door", p);
  }
  
  drawObject() {
    const p = this.p;
    // Door frame
    p.fill(120, 80, 40);
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Door panels
    p.fill(140, 100, 50);
    p.rect(this.x + 5, this.y + 5, this.width - 10, this.height / 2 - 10, 3);
    p.rect(this.x + 5, this.y + this.height / 2 + 5, this.width - 10, this.height / 2 - 10, 3);
    
    // Doorknob
    p.fill(200, 180, 100);
    p.circle(this.x + this.width - 15, this.y + this.height / 2, 8);
  }
}

export class Window extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 80, 60, "window", ALIEN_WORDS.window.alien, "A window showing the outside", p);
  }
  
  drawObject() {
    const p = this.p;
    // Window frame
    p.fill(100, 80, 60);
    p.stroke(70, 50, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Glass panes (sky blue)
    p.fill(100, 150, 200, 180);
    p.noStroke();
    p.rect(this.x + 5, this.y + 5, this.width / 2 - 8, this.height / 2 - 8);
    p.rect(this.x + this.width / 2 + 3, this.y + 5, this.width / 2 - 8, this.height / 2 - 8);
    p.rect(this.x + 5, this.y + this.height / 2 + 3, this.width / 2 - 8, this.height / 2 - 8);
    p.rect(this.x + this.width / 2 + 3, this.y + this.height / 2 + 3, this.width / 2 - 8, this.height / 2 - 8);
    
    // Cross bars
    p.stroke(70, 50, 30);
    p.strokeWeight(3);
    p.line(this.x + this.width / 2, this.y + 5, this.x + this.width / 2, this.y + this.height - 5);
    p.line(this.x + 5, this.y + this.height / 2, this.x + this.width - 5, this.y + this.height / 2);
  }
}

export class Bed extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 100, 80, "bed", ALIEN_WORDS.bed.alien, "A simple bed", p);
  }
  
  drawObject() {
    const p = this.p;
    // Bed frame
    p.fill(80, 50, 30);
    p.stroke(50, 30, 10);
    p.strokeWeight(2);
    p.rect(this.x, this.y + 20, this.width, this.height - 20, 5);
    
    // Mattress
    p.fill(180, 160, 140);
    p.rect(this.x + 5, this.y + 15, this.width - 10, 40, 8);
    
    // Pillow
    p.fill(200, 180, 160);
    p.rect(this.x + 10, this.y + 20, 30, 20, 5);
    
    // Legs
    p.fill(60, 40, 20);
    p.rect(this.x + 5, this.y + this.height - 10, 8, 10);
    p.rect(this.x + this.width - 13, this.y + this.height - 10, 8, 10);
  }
}

export class Table extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 90, 70, "table", ALIEN_WORDS.table.alien, "A wooden table", p);
  }
  
  drawObject() {
    const p = this.p;
    // Table top
    p.fill(120, 80, 40);
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, 15, 3);
    
    // Table legs
    p.fill(100, 70, 35);
    p.rect(this.x + 10, this.y + 15, 10, this.height - 15);
    p.rect(this.x + this.width - 20, this.y + 15, 10, this.height - 15);
  }
}

export class FoodItem extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 40, 40, "food", ALIEN_WORDS.food.alien, "Some food on a plate", p);
  }
  
  drawObject() {
    const p = this.p;
    // Plate
    p.fill(220, 220, 220);
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height * 0.6);
    
    // Food
    p.fill(200, 150, 100);
    p.noStroke();
    p.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.6, this.height * 0.4);
    p.fill(150, 100, 50);
    p.ellipse(this.x + this.width / 2 - 8, this.y + this.height / 2, 12, 8);
    p.ellipse(this.x + this.width / 2 + 8, this.y + this.height / 2, 12, 8);
  }
}

export class WaterItem extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 30, 50, "water", ALIEN_WORDS.water.alien, "A glass of water", p);
  }
  
  drawObject() {
    const p = this.p;
    // Glass
    p.fill(200, 220, 240, 150);
    p.stroke(150, 170, 190);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(this.x + 8, this.y);
    p.vertex(this.x + this.width - 8, this.y);
    p.vertex(this.x + this.width - 5, this.y + this.height);
    p.vertex(this.x + 5, this.y + this.height);
    p.endShape(p.CLOSE);
    
    // Water
    p.fill(100, 150, 220, 180);
    p.noStroke();
    p.beginShape();
    p.vertex(this.x + 8, this.y + 15);
    p.vertex(this.x + this.width - 8, this.y + 15);
    p.vertex(this.x + this.width - 5, this.y + this.height);
    p.vertex(this.x + 5, this.y + this.height);
    p.endShape(p.CLOSE);
  }
}

export class Book extends InteractiveObject {
  constructor(x, y, p) {
    super(x, y, 50, 40, "book", ALIEN_WORDS.book.alien, "A mysterious book", p);
  }
  
  drawObject() {
    const p = this.p;
    // Book cover
    p.fill(150, 50, 50);
    p.stroke(100, 30, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 3);
    
    // Pages
    p.fill(240, 230, 210);
    p.noStroke();
    p.rect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
    
    // Lines on cover
    p.stroke(120, 70, 70);
    p.strokeWeight(2);
    p.line(this.x + 10, this.y + this.height / 2 - 5, this.x + this.width - 10, this.y + this.height / 2 - 5);
    p.line(this.x + 10, this.y + this.height / 2 + 5, this.x + this.width - 10, this.y + this.height / 2 + 5);
  }
}

export function createRoomObjects(p) {
  return [
    new Door(50, 150, p),
    new Window(480, 80, p),
    new Bed(400, 250, p),
    new Table(150, 280, p),
    new FoodItem(170, 250, p),
    new WaterItem(220, 260, p),
    new Book(180, 285, p)
  ];
}