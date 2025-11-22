// room.js - Room generation and management

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Room {
  constructor(id, layout, theme) {
    this.id = id;
    this.layout = layout; // "open", "corridor", "maze", "chamber"
    this.theme = theme; // color scheme
    this.walls = [];
    this.doors = [];
    this.decoration = [];
    this.ambientColor = theme.ambient;
    this.generateLayout();
  }

  generateLayout() {
    const margin = 20;
    
    switch (this.layout) {
      case "open":
        // Border walls only
        this.walls = [
          { x: 0, y: 0, w: CANVAS_WIDTH, h: margin }, // top
          { x: 0, y: CANVAS_HEIGHT - margin, w: CANVAS_WIDTH, h: margin }, // bottom
          { x: 0, y: 0, w: margin, h: CANVAS_HEIGHT }, // left
          { x: CANVAS_WIDTH - margin, y: 0, w: margin, h: CANVAS_HEIGHT } // right
        ];
        break;
        
      case "corridor":
        // Narrow passage with obstacles
        this.walls = [
          { x: 0, y: 0, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: CANVAS_HEIGHT - margin, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: 0, w: margin, h: CANVAS_HEIGHT },
          { x: CANVAS_WIDTH - margin, y: 0, w: margin, h: CANVAS_HEIGHT },
          // Inner obstacles
          { x: 150, y: 80, w: 40, h: 100 },
          { x: 400, y: 220, w: 40, h: 100 }
        ];
        break;
        
      case "maze":
        // Complex maze structure
        this.walls = [
          { x: 0, y: 0, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: CANVAS_HEIGHT - margin, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: 0, w: margin, h: CANVAS_HEIGHT },
          { x: CANVAS_WIDTH - margin, y: 0, w: margin, h: CANVAS_HEIGHT },
          // Maze walls
          { x: 100, y: 50, w: 20, h: 150 },
          { x: 200, y: 200, w: 20, h: 150 },
          { x: 300, y: 50, w: 20, h: 150 },
          { x: 400, y: 200, w: 20, h: 150 },
          { x: 150, y: 150, w: 150, h: 20 }
        ];
        break;
        
      case "chamber":
        // Large open chamber with central feature
        this.walls = [
          { x: 0, y: 0, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: CANVAS_HEIGHT - margin, w: CANVAS_WIDTH, h: margin },
          { x: 0, y: 0, w: margin, h: CANVAS_HEIGHT },
          { x: CANVAS_WIDTH - margin, y: 0, w: margin, h: CANVAS_HEIGHT },
          // Central pillar
          { x: CANVAS_WIDTH / 2 - 30, y: CANVAS_HEIGHT / 2 - 30, w: 60, h: 60 }
        ];
        break;
    }
  }

  render(p) {
    // Background
    p.background(...this.ambientColor);
    
    // Draw walls
    p.fill(40, 40, 50);
    p.stroke(80, 80, 100);
    p.strokeWeight(2);
    for (const wall of this.walls) {
      p.rect(wall.x, wall.y, wall.w, wall.h);
    }
    
    // Add atmospheric effects
    this.renderAtmosphere(p);
  }

  renderAtmosphere(p) {
    // Subtle vignette effect
    p.noStroke();
    const vignetteAlpha = 30;
    for (let i = 0; i < 50; i++) {
      const alpha = (i / 50) * vignetteAlpha;
      p.fill(0, 0, 0, alpha);
      p.rect(0, 0, CANVAS_WIDTH, i);
      p.rect(0, CANVAS_HEIGHT - i, CANVAS_WIDTH, i);
      p.rect(0, 0, i, CANVAS_HEIGHT);
      p.rect(CANVAS_WIDTH - i, 0, i, CANVAS_HEIGHT);
    }
  }
}

export function createRooms() {
  const themes = [
    { ambient: [20, 25, 35], name: "twilight" },
    { ambient: [35, 20, 30], name: "dusk" },
    { ambient: [25, 30, 25], name: "forest" },
    { ambient: [30, 25, 40], name: "void" },
    { ambient: [15, 15, 20], name: "abyss" }
  ];
  
  return [
    new Room(0, "open", themes[0]),
    new Room(1, "corridor", themes[1]),
    new Room(2, "maze", themes[2]),
    new Room(3, "chamber", themes[3]),
    new Room(4, "open", themes[4])
  ];
}