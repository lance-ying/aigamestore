// enemy.js - Enemy entity and AI

import { gameState, GAME_PHASES } from './globals.js';

export class Enemy {
  constructor(p, x, y, patrolPath = null, isPrimaryTarget = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 25;
    this.speed = 1.2; // Increased from 0.8 to 1.2
    this.direction = 0;
    this.visionRange = 110; // Increased from 80 to 110
    this.visionAngle = this.p.PI / 2; // Increased from PI/3 (60°) to PI/2 (90°)
    this.patrolPath = patrolPath || [{ x, y }];
    this.currentWaypoint = 0;
    this.isPrimaryTarget = isPrimaryTarget;
    this.eliminated = false;
    this.eliminatedTimer = 0;
    this.isDetecting = false;
    this.detectionTimer = 0;
    this.detectionDuration = 60; // Decreased from 90 to 60 (faster detection)
    this.waitTimer = 0;
    this.waitDuration = 60;
    this.targetDirection = 0; // For smooth rotation
    this.bobOffset = 0; // For walking animation
  }

  update(player, walls) {
    if (this.eliminated) {
      // Handle fade-out animation
      if (this.eliminatedTimer > 0) {
        this.eliminatedTimer--;
        if (this.eliminatedTimer === 0) {
          // Remove from entities array
          const entityIndex = gameState.entities.indexOf(this);
          if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
          }
        }
      }
      return;
    }

    // Patrol behavior
    if (!this.isDetecting && this.waitTimer <= 0) {
      const target = this.patrolPath[this.currentWaypoint];
      const dist = this.p.dist(this.x, this.y, target.x, target.y);
      
      if (dist < 5) {
        this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
        this.waitTimer = this.waitDuration;
      } else {
        const angle = this.p.atan2(target.y - this.y, target.x - this.x);
        this.targetDirection = angle;
        
        // Smooth rotation
        let angleDiff = this.targetDirection - this.direction;
        while (angleDiff > this.p.PI) angleDiff -= this.p.TWO_PI;
        while (angleDiff < -this.p.PI) angleDiff += this.p.TWO_PI;
        this.direction += angleDiff * 0.1; // Smooth rotation
        
        this.x += this.p.cos(angle) * this.speed;
        this.y += this.p.sin(angle) * this.speed;
        
        // Walking animation bobbing
        this.bobOffset = this.p.sin(this.p.frameCount * 0.2) * 2;
      }
    } else if (this.waitTimer > 0) {
      this.waitTimer--;
      this.bobOffset = 0;
    }

    // Check if player is in vision cone
    if (player && !this.eliminated) {
      const inVision = this.checkPlayerInVision(player, walls);
      
      if (inVision) {
        if (!this.isDetecting) {
          this.isDetecting = true;
          this.detectionTimer = 0;
          gameState.stealthBonusEligible = false;
        }
        this.detectionTimer++;
        
        if (this.detectionTimer >= this.detectionDuration) {
          // Player detected - game over
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          gameState.detectingEnemy = this;
        }
      } else {
        if (this.isDetecting) {
          this.isDetecting = false;
          this.detectionTimer = 0;
        }
      }
    }
  }

  checkPlayerInVision(player, walls) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    if (dist > this.visionRange) return false;
    
    const angleToPlayer = this.p.atan2(dy, dx);
    let angleDiff = angleToPlayer - this.direction;
    
    // Normalize angle difference
    while (angleDiff > this.p.PI) angleDiff -= this.p.TWO_PI;
    while (angleDiff < -this.p.PI) angleDiff += this.p.TWO_PI;
    
    if (this.p.abs(angleDiff) > this.visionAngle / 2) return false;
    
    // Check line of sight with walls
    for (let wall of walls) {
      if (this.lineIntersectsRect(this.x, this.y, player.x, player.y, wall)) {
        return false;
      }
    }
    
    return true;
  }

  lineIntersectsRect(x1, y1, x2, y2, rect) {
    // Check if line from (x1,y1) to (x2,y2) intersects with rectangle
    return this.p.collideLineRect(x1, y1, x2, y2, rect.x, rect.y, rect.w, rect.h);
  }

  render() {
    if (this.eliminated && this.eliminatedTimer === 0) return;

    this.p.push();
    
    // Draw vision cone (only if not eliminated)
    if (!this.eliminated) {
      this.renderVisionCone();
    }
    
    // Draw enemy body with fade-out effect
    this.p.translate(this.x, this.y + this.bobOffset);
    
    // Calculate alpha for fade-out
    let alpha = 255;
    if (this.eliminated && this.eliminatedTimer > 0) {
      alpha = (this.eliminatedTimer / 30) * 255;
    }
    
    // Body color
    this.p.fill(150, 150, 150, alpha);
    this.p.stroke(0, alpha);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    
    // Slight rotation for eliminated effect
    if (this.eliminated) {
      this.p.rotate(this.p.PI / 2 * (1 - this.eliminatedTimer / 30));
    }
    
    this.p.rect(0, 0, this.size, this.size);
    
    // Primary target indicator
    if (this.isPrimaryTarget && !this.eliminated) {
      this.p.fill(255, 0, 0, alpha);
      this.p.noStroke();
      this.p.circle(0, -this.size / 2 - 5, 8);
    }
    
    // Detection exclamation mark with pulse animation
    if (this.isDetecting) {
      const pulseScale = 1 + this.p.sin(this.p.frameCount * 0.3) * 0.2;
      this.p.push();
      this.p.scale(pulseScale);
      this.p.fill(255, 0, 0);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(20);
      this.p.text('!', 0, -this.size - 15);
      this.p.pop();
    }
    
    this.p.pop();
  }

  renderVisionCone() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.direction);
    
    // Color based on detection status with animation
    if (this.isDetecting) {
      const progress = this.detectionTimer / this.detectionDuration;
      const pulse = this.p.sin(this.p.frameCount * 0.4) * 0.2 + 0.8;
      if (progress < 0.5) {
        this.p.fill(255, 255, 0, 60 * pulse);
      } else {
        this.p.fill(255, 0, 0, 80 * pulse);
      }
    } else {
      this.p.fill(100, 150, 255, 40);
    }
    
    this.p.noStroke();
    this.p.arc(0, 0, this.visionRange * 2, this.visionRange * 2, 
               -this.visionAngle / 2, this.visionAngle / 2, this.p.PIE);
    
    this.p.pop();
  }
}