// entities.js - Game entities (gems, fuel stations)
import { CANVAS_WIDTH, gameState } from './globals.js';

export class Gem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 8 + value * 2;
    this.collected = false;
    this.animationOffset = Math.random() * Math.PI * 2;
  }

  draw(p) {
    if (this.collected) return;
    
    const screenY = this.y - gameState.cameraY;
    const time = Date.now() * 0.003 + this.animationOffset;
    const pulse = Math.sin(time) * 2;
    
    p.push();
    p.translate(this.x, screenY);
    
    // Glow
    p.noStroke();
    const glowColor = this.value === 1 ? [100, 200, 255, 100] : 
                      this.value === 2 ? [255, 200, 100, 100] : 
                      [255, 100, 255, 100];
    p.fill(...glowColor);
    p.ellipse(0, 0, this.radius * 2 + pulse * 2, this.radius * 2 + pulse * 2);
    
    // Gem
    const gemColor = this.value === 1 ? [100, 200, 255] : 
                     this.value === 2 ? [255, 200, 100] : 
                     [255, 100, 255];
    p.fill(...gemColor);
    p.stroke(255);
    p.strokeWeight(1);
    
    const sides = 6;
    p.beginShape();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides + time;
      const r = this.radius + pulse;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  checkCollection(player, p) {
    if (this.collected) return false;
    
    const dist = p.dist(this.x, this.y, player.x, player.y);
    if (dist < this.radius + player.width / 2) {
      this.collected = true;
      return true;
    }
    return false;
  }
}

export class FuelStation {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 40;
    this.active = false;
  }

  draw(p) {
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    
    // Platform
    p.fill(80, 80, 100);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, screenY, this.width, 10);
    
    // Fuel pump
    p.fill(120, 120, 140);
    p.rect(this.x - 15, screenY - 30, 30, 30);
    
    // Display
    p.fill(50, 50, 60);
    p.rect(this.x - 10, screenY - 25, 20, 15);
    
    // Active indicator
    if (this.active) {
      p.fill(0, 255, 0);
      p.noStroke();
      p.ellipse(this.x, screenY - 17, 4, 4);
    }
    
    // Nozzle
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.line(this.x, screenY - 10, this.x, screenY);
    
    // Label
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(8);
    p.text("FUEL", this.x, screenY + 25);
    
    p.pop();
  }

  checkLanding(player, p) {
    const screenY = this.y - gameState.cameraY;
    
    // Check if player is near landing pad
    const distX = Math.abs(player.x - this.x);
    const distY = Math.abs((player.y - gameState.cameraY) - screenY);
    
    if (distX < this.width / 2 && distY < 20 && Math.abs(player.vy) < 0.5 && player.landingGearOut) {
      this.active = true;
      return true;
    }
    
    this.active = false;
    return false;
  }

  refuel() {
    if (this.active && gameState.fuel < gameState.maxFuel) {
      gameState.fuel = Math.min(gameState.maxFuel, gameState.fuel + 0.5);
    }
  }
}

export function generateEntities(p) {
  gameState.gems = [];
  gameState.fuelStations = [];
  
  // Generate gems at various depths
  for (let i = 0; i < 20; i++) {
    const depth = 300 + i * 80;
    const segment = gameState.caveSegments.find(s => Math.abs(s.y - depth) < 25);
    
    if (segment) {
      const x = segment.leftWidth + 80 + p.random(0, CANVAS_WIDTH - segment.leftWidth - segment.rightWidth - 160);
      const value = depth < 800 ? 1 : depth < 1400 ? 2 : 3;
      gameState.gems.push(new Gem(x, depth, value));
    }
  }
  
  // Generate fuel stations
  for (let i = 0; i < 6; i++) {
    const depth = 400 + i * 250;
    const segment = gameState.caveSegments.find(s => Math.abs(s.y - depth) < 25);
    
    if (segment) {
      const x = segment.leftWidth + 80 + p.random(0, CANVAS_WIDTH - segment.leftWidth - segment.rightWidth - 160);
      gameState.fuelStations.push(new FuelStation(x, depth));
    }
  }
}