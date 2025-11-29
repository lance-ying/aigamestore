// entities.js - Entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.radius = 15;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0.2,
      density: 0.01,
      inertia: Infinity // Prevent rotation from affecting movement
    });
    World.add(gameState.world, this.body);
    
    this.color = [255, 200, 0];
    this.forwardSpeed = 3;
    this.jumpForce = 0.15;
    this.isJumping = false;
    this.canJump = true;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    this.onVanishingPlatform = null;
  }
  
  update() {
    // Apply constant forward velocity
    if (gameState.gamePhase === "PLAYING") {
      Body.setVelocity(this.body, {
        x: this.forwardSpeed,
        y: this.body.velocity.y
      });
    }
    
    // Check if on ground (for jump ability)
    this.checkGroundContact();
    
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
    
    // Check if fallen off screen
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", reason: "fell" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  checkGroundContact() {
    // Simple ground check - if velocity is near zero and there's a platform below
    const onGround = Math.abs(this.body.velocity.y) < 0.5;
    this.canJump = onGround;
    
    if (onGround && this.isJumping) {
      this.isJumping = false;
    }
  }
  
  jump() {
    if (this.canJump && !this.isJumping) {
      Body.applyForce(this.body, this.body.position, { x: 0, y: -this.jumpForce });
      this.isJumping = true;
      this.canJump = false;
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw ball with gradient effect
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(200, 150, 0);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, this.radius * 2);
    
    // Add highlight
    this.p.fill(255, 255, 200, 150);
    this.p.noStroke();
    this.p.circle(-5, -5, this.radius * 0.8);
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, w, h, type = 'normal') {
    this.p = p;
    this.type = type; // 'normal', 'vanishing'
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, w, h, {
      label: 'platform',
      isStatic: true,
      friction: 0.8,
      restitution: 0
    });
    World.add(gameState.world, this.body);
    
    this.width = w;
    this.height = h;
    this.vanishTimer = -1;
    this.vanishDelay = 30; // 0.5 seconds at 60 FPS
    this.isVanished = false;
    
    if (type === 'normal') {
      this.color = [100, 200, 100];
    } else if (type === 'vanishing') {
      this.color = [200, 100, 200];
    }
  }
  
  update() {
    if (this.type === 'vanishing' && this.vanishTimer >= 0) {
      this.vanishTimer++;
      if (this.vanishTimer >= this.vanishDelay && !this.isVanished) {
        this.vanish();
      }
    }
  }
  
  triggerVanish() {
    if (this.type === 'vanishing' && this.vanishTimer === -1) {
      this.vanishTimer = 0;
    }
  }
  
  vanish() {
    this.isVanished = true;
    World.remove(gameState.world, this.body);
  }
  
  render() {
    if (this.isVanished) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Visual warning for vanishing platforms
    if (this.type === 'vanishing' && this.vanishTimer >= 0) {
      const alpha = this.p.map(this.vanishTimer, 0, this.vanishDelay, 255, 0);
      this.p.fill(this.color[0], this.color[1], this.color[2], alpha);
    } else {
      this.p.fill(this.color[0], this.color[1], this.color[2]);
    }
    
    this.p.stroke(50);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add platform texture
    this.p.noStroke();
    this.p.fill(255, 255, 255, 30);
    for (let i = 0; i < 3; i++) {
      this.p.rect(0, -this.height/4 + i * this.height/4, this.width * 0.9, 2);
    }
    
    this.p.pop();
  }
}

export class Obstacle {
  constructor(p, x, y, w, h, type = 'static') {
    this.p = p;
    this.type = type; // 'static', 'moving'
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, w, h, {
      label: 'obstacle',
      isStatic: type === 'static',
      friction: 0,
      restitution: 0
    });
    World.add(gameState.world, this.body);
    
    this.width = w;
    this.height = h;
    this.color = [200, 50, 50];
    
    // Moving obstacle properties
    if (type === 'moving') {
      this.startX = x;
      this.moveRange = 100;
      this.moveSpeed = 2;
      this.moveDirection = 1;
    }
  }
  
  update() {
    if (this.type === 'moving') {
      const targetX = this.startX + (this.moveDirection * this.moveRange);
      const distToTarget = Math.abs(targetX - this.body.position.x);
      
      if (distToTarget < 5) {
        this.moveDirection *= -1;
      }
      
      Body.setVelocity(this.body, {
        x: this.moveSpeed * this.moveDirection,
        y: 0
      });
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(150, 0, 0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add danger stripes
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    for (let i = -1; i <= 1; i++) {
      this.p.rect(i * this.width/3, 0, this.width/6, this.height);
    }
    
    this.p.pop();
  }
}

export class Goal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 30;
    this.animOffset = 0;
    
    // Create Matter.js sensor body (doesn't collide but detects overlaps)
    this.body = Bodies.rectangle(x, y, this.size, this.size, {
      label: 'goal',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
  }
  
  update() {
    this.animOffset += 0.1;
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Animated goal marker
    const pulse = this.p.sin(this.animOffset) * 5;
    this.p.fill(0, 255, 0);
    this.p.stroke(0, 200, 0);
    this.p.strokeWeight(3);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.size + pulse, this.size + pulse);
    
    // Star pattern
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(24);
    this.p.text("★", 0, 0);
    
    this.p.pop();
  }
}