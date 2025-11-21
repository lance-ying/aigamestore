// tools.js - Puzzle tools (Jammer, Connector, Box)
import { gameState, TOOL_JAMMER, TOOL_CONNECTOR, TOOL_BOX } from './globals.js';

export class Tool {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.placed = false;
    this.held = false;
    this.active = false;
    this.radius = 8;
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.placed = true;
    this.held = false;
    this.activate();
  }

  activate() {
    this.active = true;
  }

  deactivate() {
    this.active = false;
  }

  drawIcon(p) {
    // Override in subclasses
  }

  draw(p) {
    if (this.held) return;

    p.push();
    p.translate(this.x, this.y);
    this.drawIcon(p);
    p.pop();
  }
}

export class Jammer extends Tool {
  constructor(x, y) {
    super(x, y, TOOL_JAMMER);
    this.jamRadius = 80;
  }

  activate() {
    super.activate();
    // Disable nearby turrets
    for (let entity of gameState.entities) {
      if (entity.type === 'TURRET') {
        const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
        if (dist < this.jamRadius) {
          entity.jammed = true;
        }
      }
    }
  }

  drawIcon(p) {
    p.fill(255, 200, 50);
    p.stroke(200, 150, 30);
    p.strokeWeight(2);
    p.rect(-8, -8, 16, 16);
    
    if (this.placed && this.active) {
      p.noFill();
      p.stroke(255, 200, 50, 100);
      p.strokeWeight(1);
      p.ellipse(0, 0, this.jamRadius * 2, this.jamRadius * 2);
    }

    // Antenna
    p.stroke(200, 150, 30);
    p.strokeWeight(2);
    p.line(0, -8, 0, -14);
    p.fill(255, 200, 50);
    p.noStroke();
    p.ellipse(0, -14, 4, 4);
  }
}

export class Connector extends Tool {
  constructor(x, y) {
    super(x, y, TOOL_CONNECTOR);
    this.targetConnector = null;
    this.maxDistance = 150;
  }

  activate() {
    super.activate();
    this.findConnection();
  }

  findConnection() {
    // Connect to nearest other connector or receiver
    let minDist = this.maxDistance;
    this.targetConnector = null;

    for (let tool of gameState.tools) {
      if (tool !== this && tool.type === TOOL_CONNECTOR && tool.placed) {
        const dist = Math.sqrt((this.x - tool.x) ** 2 + (this.y - tool.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          this.targetConnector = tool;
        }
      }
    }

    // Check for receivers
    for (let entity of gameState.entities) {
      if (entity.type === 'RECEIVER') {
        const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          this.targetConnector = entity;
        }
      }
    }

    // Activate connected receiver
    if (this.targetConnector && this.targetConnector.type === 'RECEIVER') {
      this.targetConnector.activate();
    }
  }

  drawIcon(p) {
    p.fill(100, 200, 255);
    p.stroke(50, 150, 200);
    p.strokeWeight(2);
    p.ellipse(0, 0, 16, 16);

    // Energy core
    p.fill(200, 250, 255);
    p.noStroke();
    p.ellipse(0, 0, 8, 8);

    // Draw connection beam
    if (this.placed && this.active && this.targetConnector) {
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      p.line(0, 0, this.targetConnector.x - this.x, this.targetConnector.y - this.y);
      
      // Energy particles
      const numParticles = 5;
      for (let i = 0; i < numParticles; i++) {
        const t = (p.frameCount * 0.02 + i / numParticles) % 1;
        const px = (this.targetConnector.x - this.x) * t;
        const py = (this.targetConnector.y - this.y) * t;
        p.fill(200, 250, 255, 200);
        p.noStroke();
        p.ellipse(px, py, 4, 4);
      }
    }
  }
}

export class Box extends Tool {
  constructor(x, y) {
    super(x, y, TOOL_BOX);
    this.width = 20;
    this.height = 20;
  }

  drawIcon(p) {
    p.fill(150, 100, 60);
    p.stroke(100, 70, 40);
    p.strokeWeight(2);
    p.rect(-10, -10, this.width, this.height);

    // Box details
    p.stroke(100, 70, 40);
    p.strokeWeight(1);
    p.line(-10, 0, 10, 0);
    p.line(0, -10, 0, 10);
  }
}