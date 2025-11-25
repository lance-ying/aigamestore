// interactables.js - Interactive objects in the game

import { gameState } from './globals.js';

export class Interactable {
  constructor(p, x, y, type, room) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // "FOOD", "SYSTEM", "BED"
    this.room = room;
    this.width = 30;
    this.height = 30;
    this.cooldown = 0;
    this.maxCooldown = 180; // 3 seconds
  }
  
  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
  
  canInteract(player) {
    const p = this.p;
    const dist = p.dist(player.x, player.y, this.x, this.y);
    return dist < 40 && this.cooldown === 0;
  }
  
  interact() {
    if (this.cooldown > 0) return false;
    
    this.cooldown = this.maxCooldown;
    
    switch (this.type) {
      case "FOOD":
        if (gameState.foodRations > 0) {
          gameState.foodRations--;
          gameState.hunger = Math.min(100, gameState.hunger + 40);
          gameState.health = Math.min(100, gameState.health + 5);
          return true;
        }
        return false;
        
      case "SYSTEM":
        gameState.power = Math.min(100, gameState.power + 25);
        gameState.sanity = Math.max(0, gameState.sanity - 5); // Stressful
        return true;
        
      case "BED":
        gameState.sanity = Math.min(100, gameState.sanity + 15);
        gameState.health = Math.min(100, gameState.health + 10);
        return true;
    }
    
    return false;
  }
  
  render() {
    const p = this.p;
    const player = gameState.player;
    const isNear = player && this.canInteract(player);
    
    p.push();
    
    // Render based on type
    if (this.type === "FOOD") {
      // Food storage container
      p.fill(isNear ? 100 : 60, isNear ? 100 : 60, isNear ? 60 : 40);
      p.rect(this.x - 15, this.y - 15, 30, 30, 3);
      p.fill(200, 200, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("FOOD", this.x, this.y - 5);
      p.textSize(12);
      p.text(gameState.foodRations, this.x, this.y + 5);
      
    } else if (this.type === "SYSTEM") {
      // Ship system terminal
      p.fill(isNear ? 80 : 40, isNear ? 80 : 40, isNear ? 100 : 60);
      p.rect(this.x - 15, this.y - 20, 30, 40, 3);
      
      // Screen
      const powerColor = gameState.power > 50 ? [0, 200, 100] : [200, 100, 0];
      p.fill(...powerColor);
      p.rect(this.x - 10, this.y - 15, 20, 15, 2);
      
      p.fill(200);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text("PWR", this.x, this.y + 10);
      
    } else if (this.type === "BED") {
      // Crew bed
      p.fill(isNear ? 100 : 60, isNear ? 80 : 50, isNear ? 80 : 50);
      p.rect(this.x - 20, this.y - 10, 40, 20, 3);
      p.fill(150, 130, 130);
      p.rect(this.x - 18, this.y - 8, 36, 16, 2);
    }
    
    // Interaction prompt
    if (isNear) {
      p.fill(255, 255, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("[SPACE]", this.x, this.y - 30);
    }
    
    // Cooldown indicator
    if (this.cooldown > 0) {
      p.noFill();
      p.stroke(255, 200, 100);
      p.strokeWeight(2);
      const angle = (this.cooldown / this.maxCooldown) * p.TWO_PI;
      p.arc(this.x, this.y, 35, 35, -p.HALF_PI, -p.HALF_PI + p.TWO_PI - angle);
    }
    
    p.pop();
  }
}

export function createInteractables(p) {
  const interactables = [];
  
  // Food storage in Cargo
  interactables.push(new Interactable(p, 420, 120, "FOOD", "CARGO"));
  
  // Ship systems in Cockpit
  interactables.push(new Interactable(p, 150, 100, "SYSTEM", "COCKPIT"));
  
  // Bed in Crew Quarters
  interactables.push(new Interactable(p, 150, 280, "BED", "QUARTERS"));
  
  // Medical supplies (acts as bed) in Medbay
  interactables.push(new Interactable(p, 420, 280, "BED", "MEDBAY"));
  
  return interactables;
}