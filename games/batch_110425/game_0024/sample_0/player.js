// player.js - Player entity and controls

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle; // viewing angle in radians
    this.speed = 2;
    this.sprintMultiplier = 1.8;
    this.turnSpeed = 0.08;
    this.radius = 15;
    this.health = 100;
    this.interactionRange = 80;
    this.lastInteractFrame = 0;
  }

  move(forward, sprint = false) {
    const moveSpeed = sprint ? this.speed * this.sprintMultiplier : this.speed;
    const dx = Math.cos(this.angle) * forward * moveSpeed;
    const dy = Math.sin(this.angle) * forward * moveSpeed;
    
    // Store old position for collision recovery
    const oldX = this.x;
    const oldY = this.y;
    
    this.x += dx;
    this.y += dy;
    
    // Check collision with walls
    if (this.checkWallCollision()) {
      this.x = oldX;
      this.y = oldY;
    }
    
    // Keep player in bounds
    this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));
  }

  turn(direction) {
    this.angle += direction * this.turnSpeed;
  }

  checkWallCollision() {
    const currentRoom = gameState.rooms[gameState.currentRoom];
    if (!currentRoom) return false;
    
    for (const wall of currentRoom.walls) {
      const closestX = Math.max(wall.x, Math.min(this.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(this.y, wall.y + wall.h));
      const distX = this.x - closestX;
      const distY = this.y - closestY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance < this.radius) {
        return true;
      }
    }
    return false;
  }

  interact(p) {
    // Prevent rapid interactions
    if (gameState.frameCount - this.lastInteractFrame < 10) return;
    
    this.lastInteractFrame = gameState.frameCount;
    
    // Check for interactable objects in range
    for (const interactable of gameState.interactables) {
      if (!interactable.active) continue;
      
      const dist = p.dist(this.x, this.y, interactable.x, interactable.y);
      if (dist < this.interactionRange) {
        interactable.interact();
        return true;
      }
    }
    return false;
  }

  useItem(p) {
    if (gameState.inventory.length === 0) return;
    
    // Try to use item on nearby interactables
    for (const interactable of gameState.interactables) {
      if (!interactable.active || !interactable.requiresItem) continue;
      
      const dist = p.dist(this.x, this.y, interactable.x, interactable.y);
      if (dist < this.interactionRange) {
        // Check if we have required item
        const hasItem = gameState.inventory.includes(interactable.requiredItem);
        if (hasItem) {
          interactable.useItem();
          // Remove item from inventory
          const index = gameState.inventory.indexOf(interactable.requiredItem);
          if (index > -1) {
            gameState.inventory.splice(index, 1);
          }
          return true;
        }
      }
    }
    return false;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      gameState.endingType = "LOST";
    }
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw player body (circle)
    p.fill(100, 150, 255);
    p.stroke(200, 220, 255);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Draw direction indicator
    p.stroke(255, 255, 100);
    p.strokeWeight(3);
    const indicatorLength = this.radius + 8;
    p.line(0, 0, 
           Math.cos(this.angle) * indicatorLength, 
           Math.sin(this.angle) * indicatorLength);
    
    p.pop();
  }
}