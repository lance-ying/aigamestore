// upgrades.js - Upgrade system

import { randomChoice } from './utils.js';

export const UPGRADE_POOL = [
  // Health upgrades
  { name: 'Vitality Boost', type: 'health', value: 20, description: 'Increase max health by 20' },
  { name: 'Health Surge', type: 'health', value: 35, description: 'Increase max health by 35' },
  { name: 'Regeneration', type: 'health', value: 50, description: 'Increase max health by 50' },
  
  // Damage upgrades
  { name: 'Power Shot', type: 'damage', value: 5, description: 'Increase projectile damage by 5' },
  { name: 'Heavy Rounds', type: 'damage', value: 8, description: 'Increase projectile damage by 8' },
  { name: 'Devastation', type: 'damage', value: 12, description: 'Increase projectile damage by 12' },
  
  // Fire rate upgrades
  { name: 'Quick Trigger', type: 'fireRate', value: 3, description: 'Shoot 20% faster' },
  { name: 'Rapid Fire', type: 'fireRate', value: 5, description: 'Shoot 35% faster' },
  { name: 'Bullet Storm', type: 'fireRate', value: 7, description: 'Shoot 50% faster' },
  
  // Movement upgrades
  { name: 'Swift Feet', type: 'moveSpeed', value: 0.8, description: 'Increase movement speed' },
  { name: 'Agility', type: 'moveSpeed', value: 1.2, description: 'Greatly increase movement speed' },
  
  // Projectile speed
  { name: 'Velocity Boost', type: 'projectileSpeed', value: 2, description: 'Faster projectiles' },
  { name: 'Hypersonic', type: 'projectileSpeed', value: 3, description: 'Much faster projectiles' },
  
  // Shield upgrades
  { name: 'Extended Shield', type: 'shieldDuration', value: 30, description: 'Shield lasts longer' },
  { name: 'Fortified Defense', type: 'shieldDuration', value: 45, description: 'Shield lasts much longer' },
  
  // Dash upgrades
  { name: 'Quick Recovery', type: 'dashCooldown', value: 30, description: 'Dash recharges faster' },
  { name: 'Lightning Dash', type: 'dashCooldown', value: 50, description: 'Dash recharges much faster' }
];

export function generateUpgradeOptions(count = 3) {
  const options = [];
  const pool = [...UPGRADE_POOL];
  
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    options.push(pool[index]);
    pool.splice(index, 1);
  }
  
  return options;
}

export function renderUpgradeScreen(p, options, selectedIndex) {
  p.push();
  
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text('CHOOSE YOUR UPGRADE', 300, 60);
  
  // Instructions
  p.fill(200);
  p.textSize(14);
  p.text('Use UP/DOWN arrows to select, SPACE to confirm', 300, 95);
  
  // Upgrade options
  const startY = 140;
  const spacing = 90;
  
  for (let i = 0; i < options.length; i++) {
    const upgrade = options[i];
    const y = startY + i * spacing;
    const isSelected = i === selectedIndex;
    
    // Background box
    p.fill(...(isSelected ? [80, 150, 255, 100] : [50, 50, 50, 150]));
    p.stroke(...(isSelected ? [80, 150, 255] : [100, 100, 100]));
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(100, y - 30, 400, 70, 5);
    
    // Upgrade name
    p.noStroke();
    p.fill(...(isSelected ? [255, 255, 255] : [200, 200, 200]));
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text(upgrade.name, 120, y - 20);
    
    // Description
    p.fill(...(isSelected ? [220, 220, 220] : [180, 180, 180]));
    p.textSize(14);
    p.text(upgrade.description, 120, y + 5);
  }
  
  p.pop();
}