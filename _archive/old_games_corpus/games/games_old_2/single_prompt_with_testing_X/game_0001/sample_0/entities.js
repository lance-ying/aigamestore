// entities.js - Entity classes with Matter.js bodies

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_HEIGHT } from './globals.js';

// Helper function to draw Matter.js bodies with p5.js
export function drawBody(p, body, fillColor, strokeColor = null) {
  p.push();
  p.translate(body.position.x, body.position.y);
  p.rotate(body.angle);

  if (fillColor) {
    p.fill(fillColor);
  }
  if (strokeColor) {
    p.stroke(strokeColor);
    p.strokeWeight(2);
  } else {
    p.noStroke();
  }

  if (body.circleRadius) {
    p.circle(0, 0, body.circleRadius * 2);
  } else {
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

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 24, 32, {
      label: 'player',
      friction: 0.3,
      restitution: 0,
      density: 0.002,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);

    this.health = 3;
    this.maxHealth = 3;
    this.grounded = false;
    this.jumpPower = -12;
    this.jumpHoldPower = -0.3;
    this.isJumping = false;
    this.jumpHoldFrames = 0;
    this.maxJumpHoldFrames = 15;
    this.invulnerable = false;
    this.invulnerableFrames = 0;
    this.maxInvulnerableFrames = 60;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Check if grounded
    this.checkGrounded();

    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerableFrames++;
      if (this.invulnerableFrames >= this.maxInvulnerableFrames) {
        this.invulnerable = false;
        this.invulnerableFrames = 0;
      }
    }

    // Cap horizontal velocity
    if (Math.abs(this.body.velocity.x) > 8) {
      Body.setVelocity(this.body, {
        x: Math.sign(this.body.velocity.x) * 8,
        y: this.body.velocity.y
      });
    }

    // Check for falling into pit
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.die();
    }

    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    if (dx > 20 || dy > 20) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x - gameState.camera.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }

  checkGrounded() {
    // Simple ground check - if vertical velocity is near zero and position is stable
    this.grounded = Math.abs(this.body.velocity.y) < 0.5 && this.body.position.y < CANVAS_HEIGHT - 50;
  }

  moveLeft() {
    const force = this.grounded ? 0.0015 : 0.0008;
    Body.applyForce(this.body, this.body.position, { x: -force, y: 0 });
  }

  moveRight() {
    const force = this.grounded ? 0.0015 : 0.0008;
    Body.applyForce(this.body, this.body.position, { x: force, y: 0 });
  }

  jump() {
    if (this.grounded && !this.isJumping) {
      Body.setVelocity(this.body, { 
        x: this.body.velocity.x, 
        y: this.jumpPower 
      });
      this.isJumping = true;
      this.jumpHoldFrames = 0;
    }
  }

  jumpHold() {
    if (this.isJumping && this.jumpHoldFrames < this.maxJumpHoldFrames && this.body.velocity.y < 0) {
      Body.applyForce(this.body, this.body.position, { 
        x: 0, 
        y: this.jumpHoldPower 
      });
      this.jumpHoldFrames++;
    }
  }

  jumpRelease() {
    this.isJumping = false;
  }

  takeDamage(amount = 1) {
    if (this.invulnerable) return;
    
    this.health -= amount;
    gameState.testData.damageTaken++;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    } else {
      this.invulnerable = true;
      this.invulnerableFrames = 0;
    }
  }

  heal(amount = 1) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    this.p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", reason: "player_died" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  render(offsetX = 0) {
    const screenX = this.body.position.x - offsetX;
    
    // Draw player body (leprechaun)
    this.p.push();
    this.p.translate(screenX, this.body.position.y);
    
    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(this.p.frameCount / 5) % 2 === 0) {
      this.p.pop();
      return;
    }

    // Body (green suit)
    this.p.fill(34, 139, 34);
    this.p.noStroke();
    this.p.rect(-12, -8, 24, 16);

    // Head
    this.p.fill(255, 220, 177);
    this.p.circle(0, -20, 16);

    // Hat
    this.p.fill(0, 100, 0);
    this.p.rect(-8, -32, 16, 8);
    this.p.rect(-10, -28, 20, 4);
    
    // Hat buckle
    this.p.fill(255, 215, 0);
    this.p.rect(-3, -30, 6, 4);

    // Eyes
    this.p.fill(0);
    this.p.circle(-4, -20, 3);
    this.p.circle(4, -20, 3);

    // Legs
    this.p.fill(139, 69, 19);
    this.p.rect(-8, 8, 6, 8);
    this.p.rect(2, 8, 6, 8);

    this.p.pop();
  }

  getScreenPosition(offsetX = 0) {
    return {
      x: this.body.position.x - offsetX,
      y: this.body.position.y
    };
  }
}

