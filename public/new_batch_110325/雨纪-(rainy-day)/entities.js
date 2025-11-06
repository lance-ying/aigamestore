// entities.js - Entity classes for game objects

import {
  ENTITY_GIRL, ENTITY_LANTERN, ENTITY_STELE, ENTITY_CRYSTAL,
  ENTITY_PLATFORM, ENTITY_SWITCH, ENTITY_ROBOT, ENTITY_CORE,
  ENTITY_EXIT, WATER_LEVEL_NONE, WATER_LEVEL_LOW, WATER_LEVEL_MID, WATER_LEVEL_HIGH
} from './globals.js';
import { gridToScreen, lerp, easeInOutQuad } from './utils.js';

// Base entity class
export class Entity {
  constructor(gridX, gridY, type) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.active = false;
    this.visible = true;
  }

  getScreenPos() {
    return gridToScreen(this.gridX, this.gridY, 0);
  }

  update(p, gameState) {
    // Override in subclasses
  }

  render(p, gameState) {
    // Override in subclasses
  }
}

// Terrain tile - defines walkable areas and height
export class Terrain extends Entity {
  constructor(gridX, gridY, height) {
    super(gridX, gridY, 'terrain');
    this.terrainHeight = height; // 0 = low, 1 = medium, 2 = high, 3 = very high
  }

  render(p, gameState) {
    // Terrain is invisible but defines walkability
  }
}

// Girl (Player) entity
export class Girl extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_GIRL);
    this.targetGridX = gridX;
    this.targetGridY = gridY;
    this.animProgress = 0;
    this.isMoving = false;
    this.moveSpeed = 0.15;
  }

  moveTo(newGridX, newGridY) {
    if (this.isMoving) return false;
    this.targetGridX = newGridX;
    this.targetGridY = newGridY;
    this.isMoving = true;
    this.animProgress = 0;
    return true;
  }

  update(p, gameState) {
    if (this.isMoving) {
      this.animProgress += this.moveSpeed;
      if (this.animProgress >= 1) {
        this.animProgress = 1;
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.isMoving = false;
      }
    }
  }

  getCurrentPos() {
    if (!this.isMoving) {
      return { gridX: this.gridX, gridY: this.gridY };
    }
    const t = easeInOutQuad(this.animProgress);
    return {
      gridX: lerp(this.gridX, this.targetGridX, t),
      gridY: lerp(this.gridY, this.targetGridY, t)
    };
  }

  render(p, gameState) {
    const pos = this.getCurrentPos();
    const screen = gridToScreen(pos.gridX, pos.gridY, 20);

    p.push();
    // Draw shadow
    p.fill(0, 0, 0, 60);
    p.noStroke();
    p.ellipse(screen.x, screen.y + 25, 20, 8);

    // Draw girl body
    p.fill(180, 100, 150);
    p.stroke(140, 70, 120);
    p.strokeWeight(2);
    p.ellipse(screen.x, screen.y, 18, 24);

    // Draw head
    p.fill(255, 220, 200);
    p.circle(screen.x, screen.y - 15, 14);

    // Draw hair
    p.fill(60, 40, 80);
    p.noStroke();
    p.arc(screen.x, screen.y - 15, 16, 16, p.PI, p.TWO_PI);
    p.triangle(screen.x - 8, screen.y - 10, screen.x - 10, screen.y, screen.x - 6, screen.y);
    p.triangle(screen.x + 8, screen.y - 10, screen.x + 10, screen.y, screen.x + 6, screen.y);

    // Draw eyes
    p.fill(40, 30, 50);
    p.circle(screen.x - 3, screen.y - 15, 2);
    p.circle(screen.x + 3, screen.y - 15, 2);

    // Draw umbrella if raining
    if (gameState.waterLevel > WATER_LEVEL_LOW) {
      p.fill(200, 80, 80, 180);
      p.stroke(160, 60, 60);
      p.strokeWeight(1);
      p.arc(screen.x, screen.y - 25, 30, 30, p.PI, p.TWO_PI);
      p.line(screen.x, screen.y - 25, screen.x, screen.y - 10);
    }

    p.pop();
  }
}

