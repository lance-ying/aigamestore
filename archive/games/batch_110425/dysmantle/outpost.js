// outpost.js - Outposts and crafting stations
import { gameState, RECIPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Outpost {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.active = false;
    this.interactRange = 60;
  }

  activate() {
    this.active = true;
    gameState.score += 100;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    if (this.active) {
      p.fill(100, 200, 100);
      p.stroke(80, 180, 80);
    } else {
      p.fill(60, 60, 60);
      p.stroke(40, 40, 40);
    }
    p.strokeWeight(3);
    
    // Flag pole
    p.line(screenX, screenY + 15, screenX, screenY - 20);
    
    // Flag
    if (this.active) {
      p.fill(100, 200, 100);
      p.triangle(screenX, screenY - 20, screenX + 20, screenY - 15, screenX, screenY - 10);
    } else {
      p.fill(80, 80, 80);
      p.triangle(screenX, screenY - 20, screenX + 15, screenY - 17, screenX, screenY - 14);
    }
    
    // Base
    p.fill(...(this.active ? [80, 180, 80] : [50, 50, 50]));
    p.rect(screenX - 10, screenY + 15, 20, 10, 2);

    p.pop();
  }
}

export class CraftingStation {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.interactRange = 60;
  }

  canCraft(recipe) {
    const requirements = RECIPES[recipe];
    if (!requirements) return false;
    
    for (const [resource, amount] of Object.entries(requirements)) {
      if (resource === "type") continue;
      if (gameState.inventory[resource] < amount) {
        return false;
      }
    }
    return true;
  }

  craft(recipe) {
    if (!this.canCraft(recipe)) return false;

    const requirements = RECIPES[recipe];
    
    // Consume resources
    for (const [resource, amount] of Object.entries(requirements)) {
      if (resource === "type") continue;
      gameState.inventory[resource] -= amount;
    }

    // Equip item
    if (requirements.type === "weapon") {
      gameState.equippedWeapon = recipe;
    } else if (requirements.type === "tool") {
      gameState.equippedTool = recipe;
    }

    gameState.score += 50;
    return true;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Anvil-like structure
    p.fill(100, 100, 120);
    p.stroke(80, 80, 100);
    p.strokeWeight(2);
    p.rect(screenX - 15, screenY - 5, 30, 15, 2);
    
    // Top surface
    p.fill(120, 120, 140);
    p.rect(screenX - 12, screenY - 10, 24, 5, 1);
    
    // Legs
    p.fill(80, 80, 100);
    p.rect(screenX - 12, screenY + 10, 6, 8);
    p.rect(screenX + 6, screenY + 10, 6, 8);

    p.pop();
  }
}

export class EscapePoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
    this.interactRange = 70;
    this.active = false;
  }

  activate() {
    if (this.canActivate()) {
      this.active = true;
      gameState.escapePointActivated = true;
      gameState.gamePhase = "GAME_OVER_WIN";
      return true;
    }
    return false;
  }

  canActivate() {
    // Check if all zones are cleared
    return gameState.clearedZones.length >= 4;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    const canEscape = this.canActivate();
    
    // Portal effect
    p.noFill();
    p.strokeWeight(4);
    p.stroke(...(canEscape ? [100, 200, 255] : [80, 80, 80]));
    p.ellipse(screenX, screenY, this.width, this.height);
    
    if (canEscape) {
      p.stroke(150, 220, 255);
      p.strokeWeight(2);
      p.ellipse(screenX, screenY, this.width - 10, this.height - 10);
      
      // Animated center
      const pulse = p.sin(p.frameCount * 0.1) * 5;
      p.fill(100, 200, 255, 150);
      p.noStroke();
      p.ellipse(screenX, screenY, 20 + pulse, 20 + pulse);
    }
    
    p.pop();
  }
}