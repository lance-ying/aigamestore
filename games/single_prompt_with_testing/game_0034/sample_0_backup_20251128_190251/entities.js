// entities.js - Entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, ENTITY_TYPES, RESOURCE_TYPES, BIOME_TYPES } from './globals.js';

export class Entity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
  }

  update(p, gameState) {}
  
  render(p, cameraX, cameraY) {}
}

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_TYPES.PLAYER);
    this.vx = 0;
    this.vy = 0;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.size = 20;
    this.oxygen = 100;
    this.maxOxygen = 100;
    this.temperature = 100;
    this.maxTemperature = 100;
    this.swimDirection = 0;
    this.swimAnim = 0;
  }

  update(p, gameState) {
    this.swimAnim += 0.15;
    
    // Oxygen depletion
    const depth = this.y;
    const oxygenDepleteRate = depth > 200 ? 0.08 : 0.04;
    const isSprinting = p.keyIsDown(16);
    this.oxygen -= oxygenDepleteRate * (isSprinting ? 2 : 1);
    
    // Temperature depletion in cold biomes
    const currentBiome = this.getCurrentBiome(gameState);
    if (currentBiome && (currentBiome.type === BIOME_TYPES.GLACIAL_BASIN || currentBiome.type === BIOME_TYPES.DEEP_TRENCH)) {
      this.temperature -= 0.05;
    }
    
    // Refill at surface
    if (this.y < 100) {
      this.oxygen = p.min(this.maxOxygen, this.oxygen + 0.5);
    }
    
    // Refill at habitats
    gameState.habitats.forEach(habitat => {
      const dist = p.dist(this.x, this.y, habitat.x, habitat.y);
      if (dist < 50) {
        this.oxygen = p.min(this.maxOxygen, this.oxygen + 1);
        this.temperature = p.min(this.maxTemperature, this.temperature + 1);
      }
    });
    
    // Thermal lily warming
    gameState.entities.forEach(entity => {
      if (entity.type === ENTITY_TYPES.THERMAL_LILY) {
        const dist = p.dist(this.x, this.y, entity.x, entity.y);
        if (dist < 40) {
          this.temperature = p.min(this.maxTemperature, this.temperature + 0.3);
        }
      }
    });
    
    // Clamp values
    this.oxygen = p.max(0, this.oxygen);
    this.temperature = p.max(0, this.temperature);
  }

  getCurrentBiome(gameState) {
    for (let biome of gameState.biomes) {
      if (this.x >= biome.x && this.x <= biome.x + biome.width &&
          this.y >= biome.y && this.y <= biome.y + biome.height) {
        return biome;
      }
    }
    return null;
  }

  move(dx, dy, gameState) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    
    // World boundaries
    if (newX < 10 || newX > WORLD_WIDTH - 10 || newY < 10 || newY > WORLD_HEIGHT - 10) {
      return;
    }
    
    this.x = newX;
    this.y = newY;
    
    if (dx !== 0) {
      this.swimDirection = dx > 0 ? 1 : -1;
    }
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Diver body
    p.fill(255, 150, 50);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size * 1.2);
    
    // Helmet
    p.fill(150, 200, 255, 200);
    p.ellipse(0, -this.size * 0.3, this.size * 0.8, this.size * 0.8);
    
    // Visor
    p.fill(50, 100, 150, 150);
    p.ellipse(0, -this.size * 0.3, this.size * 0.5, this.size * 0.4);
    
    // Oxygen tank
    p.fill(150, 150, 150);
    p.rect(-this.size * 0.25, this.size * 0.2, this.size * 0.5, this.size * 0.6, 5);
    
    // Flippers with animation
    const flipperAngle = p.sin(this.swimAnim) * 0.3;
    p.fill(100, 100, 250);
    p.push();
    p.translate(0, this.size * 0.8);
    p.rotate(flipperAngle);
    p.ellipse(-this.size * 0.2, 0, this.size * 0.4, this.size * 0.8);
    p.ellipse(this.size * 0.2, 0, this.size * 0.4, this.size * 0.8);
    p.pop();
    
    p.pop();
  }
}

export class Resource extends Entity {
  constructor(x, y, resourceType) {
    super(x, y, ENTITY_TYPES.RESOURCE);
    this.resourceType = resourceType;
    this.size = 15;
    this.collected = false;
    this.bobAnim = Math.random() * 100;
  }

  update(p, gameState) {
    this.bobAnim += 0.05;
  }

