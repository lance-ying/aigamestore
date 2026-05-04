import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Scene {
  constructor(id, name, description, bgColor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.bgColor = bgColor;
    this.hotspots = [];
    this.connections = []; // {direction: "right", sceneId: 1}
  }

  addHotspot(hotspot) {
    this.hotspots.push(hotspot);
  }

  addConnection(direction, sceneId) {
    this.connections.push({ direction, sceneId });
  }

  render(p) {
    // Background
    p.fill(...this.bgColor);
    p.rect(0, 50, CANVAS_WIDTH, CANVAS_HEIGHT - 100);

    // Scene elements
    this.renderSceneElements(p);

    // Hotspots (subtle indicators)
    this.hotspots.forEach(hotspot => {
      if (!hotspot.hidden) {
        hotspot.render(p);
      }
    });
  }

  renderSceneElements(p) {
    // Override in specific scenes
  }
}

export class Hotspot {
  constructor(x, y, width, height, name, actions, onInteract) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.name = name;
    this.actions = actions; // Array of available action types
    this.onInteract = onInteract; // Function(actionType, gameState)
    this.hidden = false;
    this.highlighted = false;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  render(p) {
    if (this.highlighted) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.rect(this.x, this.y, this.width, this.height);
      p.pop();
    }
  }
}

export class InventoryItem {
  constructor(id, name, description, sprite) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.sprite = sprite; // Function to render
    this.combinable = []; // Array of item IDs this can combine with
  }

  renderIcon(p, x, y, size) {
    this.sprite(p, x, y, size);
  }
}