// entities.js - Game entities with Matter.js bodies

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Skateboard {
  constructor(p, x, y) {
    this.p = p;
    
    // Main body (deck)
    this.body = Bodies.rectangle(x, y, 40, 8, {
      label: 'skateboard',
      friction: 0.8,
      restitution: 0.1,
      density: 0.005,
      angle: 0
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [255, 100, 50];
    this.speed = 0;
    this.rotation = 0;
    this.isGrounded = false;
    this.isManual = false;
    this.isGrinding = false;
    this.manualBalance = 0;
    this.groundCheckTimer = 0;
    this.lastY = y;
    this.jumpCooldown = 0;
  }
  
  update() {
    // Check if grounded
    this.checkGrounded();
    
    // Update manual balance
    if (this.isManual && this.isGrounded) {
      this.manualBalance += this.p.random(-0.5, 0.5);
      this.manualBalance = this.p.constrain(this.manualBalance, -20, 20);
      
      // Fail manual if too unbalanced
      if (Math.abs(this.manualBalance) > 15) {
        this.isManual = false;
      }
    } else {
      this.manualBalance *= 0.95;
    }
    
    // Decay rotation when grounded
    if (this.isGrounded && Math.abs(this.rotation) > 0.01) {
      this.rotation *= 0.9;
    }
    
    // Update jump cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }
    
    // Keep skateboard upright when grounded
    if (this.isGrounded && !this.isManual) {
      const targetAngle = 0;
      const currentAngle = this.body.angle;
      const angleDiff = targetAngle - currentAngle;
      Body.setAngularVelocity(this.body, angleDiff * 0.1);
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - gameState.lastLoggedPosition.x);
    const dy = Math.abs(this.body.position.y - gameState.lastLoggedPosition.y);
    
    if (dx > 5 || dy > 5) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      
      gameState.lastLoggedPosition = {
        x: this.body.position.x,
        y: this.body.position.y
      };
    }
    
    this.lastY = this.body.position.y;
  }
  
  checkGrounded() {
    const wasGrounded = this.isGrounded;
    
    // Check if close to ground or obstacle
    const groundY = CANVAS_HEIGHT - 40;
    const isNearGround = this.body.position.y >= groundY - 10;
    
    // Check velocity
    const isStill = Math.abs(this.body.velocity.y) < 2;
    
    this.isGrounded = isNearGround && isStill;
    
    // Reset manual when landing
    if (!wasGrounded && this.isGrounded) {
      this.isManual = false;
      this.isGrinding = false;
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle + this.rotation);
    
    // Draw deck
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, 40, 8, 2);
    
    // Draw wheels
    this.p.fill(50);
    this.p.circle(-15, 5, 6);
    this.p.circle(15, 5, 6);
    
    // Draw grip tape texture
    this.p.fill(0, 50);
    this.p.rect(0, -1, 35, 4);
    
    this.p.pop();
    
    // Draw manual balance indicator
    if (this.isManual) {
      this.p.push();
      this.p.translate(this.body.position.x, this.body.position.y - 30);
      this.p.fill(255, 255, 0);
      this.p.noStroke();
      this.p.rect(-15, 0, 30, 4);
      this.p.fill(255, 0, 0);
      this.p.rect(-15 + this.manualBalance, 0, 2, 4);
      this.p.pop();
    }
  }
  
  push() {
    if (this.isGrounded) {
      const pushForce = { x: 0.015, y: 0 };
      Body.applyForce(this.body, this.body.position, pushForce);
    }
  }
  
  steerLeft() {
    if (this.isGrounded) {
      Body.setAngularVelocity(this.body, -0.05);
    } else {
      this.rotation -= 0.05;
    }
  }
  
  steerRight() {
    if (this.isGrounded) {
      Body.setAngularVelocity(this.body, 0.05);
    } else {
      this.rotation += 0.05;
    }
  }
  
  ollie() {
    if (this.isGrounded && this.jumpCooldown === 0) {
      const jumpForce = { x: 0, y: -0.15 };
      Body.applyForce(this.body, this.body.position, jumpForce);
      this.isGrounded = false;
      this.jumpCooldown = 20;
      return true;
    }
    return false;
  }
  
  kickflip(direction) {
    if (!this.isGrounded) {
      this.rotation += direction * 0.3;
      return true;
    }
    return false;
  }
  
  startManual() {
    if (this.isGrounded && !this.isManual) {
      this.isManual = true;
      this.manualBalance = 0;
      return true;
    }
    return false;
  }
  
  grind(rail) {
    if (rail && !this.isGrounded) {
      const dist = this.p.dist(
        this.body.position.x, this.body.position.y,
        rail.body.position.x, rail.body.position.y
      );
      
      if (dist < 30) {
        // Snap to rail
        Body.setPosition(this.body, {
          x: rail.body.position.x,
          y: rail.body.position.y - 10
        });
        Body.setVelocity(this.body, { x: this.body.velocity.x * 0.8, y: 0 });
        this.isGrinding = true;
        return true;
      }
    }
    return false;
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, type) {
    this.p = p;
    this.type = type; // 'ramp', 'box', 'rail'
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'obstacle',
      isStatic: true,
      friction: 0.8,
      restitution: 0.1
    });
    
    World.add(gameState.world, this.body);
    
    this.color = type === 'ramp' ? [100, 150, 200] : 
                 type === 'box' ? [150, 100, 50] : 
                 [200, 200, 50];
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(0, 50);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    
    const vertices = this.body.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[1].y);
    
    this.p.rect(0, 0, width, height);
    
    // Add texture based on type
    if (this.type === 'ramp') {
      this.p.stroke(0, 30);
      for (let i = 0; i < 5; i++) {
        this.p.line(-width/2 + i * width/5, -height/2, -width/2 + i * width/5, height/2);
      }
    }
    
    this.p.pop();
  }
}

export class Rail {
  constructor(p, x, y, width) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, width, 4, {
      label: 'rail',
      isStatic: true,
      friction: 0.3,
      restitution: 0
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [150, 150, 150];
  }
  
  render() {
    this.p.push();
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    
    const vertices = this.body.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.body.position.x, this.body.position.y, width, 4);
    
    // Draw support poles
    this.p.fill(100);
    this.p.rect(this.body.position.x - width/2, this.body.position.y + 15, 4, 30);
    this.p.rect(this.body.position.x + width/2, this.body.position.y + 15, 4, 30);
    
    this.p.pop();
  }
}

export class Ground {
  constructor(p, x, y, width, height) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'ground',
      isStatic: true,
      friction: 0.8,
      restitution: 0.1
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [80, 80, 80];
  }
  
  render() {
    this.p.push();
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    
    const vertices = this.body.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[1].y);
    
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.body.position.x, this.body.position.y, width, height);
    
    // Add concrete texture
    this.p.stroke(100, 30);
    this.p.strokeWeight(1);
    for (let i = 0; i < width; i += 50) {
      this.p.line(
        this.body.position.x - width/2 + i,
        this.body.position.y - height/2,
        this.body.position.x - width/2 + i,
        this.body.position.y + height/2
      );
    }
    
    this.p.pop();
  }
}