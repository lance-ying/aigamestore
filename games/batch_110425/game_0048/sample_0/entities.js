import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World, Constraint } = Matter;
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Candy {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 15, {
      label: 'candy',
      friction: 0.3,
      restitution: 0.6,
      density: 0.002
    });
    World.add(gameState.world, this.body);
    this.color = [255, 100, 150];
    this.collected = false;
  }

  update() {
    // Check if candy fell off screen
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.collected = true;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Candy wrapper style
    this.p.fill(255, 100, 150);
    this.p.stroke(255, 50, 100);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 30);
    
    // Wrapper details
    this.p.stroke(255, 150, 180);
    this.p.line(-10, -10, 10, 10);
    this.p.line(-10, 10, 10, -10);
    
    this.p.pop();
  }
}

export class Monster {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // 'modern' or 'ancient'
    this.body = Bodies.circle(x, y, 25, {
      label: `monster_${type}`,
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.fed = false;
    this.mouthOpen = 0;
    this.happiness = 0;
  }

  update() {
    if (this.fed) {
      this.happiness = Math.min(1, this.happiness + 0.05);
      this.mouthOpen = Math.sin(this.p.frameCount * 0.2) * 0.3 + 0.3;
    } else {
      this.mouthOpen = Math.sin(this.p.frameCount * 0.1) * 0.5 + 0.5;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Body color based on type
    if (this.type === 'modern') {
      this.p.fill(100, 200, 100);
    } else {
      this.p.fill(150, 100, 50);
    }
    
    if (this.fed) {
      this.p.fill(150, 250, 150);
    }
    
    this.p.stroke(50);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 50);
    
    // Eyes
    this.p.fill(255);
    this.p.circle(-10, -5, 12);
    this.p.circle(10, -5, 12);
    this.p.fill(0);
    this.p.circle(-10, -5, 6);
    this.p.circle(10, -5, 6);
    
    // Mouth
    this.p.fill(200, 100, 100);
    this.p.arc(0, 10, 30, 20 * this.mouthOpen, 0, this.p.PI);
    
    // Ancient monster hat
    if (this.type === 'ancient') {
      this.p.fill(200, 150, 100);
      this.p.triangle(-20, -25, 20, -25, 0, -40);
    }
    
    this.p.pop();
  }

  feed() {
    this.fed = true;
  }
}

export class Star {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.body = Bodies.circle(x, y, 12, {
      label: 'star',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.collected = false;
    this.rotation = 0;
    this.scale = 1;
  }

  update() {
    this.rotation += 0.05;
    if (!this.collected) {
      this.scale = 1 + Math.sin(this.p.frameCount * 0.1) * 0.1;
    }
  }

  render() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.rotation);
    this.p.scale(this.scale);
    
    this.p.fill(255, 215, 0);
    this.p.stroke(255, 180, 0);
    this.p.strokeWeight(2);
    
    // Draw star shape
    this.p.beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = (i * this.p.TWO_PI) / 10;
      const radius = i % 2 === 0 ? 15 : 7;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      this.p.vertex(x, y);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }

  collect() {
    this.collected = true;
    World.remove(gameState.world, this.body);
  }
}

export class Rope {
  constructor(p, x1, y1, x2, y2, attachToCandy = false) {
    this.p = p;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.attachToCandy = attachToCandy;
    this.cut = false;
    this.selected = false;
    
    // Create anchor point
    this.anchor = Bodies.circle(x1, y1, 5, {
      isStatic: true,
      label: 'anchor'
    });
    World.add(gameState.world, this.anchor);
    
    // Create constraint (will attach to candy later)
    this.constraint = null;
  }

