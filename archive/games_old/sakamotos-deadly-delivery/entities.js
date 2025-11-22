// entities.js - Game entities and objects
import { gameState } from './globals.js';
import { getPhysics, createBody, createCircleBody, addBody, removeBody } from './physics.js';

export class Package {
  constructor(x, y) {
    const { Matter } = getPhysics();
    this.size = 40;
    this.body = createBody(x, y, this.size, this.size, {
      density: 0.001,
      friction: 0.5,
      restitution: 0.3,
      label: 'package'
    });
    addBody(this.body);
    this.destroyed = false;
  }

  update() {
    if (this.destroyed) return;
    
    // Check if package fell off screen
    if (this.body.position.y > 450) {
      this.destroy();
    }
  }

  draw(p) {
    if (this.destroyed) return;
    
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Package body - red/black
    p.fill(220, 50, 50);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size);
    
    // Target decal
    p.fill(255);
    p.noStroke();
    p.circle(0, 0, 15);
    p.fill(220, 50, 50);
    p.circle(0, 0, 8);
    
    p.pop();
  }

  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      gameState.levelFailed = true;
    }
  }

  getPosition() {
    return {
      x: this.body.position.x,
      y: this.body.position.y
    };
  }
}

export class ConstructionObject {
  constructor(type, x, y, rotation = 0) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.body = null;
    this.createBody();
  }

  createBody() {
    const { Matter } = getPhysics();
    let body;
    
    switch (this.type) {
      case 'block':
        body = createBody(this.x, this.y, 50, 50, {
          isStatic: true,
          angle: this.rotation,
          friction: 0.8,
          label: 'construction'
        });
        break;
      case 'ramp':
        // Create triangle using vertices
        const vertices = [
          { x: -50, y: 25 },
          { x: 50, y: 25 },
          { x: 50, y: -25 }
        ];
        if (Matter && Matter.Bodies) {
          body = Matter.Bodies.fromVertices(this.x, this.y, vertices, {
            isStatic: true,
            angle: this.rotation,
            friction: 0.6,
            label: 'construction'
          });
        }
        break;
      case 'spring':
        body = createBody(this.x, this.y, 80, 20, {
          isStatic: true,
          angle: this.rotation,
          friction: 0.3,
          restitution: 1.5,
          label: 'construction'
        });
        break;
    }
    
    this.body = body;
    if (body) {
      addBody(body);
    }
  }

  draw(p) {
    if (!this.body) return;
    
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    p.strokeWeight(2);
    p.stroke(0);
    
    switch (this.type) {
      case 'block':
        p.fill(120, 120, 120);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 50, 50);
        break;
      case 'ramp':
        p.fill(100, 100, 100);
        p.beginShape();
        p.vertex(-50, 25);
        p.vertex(50, 25);
        p.vertex(50, -25);
        p.endShape(p.CLOSE);
        break;
      case 'spring':
        p.fill(50, 100, 200);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 80, 20);
        // Spring texture
        p.stroke(255);
        p.strokeWeight(1);
        for (let i = -30; i < 30; i += 10) {
          p.line(i, -8, i + 5, 8);
          p.line(i + 5, 8, i + 10, -8);
        }
        break;
    }
    
    p.pop();
  }

  remove() {
    if (this.body) {
      removeBody(this.body);
    }
  }
}

export class Wall {
  constructor(x, y, width, height) {
    this.body = createBody(x, y, width, height, {
      isStatic: true,
      friction: 0.8,
      label: 'wall'
    });
    addBody(this.body);
  }

  draw(p) {
    p.push();
    p.fill(80, 70, 60);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.body.position.x, this.body.position.y, 
           this.body.bounds.max.x - this.body.bounds.min.x,
           this.body.bounds.max.y - this.body.bounds.min.y);
    p.pop();
  }
}

export class Spike {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    // Create triangle sensor
    const { Matter } = getPhysics();
    if (Matter && Matter.Bodies) {
      const vertices = [
        { x: -size/2, y: size/2 },
        { x: size/2, y: size/2 },
        { x: 0, y: -size/2 }
      ];
      this.body = Matter.Bodies.fromVertices(x, y, vertices, {
        isStatic: true,
        isSensor: true,
        label: 'spike'
      });
      addBody(this.body);
    }
  }

  draw(p) {
    p.push();
    p.fill(0);
    p.stroke(50);
    p.strokeWeight(1);
    p.beginShape();
    p.vertex(this.x - this.size/2, this.y + this.size/2);
    p.vertex(this.x + this.size/2, this.y + this.size/2);
    p.vertex(this.x, this.y - this.size/2);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, size, type, path = null, speed = 1) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.path = path;
    this.speed = speed;
    this.currentPathIndex = 0;
    this.direction = 1;
    
    this.body = createCircleBody(x, y, size/2, {
      isStatic: type === 'static',
      isSensor: true,
      label: 'enemy'
    });
    addBody(this.body);
  }

  update() {
    if (this.type === 'moving' && this.path && this.path.length > 1) {
      const target = this.path[this.currentPathIndex];
      const dx = target.x - this.body.position.x;
      const dy = target.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        this.currentPathIndex++;
        if (this.currentPathIndex >= this.path.length) {
          this.currentPathIndex = 0;
        }
      } else {
        const { Matter } = getPhysics();
        if (Matter) {
          Matter.Body.setPosition(this.body, {
            x: this.body.position.x + (dx / dist) * this.speed,
            y: this.body.position.y + (dy / dist) * this.speed
          });
        }
      }
    }
  }

  draw(p) {
    p.push();
    p.fill(60, 60, 70);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.body.position.x, this.body.position.y, this.size);
    
    // Eye/threat indicator
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(this.body.position.x, this.body.position.y, this.size * 0.4);
    p.pop();
  }
}

export class DestructibleBlock {
  constructor(x, y, width, height) {
    this.destroyed = false;
    this.body = createBody(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      label: 'destructible'
    });
    addBody(this.body);
  }

  draw(p) {
    if (this.destroyed) return;
    
    p.push();
    p.fill(160, 120, 80);
    p.stroke(100, 70, 40);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    const width = this.body.bounds.max.x - this.body.bounds.min.x;
    const height = this.body.bounds.max.y - this.body.bounds.min.y;
    p.rect(this.body.position.x, this.body.position.y, width, height);
    
    // Cracks
    p.stroke(100, 70, 40);
    p.line(this.body.position.x - width/4, this.body.position.y - height/2,
           this.body.position.x + width/4, this.body.position.y + height/2);
    p.pop();
  }

  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      removeBody(this.body);
    }
  }
}

export class GoalZone {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.glowing = false;
    this.glowTime = 0;
    
    this.body = createBody(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      label: 'goal'
    });
    addBody(this.body);
  }

  update() {
    if (this.glowing) {
      this.glowTime++;
      if (this.glowTime > 30) {
        this.glowing = false;
        this.glowTime = 0;
      }
    }
  }

  triggerGlow() {
    this.glowing = true;
    this.glowTime = 0;
  }

  draw(p) {
    p.push();
    
    if (this.glowing) {
      const alpha = 255 - (this.glowTime / 30) * 155;
      p.fill(100, 255, 100, alpha);
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.width + 20, this.height + 20);
    }
    
    p.fill(50, 200, 50, 100);
    p.stroke(50, 255, 50);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Target icon
    p.noFill();
    p.stroke(50, 255, 50);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 30);
    p.circle(this.x, this.y, 15);
    p.pop();
  }
}