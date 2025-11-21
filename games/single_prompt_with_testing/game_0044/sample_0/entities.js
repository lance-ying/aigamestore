// entities.js - Character and enemy classes

import { ELEMENT_PHYSICAL, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_LIGHTNING, ELEMENT_DARK } from './globals.js';

export class Character {
  constructor(name, maxHP, maxSP, strength, defense, element) {
    this.name = name;
    this.maxHP = maxHP;
    this.hp = maxHP;
    this.maxSP = maxSP;
    this.sp = maxSP;
    this.strength = strength;
    this.defense = defense;
    this.element = element;
    this.level = 1;
    this.breakDamage = 0;
    this.skills = this.initializeSkills();
  }
  
  initializeSkills() {
    const skills = [];
    if (this.element === ELEMENT_FIRE) {
      skills.push({ name: "Fireball", cost: 15, element: ELEMENT_FIRE, power: 1.5 });
      skills.push({ name: "Inferno", cost: 25, element: ELEMENT_FIRE, power: 2.2 });
    } else if (this.element === ELEMENT_ICE) {
      skills.push({ name: "Ice Shard", cost: 15, element: ELEMENT_ICE, power: 1.5 });
      skills.push({ name: "Blizzard", cost: 25, element: ELEMENT_ICE, power: 2.2 });
    } else if (this.element === ELEMENT_LIGHTNING) {
      skills.push({ name: "Thunder", cost: 15, element: ELEMENT_LIGHTNING, power: 1.5 });
      skills.push({ name: "Storm", cost: 25, element: ELEMENT_LIGHTNING, power: 2.2 });
    } else if (this.element === ELEMENT_DARK) {
      skills.push({ name: "Shadow Strike", cost: 15, element: ELEMENT_DARK, power: 1.5 });
      skills.push({ name: "Void", cost: 25, element: ELEMENT_DARK, power: 2.2 });
    }
    skills.push({ name: "Heal", cost: 20, element: "SUPPORT", power: 0, heal: 40 });
    return skills;
  }
  
  attack(target) {
    const baseDamage = Math.max(1, this.strength - Math.floor(target.defense / 2));
    const damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
    target.takeDamage(damage, ELEMENT_PHYSICAL);
    return damage;
  }
  
  useSkill(skillIndex, target) {
    if (skillIndex >= this.skills.length) return { success: false };
    const skill = this.skills[skillIndex];
    
    if (this.sp < skill.cost) return { success: false, reason: "Not enough SP" };
    
    this.sp -= skill.cost;
    
    if (skill.heal) {
      const healAmount = Math.min(skill.heal, target.maxHP - target.hp);
      target.hp += healAmount;
      return { success: true, damage: 0, heal: healAmount, element: skill.element };
    }
    
    const baseDamage = Math.floor(this.strength * skill.power);
    const damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
    const breakGain = target.takeDamage(damage, skill.element);
    
    return { success: true, damage, breakGain, element: skill.element };
  }
  
  takeDamage(damage, element) {
    const actualDamage = Math.max(1, damage);
    this.hp = Math.max(0, this.hp - actualDamage);
    
    // Calculate break gauge increase
    let breakGain = 10;
    if (this.weakness === element) {
      breakGain = 25;
    }
    this.breakDamage = Math.min(100, this.breakDamage + breakGain);
    
    return breakGain;
  }
  
  isAlive() {
    return this.hp > 0;
  }
  
  levelUp() {
    this.level++;
    this.maxHP += 10;
    this.hp = this.maxHP;
    this.maxSP += 5;
    this.sp = this.maxSP;
    this.strength += 3;
    this.defense += 2;
  }
}

export class Enemy {
  constructor(name, maxHP, strength, defense, element, weakness, infamyReward) {
    this.name = name;
    this.maxHP = maxHP;
    this.hp = maxHP;
    this.strength = strength;
    this.defense = defense;
    this.element = element;
    this.weakness = weakness;
    this.infamyReward = infamyReward;
    this.breakDamage = 0;
    this.isStunned = false;
    this.stunTimer = 0;
  }
  
  attack(target) {
    if (this.isStunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.breakDamage = 0;
      }
      return { damage: 0, stunned: true };
    }
    
    const baseDamage = Math.max(1, this.strength - Math.floor(target.defense / 3));
    const damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
    target.hp = Math.max(0, target.hp - damage);
    return { damage, stunned: false };
  }
  
  takeDamage(damage, element) {
    const actualDamage = Math.max(1, damage);
    this.hp = Math.max(0, this.hp - actualDamage);
    
    // Calculate break gauge increase
    let breakGain = 10;
    if (this.weakness === element) {
      breakGain = 25;
    }
    this.breakDamage = Math.min(100, this.breakDamage + breakGain);
    
    // Check if broken
    if (this.breakDamage >= 100 && !this.isStunned) {
      this.isStunned = true;
      this.stunTimer = 1; // Stunned for 1 turn
    }
    
    return breakGain;
  }
  
  isAlive() {
    return this.hp > 0;
  }
}

export class PlayerEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.moveSpeed = 4;
    this.spriteDirection = 0; // 0: down, 1: right, 2: up, 3: left
    this.animFrame = 0;
    this.animTimer = 0;
  }
  
  moveTo(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.isMoving = true;
    
    // Set sprite direction
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.spriteDirection = dx > 0 ? 1 : 3;
    } else {
      this.spriteDirection = dy > 0 ? 0 : 2;
    }
  }
  
  update() {
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.moveSpeed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.animFrame = 0;
      } else {
        this.x += (dx / distance) * this.moveSpeed;
        this.y += (dy / distance) * this.moveSpeed;
        
        this.animTimer++;
        if (this.animTimer % 8 === 0) {
          this.animFrame = (this.animFrame + 1) % 4;
        }
      }
    }
  }
}