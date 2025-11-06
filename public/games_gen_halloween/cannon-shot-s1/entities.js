import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { OBJECT_TYPES } from './levels.js';

export class Cannon {
  constructor(p, x, y, skin = 0) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.skin = skin;
    this.angle = 0;
    this.barrelLength = 40;
    this.baseRadius = 30;
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    // Base - different styles based on skin
    if (this.skin === 0) {
      // Basic cannon
      p.fill(60, 60, 60);
      p.stroke(40, 40, 40);
      p.strokeWeight(2);
      p.circle(0, 0, this.baseRadius * 2);
    } else if (this.skin === 1) {
      // Golden cannon
      p.fill(255, 215, 0);
      p.stroke(200, 170, 0);
      p.strokeWeight(2);
      p.circle(0, 0, this.baseRadius * 2);
      p.fill(255, 235, 50);
      p.noStroke();
      p.circle(-8, -8, 8);
    } else if (this.skin === 2) {
      // Crystal cannon
      p.fill(150, 200, 255, 200);
      p.stroke(100, 150, 255);
      p.strokeWeight(2);
      p.circle(0, 0, this.baseRadius * 2);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * p.TWO_PI;
        p.fill(200, 230, 255, 150);
        p.noStroke();
        p.circle(p.cos(a) * 15, p.sin(a) * 15, 6);
      }
    } else {
      // Rainbow cannon
      for (let i = 0; i < 8; i++) {
        const hue = (i / 8) * 360;
        p.colorMode(p.HSB);
        p.fill(hue, 80, 90);
        p.noStroke();
        p.arc(0, 0, this.baseRadius * 2, this.baseRadius * 2, 
              (i / 8) * p.TWO_PI, ((i + 1) / 8) * p.TWO_PI, p.PIE);
      }
      p.colorMode(p.RGB);
    }
    
    // Barrel
    p.rotate(this.angle);
    p.fill(70, 70, 70);
    p.stroke(50, 50, 50);
    p.strokeWeight(2);
    p.rect(0, -8, this.barrelLength, 16);
    
    // Barrel tip decoration
    if (this.skin > 0) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.circle(this.barrelLength, 0, 6);
    }
    
    p.pop();
  }
  
  getSpawnPoint() {
    return {
      x: this.x + Math.cos(this.angle) * this.barrelLength,
      y: this.y + Math.sin(this.angle) * this.barrelLength
    };
  }
}

export class Ball {
  constructor(p, x, y) {
    this.p = p;
    this.radius = 8;
    
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'ball',
      restitution: 0.6,
      friction: 0.1,
      density: 0.001
    });
    
    World.add(gameState.world, this.body);
    this.inBucket = false;
    this.bucketId = -1;
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    
    // Ball with shine
    p.fill(255, 255, 255);
    p.noStroke();
    p.circle(0, 0, this.radius * 2);
    
    // Shine effect
    p.fill(255, 255, 255, 150);
    p.circle(-3, -3, 6);
    
    p.pop();
  }
  
  isAtRest() {
    const vel = this.body.velocity;
    return Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1;
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}

export class Bucket {
  constructor(p, x, y, width, height, color, required) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.required = required;
    this.count = 0;
    
    // Create walls and floor
    const thickness = 5;
    this.bodies = [
      Bodies.rectangle(x - width/2 + thickness/2, y, thickness, height, {
        isStatic: true,
        label: 'bucket_wall'
      }),
      Bodies.rectangle(x + width/2 - thickness/2, y, thickness, height, {
        isStatic: true,
        label: 'bucket_wall'
      }),
      Bodies.rectangle(x, y + height/2 - thickness/2, width, thickness, {
        isStatic: true,
        label: 'bucket_floor'
      })
    ];
    
    this.bodies.forEach(b => World.add(gameState.world, b));
  }
  
  render() {
    const p = this.p;
    const thickness = 5;
    
    p.push();
    
    // Bucket container
    p.fill(this.color[0], this.color[1], this.color[2], 100);
    p.noStroke();
    p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // Bucket walls
    p.fill(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.rect(this.x - this.width/2, this.y - this.height/2, thickness, this.height);
    p.rect(this.x + this.width/2 - thickness, this.y - this.height/2, thickness, this.height);
    p.rect(this.x - this.width/2, this.y + this.height/2 - thickness, this.width, thickness);
    
    // Counter
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`${this.count}/${this.required}`, this.x, this.y - this.height/2 - 15);
    
    p.pop();
  }
  
  checkBall(ball) {
    const bx = ball.body.position.x;
    const by = ball.body.position.y;
    
    const left = this.x - this.width/2 + 5;
    const right = this.x + this.width/2 - 5;
    const top = this.y - this.height/2;
    const bottom = this.y + this.height/2;
    
    return bx > left && bx < right && by > top && by < bottom;
  }
  
  destroy() {
    this.bodies.forEach(b => World.remove(gameState.world, b));
  }
}

