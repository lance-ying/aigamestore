// character.js - Character class and skills

export class Skill {
  constructor(name, mpCost, power, target = "SINGLE_ENEMY") {
    this.name = name;
    this.mpCost = mpCost;
    this.power = power;
    this.target = target; // SINGLE_ENEMY, ALL_ENEMIES, SINGLE_ALLY, ALL_ALLIES
  }
}

export class Character {
  constructor(name, type = "HERO") {
    this.name = name;
    this.type = type; // HERO or ENEMY
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    
    // Base stats
    this.maxHP = 100;
    this.hp = 100;
    this.maxMP = 50;
    this.mp = 50;
    this.attack = 10;
    this.defense = 5;
    this.speed = 10;
    
    // Skills
    this.allSkills = [];
    this.equippedSkills = [];
    
    // Battle state
    this.isDefending = false;
    this.actionReady = false;
    this.selectedAction = null;
  }
  
  initializeHero(heroType) {
    if (heroType === "WARRIOR") {
      this.maxHP = 120;
      this.hp = 120;
      this.maxMP = 30;
      this.mp = 30;
      this.attack = 15;
      this.defense = 10;
      this.speed = 8;
      this.learnSkill(new Skill("Power Strike", 5, 25));
      this.learnSkill(new Skill("Cleave", 8, 18, "ALL_ENEMIES"));
    } else if (heroType === "MAGE") {
      this.maxHP = 80;
      this.hp = 80;
      this.maxMP = 80;
      this.mp = 80;
      this.attack = 8;
      this.defense = 3;
      this.speed = 12;
      this.learnSkill(new Skill("Fireball", 10, 30));
      this.learnSkill(new Skill("Heal", 12, 40, "SINGLE_ALLY"));
    } else if (heroType === "ROGUE") {
      this.maxHP = 90;
      this.hp = 90;
      this.maxMP = 40;
      this.mp = 40;
      this.attack = 12;
      this.defense = 6;
      this.speed = 15;
      this.learnSkill(new Skill("Quick Strike", 4, 15));
      this.learnSkill(new Skill("Poison Dart", 6, 12));
    } else if (heroType === "MURUSHUMA") {
      this.maxHP = 100;
      this.hp = 100;
      this.maxMP = 60;
      this.mp = 60;
      this.attack = 10;
      this.defense = 7;
      this.speed = 10;
      this.canLearn = true;
    }
    this.heroType = heroType;
  }
  
  learnSkill(skill) {
    if (!this.allSkills.find(s => s.name === skill.name)) {
      this.allSkills.push(skill);
      if (this.equippedSkills.length < 5) {
        this.equippedSkills.push(skill);
      }
    }
  }
  
  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.exp -= this.expToNext;
    this.expToNext = Math.floor(this.expToNext * 1.5);
    
    // Stat increases
    this.maxHP += 10 + Math.floor(this.level * 0.5);
    this.maxMP += 5 + Math.floor(this.level * 0.3);
    this.attack += 2 + Math.floor(this.level * 0.2);
    this.defense += 1 + Math.floor(this.level * 0.15);
    this.speed += 1;
    
    // Heal on level up
    this.hp = this.maxHP;
    this.mp = this.maxMP;
    
    // Learn new skills at certain levels
    if (this.level === 3 && this.heroType === "WARRIOR") {
      this.learnSkill(new Skill("Shield Bash", 6, 20));
    } else if (this.level === 3 && this.heroType === "MAGE") {
      this.learnSkill(new Skill("Lightning", 15, 35));
    } else if (this.level === 5 && this.heroType === "MAGE") {
      this.learnSkill(new Skill("Mass Heal", 20, 30, "ALL_ALLIES"));
    }
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - (this.isDefending ? this.defense * 2 : this.defense));
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }
  
  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHP - this.hp);
    this.hp = Math.min(this.maxHP, this.hp + amount);
    return actualHeal;
  }
  
  isAlive() {
    return this.hp > 0;
  }
  
  resetBattleState() {
    this.isDefending = false;
    this.actionReady = false;
    this.selectedAction = null;
  }
}

export function createEnemy(floorLevel) {
  const enemyTypes = [
    { name: "Slime", hpMod: 1.0, atkMod: 0.8, defMod: 0.5, spdMod: 0.7, exp: 30 },
    { name: "Goblin", hpMod: 0.9, atkMod: 1.0, defMod: 0.7, spdMod: 1.0, exp: 40 },
    { name: "Skeleton", hpMod: 0.8, atkMod: 1.1, defMod: 0.6, spdMod: 0.9, exp: 50 },
    { name: "Orc", hpMod: 1.3, atkMod: 1.2, defMod: 1.0, spdMod: 0.6, exp: 60 },
    { name: "Dark Knight", hpMod: 1.5, atkMod: 1.4, defMod: 1.2, spdMod: 1.1, exp: 80 }
  ];
  
  const typeIndex = Math.min(floorLevel - 1, enemyTypes.length - 1);
  const type = enemyTypes[typeIndex];
  
  const enemy = new Character(type.name, "ENEMY");
  enemy.level = floorLevel;
  enemy.maxHP = Math.floor((50 + floorLevel * 20) * type.hpMod);
  enemy.hp = enemy.maxHP;
  enemy.attack = Math.floor((8 + floorLevel * 3) * type.atkMod);
  enemy.defense = Math.floor((3 + floorLevel * 2) * type.defMod);
  enemy.speed = Math.floor((8 + floorLevel * 2) * type.spdMod);
  enemy.expReward = type.exp + floorLevel * 10;
  enemy.oreReward = Math.floor(floorLevel * 0.5 + Math.random() * floorLevel);
  
  // Enemies can have skills too
  if (floorLevel >= 2) {
    enemy.learnSkill(new Skill("Heavy Attack", 0, 18));
  }
  if (floorLevel >= 4) {
    enemy.learnSkill(new Skill("Dark Wave", 0, 15, "ALL_ENEMIES"));
  }
  
  return enemy;
}

export function createBoss(floorLevel) {
  const boss = new Character("Floor " + floorLevel + " Boss", "ENEMY");
  boss.level = floorLevel + 2;
  boss.maxHP = Math.floor(200 + floorLevel * 80);
  boss.hp = boss.maxHP;
  boss.maxMP = 50;
  boss.mp = 50;
  boss.attack = Math.floor(15 + floorLevel * 5);
  boss.defense = Math.floor(8 + floorLevel * 3);
  boss.speed = Math.floor(10 + floorLevel * 2);
  boss.expReward = 200 + floorLevel * 50;
  boss.oreReward = 10 + floorLevel * 3;
  boss.isBoss = true;
  
  boss.learnSkill(new Skill("Devastating Blow", 10, 40));
  boss.learnSkill(new Skill("Doom Strike", 15, 25, "ALL_ENEMIES"));
  
  return boss;
}