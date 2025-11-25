// wobbler.js - Wobbler character implementation

import { Joint, Stick, checkJointCollision } from './physics.js';
import { GROUND_Y } from './globals.js';

export class Wobbler {
  constructor(x, y, team, type = 'basic') {
    this.team = team; // 'player' or 'enemy'
    this.type = type; // 'basic' or 'strong'
    this.alive = true;
    this.health = type === 'strong' ? 150 : 100;
    this.maxHealth = this.health;
    this.attackPower = type === 'strong' ? 15 : 10;
    this.attackCooldown = 0;
    this.attackRange = 40;
    
    // Create joints for body parts
    const bodyHeight = type === 'strong' ? 45 : 35;
    const bodyWidth = type === 'strong' ? 14 : 10;
    
    this.head = new Joint(x, y - bodyHeight, bodyWidth);
    this.torso = new Joint(x, y - bodyHeight * 0.6, bodyWidth * 0.8);
    this.hip = new Joint(x, y - bodyHeight * 0.3, bodyWidth * 0.7);
    
    this.leftShoulder = new Joint(x - bodyWidth * 0.5, y - bodyHeight * 0.7, bodyWidth * 0.5);
    this.rightShoulder = new Joint(x + bodyWidth * 0.5, y - bodyHeight * 0.7, bodyWidth * 0.5);
    
    this.leftHand = new Joint(x - bodyWidth * 1.2, y - bodyHeight * 0.4, bodyWidth * 0.6);
    this.rightHand = new Joint(x + bodyWidth * 1.2, y - bodyHeight * 0.4, bodyWidth * 0.6);
    
    this.leftKnee = new Joint(x - bodyWidth * 0.3, y - bodyHeight * 0.15, bodyWidth * 0.5);
    this.rightKnee = new Joint(x + bodyWidth * 0.3, y - bodyHeight * 0.15, bodyWidth * 0.5);
    
    this.leftFoot = new Joint(x - bodyWidth * 0.5, y, bodyWidth * 0.7);
    this.rightFoot = new Joint(x + bodyWidth * 0.5, y, bodyWidth * 0.7);
    
    this.joints = [
      this.head, this.torso, this.hip,
      this.leftShoulder, this.rightShoulder,
      this.leftHand, this.rightHand,
      this.leftKnee, this.rightKnee,
      this.leftFoot, this.rightFoot
    ];
    
    // Create sticks (constraints)
    this.sticks = [
      new Stick(this.head, this.torso),
      new Stick(this.torso, this.hip),
      new Stick(this.torso, this.leftShoulder),
      new Stick(this.torso, this.rightShoulder),
      new Stick(this.leftShoulder, this.leftHand),
      new Stick(this.rightShoulder, this.rightHand),
      new Stick(this.hip, this.leftKnee),
      new Stick(this.hip, this.rightKnee),
      new Stick(this.leftKnee, this.leftFoot),
      new Stick(this.rightKnee, this.rightFoot)
    ];
    
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.targetX = team === 'enemy' ? 50 : 550;
  }

  update(frameCount) {
    if (!this.alive) return;
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Physics update
    const gravity = 0.5;
    const damping = 0.98;
    
    for (let joint of this.joints) {
      joint.update(gravity, damping);
      joint.constrain(GROUND_Y);
    }
    
    // Apply wobble movement
    this.wobblePhase += 0.05;
    const wobbleForce = Math.sin(this.wobblePhase) * 0.3;
    const moveDirection = this.team === 'enemy' ? -1 : 1;
    
    // Move towards target
    const centerX = this.getCenterX();
    const distToTarget = Math.abs(centerX - this.targetX);
    
    if (distToTarget > 30) {
      this.hip.x += moveDirection * 0.5 + wobbleForce;
      this.leftFoot.x += moveDirection * 0.4;
      this.rightFoot.x += moveDirection * 0.4;
    }
    
    // Constrain sticks
    for (let i = 0; i < 3; i++) {
      for (let stick of this.sticks) {
        stick.constrain();
      }
    }
    
    // Check if fallen or out of bounds
    if (this.head.y > GROUND_Y - 10 || this.getCenterX() < -50 || this.getCenterX() > 650) {
      this.health = 0;
      this.alive = false;
    }
  }

  getCenterX() {
    return this.hip.x;
  }

  getCenterY() {
    return this.hip.y;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  attack(target) {
    if (this.attackCooldown === 0 && this.alive && target.alive) {
      const dx = target.getCenterX() - this.getCenterX();
      const dy = target.getCenterY() - this.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.attackRange) {
        target.takeDamage(this.attackPower);
        this.attackCooldown = 60;
        
        // Apply knockback
        const knockback = 3;
        const angle = Math.atan2(dy, dx);
        target.hip.x += Math.cos(angle) * knockback;
        target.hip.y += Math.sin(angle) * knockback;
        
        return true;
      }
    }
    return false;
  }

  handleCollision(other) {
    if (!this.alive || !other.alive) return;
    
    for (let j1 of this.joints) {
      for (let j2 of other.joints) {
        checkJointCollision(j1, j2);
      }
    }
  }

  draw(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Draw sticks (limbs)
    p.strokeWeight(this.type === 'strong' ? 6 : 4);
    p.stroke(...(this.team === 'player' ? [200, 50, 50] : [50, 100, 200]));
    
    for (let stick of this.sticks) {
      p.line(stick.p1.x, stick.p1.y, stick.p2.x, stick.p2.y);
    }
    
    // Draw joints
    p.noStroke();
    for (let joint of this.joints) {
      p.fill(...(this.team === 'player' ? [220, 80, 80] : [80, 120, 220]));
      p.circle(joint.x, joint.y, joint.radius * 2);
    }
    
    // Draw head with face
    p.fill(...(this.team === 'player' ? [240, 100, 100] : [100, 140, 240]));
    p.circle(this.head.x, this.head.y, this.head.radius * 2.5);
    
    // Eyes
    p.fill(255);
    p.circle(this.head.x - 3, this.head.y - 2, 4);
    p.circle(this.head.x + 3, this.head.y - 2, 4);
    p.fill(0);
    p.circle(this.head.x - 3, this.head.y - 2, 2);
    p.circle(this.head.x + 3, this.head.y - 2, 2);
    
    // Health bar
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.head.x - barWidth / 2;
    const barY = this.head.y - 20;
    
    p.fill(60);
    p.rect(barX, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(...(healthPercent > 0.5 ? [100, 220, 100] : healthPercent > 0.25 ? [220, 220, 100] : [220, 100, 100]));
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}