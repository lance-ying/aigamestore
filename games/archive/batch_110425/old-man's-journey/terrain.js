// terrain.js - Terrain layer management

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_HEIGHT } from './globals.js';

export class TerrainLayer {
  constructor(p, points, baseY, color, canMove = true) {
    this.p = p;
    this.originalPoints = [...points];
    this.points = [...points];
    this.baseY = baseY;
    this.currentOffsetY = 0;
    this.targetOffsetY = 0;
    this.color = color;
    this.canMove = canMove;
    this.isSelected = false;
    
    // Create visual representation only - no physics bodies for terrain
    this.smoothedPoints = this.smoothPoints(points, baseY);
  }
  
  smoothPoints(points, yOffset) {
    const smoothed = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Add interpolated points for smooth curves
      const steps = 10;
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        smoothed.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: yOffset + p1.y + (p2.y - p1.y) * t
        });
      }
    }
    
    // Add last point
    const last = points[points.length - 1];
    smoothed.push({ x: last.x, y: yOffset + last.y });
    
    return smoothed;
  }
  
  adjustHeight(delta) {
    if (!this.canMove) return;
    
    this.targetOffsetY = this.p.constrain(
      this.targetOffsetY + delta,
      -80,
      80
    );
  }
  
  update() {
    // Smooth interpolation to target offset
    const lerpSpeed = 0.15;
    this.currentOffsetY = this.p.lerp(
      this.currentOffsetY,
      this.targetOffsetY,
      lerpSpeed
    );
    
    // Update smoothed points
    this.smoothedPoints = this.smoothPoints(
      this.originalPoints,
      this.baseY + this.currentOffsetY
    );
  }
  
  render(cameraX = 0) {
    this.p.push();
    
    // Draw terrain fill
    this.p.fill(this.color[0], this.color[1], this.color[2], 200);
    this.p.noStroke();
    
    this.p.beginShape();
    for (let point of this.smoothedPoints) {
      this.p.vertex(point.x - cameraX, point.y);
    }
    this.p.vertex(this.smoothedPoints[this.smoothedPoints.length - 1].x - cameraX, CANVAS_HEIGHT);
    this.p.vertex(this.smoothedPoints[0].x - cameraX, CANVAS_HEIGHT);
    this.p.endShape(this.p.CLOSE);
    
    // Draw outline
    if (this.isSelected) {
      this.p.stroke(255, 255, 100);
      this.p.strokeWeight(3);
    } else {
      this.p.stroke(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30);
      this.p.strokeWeight(2);
    }
    
    this.p.noFill();
    this.p.beginShape();
    for (let point of this.smoothedPoints) {
      this.p.vertex(point.x - cameraX, point.y);
    }
    this.p.endShape();
    
    this.p.pop();
  }
  
  getHeightAtX(x) {
    // Find height at specific x position
    for (let i = 0; i < this.smoothedPoints.length - 1; i++) {
      const p1 = this.smoothedPoints[i];
      const p2 = this.smoothedPoints[i + 1];
      
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    
    return null;
  }
  
  isWalkable(x) {
    const height = this.getHeightAtX(x);
    return height !== null;
  }
}

