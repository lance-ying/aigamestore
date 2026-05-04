// scene.js - Scene management and rendering

import { Hotspot } from './hotspot.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Scene {
  constructor(id, name, description, backgroundRenderer) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.backgroundRenderer = backgroundRenderer;
    this.hotspots = [];
    this.npcs = [];
  }
  
  addHotspot(hotspot) {
    this.hotspots.push(hotspot);
  }
  
  addNPC(npc) {
    this.npcs.push(npc);
  }
  
  getHotspotAt(x, y) {
    for (let i = this.hotspots.length - 1; i >= 0; i--) {
      const hotspot = this.hotspots[i];
      if (hotspot.active && hotspot.contains(x, y)) {
        return hotspot;
      }
    }
    return null;
  }
  
  getNearbyHotspot(player) {
    for (const hotspot of this.hotspots) {
      if (hotspot.active && hotspot.isPlayerNear(player)) {
        return hotspot;
      }
    }
    return null;
  }
  
  render(p, currentHotspot) {
    this.backgroundRenderer(p);
    
    // Render NPCs
    for (const npc of this.npcs) {
      npc.render(p);
    }
    
    // Render hotspots
    for (const hotspot of this.hotspots) {
      const highlighted = currentHotspot === hotspot;
      hotspot.render(p, highlighted);
    }
  }
}

