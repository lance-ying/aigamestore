// upgrades.js - Upgrade system
import { UPGRADE_TYPES } from './globals.js';
import { playerStats } from './globals.js';

export const upgradeDefinitions = [
  {
    id: 'fire_rate_1',
    type: UPGRADE_TYPES.FIRE_RATE,
    name: 'Rapid Fire',
    description: 'Increases fire rate by 20%',
    apply: () => { playerStats.fireRate = Math.max(3, Math.floor(playerStats.fireRate * 0.8)); }
  },
  {
    id: 'damage_1',
    type: UPGRADE_TYPES.DAMAGE,
    name: 'Power Shot',
    description: 'Increases damage by 30%',
    apply: () => { playerStats.damage = Math.floor(playerStats.damage * 1.3); }
  },
  {
    id: 'bullet_speed_1',
    type: UPGRADE_TYPES.BULLET_SPEED,
    name: 'Velocity Boost',
    description: 'Increases bullet speed by 25%',
    apply: () => { playerStats.bulletSpeed *= 1.25; }
  },
  {
    id: 'move_speed_1',
    type: UPGRADE_TYPES.MOVE_SPEED,
    name: 'Swift Steps',
    description: 'Increases movement speed by 20%',
    apply: () => { playerStats.moveSpeed *= 1.2; }
  },
  {
    id: 'max_health_1',
    type: UPGRADE_TYPES.MAX_HEALTH,
    name: 'Vitality',
    description: 'Increases max health by 30',
    apply: () => { 
      playerStats.maxHealth += 30;
    }
  },
  {
    id: 'health_regen_1',
    type: UPGRADE_TYPES.HEALTH_REGEN,
    name: 'Regeneration',
    description: 'Slowly regenerate health over time',
    apply: () => { playerStats.healthRegen += 0.5; }
  },
  {
    id: 'pierce_1',
    type: UPGRADE_TYPES.PIERCE,
    name: 'Piercing Rounds',
    description: 'Bullets pierce through 1 enemy',
    apply: () => { playerStats.pierce += 1; }
  },
  {
    id: 'multishot_1',
    type: UPGRADE_TYPES.MULTISHOT,
    name: 'Double Shot',
    description: 'Fire an additional bullet',
    apply: () => { playerStats.multishot += 1; }
  },
  {
    id: 'area_damage_1',
    type: UPGRADE_TYPES.AREA_DAMAGE,
    name: 'Explosive Rounds',
    description: 'Bullets explode on impact',
    apply: () => { playerStats.areaDamage += 40; } // Increased from 20 to 40 for better effect
  },
  {
    id: 'lightning_1',
    type: UPGRADE_TYPES.LIGHTNING,
    name: 'Chain Lightning',
    description: 'Periodically strike enemies with lightning',
    apply: () => { playerStats.hasLightning = true; }
  },
  {
    id: 'shield_1',
    type: UPGRADE_TYPES.SHIELD,
    name: 'Energy Shield',
    description: 'Gain a shield that absorbs 50 damage',
    apply: () => { 
      playerStats.hasShield = true;
      playerStats.shieldHealth += 50;
    }
  },
  {
    id: 'fire_rate_2',
    type: UPGRADE_TYPES.FIRE_RATE,
    name: 'Machine Gun',
    description: 'Further increases fire rate',
    apply: () => { playerStats.fireRate = Math.max(3, Math.floor(playerStats.fireRate * 0.8)); }
  },
  {
    id: 'damage_2',
    type: UPGRADE_TYPES.DAMAGE,
    name: 'Heavy Caliber',
    description: 'Greatly increases damage',
    apply: () => { playerStats.damage = Math.floor(playerStats.damage * 1.4); }
  },
  {
    id: 'pierce_2',
    type: UPGRADE_TYPES.PIERCE,
    name: 'Armor Penetration',
    description: 'Bullets pierce through 2 more enemies',
    apply: () => { playerStats.pierce += 2; }
  },
  {
    id: 'multishot_2',
    type: UPGRADE_TYPES.MULTISHOT,
    name: 'Triple Shot',
    description: 'Fire another additional bullet',
    apply: () => { playerStats.multishot += 1; }
  },
  {
    id: 'area_damage_2',
    type: UPGRADE_TYPES.AREA_DAMAGE,
    name: 'Bigger Boom',
    description: 'Increases explosion radius',
    apply: () => { playerStats.areaDamage += 50; } // Increased from 30 to 50
  }
];

export function getRandomUpgrades(count = 3) {
  const shuffled = [...upgradeDefinitions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, upgradeDefinitions.length));
}

export function applyUpgrade(upgrade) {
  upgrade.apply();
}