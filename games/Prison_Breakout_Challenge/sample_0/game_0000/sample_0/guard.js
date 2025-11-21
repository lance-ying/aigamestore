// guard.js - Guard AI entity
import { gameState, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_DETECTION_RANGE, GUARD_DETECTION_ANGLE, GRAVITY, CANVAS_HEIGHT } from './globals.js';

export class Guard {
  constructor(x, y, patrolPoints) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 35;
    this.height = 55;
    this.grounded = false;
    this.facing = 1;
    this.state = "PATROL"; // PATROL, ALERT, CHASE
    this.patrolPoints = patrolPoints || [{x: x, y: y}];
    this.currentPatrolIndex = 0;
    this.alertTimer = 0;
    this.alertDuration = 120; // frames
    this.lastSeenPlayerX = 0;
    this.lastSeenPlayerY = 0;
    this.animFrame = 0;
  }

  update(p) {
    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }

    // State machine
    if (this.state === "PATROL") {
      this.patrol();
    } else if (this.state === "ALERT") {
      this.alert();
    } else if (this.state === "CHASE") {
      this.chase();
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Check platform collisions
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        this.vy = 0;
        this.y = platform.y - this.height;
      }
    }

    // Keep in bounds
    if (this.y > CANVAS_HEIGHT) {
      this.y = CANVAS_HEIGHT - this.height;
      this.grounded = true;
      this.vy = 0;
    }

    // Check line of sight to player
    if (gameState.player && this.canSeePlayer(p)) {
      if (this.state === "PATROL") {
        this.state = "ALERT";
        this.alertTimer = this.alertDuration;
      } else if (this.state === "ALERT") {
        this.state = "CHASE";
      }
      this.lastSeenPlayerX = gameState.player.x;
      this.lastSeenPlayerY = gameState.player.y;
    } else if (this.state === "CHASE") {
      // Lost sight, go to alert
      this.state = "ALERT";
      this.alertTimer = this.alertDuration;
    }

    // Animation
    if (Math.abs(this.vx) > 0.1) {
      this.animFrame = (this.animFrame + 0.15) % 4;
    }

    // Friction
    this.vx *= 0.85;
  }

  patrol() {
    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.x;
    
    if (Math.abs(dx) < 5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      this.vx = dx > 0 ? GUARD_PATROL_SPEED : -GUARD_PATROL_SPEED;
      this.facing = dx > 0 ? 1 : -1;
    }
  }

  alert() {
    this.alertTimer--;
    if (this.alertTimer <= 0) {
      this.state = "PATROL";
    }
    // Move toward last seen position
    const dx = this.lastSeenPlayerX - this.x;
    if (Math.abs(dx) > 10) {
      this.vx = dx > 0 ? GUARD_PATROL_SPEED * 1.5 : -GUARD_PATROL_SPEED * 1.5;
      this.facing = dx > 0 ? 1 : -1;
    } else {
      this.vx = 0;
    }
  }

  chase() {
    if (!gameState.player) return;
    
    const dx = gameState.player.x - this.x;
    this.vx = dx > 0 ? GUARD_CHASE_SPEED : -GUARD_CHASE_SPEED;
    this.facing = dx > 0 ? 1 : -1;
  }

  canSeePlayer(p) {
    if (!gameState.player) return false;

    const playerCenterX = gameState.player.x + gameState.player.width / 2;
    const playerCenterY = gameState.player.y + gameState.player.height / 2;
    const guardCenterX = this.x + this.width / 2;
    const guardCenterY = this.y + this.height / 2;

    const dx = playerCenterX - guardCenterX;
    const dy = playerCenterY - guardCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > GUARD_DETECTION_RANGE) return false;

    // Check if player is in front of guard
    if ((this.facing > 0 && dx < 0) || (this.facing < 0 && dx > 0)) {
      return false;
    }

    // Check angle
    const angle = Math.atan2(dy, dx * this.facing) * (180 / Math.PI);
    if (Math.abs(angle) > GUARD_DETECTION_ANGLE / 2) {
      return false;
    }

    return true;
  }

  checkPlatformCollision(platform) {
    return this.x + this.width > platform.x &&
           this.x < platform.x + platform.width &&
           this.y + this.height <= platform.y &&
           this.y + this.height + this.vy >= platform.y;
  }

  checkPlayerCollision() {
    if (!gameState.player) return false;
    
    return p5.prototype.collideRectRect(
      this.x, this.y, this.width, this.height,
      gameState.player.x, gameState.player.y, 
      gameState.player.width, gameState.player.height
    );
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Detection cone
    if (this.state !== "PATROL") {
      p.fill(255, 0, 0, 30);
    } else {
      p.fill(255, 255, 0, 20);
    }
    p.noStroke();
    p.beginShape();
    p.vertex(screenX + this.width/2, this.y + this.height/2);
    for (let i = -GUARD_DETECTION_ANGLE/2; i <= GUARD_DETECTION_ANGLE/2; i += 10) {
      const rad = (i * Math.PI / 180);
      const endX = screenX + this.width/2 + Math.cos(rad) * GUARD_DETECTION_RANGE * this.facing;
      const endY = this.y + this.height/2 + Math.sin(rad) * GUARD_DETECTION_RANGE;
      p.vertex(endX, endY);
    }
    p.endShape(p.CLOSE);
    
    // Body
    p.fill(this.state === "CHASE" ? 255 : (this.state === "ALERT" ? 255 : 200), 
           0, 
           0);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Head
    p.fill(255, 200, 150);
    p.ellipse(screenX + this.width/2, this.y + 12, 22, 22);
    
    // Hat
    p.fill(50, 50, 100);
    p.rect(screenX + this.width/2 - 12, this.y, 24, 8);
    
    // Eyes (angry)
    p.fill(0);
    const eyeOffset = this.facing * 3;
    p.rect(screenX + this.width/2 + eyeOffset - 6, this.y + 10, 4, 2);
    p.rect(screenX + this.width/2 + eyeOffset + 2, this.y + 10, 4, 2);
    
    // Alert indicator
    if (this.state === "ALERT" || this.state === "CHASE") {
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.text("!", screenX + this.width/2, this.y - 15);
    }
    
    p.pop();
  }
}