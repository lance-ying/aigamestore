// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, JELLY_HEIGHTS, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetHeight = JELLY_HEIGHTS.MEDIUM;
    this.currentHeight = JELLY_HEIGHTS.MEDIUM;
    this.width = 40;
    this.heightState = "MEDIUM";
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, this.width, this.currentHeight, {
      label: 'player',
      friction: 0,
      restitution: 0,
      isStatic: false,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);
    
    this.color = [100, 200, 255];
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  setHeight(state) {
    this.heightState = state;
    this.targetHeight = JELLY_HEIGHTS[state];
  }
  
  update() {
    // Smoothly transition to target height
    const lerp = 0.3;
    this.currentHeight += (this.targetHeight - this.currentHeight) * lerp;
    
    // Update Matter.js body size and position
    World.remove(gameState.world, this.body);
    const groundY = CANVAS_HEIGHT - 20;
    const newY = groundY - this.currentHeight / 2;
    
    this.body = Bodies.rectangle(this.x, newY, this.width, this.currentHeight, {
      label: 'player',
      friction: 0,
      restitution: 0,
      isStatic: false,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);
    
    this.y = newY;
    
    // Log player position if moved significantly
    const dx = Math.abs(this.x - this.lastLoggedX);
    const dy = Math.abs(this.y - this.lastLoggedY);
    if (dx > 10 || dy > 10) {
      this.p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x + gameState.cameraX,
        game_y: this.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.x;
      this.lastLoggedY = this.y;
    }
  }
  
  render() {
    this.p.push();
    
    // Jelly Fever effect
    if (gameState.jellyFeverActive) {
      const pulse = this.p.sin(this.p.frameCount * 0.3) * 20;
      this.p.fill(255, 200 + pulse, 100 + pulse);
    } else {
      this.p.fill(this.color[0], this.color[1], this.color[2]);
    }
    
    this.p.noStroke();
    
    // Draw jelly with wobbly effect
    const wobble = this.p.sin(this.p.frameCount * 0.2) * 2;
    this.p.rect(
      this.x - this.width / 2 + wobble,
      this.y - this.currentHeight / 2,
      this.width,
      this.currentHeight,
      5
    );
    
    // Draw face
    this.p.fill(255);
    const eyeY = this.y - this.currentHeight / 4;
    this.p.ellipse(this.x - 8, eyeY, 6, 8);
    this.p.ellipse(this.x + 8, eyeY, 6, 8);
    
    this.p.fill(0);
    this.p.ellipse(this.x - 8, eyeY, 3, 4);
    this.p.ellipse(this.x + 8, eyeY, 3, 4);
    
    this.p.pop();
  }
}

export class Obstacle {
  constructor(p, x, gapPosition) {
    this.p = p;
    this.x = x;
    this.width = 30;
    this.gapPosition = gapPosition; // "TOP", "MIDDLE", "BOTTOM"
    this.passed = false;
    
    const groundY = CANVAS_HEIGHT - 20;
    const fullHeight = CANVAS_HEIGHT - 40;
    
    // Create obstacle bodies based on gap position
    this.bodies = [];
    
    if (gapPosition === "TOP") {
      // Gap at top (need TALL jelly)
      const bottomHeight = fullHeight * 0.7;
      const bottomBody = Bodies.rectangle(
        x, groundY - bottomHeight / 2,
        this.width, bottomHeight,
        { label: 'obstacle', isStatic: true }
      );
      this.bodies.push(bottomBody);
      World.add(gameState.world, bottomBody);
    } else if (gapPosition === "MIDDLE") {
      // Gap in middle (need MEDIUM jelly)
      const barHeight = fullHeight * 0.25;
      const topBody = Bodies.rectangle(
        x, 20 + barHeight / 2,
        this.width, barHeight,
        { label: 'obstacle', isStatic: true }
      );
      const bottomBody = Bodies.rectangle(
        x, groundY - barHeight / 2,
        this.width, barHeight,
        { label: 'obstacle', isStatic: true }
      );
      this.bodies.push(topBody, bottomBody);
      World.add(gameState.world, topBody);
      World.add(gameState.world, bottomBody);
    } else { // BOTTOM
      // Gap at bottom (need FLAT jelly)
      const topHeight = fullHeight * 0.7;
      const topBody = Bodies.rectangle(
        x, 20 + topHeight / 2,
        this.width, topHeight,
        { label: 'obstacle', isStatic: true }
      );
      this.bodies.push(topBody);
      World.add(gameState.world, topBody);
    }
    
    this.color = [220, 100, 100];
  }
  
  update() {
    // Check if player passed this obstacle
    if (!this.passed && gameState.player && gameState.player.x > this.x + this.width) {
      this.passed = true;
      gameState.consecutivePasses++;
      gameState.score += 10;
      
      // Trigger Jelly Fever
      if (gameState.consecutivePasses >= 3 && !gameState.jellyFeverActive) {
        gameState.jellyFeverActive = true;
        gameState.jellyFeverTimer = 300; // 5 seconds at 60 FPS
        gameState.currentSpeed = gameState.baseSpeed * 1.5;
      }
    }
  }
  
  render() {
    this.p.push();
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    
    for (let body of this.bodies) {
      const vertices = body.vertices;
      this.p.beginShape();
      for (let v of vertices) {
        this.p.vertex(v.x - gameState.cameraX, v.y);
      }
      this.p.endShape(this.p.CLOSE);
    }
    
    this.p.pop();
  }
  
  destroy() {
    for (let body of this.bodies) {
      World.remove(gameState.world, body);
    }
  }
}

export class Diamond {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 15;
    this.collected = false;
    this.rotation = 0;
    
    this.body = Bodies.circle(x, y, this.size / 2, {
      label: 'diamond',
      isStatic: true,
      isSensor: true
    });
    World.add(gameState.world, this.body);
  }
  
  update() {
    this.rotation += 0.05;
    
    // Check collection
    if (!this.collected && gameState.player) {
      const dx = this.x - gameState.player.x;
      const dy = this.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        this.collected = true;
        gameState.diamondCount++;
        const multiplier = gameState.jellyFeverActive ? 2 : 1;
        gameState.score += 5 * multiplier;
      }
    }
  }
  
  render() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x - gameState.cameraX, this.y);
    this.p.rotate(this.rotation);
    
    const sparkle = this.p.sin(this.p.frameCount * 0.2) * 20;
    this.p.fill(255, 255, 100 + sparkle);
    this.p.noStroke();
    
    // Draw diamond shape
    this.p.beginShape();
    this.p.vertex(0, -this.size);
    this.p.vertex(this.size * 0.6, 0);
    this.p.vertex(0, this.size);
    this.p.vertex(-this.size * 0.6, 0);
    this.p.endShape(this.p.CLOSE);
    
    this.p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}