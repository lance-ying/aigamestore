// player.js
import { 
  PLAYER_SPEED, 
  PLAYER_SPRINT_SPEED, 
  PLAYER_TURN_SPEED,
  PLAYER_MAX_HEALTH,
  PLAYER_MAX_HUNGER,
  PLAYER_MAX_THIRST,
  PLAYER_MAX_RADIATION,
  HUNGER_DEPLETION,
  THIRST_DEPLETION,
  RADIATION_INCREASE,
  SPRINT_HUNGER_MULTIPLIER,
  PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_COOLDOWN,
  ITEM_FOOD_RESTORE,
  ITEM_WATER_RESTORE,
  ITEM_ANTIRAD_RESTORE,
  WORLD_SIZE
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.health = PLAYER_MAX_HEALTH;
    this.hunger = PLAYER_MAX_HUNGER;
    this.thirst = PLAYER_MAX_THIRST;
    this.radiation = 0;
    
    this.inventory = {
      food: 0,
      water: 0,
      antirad: 0,
      scrap: 0
    };
    
    this.attacking = false;
    this.attackCooldown = 0;
    this.currentConsumable = 0; // 0: food, 1: water, 2: antirad
  }
  
  update(deltaTime, inputs) {
    // Movement
    let speed = PLAYER_SPEED;
    let sprintActive = false;
    
    if (inputs.shift && this.hunger > 0) {
      speed = PLAYER_SPRINT_SPEED;
      sprintActive = true;
    }
    
    if (inputs.up) {
      const newX = this.x + Math.cos(this.angle) * speed;
      const newY = this.y + Math.sin(this.angle) * speed;
      if (newX >= 0 && newX <= WORLD_SIZE && newY >= 0 && newY <= WORLD_SIZE) {
        this.x = newX;
        this.y = newY;
      }
    }
    
    if (inputs.down) {
      const newX = this.x - Math.cos(this.angle) * speed * 0.6;
      const newY = this.y - Math.sin(this.angle) * speed * 0.6;
      if (newX >= 0 && newX <= WORLD_SIZE && newY >= 0 && newY <= WORLD_SIZE) {
        this.x = newX;
        this.y = newY;
      }
    }
    
    if (inputs.left) {
      this.angle -= PLAYER_TURN_SPEED;
    }
    
    if (inputs.right) {
      this.angle += PLAYER_TURN_SPEED;
    }
    
    // Attack
    if (inputs.space && this.attackCooldown === 0) {
      this.attacking = true;
      this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    } else {
      this.attacking = false;
    }
    
    // Consumables
    if (inputs.z) {
      this.useConsumable();
      inputs.z = false; // Consume the input
    }
    
    // Deplete survival stats
    const hungerRate = sprintActive ? HUNGER_DEPLETION * SPRINT_HUNGER_MULTIPLIER : HUNGER_DEPLETION;
    this.hunger -= hungerRate * deltaTime;
    this.thirst -= THIRST_DEPLETION * deltaTime;
    this.radiation += RADIATION_INCREASE * deltaTime;
    
    // Clamp values
    this.hunger = Math.max(0, this.hunger);
    this.thirst = Math.max(0, this.thirst);
    this.radiation = Math.min(PLAYER_MAX_RADIATION, this.radiation);
    
    // Take damage from low stats
    if (this.hunger <= 0) {
      this.health -= 0.5;
    }
    if (this.thirst <= 0) {
      this.health -= 0.8;
    }
    if (this.radiation >= PLAYER_MAX_RADIATION) {
      this.health -= 1.0;
    }
    
    this.health = Math.max(0, this.health);
  }
  
  useConsumable() {
    const types = ['food', 'water', 'antirad'];
    const type = types[this.currentConsumable];
    
    if (this.inventory[type] > 0) {
      this.inventory[type]--;
      
      if (type === 'food') {
        this.hunger = Math.min(PLAYER_MAX_HUNGER, this.hunger + ITEM_FOOD_RESTORE);
      } else if (type === 'water') {
        this.thirst = Math.min(PLAYER_MAX_THIRST, this.thirst + ITEM_WATER_RESTORE);
      } else if (type === 'antirad') {
        this.radiation = Math.max(0, this.radiation - ITEM_ANTIRAD_RESTORE);
      }
    }
    
    // Cycle to next consumable
    this.currentConsumable = (this.currentConsumable + 1) % 3;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.health = Math.max(0, this.health);
  }
  
  getAttackPoint() {
    return {
      x: this.x + Math.cos(this.angle) * PLAYER_ATTACK_RANGE,
      y: this.y + Math.sin(this.angle) * PLAYER_ATTACK_RANGE
    };
  }
}