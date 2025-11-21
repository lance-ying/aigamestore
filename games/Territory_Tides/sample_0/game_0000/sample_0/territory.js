import { gameState } from './globals.js';

export class Territory {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.coords = data.coords;
    this.adjacentIds = data.adjacentIds;
    this.ownerId = data.ownerId;
    this.armies = data.armies;
    this.centerPos = this.calculateCenter();
  }

  calculateCenter() {
    let sumX = 0;
    let sumY = 0;
    for (let coord of this.coords) {
      sumX += coord[0];
      sumY += coord[1];
    }
    return {
      x: sumX / this.coords.length,
      y: sumY / this.coords.length
    };
  }

  isAdjacentTo(otherId) {
    return this.adjacentIds.includes(otherId);
  }

  addArmies(count) {
    this.armies += count;
  }

  removeArmies(count) {
    this.armies = Math.max(0, this.armies - count);
  }

  changeOwner(newOwnerId, armyCount) {
    this.ownerId = newOwnerId;
    this.armies = armyCount;
  }

  containsPoint(p, x, y) {
    return p.collidePointPoly(x, y, this.coords);
  }

  draw(p, isSelected1, isSelected2, isValidTarget) {
    p.push();
    
    const player = gameState.players.find(pl => pl.id === this.ownerId);
    const fillColor = player ? player.color : [150, 150, 150];
    p.fill(...fillColor);
    
    if (isSelected1) {
      p.strokeWeight(4);
      p.stroke(255, 255, 0);
    } else if (isSelected2 || isValidTarget) {
      p.strokeWeight(4);
      p.stroke(255, 165, 0);
    } else {
      p.strokeWeight(1);
      p.stroke(80, 80, 80);
    }
    
    p.beginShape();
    for (let coord of this.coords) {
      p.vertex(coord[0], coord[1]);
    }
    p.endShape(p.CLOSE);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(this.armies, this.centerPos.x, this.centerPos.y);
    
    p.pop();
  }
}