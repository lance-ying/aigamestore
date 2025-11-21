// character.js
import { gameState } from './globals.js';

export class Character {
  constructor(name, x, y, isEnemy = false) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.gridX = x;
    this.gridY = y;
    this.isEnemy = isEnemy;
    
    this.level = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.maxMp = 50;
    this.mp = 50;
    this.attack = 15;
    this.defense = 10;
    this.magic = 12;
    this.speed = 10;
    this.exp = 0;
    this.expToLevel = 100;
    
    this.skills = [];
    this.equipment = [];
    this.statusEffects = [];
    
    this.isWallMerged = false;
    this.actionTaken = false;
  }
  
  calculateStats() {
    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusMagic = 0;
    let bonusSpeed = 0;
    
    // Equipment bonuses
    this.equipment.forEach(item => {
      if (item.effect === "attack") bonusAttack += item.value;
      if (item.effect === "defense") bonusDefense += item.value;
      if (item.effect === "magic") bonusMagic += item.value;
    });
    
    // Skill bonuses
    this.skills.forEach(skill => {
      if (skill.name === "Power Strike") bonusAttack += Math.floor(this.attack * 0.2);
      if (skill.name === "Iron Will") bonusDefense += Math.floor(this.defense * 0.15);
      if (skill.name === "Mana Surge") bonusMagic += Math.floor(this.magic * 0.2);
      if (skill.name === "Quick Step") bonusSpeed += Math.floor(this.speed * 0.1);
    });
    
    return {
      attack: this.attack + bonusAttack,
      defense: this.defense + bonusDefense,
      magic: this.magic + bonusMagic,
      speed: this.speed + bonusSpeed
    };
  }
  
  gainExp(amount) {
    if (this.isEnemy) return;
    
    this.exp += amount;
    while (this.exp >= this.expToLevel && this.level < 999) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.exp -= this.expToLevel;
    this.expToLevel = Math.floor(this.expToLevel * 1.15);
    
    // Stat increases
    this.maxHp += Math.floor(10 + this.level * 0.5);
    this.hp = this.maxHp;
    this.maxMp += Math.floor(5 + this.level * 0.3);
    this.mp = this.maxMp;
    this.attack += Math.floor(2 + this.level * 0.1);
    this.defense += Math.floor(1 + this.level * 0.1);
    this.magic += Math.floor(1.5 + this.level * 0.1);
    this.speed += Math.floor(1 + this.level * 0.05);
    
    // Check for skill unlocks
    this.checkSkillUnlocks();
  }
  
  checkSkillUnlocks() {
    const SKILL_DATABASE = [
      { id: 1, name: "Power Strike", unlockCondition: "level5", description: "+20% damage", passive: true },
      { id: 2, name: "Quick Step", unlockCondition: "level10", description: "+10% speed", passive: true },
      { id: 3, name: "Iron Will", unlockCondition: "battles5", description: "+15% defense", passive: true },
      { id: 4, name: "Mana Surge", unlockCondition: "level15", description: "+20% magic", passive: true },
      { id: 5, name: "Critical Eye", unlockCondition: "damage1000", description: "+15% crit", passive: true }
    ];
    
    SKILL_DATABASE.forEach(skill => {
      const hasSkill = this.skills.some(s => s.id === skill.id);
      if (!hasSkill) {
        if (skill.unlockCondition === "level5" && this.level >= 5) {
          this.skills.push({...skill});
        } else if (skill.unlockCondition === "level10" && this.level >= 10) {
          this.skills.push({...skill});
        } else if (skill.unlockCondition === "level15" && this.level >= 15) {
          this.skills.push({...skill});
        } else if (skill.unlockCondition === "battles5" && gameState.battlesWon >= 5) {
          this.skills.push({...skill});
        } else if (skill.unlockCondition === "damage1000" && gameState.totalDamageDealt >= 1000) {
          this.skills.push({...skill});
        }
      }
    });
  }
  
  takeDamage(amount) {
    const stats = this.calculateStats();
    const actualDamage = Math.max(1, amount - Math.floor(stats.defense * 0.5));
    this.hp -= actualDamage;
    if (this.hp < 0) this.hp = 0;
    return actualDamage;
  }
  
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
  
  isAlive() {
    return this.hp > 0;
  }
}

export class WallMaiden extends Character {
  constructor(name, x, y) {
    super(name, x, y, false);
    this.name = "Mule";
    this.type = "WallMaiden";
    this.maxHp = 120;
    this.hp = 120;
    this.defense = 18;
  }
  
  mergeWithWall() {
    this.isWallMerged = true;
    this.defense = Math.floor(this.defense * 1.5);
  }
  
  unmergeFromWall() {
    this.isWallMerged = false;
    this.defense = Math.floor(this.defense / 1.5);
  }
  
  getAdjacentAllies() {
    const adjacent = [];
    gameState.party.forEach(ally => {
      if (ally !== this) {
        const dx = Math.abs(ally.gridX - this.gridX);
        const dy = Math.abs(ally.gridY - this.gridY);
        if (dx <= 1 && dy <= 1 && (dx + dy) > 0) {
          adjacent.push(ally);
        }
      }
    });
    return adjacent;
  }
}