export function createLevelTerrain(p, levelIndex) {
  const layers = [];
  
  if (levelIndex === 0) {
    // Tutorial level - simple gap
    layers.push(new TerrainLayer(
      p,
      [
        { x: 0, y: 0 },
        { x: 150, y: -10 },
        { x: 200, y: 0 }
      ],
      280,
      [120, 180, 120],
      false
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 180, y: 20 },
        { x: 250, y: 15 },
        { x: 320, y: 20 }
      ],
      300,
      [140, 200, 140],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 300, y: 0 },
        { x: 400, y: -5 },
        { x: 600, y: 0 }
      ],
      280,
      [120, 180, 120],
      false
    ));
  } else if (levelIndex === 1) {
    // Two moving layers
    layers.push(new TerrainLayer(
      p,
      [
        { x: 0, y: 0 },
        { x: 120, y: -15 },
        { x: 180, y: 0 }
      ],
      260,
      [110, 170, 110],
      false
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 150, y: 25 },
        { x: 220, y: 20 },
        { x: 280, y: 25 }
      ],
      280,
      [130, 190, 130],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 250, y: 30 },
        { x: 340, y: 25 },
        { x: 420, y: 30 }
      ],
      300,
      [140, 200, 140],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 400, y: 0 },
        { x: 500, y: -10 },
        { x: 600, y: 0 }
      ],
      260,
      [110, 170, 110],
      false
    ));
  } else if (levelIndex === 2) {
    // Three layers with elevation changes
    layers.push(new TerrainLayer(
      p,
      [
        { x: 0, y: 0 },
        { x: 100, y: -20 },
        { x: 150, y: -10 }
      ],
      300,
      [100, 160, 100],
      false
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 130, y: 20 },
        { x: 200, y: 15 },
        { x: 270, y: 20 }
      ],
      270,
      [120, 180, 120],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 240, y: 25 },
        { x: 320, y: 20 },
        { x: 400, y: 25 }
      ],
      300,
      [130, 190, 130],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 370, y: 30 },
        { x: 450, y: 25 },
        { x: 520, y: 30 }
      ],
      250,
      [140, 200, 140],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 500, y: -15 },
        { x: 550, y: -20 },
        { x: 600, y: -10 }
      ],
      280,
      [100, 160, 100],
      false
    ));
  } else if (levelIndex === 3) {
    // Complex multi-layer puzzle
    layers.push(new TerrainLayer(
      p,
      [
        { x: 0, y: 0 },
        { x: 80, y: -10 },
        { x: 130, y: 0 }
      ],
      320,
      [90, 150, 90],
      false
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 110, y: 15 },
        { x: 170, y: 10 },
        { x: 230, y: 15 }
      ],
      290,
      [110, 170, 110],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 200, y: 20 },
        { x: 270, y: 15 },
        { x: 340, y: 20 }
      ],
      260,
      [120, 180, 120],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 310, y: 25 },
        { x: 380, y: 20 },
        { x: 450, y: 25 }
      ],
      290,
      [130, 190, 130],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 420, y: 30 },
        { x: 490, y: 25 },
        { x: 560, y: 30 }
      ],
      240,
      [140, 200, 140],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 540, y: -20 },
        { x: 570, y: -25 },
        { x: 600, y: -15 }
      ],
      270,
      [90, 150, 90],
      false
    ));
  } else {
    // Final level - challenging puzzle
    layers.push(new TerrainLayer(
      p,
      [
        { x: 0, y: 0 },
        { x: 70, y: -15 },
        { x: 120, y: -5 }
      ],
      340,
      [80, 140, 80],
      false
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 100, y: 10 },
        { x: 150, y: 5 },
        { x: 200, y: 10 }
      ],
      310,
      [100, 160, 100],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 180, y: 15 },
        { x: 240, y: 10 },
        { x: 300, y: 15 }
      ],
      280,
      [110, 170, 110],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 270, y: 20 },
        { x: 330, y: 15 },
        { x: 390, y: 20 }
      ],
      250,
      [120, 180, 120],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 360, y: 25 },
        { x: 420, y: 20 },
        { x: 480, y: 25 }
      ],
      280,
      [130, 190, 130],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 450, y: 30 },
        { x: 510, y: 25 },
        { x: 570, y: 30 }
      ],
      220,
      [140, 200, 140],
      true
    ));
    
    layers.push(new TerrainLayer(
      p,
      [
        { x: 550, y: -25 },
        { x: 575, y: -30 },
        { x: 600, y: -20 }
      ],
      250,
      [80, 140, 80],
      false
    ));
  }
  
  return layers;
}