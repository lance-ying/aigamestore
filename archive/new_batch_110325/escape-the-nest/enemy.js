// enemy.js
import { gameState, GAME_PHASES } from './globals.js';

export class Enemy {
  constructor(x, y, patrolPoints) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.patrolPoints = patrolPoints;
    this.currentPatrolIndex = 0;
    this.speed = 1;
    this.visionRange = 120;
    this.visionAngle = 60;
    this.facing = 0; // angle in degrees
    this.detectionTime = 0;
    this.maxDetectionTime = 30;
    this.hasDetected = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(p, room) {
    // Move toward current patrol point
    if (this.patrolPoints.length > 0) {
      let target = this.patrolPoints[this.currentPatrolIndex];
      let dx = target.x - this.x;
      let dy = target.y - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Reached patrol point, move to next
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      } else {
        // Move toward patrol point
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        
        // Update facing direction
        this.facing = Math.atan2(dy, dx) * 180 / Math.PI;
      }
    }

    // Animation
    this.animTimer++;
    if (this.animTimer > 15) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }

    // Check if player is in vision cone
    if (gameState.player && !gameState.player.isHiding) {
      if (this.canSeePlayer(p, gameState.player)) {
        this.detectionTime++;
        if (this.detectionTime >= this.maxDetectionTime) {
          this.hasDetected = true;
        }
      } else {
        this.detectionTime = Math.max(0, this.detectionTime - 2);
      }
    } else {
      this.detectionTime = Math.max(0, this.detectionTime - 2);
    }
  }

  canSeePlayer(p, player) {
    let px = player.x + player.width/2;
    let py = player.y + player.height/2;
    let ex = this.x + this.width/2;
    let ey = this.y + this.height/2;

    // Check distance
    let dist = p.dist(ex, ey, px, py);
    if (dist > this.visionRange) return false;

    // Check angle
    let angleToPlayer = Math.atan2(py - ey, px - ex) * 180 / Math.PI;
    let angleDiff = Math.abs(angleToPlayer - this.facing);
    
    // Normalize angle difference
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;
    angleDiff = Math.abs(angleDiff);

    return angleDiff < this.visionAngle;
  }

  render(p) {
    p.push();

    // Draw vision cone
    p.fill(255, 0, 0, this.detectionTime > 0 ? 40 : 20);
    p.noStroke();
    p.translate(this.x + this.width/2, this.y + this.height/2);
    p.rotate(this.facing * Math.PI / 180);
    p.arc(0, 0, this.visionRange * 2, this.visionRange * 2, 
          -this.visionAngle * Math.PI / 180, 
          this.visionAngle * Math.PI / 180, p.PIE);
    p.pop();

    // Draw shadow
    p.push();
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + this.width/2, this.y + this.height, this.width * 0.8, 10);
    p.pop();

    // Draw enemy body
    p.push();
    p.fill(60, 40, 40);
    p.noStroke();
    p.rect(this.x + 4, this.y + 10, this.width - 8, this.height - 10, 2);
    
    // Head
    p.fill(80, 60, 60);
    p.circle(this.x + this.width/2, this.y + 10, 14);
    
    // Eyes (glowing)
    p.fill(255, 50, 50);
    p.circle(this.x + this.width/2 - 4, this.y + 10, 4);
    p.circle(this.x + this.width/2 + 4, this.y + 10, 4);

    // Simple walking animation
    if (this.animFrame === 0) {
      p.fill(60, 40, 40);
      p.rect(this.x + 6, this.y + this.height - 8, 6, 8);
      p.rect(this.x + this.width - 12, this.y + this.height - 6, 6, 6);
    } else {
      p.fill(60, 40, 40);
      p.rect(this.x + 6, this.y + this.height - 6, 6, 6);
      p.rect(this.x + this.width - 12, this.y + this.height - 8, 6, 8);
    }

    p.pop();

    // Detection indicator
    if (this.detectionTime > 0) {
      p.push();
      p.fill(255, 0, 0);
      p.noStroke();
      let barWidth = 30;
      let barHeight = 4;
      let fillWidth = (this.detectionTime / this.maxDetectionTime) * barWidth;
      p.rect(this.x + this.width/2 - barWidth/2, this.y - 10, barWidth, barHeight);
      p.fill(255, 255, 0);
      p.rect(this.x + this.width/2 - barWidth/2, this.y - 10, fillWidth, barHeight);
      p.pop();
    }
  }
}