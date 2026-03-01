import { gameState, CANVAS_HEIGHT } from './globals.js';
import { handlePlayerHit } from './collision.js';

// Helper for raycasting intersection
function getLineIntersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  const s1_x = p1_x - p0_x;
  const s1_y = p1_y - p0_y;
  const s2_x = p3_x - p2_x;
  const s2_y = p3_y - p2_y;

  const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return { x: p0_x + (t * s1_x), y: p0_y + (t * s1_y) };
  }
  return null;
}

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.moveSpeed = 3;
    this.jumpPower = -8;
    this.gravity = 0.4;
    this.facingRight = true;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    // Apply gravity
    this.vy += this.gravity;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Check ground collision
    this.onGround = false;
    const platforms = gameState.entities.filter(e => e.type === 'platform');
    for (const platform of platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.onGround = true;
        this.vy = 0;
        this.y = platform.y - this.h / 2;
        break;
      }
    }
    
    // Keep player in horizontal bounds
    this.x = this.p.constrain(this.x, this.w / 2, 600 - this.w / 2);
    
    // Check if player fell off the map
    if (this.y > CANVAS_HEIGHT + 20) {
      handlePlayerHit(this.p);
      return;
    }
    
    // Animation
    if (this.vx !== 0 && this.onGround) {
      this.animTimer++;
      if (this.animTimer > 8) {
        this.animFrame = (this.animFrame + 1) % 2;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  checkPlatformCollision(platform) {
    return this.p.collideRectRect(
      this.x - this.w / 2, this.y - this.h / 2, this.w, this.h,
      platform.x, platform.y, platform.w, platform.h
    ) && this.vy >= 0 && this.y - this.h / 2 < platform.y + 5;
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    if (!this.facingRight) {
      this.p.scale(-1, 1);
    }
    
    // Mouse body (grey)
    this.p.fill(160, 160, 160);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.w, this.h);
    
    // Ears
    this.p.fill(140, 140, 140);
    this.p.ellipse(-8, -8, 8, 10);
    this.p.ellipse(8, -8, 8, 10);
    
    // Eyes
    this.p.fill(0);
    this.p.ellipse(-5, -2, 3, 3);
    this.p.ellipse(5, -2, 3, 3);
    
    // Nose
    this.p.fill(255, 180, 200);
    this.p.ellipse(0, 3, 4, 3);
    
    // Whiskers
    this.p.stroke(80);
    this.p.strokeWeight(1);
    this.p.line(-10, 0, -15, -2);
    this.p.line(-10, 2, -15, 4);
    this.p.line(10, 0, 15, -2);
    this.p.line(10, 2, 15, 4);
    
    // Legs animation
    if (this.animFrame === 1 && this.onGround) {
      this.p.noStroke();
      this.p.fill(150, 150, 150);
      this.p.ellipse(-6, 10, 4, 6);
      this.p.ellipse(6, 10, 4, 6);
    }
    
    this.p.pop();
  }

  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }

  moveLeft() {
    this.vx = -this.moveSpeed;
    this.facingRight = false;
  }

  moveRight() {
    this.vx = this.moveSpeed;
    this.facingRight = true;
  }

  stopMove() {
    this.vx = 0;
  }
}

