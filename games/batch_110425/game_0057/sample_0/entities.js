// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World, Composite } = Matter;

import { gameState, AI_BEHAVIORS } from './globals.js';

// Helper function to draw a Matter.js body with p5
export function drawBody(p, body, color) {
  p.push();
  p.translate(body.position.x, body.position.y);
  p.rotate(body.angle);
  
  if (body.circleRadius) {
    p.fill(color);
    p.noStroke();
    p.circle(0, 0, body.circleRadius * 2);
  } else {
    p.fill(color);
    p.noStroke();
    p.beginShape();
    const vertices = body.vertices;
    for (let v of vertices) {
      const vx = v.x - body.position.x;
      const vy = v.y - body.position.y;
      p.vertex(vx, vy);
    }
    p.endShape(p.CLOSE);
  }
  
  p.pop();
}

export class Ragdoll {
  constructor(p, x, y, scale = 1.0, behavior = AI_BEHAVIORS.EXPLORER) {
    this.p = p;
    this.type = 'ragdoll';
    this.scale = scale;
    this.behavior = behavior;
    this.target = null;
    this.moveTimer = 0;
    this.moveDirection = { x: 0, y: 0 };
    
    const radius = 15 * scale;
    
    // Create head
    this.head = Bodies.circle(x, y - 20 * scale, radius, {
      label: 'ragdoll_head',
      friction: 0.5,
      restitution: 0.3,
      density: 0.001
    });
    
    // Create body
    this.torso = Bodies.rectangle(x, y + 5 * scale, 20 * scale, 30 * scale, {
      label: 'ragdoll_torso',
      friction: 0.5,
      restitution: 0.2,
      density: 0.002
    });
    
    // Add to world as composite
    this.parts = [this.head, this.torso];
    this.parts.forEach(part => {
      part.ragdoll = this;
      World.add(gameState.world, part);
    });
    
    this.color = this.getBehaviorColor();
    this.alive = true;
  }
  
  getBehaviorColor() {
    switch (this.behavior) {
      case AI_BEHAVIORS.ATTACKER: return [255, 50, 50];
      case AI_BEHAVIORS.SEEKER: return [50, 255, 50];
      case AI_BEHAVIORS.EXPLORER: return [50, 150, 255];
      default: return [200, 200, 200];
    }
  }
  
  update() {
    if (!this.alive) return;
    
    // Simple AI behavior
    this.moveTimer++;
    
    if (this.behavior === AI_BEHAVIORS.ATTACKER) {
      // Find nearest other ragdoll
      if (this.moveTimer % 30 === 0) {
        this.findTarget();
      }
      if (this.target && this.target.alive) {
        this.moveToward(this.target.torso.position);
      }
    } else if (this.behavior === AI_BEHAVIORS.SEEKER) {
      // Move around randomly
      if (this.moveTimer % 60 === 0) {
        this.moveDirection = {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.005
        };
      }
      Body.applyForce(this.torso, this.torso.position, this.moveDirection);
    } else if (this.behavior === AI_BEHAVIORS.EXPLORER) {
      // Gentle wandering
      if (this.moveTimer % 90 === 0) {
        this.moveDirection = {
          x: (Math.random() - 0.5) * 0.008,
          y: 0
        };
      }
      Body.applyForce(this.torso, this.torso.position, this.moveDirection);
    }
    
    // Check if fallen off screen
    if (this.torso.position.y > 450) {
      this.alive = false;
    }
  }
  
  findTarget() {
    let closest = null;
    let closestDist = Infinity;
    
    gameState.entities.forEach(entity => {
      if (entity.type === 'ragdoll' && entity !== this && entity.alive) {
        const dx = entity.torso.position.x - this.torso.position.x;
        const dy = entity.torso.position.y - this.torso.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entity;
        }
      }
    });
    
