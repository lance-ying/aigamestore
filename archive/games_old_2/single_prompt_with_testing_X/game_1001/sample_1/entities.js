import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World, Constraint } = Matter;
import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Vehicle {
  constructor(p, x, y) {
    this.p = p;
    
    // Create car body (rectangle)
    this.chassis = Bodies.rectangle(x, y, 60, 20, {
      label: 'chassis',
      density: 0.002,
      friction: 0.3,
      restitution: 0.2
    });
    
    // Create wheels (circles)
    this.wheelRadius = 12;
    this.frontWheel = Bodies.circle(x + 20, y + 18, this.wheelRadius, {
      label: 'wheel',
      density: 0.004,
      friction: 1.0,
      restitution: 0.5
    });
    
    this.backWheel = Bodies.circle(x - 20, y + 18, this.wheelRadius, {
      label: 'wheel',
      density: 0.004,
      friction: 1.0,
      restitution: 0.5
    });
    
    // Create constraints (suspension)
    this.frontAxle = Constraint.create({
      bodyA: this.chassis,
      pointA: { x: 20, y: 10 },
      bodyB: this.frontWheel,
      stiffness: 0.7,
      damping: 0.3,
      length: 8
    });
    
    this.backAxle = Constraint.create({
      bodyA: this.chassis,
      pointA: { x: -20, y: 10 },
      bodyB: this.backWheel,
      stiffness: 0.7,
      damping: 0.3,
      length: 8
    });
    
    // Add to world
    World.add(gameState.world, [
      this.chassis,
      this.frontWheel,
      this.backWheel,
      this.frontAxle,
      this.backAxle
    ]);
    
    this.speed = 0;
    this.maxSpeed = 15;
    this.acceleration = 0.006;
    this.health = 100;
    this.isGrounded = false;
  }
  
  update() {
    // Check if wheels are grounded
    this.isGrounded = this.checkGrounded();
    
    // Log player position periodically
    const currentX = this.chassis.position.x;
    if (Math.abs(currentX - gameState.lastLoggedX) > 50) {
      this.p.logs.player_info.push({
        screen_x: this.chassis.position.x - gameState.camera.x,
        screen_y: this.chassis.position.y - gameState.camera.y,
        game_x: this.chassis.position.x,
        game_y: this.chassis.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastLoggedX = currentX;
    }
    
    // Update distance
    gameState.distance = Math.max(0, Math.floor(this.chassis.position.x / 10));
    
    // Check for crash (upside down or high impact)
    const angle = this.chassis.angle % (2 * Math.PI);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    if ((normalizedAngle > Math.PI * 0.6 && normalizedAngle < Math.PI * 1.4) || 
        this.chassis.position.y > CANVAS_HEIGHT + 200) {
      gameState.crashed = true;
    }
    
    // Consume fuel while moving
    if (this.isGrounded && Math.abs(this.frontWheel.angularVelocity) > 0.1) {
      gameState.fuel -= 0.05;
      if (gameState.fuel <= 0) {
        gameState.fuel = 0;
        gameState.crashed = true;
      }
    }
    
    // Check win condition
    if (gameState.finishLine && this.chassis.position.x >= gameState.finishLine) {
      gameState.won = true;
    }
  }
  
  checkGrounded() {
    // Simple ground check based on wheel velocity
    return Math.abs(this.frontWheel.velocity.y) < 2 || Math.abs(this.backWheel.velocity.y) < 2;
  }
  
  accelerate() {
    if (this.isGrounded) {
      Body.applyForce(this.frontWheel, this.frontWheel.position, { 
        x: this.acceleration, 
        y: 0 
      });
      Body.applyForce(this.backWheel, this.backWheel.position, { 
        x: this.acceleration, 
        y: 0 
      });
    }
  }
  
  brake() {
    if (this.isGrounded) {
      Body.applyForce(this.frontWheel, this.frontWheel.position, { 
        x: -this.acceleration * 0.8, 
        y: 0 
      });
      Body.applyForce(this.backWheel, this.backWheel.position, { 
        x: -this.acceleration * 0.8, 
        y: 0 
      });
    }
  }
  
  balance() {
    // Apply rotational force to chassis
    Body.applyForce(this.chassis, 
      { x: this.chassis.position.x - 10, y: this.chassis.position.y },
      { x: 0, y: -0.003 }
    );
  }
  
  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const camY = gameState.camera.y;
    
    // Draw chassis
    p.push();
    p.translate(this.chassis.position.x - camX, this.chassis.position.y - camY);
    p.rotate(this.chassis.angle);
    p.fill(220, 20, 60);
    p.stroke(180, 0, 30);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 60, 20, 5);
    
    // Draw window
    p.fill(100, 150, 200, 150);
    p.noStroke();
    p.rect(5, -2, 25, 12, 3);
    p.pop();
    
    // Draw wheels
    this.renderWheel(this.frontWheel, camX, camY);
    this.renderWheel(this.backWheel, camX, camY);
  }
  
  renderWheel(wheel, camX, camY) {
    const p = this.p;
    p.push();
    p.translate(wheel.position.x - camX, wheel.position.y - camY);
    p.rotate(wheel.angle);
    
    // Tire
    p.fill(40, 40, 40);
    p.stroke(20, 20, 20);
    p.strokeWeight(2);
    p.circle(0, 0, this.wheelRadius * 2);
    
    // Rim
    p.fill(150, 150, 150);
    p.noStroke();
    p.circle(0, 0, this.wheelRadius);
    
    // Spokes
    p.stroke(100, 100, 100);
    p.strokeWeight(1);
    p.line(-this.wheelRadius / 2, 0, this.wheelRadius / 2, 0);
    p.line(0, -this.wheelRadius / 2, 0, this.wheelRadius / 2);
    p.pop();
  }
}

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.collected = false;
    this.angle = 0;
    this.value = 10;
  }
  
  update() {
    if (this.collected) return;
    
    this.angle += 0.1;
    
    // Check collision with player
    if (gameState.player) {
      const dx = this.x - gameState.player.chassis.position.x;
      const dy = this.y - gameState.player.chassis.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        this.collected = true;
        gameState.coins += 1;
        gameState.score += this.value;
      }
    }
  }
  
  render() {
    if (this.collected) return;
    
    const p = this.p;
    const camX = gameState.camera.x;
    const camY = gameState.camera.y;
    
    p.push();
    p.translate(this.x - camX, this.y - camY);
    p.rotate(this.angle);
    
    // Coin body
    p.fill(255, 215, 0);
    p.stroke(218, 165, 32);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Coin detail
    p.noStroke();
    p.fill(255, 235, 59);
    p.circle(0, 0, this.radius * 1.2);
    
    // Symbol
    p.fill(218, 165, 32);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('$', 0, 0);
    
    p.pop();
  }
}