export function createScenes() {
  const scenes = {};
  
  // Cafe Scene
  const cafe = new Scene(
    "cafe",
    "Parisian Café",
    "A cozy Parisian café where your investigation begins",
    (p) => {
      // Sky
      p.fill(135, 185, 220);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.4);
      
      // Floor
      p.fill(160, 120, 80);
      p.rect(0, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35);
      
      // Wall
      p.fill(200, 180, 150);
      p.rect(0, CANVAS_HEIGHT * 0.4, CANVAS_WIDTH, CANVAS_HEIGHT * 0.25);
      
      // Tables
      p.fill(100, 70, 40);
      p.rect(80, CANVAS_HEIGHT * 0.6, 60, 10);
      p.rect(90, CANVAS_HEIGHT * 0.6 + 10, 5, 30);
      p.rect(135, CANVAS_HEIGHT * 0.6 + 10, 5, 30);
      
      p.rect(350, CANVAS_HEIGHT * 0.6, 60, 10);
      p.rect(360, CANVAS_HEIGHT * 0.6 + 10, 5, 30);
      p.rect(395, CANVAS_HEIGHT * 0.6 + 10, 5, 30);
      
      // Window
      p.fill(100, 150, 200, 150);
      p.rect(CANVAS_WIDTH - 120, CANVAS_HEIGHT * 0.42, 100, 80);
      p.stroke(80);
      p.strokeWeight(3);
      p.line(CANVAS_WIDTH - 70, CANVAS_HEIGHT * 0.42, CANVAS_WIDTH - 70, CANVAS_HEIGHT * 0.42 + 80);
      p.line(CANVAS_WIDTH - 120, CANVAS_HEIGHT * 0.5, CANVAS_WIDTH - 20, CANVAS_HEIGHT * 0.5);
      p.noStroke();
      
      // Door
      p.fill(120, 80, 50);
      p.rect(20, CANVAS_HEIGHT * 0.45, 60, 90);
      p.fill(200, 180, 100);
      p.circle(70, CANVAS_HEIGHT * 0.6, 8);
    }
  );
  
  cafe.addHotspot(new Hotspot(80, CANVAS_HEIGHT * 0.55, 60, 40, "examine", "newspaper", {
    name: "Newspaper",
    description: "A newspaper lies on the table with an article circled in red"
  }));
  
  cafe.addHotspot(new Hotspot(350, CANVAS_HEIGHT * 0.55, 60, 40, "examine", "table2", {
    name: "Table",
    description: "An empty table"
  }));
  
  cafe.addHotspot(new Hotspot(450, CANVAS_HEIGHT * 0.5, 50, 80, "talk", "waiter", {
    name: "Waiter",
    description: "The café waiter"
  }));
  
  cafe.addHotspot(new Hotspot(20, CANVAS_HEIGHT * 0.45, 60, 90, "exit", "door", {
    name: "Exit",
    targetScene: "street"
  }));
  
  // Waiter NPC
  cafe.addNPC({
    x: 470,
    y: CANVAS_HEIGHT * 0.65,
    render: function(p) {
      p.push();
      p.fill(50);
      p.rect(this.x - 15, this.y - 40, 30, 50);
      p.fill(220, 180, 140);
      p.ellipse(this.x, this.y - 50, 25, 25);
      p.fill(255);
      p.rect(this.x - 12, this.y - 35, 24, 30);
      p.pop();
    }
  });
  
  scenes.cafe = cafe;
  
  // Street Scene
  const street = new Scene(
    "street",
    "Street Outside",
    "A quiet Parisian street",
    (p) => {
      // Sky
      p.fill(120, 160, 200);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.5);
      
      // Ground
      p.fill(100, 100, 110);
      p.rect(0, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35);
      
      // Buildings
      p.fill(180, 160, 140);
      p.rect(0, CANVAS_HEIGHT * 0.3, 150, CANVAS_HEIGHT * 0.35);
      p.rect(200, CANVAS_HEIGHT * 0.35, 180, CANVAS_HEIGHT * 0.3);
      p.rect(420, CANVAS_HEIGHT * 0.25, 180, CANVAS_HEIGHT * 0.4);
      
      // Windows
      p.fill(80, 100, 120);
      for (let i = 0; i < 3; i++) {
        p.rect(30 + i * 40, CANVAS_HEIGHT * 0.4, 25, 30);
        p.rect(230 + i * 50, CANVAS_HEIGHT * 0.45, 25, 30);
        p.rect(450 + i * 50, CANVAS_HEIGHT * 0.35, 25, 30);
      }
      
      // Trash bin with key
      p.fill(60, 70, 60);
      p.rect(140, CANVAS_HEIGHT * 0.6, 30, 35);
      p.fill(40, 50, 40);
      p.rect(145, CANVAS_HEIGHT * 0.58, 20, 5);
    }
  );
  
  street.addHotspot(new Hotspot(140, CANVAS_HEIGHT * 0.58, 30, 37, "examine", "trashbin", {
    name: "Trash Bin",
    description: "Someone might have dropped something here"
  }));
  
  street.addHotspot(new Hotspot(200, CANVAS_HEIGHT * 0.35, 180, CANVAS_HEIGHT * 0.3, "use", "building", {
    name: "Locked Building",
    description: "A locked door - you need a key"
  }));
  
  street.addHotspot(new Hotspot(5, CANVAS_HEIGHT * 0.5, 60, 60, "exit", "backtocafe", {
    name: "Back to Café",
    targetScene: "cafe"
  }));
  
  scenes.street = street;
  
  // Gallery Scene
  const gallery = new Scene(
    "gallery",
    "Art Gallery",
    "An elegant art gallery with mysterious paintings",
    (p) => {
      // Floor
      p.fill(80, 70, 90);
      p.rect(0, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35);
      
      // Walls
      p.fill(140, 130, 150);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.65);
      
      // Paintings
      p.fill(40, 35, 30);
      p.rect(100, CANVAS_HEIGHT * 0.2, 120, 100);
      p.fill(60, 80, 120);
      p.rect(110, CANVAS_HEIGHT * 0.23, 100, 80);
      
      p.fill(40, 35, 30);
      p.rect(350, CANVAS_HEIGHT * 0.2, 120, 100);
      p.fill(120, 80, 60);
      p.rect(360, CANVAS_HEIGHT * 0.23, 100, 80);
      
      // Pedestal with map
      p.fill(200, 190, 180);
      p.rect(280, CANVAS_HEIGHT * 0.5, 40, 60);
      p.rect(270, CANVAS_HEIGHT * 0.48, 60, 5);
    }
  );
  
  gallery.addHotspot(new Hotspot(100, CANVAS_HEIGHT * 0.2, 120, 100, "examine", "painting1", {
    name: "Painting",
    description: "An abstract painting with hidden symbols"
  }));
  
  gallery.addHotspot(new Hotspot(350, CANVAS_HEIGHT * 0.2, 120, 100, "examine", "painting2", {
    name: "Painting",
    description: "A landscape that looks familiar"
  }));
  
  gallery.addHotspot(new Hotspot(270, CANVAS_HEIGHT * 0.48, 60, 62, "examine", "pedestal", {
    name: "Pedestal",
    description: "A pedestal with a map fragment"
  }));
  
  gallery.addHotspot(new Hotspot(CANVAS_WIDTH - 80, CANVAS_HEIGHT * 0.45, 60, 90, "exit", "exitgallery", {
    name: "Exit",
    targetScene: "street"
  }));
  
  scenes.gallery = gallery;
  
  // Final Room Scene
  const finalroom = new Scene(
    "finalroom",
    "Secret Chamber",
    "The final destination of your investigation",
    (p) => {
      // Dark background
      p.fill(20, 15, 30);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Mysterious glow
      p.fill(100, 80, 150, 50);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 300 - i * 80);
      }
      
      // Central pedestal
      p.fill(150, 120, 80);
      p.rect(CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT * 0.5, 80, 100);
      p.rect(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT * 0.48, 100, 10);
      
      // Mystical artifact
      p.fill(220, 180, 0);
      p.push();
      p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.45);
      p.rotate(p.frameCount * 0.01);
      p.star(0, 0, 15, 30, 8);
      p.pop();
      
      // Floor pattern
      p.stroke(80, 60, 100);
      p.strokeWeight(2);
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        p.line(i, CANVAS_HEIGHT * 0.65, i + 20, CANVAS_HEIGHT);
      }
      p.noStroke();
    }
  );
  
  finalroom.addHotspot(new Hotspot(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT * 0.45, 100, 110, "use", "artifact", {
    name: "Mystical Artifact",
    description: "The key to solving the mystery"
  }));
  
  scenes.finalroom = finalroom;
  
  return scenes;
}