// abilities.js

export const ABILITIES = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: '+20% damage',
    effect: (player) => {
      player.damage *= 1.2;
    }
  },
  {
    id: 'speed_boost',
    name: 'Swift Feet',
    description: '+15% movement speed',
    effect: (player) => {
      player.speed *= 1.15;
    }
  },
  {
    id: 'health_boost',
    name: 'Vitality',
    description: '+30 max health',
    effect: (player) => {
      player.maxHealth += 30;
      player.health += 30;
    }
  },
  {
    id: 'attack_speed',
    name: 'Rapid Fire',
    description: '+25% attack speed',
    effect: (player) => {
      player.maxAttackCooldown *= 0.75;
    }
  },
  {
    id: 'range',
    name: 'Long Reach',
    description: '+20 attack range',
    effect: (player) => {
      player.attackRange += 20;
    }
  },
  {
    id: 'vampirism',
    name: 'Vampirism',
    description: 'Heal on kill',
    effect: (player) => {
      player.vampirism = (player.vampirism || 0) + 5;
    }
  },
  {
    id: 'armor',
    name: 'Iron Skin',
    description: 'Reduce damage taken',
    effect: (player) => {
      player.armor = (player.armor || 0) + 2;
    }
  },
  {
    id: 'critical',
    name: 'Critical Strike',
    description: 'Chance for double damage',
    effect: (player) => {
      player.critChance = (player.critChance || 0) + 0.15;
    }
  }
];

export const ITEMS = [
  {
    id: 'sword',
    name: 'Iron Sword',
    description: '+5 damage',
    rarity: 'common',
    color: [180, 180, 180],
    stats: { damage: 5 }
  },
  {
    id: 'boots',
    name: 'Leather Boots',
    description: '+0.3 speed',
    rarity: 'common',
    color: [139, 69, 19],
    stats: { speed: 0.3 }
  },
  {
    id: 'ring',
    name: 'Gold Ring',
    description: '+10 max health',
    rarity: 'common',
    color: [255, 215, 0],
    stats: { maxHealth: 10 }
  },
  {
    id: 'amulet',
    name: 'Ruby Amulet',
    description: '+8 damage',
    rarity: 'rare',
    color: [220, 20, 60],
    stats: { damage: 8 }
  },
  {
    id: 'shield',
    name: 'Steel Shield',
    description: '+20 max health',
    rarity: 'rare',
    color: [192, 192, 192],
    stats: { maxHealth: 20 }
  },
  {
    id: 'crown',
    name: 'Ancient Crown',
    description: '+15 damage, +1 speed',
    rarity: 'legendary',
    color: [255, 215, 0],
    stats: { damage: 15, speed: 1 }
  }
];

export function getRandomAbilities(count = 3) {
  const shuffled = [...ABILITIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomItem() {
  const rand = Math.random();
  let pool = ITEMS.filter(i => i.rarity === 'common');
  
  if (rand < 0.15) {
    pool = ITEMS.filter(i => i.rarity === 'legendary');
  } else if (rand < 0.35) {
    pool = ITEMS.filter(i => i.rarity === 'rare');
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

export function applyAbility(player, ability) {
  ability.effect(player);
}

export function applyItem(player, item) {
  if (item.stats.damage) player.damage += item.stats.damage;
  if (item.stats.speed) player.speed += item.stats.speed;
  if (item.stats.maxHealth) {
    player.maxHealth += item.stats.maxHealth;
    player.health += item.stats.maxHealth;
  }
}