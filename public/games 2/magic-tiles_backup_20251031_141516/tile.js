import { LANE_WIDTH, TILE_HEIGHT, TARGET_ZONE_Y, CANVAS_HEIGHT } from './globals.js';

export class Tile {
  constructor(laneIndex, y = -TILE_HEIGHT) {
    this.laneIndex = laneIndex;
    this.x = laneIndex * LANE_WIDTH;
    this.y = y;
    this.width = LANE_WIDTH;
    this.height = TILE_HEIGHT;
    this.hit = false;
    this.missed = false;
    this.perfect = false;
    this.good = false;
    this.active = true;
    this.scale = 0.8; // Start slightly smaller for spawn animation
    this.rotation = 0;
    this.hitAnimation = 0;
    this.hitTime = 0;
    this.glowIntensity = 0;
  }

  update(speed) {
    if (!this.active && this.hitAnimation <= 0) return;
    
    this.y += speed;
    
    // Animate scale for spawn effect
    if (this.scale < 1.0) {
      this.scale = Math.min(1.0, this.scale + 0.05);
    }
    
    // Update hit animation
    if (this.hitAnimation > 0) {
      this.hitAnimation = Math.max(0, this.hitAnimation - 0.03);
      this.scale = 1.0 + this.hitAnimation * 0.3; // Scale up on hit
    }
    
    // Update glow intensity
    if (this.glowIntensity > 0) {
      this.glowIntensity = Math.max(0, this.glowIntensity - 0.02);
    }
    
    // Check if the tile is completely off screen
    if (this.y > CANVAS_HEIGHT) {
      this.active = false;
      if (!this.hit) {
        this.missed = true;
      }
    }
  }

  draw(p) {
    if (!this.active && this.hitAnimation <= 0) return;
    
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    p.push();
    p.translate(centerX, centerY);
    p.rotate(this.rotation);
    p.scale(this.scale);
    
    // Draw glow effect
    if (this.glowIntensity > 0 || this.hitAnimation > 0) {
      const glowSize = Math.max(this.glowIntensity, this.hitAnimation) * 20;
      p.noStroke();
      
      // Multiple glow layers for better effect
      for (let i = 3; i > 0; i--) {
        const alpha = (this.glowIntensity * 30) / i;
        if (this.perfect) {
          p.fill(0, 255, 0, alpha);
        } else if (this.good) {
          p.fill(255, 255, 0, alpha);
        } else {
          p.fill(100, 100, 255, alpha);
        }
        const size = glowSize * i;
        p.rect(-this.width/2 - size/2, -this.height/2 - size/2, this.width + size, this.height + size);
      }
    }
    
    // Draw the main tile with gradient effect
    if (this.hit) {
      // Fade out hit tiles
      const fadeAlpha = this.hitAnimation * 150 + 50;
      p.fill(80, 80, 80, fadeAlpha);
    } else {
      // Draw gradient for active tiles
      p.fill(0);
    }
    
    p.stroke(60, 60, 60);
    p.strokeWeight(2);
    p.rect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Add inner highlight for 3D effect
    if (!this.hit) {
      p.stroke(40, 40, 40);
      p.strokeWeight(1);
      p.noFill();
      p.rect(-this.width/2 + 2, -this.height/2 + 2, this.width - 4, this.height - 4);
    }
    
    p.pop();
    
    // Draw hit feedback text (outside of transform)
    if (this.hit && this.hitAnimation > 0) {
      const textAlpha = this.hitAnimation * 255;
      const textY = centerY - (1 - this.hitAnimation) * 30; // Float upward
      
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16 + this.hitAnimation * 8);
      
      // Text shadow
      p.fill(0, 0, 0, textAlpha * 0.5);
      if (this.perfect) {
        p.text("PERFECT!", centerX + 1, textY + 1);
        p.fill(0, 255, 0, textAlpha);
        p.text("PERFECT!", centerX, textY);
      } else if (this.good) {
        p.text("GOOD!", centerX + 1, textY + 1);
        p.fill(255, 255, 0, textAlpha);
        p.text("GOOD!", centerX, textY);
      }
    }
  }

  checkHit() {
    // Check if the tile is in the target zone
    const tileBottom = this.y + this.height;
    const tileMiddle = this.y + this.height/2;
    
    if (tileBottom >= TARGET_ZONE_Y && this.y <= TARGET_ZONE_Y + TILE_HEIGHT) {
      // Tile is in the target zone
      this.hit = true;
      this.active = false;
      
      // Check if it's a perfect hit
      if (Math.abs(tileMiddle - (TARGET_ZONE_Y + TILE_HEIGHT/2)) < 20) {
        this.perfect = true;
        this.glowIntensity = 1.0;
        return "perfect";
      } else {
        this.good = true;
        this.glowIntensity = 0.7;
        return "good";
      }
    }
    
    return "miss";
  }

  isInTargetZone() {
    const tileBottom = this.y + this.height;
    return tileBottom >= TARGET_ZONE_Y && this.y <= TARGET_ZONE_Y + TILE_HEIGHT;
  }
}