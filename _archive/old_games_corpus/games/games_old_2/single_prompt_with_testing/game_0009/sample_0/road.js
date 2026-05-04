// road.js - Road segment and network management

import { ROAD_WIDTH, gameState } from './globals.js';

export class RoadSegment {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = ROAD_WIDTH;
    
    // Calculate length and angle
    this.length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    this.angle = Math.atan2(y2 - y1, x2 - x1);
  }
  
  draw(p) {
    p.push();
    p.stroke(60);
    p.strokeWeight(this.width + 4);
    p.line(this.x1, this.y1, this.x2, this.y2);
    
    p.stroke(80, 80, 80);
    p.strokeWeight(this.width);
    p.line(this.x1, this.y1, this.x2, this.y2);
    
    // Draw center line
    p.stroke(255, 255, 0);
    p.strokeWeight(1);
    p.drawingContext.setLineDash([5, 5]);
    p.line(this.x1, this.y1, this.x2, this.y2);
    p.drawingContext.setLineDash([]);
    p.pop();
  }
  
  getPointAt(t) {
    // Get point at normalized position t (0 to 1)
    return {
      x: this.x1 + (this.x2 - this.x1) * t,
      y: this.y1 + (this.y2 - this.y1) * t
    };
  }
  
  getClosestPoint(x, y) {
    // Find closest point on segment to given position
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) return { x: this.x1, y: this.y1, t: 0 };
    
    let t = ((x - this.x1) * dx + (y - this.y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    
    return {
      x: this.x1 + t * dx,
      y: this.y1 + t * dy,
      t: t
    };
  }
  
  distanceToPoint(x, y) {
    const closest = this.getClosestPoint(x, y);
    return Math.sqrt((x - closest.x) ** 2 + (y - closest.y) ** 2);
  }
}

export class RoadNetwork {
  constructor() {
    this.segments = [];
    this.graph = new Map(); // node -> connected segments
  }
  
  addSegment(segment) {
    this.segments.push(segment);
    this.updateGraph();
  }
  
  removeSegment(segment) {
    const index = this.segments.indexOf(segment);
    if (index > -1) {
      this.segments.splice(index, 1);
      this.updateGraph();
    }
  }
  
  updateGraph() {
    // Build connectivity graph for pathfinding
    this.graph.clear();
    
    for (const seg of this.segments) {
      const key1 = `${Math.round(seg.x1)},${Math.round(seg.y1)}`;
      const key2 = `${Math.round(seg.x2)},${Math.round(seg.y2)}`;
      
      if (!this.graph.has(key1)) this.graph.set(key1, []);
      if (!this.graph.has(key2)) this.graph.set(key2, []);
      
      this.graph.get(key1).push({ segment: seg, isStart: true });
      this.graph.get(key2).push({ segment: seg, isStart: false });
    }
  }
  
  findPath(startX, startY, endX, endY) {
    // Simple pathfinding: find connected road segments
    const startKey = this.findNearestNode(startX, startY);
    const endKey = this.findNearestNode(endX, endY);
    
    if (!startKey || !endKey) return null;
    
    // BFS to find path
    const queue = [{ node: startKey, path: [] }];
    const visited = new Set([startKey]);
    
    while (queue.length > 0) {
      const { node, path } = queue.shift();
      
      if (node === endKey) {
        return path;
      }
      
      const connections = this.graph.get(node) || [];
      for (const conn of connections) {
        const nextNode = conn.isStart
          ? `${Math.round(conn.segment.x2)},${Math.round(conn.segment.y2)}`
          : `${Math.round(conn.segment.x1)},${Math.round(conn.segment.y1)}`;
        
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push({
            node: nextNode,
            path: [...path, { segment: conn.segment, forward: conn.isStart }]
          });
        }
      }
    }
    
    return null;
  }
  
  findNearestNode(x, y, maxDist = 30) {
    let nearest = null;
    let minDist = maxDist;
    
    for (const [key, _] of this.graph) {
      const [nx, ny] = key.split(',').map(Number);
      const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    }
    
    return nearest;
  }
  
  draw(p) {
    for (const segment of this.segments) {
      segment.draw(p);
    }
  }
}