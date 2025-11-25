// player.js - Player character implementation

import { 
  PLAYER_SIZE, PLAYER_SPEED, JUMP_STRENGTH, GRAVITY, MAX_FALL_SPEED,
  DASH_SPEED, DASH_DURATION, WALL_SLIDE_SPEED, WALL_JUMP_X, WALL_JUMP_Y,
  TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';
import { getTileAt, isSolidTile, isWallTile, isSpikeTile, isGoalTile, isStrawberryTile } from './levels.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = PLAYER_SIZE;
    this.onGround = false;
    this.canJump = true;
    this.hasDoubleJump = true;
    this.dashesRemaining = 1;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.isClimbing = false;
    this.onWall = 0; // -1 left, 1 right, 0 none
    this.dead = false;
    this.reachedGoal = false;
  }

  update(p, level, inputs) {
    if (this.dead || this.reachedGoal) {
      return;
    }

    // Handle dashing
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = this.dashDirX * 2;
        this.vy = this.dashDirY * 2;
      } else {
        this.x += this.dashDirX * DASH_SPEED;
        this.y += this.dashDirY * DASH_SPEED;
        return; // Skip normal physics during dash
      }
    }

    // Apply gravity
    if (!this.isClimbing) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) {
        this.vy = MAX_FALL_SPEED;
      }
    }

    // Horizontal movement
    if (inputs.left && !inputs.right) {
      this.vx = -PLAYER_SPEED;
    } else if (inputs.right && !inputs.left) {
      this.vx = PLAYER_SPEED;
    } else {
      this.vx *= 0.8; // Friction
    }

    // Wall sliding
    this.checkWalls(level);
    if (this.onWall !== 0 && !this.onGround && this.vy > 0) {
      this.vy = WALL_SLIDE_SPEED;
      this.isClimbing = true;
      // Restore abilities on wall
      this.hasDoubleJump = true;
      this.dashesRemaining = 1;
    } else {
      this.isClimbing = false;
    }

    // Climbing movement on walls
    if (this.isClimbing && this.onWall !== 0) {
      if (inputs.up) {
        this.vy = -PLAYER_SPEED;
      } else if (inputs.down) {
        this.vy = PLAYER_SPEED;
      } else {
        this.vy = 0;
      }
    }

    // Jumping
    if (inputs.jump && !inputs.jumpHeld) {
      if (this.onGround || this.canJump) {
        this.vy = JUMP_STRENGTH;
        this.onGround = false;
        this.canJump = false;
      } else if (this.hasDoubleJump && !this.onGround && !this.isClimbing) {
        this.vy = JUMP_STRENGTH;
        this.hasDoubleJump = false;
      } else if (this.isClimbing && this.onWall !== 0) {
        // Wall jump
        this.vx = -this.onWall * WALL_JUMP_X;
        this.vy = WALL_JUMP_Y;
        this.isClimbing = false;
        this.onWall = 0;
      }
      inputs.jumpHeld = true;
    }
    if (!inputs.jump) {
      inputs.jumpHeld = false;
    }

    // Dashing
    if (inputs.dash && !inputs.dashHeld && this.dashesRemaining > 0) {
      this.startDash(inputs);
      inputs.dashHeld = true;
    }
    if (!inputs.dash) {
      inputs.dashHeld = false;
    }

    // Move and check collisions
    this.x += this.vx;
    this.handleCollisions(p, level, true, false);
    
    this.y += this.vy;
    this.handleCollisions(p, level, false, true);

    // Check if on ground
    this.checkGround(level);
    if (this.onGround) {
      this.hasDoubleJump = true;
      this.dashesRemaining = 1;
      this.canJump = true;
    }

    // Keep player in bounds
    if (this.x < this.size / 2) this.x = this.size / 2;
    if (this.x > CANVAS_WIDTH - this.size / 2) this.x = CANVAS_WIDTH - this.size / 2;
    if (this.y > CANVAS_HEIGHT + 50) {
      this.dead = true;
    }

    // Check hazards and goals
    this.checkTileInteractions(p, level);
  }

  startDash(inputs) {
    let dirX = 0;
    let dirY = 0;

    if (inputs.left) dirX = -1;
    if (inputs.right) dirX = 1;
    if (inputs.up) dirY = -1;
    if (inputs.down) dirY = 1;

    // Default to right if no direction
    if (dirX === 0 && dirY === 0) {
      dirX = 1;
    }

    // Normalize diagonal
    if (dirX !== 0 && dirY !== 0) {
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX /= len;
      dirY /= len;
    }

    this.isDashing = true;
    this.dashTimer = DASH_DURATION;
    this.dashDirX = dirX;
    this.dashDirY = dirY;
    this.dashesRemaining--;
    this.vx = 0;
    this.vy = 0;
  }

  handleCollisions(p, level, horizontal, vertical) {
    const corners = [
      { x: this.x - this.size / 2, y: this.y - this.size / 2 },
      { x: this.x + this.size / 2, y: this.y - this.size / 2 },
      { x: this.x - this.size / 2, y: this.y + this.size / 2 },
      { x: this.x + this.size / 2, y: this.y + this.size / 2 }
    ];

    for (let corner of corners) {
      const tile = getTileAt(level, corner.x, corner.y);
      if (isSolidTile(tile)) {
        if (horizontal) {
          if (this.vx > 0) {
            this.x = Math.floor(corner.x / TILE_SIZE) * TILE_SIZE - this.size / 2;
          } else if (this.vx < 0) {
            this.x = Math.ceil(corner.x / TILE_SIZE) * TILE_SIZE + this.size / 2;
          }
          this.vx = 0;
        }
        if (vertical) {
          if (this.vy > 0) {
            this.y = Math.floor(corner.y / TILE_SIZE) * TILE_SIZE - this.size / 2;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = Math.ceil(corner.y / TILE_SIZE) * TILE_SIZE + this.size / 2;
          }
          this.vy = 0;
        }
      }
    }
  }

  checkGround(level) {
    const checkY = this.y + this.size / 2 + 1;
    const leftTile = getTileAt(level, this.x - this.size / 2 + 2, checkY);
    const rightTile = getTileAt(level, this.x + this.size / 2 - 2, checkY);
    this.onGround = isSolidTile(leftTile) || isSolidTile(rightTile);
  }

  checkWalls(level) {
    const checkLeft = this.x - this.size / 2 - 1;
    const checkRight = this.x + this.size / 2 + 1;
    const midY = this.y;
    
    const leftTile = getTileAt(level, checkLeft, midY);
    const rightTile = getTileAt(level, checkRight, midY);
    
    if (isWallTile(leftTile) || isSolidTile(leftTile)) {
      this.onWall = -1;
    } else if (isWallTile(rightTile) || isSolidTile(rightTile)) {
      this.onWall = 1;
    } else {
      this.onWall = 0;
    }
  }

  checkTileInteractions(p, level) {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    
    // Check surrounding tiles
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < level.tiles.length && c >= 0 && c < level.tiles[0].length) {
          const tile = level.tiles[r][c];
          const tileX = c * TILE_SIZE + TILE_SIZE / 2;
          const tileY = r * TILE_SIZE + TILE_SIZE / 2;
          
          if (isSpikeTile(tile)) {
            const dist = p.dist(this.x, this.y, tileX, tileY);
            if (dist < this.size / 2 + TILE_SIZE / 2) {
              this.dead = true;
            }
          } else if (isGoalTile(tile)) {
            const dist = p.dist(this.x, this.y, tileX, tileY);
            if (dist < this.size / 2 + TILE_SIZE / 2) {
              this.reachedGoal = true;
            }
          }
        }
      }
    }
  }

  draw(p) {
    p.push();
    
    // Draw player body (pink/red hair)
    if (this.isDashing) {
      p.fill(255, 100, 100, 150);
    } else {
      p.fill(255, 150, 150);
    }
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    
    // Draw face details
    p.fill(50);
    p.circle(this.x - 3, this.y - 2, 2); // Left eye
    p.circle(this.x + 3, this.y - 2, 2); // Right eye
    
    // Show climbing state
    if (this.isClimbing) {
      p.stroke(100, 255, 100);
      p.strokeWeight(2);
      p.noFill();
      p.circle(this.x, this.y, this.size + 4);
    }
    
    // Show dash indicator
    p.noStroke();
    if (this.dashesRemaining > 0) {
      p.fill(100, 200, 255);
      p.circle(this.x, this.y - this.size / 2 - 5, 4);
    }
    
    p.pop();
  }
}