// bike.js - Player bike entity
import { gameState } from './globals.js';

export class Bike {
  constructor(p, x, y, engine) {
    this.p = p;
    this.engine = engine;
    
    // Matter.js physics bodies
    const Matter = window.Matter;
    
    // Main chassis body
    this.mainBody = Matter.Bodies.rectangle(x, y, 40, 10, {
      density: 0.002,
      friction: 0.3,
      restitution: 0.3
    });
    
    // Wheels
    this.frontWheel = Matter.Bodies.circle(x + 20, y + 12, 8, {
      density: 0.004,
      friction: 1.0,
      restitution: 0.5
    });
    
    this.rearWheel = Matter.Bodies.circle(x - 20, y + 12, 8, {
      density: 0.004,
      friction: 1.0,
      restitution: 0.5
    });
    
    // Constraints to connect wheels to chassis
    this.frontConstraint = Matter.Constraint.create({
      bodyA: this.mainBody,
      bodyB: this.frontWheel,
      pointA: { x: 20, y: 7 },
      pointB: { x: 0, y: 0 },
      stiffness: 0.7,
      length: 5
    });
    
    this.rearConstraint = Matter.Constraint.create({
      bodyA: this.mainBody,
      bodyB: this.rearWheel,
      pointA: { x: -20, y: 7 },
      pointB: { x: 0, y: 0 },
      stiffness: 0.7,
      length: 5
    });
    
    // Add to physics world
    Matter.World.add(engine.world, [
      this.mainBody,
      this.frontWheel,
      this.rearWheel,
      this.frontConstraint,
      this.rearConstraint
    ]);
    
    // Visual properties
    this.trailParticles = [];
    this.landingParticles = [];
    
    // State tracking
    this.groundContacts = 0;
    this.wasAirborne = false;
    this.lastSafeAngle = 0;
    this.startJumpAngle = 0;
    this.totalRotation = 0;
  }
  
  applyRotation(direction) {
    const Matter = window.Matter;
    const torque = direction * 0.0003;
    Matter.Body.setAngularVelocity(this.mainBody, this.mainBody.angularVelocity + torque);
  }
  
  update() {
    // Update ground contact detection
    this.updateGroundContact();
    
    // Update airborne state and flip tracking
    if (this.groundContacts === 0 && !gameState.isAirborne) {
      gameState.isAirborne = true;
      this.wasAirborne = true;
      this.startJumpAngle = this.mainBody.angle;
      this.totalRotation = 0;
    } else if (this.groundContacts > 0 && gameState.isAirborne) {
      // Landing detected
      this.handleLanding();
    }
    
    // Track rotation while airborne
    if (gameState.isAirborne) {
      const angleDiff = this.mainBody.angle - gameState.lastKnownBikeAngle;
      this.totalRotation += angleDiff;
      
      // Check for complete flips
      const fullFlips = Math.floor(Math.abs(this.totalRotation) / (2 * Math.PI));
      if (fullFlips > gameState.flipsInCurrentJump) {
        const newFlips = fullFlips - gameState.flipsInCurrentJump;
        gameState.flipsInCurrentJump = fullFlips;
        gameState.totalFlips += newFlips;
      }
    }
    
    gameState.lastKnownBikeAngle = this.mainBody.angle;
    
    // Update distance traveled
    if (this.mainBody.position.x > gameState.lastDistanceCheckpoint) {
      const distanceGained = this.mainBody.position.x - gameState.lastDistanceCheckpoint;
      gameState.distanceTraveled += distanceGained;
      gameState.lastDistanceCheckpoint = this.mainBody.position.x;
      
      // Award distance points (10 points per 100 units)
      const distancePoints = Math.floor(distanceGained / 10);
      if (distancePoints > 0) {
        gameState.score += distancePoints;
      }
    }
    
    // Update trail particles
    this.updateTrailParticles();
    this.updateLandingParticles();
    
    // Add trail particles when moving fast
    const speed = Math.sqrt(
      this.mainBody.velocity.x ** 2 + this.mainBody.velocity.y ** 2
    );
    if (speed > 3 && this.p.frameCount % 3 === 0) {
      this.trailParticles.push({
        x: this.rearWheel.position.x,
        y: this.rearWheel.position.y,
        life: 20,
        vx: -this.mainBody.velocity.x * 0.2,
        vy: -this.mainBody.velocity.y * 0.2
      });
    }
  }
  
  updateGroundContact() {
    const Matter = window.Matter;
    const pairs = this.engine.pairs.list;
    
    this.groundContacts = 0;
    
    for (let pair of pairs) {
      if (!pair.isActive) continue;
      
      if ((pair.bodyA === this.frontWheel || pair.bodyA === this.rearWheel) ||
          (pair.bodyB === this.frontWheel || pair.bodyB === this.rearWheel)) {
        this.groundContacts++;
      }
    }
  }
  
