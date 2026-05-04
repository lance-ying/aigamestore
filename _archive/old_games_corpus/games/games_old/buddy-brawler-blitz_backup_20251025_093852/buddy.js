// buddy.js - Buddy ragdoll entity
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Buddy {
  constructor(p, Matter, x, y) {
    this.p = p;
    this.Matter = Matter;
    
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Composite = Matter.Composite;
    const Constraint = Matter.Constraint;
    
    // Create body parts
    this.head = Bodies.circle(x, y - 40, 15, { 
      restitution: 0.6,
      friction: 0.5,
      density: 0.01
    });
    
    this.torso = Bodies.rectangle(x, y, 30, 50, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.02
    });
    
    this.upperArmL = Bodies.rectangle(x - 25, y - 10, 8, 25, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.005
    });
    
    this.lowerArmL = Bodies.rectangle(x - 25, y + 20, 8, 25, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.005
    });
    
    this.upperArmR = Bodies.rectangle(x + 25, y - 10, 8, 25, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.005
    });
    
    this.lowerArmR = Bodies.rectangle(x + 25, y + 20, 8, 25, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.005
    });
    
    this.upperLegL = Bodies.rectangle(x - 12, y + 40, 10, 30, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.008
    });
    
    this.lowerLegL = Bodies.rectangle(x - 12, y + 75, 10, 30, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.008
    });
    
    this.upperLegR = Bodies.rectangle(x + 12, y + 40, 10, 30, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.008
    });
    
    this.lowerLegR = Bodies.rectangle(x + 12, y + 75, 10, 30, { 
      restitution: 0.4,
      friction: 0.5,
      density: 0.008
    });
    
    // Create joints
    this.neckJoint = Constraint.create({
      bodyA: this.head,
      bodyB: this.torso,
      pointA: { x: 0, y: 10 },
      pointB: { x: 0, y: -25 },
      stiffness: 0.6,
      length: 0
    });
    
    this.shoulderL = Constraint.create({
      bodyA: this.torso,
      bodyB: this.upperArmL,
      pointA: { x: -15, y: -20 },
      pointB: { x: 0, y: -12 },
      stiffness: 0.5,
      length: 0
    });
    
    this.elbowL = Constraint.create({
      bodyA: this.upperArmL,
      bodyB: this.lowerArmL,
      pointA: { x: 0, y: 12 },
      pointB: { x: 0, y: -12 },
      stiffness: 0.5,
      length: 0
    });
    
    this.shoulderR = Constraint.create({
      bodyA: this.torso,
      bodyB: this.upperArmR,
      pointA: { x: 15, y: -20 },
      pointB: { x: 0, y: -12 },
      stiffness: 0.5,
      length: 0
    });
    
    this.elbowR = Constraint.create({
      bodyA: this.upperArmR,
      bodyB: this.lowerArmR,
      pointA: { x: 0, y: 12 },
      pointB: { x: 0, y: -12 },
      stiffness: 0.5,
      length: 0
    });
    
    this.hipL = Constraint.create({
      bodyA: this.torso,
      bodyB: this.upperLegL,
      pointA: { x: -10, y: 25 },
      pointB: { x: 0, y: -15 },
      stiffness: 0.5,
      length: 0
    });
    
    this.kneeL = Constraint.create({
      bodyA: this.upperLegL,
      bodyB: this.lowerLegL,
      pointA: { x: 0, y: 15 },
      pointB: { x: 0, y: -15 },
      stiffness: 0.5,
      length: 0
    });
    
    this.hipR = Constraint.create({
      bodyA: this.torso,
      bodyB: this.upperLegR,
      pointA: { x: 10, y: 25 },
      pointB: { x: 0, y: -15 },
      stiffness: 0.5,
      length: 0
    });
    
    this.kneeR = Constraint.create({
      bodyA: this.upperLegR,
      bodyB: this.lowerLegR,
      pointA: { x: 0, y: 15 },
      pointB: { x: 0, y: -15 },
      stiffness: 0.5,
      length: 0
    });
    
    this.parts = [
      this.head, this.torso,
      this.upperArmL, this.lowerArmL, this.upperArmR, this.lowerArmR,
      this.upperLegL, this.lowerLegL, this.upperLegR, this.lowerLegR
    ];
    
    this.constraints = [
      this.neckJoint, this.shoulderL, this.elbowL, this.shoulderR, this.elbowR,
      this.hipL, this.kneeL, this.hipR, this.kneeR
    ];
    
    this.composite = Composite.create();
    Composite.add(this.composite, this.parts);
    Composite.add(this.composite, this.constraints);
    
    this.color = [150, 200, 255];
    this.hitFlash = 0;
  }
  
  getCenter() {
    return {
      x: this.torso.position.x,
      y: this.torso.position.y
    };
  }
  
  getVelocity() {
    return {
      x: this.torso.velocity.x,
      y: this.torso.velocity.y
    };
  }
  
  applyForce(x, y, forceX, forceY) {
    const Body = this.Matter.Body;
    
    for (let part of this.parts) {
      const dx = part.position.x - x;
      const dy = part.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        Body.applyForce(part, part.position, { x: forceX, y: forceY });
        this.hitFlash = 10;
      }
    }
  }
  
  findClosestPart(x, y) {
    let closest = null;
    let minDist = Infinity;
    
    for (let part of this.parts) {
      const dx = part.position.x - x;
      const dy = part.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        closest = part;
      }
    }
    
    return closest;
  }
  
  update() {
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
    
    const vel = this.getVelocity();
    gameState.buddyVelocity = vel;
  }
  
  draw() {
    const p = this.p;
    
    p.push();
    
    // Draw constraints (joints)
    p.stroke(100);
    p.strokeWeight(2);
    for (let constraint of this.constraints) {
      const posA = constraint.bodyA.position;
      const posB = constraint.bodyB.position;
      p.line(posA.x, posA.y, posB.x, posB.y);
    }
    
    // Draw body parts
    const fillColor = this.hitFlash > 0 ? [255, 200, 200] : this.color;
    p.fill(...fillColor);
    p.stroke(50);
    p.strokeWeight(2);
    
    // Draw limbs (rectangles)
    for (let part of this.parts) {
      if (part === this.head) continue;
      
      p.push();
      p.translate(part.position.x, part.position.y);
      p.rotate(part.angle);
      
      if (part === this.torso) {
        p.rectMode(p.CENTER);
        p.rect(0, 0, 30, 50, 5);
      } else {
        p.rectMode(p.CENTER);
        const w = part === this.upperLegL || part === this.lowerLegL || 
                  part === this.upperLegR || part === this.lowerLegR ? 10 : 8;
        const h = part === this.upperLegL || part === this.lowerLegL || 
                  part === this.upperLegR || part === this.lowerLegR ? 30 : 25;
        p.rect(0, 0, w, h, 3);
      }
      
      p.pop();
    }
    
    // Draw head
    p.circle(this.head.position.x, this.head.position.y, 30);
    
    // Draw face
    p.fill(50);
    p.noStroke();
    p.circle(this.head.position.x - 5, this.head.position.y - 3, 4);
    p.circle(this.head.position.x + 5, this.head.position.y - 3, 4);
    
    p.pop();
  }
}