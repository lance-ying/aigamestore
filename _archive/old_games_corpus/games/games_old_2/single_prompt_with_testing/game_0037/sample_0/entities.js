// entities.js - Entity classes
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_HEIGHT, JUMP_FORCE, PLAYER_SPEED } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 15, {
      label: 'player',
      friction: 0.1,
      restitution: 0,
      density: 0.002,
      frictionAir: 0.01
    });
    World.add(gameState.world, this.body);
    
    this.color = [0, 120, 255];
    this.radius = 15;
    this.isSpinDashing = false;
    this.spinDashTimer = 0;
    this.groundContacts = 0;
    this.lastY = y;
  }

  update() {
    // Check if on ground
    this.checkGroundContact();
    
    // Update spin dash timer
    if (this.isSpinDashing) {
      this.spinDashTimer--;
      if (this.spinDashTimer <= 0) {
        this.isSpinDashing = false;
      }
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - gameState.lastLoggedX);
    const dy = Math.abs(this.body.position.y - gameState.lastLoggedY);
    
    if (dx > 50 || dy > 50) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x - gameState.camera.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastLoggedX = this.body.position.x;
      gameState.lastLoggedY = this.body.position.y;
    }
    
    // Check if fallen off map
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      this.die();
    }
  }

  checkGroundContact() {
    // Simple ground check based on velocity
    if (Math.abs(this.body.velocity.y) < 0.5) {
      this.groundContacts = 5; // Set a few frames of ground contact
    } else if (this.groundContacts > 0) {
      this.groundContacts--;
    }
  }

  isOnGround() {
    return this.groundContacts > 0;
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    this.p.rotate(this.body.angle);
    
    // Draw Sonic
    if (this.isSpinDashing) {
      // Spin dash appearance (spinning ball)
      this.p.fill(255, 200, 0);
      this.p.circle(0, 0, this.radius * 2);
      this.p.fill(255, 100, 0);
      for (let i = 0; i < 4; i++) {
        const angle = this.p.frameCount * 0.3 + i * this.p.PI / 2;
        const x = Math.cos(angle) * 8;
        const y = Math.sin(angle) * 8;
        this.p.circle(x, y, 5);
      }
    } else {
      // Normal Sonic appearance
      this.p.fill(this.color[0], this.color[1], this.color[2]);
      this.p.circle(0, 0, this.radius * 2);
      
      // Eyes
      this.p.fill(255);
      this.p.ellipse(-4, -3, 6, 8);
      this.p.ellipse(4, -3, 6, 8);
      this.p.fill(0);
      this.p.circle(-4, -2, 3);
      this.p.circle(4, -2, 3);
      
      // Quills
      this.p.fill(0, 90, 200);
      this.p.triangle(-10, 0, -15, -5, -12, 5);
      this.p.triangle(-8, 5, -12, 10, -5, 8);
    }
    
    this.p.pop();
  }

  moveLeft() {
    Body.applyForce(this.body, this.body.position, { x: -PLAYER_SPEED, y: 0 });
    // Limit velocity
    if (this.body.velocity.x < -8) {
      Body.setVelocity(this.body, { x: -8, y: this.body.velocity.y });
    }
  }

  moveRight() {
    Body.applyForce(this.body, this.body.position, { x: PLAYER_SPEED, y: 0 });
    // Limit velocity
    if (this.body.velocity.x > 8) {
      Body.setVelocity(this.body, { x: 8, y: this.body.velocity.y });
    }
  }

  jump() {
    if (this.isOnGround()) {
      Body.setVelocity(this.body, { x: this.body.velocity.x, y: -JUMP_FORCE });
      this.groundContacts = 0;
    }
  }

  activateSpinDash() {
    if (!this.isOnGround() && !this.isSpinDashing) {
      this.isSpinDashing = true;
      this.spinDashTimer = 30; // 0.5 seconds at 60fps
      Body.setVelocity(this.body, { 
        x: this.body.velocity.x * 1.5, 
        y: this.body.velocity.y 
      });
    }
  }

  takeDamage() {
    if (gameState.invincibilityTimer > 0) return;
    
    if (gameState.ringCount > 0) {
      // Scatter rings
      this.scatterRings();
      gameState.ringCount = 0;
      gameState.invincibilityTimer = 120; // 2 seconds of invincibility
    } else {
      // Lose a life
      this.die();
    }
  }

  scatterRings() {
    // Scatter some rings around the player
    const ringsToScatter = Math.min(gameState.ringCount, 10);
    for (let i = 0; i < ringsToScatter; i++) {
      const angle = (i / ringsToScatter) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      const ring = new Ring(this.p, 
        this.body.position.x + Math.cos(angle) * 20,
        this.body.position.y + Math.sin(angle) * 20
      );
      ring.body.velocity.x = Math.cos(angle) * speed;
      ring.body.velocity.y = Math.sin(angle) * speed - 3;
      gameState.rings.push(ring);
      gameState.entities.push(ring);
    }
  }

  die() {
    gameState.lives--;
    if (gameState.lives <= 0) {
      gameState.gamePhase = 'GAME_OVER_LOSE';
    } else {
      // Respawn
      Body.setPosition(this.body, { x: 100, y: 200 });
      Body.setVelocity(this.body, { x: 0, y: 0 });
      gameState.invincibilityTimer = 120;
    }
  }
}

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.type = type;
    this.body = Bodies.rectangle(x, y, 25, 25, {
      label: 'enemy',
      isStatic: true
    });
    World.add(gameState.world, this.body);
    
    this.color = [200, 50, 50];
    this.width = 25;
    this.height = 25;
    this.destroyed = false;
    this.moveDirection = 1;
    this.moveSpeed = 1;
    this.moveRange = 100;
    this.startX = x;
  }

  update() {
    if (this.destroyed) return;
    
    // Simple patrol movement
    if (this.type === 'patrol') {
      const dx = this.body.position.x - this.startX;
      if (Math.abs(dx) > this.moveRange) {
        this.moveDirection *= -1;
      }
      Body.setPosition(this.body, {
        x: this.body.position.x + this.moveSpeed * this.moveDirection,
        y: this.body.position.y
      });
    }
  }

  render() {
    if (this.destroyed) return;
    
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw enemy robot
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Eyes
    this.p.fill(255, 0, 0);
    this.p.circle(-6, -5, 6);
    this.p.circle(6, -5, 6);
    
    this.p.pop();
  }

  destroy() {
    this.destroyed = true;
    World.remove(gameState.world, this.body);
    gameState.score += 100;
  }
}