  render(p, cameraX, cameraY) {
    if (this.collected) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY + p.sin(this.bobAnim) * 3;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Glow effect
    p.noStroke();
    const glowColor = this.getColor();
    p.fill(glowColor[0], glowColor[1], glowColor[2], 50);
    p.ellipse(0, 0, this.size * 2, this.size * 2);
    
    // Resource node
    p.fill(...glowColor);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI;
      const r = this.size * (i % 2 === 0 ? 1 : 0.7);
      p.vertex(p.cos(angle) * r, p.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  getColor() {
    switch (this.resourceType) {
      case RESOURCE_TYPES.TITANIUM: return [180, 180, 200];
      case RESOURCE_TYPES.COPPER: return [255, 150, 50];
      case RESOURCE_TYPES.QUARTZ: return [200, 220, 255];
      default: return [150, 150, 150];
    }
  }
}

export class Artifact extends Entity {
  constructor(x, y, index) {
    super(x, y, ENTITY_TYPES.ARTIFACT);
    this.index = index;
    this.size = 25;
    this.collected = false;
    this.rotationAnim = 0;
    this.pulseAnim = 0;
  }

  update(p, gameState) {
    this.rotationAnim += 0.02;
    this.pulseAnim += 0.08;
  }

  render(p, cameraX, cameraY) {
    if (this.collected) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Powerful glow
    const pulseSize = 1 + p.sin(this.pulseAnim) * 0.2;
    p.noStroke();
    p.fill(100, 255, 200, 30);
    p.ellipse(0, 0, this.size * 4 * pulseSize, this.size * 4 * pulseSize);
    
    p.fill(100, 255, 200, 80);
    p.ellipse(0, 0, this.size * 2.5 * pulseSize, this.size * 2.5 * pulseSize);
    
    // Alien artifact structure
    p.rotate(this.rotationAnim);
    p.fill(50, 200, 150);
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const r = this.size * (i % 2 === 0 ? 1 : 0.6);
      p.vertex(p.cos(angle) * r, p.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    // Inner core
    p.fill(150, 255, 220);
    p.ellipse(0, 0, this.size * 0.5, this.size * 0.5);
    
    p.pop();
  }
}

export class Habitat extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_TYPES.HABITAT);
    this.size = 40;
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Base structure
    p.fill(100, 100, 120);
    p.stroke(80, 80, 100);
    p.strokeWeight(2);
    p.rect(-this.size * 0.8, -this.size * 0.6, this.size * 1.6, this.size * 1.2, 5);
    
    // Windows
    p.fill(150, 200, 255, 150);
    p.noStroke();
    p.ellipse(-this.size * 0.4, -this.size * 0.2, this.size * 0.4, this.size * 0.4);
    p.ellipse(this.size * 0.4, -this.size * 0.2, this.size * 0.4, this.size * 0.4);
    
    // Airlock
    p.fill(80, 80, 100);
    p.rect(-this.size * 0.2, this.size * 0.3, this.size * 0.4, this.size * 0.3, 3);
    
    // Safe zone indicator
    p.noFill();
    p.stroke(100, 255, 100, 100);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size * 2.5, this.size * 2.5);
    
    p.pop();
  }
}

export class Leviathan extends Entity {
  constructor(x, y, patrolPath) {
    super(x, y, ENTITY_TYPES.LEVIATHAN);
    this.size = 60;
    this.patrolPath = patrolPath;
    this.currentPathIndex = 0;
    this.speed = 1.5;
    this.detectionRange = 150;
    this.chaseSpeed = 2.5;
    this.state = "PATROL"; // PATROL, CHASE
    this.swimAnim = 0;
    this.direction = 1;
  }

