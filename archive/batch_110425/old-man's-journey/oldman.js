// oldman.js - Old man character

import { gameState, CANVAS_HEIGHT } from './globals.js';

export class OldMan {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.size = 20;
    this.walkSpeed = 2;
    this.isWalking = false;
    this.direction = 1; // 1 for right, -1 for left
    this.animationOffset = 0;
    this.reachedGoal = false;
    
    // Animation
    this.bobOffset = 0;
    this.bobSpeed = 0.15;
  }
  
  findGroundHeight(x) {
    // Find the highest walkable terrain at this x position
    let maxHeight = null;
    
    for (let layer of gameState.terrainLayers) {
      const height = layer.getHeightAtX(x);
      if (height !== null) {
        if (maxHeight === null || height < maxHeight) {
          maxHeight = height;
        }
      }
    }
    
    return maxHeight;
  }
  
  canWalkTo(x) {
    const groundHeight = this.findGroundHeight(x);
    return groundHeight !== null;
  }
  
  startWalking() {
    this.isWalking = true;
    
    // Determine walk direction based on goal
    if (gameState.goalPosition.x > this.x) {
      this.direction = 1;
    } else {
      this.direction = -1;
    }
  }
  
  update() {
    if (!this.isWalking) return;
    
    // Update animation
    this.animationOffset += this.walkSpeed * 0.5;
    this.bobOffset = Math.sin(this.animationOffset * 0.3) * 2;
    
    // Calculate next position
    const nextX = this.x + this.walkSpeed * this.direction;
    
    // Check if can walk to next position
    if (this.canWalkTo(nextX)) {
      this.x = nextX;
      const groundHeight = this.findGroundHeight(this.x);
      if (groundHeight !== null) {
        this.y = groundHeight - this.size / 2;
      }
      
      // Check if reached goal
      const distToGoal = Math.abs(this.x - gameState.goalPosition.x);
      if (distToGoal < 20) {
        this.isWalking = false;
        this.reachedGoal = true;
        gameState.levelComplete = true;
      }
      
      // Log position periodically
      if (this.p.frameCount % 30 === 0) {
        this.p.logs.player_info.push({
          screen_x: this.x,
          screen_y: this.y,
          game_x: this.x,
          game_y: this.y,
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      // Can't walk further, stop
      this.isWalking = false;
    }
  }
  
  render(cameraX = 0) {
    this.p.push();
    this.p.translate(this.x - cameraX, this.y + this.bobOffset);
    
    // Draw old man as simple character
    // Body
    this.p.fill(100, 80, 60);
    this.p.noStroke();
    this.p.rect(-6, -10, 12, 18, 3);
    
    // Head
    this.p.fill(220, 180, 150);
    this.p.ellipse(0, -18, 14, 14);
    
    // Hat
    this.p.fill(60, 50, 40);
    this.p.arc(0, -20, 16, 12, this.p.PI, 0);
    this.p.rect(-8, -25, 16, 5);
    
    // Walking stick
    this.p.stroke(120, 90, 60);
    this.p.strokeWeight(2);
    const stickAngle = this.isWalking ? Math.sin(this.animationOffset * 0.3) * 0.2 : 0;
    this.p.push();
    this.p.rotate(stickAngle);
    this.p.line(6, -5, 6, 8);
    this.p.pop();
    
    // Beard
    this.p.noStroke();
    this.p.fill(200, 200, 200);
    this.p.ellipse(-2, -13, 6, 8);
    this.p.ellipse(2, -13, 6, 8);
    
    // Eyes
    this.p.fill(60, 60, 80);
    this.p.ellipse(-3, -18, 2, 2);
    this.p.ellipse(3, -18, 2, 2);
    
    this.p.pop();
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.isWalking = false;
    this.reachedGoal = false;
    this.animationOffset = 0;
    this.bobOffset = 0;
  }
}