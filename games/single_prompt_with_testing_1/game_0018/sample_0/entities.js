// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RUNWAY_X, RUNWAY_Y, RUNWAY_WIDTH, RUNWAY_HEIGHT } from './globals.js';

export class Aircraft {
  constructor(p, x, y) {
    this.p = p;
    
    // Create aircraft body (box shape for simplicity)
    this.body = Bodies.rectangle(x, y, 40, 20, {
      label: 'aircraft',
      density: 0.002,
      friction: 0.3,
      restitution: 0.1,
      frictionAir: 0.01
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [200, 200, 220];
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    
    // Control surfaces
    this.pitchInput = 0;
    this.rollInput = 0;
    this.yawInput = 0;
  }
  
  update() {
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    
    if (dx > 10 || dy > 10) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
    
    // Update game state from physics
    gameState.altitude = Math.max(0, CANVAS_HEIGHT - this.body.position.y - 100);
    gameState.pitch = -this.body.angle * (180 / Math.PI);
    
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    gameState.speed = Math.sqrt(vx * vx + vy * vy) * 10; // Scale for game
    gameState.verticalSpeed = -vy * 60; // feet per minute
    gameState.heading = (Math.atan2(vx, -vy) * 180 / Math.PI + 360) % 360;
    
    // Apply aerodynamic forces
    this.applyAerodynamics();
    
    // Fuel consumption
    if (gameState.engine1Running || gameState.engine2Running) {
      const consumption = gameState.throttle * 0.01;
      gameState.fuel = Math.max(0, gameState.fuel - consumption);
      
      if (gameState.fuel <= 0) {
        gameState.engine1Running = false;
        gameState.engine2Running = false;
      }
    }
  }
  
  applyAerodynamics() {
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    // Lift force (perpendicular to velocity)
    if (speed > 0.1) {
      const angle = Math.atan2(velocity.y, velocity.x);
      const angleOfAttack = this.body.angle - angle;
      
      // Lift coefficient based on angle of attack and flaps
      let liftCoef = Math.sin(angleOfAttack) * 0.3;
      liftCoef += gameState.flapSetting * 0.05; // Flaps increase lift
      
      // Spoilers reduce lift
      if (gameState.spoilersDeployed) {
        liftCoef *= 0.5;
      }
      
      const liftForce = liftCoef * speed * 0.01;
      const liftX = -Math.sin(angle) * liftForce;
      const liftY = Math.cos(angle) * liftForce;
      
      Body.applyForce(this.body, this.body.position, { x: liftX, y: liftY });
    }
    
    // Thrust from engines
    const engineCount = (gameState.engine1Running ? 1 : 0) + (gameState.engine2Running ? 1 : 0);
    const thrust = gameState.throttle * engineCount * 0.015;
    const thrustX = Math.sin(this.body.angle) * thrust;
    const thrustY = -Math.cos(this.body.angle) * thrust;
    
    Body.applyForce(this.body, this.body.position, { x: thrustX, y: thrustY });
    
    // Control surface forces
    // Pitch (elevator)
    const pitchTorque = this.pitchInput * 0.00005;
    Body.setAngularVelocity(this.body, this.body.angularVelocity + pitchTorque);
    
    // Roll (ailerons)
    const rollTorque = this.rollInput * 0.00008;
    Body.setAngularVelocity(this.body, this.body.angularVelocity + rollTorque);
    
    // Yaw (rudder)
    const yawForce = this.yawInput * 0.001;
    const yawX = Math.cos(this.body.angle) * yawForce;
    const yawY = Math.sin(this.body.angle) * yawForce;
    const offset = { x: Math.sin(this.body.angle) * 20, y: -Math.cos(this.body.angle) * 20 };
    
    Body.applyForce(this.body, { 
      x: this.body.position.x + offset.x, 
      y: this.body.position.y + offset.y 
    }, { x: yawX, y: yawY });
    
    // Drag
    const dragCoef = 0.98 - (gameState.spoilersDeployed ? 0.05 : 0);
    Body.setVelocity(this.body, {
      x: velocity.x * dragCoef,
      y: velocity.y * dragCoef
    });
    
    // Angular drag
    Body.setAngularVelocity(this.body, this.body.angularVelocity * 0.95);
  }
  
  render() {
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Aircraft body
    p.fill(this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, 40, 20);
    
    // Wings
    p.fill(180, 180, 200);
    p.rect(0, 0, 60, 8);
    
    // Tail
    p.rect(0, -10, 8, 15);
    
    // Nose indicator
    p.fill(255, 100, 100);
    p.triangle(0, -10, -5, -5, 5, -5);
    
    // Landing gear indicator
    if (gameState.gearDeployed) {
      p.stroke(100);
      p.strokeWeight(2);
      p.line(-10, 10, -10, 15);
      p.line(10, 10, 10, 15);
    }
    
    // Flaps indicator
    if (gameState.flapSetting > 0) {
      p.noStroke();
      p.fill(150, 150, 170);
      const flapExtend = gameState.flapSetting * 3;
      p.rect(25, 3, 8, 4 + flapExtend);
      p.rect(-25, 3, 8, 4 + flapExtend);
    }
    
    p.pop();
  }
  
  setPitchInput(value) {
    this.pitchInput = Math.max(-1, Math.min(1, value));
  }
  
  setRollInput(value) {
    this.rollInput = Math.max(-1, Math.min(1, value));
  }
  
  setYawInput(value) {
    this.yawInput = Math.max(-1, Math.min(1, value));
  }
}

export class Runway {
  constructor(p) {
    this.p = p;
    
    // Create static runway body
    this.body = Bodies.rectangle(RUNWAY_X, RUNWAY_Y, RUNWAY_WIDTH, RUNWAY_HEIGHT, {
      label: 'runway',
      isStatic: true,
      friction: 0.9,
      restitution: 0.1
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    const p = this.p;
    
    // Runway surface
    p.fill(60, 60, 70);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(RUNWAY_X, RUNWAY_Y, RUNWAY_WIDTH, RUNWAY_HEIGHT);
    
    // Centerline markings
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    for (let i = 0; i < 10; i++) {
      const y = RUNWAY_Y - RUNWAY_HEIGHT / 2 + i * 30 + 15;
      p.line(RUNWAY_X - 2, y, RUNWAY_X + 2, y + 10);
    }
    
    // Threshold markings
    p.strokeWeight(3);
    p.line(RUNWAY_X - 30, RUNWAY_Y + RUNWAY_HEIGHT / 2 - 10, 
           RUNWAY_X + 30, RUNWAY_Y + RUNWAY_HEIGHT / 2 - 10);
  }
}

export class Ground {
  constructor(p) {
    this.p = p;
    
    // Ground bodies (left and right of runway)
    this.bodies = [];
    
    // Left ground
    const leftGround = Bodies.rectangle(RUNWAY_X - RUNWAY_WIDTH / 2 - 100, CANVAS_HEIGHT - 50, 
                                       200, 100, {
      label: 'ground',
      isStatic: true,
      friction: 0.9,
      restitution: 0.1
    });
    
    // Right ground
    const rightGround = Bodies.rectangle(RUNWAY_X + RUNWAY_WIDTH / 2 + 100, CANVAS_HEIGHT - 50,
                                        200, 100, {
      label: 'ground',
      isStatic: true,
      friction: 0.9,
      restitution: 0.1
    });
    
    this.bodies.push(leftGround, rightGround);
    this.bodies.forEach(body => World.add(gameState.world, body));
  }
  
  render() {
    const p = this.p;
    p.fill(100, 150, 100);
    p.noStroke();
    
    this.bodies.forEach(body => {
      p.rectMode(p.CENTER);
      p.rect(body.position.x, body.position.y, 200, 100);
    });
  }
}