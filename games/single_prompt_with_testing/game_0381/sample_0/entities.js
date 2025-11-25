import { GRID_SIZE, MATERIAL_TYPES, DIRECTIONS } from './globals.js';

export class Material {
  constructor(x, y, type = MATERIAL_TYPES.RAW) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.direction = DIRECTIONS.RIGHT;
    this.speed = 1;
    this.active = true;
  }

  update(components) {
    if (!this.active) return;

    const gridX = Math.floor(this.x / GRID_SIZE);
    const gridY = Math.floor(this.y / GRID_SIZE);

    // Find component at current position
    const component = components.find(c => c.gridX === gridX && c.gridY === gridY);

    if (component) {
      if (component.type === 'PROCESSOR' && !component.processing) {
        component.process(this);
      } else if (component.type === 'ROTATOR') {
        this.direction = (this.direction + 1) % 4;
      } else if (component.type === 'CONVEYOR') {
        this.direction = component.direction;
      }
    }

    // Move based on direction
    switch (this.direction) {
      case DIRECTIONS.UP:
        this.y -= this.speed;
        break;
      case DIRECTIONS.RIGHT:
        this.x += this.speed;
        break;
      case DIRECTIONS.DOWN:
        this.y += this.speed;
        break;
      case DIRECTIONS.LEFT:
        this.x -= this.speed;
        break;
    }
  }

  draw(p) {
    if (!this.active) return;

    p.push();
    const centerX = this.x + GRID_SIZE / 2;
    const centerY = this.y + GRID_SIZE / 2;

    // Draw material based on type
    if (this.type === MATERIAL_TYPES.RAW) {
      p.fill(200, 100, 100);
      p.stroke(150, 50, 50);
    } else if (this.type === MATERIAL_TYPES.PROCESSED) {
      p.fill(100, 200, 100);
      p.stroke(50, 150, 50);
    } else if (this.type === MATERIAL_TYPES.REFINED) {
      p.fill(100, 100, 200);
      p.stroke(50, 50, 150);
    }

    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(centerX, centerY, GRID_SIZE * 0.4, GRID_SIZE * 0.4, 4);
    p.pop();
  }
}

export class Component {
  constructor(gridX, gridY, type, direction = DIRECTIONS.RIGHT) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.direction = direction;
    this.processing = false;
    this.processTimer = 0;
    this.processTime = 60;
  }

  process(material) {
    if (this.type === 'PROCESSOR' && !this.processing) {
      this.processing = true;
      this.processTimer = this.processTime;
      
      // Transform material type
      if (material.type === MATERIAL_TYPES.RAW) {
        material.type = MATERIAL_TYPES.PROCESSED;
      } else if (material.type === MATERIAL_TYPES.PROCESSED) {
        material.type = MATERIAL_TYPES.REFINED;
      }
    }
  }

  update() {
    if (this.processing) {
      this.processTimer--;
      if (this.processTimer <= 0) {
        this.processing = false;
      }
    }
  }

  draw(p) {
    p.push();
    const x = this.gridX * GRID_SIZE;
    const y = this.gridY * GRID_SIZE;

    if (this.type === 'CONVEYOR') {
      p.fill(80, 80, 80);
      p.stroke(60, 60, 60);
      p.strokeWeight(2);
      p.rect(x, y, GRID_SIZE, GRID_SIZE);

      // Draw arrow
      p.fill(255, 200, 100);
      p.noStroke();
      p.push();
      p.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2);
      p.rotate((this.direction * p.PI) / 2);
      p.triangle(10, 0, -5, -6, -5, 6);
      p.pop();
    } else if (this.type === 'PROCESSOR') {
      const processing = this.processing;
      p.fill(...(processing ? [180, 120, 60] : [120, 80, 40]));
      p.stroke(80, 60, 30);
      p.strokeWeight(2);
      p.rect(x, y, GRID_SIZE, GRID_SIZE);

      // Draw gear icon
      p.fill(220, 200, 150);
      p.noStroke();
      const cx = x + GRID_SIZE / 2;
      const cy = y + GRID_SIZE / 2;
      const r = 12;
      for (let i = 0; i < 8; i++) {
        const angle = (i * p.PI) / 4 + (processing ? p.frameCount * 0.1 : 0);
        const x1 = cx + p.cos(angle) * r;
        const y1 = cy + p.sin(angle) * r;
        p.circle(x1, y1, 4);
      }
      p.fill(100, 70, 30);
      p.circle(cx, cy, 8);
    } else if (this.type === 'ROTATOR') {
      p.fill(60, 100, 140);
      p.stroke(40, 80, 120);
      p.strokeWeight(2);
      p.rect(x, y, GRID_SIZE, GRID_SIZE);

      // Draw rotation arrows
      p.noFill();
      p.stroke(150, 200, 255);
      p.strokeWeight(2);
      const cx = x + GRID_SIZE / 2;
      const cy = y + GRID_SIZE / 2;
      p.arc(cx, cy, 20, 20, 0, p.PI * 1.5);
      p.fill(150, 200, 255);
      p.noStroke();
      p.triangle(cx + 10, cy - 10, cx + 6, cy - 14, cx + 14, cy - 14);
    }

    p.pop();
  }
}

export class Spawner {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  draw(p) {
    p.push();
    const x = this.gridX * GRID_SIZE;
    const y = this.gridY * GRID_SIZE;

    p.fill(140, 100, 180);
    p.stroke(100, 60, 140);
    p.strokeWeight(2);
    p.rect(x, y, GRID_SIZE, GRID_SIZE);

    // Draw spawn icon
    p.fill(200, 180, 255);
    p.noStroke();
    const cx = x + GRID_SIZE / 2;
    const cy = y + GRID_SIZE / 2;
    p.circle(cx, cy, 12);
    p.fill(140, 100, 180);
    p.circle(cx, cy, 6);

    p.pop();
  }
}

export class Goal {
  constructor(gridX, gridY, requiredType) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.requiredType = requiredType;
  }

  draw(p) {
    p.push();
    const x = this.gridX * GRID_SIZE;
    const y = this.gridY * GRID_SIZE;

    p.fill(100, 180, 100);
    p.stroke(60, 140, 60);
    p.strokeWeight(2);
    p.rect(x, y, GRID_SIZE, GRID_SIZE);

    // Draw target icon
    p.noFill();
    p.stroke(180, 255, 180);
    p.strokeWeight(2);
    const cx = x + GRID_SIZE / 2;
    const cy = y + GRID_SIZE / 2;
    p.circle(cx, cy, 16);
    p.circle(cx, cy, 8);

    p.pop();
  }
}