    this.target = closest;
  }
  
  moveToward(targetPos) {
    const dx = targetPos.x - this.torso.position.x;
    const dy = targetPos.y - this.torso.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 10) {
      const force = 0.0005 * this.scale;
      Body.applyForce(this.torso, this.torso.position, {
        x: (dx / dist) * force,
        y: (dy / dist) * force * 0.5
      });
    }
  }
  
  render() {
    if (!this.alive) return;
    
    // Draw head
    drawBody(this.p, this.head, this.color);
    
    // Draw torso
    drawBody(this.p, this.torso, this.color);
    
    // Draw simple limbs (lines)
    this.p.stroke(this.color);
    this.p.strokeWeight(3 * this.scale);
    
    // Arms
    this.p.line(
      this.torso.position.x - 10 * this.scale,
      this.torso.position.y,
      this.torso.position.x - 15 * this.scale,
      this.torso.position.y + 15 * this.scale
    );
    this.p.line(
      this.torso.position.x + 10 * this.scale,
      this.torso.position.y,
      this.torso.position.x + 15 * this.scale,
      this.torso.position.y + 15 * this.scale
    );
    
    // Legs
    this.p.line(
      this.torso.position.x - 5 * this.scale,
      this.torso.position.y + 15 * this.scale,
      this.torso.position.x - 8 * this.scale,
      this.torso.position.y + 30 * this.scale
    );
    this.p.line(
      this.torso.position.x + 5 * this.scale,
      this.torso.position.y + 15 * this.scale,
      this.torso.position.x + 8 * this.scale,
      this.torso.position.y + 30 * this.scale
    );
  }
  
  destroy() {
    this.alive = false;
    this.parts.forEach(part => {
      World.remove(gameState.world, part);
    });
  }
}

export class Cannon {
  constructor(p, x, y, force = 1.0) {
    this.p = p;
    this.type = 'cannon';
    this.force = force;
    this.cooldown = 0;
    this.angle = 0;
    
    this.body = Bodies.rectangle(x, y, 50, 25, {
      label: 'cannon',
      isStatic: true,
      angle: 0
    });
    
    World.add(gameState.world, this.body);
    this.color = [100, 100, 100];
    this.projectiles = [];
  }
  
  update() {
    this.cooldown--;
    
    // Auto-fire periodically
    if (this.cooldown <= 0) {
      this.fire();
      this.cooldown = 120; // Fire every 2 seconds
    }
    
    // Update projectiles
    this.projectiles = this.projectiles.filter(proj => {
      const offScreen = proj.position.x < -50 || proj.position.x > 650 ||
                       proj.position.y < -50 || proj.position.y > 450;
      if (offScreen) {
        World.remove(gameState.world, proj);
        return false;
      }
      return true;
    });
  }
  
  fire() {
    const projectile = Bodies.circle(
      this.body.position.x + Math.cos(this.angle) * 30,
      this.body.position.y + Math.sin(this.angle) * 30,
      8,
      {
        label: 'projectile',
        friction: 0.1,
        restitution: 0.8,
        density: 0.01
      }
    );
    
    World.add(gameState.world, projectile);
    
    const speed = 15 * this.force;
    Body.setVelocity(projectile, {
      x: Math.cos(this.angle) * speed,
      y: Math.sin(this.angle) * speed
    });
    
    this.projectiles.push(projectile);
  }
  
  render() {
    // Draw cannon base
    drawBody(this.p, this.body, this.color);
    
    // Draw barrel
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.angle);
    this.p.fill(80, 80, 80);
    this.p.noStroke();
    this.p.rect(0, -5, 30, 10);
    this.p.pop();
    
    // Draw projectiles
    this.projectiles.forEach(proj => {
      drawBody(this.p, proj, [255, 200, 50]);
    });
    
    // Draw cooldown indicator
    if (this.cooldown > 0) {
      const barWidth = 50;
      const barHeight = 5;
      const fillWidth = (this.cooldown / 120) * barWidth;
      
      this.p.noStroke();
      this.p.fill(50);
      this.p.rect(this.body.position.x - barWidth/2, this.body.position.y - 20, barWidth, barHeight);
      this.p.fill(255, 100, 100);
      this.p.rect(this.body.position.x - barWidth/2, this.body.position.y - 20, fillWidth, barHeight);
    }
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
    this.projectiles.forEach(proj => {
      World.remove(gameState.world, proj);
    });
  }
}

export class Mine {
  constructor(p, x, y, radius = 1.0) {
    this.p = p;
    this.type = 'mine';
    this.explosionRadius = 80 * radius;
    this.armed = false;
    this.armTimer = 60; // Arm after 1 second
    this.exploded = false;
    
    this.body = Bodies.circle(x, y, 15, {
      label: 'mine',
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
    this.color = [200, 50, 50];
  }
  
  update() {
    if (this.exploded) return;
    
    if (!this.armed) {
      this.armTimer--;
      if (this.armTimer <= 0) {
        this.armed = true;
      }
    }
  }
  
  checkCollision(otherBody) {
    if (!this.armed || this.exploded) return;
    
    const dx = otherBody.position.x - this.body.position.x;
    const dy = otherBody.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30) {
      this.explode();
    }
  }
  
  explode() {
    if (this.exploded) return;
    this.exploded = true;
    
    // Apply force to nearby objects
    const allBodies = Composite.allBodies(gameState.world);
    
    allBodies.forEach(body => {
      if (body === this.body || body.isStatic) return;
      
      const dx = body.position.x - this.body.position.x;
      const dy = body.position.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.explosionRadius) {
        const forceMag = (1 - dist / this.explosionRadius) * 0.1;
        const force = {
          x: (dx / dist) * forceMag,
          y: (dy / dist) * forceMag
        };
        Body.applyForce(body, body.position, force);
      }
    });
  }
  