  attachCandy(candy) {
    if (this.attachToCandy && candy && !this.cut) {
      this.constraint = Constraint.create({
        bodyA: this.anchor,
        bodyB: candy.body,
        length: Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2),
        stiffness: 0.5,
        damping: 0.01
      });
      World.add(gameState.world, this.constraint);
    }
  }

  cutRope() {
    if (!this.cut && this.constraint) {
      World.remove(gameState.world, this.constraint);
      this.constraint = null;
      this.cut = true;
    }
  }

  render() {
    if (this.cut) return;
    
    this.p.push();
    
    if (this.selected) {
      this.p.stroke(255, 255, 0);
      this.p.strokeWeight(4);
    } else {
      this.p.stroke(139, 90, 43);
      this.p.strokeWeight(3);
    }
    
    if (this.constraint && this.constraint.bodyB) {
      const bx = this.constraint.bodyB.position.x;
      const by = this.constraint.bodyB.position.y;
      this.p.line(this.x1, this.y1, bx, by);
    } else {
      this.p.line(this.x1, this.y1, this.x2, this.y2);
    }
    
    this.p.pop();
  }
}

export class Bubble {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.body = Bodies.circle(x, y, 20, {
      label: 'bubble',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.activated = false;
    this.selected = false;
    this.candyInside = null;
    this.lifetime = 0;
  }

  activate(candy) {
    if (!this.activated && candy) {
      this.activated = true;
      this.candyInside = candy;
      this.lifetime = 180; // 3 seconds at 60fps
      // Apply upward force
      Body.setVelocity(candy.body, { x: 0, y: -3 });
    }
  }

  update() {
    if (this.activated) {
      this.lifetime--;
      if (this.candyInside) {
        // Apply continuous upward force
        Body.applyForce(this.candyInside.body, this.candyInside.body.position, { x: 0, y: -0.002 });
      }
      if (this.lifetime <= 0) {
        this.deactivate();
      }
    }
  }

  deactivate() {
    this.activated = false;
    this.candyInside = null;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    if (this.selected) {
      this.p.stroke(255, 255, 0);
      this.p.strokeWeight(3);
    } else {
      this.p.noStroke();
    }
    
    if (this.activated) {
      this.p.fill(150, 200, 255, 100);
    } else {
      this.p.fill(200, 230, 255, 150);
    }
    
    this.p.circle(0, 0, 40);
    
    // Bubble shine
    this.p.fill(255, 255, 255, 200);
    this.p.circle(-8, -8, 8);
    
    this.p.pop();
  }
}

export class AirCushion {
  constructor(p, x, y, width) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 20;
    this.body = Bodies.rectangle(x, y, width, this.height, {
      label: 'cushion',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.activated = false;
    this.selected = false;
    this.cooldown = 0;
  }

  activate(candy) {
    if (!this.activated && this.cooldown <= 0 && candy) {
      this.activated = true;
      this.cooldown = 60;
      // Apply strong upward force
      Body.setVelocity(candy.body, { 
        x: candy.body.velocity.x * 0.8, 
        y: -8 
      });
    }
  }

  update() {
    if (this.activated) {
      this.activated = false;
    }
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    if (this.selected) {
      this.p.stroke(255, 255, 0);
      this.p.strokeWeight(3);
    } else {
      this.p.stroke(100);
      this.p.strokeWeight(2);
    }
    
    if (this.activated) {
      this.p.fill(255, 200, 100);
    } else if (this.cooldown > 0) {
      this.p.fill(150, 150, 150);
    } else {
      this.p.fill(200, 220, 255);
    }
    
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Air lines
    if (!this.activated && this.cooldown <= 0) {
      this.p.stroke(150, 180, 255);
      this.p.strokeWeight(2);
      for (let i = -this.width / 3; i <= this.width / 3; i += 20) {
        this.p.line(i, -5, i, 5);
      }
    }
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height, isStatic = true) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: isStatic,
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    this.color = [100, 150, 100];
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(...this.color);
    this.p.stroke(50);
    this.p.strokeWeight(2);
    
    const vertices = this.body.vertices;
    this.p.beginShape();
    for (let v of vertices) {
      const vx = v.x - this.body.position.x;
      const vy = v.y - this.body.position.y;
      this.p.vertex(vx, vy);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
}