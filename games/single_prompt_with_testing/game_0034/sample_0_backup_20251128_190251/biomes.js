// biomes.js - Biome generation and management

import { BIOME_TYPES, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

export class Biome {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.noStroke();
    
    const colors = this.getColors();
    
    // Background layer
    p.fill(...colors.bg);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Gradient overlay
    for (let i = 0; i < this.height; i += 20) {
      const alpha = p.map(i, 0, this.height, 50, 0);
      p.fill(colors.overlay[0], colors.overlay[1], colors.overlay[2], alpha);
      p.rect(screenX, screenY + i, this.width, 20);
    }
    
    // Biome-specific decorations
    this.renderDecorations(p, screenX, screenY);
    
    p.pop();
  }

  renderDecorations(p, screenX, screenY) {
    p.randomSeed(this.x + this.y);
    
    switch (this.type) {
      case BIOME_TYPES.SAFE_SHALLOWS:
        this.renderPlants(p, screenX, screenY, [100, 200, 150], 30);
        break;
      case BIOME_TYPES.TWISTY_BRIDGES:
        this.renderBridges(p, screenX, screenY);
        break;
      case BIOME_TYPES.CRYSTAL_CAVERNS:
        this.renderCrystals(p, screenX, screenY);
        break;
      case BIOME_TYPES.GLACIAL_BASIN:
        this.renderIce(p, screenX, screenY);
        break;
      case BIOME_TYPES.THERMAL_VENTS:
        this.renderVents(p, screenX, screenY);
        break;
      case BIOME_TYPES.DEEP_TRENCH:
        this.renderRocks(p, screenX, screenY);
        break;
    }
  }

  renderPlants(p, screenX, screenY, color, count) {
    for (let i = 0; i < count; i++) {
      const px = screenX + (i / count) * this.width;
      const py = screenY + this.height - 20;
      
      p.stroke(...color);
      p.strokeWeight(2);
      p.noFill();
      p.beginShape();
      for (let j = 0; j < 5; j++) {
        p.curveVertex(px + p.sin(j * 0.5) * 10, py - j * 8);
      }
      p.endShape();
    }
  }

  renderBridges(p, screenX, screenY) {
    p.fill(100, 150, 255, 100);
    for (let i = 0; i < 5; i++) {
      const bx = screenX + (i / 5) * this.width;
      const by = screenY + this.height * 0.3;
      p.ellipse(bx, by, 100, 30);
    }
  }

  renderCrystals(p, screenX, screenY) {
    p.fill(200, 220, 255, 150);
    p.stroke(150, 180, 255);
    p.strokeWeight(2);
    for (let i = 0; i < 15; i++) {
      const cx = screenX + (i / 15) * this.width;
      const cy = screenY + this.height * 0.7;
      const size = 20 + (i % 3) * 10;
      p.beginShape();
      p.vertex(cx, cy - size);
      p.vertex(cx - size * 0.3, cy);
      p.vertex(cx + size * 0.3, cy);
      p.endShape(p.CLOSE);
    }
  }

  renderIce(p, screenX, screenY) {
    p.fill(200, 230, 255, 100);
    p.noStroke();
    for (let i = 0; i < 10; i++) {
      const ix = screenX + (i / 10) * this.width;
      const iy = screenY + 20;
      p.ellipse(ix, iy, 40, 20);
    }
  }

  renderVents(p, screenX, screenY) {
    p.fill(255, 100, 0, 80);
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      const vx = screenX + (i / 8) * this.width;
      const vy = screenY + this.height - 30;
      p.ellipse(vx, vy, 30, 60);
    }
  }

  renderRocks(p, screenX, screenY) {
    p.fill(60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(1);
    for (let i = 0; i < 20; i++) {
      const rx = screenX + (i / 20) * this.width;
      const ry = screenY + this.height - 40 + (i % 3) * 15;
      p.ellipse(rx, ry, 40, 30);
    }
  }

  getColors() {
    switch (this.type) {
      case BIOME_TYPES.SAFE_SHALLOWS:
        return {
          bg: [100, 180, 220],
          overlay: [80, 200, 180]
        };
      case BIOME_TYPES.TWISTY_BRIDGES:
        return {
          bg: [70, 120, 200],
          overlay: [100, 150, 255]
        };
      case BIOME_TYPES.CRYSTAL_CAVERNS:
        return {
          bg: [150, 170, 230],
          overlay: [180, 200, 255]
        };
      case BIOME_TYPES.GLACIAL_BASIN:
        return {
          bg: [180, 200, 230],
          overlay: [200, 220, 255]
        };
      case BIOME_TYPES.THERMAL_VENTS:
        return {
          bg: [150, 100, 80],
          overlay: [200, 120, 50]
        };
      case BIOME_TYPES.DEEP_TRENCH:
        return {
          bg: [30, 40, 80],
          overlay: [20, 30, 60]
        };
      default:
        return {
          bg: [100, 150, 200],
          overlay: [120, 170, 220]
        };
    }
  }
}

export function generateBiomes(p) {
  const biomes = [];
  
  // Safe shallows (spawn area)
  biomes.push(new Biome(0, 0, 600, 400, BIOME_TYPES.SAFE_SHALLOWS));
  
  // Twisty bridges
  biomes.push(new Biome(600, 0, 600, 400, BIOME_TYPES.TWISTY_BRIDGES));
  
  // Crystal caverns
  biomes.push(new Biome(1200, 0, 600, 400, BIOME_TYPES.CRYSTAL_CAVERNS));
  
  // Glacial basin
  biomes.push(new Biome(0, 400, 600, 400, BIOME_TYPES.GLACIAL_BASIN));
  
  // Thermal vents
  biomes.push(new Biome(600, 400, 600, 400, BIOME_TYPES.THERMAL_VENTS));
  
  // Deep trench
  biomes.push(new Biome(1200, 400, 600, 400, BIOME_TYPES.DEEP_TRENCH));
  
  // Bottom row
  biomes.push(new Biome(0, 800, 600, 400, BIOME_TYPES.DEEP_TRENCH));
  biomes.push(new Biome(600, 800, 600, 400, BIOME_TYPES.DEEP_TRENCH));
  biomes.push(new Biome(1200, 800, 600, 400, BIOME_TYPES.DEEP_TRENCH));
  
  return biomes;
}