  update(p, gameState) {
    this.swimAnim += 0.1;
    
    const player = gameState.player;
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    
    if (distToPlayer < this.detectionRange) {
      this.state = "CHASE";
      const angle = p.atan2(player.y - this.y, player.x - this.x);
      this.x += p.cos(angle) * this.chaseSpeed;
      this.y += p.sin(angle) * this.chaseSpeed;
      this.direction = p.cos(angle) > 0 ? 1 : -1;
      
      // Check collision with player
      if (distToPlayer < this.size * 0.6 + player.size * 0.5) {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
    } else {
      this.state = "PATROL";
      const target = this.patrolPath[this.currentPathIndex];
      const distToTarget = p.dist(this.x, this.y, target.x, target.y);
      
      if (distToTarget < 20) {
        this.currentPathIndex = (this.currentPathIndex + 1) % this.patrolPath.length;
      } else {
        const angle = p.atan2(target.y - this.y, target.x - this.x);
        this.x += p.cos(angle) * this.speed;
        this.y += p.sin(angle) * this.speed;
        this.direction = p.cos(angle) > 0 ? 1 : -1;
      }
    }
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    p.scale(this.direction, 1);
    
    // Shadow effect for depth
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(5, 5, this.size * 1.5, this.size * 0.8);
    
    // Body segments with animation
    const bodyWave = p.sin(this.swimAnim);
    p.fill(80, 40, 100);
    p.stroke(60, 20, 80);
    p.strokeWeight(2);
    
    // Head
    p.ellipse(0, 0, this.size, this.size * 0.7);
    
    // Eyes (menacing)
    p.fill(255, 50, 50, 200);
    p.noStroke();
    p.ellipse(this.size * 0.2, -this.size * 0.15, this.size * 0.15, this.size * 0.15);
    
    // Body segments
    for (let i = 1; i < 4; i++) {
      const segmentX = -i * this.size * 0.3;
      const segmentY = bodyWave * 5 * i;
      p.fill(80 - i * 10, 40 - i * 5, 100 - i * 10);
      p.stroke(60 - i * 10, 20 - i * 5, 80 - i * 10);
      p.strokeWeight(2);
      p.ellipse(segmentX, segmentY, this.size * (1 - i * 0.15), this.size * 0.6 * (1 - i * 0.1));
    }
    
    // Fins
    p.fill(100, 60, 120, 150);
    p.noStroke();
    p.triangle(0, -this.size * 0.4, -this.size * 0.3, -this.size * 0.6, this.size * 0.1, -this.size * 0.5);
    
    // Warning glow if chasing
    if (this.state === "CHASE") {
      p.noFill();
      p.stroke(255, 0, 0, 100);
      p.strokeWeight(3);
      p.ellipse(0, 0, this.size * 1.5, this.size);
    }
    
    p.pop();
  }
}

export class Pengwing extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_TYPES.PENGWING);
    this.size = 18;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.speed = 0.8;
    this.swimAnim = Math.random() * 100;
    this.direction = this.vx > 0 ? 1 : -1;
  }

  update(p, gameState) {
    this.swimAnim += 0.12;
    
    // Random movement
    if (p.frameCount % 120 === 0) {
      this.vx = (Math.random() * 2 - 1) * this.speed;
      this.vy = (Math.random() * 2 - 1) * this.speed;
      this.direction = this.vx > 0 ? 1 : -1;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Stay in safe areas
    if (this.x < 100 || this.x > WORLD_WIDTH - 100) this.vx *= -1;
    if (this.y < 100 || this.y > 400) this.vy *= -1;
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    p.scale(this.direction, 1);
    
    // Body
    p.fill(50, 50, 80);
    p.noStroke();
    p.ellipse(0, 0, this.size * 0.8, this.size);
    
    // Belly
    p.fill(200, 200, 220);
    p.ellipse(0, this.size * 0.2, this.size * 0.5, this.size * 0.7);
    
    // Flippers with animation
    const flipperAngle = p.sin(this.swimAnim) * 0.5;
    p.fill(40, 40, 70);
    p.push();
    p.rotate(flipperAngle);
    p.ellipse(-this.size * 0.3, 0, this.size * 0.3, this.size * 0.6);
    p.pop();
    
    // Head
    p.fill(50, 50, 80);
    p.ellipse(this.size * 0.25, -this.size * 0.4, this.size * 0.6, this.size * 0.6);
    
    // Eye
    p.fill(250, 250, 250);
    p.ellipse(this.size * 0.35, -this.size * 0.45, this.size * 0.2, this.size * 0.2);
    p.fill(20, 20, 20);
    p.ellipse(this.size * 0.38, -this.size * 0.45, this.size * 0.1, this.size * 0.1);
    
    // Beak
    p.fill(255, 150, 50);
    p.triangle(this.size * 0.5, -this.size * 0.4, this.size * 0.65, -this.size * 0.35, this.size * 0.5, -this.size * 0.3);
    
    p.pop();
  }
}

export class ThermalLily extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_TYPES.THERMAL_LILY);
    this.size = 20;
    this.glowAnim = Math.random() * 100;
  }

  update(p, gameState) {
    this.glowAnim += 0.06;
  }

  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    const glowIntensity = 1 + p.sin(this.glowAnim) * 0.3;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Warm glow
    p.noStroke();
    p.fill(255, 150, 50, 40);
    p.ellipse(0, 0, this.size * 3 * glowIntensity, this.size * 3 * glowIntensity);
    
    p.fill(255, 100, 0, 60);
    p.ellipse(0, 0, this.size * 2 * glowIntensity, this.size * 2 * glowIntensity);
    
    // Lily petals
    p.fill(255, 180, 100);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI;
      p.push();
      p.rotate(angle);
      p.ellipse(0, -this.size * 0.5, this.size * 0.4, this.size * 0.8);
      p.pop();
    }
    
    // Center
    p.fill(255, 220, 150);
    p.ellipse(0, 0, this.size * 0.5, this.size * 0.5);
    
    p.pop();
  }
}