// entities.js - Entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHAR_ABI, CHAR_DD } from './globals.js';

export class Character {
  constructor(x, y, type, p) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.p = p;
    this.width = type === CHAR_ABI ? 20 : 35;
    this.height = type === CHAR_ABI ? 25 : 40;
    this.speed = type === CHAR_ABI ? 3 : 2;
    this.sprintMultiplier = 1.5;
    this.color = type === CHAR_ABI ? [100, 200, 255] : [200, 100, 50];
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
  }
  
  move(dx, dy, sprint = false) {
    const speed = sprint ? this.speed * this.sprintMultiplier : this.speed;
    this.x += dx * speed;
    this.y += dy * speed;
    
    if (dx !== 0) {
      this.facing = dx > 0 ? 1 : -1;
      this.animFrame = (this.animFrame + 0.2) % 4;
    }
  }
  
  canFit(width, height) {
    return this.width <= width && this.height <= height;
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX, screenY + this.height/2 + 5, this.width * 0.8, 8);
    
    // Body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 4);
    
    // Eyes
    p.fill(255);
    const eyeOffset = this.width * 0.2;
    const eyeY = screenY - this.height * 0.15;
    p.ellipse(screenX - eyeOffset * 0.5 + this.facing * 2, eyeY, 6, 6);
    p.ellipse(screenX + eyeOffset * 0.5 + this.facing * 2, eyeY, 6, 6);
    
    // Pupils
    p.fill(0);
    p.ellipse(screenX - eyeOffset * 0.5 + this.facing * 3, eyeY, 3, 3);
    p.ellipse(screenX + eyeOffset * 0.5 + this.facing * 3, eyeY, 3, 3);
    
    // Mouth/detail
    p.noFill();
    p.stroke(...this.color.map(c => Math.max(0, c - 50)));
    p.strokeWeight(1);
    p.arc(screenX, screenY + this.height * 0.1, this.width * 0.4, this.height * 0.3, 0, p.PI);
    
    // Legs (animated)
    if (this.type === CHAR_ABI) {
      const legW = 4;
      const legH = 8;
      const legOffset = Math.sin(this.animFrame) * 3;
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(screenX - 6, screenY + this.height/2 + legH/2 + legOffset, legW, legH);
      p.rect(screenX + 6, screenY + this.height/2 + legH/2 - legOffset, legW, legH);
    } else {
      // DD has treads
      p.fill(50);
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(screenX, screenY + this.height/2 + 6, this.width * 0.8, 8, 2);
    }
    
    // Name tag
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(this.type, screenX, screenY - this.height/2 - 8);
    
    p.pop();
  }
}

export class Wall {
  constructor(x, y, width, height, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.p = p;
  }
  
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Wall body
    p.fill(60, 65, 80);
    p.stroke(40, 45, 60);
    p.strokeWeight(2);
    p.rectMode(p.CORNER);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Add texture lines for detail
    p.stroke(80, 85, 100, 100);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(screenX + i, screenY, screenX + i, screenY + this.height);
    }
    for (let i = 0; i < this.height; i += 20) {
      p.line(screenX, screenY + i, screenX + this.width, screenY + i);
    }
    
    p.pop();
  }
}

export class Switch {
  constructor(x, y, id, p) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.p = p;
    this.active = false;
    this.width = 30;
    this.height = 40;
  }
  
  toggle() {
    this.active = !this.active;
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Base
    p.fill(80);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 4);
    
    // Switch indicator
    const indicatorY = this.active ? screenY - 8 : screenY + 8;
    p.fill(...(this.active ? [100, 255, 100] : [255, 100, 100]));
    p.circle(screenX, indicatorY, 15);
    
    // Glow when active
    if (this.active) {
      p.noFill();
      p.stroke(100, 255, 100, 100);
      p.strokeWeight(3);
      p.circle(screenX, indicatorY, 20);
    }
    
    p.pop();
  }
}

