// upgrades.js - Upgrade system
import { gameState } from './globals.js';

export const UPGRADE_TYPES = {
  DAMAGE: { name: 'Damage', icon: '⚔', desc: '+5 Damage' },
  ATTACK_SPEED: { name: 'Attack Speed', icon: '⚡', desc: '+20% Fire Rate' },
  MAX_HP: { name: 'Max Health', icon: '❤', desc: '+20 Max HP' },
  MOVE_SPEED: { name: 'Move Speed', icon: '👟', desc: '+0.5 Speed' },
  RANGE: { name: 'Range', icon: '🎯', desc: '+30 Range' },
  HEAL: { name: 'Heal', icon: '✚', desc: 'Restore 30 HP' }
};

export function generateUpgradeOptions(p) {
  const types = Object.keys(UPGRADE_TYPES);
  const options = [];
  const used = new Set();
  
  // Generate 3 unique random upgrades
  while (options.length < 3) {
    const typeKey = types[Math.floor(p.random(types.length))];
    if (!used.has(typeKey)) {
      options.push(typeKey);
      used.add(typeKey);
    }
  }
  
  return options;
}

export function applyUpgrade(upgradeType) {
  const player = gameState.player;
  
  switch (upgradeType) {
    case 'DAMAGE':
      player.damageStat += 5;
      break;
    case 'ATTACK_SPEED':
      player.attackSpeedStat *= 1.2;
      break;
    case 'MAX_HP':
      player.maxHP += 20;
      player.currentHP = Math.min(player.currentHP + 20, player.maxHP);
      break;
    case 'MOVE_SPEED':
      player.movementSpeedStat += 0.5;
      break;
    case 'RANGE':
      player.rangeStat += 30;
      break;
    case 'HEAL':
      player.currentHP = Math.min(player.currentHP + 30, player.maxHP);
      break;
  }
}

export const SHOP_ITEMS = [
  { name: 'Max HP +10', cost: 10, apply: (player) => { player.maxHP += 10; player.currentHP += 10; } },
  { name: 'Damage +3', cost: 8, apply: (player) => { player.damageStat += 3; } },
  { name: 'Speed +0.3', cost: 6, apply: (player) => { player.movementSpeedStat += 0.3; } },
  { name: 'Range +20', cost: 7, apply: (player) => { player.rangeStat += 20; } },
  { name: 'Attack Speed +10%', cost: 9, apply: (player) => { player.attackSpeedStat *= 1.1; } }
];

export function generateShopItems(p) {
  const items = [];
  const used = new Set();
  
  while (items.length < 3) {
    const idx = Math.floor(p.random(SHOP_ITEMS.length));
    if (!used.has(idx)) {
      items.push(SHOP_ITEMS[idx]);
      used.add(idx);
    }
  }
  
  return items;
}