// entities.js - Game entity classes
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, DELIVERY_TYPES } from './globals.js';

export class Batsman {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    
    // Create a static body for the batsman (doesn't move)
    this.body = Bodies.rectangle(x, y, this.width, this.height, {
      label: 'batsman',
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
    
    this.batAngle = 0;
    this.targetBatAngle = 0;
    this.batSwingSpeed = 0.3;
    this.isSwinging = false;
    
    this.stance = "front"; // front or back
    this.shotDirection = "straight";
    
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update() {
    // Smooth bat animation
    if (this.isSwinging) {
      this.batAngle += (this.targetBatAngle - this.batAngle) * this.batSwingSpeed;
      
      if (Math.abs(this.targetBatAngle - this.batAngle) < 0.05) {
        this.isSwinging = false;
        this.batAngle = this.targetBatAngle;
      }
    } else {
      // Return to neutral
      this.batAngle *= 0.9;
    }
    
    // Log position if changed
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    
    if (dx > 1 || dy > 1) {
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
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Draw batsman body
    this.p.fill(255, 220, 180);
    this.p.noStroke();
    this.p.rect(-10, -25, 20, 30); // Torso
    this.p.circle(0, -35, 15); // Head
    
    // Legs
    this.p.fill(255);
    this.p.rect(-8, 5, 7, 20); // Left leg
    this.p.rect(1, 5, 7, 20); // Right leg
    
    // Draw bat
    this.p.push();
    this.p.rotate(this.batAngle);
    this.p.fill(139, 90, 43);
    this.p.rect(15, -10, 40, 8);
    this.p.fill(100, 50, 20);
    this.p.rect(10, -8, 10, 4);
    this.p.pop();
    
    // Stance indicator
    if (gameState.shotPrepared) {
      this.p.fill(255, 255, 0, 100);
      this.p.noStroke();
      this.p.circle(0, 0, 60);
    }
    
    this.p.pop();
  }
  
  executeShot(shotType, isPower) {
    this.isSwinging = true;
    
    switch (shotType) {
      case "FRONT_FOOT":
        this.targetBatAngle = -this.p.PI / 4;
        this.stance = "front";
        break;
      case "BACK_FOOT":
        this.targetBatAngle = -this.p.PI / 6;
        this.stance = "back";
        break;
      case "OFF_SIDE":
        this.targetBatAngle = -this.p.PI / 3;
        this.shotDirection = "left";
        break;
      case "ON_SIDE":
        this.targetBatAngle = -this.p.PI / 5;
        this.shotDirection = "right";
        break;
      case "DEFENSIVE":
        this.targetBatAngle = -this.p.PI / 8;
        break;
      case "LATE_CUT":
        this.targetBatAngle = -this.p.PI / 2.5;
        this.shotDirection = "left";
        break;
    }
    
    if (isPower) {
      this.targetBatAngle *= 1.5;
    }
  }
  
  getBatPosition() {
    const angle = this.batAngle;
    const batLength = 55;
    return {
      x: this.x + Math.cos(angle) * batLength,
      y: this.y + Math.sin(angle) * batLength
    };
  }
}

export class Ball {
  constructor(p, x, y, deliveryType, speed) {
    this.p = p;
    this.startX = x;
    this.startY = y;
    this.deliveryType = deliveryType;
    this.speed = speed;
    
    this.body = Bodies.circle(x, y, 6, {
      label: 'ball',
      restitution: 0.7,
      friction: 0.05,
      density: 0.01
    });
    
    World.add(gameState.world, this.body);
    
    this.hit = false;
    this.hitPower = 0;
    this.hitAngle = 0;
    this.spin = 0;
    
    // Apply initial velocity based on delivery type
    this.applyDeliveryPhysics();
  }
  
  applyDeliveryPhysics() {
    let vx = 0;
    let vy = this.speed;
    
    switch (this.deliveryType) {
      case DELIVERY_TYPES.FAST:
        vy = this.speed * 1.2;
        break;
      case DELIVERY_TYPES.SPINNER:
        vy = this.speed * 0.8;
        this.spin = (Math.random() - 0.5) * 0.05;
        break;
      case DELIVERY_TYPES.YORKER:
        vy = this.speed * 1.4;
        break;
      case DELIVERY_TYPES.BOUNCER:
        vy = this.speed * 1.1;
        break;
    }
    
    // Add slight variation
    vx = (Math.random() - 0.5) * 0.5;
    
    Body.setVelocity(this.body, { x: vx, y: vy });
  }
  
  update() {
    // Apply spin if spinner
    if (this.deliveryType === DELIVERY_TYPES.SPINNER && !this.hit) {
      Body.applyForce(this.body, this.body.position, { x: this.spin, y: 0 });
    }
    
    // Bouncer physics - extra bounce
    if (this.deliveryType === DELIVERY_TYPES.BOUNCER && this.body.position.y > 320 && !this.hit) {
      if (this.body.velocity.y > 0) {
        Body.setVelocity(this.body, { 
          x: this.body.velocity.x, 
          y: -Math.abs(this.body.velocity.y) * 0.8 
        });
      }
    }
    
    // Remove if out of bounds
    if (this.body.position.y > CANVAS_HEIGHT + 50 || 
        this.body.position.x < -50 || 
        this.body.position.x > CANVAS_WIDTH + 50) {
      this.remove();
      return false;
    }
    
    return true;
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Ball
    this.p.fill(255, 50, 50);
    this.p.noStroke();
    this.p.circle(0, 0, 12);
    
    // Seam
    this.p.stroke(200, 30, 30);
    this.p.strokeWeight(1);
    this.p.noFill();
    this.p.arc(0, 0, 12, 12, 0, this.p.PI);
    
    this.p.pop();
    
    // Trail effect
    if (!this.hit) {
      this.p.fill(255, 50, 50, 50);
      this.p.noStroke();
      this.p.circle(this.body.position.x, this.body.position.y - 5, 8);
    }
  }
  
  onHit(power, angle, timing) {
    this.hit = true;
    this.hitPower = power;
    this.hitAngle = angle;
    
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;
    
    Body.setVelocity(this.body, { x: vx, y: vy });
  }
  
  remove() {
    World.remove(gameState.world, this.body);
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
  }
}

export class Bowler {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 45;
    
    this.animationState = "idle";
    this.animationFrame = 0;
    this.animationSpeed = 0.2;
  }
  
  update() {
    if (this.animationState === "bowling") {
      this.animationFrame += this.animationSpeed;
      
      if (this.animationFrame >= 1) {
        this.animationState = "idle";
        this.animationFrame = 0;
      }
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Bowler body
    this.p.fill(100, 100, 255);
    this.p.noStroke();
    this.p.rect(-10, -22, 20, 28); // Torso
    this.p.fill(255, 220, 180);
    this.p.circle(0, -30, 12); // Head
    
    // Arms (animated during bowling)
    const armAngle = this.animationState === "bowling" ? 
                     -this.p.PI / 4 * this.animationFrame : 0;
    
    this.p.push();
    this.p.rotate(armAngle);
    this.p.fill(100, 100, 255);
    this.p.rect(10, -15, 15, 6);
    this.p.pop();
    
    // Legs
    this.p.fill(255);
    this.p.rect(-8, 6, 7, 18);
    this.p.rect(1, 6, 7, 18);
    
    this.p.pop();
  }
  
  bowl(deliveryType) {
    this.animationState = "bowling";
    this.animationFrame = 0;
  }
}

export class FieldZone {
  constructor(p, x, y, width, height, runs) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.runs = runs;
    this.color = this.getColorForRuns(runs);
  }
  
  getColorForRuns(runs) {
    if (runs >= 6) return [255, 215, 0, 30]; // Gold for 6
    if (runs >= 4) return [50, 255, 50, 30]; // Green for 4
    if (runs >= 2) return [100, 150, 255, 30]; // Blue for 2-3
    return [200, 200, 200, 30]; // Gray for 1
  }
  
  render() {
    this.p.fill(...this.color);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height);
    
    this.p.fill(0, 100);
    this.p.textSize(16);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.text(this.runs, this.x + this.width / 2, this.y + this.height / 2);
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, lifetime) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = 4;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.lifetime--;
    return this.lifetime > 0;
  }
  
  render() {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    this.p.fill(this.color[0], this.color[1], this.color[2], alpha);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.size);
  }
}