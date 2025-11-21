import { gameState } from './globals.js';

export const UPGRADE_POOL = [
  {
    id: 'health',
    name: 'Max Health +20',
    description: 'Increases maximum health',
    type: 'passive',
    apply: (player) => {
      player.maxHealthBonus += 20;
      player.health = Math.min(player.health + 20, player.maxHealth + player.maxHealthBonus);
    }
  },
  {
    id: 'damage',
    name: 'Damage +25%',
    description: 'Increases attack damage',
    type: 'passive',
    apply: (player) => {
      player.damageMultiplier += 0.25;
    }
  },
  {
    id: 'speed',
    name: 'Move Speed +15%',
    description: 'Move faster',
    type: 'passive',
    apply: (player) => {
      player.speedMultiplier += 0.15;
    }
  },
  {
    id: 'attackSpeed',
    name: 'Attack Speed +30%',
    description: 'Attack more frequently',
    type: 'passive',
    apply: (player) => {
      player.attackSpeedMultiplier += 0.3;
    }
  },
  {
    id: 'range',
    name: 'Attack Range +20%',
    description: 'Hit enemies from farther away',
    type: 'passive',
    apply: (player) => {
      player.attackRange *= 1.2;
    }
  },
  {
    id: 'pickupRange',
    name: 'Pickup Range +40%',
    description: 'Collect orbs from farther away',
    type: 'passive',
    apply: (player) => {
      player.pickupRange *= 1.4;
    }
  },
  {
    id: 'multishot',
    name: 'Extra Projectile',
    description: 'Fire one additional projectile',
    type: 'passive',
    apply: (player) => {
      player.projectileCount += 1;
    }
  },
  {
    id: 'piercing',
    name: 'Piercing Shots',
    description: 'Projectiles pass through enemies',
    type: 'passive',
    apply: (player) => {
      player.piercing = true;
    }
  },
  {
    id: 'crit',
    name: 'Critical Hit +15%',
    description: 'Chance to deal double damage',
    type: 'passive',
    apply: (player) => {
      player.critChance += 0.15;
    }
  },
  {
    id: 'heal',
    name: 'Heal 50 HP',
    description: 'Restore health immediately',
    type: 'active',
    apply: (player) => {
      player.health = Math.min(player.health + 50, player.maxHealth + player.maxHealthBonus);
    }
  },
  {
    id: 'projectileSpeed',
    name: 'Projectile Speed +25%',
    description: 'Faster projectiles',
    type: 'passive',
    apply: (player) => {
      player.projectileSpeed *= 1.25;
    }
  },
  {
    id: 'dashCooldown',
    name: 'Dash Cooldown -20%',
    description: 'Dash more frequently',
    type: 'passive',
    apply: (player) => {
      player.dashCooldownMax *= 0.8;
    }
  }
];

export function generateUpgradeChoices(count = 3) {
  const choices = [];
  const available = [...UPGRADE_POOL];
  
  for (let i = 0; i < Math.min(count, available.length); i++) {
    const index = Math.floor(Math.random() * available.length);
    choices.push(available[index]);
    available.splice(index, 1);
  }
  
  return choices;
}

export function selectUpgrade(index) {
  if (index < 0 || index >= gameState.upgradeChoices.length) return;
  
  const upgrade = gameState.upgradeChoices[index];
  upgrade.apply(gameState.player);
  
  gameState.pendingLevelUp = false;
  gameState.upgradeChoices = [];
}