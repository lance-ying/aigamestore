// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, Constraint } = Matter;
import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Candy {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 20, {
      label: 'candy',
      friction: 0.3,
      restitution: 0.4,
      density: 0.002
    });
    this.color = [255, 50, 50];
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
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

    // Check if fell off screen
    if (this.body.position.y > CANVAS_HEIGHT + 50) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "GAME_OVER_LOSE";
        this.p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "fell_off_screen" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Main candy circle
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(0, 0, 40);
    
    // White swirl pattern
    this.p.stroke(255);
    this.p.strokeWeight(3);
    this.p.noFill();
    this.p.arc(-5, -5, 15, 15, 0, this.p.PI);
    this.p.arc(5, 5, 15, 15, this.p.PI, this.p.TWO_PI);
    
    this.p.pop();
  }

  applyMagicFinger() {
    if (!gameState.magicFingerUsed) {
      Body.applyForce(this.body, this.body.position, { x: 0, y: -0.05 });
      gameState.magicFingerUsed = true;
    }
  }
}

export class OmNom {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.body = Bodies.rectangle(x, y, 80, 80, {
      label: 'omnom',
      isStatic: true,
      isSensor: true
    });
    this.mouthOpen = false;
    this.eating = false;
    this.eatProgress = 0;
  }

  update() {
    // Check proximity to candy
    if (gameState.candy) {
      const dx = this.body.position.x - gameState.candy.body.position.x;
      const dy = this.body.position.y - gameState.candy.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.mouthOpen = dist < 100;
    }

    if (this.eating) {
      this.eatProgress += 0.05;
      if (this.eatProgress >= 1) {
        this.eating = false;
        this.eatProgress = 0;
      }
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Head
    this.p.fill(100, 200, 100);
    this.p.noStroke();
    this.p.ellipse(0, 0, 80, 90);
    
    // Eyes
    this.p.fill(255);
    this.p.ellipse(-15, -10, 20, 25);
    this.p.ellipse(15, -10, 20, 25);
    this.p.fill(0);
    this.p.ellipse(-15, -5, 10, 12);
    this.p.ellipse(15, -5, 10, 12);
    
    // Horns
    this.p.fill(80, 160, 80);
    this.p.triangle(-25, -30, -20, -45, -15, -30);
    this.p.triangle(15, -30, 20, -45, 25, -30);
    
    // Mouth
    const mouthSize = this.mouthOpen ? 30 : 15;
    this.p.fill(200, 100, 100);
    this.p.arc(0, 15, 50, mouthSize, 0, this.p.PI);
    
    // Eating animation
    if (this.eating) {
      this.p.fill(255, 255, 0, 200 * (1 - this.eatProgress));
      this.p.ellipse(0, -20, 30 * (1 + this.eatProgress), 30 * (1 + this.eatProgress));
    }
    
    this.p.pop();
  }

  startEating() {
    this.eating = true;
    this.eatProgress = 0;
  }
}

export class Star {
  constructor(p, x, y, index) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.index = index;
    this.body = Bodies.circle(x, y, 15, {
      label: 'star',
      isStatic: true,
      isSensor: true
    });
    this.collected = false;
    this.collectAnimation = 0;
  }

  update() {
    if (this.collected && this.collectAnimation < 1) {
      this.collectAnimation += 0.05;
    }
  }

  render() {
    if (this.collected && this.collectAnimation >= 1) return;

    this.p.push();
    this.p.translate(this.x, this.y);
    
    const alpha = this.collected ? 255 * (1 - this.collectAnimation) : 255;
    const scale = this.collected ? 1 + this.collectAnimation : 1;
    
    this.p.fill(255, 215, 0, alpha);
    this.p.noStroke();
    
    // Draw 5-point star
    this.p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = this.p.TWO_PI * i / 5 - this.p.HALF_PI;
      const x = Math.cos(angle) * 15 * scale;
      const y = Math.sin(angle) * 15 * scale;
      this.p.vertex(x, y);
      
      const angle2 = angle + this.p.TWO_PI / 10;
      const x2 = Math.cos(angle2) * 7 * scale;
      const y2 = Math.sin(angle2) * 7 * scale;
      this.p.vertex(x2, y2);
    }
    this.p.endShape(this.p.CLOSE);
    
    // Particles
    if (this.collected && this.collectAnimation < 0.5) {
      for (let i = 0; i < 5; i++) {
        const angle = this.p.TWO_PI * i / 5;
        const dist = this.collectAnimation * 30;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        this.p.fill(255, 215, 0, 200 * (1 - this.collectAnimation * 2));
        this.p.circle(px, py, 5);
      }
    }
    
    this.p.pop();
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      this.collectAnimation = 0;
      gameState.starsCollected[this.index] = true;
      gameState.score += 100;
    }
  }
}

export class Rope {
  constructor(p, bodyA, bodyB, pointA, pointB) {
    this.p = p;
    this.constraint = Constraint.create({
      bodyA: bodyA,
      bodyB: bodyB,
      pointA: pointA || { x: 0, y: 0 },
      pointB: pointB || { x: 0, y: 0 },
      stiffness: 0.9,
      length: 0
    });
    this.cut = false;
    this.cutAnimation = 0;
  }

  update() {
    if (this.cut && this.cutAnimation < 1) {
      this.cutAnimation += 0.1;
    }
  }

