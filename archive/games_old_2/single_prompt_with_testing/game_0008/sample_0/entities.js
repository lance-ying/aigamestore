// entities.js - Entity classes with Matter.js integration

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { World, Bodies, Body, Constraint } = Matter;

import { gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    
    // Create two circle bodies for the dots
    this.dot1 = Bodies.circle(x - 10, y, 12, {
      label: 'player_dot1',
      friction: 0.8,
      restitution: 0.1,
      density: 0.002
    });
    
    this.dot2 = Bodies.circle(x + 10, y, 12, {
      label: 'player_dot2',
      friction: 0.8,
      restitution: 0.1,
      density: 0.002
    });
    
    // Constraint to keep dots together
    this.constraint = Constraint.create({
      bodyA: this.dot1,
      bodyB: this.dot2,
      length: 20,
      stiffness: 0.9
    });
    
    World.add(gameState.world, [this.dot1, this.dot2, this.constraint]);
    
    this.color = [255, 100, 100];
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.isGrounded = false;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  getCenter() {
    return {
      x: (this.dot1.position.x + this.dot2.position.x) / 2,
      y: (this.dot1.position.y + this.dot2.position.y) / 2
    };
  }
  
  update() {
    const center = this.getCenter();
    
    // Check if grounded (for jump reset)
    const avgVelocityY = (this.dot1.velocity.y + this.dot2.velocity.y) / 2;
    if (Math.abs(avgVelocityY) < 0.5) {
      this.isGrounded = true;
      this.jumpCount = 0;
    } else {
      this.isGrounded = false;
    }
    
    // Log position if changed significantly
    const dist = Math.sqrt(
      Math.pow(center.x - this.lastLoggedX, 2) + 
      Math.pow(center.y - this.lastLoggedY, 2)
    );
    
    if (dist > 20) {
      this.p.logs.player_info.push({
        screen_x: center.x - gameState.cameraOffsetX,
        screen_y: center.y,
        game_x: center.x,
        game_y: center.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = center.x;
      this.lastLoggedY = center.y;
    }
    
    // Check for falling off the world
    if (center.y > 500) {
      this.respawn();
    }
  }
  
  render(offsetX = 0) {
    this.p.push();
    
    // Draw dots
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(this.dot1.position.x - offsetX, this.dot1.position.y, 24);
    this.p.circle(this.dot2.position.x - offsetX, this.dot2.position.y, 24);
    
    // Draw connection line
    this.p.stroke(this.color[0], this.color[1], this.color[2], 150);
    this.p.strokeWeight(3);
    this.p.line(
      this.dot1.position.x - offsetX, this.dot1.position.y,
      this.dot2.position.x - offsetX, this.dot2.position.y
    );
    
    this.p.pop();
  }
  
  moveLeft() {
    const force = -0.0015;
    Body.applyForce(this.dot1, this.dot1.position, { x: force, y: 0 });
    Body.applyForce(this.dot2, this.dot2.position, { x: force, y: 0 });
  }
  
  moveRight() {
    const force = 0.0015;
    Body.applyForce(this.dot1, this.dot1.position, { x: force, y: 0 });
    Body.applyForce(this.dot2, this.dot2.position, { x: force, y: 0 });
  }
  
  jump() {
    if (this.jumpCount < this.maxJumps) {
      const jumpForce = -8;
      Body.setVelocity(this.dot1, { x: this.dot1.velocity.x, y: jumpForce });
      Body.setVelocity(this.dot2, { x: this.dot2.velocity.x, y: jumpForce });
      this.jumpCount++;
    }
  }
  
  respawn() {
    const checkpoint = gameState.checkpoint;
    Body.setPosition(this.dot1, { x: checkpoint.x - 10, y: checkpoint.y });
    Body.setPosition(this.dot2, { x: checkpoint.x + 10, y: checkpoint.y });
    Body.setVelocity(this.dot1, { x: 0, y: 0 });
    Body.setVelocity(this.dot2, { x: 0, y: 0 });
    Body.setAngularVelocity(this.dot1, 0);
    Body.setAngularVelocity(this.dot2, 0);
    this.jumpCount = 0;
  }
  
  cleanup() {
    World.remove(gameState.world, [this.dot1, this.dot2, this.constraint]);
  }
}

export class Platform {
  constructor(p, x, y, width, height, letter = 'A', theme = 'default') {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: true,
      friction: 1.0
    });
    
    World.add(gameState.world, this.body);
    
    this.letter = letter;
    this.theme = theme;
    this.width = width;
    this.height = height;
  }
  
  render(offsetX = 0) {
    const pos = this.body.position;
    
    this.p.push();
    this.p.translate(pos.x - offsetX, pos.y);
    this.p.rotate(this.body.angle);
    
    // Theme colors
    let fillColor = [80, 80, 80];
    if (this.theme === 'classic') {
      fillColor = [139, 90, 43]; // Brown
    } else if (this.theme === 'modern') {
      fillColor = [70, 130, 180]; // Steel blue
    } else if (this.theme === 'serif') {
      fillColor = [160, 82, 45]; // Sienna
    }
    
    this.p.fill(fillColor[0], fillColor[1], fillColor[2]);
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw letter
    this.p.fill(255, 255, 255, 200);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(this.height * 0.6);
    this.p.text(this.letter, 0, 0);
    
    this.p.pop();
  }
  
  cleanup() {
    World.remove(gameState.world, this.body);
  }
}

