// Entity classes for the game
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PATH_WIDTH, LANE_WIDTH, OBSTACLE_TYPES } from './globals.js';

export class Player {
  constructor(x, y, z) {
    this.x = x; // Lateral position (-1, 0, 1 for left, center, right lane)
    this.y = y; // Vertical position (for jumping)
    this.z = z; // Forward position
    this.width = 25;
    this.height = 40;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.isSliding = false;
    this.isJumping = false;
    
    // Movement
    this.targetLane = 0; // -1, 0, 1
    this.currentLane = 0;
    this.laneTransitionSpeed = 0.15;
    
    // Animation
    this.runCycle = 0;
    this.slideTimer = 0;
    this.slideMaxTime = 20;
    
    // Game state
    this.health = 100;
    this.isAlive = true;
    
    // Collision
    this.collisionBox = {
      width: 20,
      height: this.height,
      offsetY: 0
    };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.isAlive) return;
    
    // Update run animation
    this.runCycle += gameState.currentSpeed * 0.3;
    
    // Handle lane transitions
    const targetX = this.targetLane * LANE_WIDTH;
    this.x += (targetX - this.x) * this.laneTransitionSpeed;
    
    // Handle jumping
    if (this.isJumping) {
      this.vy += gameState.gravity;
      this.y += this.vy;
      
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
        this.onGround = true;
      }
    }
    
    // Handle sliding
    if (this.isSliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.collisionBox.height = this.height;
        this.collisionBox.offsetY = 0;
      }
    }
    
    // Move forward
    this.z += gameState.currentSpeed;
    gameState.distanceTraveled = this.z;
    
    // Update distance score
    gameState.distance = Math.floor(this.z / 10);
    
    // Log position periodically
    if (p.frameCount % 30 === 0) {
      this.logPosition(p);
    }
  }
  
  jump() {
    if (this.onGround && !this.isSliding) {
      this.vy = -15;
      this.isJumping = true;
      this.onGround = false;
    }
  }
  
  slide() {
    if (this.onGround && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideMaxTime;
      this.collisionBox.height = this.height * 0.4;
      this.collisionBox.offsetY = this.height * 0.6;
    }
  }
  
  moveLeft() {
    if (this.targetLane > -1) {
      this.targetLane--;
      gameState.turnsCompleted++;
    }
  }
  
  moveRight() {
    if (this.targetLane < 1) {
      this.targetLane++;
      gameState.turnsCompleted++;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isAlive = false;
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: CANVAS_WIDTH / 2 + this.x,
        screen_y: CANVAS_HEIGHT - 100 + this.y,
        game_x: this.x,
        game_y: this.y,
        game_z: this.z,
        lane: this.currentLane,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    
    // Calculate screen position
    const screenX = CANVAS_WIDTH / 2 + this.x;
    const screenY = CANVAS_HEIGHT - 100 + this.y;
    
    // Shadow
    p.fill(0, 0, 0, 100);
    p.ellipse(screenX, CANVAS_HEIGHT - 60, this.width * 1.2, 10);
    
    if (this.isSliding) {
      // Sliding pose
      p.fill(220, 180, 140);
      p.rectMode(p.CENTER);
      p.rect(screenX, screenY + 15, this.width * 1.5, this.height * 0.4);
      
      // Head
      p.fill(200, 160, 120);
      p.circle(screenX + 15, screenY + 10, 20);
    } else {
      // Body
      p.fill(220, 180, 140);
      p.rectMode(p.CENTER);
      p.rect(screenX, screenY, this.width, this.height);
      
      // Head
      p.fill(200, 160, 120);
      p.circle(screenX, screenY - this.height / 2 - 10, 20);
      
      // Running animation - legs
      const legOffset = Math.sin(this.runCycle) * 5;
      p.fill(180, 140, 100);
      p.rect(screenX - 8, screenY + this.height / 2 + legOffset, 6, 15);
      p.rect(screenX + 8, screenY + this.height / 2 - legOffset, 6, 15);
      
      // Arms
      const armOffset = Math.sin(this.runCycle + Math.PI) * 5;
      p.rect(screenX - 15, screenY - 5 + armOffset, 6, 20);
      p.rect(screenX + 15, screenY - 5 - armOffset, 6, 20);
    }
    
    // Eyes
    p.fill(255);
    p.circle(screenX - 5, screenY - this.height / 2 - 10, 5);
    p.circle(screenX + 5, screenY - this.height / 2 - 10, 5);
    p.fill(0);
    p.circle(screenX - 5, screenY - this.height / 2 - 10, 2);
    p.circle(screenX + 5, screenY - this.height / 2 - 10, 2);
    
    p.pop();
  }
}

