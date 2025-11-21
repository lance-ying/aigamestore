// entities.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH, POWER_UPS } from './globals.js';

export class Ball {
  constructor(p, x, y) {
    this.p = p;
    this.startX = x;
    this.startY = y;
    
    this.body = Bodies.circle(x, y, 8, {
      label: 'ball',
      friction: 0.1,
      restitution: 0.6,
      density: 0.001,
      frictionAir: 0.01
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [255, 255, 255];
    this.trailPositions = [];
    this.maxTrailLength = 10;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Check if ball is in motion
    const speed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x +
      this.body.velocity.y * this.body.velocity.y
    );
    
    gameState.ballInMotion = speed > 0.1;
    
    // Update trail
    this.trailPositions.push({
      x: this.body.position.x,
      y: this.body.position.y
    });
    
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }
    
    // Log position changes
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    
    if (dx > 5 || dy > 5) {
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
    
    // Check if ball fell off screen
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      this.reset();
    }
  }

  render() {
    // Draw trail
    this.p.push();
    this.p.noFill();
    for (let i = 0; i < this.trailPositions.length - 1; i++) {
      const alpha = (i / this.trailPositions.length) * 100;
      this.p.stroke(255, 255, 255, alpha);
      this.p.strokeWeight(2);
      this.p.line(
        this.trailPositions[i].x,
        this.trailPositions[i].y,
        this.trailPositions[i + 1].x,
        this.trailPositions[i + 1].y
      );
    }
    this.p.pop();
    
    // Draw ball
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(1);
    this.p.circle(0, 0, 16);
    
    // Draw dimples for golf ball effect
    this.p.noStroke();
    this.p.fill(200);
    this.p.circle(-3, -2, 2);
    this.p.circle(3, -2, 2);
    this.p.circle(0, 3, 2);
    
    this.p.pop();
  }

  shoot(angle, power) {
    if (gameState.ballInMotion) return;
    
    const radians = (angle * Math.PI) / 180;
    const force = power / 1000;
    
    let finalForce = force;
    
    // Apply power-up effects
    if (gameState.activePowerUp === POWER_UPS.STICKY) {
      this.body.restitution = 0.1;
      this.body.friction = 0.9;
      gameState.powerUps.sticky--;
      gameState.activePowerUp = null;
    } else if (gameState.activePowerUp === POWER_UPS.BOOST) {
      finalForce *= 1.5;
      gameState.powerUps.boost--;
      gameState.activePowerUp = null;
    } else {
      // Reset to normal physics
      this.body.restitution = 0.6;
      this.body.friction = 0.1;
    }
    
    const forceX = Math.cos(radians) * finalForce;
    const forceY = Math.sin(radians) * finalForce;
    
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    
    gameState.strokes++;
    this.trailPositions = [];
  }

  reset() {
    Body.setPosition(this.body, { x: this.startX, y: this.startY });
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
    this.trailPositions = [];
    gameState.ballInMotion = false;
  }
}