export class Collectible {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.collected = false;
    this.radius = 8;
    this.rotation = 0;
  }
  
  update() {
    if (this.collected) return;
    
    this.rotation += 0.05;
    
    // Check collision with player
    if (gameState.player) {
      const center = gameState.player.getCenter();
      const dist = Math.sqrt(
        Math.pow(center.x - this.x, 2) + 
        Math.pow(center.y - this.y, 2)
      );
      
      if (dist < 20) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.score += 10;
  }
  
  render(offsetX = 0) {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x - offsetX, this.y);
    this.p.rotate(this.rotation);
    
    // Draw asterisk
    this.p.stroke(255, 215, 0);
    this.p.strokeWeight(3);
    this.p.noFill();
    
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = Math.cos(angle) * 4;
      const y1 = Math.sin(angle) * 4;
      const x2 = Math.cos(angle) * 12;
      const y2 = Math.sin(angle) * 12;
      this.p.line(x1, y1, x2, y2);
    }
    
    this.p.pop();
  }
}

export class Hazard {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'hazard',
      isStatic: true,
      isSensor: true
    });
    
    World.add(gameState.world, this.body);
    this.width = width;
    this.height = height;
  }
  
  render(offsetX = 0) {
    const pos = this.body.position;
    
    this.p.push();
    this.p.translate(pos.x - offsetX, pos.y);
    
    // Draw spikes
    this.p.fill(200, 50, 50);
    this.p.noStroke();
    
    const spikeCount = Math.floor(this.width / 15);
    const spikeWidth = this.width / spikeCount;
    
    this.p.beginShape();
    for (let i = 0; i < spikeCount; i++) {
      const x = -this.width / 2 + i * spikeWidth;
      this.p.vertex(x, this.height / 2);
      this.p.vertex(x + spikeWidth / 2, -this.height / 2);
      this.p.vertex(x + spikeWidth, this.height / 2);
    }
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
  
  cleanup() {
    World.remove(gameState.world, this.body);
  }
}

export class Checkpoint {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.activated = false;
    this.body = Bodies.rectangle(x, y, 30, 60, {
      label: 'checkpoint',
      isStatic: true,
      isSensor: true
    });
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    if (this.activated) return;
    
    // Check collision with player
    if (gameState.player) {
      const center = gameState.player.getCenter();
      const dist = Math.sqrt(
        Math.pow(center.x - this.x, 2) + 
        Math.pow(center.y - this.y, 2)
      );
      
      if (dist < 40) {
        this.activate();
      }
    }
  }
  
  activate() {
    this.activated = true;
    gameState.checkpoint = { x: this.x, y: this.y - 40 };
  }
  
  render(offsetX = 0) {
    this.p.push();
    this.p.translate(this.x - offsetX, this.y);
    
    // Flag pole
    this.p.stroke(this.activated ? 100 : 200);
    this.p.strokeWeight(3);
    this.p.line(0, -30, 0, 30);
    
    // Flag
    this.p.fill(this.activated ? [100, 255, 100] : [200, 200, 200]);
    this.p.noStroke();
    this.p.triangle(0, -30, 25, -20, 0, -10);
    
    this.p.pop();
  }
  
  cleanup() {
    World.remove(gameState.world, this.body);
  }
}

export class Goal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.body = Bodies.rectangle(x, y, 40, 80, {
      label: 'goal',
      isStatic: true,
      isSensor: true
    });
    
    World.add(gameState.world, this.body);
    this.glow = 0;
  }
  
  update() {
    this.glow = (this.glow + 0.05) % (Math.PI * 2);
    
    // Check collision with player
    if (gameState.player && !gameState.levelComplete) {
      const center = gameState.player.getCenter();
      const dist = Math.sqrt(
        Math.pow(center.x - this.x, 2) + 
        Math.pow(center.y - this.y, 2)
      );
      
      if (dist < 50) {
        gameState.levelComplete = true;
      }
    }
  }
  
  render(offsetX = 0) {
    this.p.push();
    this.p.translate(this.x - offsetX, this.y);
    
    // Glowing portal effect
    const glowAlpha = Math.sin(this.glow) * 50 + 100;
    
    this.p.fill(100, 200, 255, glowAlpha);
    this.p.noStroke();
    this.p.ellipse(0, 0, 60, 100);
    
    this.p.fill(150, 220, 255, glowAlpha + 50);
    this.p.ellipse(0, 0, 40, 80);
    
    // Draw "END" text
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(16);
    this.p.text('END', 0, 0);
    
    this.p.pop();
  }
  
  cleanup() {
    World.remove(gameState.world, this.body);
  }
}

export class PushableBlock {
  constructor(p, x, y, width, height, letter = '■') {
    this.p = p;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'block',
      friction: 0.8,
      restitution: 0.1,
      density: 0.005
    });
    
    World.add(gameState.world, this.body);
    
    this.letter = letter;
    this.width = width;
    this.height = height;
  }
  
  render(offsetX = 0) {
    const pos = this.body.position;
    
    this.p.push();
    this.p.translate(pos.x - offsetX, pos.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(150, 100, 50);
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw letter
    this.p.fill(255, 255, 255, 200);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(this.height * 0.5);
    this.p.text(this.letter, 0, 0);
    
    this.p.pop();
  }
  
  cleanup() {
    World.remove(gameState.world, this.body);
  }
}