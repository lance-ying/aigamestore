import { gameState, CANVAS_WIDTH, LANE_Y_POSITIONS } from './globals.js';

export class Enemy {
  constructor(p, lane, type = 'basic') {
    this.p = p;
    this.lane = lane; // 0 or 1
    this.type = type;
    this.x = CANVAS_WIDTH;
    this.y = LANE_Y_POSITIONS[lane];
    this.size = 45;
    this.speed = 2 + gameState.difficulty * 0.5;
    this.active = true;
    this.hit = false;
    
    // Animation
    this.animationPhase = this.p.random(this.p.TWO_PI);
    this.rotationSpeed = 0.1;
    
    // Type-specific properties
    if (type === 'fast') {
      this.color = [255, 50, 50];
      this.speed *= 1.5;
      this.size = 35;
    } else if (type === 'big') {
      this.color = [200, 50, 200];
      this.size = 60;
      this.speed *= 0.7;
    } else {
      this.color = [255, 100, 50];
    }
  }

  update() {
    this.x -= this.speed;
    this.animationPhase += this.rotationSpeed;
    
    // Check collision with player
    if (!this.hit && gameState.player) {
      const dist = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < (this.size + gameState.player.size) / 2) {
        this.onHitPlayer();
      }
    }
    
    // Remove if off screen
    if (this.x < -this.size) {
      this.active = false;
    }
  }

  onHitPlayer() {
    if (this.hit) return;
    
    this.hit = true;
    this.active = false;
    
    // Damage player - count as a miss
    gameState.missedNotes += 2;
    gameState.combo = 0;
    gameState.score = Math.max(0, gameState.score - 200);
    
    // Trigger player damage feedback
    if (gameState.player) {
      gameState.player.takeDamage();
    }
    
    // Create explosion particles at enemy position
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * this.p.TWO_PI;
      const speed = this.p.random(3, 6);
      const particle = {
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed,
        size: this.p.random(4, 8),
        life: 1.0,
        decay: 0.03,
        color: this.color,
        active: true,
        update: function() {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.2;
          this.life -= this.decay;
          if (this.life <= 0) this.active = false;
        },
        draw: function(p) {
          p.noStroke();
          p.fill(...this.color, this.life * 255);
          p.ellipse(this.x, this.y, this.size * this.life);
        }
      };
      gameState.particles.push(particle);
    }
    
    // Create red damage particles at PLAYER position for visual feedback
    if (gameState.player) {
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * this.p.TWO_PI;
        const speed = this.p.random(2, 5);
        const damageParticle = {
          x: gameState.player.x,
          y: gameState.player.y,
          vx: this.p.cos(angle) * speed,
          vy: this.p.sin(angle) * speed,
          size: this.p.random(5, 10),
          life: 1.0,
          decay: 0.025,
          color: [255, 50, 50],
          active: true,
          update: function() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.15;
            this.life -= this.decay;
            if (this.life <= 0) this.active = false;
          },
          draw: function(p) {
            p.noStroke();
            p.fill(...this.color, this.life * 255);
            p.ellipse(this.x, this.y, this.size * this.life);
          }
        };
        gameState.particles.push(damageParticle);
      }
    }
  }

  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Danger glow
    this.p.noStroke();
    this.p.fill(...this.color, 80);
    this.p.ellipse(0, 0, this.size * 1.4, this.size * 1.4);
    
    // Main body
    this.p.fill(...this.color);
    this.p.stroke(50);
    this.p.strokeWeight(2);
    
    this.p.rotate(this.animationPhase);
    
    if (this.type === 'fast') {
      // Triangle shape for fast enemies
      this.p.beginShape();
      this.p.vertex(-this.size/2, this.size/2);
      this.p.vertex(this.size/2, 0);
      this.p.vertex(-this.size/2, -this.size/2);
      this.p.endShape(this.p.CLOSE);
    } else if (this.type === 'big') {
      // Hexagon for big enemies
      this.p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * this.p.TWO_PI;
        this.p.vertex(this.p.cos(angle) * this.size/2, this.p.sin(angle) * this.size/2);
      }
      this.p.endShape(this.p.CLOSE);
    } else {
      // Square for basic enemies
      this.p.rect(-this.size/2, -this.size/2, this.size, this.size);
    }
    
    // Warning symbol
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    this.p.rotate(-this.animationPhase);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(this.size * 0.5);
    this.p.text('!', 0, 0);
    
    this.p.pop();
  }
}