export class Hole {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.color = [50, 50, 50];
    this.flagColor = [255, 0, 0];
    this.capturedBall = false;
  }

  update() {
    if (!gameState.ball) return;
    
    const dx = gameState.ball.body.position.x - this.x;
    const dy = gameState.ball.body.position.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if ball is in hole and slow enough
    const speed = Math.sqrt(
      gameState.ball.body.velocity.x * gameState.ball.body.velocity.x +
      gameState.ball.body.velocity.y * gameState.ball.body.velocity.y
    );
    
    if (distance < this.radius && speed < 2 && !this.capturedBall) {
      this.capturedBall = true;
      Body.setVelocity(gameState.ball.body, { x: 0, y: 0 });
      gameState.gamePhase = "GAME_OVER_WIN";
      
      // Calculate score based on strokes
      const parStrokes = 5;
      const scoreDiff = parStrokes - gameState.strokes;
      const earnedCurrency = Math.max(0, scoreDiff * 10 + 20);
      gameState.currency += earnedCurrency;
      gameState.score += Math.max(0, 100 - gameState.strokes * 10);
      
      gameState.coursesCompleted++;
      
      this.p.logs.game_info.push({
        data: { 
          gamePhase: "GAME_OVER_WIN",
          strokes: gameState.strokes,
          currency: earnedCurrency
        },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  render() {
    this.p.push();
    
    // Draw hole shadow
    this.p.fill(30, 30, 30);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    // Draw hole
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.ellipse(this.x, this.y, this.radius * 1.6, this.radius * 1.6);
    
    // Draw flag pole
    this.p.stroke(100, 100, 100);
    this.p.strokeWeight(2);
    this.p.line(this.x, this.y - 5, this.x, this.y - 35);
    
    // Draw flag
    this.p.fill(this.flagColor);
    this.p.noStroke();
    this.p.triangle(
      this.x, this.y - 35,
      this.x + 15, this.y - 30,
      this.x, this.y - 25
    );
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height, options = {}) {
    this.p = p;
    this.options = options;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: !options.moving,
      friction: options.friction || 0.8,
      restitution: options.restitution || 0.3
    });
    
    World.add(gameState.world, this.body);
    
    this.color = options.color || [100, 200, 100];
    this.width = width;
    this.height = height;
    
    // Moving platform properties
    if (options.moving) {
      this.startX = x;
      this.startY = y;
      this.moveRange = options.moveRange || 100;
      this.moveSpeed = options.moveSpeed || 0.02;
      this.moveDirection = options.moveDirection || 'horizontal';
      this.movePhase = 0;
    }
    
    // Bouncy platform properties
    if (options.bouncy) {
      this.body.restitution = 1.2;
      this.color = [255, 150, 0];
    }
  }

  update() {
    if (this.options.moving) {
      this.movePhase += this.moveSpeed;
      const offset = Math.sin(this.movePhase) * this.moveRange;
      
      if (this.moveDirection === 'horizontal') {
        Body.setPosition(this.body, {
          x: this.startX + offset,
          y: this.startY
        });
      } else {
        Body.setPosition(this.body, {
          x: this.startX,
          y: this.startY + offset
        });
      }
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw platform
    this.p.fill(this.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add texture
    if (this.options.bouncy) {
      this.p.stroke(255, 200, 0);
      this.p.strokeWeight(1);
      for (let i = -this.width / 2 + 10; i < this.width / 2; i += 10) {
        this.p.line(i, -this.height / 2, i, this.height / 2);
      }
    } else {
      this.p.stroke(80, 160, 80);
      this.p.strokeWeight(1);
      for (let i = -this.width / 2 + 5; i < this.width / 2; i += 10) {
        this.p.line(i, 0, i + 5, this.height / 2);
      }
    }
    
    this.p.pop();
  }
}

export class Hazard {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = [200, 50, 50];
    this.animPhase = 0;
    
    // Create sensor body (doesn't collide physically)
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'hazard',
      isStatic: true,
      isSensor: true
    });
    
    World.add(gameState.world, this.body);
  }

  update() {
    this.animPhase += 0.1;
  }

  render() {
    this.p.push();
    
    // Pulsating hazard
    const pulse = Math.sin(this.animPhase) * 0.1 + 0.9;
    
    this.p.fill(this.color[0] * pulse, this.color[1] * pulse, this.color[2] * pulse);
    this.p.stroke(150, 0, 0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Draw warning stripes
    this.p.stroke(255, 255, 0);
    this.p.strokeWeight(2);
    for (let i = -this.width / 2; i < this.width / 2; i += 15) {
      this.p.line(
        this.x + i, this.y - this.height / 2,
        this.x + i + 10, this.y + this.height / 2
      );
    }
    
    this.p.pop();
  }
}

export class StickmanGolfer {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.animPhase = 0;
    this.swinging = false;
    this.swingPhase = 0;
  }

  update() {
    this.animPhase += 0.05;
    
    if (this.swinging) {
      this.swingPhase += 0.3;
      if (this.swingPhase >= Math.PI * 2) {
        this.swinging = false;
        this.swingPhase = 0;
      }
    }
  }

  startSwing() {
    this.swinging = true;
    this.swingPhase = 0;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    const breathe = Math.sin(this.animPhase) * 2;
    
    // Head
    this.p.fill(255, 220, 180);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(0, -20 + breathe, 12);
    
    // Body
    this.p.line(0, -14 + breathe, 0, 5);
    
    // Legs
    this.p.line(0, 5, -8, 15);
    this.p.line(0, 5, 8, 15);
    
    // Arms (animated during swing)
    if (this.swinging) {
      const armAngle = Math.sin(this.swingPhase) * Math.PI;
      this.p.push();
      this.p.translate(0, -5);
      this.p.rotate(armAngle);
      this.p.line(0, 0, -12, 8);
      this.p.pop();
      
      // Club
      this.p.push();
      this.p.translate(0, -5);
      this.p.rotate(armAngle);
      this.p.strokeWeight(3);
      this.p.stroke(139, 69, 19);
      this.p.line(-12, 8, -18, 15);
      this.p.fill(150);
      this.p.noStroke();
      this.p.circle(-18, 15, 6);
      this.p.pop();
    } else {
      this.p.line(0, -5, -10, 5);
      this.p.line(0, -5, 10, 5);
      
      // Club at rest
      this.p.strokeWeight(3);
      this.p.stroke(139, 69, 19);
      this.p.line(10, 5, 15, 12);
      this.p.fill(150);
      this.p.noStroke();
      this.p.circle(15, 12, 6);
    }
    
    this.p.pop();
  }
}