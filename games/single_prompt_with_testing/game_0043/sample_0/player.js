// player.js - Player character class

import { 
  GRAVITY, JUMP_FORCE, MOVE_SPEED, SPRINT_MULTIPLIER, 
  FRICTION, AIR_RESISTANCE, GROUND_LEVEL, WORLD_WIDTH,
  KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_SHIFT, KEY_Z
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    this.holdingPackage = null;
    this.wobbleOffset = 0;
    this.wobbleSpeed = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.jumping = false;
    this.sprinting = false;
  }
  
  update(p, inputs) {
    // Handle input
    const moveLeft = inputs.left;
    const moveRight = inputs.right;
    const jump = inputs.jump;
    const sprint = inputs.sprint;
    const interact = inputs.interact;
    
    this.sprinting = sprint;
    
    // Horizontal movement
    const speed = sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    
    if (moveLeft) {
      this.velocityX -= speed * 0.3;
      this.facing = -1;
    }
    if (moveRight) {
      this.velocityX += speed * 0.3;
      this.facing = 1;
    }
    
    // Apply friction
    if (this.onGround) {
      this.velocityX *= FRICTION;
    } else {
      this.velocityX *= AIR_RESISTANCE;
    }
    
    // Limit horizontal speed
    const maxSpeed = speed;
    this.velocityX = p.constrain(this.velocityX, -maxSpeed, maxSpeed);
    
    // Jumping
    if (jump && this.onGround && !this.jumping) {
      this.velocityY = JUMP_FORCE;
      this.onGround = false;
      this.jumping = true;
    }
    
    if (!jump) {
      this.jumping = false;
    }
    
    // Apply gravity
    this.velocityY += GRAVITY;
    
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // World bounds
    this.x = p.constrain(this.x, this.width / 2, WORLD_WIDTH - this.width / 2);
    
    // Ground collision
    if (this.y + this.height / 2 >= GROUND_LEVEL) {
      this.y = GROUND_LEVEL - this.height / 2;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // Wobble animation
    if (p.abs(this.velocityX) > 0.5) {
      this.wobbleSpeed = p.map(p.abs(this.velocityX), 0, maxSpeed, 0, 0.3);
      this.wobbleOffset += this.wobbleSpeed;
    } else {
      this.wobbleSpeed *= 0.9;
      this.wobbleOffset += this.wobbleSpeed;
    }
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Wobble effect
    const wobble = p.sin(this.wobbleOffset) * 3;
    const squash = this.onGround ? p.abs(p.sin(this.wobbleOffset * 2)) * 2 : 0;
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX, screenY + this.height / 2 + 5, this.width + 5, 8);
    
    // Body (wobbly circle)
    p.fill(255, 180, 100);
    p.stroke(200, 140, 60);
    p.strokeWeight(2);
    p.ellipse(
      screenX + wobble * 0.5,
      screenY + squash,
      this.width + wobble,
      this.height - squash
    );
    
    // Eyes
    p.fill(255);
    p.noStroke();
    const eyeOffsetX = 6 * this.facing;
    p.ellipse(screenX + eyeOffsetX - 4, screenY - 8, 8, 10);
    p.ellipse(screenX + eyeOffsetX + 4, screenY - 8, 8, 10);
    
    // Pupils
    p.fill(0);
    p.ellipse(screenX + eyeOffsetX - 4 + this.facing * 2, screenY - 8, 4, 5);
    p.ellipse(screenX + eyeOffsetX + 4 + this.facing * 2, screenY - 8, 4, 5);
    
    // Mouth
    p.noFill();
    p.stroke(200, 140, 60);
    p.strokeWeight(2);
    p.arc(screenX + wobble * 0.3, screenY + 5, 12, 8, 0, p.PI);
    
    // Arms (simple lines)
    p.stroke(255, 180, 100);
    p.strokeWeight(4);
    const armSwing = p.sin(this.wobbleOffset) * 10;
    p.line(screenX - this.width / 2, screenY, screenX - this.width / 2 - 8, screenY + armSwing);
    p.line(screenX + this.width / 2, screenY, screenX + this.width / 2 + 8, screenY - armSwing);
    
    // Package in hands
    if (this.holdingPackage) {
      p.fill(180, 120, 60);
      p.stroke(120, 80, 40);
      p.strokeWeight(2);
      p.rect(screenX - 10, screenY + 10, 20, 15, 2);
      
      // Package tape
      p.stroke(220, 200, 100);
      p.strokeWeight(2);
      p.line(screenX - 10, screenY + 17, screenX + 10, screenY + 17);
    }
    
    p.pop();
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}