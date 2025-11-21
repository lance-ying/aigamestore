// weapons.js - Weapon system
import { WEAPON_PISTOL, WEAPON_RIFLE, WEAPON_SHOTGUN, WEAPON_ELEMENTAL } from './globals.js';

export class Weapon {
  constructor(type) {
    this.type = type;
    this.level = 1;
    
    // Base stats by type
    switch (type) {
      case WEAPON_PISTOL:
        this.damage = 10;
        this.fireRate = 10; // frames between shots
        this.magazineSize = 12;
        this.reloadTime = 60;
        this.projectileSpeed = 8;
        this.projectileSize = 3;
        this.color = [200, 200, 50];
        this.price = 50;
        break;
        
      case WEAPON_RIFLE:
        this.damage = 8;
        this.fireRate = 5;
        this.magazineSize = 30;
        this.reloadTime = 90;
        this.projectileSpeed = 12;
        this.projectileSize = 2;
        this.color = [255, 100, 100];
        this.price = 80;
        break;
        
      case WEAPON_SHOTGUN:
        this.damage = 6;
        this.fireRate = 30;
        this.magazineSize = 8;
        this.reloadTime = 120;
        this.projectileSpeed = 6;
        this.projectileSize = 4;
        this.pellets = 5;
        this.spread = 0.3;
        this.color = [255, 150, 50];
        this.price = 100;
        break;
        
      case WEAPON_ELEMENTAL:
        this.damage = 15;
        this.fireRate = 20;
        this.magazineSize = 20;
        this.reloadTime = 100;
        this.projectileSpeed = 7;
        this.projectileSize = 5;
        this.element = "fire";
        this.color = [100, 255, 255];
        this.price = 120;
        break;
    }
    
    this.ammo = this.magazineSize;
    this.lastFireTime = 0;
    this.reloading = false;
    this.reloadStartTime = 0;
  }
  
  canFire(currentFrame) {
    if (this.reloading) return false;
    if (this.ammo <= 0) return false;
    if (currentFrame - this.lastFireTime < this.fireRate) return false;
    return true;
  }
  
  fire(currentFrame) {
    if (!this.canFire(currentFrame)) return [];
    
    this.ammo--;
    this.lastFireTime = currentFrame;
    
    if (this.ammo <= 0) {
      this.startReload(currentFrame);
    }
    
    // Return projectile data
    const projectiles = [];
    
    if (this.type === WEAPON_SHOTGUN) {
      // Multiple pellets
      for (let i = 0; i < this.pellets; i++) {
        projectiles.push({
          damage: this.damage,
          speed: this.projectileSpeed,
          size: this.projectileSize,
          color: this.color,
          spreadOffset: (i - this.pellets / 2) * this.spread / this.pellets
        });
      }
    } else {
      projectiles.push({
        damage: this.damage,
        speed: this.projectileSpeed,
        size: this.projectileSize,
        color: this.color,
        element: this.element || null
      });
    }
    
    return projectiles;
  }
  
  startReload(currentFrame) {
    this.reloading = true;
    this.reloadStartTime = currentFrame;
  }
  
  update(currentFrame) {
    if (this.reloading && currentFrame - this.reloadStartTime >= this.reloadTime) {
      this.ammo = this.magazineSize;
      this.reloading = false;
    }
  }
  
  getDisplayName() {
    const names = {
      [WEAPON_PISTOL]: "Pistol",
      [WEAPON_RIFLE]: "Rifle",
      [WEAPON_SHOTGUN]: "Shotgun",
      [WEAPON_ELEMENTAL]: "Elemental"
    };
    return names[this.type] || "Unknown";
  }
}

export function createRandomWeapon() {
  const types = [WEAPON_PISTOL, WEAPON_RIFLE, WEAPON_SHOTGUN, WEAPON_ELEMENTAL];
  const type = types[Math.floor(Math.random() * types.length)];
  return new Weapon(type);
}

export function generateShopInventory() {
  // Generate 3 random weapons for the shop
  const inventory = [];
  for (let i = 0; i < 3; i++) {
    inventory.push(createRandomWeapon());
  }
  return inventory;
}