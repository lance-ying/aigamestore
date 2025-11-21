import { CANVAS_WIDTH, CANVAS_HEIGHT, SPACE_TYPES } from './globals.js';

export class Board {
  constructor(totalSpaces) {
    this.totalSpaces = totalSpaces;
    this.spaces = this.generateSpaces();
    this.pathPoints = this.generatePath();
  }
  
  generateSpaces() {
    const spaces = [];
    
    // Start space
    spaces.push({ type: SPACE_TYPES.NORMAL, name: "Start" });
    
    // Generate path with variety
    for (let i = 1; i < this.totalSpaces - 1; i++) {
      let type = SPACE_TYPES.NORMAL;
      
      if (i === 5) type = SPACE_TYPES.EDUCATION;
      else if (i === 10) type = SPACE_TYPES.CAREER;
      else if (i === 15) type = SPACE_TYPES.INVESTMENT;
      else if (i === 20) type = SPACE_TYPES.PAYDAY;
      else if (i === 25) type = SPACE_TYPES.CAREER;
      else if (i === 30) type = SPACE_TYPES.INVESTMENT;
      else if (i % 7 === 0) type = SPACE_TYPES.EVENT;
      else if (i % 8 === 0) type = SPACE_TYPES.PAYDAY;
      
      spaces.push({ type, name: this.getSpaceName(type, i) });
    }
    
    // End space (Retirement)
    spaces.push({ type: SPACE_TYPES.RETIREMENT, name: "Retirement" });
    
    return spaces;
  }
  
  getSpaceName(type, index) {
    switch(type) {
      case SPACE_TYPES.CAREER: return "Career Choice";
      case SPACE_TYPES.EDUCATION: return "Education";
      case SPACE_TYPES.INVESTMENT: return "Investment";
      case SPACE_TYPES.EVENT: return "Life Event";
      case SPACE_TYPES.PAYDAY: return "Payday!";
      default: return `Space ${index}`;
    }
  }
  
  generatePath() {
    const points = [];
    const margin = 40;
    const horizontalSpacing = (CANVAS_WIDTH - margin * 2) / 8;
    
    let x = margin;
    let y = CANVAS_HEIGHT - margin - 20;
    let direction = 1; // 1 for right, -1 for left
    let row = 0;
    
    for (let i = 0; i < this.totalSpaces; i++) {
      points.push({ x, y });
      
      if ((i + 1) % 9 === 0 && i < this.totalSpaces - 1) {
        // Move up to next row
        y -= 60;
        row++;
        direction *= -1;
      } else if (i < this.totalSpaces - 1) {
        x += horizontalSpacing * direction;
      }
    }
    
    return points;
  }
  
  getPosition(spaceIndex) {
    if (spaceIndex < 0) spaceIndex = 0;
    if (spaceIndex >= this.pathPoints.length) spaceIndex = this.pathPoints.length - 1;
    return this.pathPoints[spaceIndex];
  }
  
  getSpace(index) {
    if (index < 0 || index >= this.spaces.length) return null;
    return this.spaces[index];
  }
  
  draw(p, currentSpace) {
    // Draw path connections
    p.stroke(100, 150, 200);
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let point of this.pathPoints) {
      p.vertex(point.x, point.y);
    }
    p.endShape();
    
    // Draw spaces
    for (let i = 0; i < this.pathPoints.length; i++) {
      const point = this.pathPoints[i];
      const space = this.spaces[i];
      
      p.push();
      
      // Space color based on type
      const colors = this.getSpaceColor(space.type);
      
      if (i === currentSpace) {
        p.fill(...colors, 255);
        p.stroke(255, 255, 0);
        p.strokeWeight(3);
      } else {
        p.fill(...colors, 200);
        p.stroke(255);
        p.strokeWeight(1);
      }
      
      // Draw space
      if (space.type === SPACE_TYPES.RETIREMENT) {
        p.rectMode(p.CENTER);
        p.rect(point.x, point.y, 24, 24, 4);
      } else {
        p.ellipse(point.x, point.y, 20, 20);
      }
      
      p.pop();
    }
  }
  
  getSpaceColor(type) {
    switch(type) {
      case SPACE_TYPES.CAREER: return [255, 180, 50];
      case SPACE_TYPES.EDUCATION: return [100, 150, 255];
      case SPACE_TYPES.INVESTMENT: return [100, 255, 100];
      case SPACE_TYPES.EVENT: return [255, 100, 150];
      case SPACE_TYPES.PAYDAY: return [255, 215, 0];
      case SPACE_TYPES.RETIREMENT: return [200, 100, 255];
      default: return [150, 150, 150];
    }
  }
}