export class PlaceableObject {
  constructor(p, type, x, y) {
    this.p = p;
    this.type = type;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.body = null;
    this.placed = false;
    
    this.createBody();
  }
  
  createBody() {
    let body = null;
    
    if (this.type === OBJECT_TYPES.RAMP) {
      const w = 100;
      const h = 15;
      body = Bodies.rectangle(this.x, this.y, w, h, {
        isStatic: false,
        label: 'ramp',
        friction: 0.3,
        restitution: 0.3
      });
    } else if (this.type === OBJECT_TYPES.BUMPER) {
      body = Bodies.circle(this.x, this.y, 20, {
        isStatic: false,
        label: 'bumper',
        restitution: 1.5,
        friction: 0.1
      });
    } else if (this.type === OBJECT_TYPES.PLATFORM) {
      const w = 80;
      const h = 12;
      body = Bodies.rectangle(this.x, this.y, w, h, {
        isStatic: false,
        label: 'platform',
        friction: 0.5,
        restitution: 0.2
      });
    }
    
    if (body) {
      Body.setAngle(body, this.angle);
      this.body = body;
    }
  }
  
  place() {
    if (!this.placed && this.body) {
      Body.setStatic(this.body, true);
      World.add(gameState.world, this.body);
      this.placed = true;
    }
  }
  
  move(dx, dy) {
    if (!this.placed) {
      this.x += dx;
      this.y += dy;
      
      // Keep in bounds
      this.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, this.x));
      this.y = Math.max(100, Math.min(CANVAS_HEIGHT - 80, this.y));
      
      if (this.body) {
        Body.setPosition(this.body, { x: this.x, y: this.y });
      }
    }
  }
  
  rotate(delta) {
    if (!this.placed) {
      this.angle += delta;
      if (this.body) {
        Body.setAngle(this.body, this.angle);
      }
    }
  }
  
  render(selected = false) {
    const p = this.p;
    
    if (!this.body) return;
    
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    if (this.type === OBJECT_TYPES.RAMP) {
      const w = 100;
      const h = 15;
      
      if (selected && !this.placed) {
        p.fill(255, 255, 100, 150);
        p.stroke(255, 255, 0);
      } else {
        p.fill(139, 90, 60);
        p.stroke(100, 60, 40);
      }
      p.strokeWeight(2);
      p.rect(-w/2, -h/2, w, h);
      
      // Grip lines
      p.stroke(80, 50, 30);
      for (let i = -40; i < 40; i += 10) {
        p.line(i, -h/2, i, h/2);
      }
    } else if (this.type === OBJECT_TYPES.BUMPER) {
      if (selected && !this.placed) {
        p.fill(255, 150, 150);
        p.stroke(255, 0, 0);
      } else {
        p.fill(255, 100, 100);
        p.stroke(200, 50, 50);
      }
      p.strokeWeight(2);
      p.circle(0, 0, 40);
      
      // Spring effect
      p.noFill();
      p.stroke(255, 200, 200);
      p.circle(0, 0, 30);
      p.circle(0, 0, 20);
    } else if (this.type === OBJECT_TYPES.PLATFORM) {
      const w = 80;
      const h = 12;
      
      if (selected && !this.placed) {
        p.fill(150, 150, 255);
        p.stroke(100, 100, 255);
      } else {
        p.fill(100, 100, 150);
        p.stroke(70, 70, 120);
      }
      p.strokeWeight(2);
      p.rect(-w/2, -h/2, w, h);
      
      // Metal texture
      p.stroke(120, 120, 170);
      p.line(-w/2, 0, w/2, 0);
    }
    
    p.pop();
  }
  
  destroy() {
    if (this.body) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, angle) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: 'obstacle',
      friction: 0.3,
      restitution: 0.3
    });
    
    Body.setAngle(this.body, angle);
    World.add(gameState.world, this.body);
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    const vertices = this.body.vertices;
    const w = Math.abs(vertices[1].x - vertices[0].x);
    const h = Math.abs(vertices[2].y - vertices[1].y);
    
    p.fill(80, 80, 80);
    p.stroke(60, 60, 60);
    p.strokeWeight(2);
    p.rect(-w/2, -h/2, w, h);
    
    // Stripes
    p.stroke(100, 100, 100);
    p.line(-w/2, -h/4, w/2, -h/4);
    p.line(-w/2, h/4, w/2, h/4);
    
    p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}