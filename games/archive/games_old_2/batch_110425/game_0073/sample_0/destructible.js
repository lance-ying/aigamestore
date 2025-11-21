// destructible.js - Destructible objects in the world
import { gameState, TOOLS } from './globals.js';

export class Destructible {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "tree", "rock", "crate", "barrel"
    this.width = 30;
    this.height = 30;
    this.active = true;
    
    // Set properties based on type
    switch (type) {
      case "tree":
        this.maxHits = 10;
        this.loot = { wood: 5 };
        this.color = [60, 120, 60];
        break;
      case "rock":
        this.maxHits = 15;
        this.loot = { stone: 8 };
        this.color = [120, 120, 120];
        break;
      case "crate":
        this.maxHits = 5;
        this.loot = { wood: 3, metal: 1 };
        this.color = [139, 90, 43];
        break;
      case "barrel":
        this.maxHits = 8;
        this.loot = { metal: 3 };
        this.color = [80, 80, 100];
        break;
      case "bush":
        this.maxHits = 3;
        this.loot = { fabric: 2 };
        this.color = [40, 100, 40];
        this.width = 25;
        this.height = 25;
        break;
    }
    
    this.hits = 0;
  }

  interact(p) {
    if (!this.active) return false;

    const tool = TOOLS[gameState.equippedTool];
    this.hits += tool.efficiency;

    if (this.hits >= this.maxHits) {
      // Add loot to inventory
      for (const [resource, amount] of Object.entries(this.loot)) {
        gameState.inventory[resource] += amount;
      }
      this.active = false;
      gameState.score += 10;
      return true; // object destroyed
    }
    return false;
  }

  render(p, camera) {
    if (!this.active) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Main body
    p.fill(...this.color);
    p.noStroke();
    
    if (this.type === "tree") {
      // Tree trunk
      p.fill(80, 50, 30);
      p.rect(screenX - 5, screenY - 5, 10, 25, 2);
      // Leaves
      p.fill(...this.color);
      p.ellipse(screenX, screenY - 15, 30, 30);
    } else if (this.type === "rock") {
      // Irregular rock shape
      p.beginShape();
      p.vertex(screenX, screenY - 15);
      p.vertex(screenX + 12, screenY - 8);
      p.vertex(screenX + 10, screenY + 10);
      p.vertex(screenX - 8, screenY + 12);
      p.vertex(screenX - 12, screenY);
      p.endShape(p.CLOSE);
    } else if (this.type === "crate") {
      p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, 3);
      // Cross pattern
      p.stroke(100, 70, 30);
      p.strokeWeight(2);
      p.line(screenX - 10, screenY - 10, screenX + 10, screenY + 10);
      p.line(screenX - 10, screenY + 10, screenX + 10, screenY - 10);
    } else if (this.type === "barrel") {
      p.ellipse(screenX, screenY, this.width, this.height);
      // Bands
      p.stroke(60, 60, 80);
      p.strokeWeight(2);
      p.line(screenX - 12, screenY - 5, screenX + 12, screenY - 5);
      p.line(screenX - 12, screenY + 5, screenX + 12, screenY + 5);
    } else if (this.type === "bush") {
      p.ellipse(screenX, screenY, this.width, this.height);
      p.fill(30, 80, 30);
      p.ellipse(screenX - 5, screenY - 5, 12, 12);
      p.ellipse(screenX + 5, screenY + 5, 12, 12);
    }

    // Damage indicator
    const damagePercent = this.hits / this.maxHits;
    if (damagePercent > 0) {
      p.fill(255, 200, 0);
      p.noStroke();
      const barWidth = 25;
      const barHeight = 3;
      p.rect(screenX - barWidth / 2, screenY + this.height / 2 + 5, barWidth * damagePercent, barHeight);
    }

    p.pop();
  }
}