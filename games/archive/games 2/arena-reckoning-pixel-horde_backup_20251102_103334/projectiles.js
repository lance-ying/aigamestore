// projectiles.js - Projectile class

import { gameState } from './globals.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, owner = "PLAYER") {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
    this.radius = 3;
    this.lifetime = 180; // 3 seconds at 60fps
    this.isDead = false;
    
    // Special properties
    this.piercing = 0;
    this.isBoomerang = false;
    this.returning = false;
    this.maxDistance = 0;
    this.traveledDistance = 0;
    this.rotation = 0;
    this.isLaser = false;
    this.isExplosive = false;
    this.explosionRadius = 0;
  }
  
  update() {
    // Boomerang behavior - track back to player when returning
    if (this.isBoomerang) {
      this.rotation += 0.2;
      
      if (!this.returning) {
        // Track distance traveled
        const dist = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.traveledDistance += dist;
        
        // Start returning after max distance
        if (this.traveledDistance >= this.maxDistance) {
          this.returning = true;
        }
      }
      
      if (this.returning && gameState.player) {
        // Home in on player
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          this.vx = (dx / dist) * speed * 1.2; // Slightly faster return
          this.vy = (dy / dist) * speed * 1.2;
        }
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.isDead = true;
    }
  }
  
  render(p) {
    p.push();
    
    if (this.owner === "PLAYER") {
      if (this.isLaser) {
        p.fill(100, 200, 255);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        // Add laser trail
        p.stroke(100, 200, 255, 100);
        p.strokeWeight(this.radius);
        const trailLength = 15;
        const angle = Math.atan2(this.vy, this.vx);
        const trailX = this.x - Math.cos(angle) * trailLength;
        const trailY = this.y - Math.sin(angle) * trailLength;
        p.line(this.x, this.y, trailX, trailY);
      } else if (this.isExplosive) {
        p.fill(255, 150, 50);
        p.stroke(255, 100, 0);
        p.strokeWeight(2);
        p.circle(this.x, this.y, this.radius * 2);
        // Pulsing effect
        const pulse = Math.sin(this.lifetime * 0.3) * 2;
        p.noFill();
        p.circle(this.x, this.y, (this.radius + pulse) * 2);
      } else if (this.isBoomerang) {
        // Rotating square for boomerang
        p.fill(255, 255, 100);
        p.stroke(200, 200, 50);
        p.strokeWeight(2);
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 8, 8);
        p.pop();
        // Trail effect
        if (this.returning) {
          p.noStroke();
          p.fill(255, 255, 100, 100);
          p.circle(this.x, this.y, 12);
        }
      } else {
        p.fill(255);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
      }
    } else {
      p.fill(255, 150, 50);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 2);
    }
    
    p.pop();
  }
  
  collidesWith(x, y, radius) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.radius + radius);
  }
}