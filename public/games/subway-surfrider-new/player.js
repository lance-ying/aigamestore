// player.js - Player entity and movement logic
import { LANE_POSITIONS, PLAYER_START_Y, PLAYER_WIDTH, PLAYER_HEIGHT, JUMP_HEIGHT, JUMP_DURATION, SLIDE_DURATION } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.currentLaneIndex = 1; // Start in middle lane
    this.x = LANE_POSITIONS[this.currentLaneIndex];
    this.y = PLAYER_START_Y;
    this.targetX = this.x;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.baseHeight = PLAYER_HEIGHT;
    
    // Jump state
    this.isJumping = false;
    this.jumpFrame = 0;
    this.jumpStartY = PLAYER_START_Y;
    
    // Slide state
    this.isSliding = false;
    this.slideFrame = 0;
    
    // Powerups
    this.jetpackActive = false;
    this.jetpackTimer = 0;
    this.hoverboardActive = false;
    this.magnetActive = false;
    this.magnetTimer = 0;
    
    // Animation
    this.bobOffset = 0;
  }
  
  moveLeft() {
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.targetX = LANE_POSITIONS[this.currentLaneIndex];
    }
  }
  
  moveRight() {
    if (this.currentLaneIndex < LANE_POSITIONS.length - 1) {
      this.currentLaneIndex++;
      this.targetX = LANE_POSITIONS[this.currentLaneIndex];
    }
  }
  
  jump() {
    if (!this.isJumping && !this.isSliding && !this.jetpackActive) {
      this.isJumping = true;
      this.jumpFrame = 0;
      this.jumpStartY = this.y;
    }
  }
  
  slide() {
    if (!this.isJumping && !this.isSliding && !this.jetpackActive) {
      this.isSliding = true;
      this.slideFrame = 0;
    }
  }
  
  activateJetpack(duration) {
    this.jetpackActive = true;
    this.jetpackTimer = duration;
    this.isJumping = false;
    this.isSliding = false;
  }
  
  activateHoverboard() {
    this.hoverboardActive = true;
  }
  
  activateMagnet(duration) {
    this.magnetActive = true;
    this.magnetTimer = duration;
  }
  
  update() {
    const p = this.p;
    
    // Smooth lane change
    if (this.x !== this.targetX) {
      const diff = this.targetX - this.x;
      this.x += diff * 0.2;
      if (Math.abs(diff) < 1) {
        this.x = this.targetX;
      }
    }
    
    // Update powerup timers
    if (this.jetpackActive) {
      this.jetpackTimer--;
      if (this.jetpackTimer <= 0) {
        this.jetpackActive = false;
      }
    }
    
    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
      }
    }
    
    // Handle jetpack (overrides jump/slide)
    if (this.jetpackActive) {
      this.y = PLAYER_START_Y - 120;
      this.height = this.baseHeight;
      return;
    }
    
    // Handle jump
    if (this.isJumping) {
      this.jumpFrame++;
      const progress = this.jumpFrame / JUMP_DURATION;
      
      if (progress < 0.5) {
        // Going up
        const jumpProgress = progress * 2;
        this.y = this.jumpStartY - JUMP_HEIGHT * p.sin(jumpProgress * p.PI / 2);
      } else {
        // Coming down
        const fallProgress = (progress - 0.5) * 2;
        this.y = this.jumpStartY - JUMP_HEIGHT * p.cos(fallProgress * p.PI / 2);
      }
      
      this.height = this.baseHeight;
      
      if (this.jumpFrame >= JUMP_DURATION) {
        this.isJumping = false;
        this.y = PLAYER_START_Y;
      }
    }
    // Handle slide
    else if (this.isSliding) {
      this.slideFrame++;
      this.y = PLAYER_START_Y + 20;
      this.height = this.baseHeight * 0.4;
      
      if (this.slideFrame >= SLIDE_DURATION) {
        this.isSliding = false;
        this.y = PLAYER_START_Y;
        this.height = this.baseHeight;
      }
    }
    // Normal running state
    else {
      this.y = PLAYER_START_Y;
      this.height = this.baseHeight;
      this.bobOffset = p.sin(p.frameCount * 0.3) * 3;
    }
  }
  
  getBoundingBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height + this.bobOffset,
      width: this.width,
      height: this.height
    };
  }
  
  render() {
    const p = this.p;
    p.push();
    
    const box = this.getBoundingBox();
    
    // Draw hoverboard glow if active
    if (this.hoverboardActive) {
      p.stroke(255, 150, 0);
      p.strokeWeight(4);
      p.noFill();
      p.rect(box.x - 5, box.y - 5, box.width + 10, box.height + 10, 5);
    }
    
    // Draw player body
    p.fill(50, 150, 255);
    p.stroke(30, 100, 200);
    p.strokeWeight(2);
    p.rect(box.x, box.y, box.width, box.height, 5);
    
    // Draw face
    p.fill(255);
    p.noStroke();
    p.circle(box.x + box.width * 0.3, box.y + box.height * 0.25, 5);
    p.circle(box.x + box.width * 0.7, box.y + box.height * 0.25, 5);
    
    // Draw jetpack flames if active
    if (this.jetpackActive) {
      p.fill(255, 100, 0);
      p.triangle(
        box.x + box.width * 0.3, box.y + box.height,
        box.x + box.width * 0.5, box.y + box.height + 20,
        box.x + box.width * 0.4, box.y + box.height
      );
      p.fill(255, 200, 0);
      p.triangle(
        box.x + box.width * 0.6, box.y + box.height,
        box.x + box.width * 0.5, box.y + box.height + 15,
        box.x + box.width * 0.7, box.y + box.height
      );
    }
    
    p.pop();
  }
}