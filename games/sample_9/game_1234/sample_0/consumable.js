// consumable.js - Consumable objects (cars, buildings)

export const OBJECT_TYPES = {
  CAR: { 
    name: 'CAR', 
    minSize: 8, 
    maxSize: 12, 
    score: 10,
    colors: [[200, 50, 50], [50, 100, 200], [50, 200, 50], [150, 150, 150]]
  },
  SMALL_BUILDING: { 
    name: 'SMALL_BUILDING', 
    minSize: 15, 
    maxSize: 25, 
    score: 50,
    colors: [[180, 160, 140], [160, 160, 160]]
  },
  MEDIUM_BUILDING: { 
    name: 'MEDIUM_BUILDING', 
    minSize: 30, 
    maxSize: 40, 
    score: 100,
    colors: [[140, 130, 120], [130, 130, 130]]
  },
  LARGE_BUILDING: { 
    name: 'LARGE_BUILDING', 
    minSize: 50, 
    maxSize: 75, 
    score: 250,
    colors: [[100, 90, 80], [90, 90, 90]]
  }
};

export class ConsumableObject {
  constructor(x, y, type, size, colorIndex) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.colorIndex = colorIndex;
    this.consumed = false;
    this.fadeAlpha = 255;
  }
  
  startConsume() {
    this.consumed = true;
  }
  
  updateFade(p) {
    if (this.consumed) {
      this.fadeAlpha -= 15;
      this.size *= 0.9;
      return this.fadeAlpha <= 0;
    }
    return false;
  }
  
  render(p) {
    if (this.fadeAlpha <= 0) return;
    
    p.push();
    const typeData = OBJECT_TYPES[this.type];
    const color = typeData.colors[this.colorIndex];
    
    if (this.type === 'CAR') {
      p.fill(...color, this.fadeAlpha);
      p.stroke(0, this.fadeAlpha);
      p.strokeWeight(1);
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.size * 2, this.size);
    } else {
      // Buildings
      p.fill(...color, this.fadeAlpha);
      p.stroke(0, this.fadeAlpha);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.size * 1.5, this.size * 1.5);
      
      // Windows
      p.fill(40, 40, 50, this.fadeAlpha * 0.8);
      p.noStroke();
      const windowSize = this.size / 6;
      const spacing = this.size / 3;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          p.rect(this.x + i * spacing, this.y + j * spacing, windowSize, windowSize);
        }
      }
    }
    
    p.pop();
  }
}