export class Cat {
  constructor(p, x, y, patrolPath, speed) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 35;
    this.h = 35;
    this.type = 'cat';
    this.patrolPath = patrolPath;
    this.patrolIndex = 0;
    this.speed = speed;
    this.facingRight = true;
    this.animFrame = 0;
    this.animTimer = 0;
    this.sightRadius = 150;
    this.isChasing = false;
  }

  update() {
    let shouldChase = false;
    const player = gameState.player;
    
    // Check sight
    if (player) {
      const dist = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
      if (dist < this.sightRadius) {
        // Check line of sight (blocked by barriers)
        let blocked = false;
        const platforms = gameState.entities.filter(e => e.type === 'platform');
        
        // Filter platforms that are close enough to matter
        const nearbyPlatforms = platforms.filter(plat => {
          const platDist = Math.sqrt(Math.pow(plat.x + plat.w/2 - this.x, 2) + Math.pow(plat.y + plat.h/2 - this.y, 2));
          return platDist < this.sightRadius + Math.max(plat.w, plat.h);
        });

        for (const plat of nearbyPlatforms) {
          if (this.p.collideLineRect(this.x, this.y, player.x, player.y, plat.x, plat.y, plat.w, plat.h)) {
            blocked = true;
            break;
          }
        }
        
        if (!blocked) {
          shouldChase = true;
        }
      }
    }
    
    this.isChasing = shouldChase;

    if (this.isChasing && player) {
      // Chase behavior
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        // Move towards player (slightly faster than patrol)
        const chaseSpeed = this.speed * 1.5;
        this.x += (dx / dist) * chaseSpeed;
        this.y += (dy / dist) * chaseSpeed;
        this.facingRight = dx > 0;
      }
      
      // Fast animation
      this.animTimer++;
      if (this.animTimer > 5) {
        this.animFrame = (this.animFrame + 1) % 2;
        this.animTimer = 0;
      }
    } else {
      // Patrol behavior
      if (this.patrolPath.length > 0) {
        const target = this.patrolPath[this.patrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
        } else {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
          this.facingRight = dx > 0;
        }
        
        // Regular animation
        this.animTimer++;
        if (this.animTimer > 10) {
          this.animFrame = (this.animFrame + 1) % 2;
          this.animTimer = 0;
        }
      }
    }
  }

  draw() {
    this.drawSight();

    this.p.push();
    this.p.translate(this.x, this.y);
    if (!this.facingRight) {
      this.p.scale(-1, 1);
    }
    
    // Cat body (orange-brown)
    this.p.fill(200, 120, 60);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.w, this.h);
    
    // Ears (triangular)
    this.p.fill(180, 100, 50);
    this.p.triangle(-10, -15, -6, -10, -14, -10);
    this.p.triangle(10, -15, 6, -10, 14, -10);
    
    // Eyes
    if (this.isChasing) {
      // Angry eyes when chasing
      this.p.fill(255, 50, 50);
      this.p.ellipse(-7, -3, 8, 8);
      this.p.ellipse(7, -3, 8, 8);
      this.p.fill(0);
      this.p.ellipse(-7, -3, 2, 2);
      this.p.ellipse(7, -3, 2, 2);
    } else {
      // Normal eyes
      this.p.fill(255, 255, 0);
      this.p.ellipse(-7, -3, 6, 8);
      this.p.ellipse(7, -3, 6, 8);
      this.p.fill(0);
      this.p.ellipse(-7, -2, 3, 6);
      this.p.ellipse(7, -2, 3, 6);
    }
    
    // Nose
    this.p.fill(255, 180, 180);
    this.p.triangle(-2, 3, 2, 3, 0, 5);
    
    // Whiskers
    this.p.stroke(60);
    this.p.strokeWeight(1);
    this.p.line(-12, 0, -18, -2);
    this.p.line(-12, 2, -18, 4);
    this.p.line(12, 0, 18, -2);
    this.p.line(12, 2, 18, 4);
    
    // Legs animation
    if (this.animFrame === 1) {
      this.p.noStroke();
      this.p.fill(180, 100, 50);
      this.p.ellipse(-8, 14, 5, 8);
      this.p.ellipse(8, 14, 5, 8);
    }
    
    this.p.pop();
  }

  drawSight() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Sight color changes if chasing
    if (this.isChasing) {
      this.p.fill(255, 100, 100, 60);
    } else {
      this.p.fill(255, 255, 150, 40);
    }
    this.p.noStroke();
    
    this.p.beginShape();
    
    // Get relevant platforms
    const platforms = gameState.entities.filter(e => e.type === 'platform');
    const nearbyPlatforms = platforms.filter(plat => {
      const platDist = Math.sqrt(Math.pow(plat.x + plat.w/2 - this.x, 2) + Math.pow(plat.y + plat.h/2 - this.y, 2));
      return platDist < this.sightRadius + Math.max(plat.w, plat.h);
    });

    // Cast rays
    for (let a = 0; a < 360; a += 10) { // 36 rays
      const rad = this.p.radians(a);
      const dirX = Math.cos(rad);
      const dirY = Math.sin(rad);
      
      let closestDist = this.sightRadius;
      
      // Check platform intersections
      for (const plat of nearbyPlatforms) {
        // Check all 4 sides of the platform
        const lines = [
          {x1: plat.x, y1: plat.y, x2: plat.x + plat.w, y2: plat.y}, // Top
          {x1: plat.x + plat.w, y1: plat.y, x2: plat.x + plat.w, y2: plat.y + plat.h}, // Right
          {x1: plat.x + plat.w, y1: plat.y + plat.h, x2: plat.x, y2: plat.y + plat.h}, // Bottom
          {x1: plat.x, y1: plat.y + plat.h, x2: plat.x, y2: plat.y} // Left
        ];
        
        for (const line of lines) {
          const hit = getLineIntersection(
            this.x, this.y, 
            this.x + dirX * this.sightRadius, this.y + dirY * this.sightRadius,
            line.x1, line.y1, line.x2, line.y2
          );
          
          if (hit) {
            const d = Math.sqrt(Math.pow(hit.x - this.x, 2) + Math.pow(hit.y - this.y, 2));
            if (d < closestDist) {
              closestDist = d;
            }
          }
        }
      }
      
      this.p.vertex(dirX * closestDist, dirY * closestDist);
    }
    
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
  }
}