export class Platform {
  constructor(p, x, y, width, height, isStatic = true) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: isStatic,
      friction: 0.8,
      restitution: 0
    });
    World.add(gameState.world, this.body);
    this.width = width;
    this.height = height;
    this.color = [101, 67, 33]; // Brown
  }

  render(offsetX = 0) {
    const screenX = this.body.position.x - offsetX;
    this.p.push();
    this.p.translate(screenX, this.body.position.y);
    
    // Main platform
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Grass top
    this.p.fill(34, 139, 34);
    this.p.rect(-this.width / 2, -this.height / 2, this.width, 4);
    
    // Texture lines
    this.p.stroke(80, 50, 20);
    this.p.strokeWeight(1);
    for (let i = -this.width / 2; i < this.width / 2; i += 20) {
      this.p.line(i, -this.height / 2 + 4, i, this.height / 2);
    }
    
    this.p.pop();
  }
}

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 10, {
      label: 'coin',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.collected = false;
    this.rotation = 0;
    this.value = 10;
  }

  update() {
    this.rotation += 0.05;
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.score += this.value;
      gameState.testData.coinsCollected++;
      World.remove(gameState.world, this.body);
    }
  }

  render(offsetX = 0) {
    if (this.collected) return;
    
    const screenX = this.body.position.x - offsetX;
    this.p.push();
    this.p.translate(screenX, this.body.position.y);
    this.p.rotate(this.rotation);
    
    // Coin body
    this.p.fill(255, 215, 0);
    this.p.stroke(218, 165, 32);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 18);
    
    // Shine effect
    this.p.fill(255, 255, 150);
    this.p.noStroke();
    this.p.circle(-3, -3, 6);
    
    this.p.pop();
  }
}

export class Cloverleaf {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 12, {
      label: 'cloverleaf',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  update() {
    // Bobbing animation
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      if (gameState.player) {
        gameState.player.heal(1);
      }
      World.remove(gameState.world, this.body);
    }
  }

  render(offsetX = 0) {
    if (this.collected) return;
    
    const screenX = this.body.position.x - offsetX;
    const bob = Math.sin(this.p.frameCount * 0.1 + this.bobOffset) * 3;
    
    this.p.push();
    this.p.translate(screenX, this.body.position.y + bob);
    
    // Draw four-leaf clover
    this.p.fill(0, 200, 0);
    this.p.noStroke();
    
    // Four leaves
    this.p.circle(-5, 0, 10);
    this.p.circle(5, 0, 10);
    this.p.circle(0, -5, 10);
    this.p.circle(0, 5, 10);
    
    // Center
    this.p.fill(0, 150, 0);
    this.p.circle(0, 0, 6);
    
    // Stem
    this.p.stroke(0, 150, 0);
    this.p.strokeWeight(2);
    this.p.line(0, 5, 0, 12);
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type = 'walker') {
    this.p = p;
    this.type = type;
    this.body = Bodies.rectangle(x, y, 24, 24, {
      label: 'enemy',
      friction: 0.3,
      restitution: 0,
      density: 0.001
    });
    World.add(gameState.world, this.body);
    
    this.moveSpeed = 0.0008;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.patrolDistance = 100;
    this.startX = x;
    this.defeated = false;
    this.color = [200, 50, 50];
  }

  update() {
    if (this.defeated) return;

    // Simple patrol AI
    if (Math.abs(this.body.position.x - this.startX) > this.patrolDistance) {
      this.direction *= -1;
    }

    Body.applyForce(this.body, this.body.position, { 
      x: this.moveSpeed * this.direction, 
      y: 0 
    });

    // Cap velocity
    if (Math.abs(this.body.velocity.x) > 2) {
      Body.setVelocity(this.body, {
        x: Math.sign(this.body.velocity.x) * 2,
        y: this.body.velocity.y
      });
    }
  }

  defeat() {
    if (!this.defeated) {
      this.defeated = true;
      gameState.testData.enemiesDefeated++;
      World.remove(gameState.world, this.body);
    }
  }

  render(offsetX = 0) {
    if (this.defeated) return;
    
    const screenX = this.body.position.x - offsetX;
    this.p.push();
    this.p.translate(screenX, this.body.position.y);
    
    // Enemy body (simple blob monster)
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.ellipse(0, 0, 24, 20);
    
    // Eyes
    this.p.fill(255);
    this.p.ellipse(-6, -4, 8, 10);
    this.p.ellipse(6, -4, 8, 10);
    
    // Pupils
    this.p.fill(0);
    this.p.circle(-6, -2, 4);
    this.p.circle(6, -2, 4);
    
    // Mouth
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.arc(0, 2, 10, 8, 0, this.p.PI);
    
    this.p.pop();
  }
}

export class Flag {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.body = Bodies.rectangle(x, y, 20, 100, {
      label: 'flag',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    this.reached = false;
  }

  reach() {
    if (!this.reached) {
      this.reached = true;
      gameState.gamePhase = "GAME_OVER_WIN";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", reason: "level_complete" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  render(offsetX = 0) {
    const screenX = this.x - offsetX;
    this.p.push();
    this.p.translate(screenX, this.y);
    
    // Pole
    this.p.stroke(100);
    this.p.strokeWeight(4);
    this.p.line(0, 0, 0, -80);
    
    // Flag
    this.p.noStroke();
    this.p.fill(255, 0, 0);
    this.p.beginShape();
    this.p.vertex(0, -80);
    this.p.vertex(50, -65);
    this.p.vertex(0, -50);
    this.p.endShape(this.p.CLOSE);
    
    // Checkered pattern
    this.p.fill(255);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          this.p.rect(i * 8 + 4, -76 + j * 8, 8, 8);
        }
      }
    }
    
    this.p.pop();
  }
}