  render() {
    if (this.cut && this.cutAnimation >= 1) return;

    const posA = this.constraint.bodyA 
      ? {
          x: this.constraint.bodyA.position.x + this.constraint.pointA.x,
          y: this.constraint.bodyA.position.y + this.constraint.pointA.y
        }
      : this.constraint.pointA;
    
    const posB = this.constraint.bodyB
      ? {
          x: this.constraint.bodyB.position.x + this.constraint.pointB.x,
          y: this.constraint.bodyB.position.y + this.constraint.pointB.y
        }
      : this.constraint.pointB;

    const alpha = this.cut ? 255 * (1 - this.cutAnimation) : 255;
    
    this.p.push();
    this.p.stroke(101, 67, 33, alpha);
    this.p.strokeWeight(3);
    this.p.line(posA.x, posA.y, posB.x, posB.y);
    this.p.pop();
  }

  cutRope() {
    if (!this.cut) {
      this.cut = true;
      this.cutAnimation = 0;
    }
  }
}

export class AirCushion {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'air_cushion',
      isStatic: true,
      isSensor: true
    });
    this.active = false;
    this.activationProgress = 0;
  }

  update() {
    if (this.active) {
      this.activationProgress += 0.1;
      if (this.activationProgress >= 1) {
        this.active = false;
        this.activationProgress = 0;
      }
    }
  }

  render() {
    this.p.push();
    
    // Base
    this.p.fill(100, 120, 140);
    this.p.noStroke();
    this.p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // Puff effect
    if (this.active) {
      const puffSize = 60 * this.activationProgress;
      this.p.fill(200, 220, 255, 150 * (1 - this.activationProgress));
      this.p.ellipse(this.x, this.y - this.height/2 - 20, puffSize, puffSize * 0.7);
    }
    
    this.p.pop();
  }

  activate() {
    if (!this.active && gameState.candy) {
      this.active = true;
      this.activationProgress = 0;
      
      // Apply upward force to candy if nearby
      const dx = gameState.candy.body.position.x - this.x;
      const dy = gameState.candy.body.position.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100) {
        Body.applyForce(gameState.candy.body, gameState.candy.body.position, { x: 0, y: -0.08 });
      }
    }
  }
}

export class Bubble {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.body = Bodies.circle(x, y, radius, {
      label: 'bubble',
      isStatic: true,
      isSensor: true
    });
    this.attached = false;
    this.popped = false;
    this.popAnimation = 0;
  }

  update() {
    if (this.attached && !this.popped && gameState.candy) {
      // Apply buoyancy force
      Body.applyForce(gameState.candy.body, gameState.candy.body.position, { x: 0, y: -0.003 });
      
      // Update bubble position to follow candy
      Body.setPosition(this.body, {
        x: gameState.candy.body.position.x,
        y: gameState.candy.body.position.y - 30
      });
    }

    if (this.popped && this.popAnimation < 1) {
      this.popAnimation += 0.15;
    }
  }

  render() {
    if (this.popped && this.popAnimation >= 1) return;

    const x = this.attached && gameState.candy 
      ? gameState.candy.body.position.x 
      : this.x;
    const y = this.attached && gameState.candy 
      ? gameState.candy.body.position.y - 30 
      : this.y;

    this.p.push();
    this.p.translate(x, y);
    
    if (this.popped) {
      // Pop animation
      const scale = 1 + this.popAnimation * 0.5;
      const alpha = 200 * (1 - this.popAnimation);
      this.p.fill(150, 200, 255, alpha * 0.3);
      this.p.stroke(150, 200, 255, alpha);
      this.p.strokeWeight(2);
      this.p.circle(0, 0, this.radius * 2 * scale);
    } else {
      // Normal bubble
      this.p.fill(150, 200, 255, 80);
      this.p.stroke(180, 220, 255, 200);
      this.p.strokeWeight(2);
      this.p.circle(0, 0, this.radius * 2);
      
      // Shine effect
      this.p.fill(255, 255, 255, 150);
      this.p.noStroke();
      this.p.ellipse(-this.radius/2, -this.radius/2, this.radius/2, this.radius/3);
    }
    
    this.p.pop();
  }

  attachToCandy() {
    if (!this.attached && !this.popped) {
      this.attached = true;
    }
  }

  pop() {
    if (!this.popped) {
      this.popped = true;
      this.popAnimation = 0;
      this.attached = false;
    }
  }
}

export class Hazard {
  constructor(p, x, y, points) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.points = points;
    
    const vertices = points.map(pt => ({ x: x + pt[0], y: y + pt[1] }));
    this.body = Bodies.fromVertices(x, y, vertices, {
      label: 'hazard',
      isStatic: true
    });
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(60, 60, 60);
    this.p.stroke(200, 50, 50);
    this.p.strokeWeight(2);
    this.p.beginShape();
    const vertices = this.body.vertices;
    for (let v of vertices) {
      const vx = v.x - this.body.position.x;
      const vy = v.y - this.body.position.y;
      this.p.vertex(vx, vy);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
}

export class Wall {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'wall',
      isStatic: true,
      friction: 0.8
    });
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(139, 90, 60);
    this.p.noStroke();
    const vertices = this.body.vertices;
    this.p.beginShape();
    for (let v of vertices) {
      const vx = v.x - this.body.position.x;
      const vy = v.y - this.body.position.y;
      this.p.vertex(vx, vy);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
}