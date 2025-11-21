import { LANES, LANE_X_POSITIONS, GROUND_Y, PLAYER_SIZE, PLAYER_STATES } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.lane = LANES.CENTER;
    this.x = LANE_X_POSITIONS[this.lane];
    this.y = GROUND_Y;
    this.targetX = this.x;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.state = PLAYER_STATES.RUNNING;
    this.jumpVelocity = 0;
    this.jumpSpeed = -12;
    this.gravity = 0.6;
    this.slideTimer = 0;
    this.slideDuration = 20;
    this.laneChangeSpeed = 15;
  }

  moveLeft() {
    if (this.lane > LANES.LEFT) {
      this.lane--;
      this.targetX = LANE_X_POSITIONS[this.lane];
    }
  }

  moveRight() {
    if (this.lane < LANES.RIGHT) {
      this.lane++;
      this.targetX = LANE_X_POSITIONS[this.lane];
    }
  }

  jump() {
    if (this.state === PLAYER_STATES.RUNNING) {
      this.state = PLAYER_STATES.JUMPING;
      this.jumpVelocity = this.jumpSpeed;
    }
  }

  slide() {
    if (this.state === PLAYER_STATES.RUNNING) {
      this.state = PLAYER_STATES.SLIDING;
      this.slideTimer = this.slideDuration;
    }
  }

  update() {
    // Smooth lane transition
    if (this.x < this.targetX) {
      this.x = Math.min(this.x + this.laneChangeSpeed, this.targetX);
    } else if (this.x > this.targetX) {
      this.x = Math.max(this.x - this.laneChangeSpeed, this.targetX);
    }

    // Handle jumping
    if (this.state === PLAYER_STATES.JUMPING) {
      this.jumpVelocity += this.gravity;
      this.y += this.jumpVelocity;
      
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.jumpVelocity = 0;
        this.state = PLAYER_STATES.RUNNING;
      }
    }

    // Handle sliding
    if (this.state === PLAYER_STATES.SLIDING) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.state = PLAYER_STATES.RUNNING;
      }
    }
  }

  getHitbox() {
    if (this.state === PLAYER_STATES.SLIDING) {
      return {
        x: this.x - this.width / 2,
        y: this.y - this.height / 4,
        width: this.width,
        height: this.height / 2
      };
    }
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  render() {
    this.p.push();
    
    if (this.state === PLAYER_STATES.RUNNING) {
      this.renderRunning();
    } else if (this.state === PLAYER_STATES.JUMPING) {
      this.renderJumping();
    } else if (this.state === PLAYER_STATES.SLIDING) {
      this.renderSliding();
    }
    
    this.p.pop();
  }

  renderRunning() {
    const p = this.p;
    const bobOffset = Math.sin(p.frameCount * 0.3) * 3;
    
    // Body
    p.fill(50, 150, 250);
    p.rect(this.x - 15, this.y - 35 + bobOffset, 30, 25, 5);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x, this.y - 45 + bobOffset, 20, 20);
    
    // Legs (running animation)
    const legOffset = Math.sin(p.frameCount * 0.4) * 8;
    p.stroke(50, 150, 250);
    p.strokeWeight(4);
    p.line(this.x - 5, this.y - 10, this.x - 5, this.y + legOffset);
    p.line(this.x + 5, this.y - 10, this.x + 5, this.y - legOffset);
    p.noStroke();
    
    // Arms
    const armOffset = Math.sin(p.frameCount * 0.4) * 5;
    p.stroke(255, 220, 180);
    p.strokeWeight(3);
    p.line(this.x - 15, this.y - 30 + bobOffset, this.x - 20, this.y - 20 + armOffset);
    p.line(this.x + 15, this.y - 30 + bobOffset, this.x + 20, this.y - 20 - armOffset);
    p.noStroke();
  }

  renderJumping() {
    const p = this.p;
    
    // Body
    p.fill(50, 150, 250);
    p.rect(this.x - 15, this.y - 35, 30, 25, 5);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x, this.y - 45, 20, 20);
    
    // Legs (tucked)
    p.stroke(50, 150, 250);
    p.strokeWeight(4);
    p.line(this.x - 5, this.y - 10, this.x - 8, this.y - 5);
    p.line(this.x + 5, this.y - 10, this.x + 8, this.y - 5);
    p.noStroke();
    
    // Arms (raised)
    p.stroke(255, 220, 180);
    p.strokeWeight(3);
    p.line(this.x - 15, this.y - 30, this.x - 18, this.y - 40);
    p.line(this.x + 15, this.y - 30, this.x + 18, this.y - 40);
    p.noStroke();
  }

  renderSliding() {
    const p = this.p;
    
    // Body (horizontal)
    p.fill(50, 150, 250);
    p.rect(this.x - 20, this.y - 15, 40, 15, 3);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x - 15, this.y - 15, 15, 15);
    
    // Legs (extended back)
    p.stroke(50, 150, 250);
    p.strokeWeight(3);
    p.line(this.x + 5, this.y - 5, this.x + 20, this.y - 5);
    p.noStroke();
  }
}