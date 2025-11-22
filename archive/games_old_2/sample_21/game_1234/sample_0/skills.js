// skills.js - Skill system

import { gameState } from './globals.js';

export const SKILLS = [
  {
    id: 'front_arrow',
    name: 'Front Arrow +1',
    description: 'Fire an additional projectile',
    apply: (player) => {
      player.projectileCount++;
    }
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    description: 'Projectiles bounce off walls once',
    apply: (player) => {
      player.ricochetCount++;
    }
  },
  {
    id: 'pierce',
    name: 'Pierce',
    description: 'Projectiles pass through one enemy',
    apply: (player) => {
      player.pierceCount++;
    }
  },
  {
    id: 'attack_speed',
    name: 'Attack Speed +15%',
    description: 'Shoot faster',
    apply: (player) => {
      player.attackSpeed = Math.max(10, player.attackSpeed * 0.85);
    }
  },
  {
    id: 'damage',
    name: 'Damage +20%',
    description: 'Deal more damage',
    apply: (player) => {
      player.damage = Math.floor(player.damage * 1.2);
    }
  },
  {
    id: 'max_hp',
    name: 'Max HP +20',
    description: 'Increase maximum health',
    apply: (player) => {
      player.maxHP += 20;
      player.hp = Math.min(player.hp + 20, player.maxHP);
    }
  },
  {
    id: 'speed',
    name: 'Speed +15%',
    description: 'Move faster',
    apply: (player) => {
      player.speed *= 1.15;
    }
  },
  {
    id: 'projectile_speed',
    name: 'Projectile Speed +20%',
    description: 'Projectiles travel faster',
    apply: (player) => {
      player.projectileSpeed *= 1.2;
    }
  }
];

export function generateSkillOptions(p) {
  const options = [];
  const availableSkills = [...SKILLS];
  
  // Randomly select 3 skills
  for (let i = 0; i < 3 && availableSkills.length > 0; i++) {
    const index = Math.floor(p.random() * availableSkills.length);
    options.push(availableSkills[index]);
    availableSkills.splice(index, 1);
  }
  
  return options;
}

export function applySkill(skillId, player) {
  const skill = SKILLS.find(s => s.id === skillId);
  if (skill) {
    skill.apply(player);
    gameState.currentSkills.push(skillId);
  }
}