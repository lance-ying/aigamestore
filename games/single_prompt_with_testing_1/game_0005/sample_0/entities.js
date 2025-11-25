// entities.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World, Constraint } = Matter;
import { gameState, MATERIAL_TYPES } from './globals.js';

export class BridgeNode {
  constructor(x, y, isAnchor = false) {
    this.x = x;
    this.y = y;
    this.isAnchor = isAnchor;
    this.connections = [];
  }

  render(p) {
    p.push();
    p.fill(this.isAnchor ? [255, 200, 0] : [100, 255, 100]);
    p.noStroke();
    p.circle(this.x, this.y, this.isAnchor ? 12 : 8);
    p.pop();
  }
}

export class BridgeSegment {
  constructor(p, node1, node2, material) {
    this.p = p;
    this.node1 = node1;
    this.node2 = node2;
    this.material = material;
    this.materialProps = MATERIAL_TYPES[material];
    this.broken = false;
    this.stress = 0;
    this.maxStress = this.materialProps.strength;
    
    // Create Matter.js constraint
    const options = {
      bodyA: null,
      bodyB: null,
      pointA: { x: node1.x, y: node1.y },
      pointB: { x: node2.x, y: node2.y },
      stiffness: this.materialProps.stiffness,
      damping: 0.1,
      length: Math.sqrt(Math.pow(node2.x - node1.x, 2) + Math.pow(node2.y - node1.y, 2)),
      render: { visible: false }
    };
    
    this.constraint = Constraint.create(options);
    World.add(gameState.world, this.constraint);
    
    node1.connections.push(this);
    node2.connections.push(this);
  }

  update() {
    if (this.broken) return;
    
    // Calculate stress based on extension
    if (this.constraint) {
      const currentLength = Math.sqrt(
        Math.pow(this.constraint.pointB.x - this.constraint.pointA.x, 2) +
        Math.pow(this.constraint.pointB.y - this.constraint.pointA.y, 2)
      );
      const originalLength = this.constraint.length;
      const extension = Math.abs(currentLength - originalLength);
      this.stress = (extension / originalLength) * 100;
      
      // Check if segment should break
      if (this.stress > this.maxStress) {
        this.break();
      }
    }
  }

  break() {
    if (!this.broken) {
      this.broken = true;
      if (this.constraint) {
        World.remove(gameState.world, this.constraint);
      }
    }
  }

  render(p) {
    if (this.broken) return;
    
    p.push();
    
    // Color based on stress
    const stressRatio = Math.min(this.stress / this.maxStress, 1);
    const r = 255 * stressRatio + this.materialProps.color[0] * (1 - stressRatio);
    const g = this.materialProps.color[1] * (1 - stressRatio);
    const b = this.materialProps.color[2] * (1 - stressRatio);
    
    p.stroke(r, g, b);
    p.strokeWeight(this.materialProps.thickness);
    p.line(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
    p.pop();
  }
}

export class Vehicle {
  constructor(p, x, y) {
    this.p = p;
    this.width = 40;
    this.height = 20;
    this.wheelRadius = 8;
    this.crossed = false;
    this.fallen = false;
    
    // Create body
    this.body = Bodies.rectangle(x, y, this.width, this.height, {
      label: 'vehicle',
      friction: 0.8,
      density: 0.002,
      restitution: 0.1
    });
    
    // Create wheels
    this.leftWheel = Bodies.circle(x - 12, y + 15, this.wheelRadius, {
      label: 'wheel',
      friction: 1.0,
      density: 0.001,
      restitution: 0.3
    });
    
    this.rightWheel = Bodies.circle(x + 12, y + 15, this.wheelRadius, {
      label: 'wheel',
      friction: 1.0,
      density: 0.001,
      restitution: 0.3
    });
    
    // Connect wheels to body
    this.leftConstraint = Constraint.create({
      bodyA: this.body,
      bodyB: this.leftWheel,
      pointA: { x: -12, y: 10 },
      stiffness: 0.8,
      damping: 0.5
    });
    
    this.rightConstraint = Constraint.create({
      bodyA: this.body,
      bodyB: this.rightWheel,
      pointA: { x: 12, y: 10 },
      stiffness: 0.8,
      damping: 0.5
    });
    
    World.add(gameState.world, [this.body, this.leftWheel, this.rightWheel]);
    World.add(gameState.world, [this.leftConstraint, this.rightConstraint]);
  }

  update() {
    // Apply forward force to wheels
    if (!this.crossed && !this.fallen) {
      const force = 0.0008;
      Body.applyForce(this.leftWheel, this.leftWheel.position, { x: force, y: 0 });
      Body.applyForce(this.rightWheel, this.rightWheel.position, { x: force, y: 0 });
      
      // Check if crossed
      if (this.body.position.x > gameState.endPoint.x - 30) {
        this.crossed = true;
      }
      
      // Check if fallen
      if (this.body.position.y > 450) {
        this.fallen = true;
      }
    }
  }

  render(p) {
    p.push();
    
    // Draw body
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    p.fill(200, 50, 50);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Draw window
    p.fill(150, 200, 255);
    p.rect(8, -3, 15, 10, 2);
    p.pop();
    
    // Draw wheels
    p.push();
    p.fill(40, 40, 40);
    p.noStroke();
    p.circle(this.leftWheel.position.x, this.leftWheel.position.y, this.wheelRadius * 2);
    p.circle(this.rightWheel.position.x, this.rightWheel.position.y, this.wheelRadius * 2);
    p.pop();
  }

  remove() {
    World.remove(gameState.world, [
      this.body,
      this.leftWheel,
      this.rightWheel,
      this.leftConstraint,
      this.rightConstraint
    ]);
  }
}

export class Terrain {
  constructor(x, y, width, height) {
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'terrain',
      isStatic: true,
      friction: 1.0
    });
    
    World.add(gameState.world, this.body);
    this.color = [100, 180, 100];
  }

  render(p) {
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    p.fill(this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    
    const vertices = this.body.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[1].y);
    p.rect(0, 0, width, height);
    p.pop();
  }
}