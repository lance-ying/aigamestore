// upgrades.js - Upgrade system

import { UPGRADE_TYPES, gameState } from './globals.js';

export const UPGRADES = [
  {
    type: UPGRADE_TYPES.INCREASE_ATK,
    name: "+25% Attack",
    description: "Increase damage by 25%",
    icon: "⚔️",
    apply: (player) => {
      player.atk = Math.floor(player.atk * 1.25);
    }
  },
  {
    type: UPGRADE_TYPES.INCREASE_HP,
    name: "Heal 30 HP",
    description: "Restore 30 health",
    icon: "❤️",
    apply: (player) => {
      player.hp = Math.min(player.maxHp, player.hp + 30);
    }
  },
  {
    type: UPGRADE_TYPES.INCREASE_SPEED,
    name: "+Attack Speed",
    description: "Attack 20% faster",
    icon: "⚡",
    apply: (player) => {
      player.asp = Math.max(10, Math.floor(player.asp * 0.8));
    }
  },
  {
    type: UPGRADE_TYPES.MULTI_SHOT,
    name: "Multi-Shot",
    description: "Fire +1 extra projectile",
    icon: "🎯",
    apply: (player) => {
      player.multiShotCount++;
    }
  },
  {
    type: UPGRADE_TYPES.PIERCING,
    name: "Piercing Shots",
    description: "Projectiles pierce enemies",
    icon: "🔱",
    apply: (player) => {
      player.hasPiercing = true;
    }
  },
  {
    type: UPGRADE_TYPES.FAST_PROJECTILES,
    name: "Fast Projectiles",
    description: "Projectiles move 50% faster",
    icon: "💨",
    apply: (player) => {
      player.projectileSpeed *= 1.5;
    }
  },
  {
    type: UPGRADE_TYPES.INCREASE_MAX_HP,
    name: "+Max HP",
    description: "Increase max HP by 25",
    icon: "💪",
    apply: (player) => {
      player.maxHp += 25;
      player.hp = player.maxHp;
    }
  },
  {
    type: UPGRADE_TYPES.HEAL,
    name: "Full Heal",
    description: "Restore all health",
    icon: "✨",
    apply: (player) => {
      player.hp = player.maxHp;
    }
  }
];

export function generateUpgradeChoices() {
  const choices = [];
  const availableUpgrades = [...UPGRADES];
  
  for (let i = 0; i < 3 && availableUpgrades.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
    choices.push(availableUpgrades[randomIndex]);
    availableUpgrades.splice(randomIndex, 1);
  }
  
  return choices;
}

export function applyUpgrade(upgrade, player) {
  upgrade.apply(player);
  gameState.upgrades.push(upgrade.type);
}