// Lantern entity
export class Lantern extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_LANTERN);
    this.lightRadius = 0;
    this.maxLightRadius = 2;
    this.glowPhase = 0;
  }

  activate() {
    this.active = true;
    return true;
  }

  update(p, gameState) {
    if (this.active) {
      this.lightRadius = this.maxLightRadius;
      this.glowPhase += 0.05;
    }
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 10);

    p.push();

    // Draw glow effect if active
    if (this.active) {
      const glowSize = 40 + Math.sin(this.glowPhase) * 8;
      p.fill(255, 200, 100, 40);
      p.noStroke();
      p.circle(screen.x, screen.y, glowSize);
    }

    // Draw pole
    p.stroke(80, 60, 40);
    p.strokeWeight(3);
    p.line(screen.x, screen.y, screen.x, screen.y + 20);

    // Draw lantern body
    p.fill(...(this.active ? [255, 220, 120] : [180, 150, 100]));
    p.stroke(...(this.active ? [220, 180, 80] : [140, 110, 60]));
    p.strokeWeight(2);
    p.rect(screen.x - 8, screen.y - 5, 16, 12, 2);

    // Draw lantern top
    p.fill(...(this.active ? [255, 180, 60] : [160, 130, 80]));
    p.triangle(screen.x - 10, screen.y - 5, screen.x + 10, screen.y - 5, screen.x, screen.y - 12);

    // Draw light
    if (this.active) {
      p.fill(255, 240, 180, 200);
      p.noStroke();
      p.circle(screen.x, screen.y, 6);
    }

    p.pop();
  }
}

// Ancient Stele entity
export class Stele extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_STELE);
    this.runes = [];
    this.runeGlow = 0;
    
    // Generate random rune patterns
    for (let i = 0; i < 4; i++) {
      this.runes.push({
        x: -6 + Math.random() * 12,
        y: -10 + i * 6,
        size: 2 + Math.random() * 2
      });
    }
  }

  activate() {
    this.active = true;
    return true;
  }

  update(p, gameState) {
    if (this.active) {
      this.runeGlow += 0.08;
    }
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 15);

    p.push();

    // Draw shadow
    p.fill(0, 0, 0, 40);
    p.noStroke();
    p.rect(screen.x - 10, screen.y + 20, 20, 4);

    // Draw stele body
    p.fill(100, 120, 140);
    p.stroke(70, 90, 110);
    p.strokeWeight(2);
    p.rect(screen.x - 8, screen.y - 15, 16, 35, 2);

    // Draw top
    p.fill(120, 140, 160);
    p.triangle(screen.x - 10, screen.y - 15, screen.x + 10, screen.y - 15, screen.x, screen.y - 22);

    // Draw runes
    if (this.active) {
      p.fill(150, 200, 255, 150 + Math.sin(this.runeGlow) * 100);
      p.noStroke();
      for (const rune of this.runes) {
        p.circle(screen.x + rune.x, screen.y + rune.y, rune.size);
      }
    }

    p.pop();
  }
}

