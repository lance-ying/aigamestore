// terrain.js - Terrain generation and management

import { gameState, LEVELS } from './globals.js';

export class TerrainManager {
  constructor(physics, p) {
    this.physics = physics;
    this.p = p;
    this.segmentWidth = 80;
    this.lastSegmentX = 0;
    this.noiseOffset = 0;
  }
  
  initialize() {
    // Create initial terrain segments
    for (let i = 0; i < 15; i++) {
      this.generateSegment();
    }
  }
  
  generateSegment() {
    const { Bodies, World } = this.physics;
    const p = this.p;
    
    const level = LEVELS[gameState.currentLevel - 1];
    const maxSlope = level.max_slope_degrees;
    const complexity = level.terrain_complexity;
    
    const x = this.lastSegmentX;
    
    // Generate height using noise
    const noiseScale = 0.01 * complexity;
    const heightVariation = p.map(maxSlope, 0, 60, 50, 150);
    const baseHeight = 300;
    
    const y1 = baseHeight - p.noise(this.noiseOffset) * heightVariation;
    this.noiseOffset += noiseScale;
    const y2 = baseHeight - p.noise(this.noiseOffset) * heightVariation;
    
    const avgY = (y1 + y2) / 2;
    const segmentHeight = 200;
    
    // Create terrain segment
    const segment = Bodies.rectangle(
      x + this.segmentWidth / 2,
      avgY + segmentHeight / 2,
      this.segmentWidth,
      segmentHeight,
      {
        isStatic: true,
        friction: 1.0,
        restitution: 0
      }
    );
    
    segment.render = {
      y1: y1,
      y2: y2,
      x1: x,
      x2: x + this.segmentWidth
    };
    
    World.add(this.physics.engine.world, segment);
    gameState.terrainSegments.push(segment);
    
    this.lastSegmentX += this.segmentWidth;
  }
  
  update(cameraX) {
    // Generate new segments ahead
    while (this.lastSegmentX < cameraX + 800) {
      this.generateSegment();
    }
    
    // Remove old segments behind
    const removeThreshold = cameraX - 400;
    const toRemove = [];
    
    for (let segment of gameState.terrainSegments) {
      if (segment.position.x < removeThreshold) {
        toRemove.push(segment);
      }
    }
    
    if (toRemove.length > 0) {
      const { World } = this.physics;
      for (let segment of toRemove) {
        World.remove(this.physics.engine.world, segment);
        const index = gameState.terrainSegments.indexOf(segment);
        if (index > -1) {
          gameState.terrainSegments.splice(index, 1);
        }
      }
    }
  }
  
  render(p, cameraX) {
    p.push();
    
    for (let segment of gameState.terrainSegments) {
      if (!segment.render) continue;
      
      const screenX1 = segment.render.x1 - cameraX;
      const screenX2 = segment.render.x2 - cameraX;
      
      if (screenX2 < -100 || screenX1 > 700) continue;
      
      // Draw terrain surface
      p.fill(100, 80, 60);
      p.stroke(80, 60, 40);
      p.strokeWeight(2);
      
      p.beginShape();
      p.vertex(screenX1, segment.render.y1);
      p.vertex(screenX2, segment.render.y2);
      p.vertex(screenX2, 500);
      p.vertex(screenX1, 500);
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }
}

export function isVehicleOnGround(vehicle, terrainSegments, p) {
  const wheelY = vehicle.rearWheel.position.y + vehicle.wheelRadius;
  
  for (let segment of terrainSegments) {
    if (!segment.render) continue;
    
    const x1 = segment.render.x1;
    const x2 = segment.render.x2;
    const y1 = segment.render.y1;
    const y2 = segment.render.y2;
    
    const wheelX = vehicle.rearWheel.position.x;
    
    if (wheelX >= x1 && wheelX <= x2) {
      const t = (wheelX - x1) / (x2 - x1);
      const terrainY = p.lerp(y1, y2, t);
      
      if (Math.abs(wheelY - terrainY) < 15) {
        return true;
      }
    }
  }
  
  // Check front wheel too
  const frontWheelY = vehicle.frontWheel.position.y + vehicle.wheelRadius;
  for (let segment of terrainSegments) {
    if (!segment.render) continue;
    
    const x1 = segment.render.x1;
    const x2 = segment.render.x2;
    const y1 = segment.render.y1;
    const y2 = segment.render.y2;
    
    const wheelX = vehicle.frontWheel.position.x;
    
    if (wheelX >= x1 && wheelX <= x2) {
      const t = (wheelX - x1) / (x2 - x1);
      const terrainY = p.lerp(y1, y2, t);
      
      if (Math.abs(frontWheelY - terrainY) < 15) {
        return true;
      }
    }
  }
  
  return false;
}