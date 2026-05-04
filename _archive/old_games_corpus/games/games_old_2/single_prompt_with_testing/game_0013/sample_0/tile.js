// tile.js - Tile class and related functions

import { CELL_SIZE } from './globals.js';

export class Tile {
  constructor(paths, rotation = 0) {
    this.paths = paths; // Array of path pairs [[a,b], [c,d]]
    this.rotation = rotation; // 0, 1, 2, or 3 (90 degree increments)
  }
  
  rotate() {
    this.rotation = (this.rotation + 1) % 4;
  }
  
  getRotatedPaths() {
    // Apply rotation to paths
    return this.paths.map(pathPair => 
      pathPair.map(dir => (dir + this.rotation * 2) % 8)
    );
  }
  
  getExitDirection(entryDir) {
    // Given entry direction, return exit direction
    const rotatedPaths = this.getRotatedPaths();
    for (let pair of rotatedPaths) {
      if (pair[0] === entryDir) return pair[1];
      if (pair[1] === entryDir) return pair[0];
    }
    return -1; // Should never happen if tile is valid
  }
  
  draw(p, x, y, size, alpha = 255) {
    p.push();
    p.translate(x, y);
    
    // Draw tile background
    p.fill(240, 230, 210, alpha);
    p.stroke(100, 90, 70, alpha);
    p.strokeWeight(2);
    p.rect(0, 0, size, size);
    
    // Draw paths
    const rotatedPaths = this.getRotatedPaths();
    p.strokeWeight(4);
    p.stroke(60, 50, 40, alpha);
    p.noFill();
    
    for (let pair of rotatedPaths) {
      this.drawPath(p, pair[0], pair[1], size);
    }
    
    p.pop();
  }
  
  drawPath(p, dir1, dir2, size) {
    const half = size / 2;
    const edge = size / 2;
    
    const getEdgePoint = (dir) => {
      switch(dir) {
        case 0: return [half, 0];       // N
        case 2: return [size, half];    // E
        case 4: return [half, size];    // S
        case 6: return [0, half];       // W
        default: return [half, half];
      }
    };
    
    const p1 = getEdgePoint(dir1);
    const p2 = getEdgePoint(dir2);
    
    // Draw curved path
    p.beginShape();
    p.vertex(p1[0], p1[1]);
    
    // Create curve through center with control points
    const cx = half;
    const cy = half;
    p.quadraticVertex(cx, cy, p2[0], p2[1]);
    
    p.endShape();
  }
  
  clone() {
    return new Tile(this.paths.map(p => [...p]), this.rotation);
  }
}

export function createRandomTile(p) {
  const pathIndex = Math.floor(p.random() * 6);
  const paths = [
    [[0, 4], [2, 6]], // Straight
    [[0, 2], [4, 6]], // Turn 1
    [[0, 6], [2, 4]], // Turn 2
    [[2, 4], [0, 6]], // Turn 3
    [[0, 2], [6, 4]], // Turn 4
    [[0, 6], [4, 2]], // Turn 5
  ];
  return new Tile(paths[pathIndex]);
}