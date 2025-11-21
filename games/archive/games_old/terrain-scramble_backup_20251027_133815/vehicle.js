// vehicle.js - Vehicle class and related functions

import { gameState } from './globals.js';

export class Vehicle {
  constructor(x, y, physics) {
    this.physics = physics;
    const { Bodies, Body, Constraint, World } = physics;
    
    // Create vehicle body (chassis)
    const bodyWidth = 40;
    const bodyHeight = 20;
    this.chassis = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
      density: 0.002,
      friction: 0.3,
      restitution: 0.2
    });
    
    // Create wheels
    const wheelRadius = 12;
    const wheelOffset = 15;
    this.frontWheel = Bodies.circle(x + wheelOffset, y + bodyHeight/2 + wheelRadius, wheelRadius, {
      density: 0.004,
      friction: 1.5,
      restitution: 0.2
    });
    
    this.rearWheel = Bodies.circle(x - wheelOffset, y + bodyHeight/2 + wheelRadius, wheelRadius, {
      density: 0.004,
      friction: 1.5,
      restitution: 0.2
    });
    
    // Create constraints (suspension)
    this.frontSuspension = Constraint.create({
      bodyA: this.chassis,
      bodyB: this.frontWheel,
      pointA: { x: wheelOffset, y: bodyHeight/2 },
      pointB: { x: 0, y: 0 },
      stiffness: 0.5,
      damping: 0.1,
      length: wheelRadius + 2
    });
    
    this.rearSuspension = Constraint.create({
      bodyA: this.chassis,
      bodyB: this.rearWheel,
      pointA: { x: -wheelOffset, y: bodyHeight/2 },
      pointB: { x: 0, y: 0 },
      stiffness: 0.5,
      damping: 0.1,
      length: wheelRadius + 2
    });
    
    // Add to world
    World.add(this.physics.engine.world, [
      this.chassis,
      this.frontWheel,
      this.rearWheel,
      this.frontSuspension,
      this.rearSuspension
    ]);
    
    this.bodyWidth = bodyWidth;
    this.bodyHeight = bodyHeight;
    this.wheelRadius = wheelRadius;
    this.isDestroyed = false;
  }
  
  applyAcceleration() {
    const { Body } = this.physics;
    
    // Apply horizontal force to rear wheel to propel vehicle forward
    const forceMagnitude = 0.0015;
    Body.applyForce(this.rearWheel, 
      this.rearWheel.position,
      { x: forceMagnitude, y: 0 }
    );
    
    // Also spin the wheel for visual effect
    Body.setAngularVelocity(this.rearWheel, this.rearWheel.angularVelocity + 0.02);
  }
  
  applyBrake() {
    const { Body } = this.physics;
    
    // Apply reverse force
    const forceMagnitude = -0.001;
    Body.applyForce(this.rearWheel, 
      this.rearWheel.position,
      { x: forceMagnitude, y: 0 }
    );
    
    // Slow down wheel rotation
    Body.setAngularVelocity(this.rearWheel, this.rearWheel.angularVelocity * 0.9);
  }
  
  update() {
    // Update vehicle position for game state
    if (gameState.player) {
      gameState.player.x = this.chassis.position.x;
      gameState.player.y = this.chassis.position.y;
      gameState.player.rotation = this.chassis.angle;
      gameState.player.velocityX = this.chassis.velocity.x;
      gameState.player.velocityY = this.chassis.velocity.y;
    }
  }
  
  getPosition() {
    return {
      x: this.chassis.position.x,
      y: this.chassis.position.y
    };
  }
  
  getRotation() {
    return this.chassis.angle;
  }
  
  destroy() {
    const { World } = this.physics;
    if (!this.isDestroyed) {
      World.remove(this.physics.engine.world, [
        this.chassis,
        this.frontWheel,
        this.rearWheel,
        this.frontSuspension,
        this.rearSuspension
      ]);
      this.isDestroyed = true;
    }
  }
  
  render(p) {
    p.push();
    
    // Render chassis
    p.fill(60, 60, 70);
    p.stroke(40, 40, 50);
    p.strokeWeight(2);
    p.translate(this.chassis.position.x, this.chassis.position.y);
    p.rotate(this.chassis.angle);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.bodyWidth, this.bodyHeight, 3);
    
    // Small window/detail
    p.fill(100, 150, 200);
    p.noStroke();
    p.rect(5, -2, 12, 8, 2);
    
    p.pop();
    
    // Render wheels
    this.renderWheel(p, this.frontWheel);
    this.renderWheel(p, this.rearWheel);
  }
  
  renderWheel(p, wheel) {
    p.push();
    p.translate(wheel.position.x, wheel.position.y);
    p.rotate(wheel.angle);
    
    // Wheel body
    p.fill(30, 30, 30);
    p.stroke(20, 20, 20);
    p.strokeWeight(2);
    p.circle(0, 0, this.wheelRadius * 2);
    
    // Wheel spokes
    p.stroke(60, 60, 60);
    p.strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      p.rotate(p.PI / 4);
      p.line(0, 0, this.wheelRadius - 2, 0);
    }
    
    p.pop();
  }
}