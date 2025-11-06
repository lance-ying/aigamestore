// fuel.js - Fuel canister management

import { gameState, LEVELS } from './globals.js';

export class FuelCanister {
  constructor(x, y, physics) {
    this.physics = physics;
    const { Bodies, World } = physics;
    
    this.body = Bodies.rectangle(x, y - 30, 15, 20, {
      isStatic: true,
      isSensor: true
    });
    
    this.body.label = 'fuelCanister';
    this.collected = false;
    
    World.add(physics.engine.world, this.body);
  }
  
  render(p, cameraX) {
    if (this.collected) return;
    
    p.push();
    const screenX = this.body.position.x - cameraX;
    const screenY = this.body.position.y;
    
    // Fuel canister body
    p.fill(50, 200, 50);
    p.stroke(40, 160, 40);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, 15, 20, 2);
    
    // Highlight
    p.fill(100, 255, 100);
    p.noStroke();
    p.rect(screenX - 3, screenY - 5, 5, 10, 1);
    
    // Small "F" label
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('F', screenX, screenY);
    
    p.pop();
  }
  
  checkCollision(vehicle) {
    if (this.collected) return false;
    
    const dx = this.body.position.x - vehicle.chassis.position.x;
    const dy = this.body.position.y - vehicle.chassis.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 30) {
      this.collected = true;
      return true;
    }
    return false;
  }
  
  destroy() {
    if (this.body && !this.collected) {
      const { World } = this.physics;
      World.remove(this.physics.engine.world, this.body);
    }
  }
}

export function spawnFuelCanister(physics, terrainSegments, p) {
  const level = LEVELS[gameState.currentLevel - 1];
  const frequency = level.fuel_canister_frequency_meters;
  
  if (gameState.distance - gameState.lastFuelSpawnDistance >= frequency) {
    // Find terrain height at spawn position
    const spawnX = gameState.distance + 200;
    let spawnY = 250;
    
    for (let segment of terrainSegments) {
      if (!segment.render) continue;
      
      const x1 = segment.render.x1;
      const x2 = segment.render.x2;
      const y1 = segment.render.y1;
      const y2 = segment.render.y2;
      
      if (spawnX >= x1 && spawnX <= x2) {
        const t = (spawnX - x1) / (x2 - x1);
        spawnY = p.lerp(y1, y2, t);
        break;
      }
    }
    
    const canister = new FuelCanister(spawnX, spawnY, physics);
    gameState.fuelCanisters.push(canister);
    gameState.lastFuelSpawnDistance = gameState.distance;
  }
}