export class Crate {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
    this.width = 40;
    this.height = 40;
    this.movable = true;
  }
  
  move(dx, dy) {
    if (this.movable) {
      this.x += dx;
      this.y += dy;
    }
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX, screenY + this.height/2 + 5, this.width * 0.9, 10);
    
    // Crate body
    p.fill(139, 90, 43);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 2);
    
    // Wood texture lines
    p.stroke(100, 60, 30);
    p.strokeWeight(1);
    for (let i = -1; i <= 1; i++) {
      p.line(screenX - this.width/2, screenY + i * 10, screenX + this.width/2, screenY + i * 10);
    }
    
    // Cross braces
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.line(screenX - this.width/2 + 5, screenY - this.height/2 + 5, 
           screenX + this.width/2 - 5, screenY + this.height/2 - 5);
    p.line(screenX + this.width/2 - 5, screenY - this.height/2 + 5,
           screenX - this.width/2 + 5, screenY + this.height/2 - 5);
    
    p.pop();
  }
}

export class Door {
  constructor(x, y, width, height, requiredSwitches, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.requiredSwitches = requiredSwitches; // Array of switch IDs
    this.p = p;
    this.open = false;
    this.openProgress = 0;
  }
  
  update(switches) {
    // Check if all required switches are active
    const shouldBeOpen = this.requiredSwitches.every(id => {
      const sw = switches.find(s => s.id === id);
      return sw && sw.active;
    });
    
    if (shouldBeOpen && !this.open) {
      this.open = true;
    }
    
    // Animate opening
    if (this.open && this.openProgress < 1) {
      this.openProgress = Math.min(1, this.openProgress + 0.05);
    }
  }
  
  getBounds() {
    if (this.open && this.openProgress >= 0.9) {
      return null; // No collision when fully open
    }
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    const doorOffset = this.openProgress * this.height * 0.9;
    
    // Door frame
    p.fill(60);
    p.stroke(0);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width + 10, this.height + 10, 4);
    
    // Door itself (slides up)
    if (this.openProgress < 0.95) {
      p.fill(...(this.open ? [100, 255, 150] : [150, 150, 150]));
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(screenX, screenY + doorOffset, this.width, this.height * (1 - this.openProgress), 2);
      
      // Door detail lines
      p.stroke(100);
      p.strokeWeight(1);
      const lines = 3;
      for (let i = 1; i < lines; i++) {
        const lineY = screenY - this.height/2 + (this.height / lines) * i + doorOffset;
        p.line(screenX - this.width/2 + 5, lineY, screenX + this.width/2 - 5, lineY);
      }
    }
    
    p.pop();
  }
}

export class TightSpace {
  constructor(x, y, width, height, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.p = p;
  }
  
  canEnter(character) {
    return character.canFit(this.width, this.height);
  }
  
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Tight space visualization
    p.fill(50, 50, 80, 150);
    p.stroke(100, 100, 150);
    p.strokeWeight(2);
    p.rectMode(p.CORNER);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Diagonal lines to show it's a special area
    p.stroke(80, 80, 120);
    p.strokeWeight(1);
    for (let i = 0; i < this.width + this.height; i += 15) {
      p.line(screenX + i, screenY, screenX, screenY + i);
    }
    
    p.pop();
  }
}

export class Terminal {
  constructor(x, y, chapterId, message, p) {
    this.x = x;
    this.y = y;
    this.chapterId = chapterId;
    this.message = message;
    this.p = p;
    this.width = 35;
    this.height = 45;
    this.activated = false;
  }
  
  activate() {
    this.activated = true;
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Terminal body
    p.fill(40, 40, 60);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 3);
    
    // Screen
    const screenColor = this.activated ? [100, 255, 150] : [50, 150, 200];
    p.fill(...screenColor);
    p.noStroke();
    p.rect(screenX, screenY - 5, this.width - 8, this.height - 15, 2);
    
    // Screen lines
    p.stroke(...screenColor.map(c => Math.min(255, c + 50)));
    p.strokeWeight(1);
    for (let i = 0; i < 4; i++) {
      p.line(screenX - this.width/2 + 6, screenY - 15 + i * 5,
             screenX + this.width/2 - 6, screenY - 15 + i * 5);
    }
    
    // Glow effect when activated
    if (this.activated) {
      p.noFill();
      p.stroke(100, 255, 150, 100);
      p.strokeWeight(3);
      p.rect(screenX, screenY, this.width + 5, this.height + 5, 3);
    }
    
    p.pop();
  }
}