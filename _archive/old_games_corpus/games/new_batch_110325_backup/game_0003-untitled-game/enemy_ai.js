// enemy_ai.js - Enemy AI controller

import { gameState, ATTACK_RANGE } from './globals.js';

export class EnemyAI {
  constructor(enemy, difficulty = 1) {
    this.enemy = enemy;
    this.difficulty = difficulty;
    this.actionTimer = 0;
    this.currentAction = 'idle';
    this.actionDuration = 0;
    this.reactionTime = Math.max(10, 30 - difficulty * 3);
    this.aggressiveness = Math.min(0.9, 0.3 + difficulty * 0.1);
  }

  update(p, player) {
    this.actionTimer--;
    
    if (this.actionTimer <= 0) {
      this.decideAction(p, player);
    }
    
    this.executeAction(p, player);
  }

  decideAction(p, player) {
    const distance = Math.abs(this.enemy.x - player.x);
    const isInRange = distance < ATTACK_RANGE + 20;
    
    // Higher difficulty = more aggressive
    const shouldAttack = p.random() < this.aggressiveness;
    
    if (isInRange && shouldAttack && this.enemy.attackCooldown === 0) {
      // Choose attack type
      this.currentAction = p.random() > 0.5 ? 'punch' : 'kick';
      this.actionDuration = 20;
    } else if (distance > ATTACK_RANGE + 50) {
      // Move closer
      this.currentAction = 'approach';
      this.actionDuration = 30;
    } else if (distance < 40 && player.isAttacking) {
      // Back away if player is attacking and too close
      this.currentAction = 'retreat';
      this.actionDuration = 20;
    } else if (p.random() < 0.1) {
      // Occasionally jump
      this.currentAction = 'jump';
      this.actionDuration = 5;
    } else {
      // Wait and observe
      this.currentAction = 'idle';
      this.actionDuration = this.reactionTime;
    }
    
    this.actionTimer = this.actionDuration;
  }

  executeAction(p, player) {
    this.enemy.stopMove();
    
    switch (this.currentAction) {
      case 'approach':
        if (this.enemy.x < player.x) {
          this.enemy.moveRight();
        } else {
          this.enemy.moveLeft();
        }
        break;
        
      case 'retreat':
        if (this.enemy.x < player.x) {
          this.enemy.moveLeft();
        } else {
          this.enemy.moveRight();
        }
        break;
        
      case 'punch':
        this.enemy.recordInput('punch', p.frameCount);
        this.enemy.attack('punch', p);
        break;
        
      case 'kick':
        this.enemy.recordInput('kick', p.frameCount);
        this.enemy.attack('kick', p);
        break;
        
      case 'jump':
        this.enemy.jump();
        break;
        
      case 'idle':
        // Do nothing
        break;
    }
  }
}