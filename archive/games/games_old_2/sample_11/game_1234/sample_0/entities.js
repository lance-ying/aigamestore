// entities.js - Game entities
import { ICON_TYPES, ICON_COLORS } from './globals.js';

export class Beatboxer {
  constructor(x, y, id, p) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.p = p;
    this.assignedIconId = null;
    this.isMuted = false;
    this.size = 60;
    this.animationPhase = 0;
    this.isPlaying = false;
  }

  update() {
    if (this.assignedIconId !== null && !this.isMuted) {
      this.isPlaying = true;
      this.animationPhase += 0.1;
    } else {
      this.isPlaying = false;
      this.animationPhase = 0;
    }
  }

  draw(isFocused) {
    const p = this.p;
    p.push();
    
    // Draw glow if focused
    if (isFocused) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.ellipse(this.x, this.y, this.size + 10);
    }
    
    // Draw body
    const bodyColor = this.isMuted ? [100, 100, 100] : [150, 200, 255];
    p.fill(...bodyColor);
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size);
    
    // Draw face
    if (this.isPlaying) {
      const offset = Math.sin(this.animationPhase) * 3;
      // Animated mouth
      p.fill(50);
      p.ellipse(this.x, this.y + 10 + offset, 20, 10 + offset);
      
      // Eyes
      p.fill(50);
      p.ellipse(this.x - 10, this.y - 5, 6, 8);
      p.ellipse(this.x + 10, this.y - 5, 6, 8);
    } else {
      // Static face
      p.fill(50);
      p.ellipse(this.x - 10, this.y - 5, 6, 6);
      p.ellipse(this.x + 10, this.y - 5, 6, 6);
      p.ellipse(this.x, this.y + 10, 15, 5);
    }
    
    // Draw mute indicator
    if (this.isMuted) {
      p.stroke(255, 0, 0);
      p.strokeWeight(3);
      p.noFill();
      p.ellipse(this.x, this.y, this.size - 5);
      p.line(this.x - 20, this.y - 20, this.x + 20, this.y + 20);
    }
    
    // Draw assigned icon indicator
    if (this.assignedIconId !== null) {
      const iconType = ICON_TYPES[this.assignedIconId % ICON_TYPES.length];
      const color = ICON_COLORS[iconType];
      p.fill(...color);
      p.noStroke();
      p.ellipse(this.x, this.y - this.size / 2 - 5, 12);
    }
    
    p.pop();
  }

  assignIcon(iconId) {
    this.assignedIconId = iconId;
    this.isMuted = false;
  }

  removeIcon() {
    this.assignedIconId = null;
  }

  toggleMute() {
    if (this.assignedIconId !== null) {
      this.isMuted = !this.isMuted;
      return true;
    }
    return false;
  }

  contains(x, y) {
    const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    return dist <= this.size / 2;
  }
}

export class MusicalIcon {
  constructor(id, type, x, y, p) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.p = p;
    this.size = 40;
  }

  draw(isFocused) {
    const p = this.p;
    p.push();
    
    // Draw highlight if focused
    if (isFocused) {
      p.fill(255, 255, 0, 150);
      p.noStroke();
      p.rect(this.x - this.size / 2 - 3, this.y - this.size / 2 - 3, 
             this.size + 6, this.size + 6, 5);
    }
    
    // Draw icon background
    const color = ICON_COLORS[this.type];
    p.fill(...color);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, 5);
    
    // Draw icon symbol
    p.fill(50);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    
    switch (this.type) {
      case 'beat':
        p.text('♪', this.x, this.y);
        break;
      case 'effect':
        p.text('◉', this.x, this.y);
        break;
      case 'melody':
        p.text('♫', this.x, this.y);
        break;
      case 'voice':
        p.text('♬', this.x, this.y);
        break;
    }
    
    p.pop();
  }

  contains(x, y) {
    return x >= this.x - this.size / 2 && x <= this.x + this.size / 2 &&
           y >= this.y - this.size / 2 && y <= this.y + this.size / 2;
  }
}