export class PathSegment {
  constructor(z, width, direction = 0) {
    this.z = z;
    this.width = width;
    this.direction = direction; // 0 = straight, -1 = left, 1 = right
    this.length = 200;
    this.hasIntersection = false;
    this.intersectionZ = null;
    
    gameState.segments.push(this);
  }
  
  isVisible() {
    const distanceFromPlayer = this.z - gameState.player.z;
    return distanceFromPlayer < 800 && distanceFromPlayer > -200;
  }
  
  render(p) {
    if (!this.isVisible()) return;
    
    const distanceFromPlayer = this.z - gameState.player.z;
    const perspectiveScale = 1 - (distanceFromPlayer / 1000);
    
    if (perspectiveScale <= 0) return;
    
    // Calculate screen position with perspective
    const screenY = CANVAS_HEIGHT - 60 - (distanceFromPlayer * 0.3);
    const segmentWidth = this.width * perspectiveScale;
    
    // Path surface
    p.fill(100, 80, 60);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(CANVAS_WIDTH / 2, screenY, segmentWidth, 50 * perspectiveScale);
    
    // Path edges
    p.stroke(60, 50, 40);
    p.strokeWeight(3 * perspectiveScale);
    p.line(
      CANVAS_WIDTH / 2 - segmentWidth / 2, screenY - 25 * perspectiveScale,
      CANVAS_WIDTH / 2 - segmentWidth / 2, screenY + 25 * perspectiveScale
    );
    p.line(
      CANVAS_WIDTH / 2 + segmentWidth / 2, screenY - 25 * perspectiveScale,
      CANVAS_WIDTH / 2 + segmentWidth / 2, screenY + 25 * perspectiveScale
    );
    
    // Lane dividers
    p.stroke(80, 70, 50);
    p.strokeWeight(1 * perspectiveScale);
    const laneOffset = segmentWidth / 3;
    p.line(
      CANVAS_WIDTH / 2 - laneOffset, screenY - 25 * perspectiveScale,
      CANVAS_WIDTH / 2 - laneOffset, screenY + 25 * perspectiveScale
    );
    p.line(
      CANVAS_WIDTH / 2 + laneOffset, screenY - 25 * perspectiveScale,
      CANVAS_WIDTH / 2 + laneOffset, screenY + 25 * perspectiveScale
    );
  }
}

export class Obstacle {
  constructor(z, lane, type) {
    this.z = z;
    this.lane = lane; // -1, 0, 1
    this.type = type;
    this.width = 35;
    this.height = type === OBSTACLE_TYPES.LOW_BARRIER ? 20 : 40;
    this.collected = false;
    
    gameState.obstacles.push(this);
    gameState.entities.push(this);
  }
  
  isVisible() {
    const distanceFromPlayer = this.z - gameState.player.z;
    return distanceFromPlayer < 500 && distanceFromPlayer > -100;
  }
  
  checkCollision(player) {
    if (this.collected) return false;
    
    const distanceZ = Math.abs(this.z - player.z);
    const distanceX = Math.abs(this.lane * LANE_WIDTH - player.x);
    
    if (distanceZ < 20 && distanceX < 30) {
      // Check specific collision based on type
      if (this.type === OBSTACLE_TYPES.GAP) {
        // Must be jumping to avoid gap
        return player.onGround;
      } else if (this.type === OBSTACLE_TYPES.LOW_BARRIER) {
        // Must be sliding to avoid low barrier
        return !player.isSliding && player.y >= -10;
      } else {
        // Regular obstacles - avoid by being in different lane or jumping
        return player.y >= -20;
      }
    }
    
    return false;
  }
  