// Crystal entity (reflects light)
export class Crystal extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_CRYSTAL);
    this.rotation = 0;
    this.sparkles = [];
  }

  activate() {
    this.active = true;
    // Create sparkle effect
    for (let i = 0; i < 8; i++) {
      this.sparkles.push({
        angle: (Math.PI * 2 * i) / 8,
        dist: 0,
        life: 30
      });
    }
    return true;
  }

  update(p, gameState) {
    if (this.active) {
      this.rotation += 0.02;
    }
    
    // Update sparkles
    this.sparkles = this.sparkles.filter(s => {
      s.dist += 1;
      s.life--;
      return s.life > 0;
    });
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 12);

    p.push();

    // Draw sparkles
    for (const sparkle of this.sparkles) {
      const sx = screen.x + Math.cos(sparkle.angle) * sparkle.dist;
      const sy = screen.y + Math.sin(sparkle.angle) * sparkle.dist;
      p.fill(200, 220, 255, (sparkle.life / 30) * 255);
      p.noStroke();
      p.circle(sx, sy, 3);
    }

    p.translate(screen.x, screen.y);
    p.rotate(this.rotation);

    // Draw crystal
    p.fill(...(this.active ? [180, 220, 255, 200] : [140, 180, 220]));
    p.stroke(...(this.active ? [120, 180, 255] : [100, 140, 180]));
    p.strokeWeight(2);
    
    p.beginShape();
    p.vertex(0, -10);
    p.vertex(6, -2);
    p.vertex(4, 6);
    p.vertex(-4, 6);
    p.vertex(-6, -2);
    p.endShape(p.CLOSE);

    // Inner glow
    if (this.active) {
      p.fill(220, 240, 255, 150);
      p.noStroke();
      p.triangle(0, -6, 3, 0, -3, 0);
    }

    p.pop();
  }
}

// Movable Platform entity
export class Platform extends Entity {
  constructor(gridX, gridY, targetX, targetY) {
    super(gridX, gridY, ENTITY_PLATFORM);
    this.startGridX = gridX;
    this.startGridY = gridY;
    this.targetGridX = targetX;
    this.targetGridY = targetY;
    this.moveProgress = 0;
    this.isMoving = false;
  }

  activate() {
    if (this.active) return false;
    this.active = true;
    this.isMoving = true;
    this.moveProgress = 0;
    return true;
  }

  update(p, gameState) {
    if (this.isMoving) {
      this.moveProgress += 0.03;
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.isMoving = false;
      } else {
        const t = easeInOutQuad(this.moveProgress);
        this.gridX = lerp(this.startGridX, this.targetGridX, t);
        this.gridY = lerp(this.startGridY, this.targetGridY, t);
      }
    }
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 5);

    p.push();

    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screen.x, screen.y + 15, 35, 10);

    // Draw platform
    p.fill(140, 120, 100);
    p.stroke(100, 80, 60);
    p.strokeWeight(2);
    p.rect(screen.x - 16, screen.y - 4, 32, 12, 2);

    // Draw patterns
    p.stroke(...(this.active ? [180, 160, 140] : [120, 100, 80]));
    p.strokeWeight(1);
    for (let i = -12; i <= 12; i += 8) {
      p.line(screen.x + i, screen.y - 2, screen.x + i, screen.y + 6);
    }

    p.pop();
  }
}

// Light-sensitive Switch entity
export class LightSwitch extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_SWITCH);
    this.linkedEntities = [];
  }

  checkLightNearby(entities) {
    for (const entity of entities) {
      if ((entity.type === ENTITY_LANTERN || entity.type === ENTITY_STELE) && entity.active) {
        const dx = Math.abs(entity.gridX - this.gridX);
        const dy = Math.abs(entity.gridY - this.gridY);
        if (dx <= 2 && dy <= 2) {
          return true;
        }
      }
    }
    return false;
  }

  update(p, gameState) {
    const wasActive = this.active;
    this.active = this.checkLightNearby(gameState.entities);
    
    // Trigger linked entities when activated
    if (this.active && !wasActive) {
      for (const linkedEntity of this.linkedEntities) {
        linkedEntity.activate();
      }
    }
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 8);

    p.push();

    // Draw base
    p.fill(100, 100, 120);
    p.stroke(70, 70, 90);
    p.strokeWeight(2);
    p.rect(screen.x - 10, screen.y - 2, 20, 8, 2);

    // Draw sensor
    p.fill(...(this.active ? [255, 255, 150] : [120, 120, 140]));
    p.circle(screen.x, screen.y + 2, 10);

    // Draw glow if active
    if (this.active) {
      p.fill(255, 255, 150, 80);
      p.noStroke();
      p.circle(screen.x, screen.y + 2, 18);
    }

    p.pop();
  }
}