  render() {
    if (this.exploded) {
      // Draw explosion effect
      this.p.push();
      this.p.noFill();
      this.p.stroke(255, 100, 0, 200);
      this.p.strokeWeight(3);
      this.p.circle(this.body.position.x, this.body.position.y, this.explosionRadius * 2);
      this.p.stroke(255, 200, 0, 150);
      this.p.strokeWeight(2);
      this.p.circle(this.body.position.x, this.body.position.y, this.explosionRadius * 1.5);
      this.p.pop();
      return;
    }
    
    // Draw mine body
    drawBody(this.p, this.body, this.armed ? this.color : [100, 100, 100]);
    
    // Draw spikes
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.fill(this.color);
    this.p.noStroke();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.p.push();
      this.p.rotate(angle);
      this.p.triangle(0, -15, -3, -10, 3, -10);
      this.p.pop();
    }
    this.p.pop();
    
    // Draw arming indicator
    if (!this.armed) {
      this.p.noStroke();
      this.p.fill(255, 255, 0);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text('...', this.body.position.x, this.body.position.y - 25);
    }
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}

export class Fan {
  constructor(p, x, y, strength = 1.0) {
    this.p = p;
    this.type = 'fan';
    this.strength = strength;
    this.angle = 0; // 0 = right, PI/2 = down, etc.
    this.bladeAngle = 0;
    
    this.body = Bodies.rectangle(x, y, 40, 40, {
      label: 'fan',
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
    this.color = [100, 150, 200];
  }
  
  update() {
    this.bladeAngle += 0.2;
    
    // Apply wind force to nearby objects
    const allBodies = Composite.allBodies(gameState.world);
    const windRange = 150;
    
    allBodies.forEach(body => {
      if (body === this.body || body.isStatic) return;
      
      const dx = body.position.x - this.body.position.x;
      const dy = body.position.y - this.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Check if in front of fan
      const toBodyAngle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(toBodyAngle - this.angle);
      
      if (dist < windRange && angleDiff < Math.PI / 3) {
        const forceMag = (1 - dist / windRange) * 0.001 * this.strength;
        const force = {
          x: Math.cos(this.angle) * forceMag,
          y: Math.sin(this.angle) * forceMag
        };
        Body.applyForce(body, body.position, force);
      }
    });
  }
  
  render() {
    // Draw fan body
    drawBody(this.p, this.body, this.color);
    
    // Draw blades
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.bladeAngle);
    this.p.stroke(150, 200, 255);
    this.p.strokeWeight(2);
    this.p.line(-15, 0, 15, 0);
    this.p.line(0, -15, 0, 15);
    this.p.pop();
    
    // Draw wind lines
    this.p.push();
    this.p.stroke(200, 220, 255, 100);
    this.p.strokeWeight(1);
    for (let i = 0; i < 3; i++) {
      const startX = this.body.position.x + Math.cos(this.angle) * 25;
      const startY = this.body.position.y + Math.sin(this.angle) * 25;
      const endX = startX + Math.cos(this.angle) * (50 + i * 20);
      const endY = startY + Math.sin(this.angle) * (50 + i * 20);
      this.p.line(startX, startY + i * 5 - 5, endX, endY + i * 5 - 5);
    }
    this.p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}

export class Wall {
  constructor(p, x, y, length = 1.0) {
    this.p = p;
    this.type = 'wall';
    this.width = 100 * length;
    this.height = 20;
    
    this.body = Bodies.rectangle(x, y, this.width, this.height, {
      label: 'wall',
      isStatic: true,
      friction: 0.8
    });
    
    World.add(gameState.world, this.body);
    this.color = [80, 60, 40];
  }
  
  update() {
    // Static object, no update needed
  }
  
  render() {
    drawBody(this.p, this.body, this.color);
    
    // Draw wood grain texture
    this.p.push();
    this.p.stroke(100, 80, 60);
    this.p.strokeWeight(1);
    for (let i = -this.width/2; i < this.width/2; i += 10) {
      this.p.line(
        this.body.position.x + i,
        this.body.position.y - this.height/2,
        this.body.position.x + i,
        this.body.position.y + this.height/2
      );
    }
    this.p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}