  render(p) {
    if (!this.isVisible() || this.collected) return;
    
    const distanceFromPlayer = this.z - gameState.player.z;
    const perspectiveScale = Math.max(0.1, 1 - (distanceFromPlayer / 600));
    
    const screenY = CANVAS_HEIGHT - 60 - (distanceFromPlayer * 0.3);
    const screenX = CANVAS_WIDTH / 2 + (this.lane * LANE_WIDTH);
    
    p.push();
    
    switch (this.type) {
      case OBSTACLE_TYPES.GAP:
        // Draw gap as dark area
        p.fill(20, 20, 30);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(screenX, screenY, this.width * perspectiveScale, 60 * perspectiveScale);
        break;
        
      case OBSTACLE_TYPES.BARRIER:
        // Stone barrier
        p.fill(120, 100, 80);
        p.stroke(80, 60, 40);
        p.strokeWeight(2 * perspectiveScale);
        p.rectMode(p.CENTER);
        p.rect(screenX, screenY - 20 * perspectiveScale, 
               this.width * perspectiveScale, this.height * perspectiveScale);
        
        // Detail blocks
        p.fill(100, 80, 60);
        for (let i = 0; i < 3; i++) {
          p.rect(screenX + (i - 1) * 10 * perspectiveScale, 
                 screenY - 25 * perspectiveScale, 
                 8 * perspectiveScale, 8 * perspectiveScale);
        }
        break;
        
      case OBSTACLE_TYPES.LOW_BARRIER:
        // Low wooden barrier
        p.fill(140, 100, 60);
        p.stroke(100, 70, 40);
        p.strokeWeight(2 * perspectiveScale);
        p.rectMode(p.CENTER);
        p.rect(screenX, screenY - 5 * perspectiveScale, 
               this.width * perspectiveScale, this.height * perspectiveScale);
        
        // Cross pattern
        p.line(screenX - 15 * perspectiveScale, screenY - 15 * perspectiveScale,
               screenX + 15 * perspectiveScale, screenY + 5 * perspectiveScale);
        p.line(screenX + 15 * perspectiveScale, screenY - 15 * perspectiveScale,
               screenX - 15 * perspectiveScale, screenY + 5 * perspectiveScale);
        break;
        
      case OBSTACLE_TYPES.PILLAR:
        // Stone pillar
        p.fill(130, 110, 90);
        p.stroke(90, 70, 50);
        p.strokeWeight(2 * perspectiveScale);
        p.rectMode(p.CENTER);
        p.rect(screenX, screenY - 30 * perspectiveScale, 
               this.width * perspectiveScale, 60 * perspectiveScale);
        
        // Top detail
        p.fill(110, 90, 70);
        p.rect(screenX, screenY - 60 * perspectiveScale, 
               (this.width + 10) * perspectiveScale, 10 * perspectiveScale);
        break;
    }
    
    p.pop();
  }
}

export class Coin {
  constructor(z, lane, y = 0) {
    this.z = z;
    this.lane = lane;
    this.y = y; // Height above ground
    this.radius = 10;
    this.collected = false;
    this.rotation = 0;
    this.rotationSpeed = 0.1;
    
    gameState.collectibles.push(this);
    gameState.entities.push(this);
  }
  
  isVisible() {
    const distanceFromPlayer = this.z - gameState.player.z;
    return distanceFromPlayer < 500 && distanceFromPlayer > -100;
  }
  
  checkCollection(player) {
    if (this.collected) return false;
    
    const distanceZ = Math.abs(this.z - player.z);
    const distanceX = Math.abs(this.lane * LANE_WIDTH - player.x);
    const distanceY = Math.abs(this.y - player.y);
    
    if (distanceZ < 15 && distanceX < 25 && distanceY < 30) {
      this.collected = true;
      gameState.coins++;
      gameState.coinsCollected++;
      gameState.score += 10;
      
      // Create particle effect
      for (let i = 0; i < 5; i++) {
        const particle = new CoinParticle(
          CANVAS_WIDTH / 2 + player.x,
          CANVAS_HEIGHT - 80 + player.y
        );
        gameState.particles.push(particle);
      }
      
      return true;
    }
    
    return false;
  }
  
  render(p) {
    if (!this.isVisible() || this.collected) return;
    
    const distanceFromPlayer = this.z - gameState.player.z;
    const perspectiveScale = Math.max(0.1, 1 - (distanceFromPlayer / 600));
    
    const screenY = CANVAS_HEIGHT - 60 - (distanceFromPlayer * 0.3) - this.y * perspectiveScale;
    const screenX = CANVAS_WIDTH / 2 + (this.lane * LANE_WIDTH);
    
    this.rotation += this.rotationSpeed;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Coin glow
    p.fill(255, 223, 0, 100);
    p.noStroke();
    p.circle(0, 0, (this.radius * 2.5) * perspectiveScale);
    
    // Coin body
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2 * perspectiveScale);
    p.circle(0, 0, (this.radius * 2) * perspectiveScale);
    
    // Coin detail
    p.fill(255, 235, 100);
    p.noStroke();
    p.circle(0, 0, (this.radius * 1.2) * perspectiveScale);
    
    p.pop();
  }
}

export class CoinParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6 - 2;
    this.lifetime = 30;
    this.age = 0;
    this.size = Math.random() * 4 + 3;
    this.color = [255, 215, 0];
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - (this.age / this.lifetime)) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}