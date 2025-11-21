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
    this.flashIntensity = 0;
    this.pulseAnimation = 0;
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
    this.triggerFlash([100, 255, 100]);
  }

  removeArmies(count) {
    this.armies = Math.max(0, this.armies - count);
    if (count > 0) {
      this.triggerFlash([255, 100, 100]);
    }
  }

  changeOwner(newOwnerId, armyCount) {
    this.ownerId = newOwnerId;
    this.armies = armyCount;
    this.triggerFlash([255, 255, 100], 60);
  }

  triggerFlash(color = [255, 255, 255], duration = 30) {
    gameState.territoryFlashes.push({
      territoryId: this.id,
      color: color,
      intensity: 1.0,
      duration: duration,
      frame: 0
    });
  }

  containsPoint(p, x, y) {
    return p.collidePointPoly(x, y, this.coords);
  }

  draw(p, isSelected1, isSelected2, isValidTarget, isHighlighted) {
    p.push();
    
    const player = gameState.players.find(pl => pl.id === this.ownerId);
    const baseColor = player ? player.color : [150, 150, 150];
    
    // Apply flash effect if active
    let fillColor = [...baseColor];
    const flash = gameState.territoryFlashes.find(f => f.territoryId === this.id && f.frame < f.duration);
    if (flash) {
      const t = flash.intensity * (1 - flash.frame / flash.duration);
      fillColor[0] = p.lerp(baseColor[0], flash.color[0], t);
      fillColor[1] = p.lerp(baseColor[1], flash.color[1], t);
      fillColor[2] = p.lerp(baseColor[2], flash.color[2], t);
      flash.frame++;
    }
    
    // Pulse effect for highlighted territory
    if (isHighlighted) {
      this.pulseAnimation += 0.1;
      const pulse = Math.sin(this.pulseAnimation) * 0.15 + 1;
      fillColor[0] *= pulse;
      fillColor[1] *= pulse;
      fillColor[2] *= pulse;
    }
    
    p.fill(...fillColor);
    
    if (isSelected1) {
      p.strokeWeight(5);
      p.stroke(255, 255, 0);
    } else if (isSelected2 || isValidTarget) {
      p.strokeWeight(4);
      p.stroke(255, 165, 0);
    } else if (isHighlighted) {
      p.strokeWeight(3);
      p.stroke(255, 255, 255);
    } else {
      p.strokeWeight(1);
      p.stroke(80, 80, 80);
    }
    
    p.beginShape();
    for (let coord of this.coords) {
      p.vertex(coord[0], coord[1]);
    }
    p.endShape(p.CLOSE);
    
    // Draw army count with glow effect for selected territories
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    
    if (isSelected1 || isSelected2) {
      p.textSize(20);
      p.fill(255, 255, 100);
      p.text(this.armies, this.centerPos.x, this.centerPos.y);
    } else {
      p.textSize(16);
      p.text(this.armies, this.centerPos.x, this.centerPos.y);
    }
    
    p.pop();
  }
}