export class Cheese {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.type = 'cheese';
    this.collected = false;
    this.pulseTimer = 0;
  }

  update() {
    this.pulseTimer += 0.1;
  }

  draw() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    
    const pulse = Math.sin(this.pulseTimer) * 2;
    const size = this.w + pulse;
    
    // Cheese wedge (yellow)
    this.p.fill(255, 220, 60);
    this.p.noStroke();
    this.p.beginShape();
    this.p.vertex(-size / 2, size / 2);
    this.p.vertex(size / 2, size / 2);
    this.p.vertex(0, -size / 2);
    this.p.endShape(this.p.CLOSE);
    
    // Holes
    this.p.fill(230, 180, 40);
    this.p.ellipse(-3, 3, 4, 4);
    this.p.ellipse(4, 5, 3, 3);
    this.p.ellipse(0, -3, 3, 3);
    
    // Sparkle
    this.p.stroke(255, 255, 200, 150);
    this.p.strokeWeight(2);
    const sparkle = Math.abs(Math.sin(this.pulseTimer * 2));
    this.p.line(-size / 2 - 3, -size / 2 - 3, -size / 2 - 3 - sparkle * 3, -size / 2 - 3 - sparkle * 3);
    this.p.line(size / 2 + 3, -size / 2 - 3, size / 2 + 3 + sparkle * 3, -size / 2 - 3 - sparkle * 3);
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = 'platform';
  }

  update() {}

  draw() {
    this.p.push();
    this.p.fill(100, 80, 60);
    this.p.stroke(80, 60, 40);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.w, this.h);
    
    // Add texture lines
    this.p.stroke(120, 100, 80);
    this.p.strokeWeight(1);
    // Vertical lines for texture
    for (let i = 10; i < this.w; i += 20) {
      this.p.line(this.x + i, this.y, this.x + i, this.y + this.h);
    }
    // Horizontal lines if tall (walls)
    if (this.h > this.w) {
      for (let i = 10; i < this.h; i += 20) {
        this.p.line(this.x, this.y + i, this.x + this.w, this.y + i);
      }
    }
    this.p.pop();
  }
}

export class MouseHole {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 35;
    this.h = 35;
    this.type = 'mousehole';
    this.glowTimer = 0;
  }

  update() {
    if (gameState.mouseHoleActive) {
      this.glowTimer += 0.15;
    }
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Glow effect when active
    if (gameState.mouseHoleActive) {
      const glow = Math.abs(Math.sin(this.glowTimer)) * 20 + 10;
      this.p.fill(255, 255, 150, glow);
      this.p.noStroke();
      this.p.ellipse(0, 0, this.w + 20, this.h + 20);
      
      this.p.fill(255, 255, 100, glow * 2);
      this.p.ellipse(0, 0, this.w + 10, this.h + 10);
    }
    
    // Hole
    this.p.fill(...(gameState.mouseHoleActive ? [60, 50, 40] : [30, 25, 20]));
    this.p.noStroke();
    this.p.ellipse(0, 0, this.w, this.h);
    
    // Arch detail
    this.p.fill(...(gameState.mouseHoleActive ? [80, 70, 60] : [50, 45, 40]));
    this.p.arc(0, 5, this.w - 5, this.h - 5, this.p.PI, 0, this.p.CHORD);
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, life) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = 4;
    this.type = 'particle';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
  }

  draw() {
    const alpha = (this.life / this.maxLife) * 255;
    this.p.push();
    this.p.fill(...this.color, alpha);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size, this.size);
    this.p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}