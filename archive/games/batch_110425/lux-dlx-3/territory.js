// territory.js
import { PLAYER_COLORS } from './globals.js';

export class Territory {
  constructor(id, name, x, y, neighbors) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.neighbors = neighbors;
    this.owner = null;
    this.armies = 0;
    this.radius = 25;
  }

  draw(p, isSelected, isHovered, isAttacking) {
    p.push();
    
    // Draw territory circle
    if (isSelected) {
      p.strokeWeight(4);
      p.stroke(255, 255, 0);
    } else if (isHovered) {
      p.strokeWeight(3);
      p.stroke(255, 255, 255);
    } else if (isAttacking) {
      p.strokeWeight(3);
      p.stroke(255, 150, 0);
    } else {
      p.strokeWeight(2);
      p.stroke(50);
    }
    
    if (this.owner) {
      p.fill(...this.owner.color, 200);
    } else {
      p.fill(150, 150, 150);
    }
    
    p.circle(this.x, this.y, this.radius * 2);
    
    // Draw army count
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.armies, this.x, this.y);
    
    // Draw territory name
    p.textSize(10);
    p.fill(255);
    p.text(this.name, this.x, this.y + this.radius + 12);
    
    p.pop();
  }

  drawConnections(p, territories) {
    p.push();
    p.stroke(80, 80, 80, 100);
    p.strokeWeight(1);
    
    for (const neighborId of this.neighbors) {
      const neighbor = territories.find(t => t.id === neighborId);
      if (neighbor) {
        p.line(this.x, this.y, neighbor.x, neighbor.y);
      }
    }
    p.pop();
  }

  isAdjacentTo(territoryId) {
    return this.neighbors.includes(territoryId);
  }

  canAttack(targetTerritory) {
    return this.armies >= 3 && 
           this.isAdjacentTo(targetTerritory.id) && 
           targetTerritory.owner !== this.owner;
  }
}

export class Player {
  constructor(id, name, color, isAI = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isAI = isAI;
    this.cards = 0;
    this.territoriesOwned = 0;
  }

  calculateReinforcements(territories) {
    const ownedTerritories = territories.filter(t => t.owner === this);
    this.territoriesOwned = ownedTerritories.length;
    
    // Base reinforcements: territories / 3 (minimum 3)
    let reinforcements = Math.max(3, Math.floor(this.territoriesOwned / 3));
    
    return reinforcements;
  }
}