// Dormant Robot entity
export class Robot extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_ROBOT);
    this.eyeGlow = 0;
  }

  activate() {
    if (this.active) return false;
    this.active = true;
    return true;
  }

  update(p, gameState) {
    if (this.active) {
      this.eyeGlow += 0.1;
    }
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 18);

    p.push();

    // Draw shadow
    p.fill(0, 0, 0, 40);
    p.noStroke();
    p.ellipse(screen.x, screen.y + 22, 24, 8);

    // Draw body
    p.fill(140, 150, 160);
    p.stroke(100, 110, 120);
    p.strokeWeight(2);
    p.rect(screen.x - 10, screen.y - 5, 20, 18, 3);

    // Draw head
    p.fill(160, 170, 180);
    p.circle(screen.x, screen.y - 12, 14);

    // Draw eyes
    p.fill(...(this.active ? [100, 255, 200] : [80, 80, 100]));
    p.noStroke();
    const eyeSize = this.active ? 3 + Math.sin(this.eyeGlow) : 2;
    p.circle(screen.x - 4, screen.y - 12, eyeSize);
    p.circle(screen.x + 4, screen.y - 12, eyeSize);

    // Draw antenna
    p.stroke(...(this.active ? [100, 255, 200] : [120, 130, 140]));
    p.strokeWeight(2);
    p.line(screen.x, screen.y - 19, screen.x, screen.y - 24);
    p.fill(...(this.active ? [100, 255, 200] : [140, 150, 160]));
    p.noStroke();
    p.circle(screen.x, screen.y - 24, 4);

    p.pop();
  }
}

// Collectible Core entity
export class Core extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_CORE);
    this.collected = false;
    this.rotation = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  collect() {
    this.collected = true;
    this.visible = false;
    return true;
  }

  update(p, gameState) {
    if (!this.collected) {
      this.rotation += 0.05;
      this.bobPhase += 0.08;
    }
  }

  render(p, gameState) {
    if (this.collected || !this.visible) return;

    const bobOffset = Math.sin(this.bobPhase) * 4;
    const screen = gridToScreen(this.gridX, this.gridY, 15 + bobOffset);

    p.push();

    // Draw glow
    p.fill(100, 200, 255, 60);
    p.noStroke();
    p.circle(screen.x, screen.y, 25);

    p.translate(screen.x, screen.y);
    p.rotate(this.rotation);

    // Draw core
    p.fill(150, 220, 255);
    p.stroke(100, 180, 220);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const r = i % 2 === 0 ? 8 : 5;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);

    // Inner light
    p.fill(200, 240, 255, 180);
    p.noStroke();
    p.circle(0, 0, 4);

    p.pop();
  }
}

// Exit point entity
export class Exit extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_EXIT);
    this.portalPhase = 0;
  }

  update(p, gameState) {
    this.portalPhase += 0.05;
  }

  render(p, gameState) {
    const screen = gridToScreen(this.gridX, this.gridY, 0);

    p.push();

    // Draw portal base
    p.fill(80, 60, 100);
    p.stroke(60, 40, 80);
    p.strokeWeight(2);
    p.ellipse(screen.x, screen.y + 10, 40, 15);

    // Draw portal effect
    for (let i = 3; i > 0; i--) {
      const phase = this.portalPhase + i * 0.5;
      const alpha = 100 - i * 30;
      p.fill(150, 100, 200, alpha);
      p.noStroke();
      p.ellipse(screen.x, screen.y - i * 5, 30 + Math.sin(phase) * 5, 40);
    }

    // Draw portal frame
    p.noFill();
    p.stroke(120, 80, 160);
    p.strokeWeight(3);
    p.arc(screen.x, screen.y, 35, 50, p.PI, p.TWO_PI);

    p.pop();
  }
}