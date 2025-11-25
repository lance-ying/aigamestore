// upgrades.js - Level up and upgrade system
import { gameState } from './globals.js';
import { Weapon } from './weapons.js';

export const UPGRADE_DEFINITIONS = {
  // Weapons
  'magic_wand': {
    name: 'Magic Wand',
    description: 'Fires projectiles at nearest enemy',
    isWeapon: true,
    weaponType: 'magic_wand'
  },
  'holy_water': {
    name: 'Holy Water',
    description: 'Creates damaging area on ground',
    isWeapon: true,
    weaponType: 'holy_water'
  },
  'garlic': {
    name: 'Garlic',
    description: 'Damages nearby enemies continuously',
    isWeapon: true,
    weaponType: 'garlic'
  },
  'cross': {
    name: 'Cross',
    description: 'Orbits around you damaging enemies',
    isWeapon: true,
    weaponType: 'cross'
  },
  
  // Stats
  'max_health': {
    name: 'Max Health',
    description: '+20 Maximum Health',
    isWeapon: false,
    apply: (player) => {
      player.maxHealthBonus += 20;
      player.health = Math.min(player.health + 20, player.maxHealth + player.maxHealthBonus);
    }
  },
  'armor': {
    name: 'Armor',
    description: '+1 Damage Reduction',
    isWeapon: false,
    apply: (player) => {
      player.armor += 1;
    }
  },
  'move_speed': {
    name: 'Movement Speed',
    description: '+0.5 Move Speed',
    isWeapon: false,
    apply: (player) => {
      player.moveSpeedBonus += 0.5;
    }
  },
  'damage': {
    name: 'Might',
    description: '+10% Damage',
    isWeapon: false,
    apply: (player) => {
      player.damage *= 1.1;
    }
  },
  'attack_speed': {
    name: 'Attack Speed',
    description: '+10% Faster Attacks',
    isWeaemon: false,
    apply: (player) => {
      player.attackSpeed *= 1.1;
    }
  },
  'range': {
    name: 'Range',
    description: '+10% Attack Range',
    isWeapon: false,
    apply: (player) => {
      player.range *= 1.1;
    }
  },
  'regeneration': {
    name: 'Regeneration',
    description: '+1 HP per second',
    isWeapon: false,
    apply: (player) => {
      player.regeneration += 1;
    }
  },
  'magnet': {
    name: 'Magnet',
    description: '+20% Pickup Range',
    isWeapon: false,
    apply: (player) => {
      player.magnet *= 1.2;
    }
  }
};

export function generateUpgradeChoices(player) {
  const choices = [];
  const availableUpgrades = [];
  
  // Add weapon upgrades
  for (const key in UPGRADE_DEFINITIONS) {
    const def = UPGRADE_DEFINITIONS[key];
    if (def.isWeapon) {
      const hasWeapon = player.weapons.some(w => w.type === def.weaponType);
      if (!hasWeapon && player.weapons.length < 6) {
        availableUpgrades.push(key);
      } else if (hasWeapon) {
        const weapon = player.weapons.find(w => w.type === def.weaponType);
        if (weapon.level < 8) {
          availableUpgrades.push(key + '_upgrade');
        }
      }
    } else {
      // Always allow stat upgrades
      availableUpgrades.push(key);
    }
  }
  
  // Select 3 random upgrades
  const numChoices = Math.min(3, availableUpgrades.length);
  for (let i = 0; i < numChoices; i++) {
    if (availableUpgrades.length === 0) break;
    const idx = Math.floor(Math.random() * availableUpgrades.length);
    choices.push(availableUpgrades[idx]);
    availableUpgrades.splice(idx, 1);
  }
  
  return choices;
}

export function applyUpgrade(player, upgradeKey) {
  const isUpgrade = upgradeKey.includes('_upgrade');
  const baseKey = isUpgrade ? upgradeKey.replace('_upgrade', '') : upgradeKey;
  const def = UPGRADE_DEFINITIONS[baseKey];
  
  if (!def) return;
  
  if (def.isWeapon) {
    if (isUpgrade) {
      // Upgrade existing weapon
      const weapon = player.weapons.find(w => w.type === def.weaponType);
      if (weapon) {
        weapon.upgrade();
      }
    } else {
      // Add new weapon
      const weapon = new Weapon(def.weaponType);
      player.weapons.push(weapon);
    }
  } else {
    // Apply stat upgrade
    if (def.apply) {
      def.apply(player);
    }
  }
}

export function getUpgradeDisplayInfo(upgradeKey) {
  const isUpgrade = upgradeKey.includes('_upgrade');
  const baseKey = isUpgrade ? upgradeKey.replace('_upgrade', '') : upgradeKey;
  const def = UPGRADE_DEFINITIONS[baseKey];
  
  if (!def) return { name: 'Unknown', description: '' };
  
  if (isUpgrade) {
    return {
      name: def.name + ' (Upgrade)',
      description: 'Enhance ' + def.name
    };
  }
  
  return {
    name: def.name,
    description: def.description
  };
}