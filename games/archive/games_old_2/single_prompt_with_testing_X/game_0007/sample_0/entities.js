// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  NUM_LANES,
  LANE_WIDTH,
  PLAYER_START_X,
  PLAYER_START_Y,
  FORWARD_SPEED,
  LANE_CHANGE_SPEED,
  COLORS,
  BLOCKS_PER_BRIDGE,
  BLOCK_DROP_COUNT,
  TRACK_LENGTH,
  FINISH_LINE_OFFSET
} from './globals.js';

export class Racer {
  constructor(p, x, y, color, isPlayer = false) {
    this.p = p;
    this.isPlayer = isPlayer;
    this.color = color;
    this.blocks = 0;
    this.targetLane = Math.floor((x - (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2) / LANE_WIDTH);
    this.worldY = y;
    this.finished = false;
    this.finishTime = 0;
    this.lastLoggedY = y;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, 25, 35, {
      label: isPlayer ? 'player' : 'ai',
      friction: 0.3,
      restitution: 0.2,
      density: 0.001,
      frictionAir: 0.01
    });
    
    World.add(gameState.world, this.body);
  }

  update() {
    if (this.finished) return;
    
    // Update world position from physics body
    this.worldY = this.body.position.y;
    
    // Move forward automatically
    Body.setVelocity(this.body, {
      x: this.body.velocity.x,
      y: -FORWARD_SPEED
    });
    
    // Lane steering
    const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const targetX = trackLeft + this.targetLane * LANE_WIDTH + LANE_WIDTH / 2;
    const dx = targetX - this.body.position.x;
    
    if (Math.abs(dx) > 2) {
      Body.applyForce(this.body, this.body.position, {
        x: dx * LANE_CHANGE_SPEED * 0.001,
        y: 0
      });
    }
    
    // Log player position periodically
    if (this.isPlayer && Math.abs(this.worldY - this.lastLoggedY) > 50) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.worldY,
        blocks: this.blocks,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedY = this.worldY;
    }
    
    // Check if finished
    if (this.worldY <= FINISH_LINE_OFFSET) {
      this.finished = true;
      this.finishTime = this.p.millis();
      gameState.finishResults.push({
        racer: this,
        time: this.finishTime,
        isPlayer: this.isPlayer
      });
      
      // Sort by finish time
      gameState.finishResults.sort((a, b) => a.time - b.time);
      
      // Check if race is complete (all racers finished or player finished)
      if (this.isPlayer) {
        gameState.raceFinished = true;
      }
    }
  }

  render(screenY) {
    const p = this.p;
    
    // Draw racer body
    p.push();
    p.translate(this.body.position.x, screenY);
    p.rotate(this.body.angle);
    
    // Body
    p.fill(this.color);
    p.noStroke();
    p.rect(-12, -17, 24, 34, 5);
    
    // Head
    p.fill(this.color[0] * 0.8, this.color[1] * 0.8, this.color[2] * 0.8);
    p.circle(0, -20, 16);
    
    // Eyes
    p.fill(255);
    p.circle(-4, -22, 5);
    p.circle(4, -22, 5);
    p.fill(0);
    p.circle(-4, -22, 2);
    p.circle(4, -22, 2);
    
    p.pop();
    
    // Draw block count
    if (this.blocks > 0) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(this.blocks, this.body.position.x, screenY + 25);
      p.noStroke();
    }
  }

  steerLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
    }
  }

  steerRight() {
    if (this.targetLane < NUM_LANES - 1) {
      this.targetLane++;
    }
  }

  collectBlock() {
    this.blocks++;
  }

  dropBlocks() {
    const dropCount = Math.min(this.blocks, BLOCK_DROP_COUNT);
    this.blocks -= dropCount;
    return dropCount;
  }

  useBridgeBlock() {
    if (this.blocks > 0) {
      this.blocks--;
      return true;
    }
    return false;
  }
}

export class Block {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.worldY = y;
    this.color = color;
    this.collected = false;
    this.size = 15;
    this.rotationSpeed = this.p.random(-0.05, 0.05);
    this.rotation = this.p.random(0, this.p.TWO_PI);
  }

  update() {
    this.rotation += this.rotationSpeed;
  }

  render(screenY) {
    if (this.collected) return;
    
    const p = this.p;
    p.push();
    p.translate(this.x, screenY);
    p.rotate(this.rotation);
    
    // Draw 3D-looking block
    p.fill(this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(-this.size/2, -this.size/2, this.size, this.size);
    
    // Highlight
    p.fill(this.color[0] + 50, this.color[1] + 50, this.color[2] + 50, 150);
    p.noStroke();
    p.triangle(
      -this.size/2, -this.size/2,
      this.size/2, -this.size/2,
      -this.size/2, this.size/2
    );
    
    p.pop();
  }

  checkCollision(racer) {
    if (this.collected) return false;
    
    const dx = this.x - racer.body.position.x;
    const dy = this.worldY - racer.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 25) {
      this.collected = true;
      racer.collectBlock();
      return true;
    }
    return false;
  }
}

