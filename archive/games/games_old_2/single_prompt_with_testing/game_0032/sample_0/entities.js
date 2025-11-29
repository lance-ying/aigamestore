// entities.js - Game entities (buildings, hunters, creatures)

import { gameState, BUILDING_TYPES, RESOURCE_TYPES } from './globals.js';

export class Building {
  constructor(type, name, x, y, width, height) {
    this.type = type;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.workers = 0;
    this.maxWorkers = 3;
    this.productionRate = 0.1; // per frame per worker
    this.productionProgress = 0;
    this.color = this.getColor();
  }
  
  getColor() {
    switch (this.type) {
      case BUILDING_TYPES.TOWN_HALL: return [150, 100, 50];
      case BUILDING_TYPES.WOOD_CAMP: return [101, 67, 33];
      case BUILDING_TYPES.STONE_QUARRY: return [128, 128, 128];
      case BUILDING_TYPES.FARM: return [144, 238, 144];
      case BUILDING_TYPES.SAWMILL: return [139, 90, 43];
      case BUILDING_TYPES.FORGE: return [192, 64, 0];
      case BUILDING_TYPES.TRAINING_GROUND: return [70, 130, 180];
      case BUILDING_TYPES.ALCHEMY_LAB: return [138, 43, 226];
      default: return [100, 100, 100];
    }
  }
  
  update(timeScale) {
    if (this.workers > 0) {
      this.productionProgress += this.productionRate * this.workers * timeScale;
      
      // Produce resources based on building type
      if (this.productionProgress >= 1) {
        const produced = Math.floor(this.productionProgress);
        this.productionProgress -= produced;
        
        switch (this.type) {
          case BUILDING_TYPES.WOOD_CAMP:
            gameState.resources.wood += produced;
            break;
          case BUILDING_TYPES.STONE_QUARRY:
            gameState.resources.stone += produced;
            break;
          case BUILDING_TYPES.FARM:
            gameState.resources.food += produced;
            break;
          case BUILDING_TYPES.SAWMILL:
            if (gameState.resources.wood >= produced) {
              gameState.resources.wood -= produced;
              gameState.resources.processed_wood += produced;
            }
            break;
          case BUILDING_TYPES.FORGE:
            if (gameState.resources.stone >= produced) {
              gameState.resources.stone -= produced;
              gameState.resources.processed_metal += produced;
            }
            break;
        }
      }
    }
  }
  
  canAssignWorker() {
    return this.workers < this.maxWorkers && gameState.idleVillagers > 0;
  }
  
  assignWorker() {
    if (this.canAssignWorker()) {
      this.workers++;
      gameState.idleVillagers--;
      return true;
    }
    return false;
  }
  
  removeWorker() {
    if (this.workers > 0) {
      this.workers--;
      gameState.idleVillagers++;
      return true;
    }
    return false;
  }
}

export class Hunter {
  constructor(name, level = 1) {
    this.name = name;
    this.level = level;
    this.experience = 0;
    this.hp = 50 + (level - 1) * 20;
    this.maxHp = this.hp;
    this.damage = 10 + (level - 1) * 5;
    this.equipment = {
      weapon: null,
      armor: null
    };
    this.inAlliance = false;
  }
  
  equip(itemType, itemName) {
    if (itemType === 'weapon') {
      this.equipment.weapon = itemName;
      this.updateStats();
    } else if (itemType === 'armor') {
      this.equipment.armor = itemName;
      this.updateStats();
    }
  }
  
  updateStats() {
    // Base stats
    this.damage = 10 + (this.level - 1) * 5;
    this.maxHp = 50 + (this.level - 1) * 20;
    
    // Weapon bonus
    if (this.equipment.weapon === 'wooden_sword') {
      this.damage += 5;
    } else if (this.equipment.weapon === 'iron_sword') {
      this.damage += 15;
    }
    
    // Armor bonus
    if (this.equipment.armor === 'wooden_armor') {
      this.maxHp += 20;
    } else if (this.equipment.armor === 'iron_armor') {
      this.maxHp += 50;
    }
    
    // Heal to new max if increased
    if (this.hp > this.maxHp) {
      this.hp = this.maxHp;
    }
  }
  
  gainExperience(exp) {
    this.experience += exp;
    const expNeeded = this.level * 100;
    if (this.experience >= expNeeded) {
      this.experience -= expNeeded;
      this.level++;
      this.updateStats();
      this.hp = this.maxHp; // Full heal on level up
    }
  }
  
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }
}

export class Alliance {
  constructor(hunters) {
    this.hunters = hunters;
    this.onExpedition = false;
    this.expeditionProgress = 0;
    this.targetCreature = null;
    
    // Mark hunters as in alliance
    hunters.forEach(h => h.inAlliance = true);
  }
  
  getTotalDamage() {
    return this.hunters.reduce((sum, h) => sum + h.damage, 0);
  }
  
  getTotalHp() {
    return this.hunters.reduce((sum, h) => sum + h.hp, 0);
  }
  
  isAlive() {
    return this.hunters.some(h => h.hp > 0);
  }
  
  startExpedition(creature) {
    this.onExpedition = true;
    this.expeditionProgress = 0;
    this.targetCreature = creature;
  }
  
  updateExpedition(timeScale) {
    if (!this.onExpedition || !this.targetCreature) return null;
    
    this.expeditionProgress += 0.02 * timeScale;
    
    // Simulate battle
    if (this.expeditionProgress >= 1) {
      const allianceDamage = this.getTotalDamage();
      const creatureDamage = this.targetCreature.damage;
      
      // Determine winner
      const battleRounds = Math.ceil(this.targetCreature.hp / allianceDamage);
      const totalDamageTaken = battleRounds * creatureDamage;
      
      // Distribute damage among hunters
      this.hunters.forEach(hunter => {
        const hunterShare = totalDamageTaken / this.hunters.length;
        hunter.hp = Math.max(0, hunter.hp - hunterShare);
      });
      
      const victory = this.isAlive();
      
      if (victory) {
        // Give rewards
        this.hunters.forEach(hunter => {
          if (hunter.hp > 0) {
            hunter.gainExperience(this.targetCreature.reward.experience);
          }
        });
        gameState.resources.gold += this.targetCreature.reward.gold;
      }
      
      this.onExpedition = false;
      return { victory, creature: this.targetCreature };
    }
    
    return null;
  }
  
  disband() {
    this.hunters.forEach(h => h.inAlliance = false);
  }
}

export class Creature {
  constructor(type) {
    this.name = type.name;
    this.hp = type.hp;
    this.maxHp = type.hp;
    this.damage = type.damage;
    this.reward = type.reward;
  }
}