  handleLanding() {
    gameState.isAirborne = false;
    const angle = this.normalizeAngle(this.mainBody.angle);
    const isSafe = Math.abs(angle) < Math.PI / 6; // 30 degrees
    const isPerfect = Math.abs(angle) < 0.087; // 5 degrees
    
    if (isSafe) {
      // Safe landing
      let landingPoints = 50;
      
      // Award flip points
      if (gameState.flipsInCurrentJump >= 1) {
        if (gameState.flipsInCurrentJump === 1) landingPoints += 100;
        else if (gameState.flipsInCurrentJump === 2) landingPoints += 200;
        else if (gameState.flipsInCurrentJump === 3) landingPoints += 300;
        else landingPoints += 300 + (gameState.flipsInCurrentJump - 3) * 50;
      }
      
      // Perfect landing bonus
      if (isPerfect) {
        landingPoints += 100;
      }
      
      // Speed landing bonus
      const horizontalSpeed = Math.abs(this.mainBody.velocity.x);
      if (horizontalSpeed > 3) {
        const speedBonus = Math.floor((horizontalSpeed - 3) * 10);
        landingPoints += speedBonus;
      }
      
      gameState.score += landingPoints;
      
      // Create landing effect
      this.createLandingEffect();
    }
    
    // Reset flip counter
    gameState.flipsInCurrentJump = 0;
    this.totalRotation = 0;
  }
  
  createLandingEffect() {
    for (let i = 0; i < 10; i++) {
      this.landingParticles.push({
        x: this.frontWheel.position.x,
        y: this.frontWheel.position.y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 30
      });
      this.landingParticles.push({
        x: this.rearWheel.position.x,
        y: this.rearWheel.position.y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 30
      });
    }
  }
  
  updateTrailParticles() {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      if (particle.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  }
  
  updateLandingParticles() {
    for (let i = this.landingParticles.length - 1; i >= 0; i--) {
      const particle = this.landingParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life--;
      
      if (particle.life <= 0) {
        this.landingParticles.splice(i, 1);
      }
    }
  }
  
  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);
    
    // Render trail particles
    for (let particle of this.trailParticles) {
      const alpha = (particle.life / 20) * 150;
      p.fill(0, 255, 255, alpha);
      p.noStroke();
      p.rect(particle.x, particle.y, 3, 3);
    }
    
    // Render landing particles
    for (let particle of this.landingParticles) {
      const alpha = (particle.life / 30) * 200;
      p.fill(255, 255, 0, alpha);
      p.noStroke();
      p.circle(particle.x, particle.y, 4);
    }
    
    // Render wheels
    p.stroke(0, 255, 255);
    p.strokeWeight(3);
    p.noFill();
    p.circle(this.frontWheel.position.x, this.frontWheel.position.y, 16);
    p.circle(this.rearWheel.position.x, this.rearWheel.position.y, 16);
    
    // Render chassis
    p.push();
    p.translate(this.mainBody.position.x, this.mainBody.position.y);
    p.rotate(this.mainBody.angle);
    p.stroke(255, 0, 255);
    p.strokeWeight(3);
    p.noFill();
    p.rect(0, 0, 40, 10);
    p.pop();
    
    // Render constraints as glowing lines
    p.stroke(100, 200, 255, 150);
    p.strokeWeight(2);
    p.line(
      this.mainBody.position.x + Math.cos(this.mainBody.angle) * 20,
      this.mainBody.position.y + Math.sin(this.mainBody.angle) * 20,
      this.frontWheel.position.x,
      this.frontWheel.position.y
    );
    p.line(
      this.mainBody.position.x - Math.cos(this.mainBody.angle) * 20,
      this.mainBody.position.y - Math.sin(this.mainBody.angle) * 20,
      this.rearWheel.position.x,
      this.rearWheel.position.y
    );
    
    p.pop();
  }
  
  getPosition() {
    return {
      x: this.mainBody.position.x,
      y: this.mainBody.position.y
    };
  }
  
  reset(x, y) {
    const Matter = window.Matter;
    
    Matter.Body.setPosition(this.mainBody, { x, y });
    Matter.Body.setVelocity(this.mainBody, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.mainBody, 0);
    Matter.Body.setAngle(this.mainBody, 0);
    
    Matter.Body.setPosition(this.frontWheel, { x: x + 20, y: y + 12 });
    Matter.Body.setVelocity(this.frontWheel, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.frontWheel, 0);
    
    Matter.Body.setPosition(this.rearWheel, { x: x - 20, y: y + 12 });
    Matter.Body.setVelocity(this.rearWheel, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.rearWheel, 0);
    
    this.trailParticles = [];
    this.landingParticles = [];
    this.groundContacts = 0;
    this.totalRotation = 0;
  }
  
  remove() {
    const Matter = window.Matter;
    Matter.World.remove(this.engine.world, [
      this.mainBody,
      this.frontWheel,
      this.rearWheel,
      this.frontConstraint,
      this.rearConstraint
    ]);
  }
}