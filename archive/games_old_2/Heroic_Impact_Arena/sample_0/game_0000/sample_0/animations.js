// animations.js - Animation system

export class Animation {
  constructor(type, data, duration) {
    this.type = type;
    this.data = data;
    this.duration = duration;
    this.elapsed = 0;
    this.completed = false;
  }
  
  update(deltaTime = 1) {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration) {
      this.completed = true;
    }
  }
  
  getProgress() {
    return Math.min(this.elapsed / this.duration, 1);
  }
}

export function createAttackAnimation(attacker, target, damage) {
  return new Animation('ATTACK', {
    attacker: attacker,
    target: target,
    damage: damage,
    startX: attacker.x,
    startY: attacker.y,
    targetX: target.x,
    targetY: target.y
  }, 30);
}

export function createHealAnimation(target, healAmount) {
  return new Animation('HEAL', {
    target: target,
    healAmount: healAmount
  }, 30);
}

export function createDamageNumberAnimation(x, y, damage, isHeal = false) {
  return new Animation('DAMAGE_NUMBER', {
    x: x,
    y: y,
    damage: damage,
    isHeal: isHeal,
    startY: y
  }, 40);
}