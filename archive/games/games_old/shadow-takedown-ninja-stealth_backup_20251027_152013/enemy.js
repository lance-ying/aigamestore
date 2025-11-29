// enemy.js - Enemy entity and AI

import { gameState, GAME_PHASES } from './globals.js';

export class Enemy {
  constructor(p, x, y, patrolPath = null, isPrimaryTarget = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 25;
    this.speed = 0.8;
    this.direction = 0;
    this.visionRange = 80;
    this.visionAngle = this.p.PI / 3; // 60 degrees
    this.patrolPath = patrolPath || [{ x, y }];
    this.currentWaypoint = 0;
    this.isPrimaryTarget = isPrimaryTarget;
    this.eliminated = false;
    this.isDetecting = false;
    this.detectionTimer = 0;
    this.detectionDuration = 90; // 1.5 seconds at 60fps
    this.waitTimer = 0;
    this.waitDuration = 60;
  }

  update(player, walls) {
    if (this.eliminated) return;

    // Patrol behavior
    if (!this.isDetecting && this.waitTimer <= 0) {
      const target = this.patrolPath[this.currentWaypoint];
      const dist = this.p.dist(this.x, this.y, target.x, target.y);
      
      if (dist < 5) {
        this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
        this.waitTimer = this.waitDuration;
      } else {
        const angle = this.p.atan2(target.y - this.y, target.x - this.x);
        this.direction = angle;
        this.x += this.p.cos(angle) * this.speed;
        this.y += this.p.sin(angle) * this.speed;
      }
    } else if (this.waitTimer > 0) {
      this.waitTimer--;
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
    if (this.eliminated) return;

    this.p.push();
    
    // Draw vision cone
    this.renderVisionCone();
    
    // Draw enemy body
    this.p.translate(this.x, this.y);
    
    // Body color
    this.p.fill(150, 150, 150);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.size, this.size);
    
    // Primary target indicator
    if (this.isPrimaryTarget) {
      this.p.fill(255, 0, 0);
      this.p.noStroke();
      this.p.circle(0, -this.size / 2 - 5, 8);
    }
    
    // Detection exclamation mark
    if (this.isDetecting) {
      this.p.fill(255, 0, 0);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(20);
      this.p.text('!', 0, -this.size - 15);
    }
    
    this.p.pop();
  }

  renderVisionCone() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.direction);
    
    // Color based on detection status
    if (this.isDetecting) {
      const progress = this.detectionTimer / this.detectionDuration;
      if (progress < 0.5) {
        this.p.fill(255, 255, 0, 60);
      } else {
        this.p.fill(255, 0, 0, 80);
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