export class Bridge {
  constructor(p, x, y, width, requiredBlocks) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.worldY = y;
    this.width = width;
    this.height = 80;
    this.requiredBlocks = requiredBlocks;
    this.builtSegments = 0;
    this.segmentWidth = this.width / requiredBlocks;
  }

  update(racers) {
    // Check if any racer is on this bridge
    racers.forEach(racer => {
      if (racer.finished) return;
      
      const onBridge = Math.abs(racer.body.position.x - this.x) < this.width / 2 &&
                      Math.abs(racer.worldY - this.worldY) < this.height / 2;
      
      if (onBridge) {
        // Build bridge segments
        while (this.builtSegments < this.requiredBlocks && racer.blocks > 0) {
          if (racer.useBridgeBlock()) {
            this.builtSegments++;
          }
        }
        
        // Check if can pass
        const racerProgress = (this.worldY - racer.worldY + this.height / 2) / this.height;
        const bridgeProgress = this.builtSegments / this.requiredBlocks;
        
        if (racerProgress > bridgeProgress) {
          // Not enough bridge built, push racer back
          Body.setPosition(racer.body, {
            x: racer.body.position.x,
            y: racer.body.position.y + 2
          });
          racer.worldY += 2;
        }
      }
    });
  }

  render(screenY) {
    const p = this.p;
    
    // Draw water
    p.fill(COLORS.WATER);
    p.noStroke();
    p.rect(this.x - this.width / 2, screenY - this.height / 2, this.width, this.height);
    
    // Draw waves
    p.stroke(100, 180, 255);
    p.strokeWeight(2);
    p.noFill();
    for (let i = 0; i < 3; i++) {
      const waveY = screenY - this.height / 2 + 20 + i * 20;
      p.beginShape();
      for (let x = -this.width / 2; x <= this.width / 2; x += 10) {
        const wave = Math.sin((x + p.frameCount * 2) * 0.1) * 3;
        p.vertex(this.x + x, waveY + wave);
      }
      p.endShape();
    }
    
    // Draw built bridge segments
    if (this.builtSegments > 0) {
      p.fill(COLORS.BRIDGE);
      p.stroke(100, 70, 40);
      p.strokeWeight(2);
      for (let i = 0; i < this.builtSegments; i++) {
        const segX = this.x - this.width / 2 + i * this.segmentWidth;
        p.rect(segX, screenY - 5, this.segmentWidth, 10);
      }
    }
    
    // Draw bridge zone indicator
    p.noFill();
    p.stroke(255, 255, 0, 100);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, screenY - this.height / 2, this.width, this.height);
  }
}

export class DroppedBlock {
  constructor(p, x, y, color) {
    this.p = p;
    this.color = color;
    this.worldY = y;
    this.collected = false;
    this.lifetime = 300; // frames
    this.age = 0;
    
    // Create physics body
    this.body = Bodies.rectangle(x, y, 12, 12, {
      label: 'droppedBlock',
      friction: 0.8,
      restitution: 0.3,
      density: 0.0005
    });
    
    World.add(gameState.world, this.body);
    
    // Apply random scatter force
    Body.applyForce(this.body, this.body.position, {
      x: (Math.random() - 0.5) * 0.001,
      y: (Math.random() - 0.5) * 0.001
    });
  }

  update() {
    this.age++;
    this.worldY = this.body.position.y;
    
    // Slow down
    Body.setVelocity(this.body, {
      x: this.body.velocity.x * 0.95,
      y: this.body.velocity.y * 0.95
    });
    
    if (this.age > this.lifetime) {
      this.collected = true;
    }
  }

  render(screenY) {
    if (this.collected) return;
    
    const p = this.p;
    const alpha = Math.max(0, 255 * (1 - this.age / this.lifetime));
    
    p.push();
    p.translate(this.body.position.x, screenY);
    p.rotate(this.body.angle);
    
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.stroke(0, alpha);
    p.strokeWeight(1);
    p.rect(-6, -6, 12, 12);
    
    p.pop();
  }

  checkCollision(racer) {
    if (this.collected) return false;
    
    const dx = this.body.position.x - racer.body.position.x;
    const dy = this.worldY - racer.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 25) {
      this.collected = true;
      World.remove(gameState.world, this.body);
      racer.collectBlock();
      return true;
    }
    return false;
  }
}