export class Ring {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 8, {
      label: 'ring',
      isStatic: false,
      isSensor: true,
      friction: 0.1,
      restitution: 0.3,
      density: 0.001
    });
    World.add(gameState.world, this.body);
    
    this.collected = false;
    this.radius = 8;
    this.angle = 0;
  }

  update() {
    if (this.collected) return;
    this.angle += 0.1;
  }

  render() {
    if (this.collected) return;
    
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    this.p.rotate(this.angle);
    
    // Draw golden ring
    this.p.noFill();
    this.p.stroke(255, 215, 0);
    this.p.strokeWeight(3);
    this.p.circle(0, 0, this.radius * 2);
    
    this.p.fill(255, 255, 150, 100);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius);
    
    this.p.pop();
  }

  collect() {
    this.collected = true;
    World.remove(gameState.world, this.body);
    gameState.ringCount++;
    gameState.score += 10;
    
    // Check for extra life
    if (gameState.ringCount >= 100) {
      gameState.lives++;
      gameState.ringCount = 0;
    }
  }
}

export class Platform {
  constructor(p, x, y, width, height, color = null) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: true,
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    
    this.color = color || [100, 200, 100];
    this.width = width;
    this.height = height;
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add texture
    this.p.stroke(this.color[0] - 20, this.color[1] - 20, this.color[2] - 20);
    for (let i = -this.width / 2; i < this.width / 2; i += 20) {
      this.p.line(i, -this.height / 2, i, this.height / 2);
    }
    
    this.p.pop();
  }
}

export class GoalPost {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 40, 100, {
      label: 'goal',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 100;
    this.spinAngle = 0;
  }

  update() {
    this.spinAngle += 0.1;
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw post
    this.p.fill(150, 150, 150);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, 10, this.height);
    
    // Draw spinning sign
    this.p.push();
    this.p.rotate(this.spinAngle);
    this.p.fill(255, 215, 0);
    this.p.rect(0, -30, 35, 50);
    this.p.fill(0);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(20);
    this.p.text('★', 0, -30);
    this.p.pop();
    
    this.p.pop();
  }
}

export class Spring {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 40, 20, {
      label: 'spring',
      isStatic: true
    });
    World.add(gameState.world, this.body);
    
    this.width = 40;
    this.height = 20;
    this.compressed = 0;
  }

  update() {
    if (this.compressed > 0) {
      this.compressed--;
    }
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw spring
    this.p.fill(255, 100, 100);
    this.p.rectMode(this.p.CENTER);
    const height = this.height - this.compressed * 2;
    this.p.rect(0, this.compressed, this.width, height);
    
    // Draw spring coils
    this.p.stroke(200, 50, 50);
    this.p.strokeWeight(2);
    this.p.noFill();
    for (let i = -3; i <= 3; i++) {
      this.p.arc(i * 5, 0, 8, 8, 0, this.p.PI);
    }
    
    this.p.pop();
  }

  activate() {
    this.compressed = 10;
  }
}